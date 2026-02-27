const express = require('express')

const problemsController = require('../controllers/problems.controller.js')
const {isLoggedIn} = require('../middlewares/auth.middleware.js')
const {isAdmin} = require('../middlewares/auth.middleware.js')

const router = express.Router()


router.post('/create-problem', isLoggedIn, isAdmin, problemsController.createProblem)
router.get('/get-problem/:slug', isLoggedIn, problemsController.getProblem)

module.exports = router