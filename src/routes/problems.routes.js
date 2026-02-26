const express = require('express')

const problemsController = require('../controllers/problems.controller.js')

const router = express.Router()


router.post('/create-problem', problemsController.createProblem)
router.get('/get-problem/:slug', problemsController.getProblem)


module.exports = router