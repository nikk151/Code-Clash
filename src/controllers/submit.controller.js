const userModel = require("../models/user.model.js")
const jdoodleService = require("../services/jdoodle.service.js")
const { calculateElo } = require("../utils/elo.js")






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

        // Reject submissions if the match hasn't started or is already over to prevent tampering
        if (match.status !== "in-progress") {
            return res.status(400).json({
                message: "Match is not in progress."
            })
        }

        // Limit to 3 submissions to protect JDoodle API credits and prevent brute-forcing
        if (match.players[playerIndex].submissionCount >= 3) {
            return res.status(400).json({
                message: "Maximum 3 submissions allowed per match",
                submissionsLeft: 0
            })
        }

        // Increment the count BEFORE running code so that even failed compilations/timeouts use a credit
        match.players[playerIndex].submissionCount++

        const hiddenTestCases = problem.hiddenTestCases

        // Temporarily save code to the DB so players can review it later if needed
        match.players[playerIndex].code = code
        match.players[playerIndex].status = "submitted"

        // Execute user's code via JDoodle against all hidden tests in a single API call to save credits
        const { allPassed, results, passedCount, error } = await jdoodleService.runAllTestCases(
            code, language, hiddenTestCases
        )

        if (error) {
            // Revert status to "coding" if there's a compilation error so the user has a chance to fix it (if they have submissions left)
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

        // The condition `!match.winnerId` ensures that ONLY the FIRST player to pass all tests gets the win
        if (allPassed && !match.winnerId) {
            match.winnerId = req.user._id
            match.players[playerIndex].isWinner = true

            // Fetch current ELO ratings for both players to accurately calculate MMR changes based on skill differences
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

        // We wait for BOTH players to explicitly submit (or hit the limit) before officially ending the match
        // This allows the loser to continue debugging to confirm their logic would have eventually worked
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
            submissionsLeft: 3 - match.players[playerIndex].submissionCount,
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
