const express = require('express')
const router = express.Router()
const { getAreas } = require('../controllers/areasController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/areas', authMiddleware, getAreas)

module.exports = router
