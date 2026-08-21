const prisma = require('../lib/prisma')
const { formatDate } = require('../utils/date')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')


// OBTENER TODOS LOS ESTADOS DE LOS EQUIPOS
exports.getEstadosEquipo = async (req, res) => {
    try {
        const estados = await prisma.estados_equipos.findMany()

        res.json(estados)
    } catch (error) {
        console.error('Error al obtener estados:', error)

        res.status(500).json({
            error: 'Error en la consulta'
        })
    }
}

// OBTENER TODOS LOS EQUIPOS
exports.getEquipos = async (req, res) => {
    try {
        const equipos = await prisma.equipos.findMany()

        res.json(equipos)
    } catch (error) {
        console.error('Error al obtener equipos:', error)

        res.status(500).json({
            error: 'Error en la consulta'
        })
    }
}

// ASIGNAR USUARIO A UN EQUIPO
exports.asignarUsuario = async (req, res) => {
    const { num_serie, usuario } = req.body

    const numSerieLimpio = sanitizarTexto(num_serie, 50)

    if (!numSerieLimpio) {
        return res.status(400).json({
            error: 'El numero de serie es requerido'
        })
    }

    const responsable = sanitizarTexto(usuario, 50) || null

    try {
        const equipo = await prisma.equipos.update({
            where: {
                num_serie: numSerieLimpio
            },
            data: {
                responsable
            }
        })

        res.status(200).json({
            mensaje: 'Se asigno exitosamente el usuario al equipo correspondiente'
        })

    } catch (error) {
        console.error('Error al asignar usuario al equipo:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al asignar usuario al equipo'
        })
    }
}

// REGISTRAR UN NUEVO REPORTE DE FALLA
exports.reporteFalla = async (req, res) => {
    const { num_serie, falla } = req.body

    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const fallaLimpia = sanitizarHtml(falla, 500)

    if (!numSerieLimpio || !fallaLimpia) {
        return res.status(400).json({
            error: 'El numero de serie y la falla son requeridos'
        })
    }

    const fecha_reporte = new Date()
    const id_historial = Date.now().toString()

    try {
        await prisma.$transaction(async (tx) => {

            await tx.equipos.update({
                where: {
                    num_serie: numSerieLimpio
                },
                data: {
                    estado: 'En mantenimiento'
                }
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

        res.status(200).json({
            mensaje: 'Estado actualizado a mantenimiento y reporte registrado exitosamente'
        })

    } catch (error) {
        console.error('Error al registrar reporte:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al registrar el reporte'
        })
    }
}

// OBTENER LOS MANTENIMIENTOS PENDIENTES ORDENADOS POR FECHA DE REPORTE
exports.getReportes = async (req, res) => {
    try {
        const reportes = await prisma.historial_mantenimientos.findMany({
            where: {
                fecha_solucion: null
            },
            orderBy: {
                fecha_reporte: 'asc'
            }
        })

        res.json(reportes)

    } catch (error) {
        console.error('Error al obtener reportes:', error)

        res.status(500).json({
            error: 'Error en la consulta'
        })
    }
}

// ACTUALIZAR LA SOLUCION EN EL HISTORIAL Y CAMBIAR EL ESTADO DEL EQUIPO
exports.resolverReporte = async (req, res) => {
    const { num_serie, id_historial, tecnico, solucion } = req.body

    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const idHistorialLimpio = sanitizarTexto(id_historial, 30)
    const tecnicoLimpio = sanitizarTexto(tecnico, 50)
    const solucionLimpia = sanitizarHtml(solucion, 1000)

    if (!numSerieLimpio || !idHistorialLimpio || !tecnicoLimpio || !solucionLimpia) {
        return res.status(400).json({
            error: 'El numero de serie, id_historial, tecnico y solucion son requeridos'
        })
    }

    const fecha_solucion = new Date()

    try {
        await prisma.$transaction(async (tx) => {

            await tx.equipos.update({
                where: {
                    num_serie: numSerieLimpio
                },
                data: {
                    estado: 'Disponible'
                }
            })

            await tx.historial_mantenimientos.update({
                where: {
                    id_historial: idHistorialLimpio
                },
                data: {
                    fecha_solucion,
                    usuario_tecnico: tecnicoLimpio,
                    solucion: solucionLimpia
                }
            })
        })

        res.status(200).json({
            mensaje: 'Estado del equipo actualizado a activo y mantenimiento actualizado'
        })

    } catch (error) {
        console.error('Error al resolver reporte:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Equipo o reporte no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al actualizar el reporte'
        })
    }
}

// BUSCAR MANTENIMIENTOS POR FILTRO
exports.buscarMantenimientos = async (req, res) => {
    const { filter } = req.body

    const filtroLimpio = sanitizarTexto(filter, 100)

    if (!filtroLimpio) {
        return res.status(400).json({
            error: 'Se debe proporcionar al menos uno de los elementos'
        })
    }

    try {
        const resultados = await prisma.historial_mantenimientos.findMany({
            where: {
                solucion: {
                    not: null
                },
                OR: [
                    {
                        id_historial: filtroLimpio
                    },
                    {
                        num_serie: filtroLimpio
                    },
                    {
                        usuario_tecnico: filtroLimpio
                    }
                ]
            }
        })

        res.json(resultados)

    } catch (error) {
        console.error('Error al buscar mantenimientos:', error)

        res.status(500).json({
            error: 'Error en la consulta'
        })
    }
}