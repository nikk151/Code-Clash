const matchModel = require("../models/match.model.js")
const problemModel = require("../models/problems.model.js")
const crypto = require("crypto")


async function createMatch(req, res) {
    try {

        const { difficulty, problemId, isPractice } = req.body || {}

        let randomProblem;
        if (problemId) {
            randomProblem = await problemModel.findById(problemId);
            if (!randomProblem) {
                return res.status(404).json({ message: "No Problem Found" })
            }
        } else {
            // Use a case-insensitive regex so both "easy" and "Easy" match the database Enum
            const filter = difficulty ? { difficulty: new RegExp(`^${difficulty}$`, 'i') } : {}
            const problem = await problemModel.find(filter)

            if (problem.length === 0) {
                return res.status(404).json({
                    message: "No Problem Found"
                })
            }

            // Pick a random problem so that users face a different challenge each match
            randomProblem = problem[Math.floor(Math.random() * problem.length)]
        }

        // Generate a 6-character secure random hex code (e.g., A1B2C3) for easy sharing
        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase()

        const match = await matchModel.create({
            roomCode,
            players: [{
                userId: req.user._id,
                username: req.user.username
            }],
            problemId: randomProblem._id,
            status: isPractice ? "in-progress" : "waiting",
            startTime: isPractice ? new Date() : null
        })

        return res.status(201).json({
            message: "Room Created Successfully!  Share this room code with your friend.",
            roomCode,
            problem: {
                title: randomProblem.title,
                difficulty: randomProblem.difficulty,
            }
        })




    } catch (error) {
        console.error("Match Creation Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function joinMatch(req, res) {
    try {

        const { roomCode } = req.params

        const match = await matchModel.findOne({ roomCode }).populate('problemId')

        if (!match) {
            return res.status(404).json({
                message: "Room not found!"
            })
        }

        if (match.status !== "waiting") {
            return res.status(400).json({
                message: "Match has already started"
            })
        }

        // Enforce a strict 2-player limit to keep it a 1v1 match
        if (match.players.length >= 2) {
            return res.status(400).json({
                message: "Room is full!"
            })
        }

        // Prevent the exact same user from joining their own room twice (e.g. from two tabs),
        // but allow them to "reconnect" to the match by returning success
        const alreadyIn = match.players.some(player => player.userId.toString() === req.user._id.toString())

        if (alreadyIn) {
            return res.status(200).json({
                message: match.status === "in-progress"
                    ? "Reconnected! Match is in progress."
                    : "Reconnected to waiting room.",
                match
            })
        }

        match.players.push({
            userId: req.user._id,
            username: req.user.username
        })

        // Auto-start the match immediately when the 2nd player joins, ensuring a fast UX without a 'Start' button
        if (match.players.length === 2) {
            match.status = "in-progress"
            match.startTime = new Date()

            // Notify the first player via Socket.io so they can transition to the arena
            const io = req.app.get('io')
            if (io) {
                io.to(roomCode).emit("opponent-joined", {
                    username: req.user.username,
                    message: `${req.user.username} has joined the match!`
                })
            }
        }

        await match.save()

        return res.status(200).json({
            message: match.status === "in-progress"
                ? "Joined! Match is now in progress. Start coding!"
                : "Joined Match Successfully",
            match
        })




    } catch (error) {
        console.error("Match Join Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


async function getMatch(req, res) {
    try {
        const { roomCode } = req.params;
        const match = await matchModel.findOne({ roomCode }).populate('problemId');
        
        if (!match) {
            return res.status(404).json({ message: "Match not found" });
        }
        
        return res.status(200).json({ match });
    } catch (error) {
        console.error("Get Match Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    createMatch,
    joinMatch,
    getMatch
}