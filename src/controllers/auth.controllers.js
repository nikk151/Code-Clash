const userModel = require("../models/user.model.js");


async function registerController(req, res) {
    const { username, email, password } = req.body

    const user = await userModel.create({
        username,
        email,
        password
    })

    return res.status(200).json({
        message: "User Registered Sucessfully",
        user
    })
}

module.exports = {
    registerController
}