const userModel = require("../models/user.model.js")


async function getStats(req, res){
    try {
        
        const user = req.user

        
        return res.status(200).json({
            message: "Stats Fetched Successfully",
            stats: {
                username: user.username,
                eloRating: user.eloRating,
                totalMatches: user.totalMatches,
                wins: user.wins,
                losses: user.losses,
                solvedProblems: user.solvedProblems
            }
        })

    } catch (error) {
        console.error("Stats fetch error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

module.exports = {
    getStats
}