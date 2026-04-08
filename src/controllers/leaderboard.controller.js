const userModel = require("../models/user.model.js")

/**
 * GET /api/leaderboard
 * 
 * Fetches paginated leaderboard data.
 * Query params: page (default 1), limit (default 20)
 */
async function getLeaderboard(req, res) {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const skip = (page - 1) * limit

        const totalUsers = await userModel.countDocuments()
        const totalPages = Math.ceil(totalUsers / limit)

        // Fetch users sorted by ELO
        const players = await userModel.find()
            .sort({ eloRating: -1 })
            .skip(skip)
            .limit(limit)
            .select('username eloRating wins losses totalMatches totalWins')

        // Map data to include rank (relative to page)
        const leaderboard = players.map((p, index) => ({
            rank: skip + index + 1,
            username: p.username,
            eloRating: p.eloRating,
            winRate: p.totalMatches > 0 ? ((p.totalWins || p.wins || 0) / p.totalMatches * 100).toFixed(1) : "0.0",
            totalMatches: p.totalMatches
        }))

        // Optional: If user is authenticated, find their personal rank for stats cards
        let userStats = null
        if (req.user) {
            const currentUser = await userModel.findById(req.user._id)
            if (currentUser) {
                // Simplified rank finding: count users with higher ELO
                const rank = await userModel.countDocuments({ eloRating: { $gt: currentUser.eloRating } }) + 1
                userStats = {
                    rank: rank,
                    eloRating: currentUser.eloRating
                }
            }
        }

        return res.status(200).json({
            message: "Leaderboard Fetched Successfully",
            leaderboard,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                limit
            },
            userStats
        })

    } catch (error) {
        console.error("Leaderboard Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

module.exports = {
    getLeaderboard
}