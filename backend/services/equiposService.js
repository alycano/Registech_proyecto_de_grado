const prisma = require('../lib/prisma')
const db = require('../lib/db')
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
// LIBERAR EQUIPO
// ======================================================

exports.liberarEquipo = async (numSerieLimpio) => {

    return await prisma.equipos.update({

        where: {
            num_serie: numSerieLimpio
        },

        data: {
            estado: 'Disponible',
            responsable: null
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

            estado: { equals: 'activo', mode: 'insensitive' }

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
// - Se notifica a SOPORTE
//
// SOPORTE / SISTEMAS:
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
    usuarioReporta = null
) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')

        // ==================================================
        // PONER EQUIPO EN MANTENIMIENTO
        // ==================================================

        await client.query(
            `UPDATE equipos
             SET estado = $1
             WHERE num_serie = $2`,
            [
                'En mantenimiento',
                numSerieLimpio
            ]
        )

        // ==================================================
        // FECHA DE APROBACIÓN
        // ==================================================

        const fechaAprobacion =
            estadoOrden === 'aprobada'
                ? new Date()
                : null

        // ==================================================
        // CREAR HISTORIAL
        // ==================================================

        const resultado = await client.query(
            `INSERT INTO historial_mantenimientos (
                id_historial,
                num_serie,
                fecha_reporte,
                usuario_reporta,
                falla,
                evidencia,
                estado_orden,
                aprobada_por,
                fecha_aprobacion
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7::varchar,
                $8,
                $9
            )
            RETURNING *`,
            [
                id_historial,
                numSerieLimpio,
                fecha_reporte,
                usuarioReporta || null,
                fallaLimpia,
                evidencia || null,
                estadoOrden,
                aprobadoPor || null,
                fechaAprobacion
            ]
        )

        await client.query('COMMIT')

        return resultado.rows[0]

    } catch (e) {

        await client.query('ROLLBACK')

        throw e

    } finally {

        client.release()
    }
}


// ======================================================
// ANEXAR NOMBRE REAL DEL TÉCNICO Y DE QUIEN REPORTA
// ======================================================

async function anexarNombresUsuarios(lista) {

    const usuarios =
        await prisma.usuarios.findMany({

            select: {
                usuario: true,
                nombre: true
            }

        })

    const mapa = new Map(
        usuarios.map(u => [u.usuario, u.nombre])
    )

    return lista.map(r => ({
        ...r,
        nombre_tecnico:
            r.usuario_tecnico
                ? (mapa.get(r.usuario_tecnico) || r.usuario_tecnico)
                : null,
        nombre_reporta:
            r.usuario_reporta
                ? (mapa.get(r.usuario_reporta) || r.usuario_reporta)
                : null
    }))
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


    return anexarNombresUsuarios(resultado)
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


    return anexarNombresUsuarios(resultado)
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


    return anexarNombresUsuarios(resultado)
}


// ======================================================
// HISTORIAL DE USO DE UN EQUIPO
// ======================================================

// ======================================================
// HISTORIAL DE USO DE UN EQUIPO
// ======================================================

exports.findHistorialEquipo = async (numSerie) => {

    const { rows } = await db.query(`
        SELECT
            p.id_prestamo,
            pe.num_serie,

            COALESCE(
                e.nombre,
                u.nombre
            ) AS usuario,

            COALESCE(
                e.nombre,
                u.nombre
            ) AS nombre,

            COALESCE(
                e.correo,
                u.correo
            ) AS correo,

            COALESCE(
                e.area,
                u.area,
                p.area
            ) AS area_usuario,

            u.rol,

            p.fecha_prestamo,
            p.fecha_devolucion,
            p.estado,
            pe.estado AS estado_equipo_prestamo,
            p.observaciones

        FROM prestamo_equipos pe

        INNER JOIN prestamos p
            ON p.id_prestamo = pe.id_prestamo

        LEFT JOIN empleados e
            ON e.id_empleado = p.id_empleado

        LEFT JOIN usuarios u
            ON u.id_usuario = p.id_usuario

        WHERE pe.num_serie = $1

        ORDER BY
            CASE
                WHEN pe.estado = 'prestado' THEN 1
                WHEN p.estado = 'activo' THEN 1
                WHEN p.estado = 'parcial' THEN 2
                WHEN pe.estado = 'devuelto' THEN 3
                WHEN p.estado = 'devuelto' THEN 3
                ELSE 4
            END,
            p.fecha_prestamo DESC

    `, [numSerie])

    return rows
}

exports.actualizarFotoEquipo = async (numSerie, urlImagen) => {
    return await prisma.equipos.update({
        where: { num_serie: numSerie },
        data: { imagen: urlImagen }
    })
}

// ======================================================
// MOVER EQUIPO DE DEPARTAMENTO / ÁREA
// ======================================================

exports.encontrarEquipo = async (numSerie) => {
    return await prisma.equipos.findUnique({
        where: { num_serie: numSerie }
    })
}

exports.verificarArea = async (area) => {
    const encontrada = await prisma.areas.findUnique({
        where: { area }
    })
    return !!encontrada
}

exports.moverEquipo = async (numSerie, area) => {
    return await prisma.equipos.update({
        where: { num_serie: numSerie },
        data: { area }
    })
}

// ======================================================
// REPORTAR EQUIPO NO LOCALIZADO (EXTRAVÍO)
// ======================================================

exports.reportarExtraviado = async (numSerie) => {
    return await prisma.equipos.findUnique({
        where: { num_serie: numSerie }
    })
}

// ======================================================
// REINTEGRAR EQUIPO EN LA BASE DE DATOS
// ======================================================

exports.reintegrarEquipo = async (num_serie) => {
    const equipoExistente = await prisma.equipos.findUnique({
        where: { num_serie }
    });

    if (!equipoExistente) return null;

    const equipoActualizado = await prisma.equipos.update({
        where: { num_serie },
        data: { 
            estado: 'Disponible' 
        }
    });

    return equipoActualizado;
};