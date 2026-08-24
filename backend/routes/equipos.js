const express = require('express')
const router = express.Router()
const {
    getEquipos,
    getEstadosEquipo,
    agregarEquipo,
    asignarUsuario,
    reporteFalla,
    getReportes,
    getHistorialMantenimientos,
    resolverReporte,
    buscarMantenimientos,
    aprobarRechazarOrden
} = require('../controllers/equiposController')
const { authMiddleware, requireArea } = require('../middlewares/auth')
const { upload } = require('../middlewares/upload')
const { validate } = require('../middlewares/validate')
const {
    asignarUsuarioSchema,
    reporteFallaSchema,
    resolverReporteSchema,
    buscarMantenimientosSchema,
    decisionAprobacionSchema,
    crearEquipoSchema
} = require('../schemas/equipos.schema')

router.get('/estados_equipo', authMiddleware, getEstadosEquipo)
router.get('/equipos', authMiddleware, getEquipos)
router.post('/equipos/add', authMiddleware, requireArea('Tecnologia'), upload.single('foto'), validate(crearEquipoSchema), agregarEquipo)
router.post('/equipos/asignacion', authMiddleware, validate(asignarUsuarioSchema), asignarUsuario)
router.post('/equipos/reporte/add', authMiddleware, upload.single('foto'), validate(reporteFallaSchema), reporteFalla)
router.get('/equipos/reporte', authMiddleware, getReportes)
router.get('/equipos/mantenimientos', authMiddleware, requireArea('Tecnologia'), getHistorialMantenimientos)
router.post('/equipos/reporte/aprobacion', authMiddleware, requireArea('Tecnologia'), validate(decisionAprobacionSchema), aprobarRechazarOrden)
router.post('/equipos/reporte/solucion', authMiddleware, validate(resolverReporteSchema), resolverReporte)
router.post('/equipos/mantenimientos/find', authMiddleware, validate(buscarMantenimientosSchema), buscarMantenimientos)

module.exports = router
