const express = require('express')

const router = express.Router()

const {
    obtenerNotificaciones,
    obtenerNoLeidas,
    marcarLeida,
    marcarTodasLeidas
} = require('../controllers/notificacionesController')

const { authMiddleware } = require('../middlewares/auth')

router.get(
    '/notificaciones',
    authMiddleware,
    obtenerNotificaciones
)

router.get(
    '/notificaciones/no-leidas',
    authMiddleware,
    obtenerNoLeidas
)

router.patch(
    '/notificaciones/:id/leida',
    authMiddleware,
    marcarLeida
)

router.patch(
    '/notificaciones/marcar-todas-leidas',
    authMiddleware,
    marcarTodasLeidas
)

module.exports = router