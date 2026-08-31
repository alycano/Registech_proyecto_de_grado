const prisma = require('../lib/prisma')
const notificacionesService = require('./notificacionesService')
const crypto = require('crypto')


// ======================================================
// OBTENER ESTADOS DE EQUIPOS
// ======================================================

exports.findEstados = async () => {

    return await prisma.estados_equipos.findMany({
        orderBy: {
            estado: 'asc'
        }
    })
}


// ======================================================
// OBTENER EQUIPOS
// ======================================================

exports.findEquipos = async () => {

    return await prisma.equipos.findMany({
        orderBy: {
            num_serie: 'asc'
        }
    })
}


// ======================================================
// CREAR EQUIPO
// ======================================================

exports.crearEquipo = async (datos) => {

    try {

        const equipo = await prisma.equipos.create({

            data: {

                num_serie: datos.num_serie,
                equipo: datos.equipo,
                area: datos.area || 'Sin asignar',
                descripcion: datos.descripcion || null,
                sistema_operativo: datos.sistema_operativo || null,
                imagen: datos.imagen || null,
                estado: datos.estado,

                fecha_adquisicion: datos.fecha_adquisicion
                    ? new Date(datos.fecha_adquisicion)
                    : new Date()

            }

        })

        return equipo

    } catch (e) {

        if (e.code === 'P2002') {
            throw new Error('EQUIPO_DUPLICADO')
        }

        throw e
    }
}


// ======================================================
// ACTUALIZAR RESPONSABLE
// ======================================================

exports.updateResponsable = async (
    numSerieLimpio,
    responsable
) => {

    return await prisma.equipos.update({

        where: {
            num_serie: numSerieLimpio
        },

        data: {
            responsable
        }

    })
}


// ======================================================
// BUSCAR USUARIO
// ======================================================

exports.buscarUsuario = async (usuario) => {

    return await prisma.usuarios.findUnique({

        where: {
            usuario
        },

        select: {
            usuario: true,
            nombre: true,
            correo: true,
            rol: true
        }

    })
}


// ======================================================
// OBTENER USUARIOS POR ROL
// ======================================================

exports.obtenerUsuariosPorRol = async (rol) => {

    return await prisma.usuarios.findMany({

        where: {

            rol,

            estado: 'Activo'

        },

        select: {

            usuario: true,
            nombre: true,
            correo: true,
            rol: true

        },

        orderBy: {

            usuario: 'asc'

        }

    })
}


// ======================================================
// CREAR REPORTE DE FALLA
//
// ADMIN:
// - Reporta
// - Se aprueba automáticamente
// - Se notifica a mantenimiento
//
// USUARIO:
// - Reporta
// - Queda pendiente
// - Se notifica a los administradores
// ======================================================

