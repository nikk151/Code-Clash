const problemModel = require("../models/problems.model")



async function createProblem(req, res){
    try {
        
        const {title, description, difficulty, starterCode, sampleTestCases, hiddenTestCases} = req.body

        if ( !title || !description || !sampleTestCases || !hiddenTestCases || !starterCode){
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const isProblemExist = await problemModel.findOne({title})

        if (isProblemExist){
            return res.status(400).json({
                message: "Problem Already Exist"
            })
        }

        if (!Array.isArray(sampleTestCases) || sampleTestCases.length === 0){
            return res.status(400).json({
                message: "Sample Test Cases are required"
            })
        }

        if (!Array.isArray(hiddenTestCases) || hiddenTestCases.length ===0){
            return res.status(400).json({
                message: "Hidden Test Cases are required"
            })
        }

        const slug = title.toLowerCase().replace(/\s+/g, '-')

        const validTestCases = (tc) => tc.input !== undefined && tc.output !== undefined

        if (!sampleTestCases.every(validTestCases) || !hiddenTestCases.every(validTestCases)){
            return res.status(400).json({
                message: "Invalid Test Cases Every Test Case Must Have Input and Output"
            })
        }

        const problem = await problemModel.create({
            title,
            slug,
            description,
            difficulty,
            starterCode,
            sampleTestCases,
            hiddenTestCases
        })

        return res.status(201).json({
            message: "Problem Created Successfully",
            problem
        })


    } catch (error) {
        console.error("Problem Creation Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


async function getProblem( req , res ){
    try {
        const {slug} = req.params

        const problem = await problemModel.findOne({slug})

        if (!problem){
            return res.status(404).json({
                message: "Problem Not Found"
            })
        }

        return res.status(200).json({
            message: "Problem Fetched Successfully",
            problem : {
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                sampleTestCases: problem.sampleTestCases,
                starterCode: problem.starterCode
            }
        })

    } catch (error) {
        console.error("Problem Fetch Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


module.exports = {
    createProblem,
    getProblem
}