const prisma = require('../lib/prisma')

exports.crearLog = async (usuario, accion) => {
    return await prisma.auditoria.create({
        data: {
            usuario,
            accion
        }
    })
}
