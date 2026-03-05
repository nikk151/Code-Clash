const express = require("express")

const router = express.Router()
const authMiddleware = require("../middlewares/auth.middleware.js")
const profileController = require("../controllers/profile.controller.js")


router.get("/stats", authMiddleware.isLoggedIn, profileController.getStats)





module.exports = router