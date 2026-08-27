const solicitudesService = require('../services/solicitudesService')

exports.crearSolicitud = async (req, res) => {
    try {
        const solicitud = await solicitudesService.crearSolicitud(req.usuario.usuario, req.body)
        res.status(201).json(solicitud)
    } catch (error) {
        console.error('Error al crear solicitud:', error)
        res.status(500).json({ error: 'Error al crear la solicitud' })
    }
}

exports.getMisSolicitudes = async (req, res) => {
    try {
        const solicitudes = await solicitudesService.getMisSolicitudes(req.usuario.usuario)
        res.json(solicitudes)
    } catch (error) {
        console.error('Error al obtener mis solicitudes:', error)
        res.status(500).json({ error: 'Error al obtener solicitudes' })
    }
}

exports.getSolicitudes = async (req, res) => {
    try {
        const solicitudes = await solicitudesService.getSolicitudes(req.query.estado)
        res.json(solicitudes)
    } catch (error) {
        console.error('Error al obtener solicitudes:', error)
        res.status(500).json({ error: 'Error al obtener solicitudes' })
    }
}

exports.responderSolicitud = async (req, res) => {
    try {
        const { estado, respuesta } = req.body
        const solicitud = await solicitudesService.responderSolicitud(
            req.params.id, req.usuario.usuario, estado, respuesta || null
        )
        res.json(solicitud)
    } catch (error) {
        if (error.message === 'ESTADO_INVALIDO') {
            return res.status(400).json({ error: 'Estado debe ser aprobada o rechazada' })
        }
        console.error('Error al responder solicitud:', error)
        res.status(500).json({ error: 'Error al responder solicitud' })
    }
}

exports.getActividadReciente = async (req, res) => {
    try {
        const actividad = await solicitudesService.getActividadReciente()
        res.json(actividad)
    } catch (error) {
        console.error('Error al obtener actividad:', error)
        res.status(500).json({ error: 'Error al obtener actividad' })
    }
}
