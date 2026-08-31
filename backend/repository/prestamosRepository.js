const prisma = require('../lib/prisma')


// ======================================================
// OBTENER TODOS LOS PRÉSTAMOS
// ======================================================

exports.findPrestamos = async () => {

    const prestamos = await prisma.prestamos.findMany({
        include: {
            equipos: {
                include: {
                    equipo: true
                }
            }
        },
        orderBy: {
            fecha_prestamo: 'desc'
        }
    })

    return prestamos.flatMap(prestamo =>
        prestamo.equipos.map(relacion => ({
            id_prestamo: prestamo.id_prestamo,
            num_serie: relacion.num_serie,

            estado: prestamo.estado,

            usuario_destino: prestamo.usuario_destino,
            area: prestamo.area,

            fecha_prestamo: prestamo.fecha_prestamo,
            fecha_devolucion: prestamo.fecha_devolucion,

            observaciones: prestamo.observaciones,
            evidencia: prestamo.evidencia,

            equipo: relacion.equipo?.equipo || null,
            equipo_area: relacion.equipo?.area || null,
            descripcion: relacion.equipo?.descripcion || null,

            estado_equipo: relacion.equipo?.estado || null,
            responsable: relacion.equipo?.responsable || null,
            fecha_adquisicion: relacion.equipo?.fecha_adquisicion || null,
            fecha_asignacion: relacion.equipo?.fecha_asignacion || null,
            fecha_baja: relacion.equipo?.fecha_baja || null,
            sistema_operativo: relacion.equipo?.sistema_operativo || null,
            imagen: relacion.equipo?.imagen || null
        }))
    )
}


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

exports.findPrestamosActivos = async () => {

    const prestamos = await prisma.prestamos.findMany({
        where: {
            estado: {
                in: ['activo', 'parcial']
            }
        },
        include: {
            equipos: {
                include: {
                    equipo: true
                }
            }
        },
        orderBy: {
            fecha_prestamo: 'desc'
        }
    })

    return prestamos.flatMap(prestamo =>
        prestamo.equipos.map(relacion => ({
            id_prestamo: prestamo.id_prestamo,

            // IMPORTANTE: este es el número de serie real
            num_serie: relacion.num_serie,

            estado: prestamo.estado,

            usuario_destino: prestamo.usuario_destino,
            area: prestamo.area,

            fecha_prestamo: prestamo.fecha_prestamo,
            fecha_devolucion: prestamo.fecha_devolucion,

            observaciones: prestamo.observaciones,
            evidencia: prestamo.evidencia,

            // Información del equipo
            equipo: relacion.equipo?.equipo || null,
            equipo_area: relacion.equipo?.area || null,
            descripcion: relacion.equipo?.descripcion || null,

            estado_equipo: relacion.equipo?.estado || null,
            responsable: relacion.equipo?.responsable || null,
            fecha_adquisicion: relacion.equipo?.fecha_adquisicion || null,
            fecha_asignacion: relacion.equipo?.fecha_asignacion || null,
            fecha_baja: relacion.equipo?.fecha_baja || null,
            sistema_operativo: relacion.equipo?.sistema_operativo || null,
            imagen: relacion.equipo?.imagen || null
        }))
    )
}


// ======================================================
// BUSCAR PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

