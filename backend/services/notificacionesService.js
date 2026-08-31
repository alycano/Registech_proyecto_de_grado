const notificacionesRepository = require('../repository/notificacionesRepository')

exports.crear = async (usuario, tipo, mensaje) => {
    if (!usuario || !mensaje) return null

    return await notificacionesRepository.crear({
        usuario,
        tipo,
        mensaje
    })
}

exports.obtenerPorUsuario = async (usuario) => {
    return await notificacionesRepository.obtenerPorUsuario(usuario)
}

exports.obtenerNoLeidas = async (usuario) => {
    return await notificacionesRepository.obtenerNoLeidas(usuario)
}

exports.marcarLeida = async (id, usuario) => {
    return await notificacionesRepository.marcarLeida(id, usuario)
}

exports.marcarTodasLeidas = async (usuario) => {
    return await notificacionesRepository.marcarTodasLeidas(usuario)
}