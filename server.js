require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./src/app')
const connectDB = require('./src/db/db.js')
const setupSocket = require('./src/socket')
const matchModel = require('./src/models/match.model.js')
const PORT = process.env.PORT || 8000;

connectDB().then(async () => {
    // Clean up stale matches from previous server sessions
    const result = await matchModel.deleteMany({ status: { $in: ["waiting", "in-progress"] } })
    if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} stale match(es)`)
    }
})

// Create HTTP server and attach Socket.io
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow frontend to connect (update this in production)
        methods: ["GET", "POST"]
    }
})

// Setup socket event handlers
setupSocket(io)

// Make io accessible in controllers (for emitting from REST routes)
app.set('io', io)

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})