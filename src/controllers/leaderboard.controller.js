const userModel = require("../models/user.model.js")


async function getLeaderboard(req, res) {
    try {

        const Leaderboard = await userModel.find().sort({ eloRating: -1 }).limit(50).select('username eloRating wins losses totalMatches')

        return res.status(200).json({
            message: "Leaderboard Fetched Successfully",
            leaderboard: Leaderboard
        })

    } catch (error) {
        console.error("Leaderboard Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

module.exports = {
    getLeaderboard
}