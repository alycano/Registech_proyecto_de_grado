const prisma = require('../lib/prisma')

exports.findPrestamos = async () => {
    return await prisma.prestamos.findMany({
        include: { equipos: true },
        orderBy: { fecha_prestamo: 'desc' }
    })
}

exports.findPrestamosActivos = async () => {
    return await prisma.prestamos.findMany({
        where: { estado: 'activo' },
        include: { equipos: true },
        orderBy: { fecha_prestamo: 'desc' }
    })
}

exports.crearPrestamoTransaction = async (numSerieLimpio, usuarioLimpio, observacionesLimpias) => {
    return await prisma.$transaction(async (tx) => {
        const equipo = await tx.equipos.findUnique({
            where: { num_serie: numSerieLimpio }
        })
        if (!equipo) throw new Error('EQUIPO_NO_ENCONTRADO')
        if (equipo.estado !== 'Disponible') throw new Error('EQUIPO_NO_DISPONIBLE')

        await tx.prestamos.create({
            data: {
                num_serie: numSerieLimpio,
                usuario_destino: usuarioLimpio,
                fecha_prestamo: new Date(),
                estado: 'activo',
                observaciones: observacionesLimpias
            }
        })
        await tx.equipos.update({
            where: { num_serie: numSerieLimpio },
            data: {
                estado: 'Asignado',
                responsable: usuarioLimpio
            }
        })
    })
}

exports.devolverPrestamoTransaction = async (idLimpio) => {
    return await prisma.$transaction(async (tx) => {
        const prestamo = await tx.prestamos.findUnique({
            where: { id_prestamo: idLimpio }
        })
        if (!prestamo) throw new Error('PRESTAMO_NO_ENCONTRADO')
        if (prestamo.estado !== 'activo') throw new Error('PRESTAMO_YA_DEVUELTO')

        await tx.prestamos.update({
            where: { id_prestamo: idLimpio },
            data: {
                fecha_devolucion: new Date(),
                estado: 'devuelto'
            }
        })
        await tx.equipos.update({
            where: { num_serie: prestamo.num_serie },
            data: {
                estado: 'Disponible',
                responsable: null
            }
        })
    })
}

exports.findHistorialEquipo = async (numSerieLimpio) => {
    return await prisma.prestamos.findMany({
        where: { num_serie: numSerieLimpio },
        include: { equipos: true },
        orderBy: { fecha_prestamo: 'desc' }
    })
}

exports.getEstadisticasData = async () => {
    const [total, disponibles, prestados, mantenimiento, baja] = await Promise.all([
        prisma.equipos.count(),
        prisma.equipos.count({ where: { estado: 'Disponible' } }),
        prisma.prestamos.count({ where: { estado: 'activo' } }),
        prisma.equipos.count({ where: { estado: 'En mantenimiento' } }),
        prisma.equipos.count({ where: { estado: 'Baja' } })
    ])
    return { total, disponibles, prestados, mantenimiento, baja }
}
