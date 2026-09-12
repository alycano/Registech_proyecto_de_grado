const prestamosService = require('../services/prestamosService')
const notificacionesService = require('../services/notificacionesService')
const auditoriaService = require('../services/auditoriaService')
const emailService = require('../services/emailService')


// ======================================================
// OBTENER TODOS LOS PRÉSTAMOS
// ======================================================

exports.getPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos'
        })
    }
}


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

exports.getPrestamosActivos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamosActivos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos activos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos activos'
        })
    }
}


// ======================================================
// BUSCAR PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

exports.getPrestamoActivoPorEquipo = async (req, res) => {

    try {

        const prestamo =
            await prestamosService.getPrestamoActivoPorEquipo(
                req.params.num_serie
            )

        if (!prestamo) {
            return res.status(404).json({
                error: 'No hay préstamo activo para este equipo'
            })
        }

        res.json(prestamo)

    } catch (error) {

        console.error(
            'Error al buscar préstamo activo:',
            error
        )

        res.status(500).json({
            error: 'Error al buscar préstamo activo'
        })
    }
}


// ======================================================
// CREAR PRÉSTAMO
// ======================================================

exports.crearPrestamo = async (req, res) => {

    try {

        const {
            num_series,
            id_empleado,
            id_usuario,
            observaciones,
            fecha_inicio,
            fecha_limite,
            enviarCorreo = true
        } = req.body


        // ==============================================
        // CREAR PRÉSTAMO
        // ==============================================

        const prestamoCreado =
            await prestamosService.crearPrestamo(
                num_series,
                id_empleado,
                id_usuario,
                observaciones,
                fecha_inicio,
                fecha_limite
            )


        // ==============================================
        // ENVIAR CORREO AL DESTINATARIO
        // ==============================================

        let correoEnviado = false

        if (enviarCorreo) {

            try {

                const prestamos =
                    await prestamosService.getPrestamos()

                const prestamoCompleto =
                    prestamos.find(
                        prestamo =>
                            prestamo.id_prestamo ===
                            prestamoCreado.id_prestamo
                    )

                if (prestamoCompleto) {

                    const correo =
                        prestamoCompleto.correo ||
                        prestamoCompleto.correo_empleado ||
                        prestamoCompleto.correo_usuario

                    if (correo) {

                        await emailService.enviarReciboPrestamo({
                            ...prestamoCompleto,
                            correo
                        })

                        correoEnviado = true

                        console.log(
                            `Correo de préstamo enviado a ${correo}`
                        )

                    } else {

                        console.warn(
                            'No se pudo enviar el correo: el destinatario no tiene correo registrado.'
                        )
                    }

                } else {

                    console.warn(
                        'No se pudo obtener la información completa del préstamo para enviar el correo.'
                    )
                }

            } catch (error) {

                console.error(
                    'El préstamo fue creado, pero no se pudo enviar el correo:',
                    error.message
                )
            }
        }


        // ==============================================
        // DATOS PARA AUDITORÍA
        // ==============================================

        const equipos = Array.isArray(num_series)
            ? num_series.join(', ')
            : ''


        const destinatario =
            id_empleado
                ? `empleado ${id_empleado}`
                : `usuario del sistema ${id_usuario}`


        const rangoFechas =
            fecha_inicio && fecha_limite
                ? ` del ${fecha_inicio} al ${fecha_limite}`
                : ''


        await auditoriaService.registrar(
            req.usuario.usuario,
            `Prestó los equipos ${equipos} al ${destinatario}${rangoFechas}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `Se registró un préstamo de los equipos ${equipos} al ${destinatario}.`
        )


        // ==============================================
        // RESPUESTA
        // ==============================================

        let mensaje =
            'Préstamo registrado exitosamente'

        if (enviarCorreo && correoEnviado) {

            mensaje =
                'Préstamo registrado y correo enviado exitosamente'

        } else if (enviarCorreo && !correoEnviado) {

            mensaje =
                'Préstamo registrado exitosamente, pero no se pudo enviar el correo'
        }


        res.status(201).json({

            mensaje,

            correoEnviado

        })


    } catch (error) {

        // ==============================================
        // ERRORES DE VALIDACIÓN
        // ==============================================

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'Debe seleccionar al menos un equipo y un destinatario'
            })
        }


        if (error.message === 'DESTINATARIO_REQUERIDO') {

            return res.status(400).json({
                error: 'Debe seleccionar un empleado o un usuario'
            })
        }


        if (error.message === 'DESTINATARIO_INVALIDO') {

            return res.status(400).json({
                error: 'Solo puede seleccionar un empleado o un usuario'
            })
        }


        if (error.message === 'EMPLEADO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'El empleado seleccionado no existe'
            })
        }


        if (error.message === 'USUARIO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'El usuario seleccionado no existe'
            })
        }


        if (error.message === 'EQUIPOS_REQUERIDOS') {

            return res.status(400).json({
                error: 'Debe seleccionar al menos un equipo'
            })
        }


        if (error.message === 'EQUIPO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Uno de los equipos no fue encontrado'
            })
        }


        if (error.message === 'EQUIPO_NO_DISPONIBLE') {

            return res.status(400).json({
                error: 'Uno de los equipos no está disponible para préstamo'
            })
        }


        if (error.message === 'FECHAS_INVALIDAS') {

            return res.status(400).json({
                error: 'La fecha límite no puede ser anterior a la fecha de inicio'
            })
        }


        console.error(
            'Error al crear prestamo:',
            error
        )


        res.status(500).json({
            error: 'Error al crear prestamo'
        })
    }
}


// ======================================================
// DEVOLVER PRÉSTAMO COMPLETO
// ======================================================

exports.devolverPrestamo = async (req, res) => {

    try {

        const observaciones =
            req.body.observaciones || null

        const evidencia =
            req.file
                ? req.file.filename
                : null


        const resultado =
            await prestamosService.devolverPrestamo(
                req.params.id,
                observaciones,
                evidencia
            )


        // ==============================================
        // AUDITORÍA
        // ==============================================

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución total del préstamo ${req.params.id}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `El usuario ${req.usuario.usuario} registró la devolución total del préstamo #${req.params.id}.`
        )


        res.status(200).json({
            mensaje: 'Devolución registrada exitosamente',
            ...resultado
        })


    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El id del préstamo es requerido'
            })
        }


        if (error.message === 'PRESTAMO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Préstamo no encontrado'
            })
        }


        if (error.message === 'PRESTAMO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este préstamo ya fue devuelto'
            })
        }


        console.error(
            'Error al devolver prestamo:',
            error
        )


        res.status(500).json({
            error: 'Error al devolver prestamo'
        })
    }
}


