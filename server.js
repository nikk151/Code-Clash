require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./src/app')
const connectDB = require('./src/db/db.js')
const setupSocket = require('./src/socket')

connectDB()

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

server.listen(3000, () => {
    console.log('server is running on port 3000')
})