const express = require('express')
const router = express.Router()
const { getAreas } = require('../controllers/areasController')

router.get('/areas', getAreas)

module.exports = router
