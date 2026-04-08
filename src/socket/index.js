const matchModel = require("../models/match.model.js")
const xss = require('xss')

/**
 * Socket.io Event Handler
 * 
 * Handles real-time events:
 * - join-room: Player enters a match room
 * - send-message: Chat between opponents
 * - code-submitted: Notify opponent that code was submitted
 * - disconnect: Handle player disconnection + auto-delete match when both leave
 */

module.exports = function (io) {

    // Track how many players are connected in each room
    const roomPlayers = {}

    io.on("connection", (socket) => {
        console.log("⚡ User connected:", socket.id)


        /**
         * Player joins a match room
         */
        socket.on("join-room", ({ roomCode, username }) => {
            socket.join(roomCode)
            socket.roomCode = roomCode
            socket.username = username

            // Track players in room
            if (!roomPlayers[roomCode]) roomPlayers[roomCode] = 0
            roomPlayers[roomCode]++

            // NOTE: We rely strictly on the REST API (match.controller.js) to emit "opponent-joined" 
            // once the 2nd player is definitively saved to the database. This prevents ghost starts.

            console.log(`${username} joined room ${roomCode}`)
        })


        /**
         * Chat message during a match
         */
        socket.on("send-message", ({ roomCode, message }) => {
            socket.to(roomCode).emit("new-message", {
                username: socket.username,
                message: xss(message),
                timestamp: new Date().toISOString()
            })
        })


        /**
         * Player manually left the match
         */
        socket.on("leave-room", async ({ roomCode, username }) => {
            socket.to(roomCode).emit("opponent-left", {
                username,
                message: `${username} has left the match!`
            })

            socket.leave(roomCode)
            
            if (roomPlayers[roomCode]) {
                roomPlayers[roomCode]--
                if (roomPlayers[roomCode] <= 0) {
                    try {
                        await matchModel.findOneAndDelete({ roomCode })
                        console.log(`🗑️ Match ${roomCode} deleted (player left, room empty)`)
                    } catch (err) {
                        console.error("Match cleanup error:", err)
                    }
                    delete roomPlayers[roomCode]
                }
            }
            console.log(`${username} left room ${roomCode}`)
        })


        /**
         * Player submitted their code
         */
        socket.on("code-submitted", ({ roomCode }) => {
            socket.to(roomCode).emit("opponent-submitted", {
                username: socket.username,
                message: `${socket.username} has submitted their code!`
            })
        })


        /**
         * Player disconnected (tab closed, WiFi dropped, etc.)
         * When both players leave → delete match from DB to save space
         */
        socket.on("disconnect", async () => {
            if (socket.roomCode) {
                socket.to(socket.roomCode).emit("opponent-disconnected", {
                    username: socket.username,
                    message: `${socket.username} has disconnected!`
                })

                // Decrease player count
                roomPlayers[socket.roomCode]--

                // Both players left → delete match from DB
                if (roomPlayers[socket.roomCode] <= 0) {
                    try {
                        await matchModel.findOneAndDelete({ roomCode: socket.roomCode })
                        console.log(`🗑️ Match ${socket.roomCode} deleted (both players left)`)
                    } catch (err) {
                        console.error("Match cleanup error:", err)
                    }
                    delete roomPlayers[socket.roomCode]
                }

                console.log(`${socket.username} disconnected from ${socket.roomCode}`)
            }
        })
    })
}
