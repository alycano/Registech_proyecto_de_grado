const express = require('express')

const router = express.Router()

const {
    getPrestamos,
    getPrestamosActivos,
    getPrestamoActivoPorEquipo,
    crearPrestamo,
    devolverEquipo,
    historialEquipo,
    getEstadisticas
} = require('../controllers/prestamosController')

const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')

const {
    crearPrestamoSchema,
    historialEquipoSchema
} = require('../schemas/prestamos.schema')

const { upload } = require('../middlewares/upload')


// ======================================================
// OBTENER TODOS LOS PRÉSTAMOS
// ======================================================

router.get(
    '/prestamos',
    authMiddleware,
    getPrestamos
)


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

router.get(
    '/prestamos/activos',
    authMiddleware,
    getPrestamosActivos
)


// ======================================================
// OBTENER PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

router.get(
    '/prestamos/activos/:num_serie',
    authMiddleware,
    getPrestamoActivoPorEquipo
)


// ======================================================
// CREAR PRÉSTAMO
// ======================================================

router.post(
    '/prestamos',
    authMiddleware,
    validate(crearPrestamoSchema),
    crearPrestamo
)


// ======================================================
// DEVOLVER UN SOLO EQUIPO
// ======================================================

router.post(
    '/prestamos/:id/equipos/:num_serie/devolver',
    authMiddleware,
    upload.single('evidencia'),
    devolverEquipo
)


// ======================================================
// HISTORIAL DE UN EQUIPO
// ======================================================

router.get(
    '/prestamos/historial/:num_serie',
    authMiddleware,
    validate(historialEquipoSchema),
    historialEquipo
)


// ======================================================
// ESTADÍSTICAS
// ======================================================

router.get(
    '/estadisticas',
    authMiddleware,
    getEstadisticas
)


module.exports = router

