const equiposService = require('../services/equiposService')
const { eliminarArchivo } = require('../middlewares/upload')
const notificacionesService = require('../services/notificacionesService')
const prisma = require('../lib/prisma')
const auditoriaService = require('../services/auditoriaService')

// ======================================================
// OBTENER ESTADOS DE EQUIPOS
// ======================================================

exports.getEstadosEquipo = async (req, res) => {


try {

    const estados = await equiposService.findEstados()

    res.json(estados)

} catch (error) {

    console.error('Error al obtener estados:', error)

    res.status(500).json({
        error: 'Error en la consulta'
    })
}


}

// ======================================================
// OBTENER EQUIPOS
// ======================================================

exports.getEquipos = async (req, res) => {


try {

    const equipos = await equiposService.findEquipos()

    res.json(equipos)

} catch (error) {

    console.error('Error al obtener equipos:', error)

    res.status(500).json({
        error: 'Error en la consulta'
    })
}


}

// ======================================================
// REGISTRAR EQUIPO
// ======================================================

exports.agregarEquipo = async (req, res) => {


const archivo = req.file

try {

    const equipo = await equiposService.crearEquipo({

        ...req.body,

        imagen: archivo?.filename || null

    })


    await auditoriaService.registrar(

        req.usuario.usuario,

        `Registró el equipo ${equipo.equipo} (${equipo.num_serie}) en el inventario`

    )


    res.status(201).json({

        mensaje: 'Equipo registrado exitosamente',

        equipo

    })

} catch (error) {

    if (archivo) {

        eliminarArchivo(archivo.filename)

    }


    console.error(

        'Error al registrar equipo:',

        error.message,

        error.code

    )


    if (error.message === 'EQUIPO_DUPLICADO') {

        return res.status(409).json({

            error: 'Ya existe un equipo con ese número de serie'

        })

    }


    if (error.message === 'ESTADO_INVALIDO') {

        return res.status(400).json({

            error: 'El estado inicial del equipo es inválido'

        })

    }


    if (error.message === 'SOLO_IMAGENES') {

        return res.status(400).json({

            error: 'Solo se permiten imágenes (jpg, png, webp)'

        })

    }


    if (

        error.message &&

        error.message.includes('requerido')

    ) {

        return res.status(400).json({

            error: error.message

        })

    }


    res.status(500).json({

        error: 'Error al registrar el equipo'

    })

}


}

// ======================================================
// ASIGNAR USUARIO
// ======================================================

exports.asignarUsuario = async (req, res) => {


try {

    const {

        num_serie,

        usuario

    } = req.body


    if (!num_serie || !usuario) {

        return res.status(400).json({

            error: 'El número de serie y el usuario son requeridos'

        })

    }


    // ==================================================
    // BUSCAR EQUIPO
    // ==================================================

    const equipo = await prisma.equipos.findUnique({

        where: {

            num_serie

        }

    })


    if (!equipo) {

        return res.status(404).json({

            error: 'Equipo no encontrado'

        })

    }


    // ==================================================
    // BUSCAR USUARIO
    // ==================================================

    const usuarioEncontrado =

        await equiposService.buscarUsuario(usuario)


    if (!usuarioEncontrado) {

        return res.status(404).json({

            error: 'Usuario no encontrado'

        })

    }


    // ==================================================
    // ACTUALIZAR RESPONSABLE
    // ==================================================

    await equiposService.updateResponsable(

        num_serie,

        usuario

    )


    await auditoriaService.registrar(

        req.usuario.usuario,

        `Asignó el equipo ${num_serie} a ${usuario}`

    )


    res.status(200).json({

        mensaje:

            'Se asignó exitosamente el usuario al equipo correspondiente'

    })

} catch (error) {

    console.error(

        'Error al asignar usuario al equipo:',

        error

    )


    if (error.code === 'P2025') {

        return res.status(404).json({

            error: 'Equipo no encontrado'

        })

    }


    res.status(500).json({

        error: 'Error al asignar el usuario al equipo'

    })

}

}


// ======================================================
// LIBERAR EQUIPO
// ======================================================

