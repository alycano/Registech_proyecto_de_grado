const prisma = require('../lib/prisma')

exports.findByUsuario = async (usuarioLimpio) => {
    return await prisma.usuarios.findUnique({
        where: { usuario: usuarioLimpio }
    })
}

exports.findByGoogleIdOrCorreo = async (googleId, correo) => {
    return await prisma.usuarios.findFirst({
        where: {
            OR: [
                { google_id: googleId },
                { correo: correo }
            ]
        }
    })
}

exports.findAll = async () => {
    return await prisma.usuarios.findMany({
        select: {
            usuario: true,
            nombre: true,
            area: true,
            correo: true,
            estado: true
        }
    })
}

exports.create = async (data) => {
    return await prisma.usuarios.create({ data })
}

exports.update = async (usuarioParam, data) => {
    return await prisma.usuarios.update({
        where: { usuario: usuarioParam },
        data
    })
}

exports.delete = async (usuarioParam) => {
    return await prisma.usuarios.delete({
        where: { usuario: usuarioParam }
    })
}
