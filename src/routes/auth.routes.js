const express = require("express")
const { registerController, loginUser, logoutUser } = require("../controllers/auth.controllers.js")

const router = express.Router()


router.post("/register", registerController)
router.post("/login", loginUser)
router.post("/logout", logoutUser)


module.exports = router

