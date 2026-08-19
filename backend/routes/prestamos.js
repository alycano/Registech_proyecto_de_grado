const express = require('express')
const router = express.Router()
const {
    getPrestamos,
    getPrestamosActivos,
    crearPrestamo,
    devolverPrestamo,
    historialEquipo,
    getEstadisticas
} = require('../controllers/prestamosController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/prestamos', authMiddleware, getPrestamos)
router.get('/prestamos/activos', authMiddleware, getPrestamosActivos)
router.post('/prestamos', authMiddleware, crearPrestamo)
router.put('/prestamos/:id/devolver', authMiddleware, devolverPrestamo)
router.get('/prestamos/historial/:num_serie', authMiddleware, historialEquipo)
router.get('/estadisticas', authMiddleware, getEstadisticas)

module.exports = router
