const express = require('express')
const router = express.Router()
const {
    getEstadosEquipo,
    getEquipos,
    asignarUsuario,
    reporteFalla,
    getReportes,
    resolverReporte,
    buscarMantenimientos
} = require('../controllers/equiposController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/estados_equipo', authMiddleware, getEstadosEquipo)
router.get('/equipos', authMiddleware, getEquipos)
router.post('/equipos/asignacion', authMiddleware, asignarUsuario)
router.post('/equipos/reporte/add', authMiddleware, reporteFalla)
router.get('/equipos/reporte', authMiddleware, getReportes)
router.post('/equipos/reporte/solucion', authMiddleware, resolverReporte)
router.post('/equipos/mantenimientos/find', authMiddleware, buscarMantenimientos)

module.exports = router
