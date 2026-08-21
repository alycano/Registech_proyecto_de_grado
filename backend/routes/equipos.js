const express = require('express')
const router = express.Router()
const {
    getEquipos,
    getEstadosEquipo,
    asignarUsuario,
    reporteFalla,
    getReportes,
    resolverReporte,
    buscarMantenimientos
} = require('../controllers/equiposController')
const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { asignarUsuarioSchema, reporteFallaSchema, resolverReporteSchema, buscarMantenimientosSchema } = require('../schemas/equipos.schema')

router.get('/estados_equipo', authMiddleware, getEstadosEquipo)
router.get('/equipos', authMiddleware, getEquipos)
router.post('/equipos/asignacion', authMiddleware, validate(asignarUsuarioSchema), asignarUsuario)
router.post('/equipos/reporte/add', authMiddleware, validate(reporteFallaSchema), reporteFalla)
router.get('/equipos/reporte', authMiddleware, getReportes)
router.post('/equipos/reporte/solucion', authMiddleware, validate(resolverReporteSchema), resolverReporte)
router.post('/equipos/mantenimientos/find', authMiddleware, validate(buscarMantenimientosSchema), buscarMantenimientos)

module.exports = router
