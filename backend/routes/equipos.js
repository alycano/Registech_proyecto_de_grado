const express = require('express')

const router = express.Router()

const {
    getEquipos,
    getEstadosEquipo,
    agregarEquipo,
    liberarEquipo,
    reporteFalla,
    getReportes,
    getHistorialMantenimientos,
    getHistorialEquipo,
    resolverReporte,
    buscarMantenimientos,
    aprobarRechazarOrden,
    actualizarFoto,
    moverEquipo,
    reportarEquipoExtraviado,
    obtenerEvidencia,
    reintegrarEquipo
} = require('../controllers/equiposController')

const { authMiddleware, requireRol } = require('../middlewares/auth')
const { upload, uploadMemoria } = require('../middlewares/upload')
const { validate } = require('../middlewares/validate')

const {
    reporteFallaSchema,
    resolverReporteSchema,
    buscarMantenimientosSchema,
    decisionAprobacionSchema,
    crearEquipoSchema,
    moverEquipoSchema,
    reportarExtraviadoSchema
} = require('../schemas/equipos.schema')


router.get('/estados_equipo', authMiddleware, getEstadosEquipo)

router.get(
    '/equipos/evidencia/:nombre',
    authMiddleware,
    obtenerEvidencia
)

router.get('/equipos', authMiddleware, getEquipos)

router.get(
    '/equipos/:num_serie/historial',
    authMiddleware,
    getHistorialEquipo
)

router.post(
    '/equipos/add',
    authMiddleware,
    requireRol('admin', 'inventario'),
    uploadMemoria.single('foto'),
    validate(crearEquipoSchema),
    agregarEquipo
)

router.post(
    '/equipos/:num_serie/liberar',
    authMiddleware,
    liberarEquipo
)

router.post(
    '/equipos/reporte/add',
    authMiddleware,
    requireRol('soporte', 'admin', 'inventario'),
    upload.single('foto'),
    validate(reporteFallaSchema),
    reporteFalla
)

router.get(
    '/equipos/reporte',
    authMiddleware,
    getReportes
)

router.get(
    '/equipos/mantenimientos',
    authMiddleware,
    requireRol('admin', 'soporte'),
    getHistorialMantenimientos
)

router.post(
    '/equipos/reporte/aprobacion',
    authMiddleware,
    requireRol('admin'),
    validate(decisionAprobacionSchema),
    aprobarRechazarOrden
)

router.post(
    '/equipos/reporte/solucion',
    authMiddleware,
    requireRol('soporte', 'admin'),
    validate(resolverReporteSchema),
    resolverReporte
)

router.post(
    '/equipos/mantenimientos/find',
    authMiddleware,
    validate(buscarMantenimientosSchema),
    buscarMantenimientos
)

router.patch(
    '/equipos/:num_serie/foto',
    authMiddleware,
    requireRol('admin', 'inventario'),
    uploadMemoria.single('foto'),
    actualizarFoto
)

router.patch(
    '/equipos/:num_serie/ubicacion',
    authMiddleware,
    requireRol('admin', 'inventario'),
    validate(moverEquipoSchema),
    moverEquipo
)

router.post(
    '/equipos/:num_serie/reportar-extraviado',
    authMiddleware,
    requireRol('admin', 'inventario'),
    validate(reportarExtraviadoSchema),
    reportarEquipoExtraviado
)

router.post(
    '/equipos/:num_serie/reintegrar',
    authMiddleware,
    requireRol('admin', 'inventario'),
    reintegrarEquipo
)

module.exports = router
