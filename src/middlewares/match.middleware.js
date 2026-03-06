const matchModel = require("../models/match.model.js")
const jdoodleService = require("../services/jdoodle.service.js")


/**
 * Middleware: Validate submission request
 * 
 * Validates code + language, finds match, verifies player is a participant.
 * Attaches match, problem, and playerIndex to req for use in controllers.
 * 
 * Does NOT check match status — each controller decides that.
 */
async function validateSubmission(req, res, next) {
    try {
        const { roomCode } = req.params
        const { code, language } = req.body

        // Validate code and language
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

        // Find match with problem populated
        const match = await matchModel.findOne({ roomCode }).populate("problemId")

        if (!match) {
            return res.status(404).json({ message: "Match not found" })
        }

        // Verify player is in the match
        const playerIndex = match.players.findIndex(
            p => p.userId.toString() === req.user._id.toString()
        )

        if (playerIndex === -1) {
            return res.status(403).json({ message: "You are not a participant of this match" })
        }

        // Attach to req for controllers
        req.match = match
        req.problem = match.problemId
        req.playerIndex = playerIndex

        next()

    } catch (error) {
        console.error("Validation Middleware Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    validateSubmission
}
