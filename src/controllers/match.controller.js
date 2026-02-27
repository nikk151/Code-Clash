const matchModel = require("../models/match.model.js")
const problemModel = require("../models/problems.model.js")
const crypto = require("crypto")


async function createMatch(req, res){
    try {

        const { difficulty } = req.body

        const filter = difficulty ? { difficulty } : {}

        const problem = await problemModel.find(filter)

        if (problem.length === 0){
            return res.status(404).json({
                message: "No Problem Found"
            })
        }

        const randomProblem = problem[Math.floor(Math.random() * problem.length)]

        const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase()

        const match = await matchModel.create({
            roomCode,
            players : [{
                userId : req.user._id,
                username : req.user.username
            }],
            problemId : randomProblem._id,
            status : "waiting"
        })

        return res.status(201).json({
            message: "Room Created Successfully!  Share this room code with your friend.",
            roomCode,
            problem : {
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


module.exports ={
    createMatch
}