exports.findPrestamoActivoPorEquipo = async (numSerieLimpio) => {

    const relacion = await prisma.prestamo_equipos.findFirst({
        where: {
            num_serie: numSerieLimpio,
            prestamo: {
                estado: {
                    in: ['activo', 'parcial']
                }
            }
        },
        include: {
            prestamo: true,
            equipo: true
        },
        orderBy: {
            prestamo: {
                fecha_prestamo: 'desc'
            }
        }
    })

    if (!relacion) {
        return null
    }

    return {
        id_prestamo: relacion.prestamo.id_prestamo,
        num_serie: relacion.num_serie,

        estado: relacion.prestamo.estado,

        usuario_destino: relacion.prestamo.usuario_destino,
        area: relacion.prestamo.area,

        fecha_prestamo: relacion.prestamo.fecha_prestamo,
        fecha_devolucion: relacion.prestamo.fecha_devolucion,

        observaciones: relacion.prestamo.observaciones,
        evidencia: relacion.prestamo.evidencia,

        equipo: relacion.equipo?.equipo || null,
        descripcion: relacion.equipo?.descripcion || null,
        equipo_area: relacion.equipo?.area || null,

        estado_equipo: relacion.equipo?.estado || null,
        responsable: relacion.equipo?.responsable || null,
        fecha_adquisicion: relacion.equipo?.fecha_adquisicion || null,
        fecha_asignacion: relacion.equipo?.fecha_asignacion || null,
        fecha_baja: relacion.equipo?.fecha_baja || null,
        sistema_operativo: relacion.equipo?.sistema_operativo || null,
        imagen: relacion.equipo?.imagen || null
    }
}


// ======================================================
// CREAR PRÉSTAMO CON VARIOS EQUIPOS
// ======================================================

exports.crearPrestamoTransaction = async (
    numSeriesLimpios,
    usuarioLimpio,
    observacionesLimpias,
    fechaInicio = null,
    fechaLimite = null,
    area = null
) => {

    if (!Array.isArray(numSeriesLimpios) || numSeriesLimpios.length === 0) {
        throw new Error('REQUERIDOS')
    }

    return await prisma.$transaction(async (tx) => {

        // 1. Buscar todos los equipos

        const equipos = await tx.equipos.findMany({
            where: {
                num_serie: {
                    in: numSeriesLimpios
                }
            }
        })

        // 2. Verificar que todos existan

        if (equipos.length !== numSeriesLimpios.length) {
            throw new Error('EQUIPO_NO_ENCONTRADO')
        }

        // 3. Verificar disponibilidad

        const equipoNoDisponible = equipos.find(
            equipo => equipo.estado !== 'Disponible'
        )

        if (equipoNoDisponible) {
            throw new Error('EQUIPO_NO_DISPONIBLE')
        }

        // 4. Crear préstamo

        const prestamo = await tx.prestamos.create({
            data: {
                usuario_destino: usuarioLimpio,
                area: area,

                fecha_prestamo: fechaInicio
                    ? new Date(fechaInicio)
                    : new Date(),

                fecha_devolucion: fechaLimite
                    ? new Date(fechaLimite)
                    : null,

                estado: 'activo',

                observaciones: observacionesLimpias
            }
        })

        // 5. Crear relaciones con los equipos

        await tx.prestamo_equipos.createMany({
            data: numSeriesLimpios.map(numSerie => ({
                id_prestamo: prestamo.id_prestamo,
                num_serie: numSerie
            }))
        })

        // 6. Marcar equipos como asignados

        await tx.equipos.updateMany({
            where: {
                num_serie: {
                    in: numSeriesLimpios
                }
            },
            data: {
                estado: 'Asignado',
                responsable: usuarioLimpio
            }
        })

        return prestamo
    })
}


// ======================================================
// DEVOLVER PRÉSTAMO COMPLETO
// ======================================================

exports.devolverPrestamoTransaction = async (
    idLimpio,
    observaciones,
    evidencia
) => {

    return await prisma.$transaction(async (tx) => {

        // 1. Buscar préstamo

        const prestamo = await tx.prestamos.findUnique({
            where: {
                id_prestamo: idLimpio
            },
            include: {
                equipos: true
            }
        })

        if (!prestamo) {
            throw new Error('PRESTAMO_NO_ENCONTRADO')
        }

        // Permitir activo y parcial

        if (!['activo', 'parcial'].includes(prestamo.estado)) {
            throw new Error('PRESTAMO_YA_DEVUELTO')
        }

        // 2. Obtener números de serie

        const numSeries = prestamo.equipos.map(
            equipo => equipo.num_serie
        )

        // 3. Actualizar préstamo

        await tx.prestamos.update({
            where: {
                id_prestamo: idLimpio
            },
            data: {
                fecha_devolucion: new Date(),
                estado: 'devuelto',
                observaciones: observaciones ?? prestamo.observaciones,
                evidencia: evidencia
            }
        })

        // 4. Liberar todos los equipos

        if (numSeries.length > 0) {

            await tx.equipos.updateMany({
                where: {
                    num_serie: {
                        in: numSeries
                    }
                },
                data: {
                    estado: 'Disponible',
                    responsable: null
                }
            })
        }

        return {
            equiposDevueltos: numSeries.length
        }
    })
}


