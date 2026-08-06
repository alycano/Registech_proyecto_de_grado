const express = require('express')
const router = express.Router()
const { getVentas, createVenta } = require('../controllers/ventasController')

router.get('/ventas', getVentas)
router.post('/ventas', createVenta)

module.exports = router
