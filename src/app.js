require('dotenv').config();
require('./config');  // Validate env vars on startup

const express = require('express')
const matchRoutes = require('./routes/match.routes.js')
const authRoutes = require('./routes/auth.routes.js')
const problemRoutes = require('./routes/problems.routes.js')
const profileRoutes = require('./routes/profile.routes.js')
const leaderboardRoutes = require('./routes/leaderboard.js')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')


const app = express()

// CORS — allow frontend to connect
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",  // React dev server URL
    credentials: true                 // allow cookies
}))
app.use(helmet());
// Rate limiting — general (100 requests per 15 min)
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests. Try again later." }
}))
// Stricter limit for code submissions (protects JDoodle credits)
app.use('/api/match/submit-code', rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { message: "Too many submissions. Wait a minute." }
}))


app.use(express.json())
app.use(cookieParser());

// Health check route to keep Render server awake
app.get('/ping', (req, res) => {
    res.status(200).send('Server is awake');
});

// A JSON-based health check for our frontend test
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Backend is communicating!',
        timestamp: new Date()
    });
});

app.use("/api/auth", authRoutes)
app.use("/api/problems", problemRoutes)
app.use("/api/match", matchRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/leaderboard", leaderboardRoutes)


module.exports = app