// ======================================================
// DEVOLVER UN SOLO EQUIPO
// ======================================================

exports.devolverEquipoTransaction = async (
    idPrestamo,
    numSerie,
    observaciones,
    evidencia
) => {

    return await prisma.$transaction(async (tx) => {

        // 1. Buscar préstamo
        const prestamo = await tx.prestamos.findUnique({
            where: {
                id_prestamo: idPrestamo
            }
        })

        if (!prestamo) {
            throw new Error('PRESTAMO_NO_ENCONTRADO')
        }

        // Solo se pueden devolver equipos de préstamos activos o parciales
        if (
            prestamo.estado !== 'activo' &&
            prestamo.estado !== 'parcial'
        ) {
            throw new Error('PRESTAMO_YA_DEVUELTO')
        }

        // 2. Verificar que el equipo pertenezca al préstamo
        const relacion = await tx.prestamo_equipos.findUnique({
            where: {
                id_prestamo_num_serie: {
                    id_prestamo: idPrestamo,
                    num_serie: numSerie
                }
            }
        })

        if (!relacion) {
            throw new Error('EQUIPO_NO_PERTENECE')
        }

        // 3. Liberar equipo
        await tx.equipos.update({
            where: {
                num_serie: numSerie
            },
            data: {
                estado: 'Disponible',
                responsable: null
            }
        })

        // 4. Eliminar relación del equipo con el préstamo
        await tx.prestamo_equipos.delete({
            where: {
                id_prestamo_num_serie: {
                    id_prestamo: idPrestamo,
                    num_serie: numSerie
                }
            }
        })

        // 5. Contar equipos que todavía pertenecen al préstamo
        const equiposRestantes = await tx.prestamo_equipos.count({
            where: {
                id_prestamo: idPrestamo
            }
        })

        let prestamoFinalizado = false

        // 6. Si ya no quedan equipos
        if (equiposRestantes === 0) {

            await tx.prestamos.update({
                where: {
                    id_prestamo: idPrestamo
                },
                data: {
                    estado: 'devuelto',
                    fecha_devolucion: new Date(),
                    observaciones: observaciones ?? prestamo.observaciones,
                    evidencia: evidencia ?? prestamo.evidencia
                }
            })

            prestamoFinalizado = true

        } else {

            // 7. Todavía quedan equipos:
            // el préstamo pasa a estado PARCIAL
            await tx.prestamos.update({
                where: {
                    id_prestamo: idPrestamo
                },
                data: {
                    estado: 'parcial',
                    observaciones: observaciones ?? prestamo.observaciones,
                    evidencia: evidencia ?? prestamo.evidencia
                }
            })
        }

        // 8. Devolver información al controller
        return {
            equiposRestantes,
            prestamoFinalizado
        }
    })
}

// ======================================================
// HISTORIAL DE UN EQUIPO
// ======================================================

