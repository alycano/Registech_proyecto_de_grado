const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth')
const {
    crearSolicitud, getMisSolicitudes, getSolicitudes,
    responderSolicitud, getActividadReciente
} = require('../controllers/solicitudesController')

router.post('/solicitudes', authMiddleware, crearSolicitud)
router.get('/solicitudes/mis', authMiddleware, getMisSolicitudes)
router.get('/solicitudes', authMiddleware, getSolicitudes)
router.put('/solicitudes/:id/responder', authMiddleware, responderSolicitud)
router.get('/actividad', authMiddleware, getActividadReciente)

module.exports = router
