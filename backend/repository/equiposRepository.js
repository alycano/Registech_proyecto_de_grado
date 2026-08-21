const prisma = require('../lib/prisma')

exports.findEstados = async () => {
    return await prisma.estados_equipos.findMany()
}

exports.findEquipos = async () => {
    return await prisma.equipos.findMany()
}

exports.updateResponsable = async (numSerieLimpio, responsable) => {
    return await prisma.equipos.update({
        where: { num_serie: numSerieLimpio },
        data: { responsable }
    })
}

exports.createReporteTransaction = async (numSerieLimpio, id_historial, fecha_reporte, fallaLimpia) => {
    return await prisma.$transaction(async (tx) => {
        await tx.equipos.update({
            where: { num_serie: numSerieLimpio },
            data: { estado: 'En mantenimiento' }
        })
        await tx.historial_mantenimientos.create({
            data: {
                id_historial,
                num_serie: numSerieLimpio,
                fecha_reporte,
                falla: fallaLimpia
            }
        })
    })
}

exports.findReportesPendientes = async () => {
    return await prisma.historial_mantenimientos.findMany({
        where: { fecha_solucion: null },
        orderBy: { fecha_reporte: 'asc' }
    })
}

exports.resolverReporteTransaction = async (numSerieLimpio, idHistorialLimpio, fecha_solucion, tecnicoLimpio, solucionLimpia) => {
    return await prisma.$transaction(async (tx) => {
        await tx.equipos.update({
            where: { num_serie: numSerieLimpio },
            data: { estado: 'Disponible' }
        })
        await tx.historial_mantenimientos.update({
            where: { id_historial: idHistorialLimpio },
            data: {
                fecha_solucion,
                usuario_tecnico: tecnicoLimpio,
                solucion: solucionLimpia
            }
        })
    })
}

exports.buscarMantenimientos = async (filtroLimpio) => {
    return await prisma.historial_mantenimientos.findMany({
        where: {
            solucion: { not: null },
            OR: [
                { id_historial: filtroLimpio },
                { num_serie: filtroLimpio },
                { usuario_tecnico: filtroLimpio }
            ]
        }
    })
}
