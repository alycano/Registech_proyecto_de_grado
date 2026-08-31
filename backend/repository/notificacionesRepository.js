const prisma = require('../lib/prisma')

exports.crear = async ({ usuario, tipo, mensaje }) => {
    return await prisma.notificaciones.create({
        data: {
            usuario,
            tipo,
            mensaje
        }
    })
}

exports.obtenerPorUsuario = async (usuario) => {
    return await prisma.notificaciones.findMany({
        where: {
            usuario
        },
        orderBy: {
            creado_en: 'desc'
        }
    })
}

exports.obtenerNoLeidas = async (usuario) => {
    return await prisma.notificaciones.findMany({
        where: {
            usuario,
            leida: false
        },
        orderBy: {
            creado_en: 'desc'
        }
    })
}

exports.marcarLeida = async (id, usuario) => {
    return await prisma.notificaciones.updateMany({
        where: {
            id,
            usuario
        },
        data: {
            leida: true
        }
    })
}

exports.marcarTodasLeidas = async (usuario) => {
    return await prisma.notificaciones.updateMany({
        where: {
            usuario,
            leida: false
        },
        data: {
            leida: true
        }
    })
}