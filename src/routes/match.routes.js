const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware.js')
const matchMiddleware = require('../middlewares/match.middleware.js')
const matchController = require('../controllers/match.controller.js')
const submitController = require('../controllers/submit.controller.js')

const router = express.Router()


router.post('/create-match', authMiddleware.isLoggedIn, matchController.createMatch)
router.post('/join-match/:roomCode', authMiddleware.isLoggedIn, matchController.joinMatch)
router.get('/:roomCode', authMiddleware.isLoggedIn, matchController.getMatch)
router.post('/submit-code/:roomCode', authMiddleware.isLoggedIn, matchMiddleware.validateSubmission, submitController.submitCode)
router.post('/run-sample/:roomCode', authMiddleware.isLoggedIn, matchMiddleware.validateSubmission, submitController.runSampleTestCases)



module.exports = router
