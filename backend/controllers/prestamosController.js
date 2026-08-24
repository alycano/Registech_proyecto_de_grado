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

exports.crearPrestamo = async (req, res) => {
    try {
        await prestamosService.crearPrestamo(
            req.body.num_serie,
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
        await auditoriaService.registrar(req.usuario.usuario, `Prestó el equipo ${req.body.num_serie} a ${req.body.usuario_destino}${rangoFechas}`)
        res.status(201).json({ mensaje: 'Prestamo registrado exitosamente' })
    } catch (error) {
        if (error.message === 'REQUERIDOS') return res.status(400).json({ error: 'El numero de serie y el usuario destino son requeridos' })
        if (error.message === 'EQUIPO_NO_ENCONTRADO') return res.status(404).json({ error: 'Equipo no encontrado' })
        if (error.message === 'EQUIPO_NO_DISPONIBLE') return res.status(400).json({ error: 'El equipo no esta disponible para prestamo' })
        if (error.message === 'FECHAS_INVALIDAS') return res.status(400).json({ error: 'La fecha limite no puede ser anterior a la fecha de inicio' })
        console.error('Error al crear prestamo:', error)
        res.status(500).json({ error: 'Error al crear prestamo' })
    }
}

exports.devolverPrestamo = async (req, res) => {
    try {
        const observaciones = req.body.observaciones || null;
        const evidencia = req.file ? req.file.filename : null;
        await prestamosService.devolverPrestamo(req.params.id, observaciones, evidencia)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Registró la devolución del préstamo ${req.params.id}`)
        res.status(200).json({ mensaje: 'Devolución registrada exitosamente' })
    } catch (error) {
        if (error.message === 'REQUERIDO') return res.status(400).json({ error: 'El id del prestamo es requerido' })
        if (error.message === 'PRESTAMO_NO_ENCONTRADO') return res.status(404).json({ error: 'Prestamo no encontrado' })
        if (error.message === 'PRESTAMO_YA_DEVUELTO') return res.status(400).json({ error: 'Este prestamo ya fue devuelto' })
        console.error('Error al devolver prestamo:', error)
        res.status(500).json({ error: 'Error al devolver prestamo' })
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
