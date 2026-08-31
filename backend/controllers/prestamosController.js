const prestamosService = require('../services/prestamosService')

exports.getPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos:', error)
        res.status(500).json({ error: 'Error al obtener prestamos' })
    }
}

exports.getPrestamosActivos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamosActivos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos activos:', error)
        res.status(500).json({ error: 'Error al obtener prestamos activos' })
    }
}

exports.getPrestamoActivoPorEquipo = async (req, res) => {
    try {
        const prestamo = await prestamosService.getPrestamoActivoPorEquipo(req.params.num_serie)
        if (!prestamo) return res.status(404).json({ error: 'No hay préstamo activo para este equipo' })
        res.json(prestamo)
    } catch (error) {
        console.error('Error al buscar préstamo activo:', error)
        res.status(500).json({ error: 'Error al buscar préstamo activo' })
    }
}


exports.crearPrestamo = async (req, res) => {
    try {
        await prestamosService.crearPrestamo(
            req.body.num_series,
            req.body.usuario_destino,
            req.body.observaciones,
            req.body.fecha_inicio,
            req.body.fecha_limite,
            req.body.area
        )

        const auditoriaService = require('../services/auditoriaService')

        const rangoFechas = req.body.fecha_inicio && req.body.fecha_limite
            ? ` del ${req.body.fecha_inicio} al ${req.body.fecha_limite}`
            : ''

        const equipos = req.body.num_series.join(', ')

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Prestó los equipos ${equipos} a ${req.body.usuario_destino}${rangoFechas}`
        )

        res.status(201).json({
            mensaje: 'Prestamo registrado exitosamente'
        })

    } catch (error) {
        if (error.message === 'REQUERIDOS') {
            return res.status(400).json({
                error: 'Debe seleccionar al menos un equipo y un usuario destino'
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

        console.error('Error al crear prestamo:', error)

        res.status(500).json({
            error: 'Error al crear prestamo'
        })
    }
}

exports.devolverPrestamo = async (req, res) => {
    try {
        const observaciones = req.body.observaciones || null
        const evidencia = req.file ? req.file.filename : null

        await prestamosService.devolverPrestamo(
            req.params.id,
            observaciones,
            evidencia
        )

        const auditoriaService = require('../services/auditoriaService')

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución del préstamo ${req.params.id}`
        )

        res.status(200).json({
            mensaje: 'Devolución registrada exitosamente'
        })

    } catch (error) {

        if (error.message === 'REQUERIDO') {
            return res.status(400).json({
                error: 'El id del prestamo es requerido'
            })
        }

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

exports.devolverEquipo = async (req, res) => {
    try {
        const observaciones = req.body.observaciones || null
        const evidencia = req.file ? req.file.filename : null

        const resultado = await prestamosService.devolverEquipo(
            req.params.id,
            req.params.num_serie,
            observaciones,
            evidencia
        )

        const auditoriaService = require('../services/auditoriaService')

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución del equipo ${req.params.num_serie} del préstamo ${req.params.id}`
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

        console.error('Error al devolver equipo:', error)

        res.status(500).json({
            error: 'Error al devolver equipo'
        })
    }
}

exports.historialEquipo = async (req, res) => {
    try {
        const historial = await prestamosService.historialEquipo(req.params.num_serie)
        res.json(historial)
    } catch (error) {
        if (error.message === 'REQUERIDO') return res.status(400).json({ error: 'El numero de serie es requerido' })
        console.error('Error al obtener historial:', error)
        res.status(500).json({ error: 'Error al obtener historial' })
    }
}

exports.getEstadisticas = async (req, res) => {
    try {
        const stats = await prestamosService.getEstadisticas()
        res.json(stats)
    } catch (error) {
        console.error('Error al obtener estadisticas:', error)
        res.status(500).json({ error: 'Error al obtener estadisticas' })
    }
}
