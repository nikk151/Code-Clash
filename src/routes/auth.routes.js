const express = require("express")
const { registerController, loginUser, logoutUser, sendOTPController, changePasswordController, getCurrentUser } = require("../controllers/auth.controllers.js")
const authMiddleware = require("../middlewares/auth.middleware.js")

const router = express.Router()


router.post("/register", registerController)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/send-otp", sendOTPController)
router.post("/change-password", changePasswordController)
router.get("/me", authMiddleware.isLoggedIn, getCurrentUser)


module.exports = router
