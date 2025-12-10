const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/pg_connector.js"); // your PostgreSQL pool instance

const router = express.Router();

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

// REGISTER (Signup) - Updated with fullName, age, gender
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, confirmPassword, fullName, age, gender } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table with new fields
        const userResult = await db.query(
            `INSERT INTO users (username, email, password_hash, full_name, age, gender)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, username, email, full_name, age, gender, created_at`,
            [username, email, hashedPassword, fullName || null, age || null, gender || null]
        );

        const newUser = userResult.rows[0];

        // Create default medical history row for user
        await db.query(
            `INSERT INTO user_medical_history (user_id, age, known_allergies, major_illnesses_faced, chronic_diseases, is_skipped)
             VALUES ($1, $2, NULL, NULL, NULL, FALSE)`,
            [newUser.user_id, age || null]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: newUser.user_id, 
                username: newUser.username,
                email: newUser.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({ 
            message: "Account created successfully", 
            token: token,
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                age: newUser.age,
                gender: newUser.gender
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        
        if (error.code === "23505") { // Unique constraint violation
            if (error.constraint && error.constraint.includes("username")) {
                return res.status(409).json({ error: "Username already exists" });
            } else if (error.constraint && error.constraint.includes("email")) {
                return res.status(409).json({ error: "Email already exists" });
            }
            return res.status(409).json({ error: "Username or email already exists" });
        }
        
        return res.status(500).json({ error: "Server error. Please try again." });
    }
});

// LOGIN (Signin) - Updated to return full user details
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        // Get user with all fields including new ones
        const userResult = await db.query(
            `SELECT user_id, username, email, password_hash, full_name, age, gender 
             FROM users 
             WHERE username = $1`,
            [username]
        );

        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                username: user.username,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Check if medical history exists
        const historyResult = await db.query(
            `SELECT history_id, is_skipped 
             FROM user_medical_history 
             WHERE user_id = $1`,
            [user.user_id]
        );

        const hasMedicalHistory = historyResult.rowCount > 0 && !historyResult.rows[0].is_skipped;

        return res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                age: user.age,
                gender: user.gender
            },
            has_medical_history: hasMedicalHistory,
            redirect_to: hasMedicalHistory ? "home" : "medical-history"
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
});

// Get current user profile (Protected route)
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const userResult = await db.query(
            `SELECT user_id, username, email, full_name, age, gender, created_at 
             FROM users 
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ user: userResult.rows[0] });

    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
