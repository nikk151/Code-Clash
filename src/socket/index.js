/**
 * Socket.io Event Handler
 * 
 * Handles real-time events:
 * - join-room: Player enters a match room
 * - send-message: Chat between opponents
 * - code-submitted: Notify opponent that code was submitted
 * - disconnect: Handle player disconnection
 */

module.exports = function (io) {

    io.on("connection", (socket) => {
        console.log("⚡ User connected:", socket.id)


        /**
         * Player joins a match room
         * Frontend sends: socket.emit("join-room", { roomCode, username })
         */
        socket.on("join-room", ({ roomCode, username }) => {
            socket.join(roomCode)

            // Store info on the socket so we can use it on disconnect
            socket.roomCode = roomCode
            socket.username = username

            // Tell the OTHER player in the room that opponent joined
            socket.to(roomCode).emit("opponent-joined", {
                username,
                message: `${username} has joined the match!`
            })

            console.log(`${username} joined room ${roomCode}`)
        })


        /**
         * Chat message during a match
         * Frontend sends: socket.emit("send-message", { roomCode, message })
         */
        socket.on("send-message", ({ roomCode, message }) => {
            // Send to opponent only (not back to sender)
            socket.to(roomCode).emit("new-message", {
                username: socket.username,
                message,
                timestamp: new Date().toISOString()
            })
        })


        /**
         * Player submitted their code
         * Frontend sends: socket.emit("code-submitted", { roomCode })
         */
        socket.on("code-submitted", ({ roomCode }) => {
            socket.to(roomCode).emit("opponent-submitted", {
                username: socket.username,
                message: `${socket.username} has submitted their code!`
            })
        })


        /**
         * Player disconnected (tab closed, WiFi dropped, etc.)
         * This event fires AUTOMATICALLY — no frontend code needed
         */
        socket.on("disconnect", () => {
            if (socket.roomCode) {
                socket.to(socket.roomCode).emit("opponent-disconnected", {
                    username: socket.username,
                    message: `${socket.username} has disconnected!`
                })
                console.log(`${socket.username} disconnected from room ${socket.roomCode}`)
            }
        })
    })
}