exports.createReporteTransaction = async (

    numSerieLimpio,
    id_historial,
    fecha_reporte,
    fallaLimpia,
    evidencia,
    estadoOrden = 'pendiente',
    aprobadoPor = null,
    usuarioReporta = null,
    rolUsuario = null

) => {

    const esAdmin =
        String(rolUsuario || '').toLowerCase() === 'admin'


    // ==================================================
    // SI ES ADMIN
    // ==================================================

    if (esAdmin) {

        estadoOrden = 'aprobada'

        aprobadoPor = usuarioReporta

    }


    const resultado = await prisma.$transaction(async (tx) => {


        // ==============================================
        // BUSCAR EQUIPO
        // ==============================================

        const equipo = await tx.equipos.findUnique({

            where: {

                num_serie: numSerieLimpio

            }

        })


        if (!equipo) {

            throw new Error('EQUIPO_NO_ENCONTRADO')

        }


        // ==============================================
        // ACTUALIZAR ESTADO DEL EQUIPO
        // ==============================================

        await tx.equipos.update({

            where: {

                num_serie: numSerieLimpio

            },

            data: {

                estado: 'En mantenimiento'

            }

        })


        // ==============================================
        // CREAR HISTORIAL
        // ==============================================

        const historial =
            await tx.historial_mantenimientos.create({

                data: {

                    id_historial,

                    num_serie: numSerieLimpio,

                    fecha_reporte:
                        new Date(fecha_reporte),

                    usuario_reporta:
                        usuarioReporta || null,

                    falla:
                        fallaLimpia,

                    evidencia:
                        evidencia || null,

                    estado_orden:
                        estadoOrden,

                    aprobada_por:
                        aprobadoPor || null,

                    fecha_aprobacion:
                        estadoOrden === 'aprobada'
                            ? new Date()
                            : null

                }

            })


        return {

            ...historial,

            equipo: equipo.equipo

        }

    })


    // ==================================================
    // NOTIFICACIONES
    // ==================================================

    if (esAdmin) {


        // ==============================================
        // ADMIN → MANTENIMIENTO
        // ==============================================

        const usuariosMantenimiento =
            await prisma.usuarios.findMany({

                where: {

                    rol: 'mantenimiento',

                    estado: 'Activo'

                },

                select: {

                    usuario: true

                }

            })


        for (const tecnico of usuariosMantenimiento) {

            await notificacionesService.crear(

                tecnico.usuario,

                'mantenimiento',

                `La orden ${resultado.id_historial} del equipo ${resultado.equipo} fue registrada y aprobada automáticamente por el administrador ${usuarioReporta}. Número de serie: ${resultado.num_serie}. Diagnóstico: ${resultado.falla}. Ya puedes realizar la reparación.`

            )

        }


    } else {


        // ==============================================
        // USUARIO → ADMINISTRADORES
        // ==============================================

        const administradores =
            await prisma.usuarios.findMany({

                where: {

                    rol: 'admin',

                    estado: 'Activo'

                },

                select: {

                    usuario: true

                }

            })


        for (const admin of administradores) {

            await notificacionesService.crear(

                admin.usuario,

                'mantenimiento',

                `Nueva orden de mantenimiento ${resultado.id_historial}. Equipo: ${resultado.equipo}. Número de serie: ${resultado.num_serie}. Reportada por: ${usuarioReporta}. Falla: ${resultado.falla}. Debes aprobarla o rechazarla.`

            )

        }

    }


    return resultado
}


// ======================================================
// OBTENER REPORTES ACTIVOS
//
// Muestra:
// - pendientes
// - aprobadas
//
// No muestra:
// - rechazadas
// - solucionadas
// ======================================================

exports.findReportesPendientes = async () => {

    const reportes =
        await prisma.historial_mantenimientos.findMany({

            where: {

                fecha_solucion: null,

                NOT: {

                    estado_orden: 'rechazada'

                }

            },

            orderBy: {

                fecha_reporte: 'asc'

            }

        })


    const resultado = []


    for (const reporte of reportes) {

        const equipo =
            await prisma.equipos.findUnique({

                where: {

                    num_serie: reporte.num_serie

                }

            })


        resultado.push({

            ...reporte,

            equipo:
                equipo?.equipo || null,

            area:
                equipo?.area || null,

            descripcion_equipo:
                equipo?.descripcion || null,

            estado_equipo:
                equipo?.estado || null,

            responsable:
                equipo?.responsable || null

        })

    }


    return resultado
}


// ======================================================
// HISTORIAL COMPLETO
// ======================================================

exports.findHistorialCompleto = async () => {

    const reportes =
        await prisma.historial_mantenimientos.findMany({

            orderBy: {

                fecha_reporte: 'desc'

            }

        })


    const resultado = []


    for (const reporte of reportes) {

        const equipo =
            await prisma.equipos.findUnique({

                where: {

                    num_serie: reporte.num_serie

                }

            })


        resultado.push({

            ...reporte,

            equipo:
                equipo?.equipo || null,

            area:
                equipo?.area || null,

            descripcion_equipo:
                equipo?.descripcion || null,

            estado_equipo:
                equipo?.estado || null,

            responsable:
                equipo?.responsable || null

        })

    }


    return resultado
}


// ======================================================
// BUSCAR REPORTE POR ID
// ======================================================

exports.buscarReportePorId = async (
    idHistorialLimpio
) => {

    const reporte =
        await prisma.historial_mantenimientos.findUnique({

            where: {

                id_historial:
                    idHistorialLimpio

            }

        })


    if (!reporte) {

        return null

    }


    const equipo =
        await prisma.equipos.findUnique({

            where: {

                num_serie:
                    reporte.num_serie

            }

        })


    return {

        ...reporte,

        equipo:
            equipo?.equipo || null,

        area:
            equipo?.area || null,

        descripcion_equipo:
            equipo?.descripcion || null,

        estado_equipo:
            equipo?.estado || null,

        responsable:
            equipo?.responsable || null

    }
}


