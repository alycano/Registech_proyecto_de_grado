const express = require('express')
const router = express.Router()
const { getVentas, createVenta } = require('../controllers/ventasController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/ventas', authMiddleware, getVentas)
router.post('/ventas', authMiddleware, createVenta)

module.exports = router
