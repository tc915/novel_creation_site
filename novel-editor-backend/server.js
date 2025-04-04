// server.js (Main Application Entry Point)

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport'); // Required for passport setup execution
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels'); // --- Import novel routes ---

// Load Environment Variables FIRST
dotenv.config();

// Passport Configuration (needs to run to configure passport)
require('./config/passport-setup');

// Connect to Database
connectDB();

// Initialize Express App
const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Passport Middleware
app.use(passport.initialize());
// app.use(passport.session()); // Only if using express-session

// API Routes
app.get('/', (req, res) => {
  res.send('Novel Scribe Backend API Running...');
});

// Mount Authentication Routes
app.use('/api/auth', authRoutes);

// --- Mount Novel Routes ---
app.use('/api/novels', novelRoutes); // All routes in novelRoutes prefixed with /api/novels
// --- End Mount Novel Routes ---

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected server error occurred.',
    });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error(`Server failed to start on port ${PORT}: ${err.message}`);
  process.exit(1);
});