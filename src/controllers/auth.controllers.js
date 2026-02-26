const userModel = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


async function registerController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields (username, email, password) are required"
            });
        }

        const isUserExist = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (isUserExist) {
            return res.status(400).json({
                message: "User Already Exist"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.cookie("token", token, { httpOnly: true });

        return res.status(201).json({
            message: "User Registered Successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!password || (!username && !email)) {
            return res.status(400).json({
                message: "Email/username and password are required"
            });
        }

        const isUserExist = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        }).select('+password');  // explicitly fetch password since select:false in schema

        if (!isUserExist) {
            return res.status(400).json({
                message: "User Not Found"
            });
        }

        const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

        if (!isPasswordMatched) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const token = jwt.sign({ id: isUserExist._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.cookie("token", token, { httpOnly: true });

        return res.status(200).json({
            message: "User Logged In Successfully",
            user: {
                id: isUserExist._id,
                username: isUserExist.username,
                email: isUserExist.email,
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


module.exports = {
    registerController,
    loginUser
}