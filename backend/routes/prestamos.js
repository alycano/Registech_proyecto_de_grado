const express = require('express')
const router = express.Router()
const {
    getPrestamos,
    getPrestamosActivos,
    getPrestamoActivoPorEquipo,
    crearPrestamo,
    devolverPrestamo,
    historialEquipo,
    getEstadisticas
} = require('../controllers/prestamosController')
const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { crearPrestamoSchema, devolverPrestamoSchema, historialEquipoSchema } = require('../schemas/prestamos.schema')

router.get('/prestamos', authMiddleware, getPrestamos)
router.get('/prestamos/activos', authMiddleware, getPrestamosActivos)
router.get('/prestamos/activos/:num_serie', authMiddleware, getPrestamoActivoPorEquipo)
router.post('/prestamos', authMiddleware, validate(crearPrestamoSchema), crearPrestamo)
router.post('/prestamos/:id/devolver', authMiddleware, validate(devolverPrestamoSchema), devolverPrestamo)
router.get('/prestamos/historial/:num_serie', authMiddleware, validate(historialEquipoSchema), historialEquipo)
router.get('/estadisticas', authMiddleware, getEstadisticas)

module.exports = router
