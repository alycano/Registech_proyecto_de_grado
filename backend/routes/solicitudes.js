const express = require('express')
const router = express.Router()
const { authMiddleware, requireRol } = require('../middlewares/auth')
const {
    crearSolicitud, getMisSolicitudes, getSolicitudes,
    responderSolicitud, getActividadReciente
} = require('../controllers/solicitudesController')

router.post('/solicitudes', authMiddleware, crearSolicitud)
router.get('/solicitudes/mis', authMiddleware, getMisSolicitudes)
router.get('/solicitudes', authMiddleware, requireRol('admin'), getSolicitudes)
router.put('/solicitudes/:id/responder', authMiddleware, requireRol('admin'), responderSolicitud)
router.get('/actividad', authMiddleware, requireRol('admin'), getActividadReciente)

module.exports = router
