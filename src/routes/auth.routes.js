const express = require("express")
const { registerController } = require("../controllers/auth.controllers.js")

const router = express.Router()


router.post("/register", registerController)

module.exports = router

