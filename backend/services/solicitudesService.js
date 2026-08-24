const solicitudesRepository = require('../repository/solicitudesRepository')
const actividadRepository = require('../repository/actividadRepository')

exports.crearSolicitud = async (usuario, data) => {
    return await solicitudesRepository.crearSolicitud(usuario, data.tipo_equipo, data.descripcion, data.justificacion)
}

exports.getMisSolicitudes = async (usuario) => {
    return await solicitudesRepository.findMisSolicitudes(usuario)
}

exports.getSolicitudes = async (estado) => {
    return await solicitudesRepository.findSolicitudes(estado)
}

exports.responderSolicitud = async (id, admin, estado, respuesta) => {
    if (!['aprobada', 'rechazada'].includes(estado)) {
        throw new Error('ESTADO_INVALIDO')
    }
    return await solicitudesRepository.responderSolicitud(id, admin, estado, respuesta)
}

exports.getActividadReciente = async () => {
    return await actividadRepository.getActividadReciente(15)
}
