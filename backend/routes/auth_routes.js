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

// REGISTER (Signup)
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, age } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table
        const userResult = await db.query(
            `INSERT INTO users (username, email, password_hash, age)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, username, email, age`,
            [username, email, hashedPassword, age || null]
        );

        const newUser = userResult.rows[0];

        // Create default medical history row for user
        await db.query(
            `INSERT INTO user_medical_history (user_id, known_allergies, major_illnesses_faced, chronic_diseases, is_skipped)
             VALUES ($1, NULL, NULL, NULL, FALSE)`,
            [newUser.user_id]
        );

        return res.status(201).json({ message: "User registered successfully", user: newUser });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "Username or email already exists" });
        }
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// LOGIN (Signin)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password required" });
        }

        const userResult = await db.query(
            `SELECT user_id, username, email, password_hash FROM users WHERE username = $1`,
            [username]
        );

        if (userResult.rowCount === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
