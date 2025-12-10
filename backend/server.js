const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth_routes');
const chatRoutes = require('./routes/chat_routes');
const historyRoutes = require('./routes/history_routes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Changed from 3000 to 5000 (standard for backend)

// CORS Configuration - Allow frontend to connect
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // React frontend URL
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Healthcare Chatbot API', 
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth/register, /api/auth/login',
            chat: '/api/chat/*',
            history: '/api/history/*',
            health: '/api/health'
        }
    });
});

// Health check endpoint (with database check)
app.get('/api/health', async (req, res) => {
    const db = require('./db/pg_connector');
    
    try {
        // Test database connection
        const result = await db.query('SELECT NOW()');
        
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: result.rows[0].now,
            message: 'Healthcare API is running'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'error',
            database: 'disconnected',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Simple health check (no database)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Healthcare API is running',
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err.stack);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message;
    
    res.status(err.status || 500).json({ 
        error: 'Internal Server Error',
        message: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler - Must be last
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method 
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Healthcare API Server Started`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received. Closing server gracefully...');
    process.exit(0);
});
