const express = require('express')
const router = express.Router()
const finanzasController = require('../controllers/finanzasController')

// OBTENER RESUMEN FINANCIERO
router.get('/finanzas', finanzasController.getResumen)

module.exports = router
