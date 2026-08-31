const notificacionesService = require('../services/notificacionesService')

exports.obtenerNotificaciones = async (req, res) => {
    try {
        const notificaciones = await notificacionesService.obtenerPorUsuario(
            req.usuario.usuario
        )

        res.json(notificaciones)
    } catch (error) {
        console.error('Error al obtener notificaciones:', error)
        res.status(500).json({
            error: 'No se pudieron obtener las notificaciones'
        })
    }
}

exports.obtenerNoLeidas = async (req, res) => {
    try {
        const notificaciones = await notificacionesService.obtenerNoLeidas(
            req.usuario.usuario
        )

        res.json(notificaciones)
    } catch (error) {
        console.error('Error al obtener notificaciones no leídas:', error)
        res.status(500).json({
            error: 'No se pudieron obtener las notificaciones'
        })
    }
}

exports.marcarLeida = async (req, res) => {
    try {
        await notificacionesService.marcarLeida(
            req.params.id,
            req.usuario.usuario
        )

        res.json({
            mensaje: 'Notificación marcada como leída'
        })
    } catch (error) {
        console.error('Error al marcar notificación:', error)
        res.status(500).json({
            error: 'No se pudo marcar la notificación'
        })
    }
}

exports.marcarTodasLeidas = async (req, res) => {
    try {
        await notificacionesService.marcarTodasLeidas(
            req.usuario.usuario
        )

        res.json({
            mensaje: 'Notificaciones marcadas como leídas'
        })
    } catch (error) {
        console.error('Error al marcar notificaciones:', error)
        res.status(500).json({
            error: 'No se pudieron marcar las notificaciones'
        })
    }
}