const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware.js')
const matchController = require('../controllers/match.controller.js')

const router = express.Router()


router.post('/create-match', authMiddleware.isLoggedIn, matchController.createMatch)



module.exports = router
