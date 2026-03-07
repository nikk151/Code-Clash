const userModel = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OTP = require("../services/email.service.js");
const { validatePassword } = require("../utils/validators.js");
const xss = require('xss')



async function registerController(req, res) {
    try {
        const { username, email, password, otp } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields (username, email, password) are required"
            });
        }

        // Check if username or email is already taken to enforce unique user accounts
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



        // Verify the 6-digit OTP sent to their email to ensure they own the email address
        const isValid = await OTP.verifyOTP(email, otp)
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" })
        }

        // Enforce password strength policies (length, uppercase, numbers) for security
        const passwordError = validatePassword(password)
        if (passwordError) {
            return res.status(400).json({ message: passwordError })
        }

        // Hash the password so that if the DB is compromised, user passwords remain secure
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store sanitized username and email to prevent XSS attacks via profile details
        const user = await userModel.create({
            username: xss(username),
            email: xss(email),
            password: hashedPassword
        });

        // Generate a JWT to keep the user authenticated across requests
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        // Store JWT in an HttpOnly cookie to protect against client-side script access (reducing XSS risks)
        res.cookie("token", token, { httpOnly: true });

        return res.status(201).json({
            message: "User Registered Successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
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

        // We must select('+password') because it is normally hidden in schema by select: false
        const isUserExist = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        }).select('+password');

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

async function logoutUser(req, res) {
    try {
        res.clearCookie("token");
        return res.status(200).json({
            message: "User Logged Out Successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function sendOTPController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        await OTP.sendOTP(email)

        return res.status(200).json({
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function changePasswordController(req, res) {
    try {
        const { email, otp, newPassword } = req.body

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const passwordError = validatePassword(newPassword)
        if (passwordError) {
            return res.status(400).json({ message: passwordError })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isValid = await OTP.verifyOTP(email, otp)
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        return res.status(200).json({ message: "Password changed successfully" })

    } catch (error) {
        console.error("Change Password Error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


module.exports = {
    registerController,
    loginUser,
    logoutUser,
    sendOTPController,
    changePasswordController
}