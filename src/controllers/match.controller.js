const matchModel = require("../models/match.model.js")
const problemModel = require("../models/problems.model.js")
const crypto = require("crypto")


async function createMatch(req, res) {
    try {

        const { difficulty } = req.body || {}

        const filter = difficulty ? { difficulty } : {}

        const problem = await problemModel.find(filter)

        if (problem.length === 0) {
            return res.status(404).json({
                message: "No Problem Found"
            })
        }

        // Pick a random problem so that users face a different challenge each match
        const randomProblem = problem[Math.floor(Math.random() * problem.length)]

        // Generate a 6-character secure random hex code (e.g., A1B2C3) for easy sharing
        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase()

        const match = await matchModel.create({
            roomCode,
            players: [{
                userId: req.user._id,
                username: req.user.username
            }],
            problemId: randomProblem._id,
            status: "waiting"
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

        const match = await matchModel.findOne({ roomCode })

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

        // Prevent the exact same user from joining their own room twice (e.g. from two tabs)
        const alreadyIn = match.players.some(player => player.userId.toString() === req.user._id.toString())

        if (alreadyIn) {
            return res.status(400).json({
                message: "You are already in this match"
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


module.exports = {
    createMatch,
    joinMatch
}