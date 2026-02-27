

const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model.js")


async function isLoggedIn(req, res, next){
    try {

        const token = req.cookies.token

        if (!token){
            return res.status(401).json({
                message: "Access Denied"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.id)

        if (!user){
            return res.status(401).json({
                message: "User Not Found"
            })
        }

        req.user = user

        next()
        
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

module.exports = {
    isLoggedIn
}
