const express = require("express")
const router = express.Router()
const { getLeaderboard } = require("../controllers/leaderboard.controller.js")
const { isLoggedIn } = require("../middlewares/auth.middleware.js")

router.get("/", isLoggedIn, getLeaderboard)

module.exports = router