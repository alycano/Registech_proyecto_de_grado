const express = require('express')
const router = express.Router()
const { getDashboard, exportarEquipos, getNotificaciones } = require('../controllers/dashboardController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/dashboard', authMiddleware, getDashboard)
router.get('/notificaciones', authMiddleware, getNotificaciones)
router.get('/dashboard/exportar-equipos', authMiddleware, exportarEquipos)

module.exports = router
