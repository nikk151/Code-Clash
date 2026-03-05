const matchModel = require("../models/match.model.js")
const userModel = require("../models/user.model.js")
const jdoodleService = require("../services/jdoodle.service.js")


/**
 * POST /api/match/submit-code/:roomCode
 * Body: { code: "...", language: "python3" }
 *
 * Wraps ALL test cases into a single JDoodle call (1 API credit per submission).
 */
async function submitCode(req, res) {
    try {
        const { roomCode } = req.params
        const { code, language } = req.body

        // --- Validation ---
        if (!code || !language) {
            return res.status(400).json({
                message: "Code and language are required"
            })
        }

        if (!jdoodleService.isLanguageSupported(language)) {
            return res.status(400).json({
                message: `Unsupported language. Supported: ${jdoodleService.getSupportedLanguages().join(", ")}`
            })
        }

        // --- Find match ---
        const match = await matchModel.findOne({ roomCode }).populate("problemId")

        if (!match) {
            return res.status(404).json({ message: "Match not found" })
        }

        if (match.status === "completed") {
            return res.status(400).json({ message: "Match is already completed" })
        }

        if (match.status !== "in-progress") {
            return res.status(400).json({
                message: "Match is not in progress yet. Both players need to join first."
            })
        }

        // --- Verify player is in the match ---
        const playerIndex = match.players.findIndex(
            p => p.userId.toString() === req.user._id.toString()
        )

        if (playerIndex === -1) {
            return res.status(403).json({ message: "You are not a participant of this match" })
        }

        // --- Get hidden test cases from the problem ---
        const problem = match.problemId
        const hiddenTestCases = problem.hiddenTestCases

        // --- Save player's code ---
        match.players[playerIndex].code = code
        match.players[playerIndex].status = "submitted"

        // --- Run all test cases in ONE API call ---
        const { allPassed, results, passedCount, error } = await jdoodleService.runAllTestCases(
            code, language, hiddenTestCases
        )

        // Compilation/runtime error
        if (error) {
            await match.save()
            return res.status(200).json({
                message: "Compilation or Runtime Error",
                allPassed: false,
                error,
                totalTestCases: hiddenTestCases.length,
                passedCount: 0
            })
        }

        // --- If all passed, this player wins! ---
        if (allPassed) {
            match.winnerId = req.user._id
            match.status = "completed"
            match.endTime = new Date()
            match.players[playerIndex].isWinner = true

            await userModel.findByIdAndUpdate(req.user._id, {
                $inc: { totalMatches: 1, wins: 1 }
            })

            const otherPlayer = match.players.find(
                p => p.userId.toString() !== req.user._id.toString()
            )
            if (otherPlayer) {
                await userModel.findByIdAndUpdate(otherPlayer.userId, {
                    $inc: { totalMatches: 1, losses: 1 }
                })
            }
        }

        await match.save()

        return res.status(200).json({
            message: allPassed
                ? "🎉 All test cases passed! You win!"
                : "Some test cases failed. Try again!",
            allPassed,
            totalTestCases: hiddenTestCases.length,
            passedCount,
            results
        })

    } catch (error) {
        console.error("Submit Code Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    submitCode
}