exports.liberarEquipo = async (req, res) => {
    try {
        const equipo = await equiposService.liberarEquipo(req.params.num_serie)
        if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Liberó el equipo ${equipo.num_serie} (${equipo.equipo}), quedó disponible`)
        res.status(200).json({ mensaje: 'Equipo liberado y disponible nuevamente', equipo })
    } catch (error) {
        console.error('Error al liberar equipo:', error)
        res.status(500).json({ error: 'Error al liberar el equipo' })
    }
}

// ======================================================
// REPORTAR FALLA
// ======================================================

exports.reporteFalla = async (req, res) => {


try {

    const {
        num_serie,
        falla
    } = req.body


    // ==================================================
    // VALIDAR DATOS
    // ==================================================

    if (!num_serie || !falla) {

        return res.status(400).json({

            error: 'Número de serie y falla son obligatorios'

        })

    }


    // ==================================================
    // BUSCAR EQUIPO
    // ==================================================

    const equipo = await prisma.equipos.findUnique({

        where: {

            num_serie

        }

    })


    if (!equipo) {

        return res.status(404).json({

            error: 'El equipo no existe'

        })

    }


    // ==================================================
    // SABER QUIÉN REPORTA
    // ==================================================

    const usuarioReporta = req.usuario.usuario
    const rolUsuario = req.usuario.rol
    console.log('================================')
console.log('USUARIO QUE REPORTA:', req.usuario)
console.log('ROL:', req.usuario.rol)
console.log('================================')


    // ==================================================
    // DETERMINAR SI ES ADMIN
    // ==================================================

    const esAdmin =

        String(rolUsuario || '').toLowerCase() === 'admin'


    // ==================================================
    // ESTADO DE LA ORDEN
    // ==================================================

    const estadoOrden = esAdmin

        ? 'aprobada'

        : 'pendiente'


    const aprobadoPor = esAdmin

        ? usuarioReporta

        : null


    // ==================================================
    // GENERAR ID DEL HISTORIAL
    // ==================================================

    const ultimo =

        await prisma.historial_mantenimientos.findFirst({

            orderBy: {

                id_historial: 'desc'

            },

            select: {

                id_historial: true

            }

        })


    const id_historial = ultimo

        ? String(Number(ultimo.id_historial) + 1)

        : '1'


    // ==================================================
    // CREAR REPORTE
    // ==================================================

    const resultado =

        await equiposService.createReporteTransaction(

            num_serie,

            id_historial,

            new Date(),

            falla.trim(),

            req.file ? req.file.filename : null,

            estadoOrden,

            aprobadoPor,

            usuarioReporta,

            // IMPORTANTE:
            // ENVIAR EL ROL DEL USUARIO
            rolUsuario

        )


    // ==================================================
    // AUDITORÍA
    // ==================================================

    await auditoriaService.registrar(

        usuarioReporta,

        esAdmin

            ? `Registró y aprobó automáticamente la orden ${id_historial} del equipo ${num_serie}`

            : `Reportó una falla del equipo ${num_serie}`

    )


    // ==================================================
    // SI ES ADMINISTRADOR
    // NOTIFICAR A MANTENIMIENTO
    // ==================================================

    if (esAdmin) {

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

                `La orden ${resultado.id_historial} del equipo ${resultado.num_serie} fue registrada y aprobada automáticamente por el administrador ${usuarioReporta}. Diagnóstico: ${resultado.falla}. Ya puedes realizar la reparación.`

            )

        }

    }


    // ==================================================
    // RESPUESTA
    // ==================================================

    res.status(201).json({

        mensaje: esAdmin

            ? 'Reporte registrado y aprobado automáticamente'

            : 'Reporte registrado. Pendiente de aprobación del administrador',

        reporte: resultado

    })

} catch (error) {

    console.error(

        'Error al registrar reporte:',

        error

    )


    if (error.code === 'P2002') {

        return res.status(409).json({

            error: 'Ya existe un reporte con ese ID'

        })

    }


    res.status(500).json({

        error: 'No se pudo registrar el reporte'

    })

}


}

// ======================================================
// APROBAR / RECHAZAR ORDEN
// SOLO ADMIN
// ======================================================

exports.aprobarRechazarOrden = async (req, res) => {


try {

    const {

        id_historial,

        decision

    } = req.body


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (!id_historial || !decision) {

        return res.status(400).json({

            error: 'El ID de historial y la decisión son requeridos'

        })

    }


    if (

        decision !== 'aprobada' &&

        decision !== 'rechazada'

    ) {

        return res.status(400).json({

            error: 'Decisión inválida'

        })

    }


    // ==================================================
    // SOLO ADMIN
    // ==================================================

    if (

        !req.usuario ||

        String(req.usuario.rol || '').toLowerCase() !== 'admin'

    ) {

        return res.status(403).json({

            error: 'Solo el administrador puede aprobar o rechazar órdenes'

        })

    }


    // ==================================================
    // DECIDIR ORDEN
    // ==================================================

    const resultado =

        await equiposService.decidirOrden(

            String(id_historial),

            decision,

            req.usuario.usuario

        )


    if (!resultado) {

        return res.status(409).json({

            error: 'La orden no existe o ya fue procesada'

        })

    }


    // ==================================================
    // AUDITORÍA
    // ==================================================

    const accion =

        decision === 'aprobada'

            ? 'Aprobó'

            : 'Rechazó'


    await auditoriaService.registrar(

        req.usuario.usuario,

        `${accion} la orden de mantenimiento ${resultado.id_historial}`

    )


    // ==================================================
    // SI SE APRUEBA
    // NOTIFICAR AL USUARIO Y A MANTENIMIENTO
    // ==================================================

    if (decision === 'aprobada') {

        // ==================================================
        // BUSCAR EQUIPO
        // ==================================================

        const equipo =

            await prisma.equipos.findUnique({

                where: {

                    num_serie: resultado.num_serie

                }

            })


        // ==================================================
        // NOTIFICAR AL USUARIO QUE REPORTÓ
        // ==================================================

        if (resultado.usuario_reporta) {

            await notificacionesService.crear(

                resultado.usuario_reporta,

                'mantenimiento',

                `Tu reporte de daño de la orden ${resultado.id_historial} fue aprobado por el administrador ${req.usuario.usuario}. Equipo: ${equipo?.equipo || 'No disponible'}, número de serie ${resultado.num_serie}. El personal de mantenimiento ya puede realizar la reparación.`

            )

        }


        // ==================================================
        // BUSCAR PERSONAL DE MANTENIMIENTO
        // ==================================================

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


        // ==================================================
        // NOTIFICAR A MANTENIMIENTO
        // ==================================================

        for (const tecnico of usuariosMantenimiento) {

            await notificacionesService.crear(

                tecnico.usuario,

                'mantenimiento',

                `La orden ${resultado.id_historial} fue aprobada por ${req.usuario.usuario}. Equipo: ${equipo?.equipo || 'No disponible'}. Número de serie: ${resultado.num_serie}. Diagnóstico: ${resultado.falla}. Ya puedes realizar la reparación.`

            )

        }

    }


    // ==================================================
    // SI SE RECHAZA
    // NOTIFICAR AL USUARIO
    // ==================================================

    if (

        decision === 'rechazada' &&

        resultado.usuario_reporta

    ) {

        await notificacionesService.crear(

            resultado.usuario_reporta,

            'mantenimiento',

            `Tu reporte de daño de la orden ${resultado.id_historial} fue rechazado por el administrador ${req.usuario.usuario}. El equipo vuelve a estar disponible.`

        )

    }


    // ==================================================
    // RESPUESTA
    // ==================================================

    res.status(200).json({

        mensaje:

            decision === 'aprobada'

                ? 'Orden aprobada. Se notificó al usuario y al personal de mantenimiento'

                : 'Orden rechazada. Se notificó al usuario y el equipo regresa a disponible',

        ...resultado

    })

} catch (error) {

    console.error(

        'Error al decidir la orden:',

        error

    )


    res.status(500).json({

        error: 'Error al procesar la orden'

    })

}


}

// ======================================================
// OBTENER REPORTES
// ======================================================

exports.getReportes = async (req, res) => {


try {

    const reportes =

        await equiposService.findReportesPendientes()


    res.json(reportes)

} catch (error) {

    console.error(

        'Error al obtener reportes:',

        error

    )


    res.status(500).json({

        error: 'Error en la consulta'

    })

}


}

// ======================================================
// HISTORIAL DE MANTENIMIENTOS
// ======================================================

exports.getHistorialMantenimientos = async (req, res) => {


try {

    const historial =

        await equiposService.findHistorialCompleto()


    res.json(historial)

} catch (error) {

    console.error(

        'Error al obtener historial de mantenimientos:',

        error

    )


    res.status(500).json({

        error: 'Error en la consulta'

    })

}


}

// ======================================================
// RESOLVER REPORTE
// SOLO MANTENIMIENTO
// ======================================================

exports.resolverReporte = async (req, res) => {

    try {

        // ==================================================
        // SEGURIDAD
        // ==================================================

        if (
            !req.usuario ||
            req.usuario.rol?.toLowerCase() !== 'mantenimiento'
        ) {

            return res.status(403).json({

                error:
                    'Solo el personal de mantenimiento puede reparar equipos'

            })

        }


        // ==================================================
        // RECIBIR DATOS
        // ==================================================

        const {
            num_serie,
            id_historial,
            tecnico,
            solucion
        } = req.body


        // ==================================================
        // MOSTRAR EN CONSOLA LOS DATOS RECIBIDOS
        // ==================================================

        console.log(
            '=========================================='
        )

        console.log(
            'DATOS RECIBIDOS PARA RESOLVER:'
        )

        console.log(
            'num_serie:',
            num_serie
        )

        console.log(
            'id_historial:',
            id_historial
        )

        console.log(
            'tecnico:',
            tecnico
        )

        console.log(
            'solucion:',
            solucion
        )

        console.log(
            'BODY COMPLETO:',
            req.body
        )

        console.log(
            '=========================================='
        )


        // ==================================================
        // VALIDAR DATOS
        // ==================================================

        if (
            !num_serie ||
            !id_historial ||
            !tecnico ||
            !solucion
        ) {

            console.log(
                '❌ FALTAN DATOS PARA REGISTRAR LA SOLUCIÓN'
            )

            return res.status(400).json({

                error:
                    'Todos los campos requeridos deben estar completos'

            })

        }


        // ==================================================
        // LIMPIAR DATOS
        // ==================================================

        const numSerieLimpio =
            String(num_serie).trim()

        const idHistorialLimpio =
            String(id_historial).trim()

        const tecnicoLimpio =
            String(tecnico).trim()

        const solucionLimpia =
            String(solucion).trim()


        // ==================================================
        // VALIDAR QUE NO ESTÉN VACÍOS
        // ==================================================

        if (
            !numSerieLimpio ||
            !idHistorialLimpio ||
            !tecnicoLimpio ||
            !solucionLimpia
        ) {

            return res.status(400).json({

                error:
                    'Los datos no pueden estar vacíos'

            })

        }


        // ==================================================
        // GUARDAR SOLUCIÓN
        // ==================================================

        console.log(
            '🔄 Intentando registrar solución...'
        )

        const resultado =
            await equiposService.resolverReporteTransaction(

                numSerieLimpio,

                idHistorialLimpio,

                new Date(),

                tecnicoLimpio,

                solucionLimpia

            )


        // ==================================================
        // VERIFICAR RESULTADO
        // ==================================================

        if (!resultado) {

            console.log(
                '❌ No se encontró una orden aprobada'
            )

            return res.status(409).json({

                error:
                    'La orden no está aprobada por el administrador o no existe'

            })

        }


        // ==================================================
        // AUDITORÍA
        // ==================================================

        await auditoriaService.registrar(

            req.usuario.usuario,

            `Resolvió la orden ${idHistorialLimpio} del equipo ${numSerieLimpio}`

        )


        // ==================================================
        // NOTIFICAR A QUIEN REPORTÓ
        // ==================================================

        if (resultado.usuario_reporta) {

            await notificacionesService.crear(

                resultado.usuario_reporta,

                'mantenimiento',

                `La orden ${resultado.id_historial} del equipo ${numSerieLimpio} fue solucionada por ${tecnicoLimpio}.`

            )

        }


        // ==================================================
        // CONFIRMACIÓN EN CONSOLA
        // ==================================================

        console.log(
            '✅ SOLUCIÓN REGISTRADA CORRECTAMENTE'
        )

        console.log(
            'Orden:',
            resultado.id_historial
        )

        console.log(
            'Equipo:',
            numSerieLimpio
        )

        console.log(
            'Técnico:',
            tecnicoLimpio
        )

        console.log(
            'Solución:',
            solucionLimpia
        )


        // ==================================================
        // RESPUESTA
        // ==================================================

        res.status(200).json({

            mensaje:
                'Estado del equipo actualizado a disponible y mantenimiento registrado',

            reporte: resultado

        })


    } catch (error) {

        console.error(
            '=========================================='
        )

        console.error(
            '❌ ERROR AL RESOLVER REPORTE:'
        )

        console.error(
            error
        )

        console.error(
            '=========================================='
        )


        // ==================================================
        // ERROR PRISMA
        // ==================================================

        if (error.code === 'P2025') {

            return res.status(404).json({

                error:
                    'Equipo o reporte no encontrado'

            })

        }


        // ==================================================
        // ERROR GENERAL
        // ==================================================

        res.status(500).json({

            error:
                'Error al actualizar el reporte'

        })

    }

}

// ======================================================
// BUSCAR MANTENIMIENTOS
// ======================================================

exports.buscarMantenimientos = async (req, res) => {


try {

    const filtro = req.body.filter


    if (!filtro) {

        return res.status(400).json({

            error:

                'Debe proporcionar un filtro'

        })

    }


    const resultados =

        await equiposService.buscarMantenimientos(

            filtro

        )


    res.json(resultados)

} catch (error) {

    console.error(

        'Error al buscar mantenimientos:',

        error

    )


    res.status(500).json({

        error:

            'Error en la consulta'

    })

}


}
