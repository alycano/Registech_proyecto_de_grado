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

router.get('/estados_equipo', getEstadosEquipo)
router.get('/equipos', getEquipos)
router.post('/equipos/asignacion', asignarUsuario)
router.post('/equipos/reporte/add', reporteFalla)
router.get('/equipos/reporte', getReportes)
router.post('/equipos/reporte/solucion', resolverReporte)
router.post('/equipos/mantenimientos/find', buscarMantenimientos)

module.exports = router
