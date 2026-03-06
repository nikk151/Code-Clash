const express = require("express")
const { registerController, loginUser, logoutUser, sendOTPController, changePasswordController } = require("../controllers/auth.controllers.js")

const router = express.Router()


router.post("/register", registerController)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/send-otp", sendOTPController)
router.post("/change-password", changePasswordController)


module.exports = router