exports.findHistorialEquipo = async (numSerieLimpio) => {

    const relaciones = await prisma.prestamo_equipos.findMany({
        where: {
            num_serie: numSerieLimpio
        },
        include: {
            prestamo: true,
            equipo: true
        },
        orderBy: {
            prestamo: {
                fecha_prestamo: 'desc'
            }
        }
    })

    return relaciones.map(relacion => ({
        id_prestamo: relacion.prestamo.id_prestamo,
        num_serie: relacion.num_serie,

        estado: relacion.prestamo.estado,

        usuario_destino: relacion.prestamo.usuario_destino,
        area: relacion.prestamo.area,

        fecha_prestamo: relacion.prestamo.fecha_prestamo,
        fecha_devolucion: relacion.prestamo.fecha_devolucion,

        observaciones: relacion.prestamo.observaciones,
        evidencia: relacion.prestamo.evidencia,

        equipo: relacion.equipo?.equipo || null,
        descripcion: relacion.equipo?.descripcion || null,
        equipo_area: relacion.equipo?.area || null,

        estado_equipo: relacion.equipo?.estado || null,
        responsable: relacion.equipo?.responsable || null,
        fecha_adquisicion: relacion.equipo?.fecha_adquisicion || null,
        fecha_asignacion: relacion.equipo?.fecha_asignacion || null,
        fecha_baja: relacion.equipo?.fecha_baja || null,
        sistema_operativo: relacion.equipo?.sistema_operativo || null,
        imagen: relacion.equipo?.imagen || null
    }))
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticasData = async () => {

    const [
        total,
        disponibles,
        prestados,
        mantenimiento,
        baja
    ] = await Promise.all([

        prisma.equipos.count(),

        prisma.equipos.count({
            where: {
                estado: 'Disponible'
            }
        }),

        // Contar préstamos activos y parciales

        prisma.prestamos.count({
            where: {
                estado: {
                    in: ['activo', 'parcial']
                }
            }
        }),

        prisma.equipos.count({
            where: {
                estado: 'En mantenimiento'
            }
        }),

        prisma.equipos.count({
            where: {
                estado: 'Baja'
            }
        })
    ])

    return {
        total,
        disponibles,
        prestados,
        mantenimiento,
        baja
    }
}

// Registra la devolución parcial de un equipo específico dentro de un préstamo
exports.devolverEquipoParcialTransaction = async (id_prestamo, num_serie, observaciones) => {
    const client = await db.pool.connect()

    try {
        await client.query('BEGIN')

        // 1. Verificar si existe la relación en la tabla intermedia
        const { rows: peRows } = await client.query(
            `SELECT * FROM prestamo_equipos WHERE id_prestamo = $1 AND num_serie = $2`,
            [id_prestamo, num_serie]
        )

        const prestamoEquipo = peRows[0]

        if (!prestamoEquipo) {
            throw new Error('EQUIPO_NO_ENCONTRADO_EN_PRESTAMO')
        }

        if (prestamoEquipo.estado === 'devuelto') {
            throw new Error('EQUIPO_YA_DEVUELTO')
        }

        // 2. Actualizar el estado del equipo en la tabla intermedia a 'devuelto'
        await client.query(
            `UPDATE prestamo_equipos SET estado = 'devuelto' WHERE id_prestamo = $1 AND num_serie = $2`,
            [id_prestamo, num_serie]
        )

        // 3. Cambiar el estado del equipo general en la tabla 'equipos' a 'Disponible' y limpiar responsable
        await client.query(
            `UPDATE equipos SET estado = 'Disponible', responsable = NULL WHERE num_serie = $1`,
            [num_serie]
        )

        // 4. Verificar cuántos equipos siguen pendientes (estado 'prestado' o distinto de 'devuelto') en este préstamo
        const { rows: countRows } = await client.query(
            `SELECT COUNT(*)::int as pendientes FROM prestamo_equipos WHERE id_prestamo = $1 AND estado != 'devuelto'`,
            [id_prestamo]
        )

        const equiposPendientes = countRows[0].pendientes

        // 5. Si ya no quedan equipos pendientes, se finaliza el préstamo; si no, queda como parcial
        if (equiposPendientes === 0) {
            await client.query(
                `UPDATE prestamos SET estado = 'finalizado', fecha_devolucion = CURRENT_DATE, observaciones = COALESCE($2, observaciones) WHERE id_prestamo = $1`,
                [id_prestamo, observaciones || null]
            )
        } else {
            await client.query(
                `UPDATE prestamos SET estado = 'parcial' WHERE id_prestamo = $1`,
                [id_prestamo]
            )
        }

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
};