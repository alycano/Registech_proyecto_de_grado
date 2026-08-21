const prisma = require('../lib/prisma')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

// OBTENER TODOS LOS PRESTAMOS
exports.getPrestamos = async (req, res) => {
    try {
        const prestamos = await prisma.prestamos.findMany({
            include: {
                equipos: true
            },
            orderBy: {
                fecha_prestamo: 'desc'
            }
        })

        res.json(prestamos)

    } catch (error) {
        console.error('Error al obtener prestamos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos'
        })
    }
}

// OBTENER PRESTAMOS ACTIVOS
exports.getPrestamosActivos = async (req, res) => {
    try {
        const prestamos = await prisma.prestamos.findMany({
            where: {
                estado: 'activo'
            },
            include: {
                equipos: true
            },
            orderBy: {
                fecha_prestamo: 'desc'
            }
        })

        res.json(prestamos)

    } catch (error) {
        console.error('Error al obtener prestamos activos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos activos'
        })
    }
}

// CREAR UN NUEVO PRESTAMO
exports.crearPrestamo = async (req, res) => {
    const { num_serie, usuario_destino, observaciones } = req.body

    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const usuarioLimpio = sanitizarTexto(usuario_destino, 50)
    const observacionesLimpias = observaciones
        ? sanitizarHtml(observaciones, 500)
        : null

    if (!numSerieLimpio || !usuarioLimpio) {
        return res.status(400).json({
            error: 'El numero de serie y el usuario destino son requeridos'
        })
    }

    try {
        await prisma.$transaction(async (tx) => {

            const equipo = await tx.equipos.findUnique({
                where: {
                    num_serie: numSerieLimpio
                }
            })

            if (!equipo) {
                throw new Error('EQUIPO_NO_ENCONTRADO')
            }

            if (equipo.estado !== 'Disponible') {
                throw new Error('EQUIPO_NO_DISPONIBLE')
            }

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
                where: {
                    num_serie: numSerieLimpio
                },
                data: {
                    estado: 'Asignado',
                    responsable: usuarioLimpio
                }
            })
        })

        res.status(201).json({
            mensaje: 'Prestamo registrado exitosamente'
        })

    } catch (error) {

        if (error.message === 'EQUIPO_NO_ENCONTRADO') {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            })
        }

        if (error.message === 'EQUIPO_NO_DISPONIBLE') {
            return res.status(400).json({
                error: 'El equipo no esta disponible para prestamo'
            })
        }

        console.error('Error al crear prestamo:', error)

        res.status(500).json({
            error: 'Error al crear prestamo'
        })
    }
}

// DEVOLVER UN PRESTAMO
exports.devolverPrestamo = async (req, res) => {
    const { id } = req.params

    const idLimpio = sanitizarTexto(id, 50)

    if (!idLimpio) {
        return res.status(400).json({
            error: 'El id del prestamo es requerido'
        })
    }

    try {
        await prisma.$transaction(async (tx) => {

            const prestamo = await tx.prestamos.findUnique({
                where: {
                    id_prestamo: idLimpio
                }
            })

            if (!prestamo) {
                throw new Error('PRESTAMO_NO_ENCONTRADO')
            }

            if (prestamo.estado !== 'activo') {
                throw new Error('PRESTAMO_YA_DEVUELTO')
            }

            await tx.prestamos.update({
                where: {
                    id_prestamo: idLimpio
                },
                data: {
                    fecha_devolucion: new Date(),
                    estado: 'devuelto'
                }
            })

            await tx.equipos.update({
                where: {
                    num_serie: prestamo.num_serie
                },
                data: {
                    estado: 'Disponible',
                    responsable: null
                }
            })
        })

        res.status(200).json({
            mensaje: 'Devolucion registrada exitosamente'
        })

    } catch (error) {

        if (error.message === 'PRESTAMO_NO_ENCONTRADO') {
            return res.status(404).json({
                error: 'Prestamo no encontrado'
            })
        }

        if (error.message === 'PRESTAMO_YA_DEVUELTO') {
            return res.status(400).json({
                error: 'Este prestamo ya fue devuelto'
            })
        }

        console.error('Error al devolver prestamo:', error)

        res.status(500).json({
            error: 'Error al devolver prestamo'
        })
    }
}

// HISTORIAL DE PRESTAMOS DE UN EQUIPO
exports.historialEquipo = async (req, res) => {
    const { num_serie } = req.params

    const numSerieLimpio = sanitizarTexto(num_serie, 50)

    if (!numSerieLimpio) {
        return res.status(400).json({
            error: 'El numero de serie es requerido'
        })
    }

    try {
        const historial = await prisma.prestamos.findMany({
            where: {
                num_serie: numSerieLimpio
            },
            include: {
                equipos: true
            },
            orderBy: {
                fecha_prestamo: 'desc'
            }
        })

        res.json(historial)

    } catch (error) {
        console.error('Error al obtener historial:', error)

        res.status(500).json({
            error: 'Error al obtener historial'
        })
    }
}

// CONTAR ESTADOS PARA DASHBOARD
exports.getEstadisticas = async (req, res) => {
    try {
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

            prisma.prestamos.count({
                where: {
                    estado: 'activo'
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

        res.json({
            total,
            disponibles,
            prestados,
            mantenimiento,
            baja
        })

    } catch (error) {
        console.error('Error al obtener estadisticas:', error)

        res.status(500).json({
            error: 'Error al obtener estadisticas'
        })
    }
}
