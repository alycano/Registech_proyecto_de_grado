const notificacionesRepository = require('../repository/notificacionesRepository')
const prisma = require('../lib/prisma')

exports.notificarAdmins = async (tipo, mensaje) => {
    try {
        const administradores = await prisma.usuarios.findMany({
            where: {
                rol: 'admin',
                estado: 'Activo'
            }
        })
        for (const admin of administradores) {
            await notificacionesRepository.crear({
                usuario: admin.usuario,
                tipo,
                mensaje
            })
        }
    } catch (error) {
        console.error('Error al notificar a administradores:', error)
    }
}


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