// ======================================================
// DEVOLVER UN SOLO EQUIPO
// ======================================================

exports.devolverEquipo = async (req, res) => {

    try {

        const observaciones =
            req.body?.observaciones || null

        const evidencia =
            req.file
                ? req.file.filename
                : null


        const resultado =
            await prestamosService.devolverEquipo(
                req.params.id,
                req.params.num_serie,
                observaciones,
                evidencia
            )


        // ==============================================
        // AUDITORÍA
        // ==============================================

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución del equipo ${req.params.num_serie} del préstamo ${req.params.id}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `El usuario ${req.usuario.usuario} devolvió el equipo ${req.params.num_serie} del préstamo #${req.params.id}.`
        )


        res.status(200).json({
            mensaje: 'Equipo devuelto exitosamente',
            ...resultado
        })


    } catch (error) {

        if (error.message === 'PRESTAMO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Préstamo no encontrado'
            })
        }


        if (error.message === 'PRESTAMO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este préstamo ya fue devuelto'
            })
        }


        if (error.message === 'EQUIPO_NO_PERTENECE') {

            return res.status(400).json({
                error: 'El equipo no pertenece a este préstamo'
            })
        }


        if (error.message === 'EQUIPO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este equipo ya fue devuelto'
            })
        }


        console.error(
            'Error al devolver equipo:',
            error
        )


        res.status(500).json({
            error: 'Error al devolver equipo'
        })
    }
}


// ======================================================
// HISTORIAL DE EQUIPO
// ======================================================

exports.historialEquipo = async (req, res) => {

    try {

        const historial =
            await prestamosService.historialEquipo(
                req.params.num_serie
            )

        res.json(historial)

    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El número de serie es requerido'
            })
        }


        console.error(
            'Error al obtener historial:',
            error
        )


        res.status(500).json({
            error: 'Error al obtener historial'
        })
    }
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticas = async (req, res) => {

    try {

        const stats =
            await prestamosService.getEstadisticas()

        res.json(stats)

    } catch (error) {

        console.error(
            'Error al obtener estadisticas:',
            error
        )

        res.status(500).json({
            error: 'Error al obtener estadisticas'
        })
    }
}


// ======================================================
// HISTORIAL DE PRÉSTAMOS DE UN EMPLEADO
// ======================================================

exports.historialEmpleado = async (req, res) => {

    try {

        const historial =
            await prestamosService.getHistorialEmpleado(
                req.params.id
            )

        res.json(historial)

    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El id del empleado es requerido'
            })
        }


        console.error(
            'Error al obtener historial del empleado:',
            error
        )


        res.status(500).json({
            error: 'Error al obtener historial del empleado'
        })
    }
}


// ======================================================
// HISTORIAL DE PRÉSTAMOS DE UN USUARIO
// ======================================================

exports.historialUsuario = async (req, res) => {

    try {

        const historial =
            await prestamosService.getHistorialUsuario(
                req.params.id
            )

        res.json(historial)

    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El id del usuario es requerido'
            })
        }


        console.error(
            'Error al obtener historial del usuario:',
            error
        )


        res.status(500).json({
            error: 'Error al obtener historial del usuario'
            })
    }
}