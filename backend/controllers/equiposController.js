const equiposService = require('../services/equiposService')
const { eliminarArchivo, UPLOADS_DIR } = require('../middlewares/upload')
const notificacionesService = require('../services/notificacionesService')
const prisma = require('../lib/prisma')
const auditoriaService = require('../services/auditoriaService')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { subirImagenSupabase, eliminarImagenSupabase } = require('../config/supabase')

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
        let imageUrl = null

        if (archivo) {
            // Generate a filename with extension
            const extension = archivo.originalname.split('.').pop()
            const filename = `equipo-${req.body.num_serie}-${Date.now()}.${extension}`
            // Upload buffer to Supabase
            imageUrl = await subirImagenSupabase(archivo.buffer, filename, archivo.mimetype)
        }

        const equipo = await equiposService.crearEquipo({
            ...req.body,
            imagen: imageUrl
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
        console.error('Error al registrar equipo:', error.message, error.code)

        if (error.message === 'EQUIPO_DUPLICADO') {
            return res.status(409).json({ error: 'Ya existe un equipo con ese número de serie' })
        }
        if (error.message === 'ESTADO_INVALIDO') {
            return res.status(400).json({ error: 'El estado inicial del equipo es inválido' })
        }
        if (error.message === 'SOLO_IMAGENES') {
            return res.status(400).json({ error: 'Solo se permiten imágenes (jpg, png, webp)' })
        }
        if (error.message && error.message.includes('requerido')) {
            return res.status(400).json({ error: error.message })
        }
        res.status(500).json({ error: 'Error al registrar el equipo' })
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
// REINTEGRAR EQUIPO (DESDE BAJA A DISPONIBLE)
// ======================================================

exports.reintegrarEquipo = async (req, res) => {
    try {
        const { num_serie } = req.params;
        
        // Llamamos al servicio para cambiar el estado a disponible (o el equivalente activo que manejen)
        const equipo = await equiposService.reintegrarEquipo(num_serie);
        
        if (!equipo) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        await auditoriaService.registrar(
            req.usuario.usuario, 
            `Reintegró el equipo ${equipo.num_serie} (${equipo.equipo}), volvió a estar disponible desde estado de baja`
        );

        res.status(200).json({ 
            mensaje: 'Equipo reintegrado exitosamente y disponible nuevamente', 
            equipo 
        });
    } catch (error) {
        console.error('Error al reintegrar equipo:', error);
        res.status(500).json({ error: 'Error al reintegrar el equipo' });
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

    const id_historial = crypto.randomUUID()

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
        usuarioReporta
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

                    estado: { equals: 'activo', mode: 'insensitive' }

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

            error: 'Solo el adminiDstrador puede aprobar o rechazar órdenes'

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

                    estado: { equals: 'activo', mode: 'insensitive' }

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

        const rolesMantenimiento = [
            'soporte',
            'admin'
        ]

        if (
            !req.usuario ||
            !rolesMantenimiento.includes(
                req.usuario.rol?.toLowerCase()
            )
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

// ======================================================
// OBTENER HISTORIAL DE USO DE UN EQUIPO
// ======================================================

exports.getHistorialEquipo = async (req, res) => {

    try {

        const numSerie = String(req.params.num_serie).trim()

        const historial =
            await equiposService.findHistorialEquipo(numSerie)

        res.json(historial)

    } catch (error) {

        console.error(
            'Error al obtener historial del equipo:',
            error
        )

        res.status(500).json({
            error: 'Error al obtener el historial del equipo'
        })

    }
}
// ======================================================
// ACTUALIZAR O ELIMINAR FOTO DE UN EQUIPO
// ======================================================

exports.actualizarFoto = async (req, res) => {
    try {
        const { num_serie } = req.params;
        const eliminar = req.body.eliminar === 'true';
        const file = req.file;

        // 1. Obtener el equipo actual para ver si ya tiene foto
        const equipoActual = await prisma.equipos.findUnique({
            where: { num_serie }
        });

        if (!equipoActual) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        let nuevaUrl = equipoActual.imagen;

        // 2. Si hay foto nueva o se pidió eliminar, borrar la anterior de Supabase
        if ((file || eliminar) && equipoActual.imagen && equipoActual.imagen.includes('supabase.co')) {
            await eliminarImagenSupabase(equipoActual.imagen);
            nuevaUrl = null;
        }

        // 3. Subir la nueva foto si existe
        if (file) {
            const extension = file.originalname.split('.').pop();
            const filename = `equipo-${num_serie}-${Date.now()}.${extension}`;
            nuevaUrl = await subirImagenSupabase(file.buffer, filename, file.mimetype);
        } else if (eliminar) {
            nuevaUrl = null;
        }

        // 4. Actualizar base de datos
        await equiposService.actualizarFotoEquipo(num_serie, nuevaUrl);

        res.json({ message: 'Foto actualizada exitosamente', imagen: nuevaUrl });

    } catch (error) {
        console.error('Error al actualizar foto del equipo:', error);
        res.status(500).json({ error: 'Error al actualizar foto del equipo' });
    }
}

// ======================================================
// MOVER EQUIPO DE DEPARTAMENTO / ÁREA
// ======================================================

exports.moverEquipo = async (req, res) => {
    try {
        const { num_serie } = req.params
        const area = req.body.area

        const existe = await equiposService.encontrarEquipo(num_serie)
        if (!existe) {
            return res.status(404).json({ error: 'El equipo no existe' })
        }

        const areaExiste = await equiposService.verificarArea(area)
        if (!areaExiste) {
            return res.status(400).json({ error: 'El departamento no existe' })
        }

        const actualizado = await equiposService.moverEquipo(num_serie, area)

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Movió el equipo ${actualizado.equipo} (${actualizado.num_serie}) al departamento ${area}`
        )

        await notificacionesService.crear(
            req.usuario.usuario,
            'equipos',
            `El equipo ${actualizado.equipo} (${actualizado.num_serie}) fue reubicado al departamento ${area}.`
        )

        res.json({
            mensaje: 'Equipo reubicado exitosamente',
            equipo: actualizado
        })
    } catch (error) {
        console.error('Error al mover equipo:', error)
        res.status(500).json({ error: 'Error al mover el equipo' })
    }
}

// ======================================================
// REPORTAR EQUIPO NO LOCALIZADO (EXTRAVÍO)
// ======================================================

exports.reportarEquipoExtraviado = async (req, res) => {
    try {
        const { num_serie } = req.params
        const observaciones = req.body.observaciones || ''

        const equipo = await equiposService.reportarExtraviado(num_serie)
        if (!equipo) {
            return res.status(404).json({ error: 'El equipo no existe' })
        }

        await notificacionesService.notificarAdmins(
            'extravio',
            `ALERTA: El equipo ${equipo.equipo} (${equipo.num_serie}) no aparece en el área ${equipo.area || 'Sin asignar'}${observaciones ? `. Detalle: ${observaciones}` : ''}.`
        )

        await notificacionesService.crear(
            req.usuario.usuario,
            'extravio',
            `Alertaste sobre el equipo ${equipo.equipo} (${equipo.num_serie}). Se notificó a los administradores.`
        )

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Reportó extravío del equipo ${equipo.equipo} (${equipo.num_serie})`
        )

        res.json({
            mensaje: 'Alerta de extravío enviada a los administradores',
            equipo
        })
    } catch (error) {
        console.error('Error al reportar extravío:', error)
        res.status(500).json({ error: 'Error al reportar el extravío' })
    }
}

// ======================================================
// SERVIR EVIDENCIA (IMAGEN) DE UN EQUIPO
// Solo usuarios autenticados pueden ver los archivos.
// Elimina el acceso público anterior bajo /uploads.
// ======================================================

exports.obtenerEvidencia = (req, res) => {

    const nombre = path.basename(req.params.nombre || '')

    if (
        !nombre ||
        nombre === '.' ||
        nombre === '..' ||
        nombre.includes('\\') ||
        nombre.includes('/')
    ) {
        return res.status(400).json({ error: 'Nombre de archivo inválido' })
    }

    const ruta = path.join(UPLOADS_DIR, nombre)

    if (!fs.existsSync(ruta)) {
        return res.status(404).json({ error: 'Evidencia no encontrada' })
    }

    res.sendFile(ruta)
}
