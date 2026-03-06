const userModel = require("../models/user.model.js")
const jdoodleService = require("../services/jdoodle.service.js")


const K_FACTOR = 32

/**
 * ELO Rating Calculator
 */
function calculateElo(winnerRating, loserRating) {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400))

    const newWinnerRating = Math.round(winnerRating + K_FACTOR * (1 - expectedWinner))
    const newLoserRating = Math.round(loserRating + K_FACTOR * (0 - expectedLoser))

    return { newWinnerRating, newLoserRating }
}


/**
 * POST /api/match/submit-code/:roomCode
 * 
 * Runs code against HIDDEN test cases.
 * - First player to pass all tests = winner (ELO updated)
 * - Second player can STILL submit to check if their code was correct
 * - Match only goes to "completed" when BOTH players have submitted
 */
async function submitCode(req, res) {
    try {
        const { code, language } = req.body
        const { match, problem, playerIndex } = req
        const roomCode = req.params.roomCode

        // Only allow when match is in-progress
        if (match.status !== "in-progress") {
            return res.status(400).json({
                message: "Match is not in progress."
            })
        }

        const hiddenTestCases = problem.hiddenTestCases

        // Save player's code
        match.players[playerIndex].code = code
        match.players[playerIndex].status = "submitted"

        // Run all test cases in ONE API call
        const { allPassed, results, passedCount, error } = await jdoodleService.runAllTestCases(
            code, language, hiddenTestCases
        )

        if (error) {
            // Don't mark as "submitted" if there was a compilation error — let them retry
            match.players[playerIndex].status = "coding"
            await match.save()
            return res.status(200).json({
                message: "Compilation or Runtime Error",
                allPassed: false,
                error,
                totalTestCases: hiddenTestCases.length,
                passedCount: 0
            })
        }

        // --- If all passed and no winner yet, this player wins ---
        if (allPassed && !match.winnerId) {
            match.winnerId = req.user._id
            match.players[playerIndex].isWinner = true

            // Calculate ELO ratings
            const winner = await userModel.findById(req.user._id)
            const otherPlayer = match.players.find(
                p => p.userId.toString() !== req.user._id.toString()
            )
            const loser = otherPlayer ? await userModel.findById(otherPlayer.userId) : null

            if (winner && loser) {
                const { newWinnerRating, newLoserRating } = calculateElo(winner.eloRating, loser.eloRating)

                await userModel.findByIdAndUpdate(winner._id, {
                    $inc: { totalMatches: 1, wins: 1 },
                    $set: { eloRating: newWinnerRating }
                })

                await userModel.findByIdAndUpdate(loser._id, {
                    $inc: { totalMatches: 1, losses: 1 },
                    $set: { eloRating: newLoserRating }
                })

                match._eloChange = {
                    winner: { username: winner.username, oldRating: winner.eloRating, newRating: newWinnerRating, change: newWinnerRating - winner.eloRating },
                    loser: { username: loser.username, oldRating: loser.eloRating, newRating: newLoserRating, change: newLoserRating - loser.eloRating }
                }
            }

            // Notify opponent via Socket.io
            const io = req.app.get('io')
            if (io) {
                io.to(roomCode).emit("match-over", {
                    winner: req.user.username,
                    eloChange: match._eloChange || null,
                    message: `${req.user.username} won the match!`
                })
            }
        }

        // --- Check if both players have submitted → mark match completed ---
        const bothSubmitted = match.players.every(p => p.status === "submitted")
        if (bothSubmitted) {
            match.status = "completed"
            match.endTime = new Date()
        }

        await match.save()

        // Build response message
        let message
        if (allPassed && match.winnerId?.toString() === req.user._id.toString()) {
            message = "🎉 All test cases passed! You win!"
        } else if (allPassed && match.winnerId) {
            message = "✅ All test cases passed! But your opponent solved it first."
        } else {
            message = "Some test cases failed. Try again!"
        }

        return res.status(200).json({
            message,
            allPassed,
            totalTestCases: hiddenTestCases.length,
            passedCount,
            results,
            matchStatus: match.status,
            ...(match._eloChange ? { eloChange: match._eloChange } : {})
        })

    } catch (error) {
        console.error("Submit Code Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


/**
 * POST /api/match/run-sample/:roomCode
 * Runs code against SAMPLE test cases. Works anytime — doesn't affect match.
 */
async function runSampleTestCases(req, res) {
    try {
        const { code, language } = req.body
        const { problem } = req

        const sampleTestCases = problem.sampleTestCases

        if (!sampleTestCases || sampleTestCases.length === 0) {
            return res.status(400).json({ message: "No sample test cases for this problem" })
        }

        const { allPassed, results, passedCount, error } = await jdoodleService.runAllTestCases(
            code, language, sampleTestCases
        )

        if (error) {
            return res.status(200).json({
                message: "Compilation or Runtime Error",
                allPassed: false,
                error,
                totalTestCases: sampleTestCases.length,
                passedCount: 0
            })
        }

        return res.status(200).json({
            message: allPassed
                ? "✅ All sample test cases passed!"
                : "Some sample test cases failed.",
            allPassed,
            totalTestCases: sampleTestCases.length,
            passedCount,
            results
        })

    } catch (error) {
        console.error("Run Sample Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    submitCode,
    runSampleTestCases
}
