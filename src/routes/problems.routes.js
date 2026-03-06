const express = require('express')

const problemsController = require('../controllers/problems.controller.js')
const authMiddleware = require('../middlewares/auth.middleware.js')

const router = express.Router()


router.post('/create-problem', authMiddleware.isLoggedIn, authMiddleware.isAdmin, problemsController.createProblem)
router.get('/get-problem/:slug', authMiddleware.isLoggedIn, problemsController.getProblem)
router.delete("/delete-problem/:slug", authMiddleware.isLoggedIn, authMiddleware.isAdmin, problemsController.deleteProblem)
router.put('/edit-problem/:slug', authMiddleware.isLoggedIn, authMiddleware.isAdmin, problemsController.editProblem)
router.get('/get-all-problems', authMiddleware.isLoggedIn, problemsController.getAllProblems)

module.exports = router