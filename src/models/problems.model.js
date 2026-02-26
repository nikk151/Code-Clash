const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // e.g., "two-sum" for URLs
    description: { type: String, required: true }, // Can store Markdown string
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy'
    },

    // The "Signature" tells the frontend how to call the function
    // e.g. functionName: "twoSum", args: ["nums", "target"]
    starterCode: {
        type: String,
        required: true
    },

    // Public test cases (User sees these)
    sampleTestCases: [
        {
            input: { type: String, required: true }, // JSON stringified inputs
            output: { type: String, required: true }
        }
    ],

    // Hidden test cases (Used by the Judge, User never sees these)
    hiddenTestCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ]
});

module.exports = mongoose.model('Problems', problemSchema);