const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware.js')
const matchController = require('../controllers/match.controller.js')
const submitController = require('../controllers/submit.controller.js')

const router = express.Router()


router.post('/create-match', authMiddleware.isLoggedIn, matchController.createMatch)
router.post('/join-match/:roomCode', authMiddleware.isLoggedIn, matchController.joinMatch)
router.post('/submit-code/:roomCode', authMiddleware.isLoggedIn, submitController.submitCode)



module.exports = router