// ======================================================
// APROBAR / RECHAZAR ORDEN
// ======================================================

exports.decidirOrden = async (

    idHistorialLimpio,
    decision,
    aprobadoPor = null

) => {

    return await prisma.$transaction(async (tx) => {


        // ==============================================
        // BUSCAR ORDEN
        // ==============================================

        const orden =
            await tx.historial_mantenimientos.findFirst({

                where: {

                    id_historial:
                        idHistorialLimpio,

                    estado_orden:
                        'pendiente',

                    fecha_solucion:
                        null

                }

            })


        if (!orden) {

            return null

        }


        // ==============================================
        // APROBAR
        // ==============================================

        if (decision === 'aprobada') {

            return await tx.historial_mantenimientos.update({

                where: {

                    id_historial:
                        idHistorialLimpio

                },

                data: {

                    estado_orden:
                        'aprobada',

                    aprobada_por:
                        aprobadoPor,

                    fecha_aprobacion:
                        new Date()

                }

            })

        }


        // ==============================================
        // RECHAZAR
        // ==============================================

        const resultado =
            await tx.historial_mantenimientos.update({

                where: {

                    id_historial:
                        idHistorialLimpio

                },

                data: {

                    estado_orden:
                        'rechazada'

                }

            })


        // ==============================================
        // EQUIPO DISPONIBLE
        // ==============================================

        await tx.equipos.update({

            where: {

                num_serie:
                    orden.num_serie

            },

            data: {

                estado:
                    'Disponible'

            }

        })


        return resultado

    })
}


// ======================================================
// RESOLVER REPORTE
// SOLO MANTENIMIENTO
// ======================================================

exports.resolverReporteTransaction = async (

    numSerieLimpio,
    idHistorialLimpio,
    fecha_solucion,
    tecnicoLimpio,
    solucionLimpia

) => {

    return await prisma.$transaction(async (tx) => {


        // ==============================================
        // BUSCAR ORDEN APROBADA
        // ==============================================

        const orden =
            await tx.historial_mantenimientos.findFirst({

                where: {

                    id_historial:
                        idHistorialLimpio,

                    estado_orden:
                        'aprobada',

                    fecha_solucion:
                        null

                }

            })


        if (!orden) {

            return null

        }


        // ==============================================
        // VERIFICAR QUE EL EQUIPO COINCIDA
        // ==============================================

        if (
            orden.num_serie !==
            numSerieLimpio
        ) {

            return null

        }


        // ==============================================
        // REGISTRAR SOLUCIÓN
        // ==============================================

        const resultado =
            await tx.historial_mantenimientos.update({

                where: {

                    id_historial:
                        idHistorialLimpio

                },

                data: {

                    fecha_solucion:
                        new Date(fecha_solucion),

                    usuario_tecnico:
                        tecnicoLimpio,

                    solucion:
                        solucionLimpia

                }

            })


        // ==============================================
        // EQUIPO DISPONIBLE
        // ==============================================

        await tx.equipos.update({

            where: {

                num_serie:
                    numSerieLimpio

            },

            data: {

                estado:
                    'Disponible'

            }

        })


        return resultado

    })
}


// ======================================================
// BUSCAR MANTENIMIENTOS
// ======================================================

exports.buscarMantenimientos = async (
    filtroLimpio
) => {

    const reportes =
        await prisma.historial_mantenimientos.findMany({

            where: {

                solucion: {

                    not: null

                },

                OR: [

                    {

                        id_historial: {

                            contains:
                                filtroLimpio,

                            mode:
                                'insensitive'

                        }

                    },

                    {

                        num_serie: {

                            contains:
                                filtroLimpio,

                            mode:
                                'insensitive'

                        }

                    },

                    {

                        usuario_tecnico: {

                            contains:
                                filtroLimpio,

                            mode:
                                'insensitive'

                        }

                    }

                ]

            },

            orderBy: {

                fecha_solucion:
                    'desc'

            }

        })


    const resultado = []


    for (const reporte of reportes) {

        const equipo =
            await prisma.equipos.findUnique({

                where: {

                    num_serie:
                        reporte.num_serie

                }

            })


        resultado.push({

            ...reporte,

            equipo:
                equipo?.equipo || null,

            area:
                equipo?.area || null

        })

    }


    return resultado
}