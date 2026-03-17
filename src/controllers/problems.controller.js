const problemModel = require("../models/problems.model")
const xss = require('xss')



async function createProblem(req, res) {
    try {

        const { title, description, difficulty, starterCode, sampleTestCases, hiddenTestCases } = req.body

        // Ensure all critical fields are present before proceeding with creation
        if (!title || !description || !sampleTestCases || !hiddenTestCases || !starterCode) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        // Check if problem already exists to prevent duplicate entries in the database
        const isProblemExist = await problemModel.findOne({ title })

        if (isProblemExist) {
            return res.status(400).json({
                message: "Problem Already Exist"
            })
        }

        if (!Array.isArray(sampleTestCases) || sampleTestCases.length === 0) {
            return res.status(400).json({
                message: "Sample Test Cases are required"
            })
        }

        if (!Array.isArray(hiddenTestCases) || hiddenTestCases.length === 0) {
            return res.status(400).json({
                message: "Hidden Test Cases are required"
            })
        }

        // Generate a URL-friendly slug from the title (e.g. "Two Sum" -> "two-sum") for clean routing
        const slug = title.toLowerCase().replace(/\s+/g, '-')

        // Validate that every test case is properly formatted to prevent crashes during code execution
        const validTestCases = (tc) => tc.input !== undefined && tc.output !== undefined

        if (!sampleTestCases.every(validTestCases) || !hiddenTestCases.every(validTestCases)) {
            return res.status(400).json({
                message: "Invalid Test Cases Every Test Case Must Have Input and Output"
            })
        }

        // Create the problem in the database, wrapping user inputs in xss() to prevent Cross-Site Scripting attacks
        const problem = await problemModel.create({
            title: xss(title),
            slug,
            description: xss(description),
            difficulty,
            starterCode: xss(starterCode),
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

async function deleteProblem(req, res) {
    try {
        const { slug } = req.params

        const problem = await problemModel.findOneAndDelete({ slug })

        if (!problem) {
            return res.status(404).json({
                message: "Problem Not Found"
            })
        }

        return res.status(200).json({
            message: "Problem Deleted Successfully"
        })

    } catch (error) {
        console.error("Problem Deletion Error:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}



async function getProblem(req, res) {
    try {
        const { slug } = req.params

        const problem = await problemModel.findOne({ slug })

        if (!problem) {
            return res.status(404).json({
                message: "Problem Not Found"
            })
        }

        return res.status(200).json({
            message: "Problem Fetched Successfully",
            problem: {
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


async function getAllProblems(req, res) {
    try {

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5

        const skip = (page - 1) * limit

        const problems = await problemModel.find().skip(skip).limit(limit)

        const totalItems = await problemModel.countDocuments();

        const totalPages = Math.ceil(totalItems / limit);


        return res.status(200).json({
            message: "Problems Fetched Successfully",
            problems: problems.map(p => ({
                title: p.title,
                difficulty: p.difficulty,
                slug: p.slug
            })),
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        })

    } catch (error) {
        console.error("Problems Fetch Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


async function editProblem(req, res) {
    try {
        const { slug } = req.params

        // Clone req.body so we can sanitize specific text fields before saving to DB to prevent XSS attacks
        const updates = { ...req.body }
        if (updates.title) updates.title = xss(updates.title)
        if (updates.description) updates.description = xss(updates.description)
        if (updates.starterCode) updates.starterCode = xss(updates.starterCode)

        const problem = await problemModel.findOneAndUpdate(
            { slug },
            updates,
            { new: true, runValidators: true }
        )

        if (!problem) {
            return res.status(404).json({ message: "Problem Not Found" })
        }

        return res.status(200).json({
            message: "Problem Updated Successfully",
            problem
        })

    } catch (error) {
        console.error("Problem Edit Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    createProblem,
    getProblem,
    deleteProblem,
    editProblem,
    getAllProblems
}