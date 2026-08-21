const equiposService = require('../services/equiposService')

exports.getEstadosEquipo = async (req, res) => {
    try {
        const estados = await equiposService.getEstadosEquipo()
        res.json(estados)
    } catch (error) {
        console.error('Error al obtener estados:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

exports.getEquipos = async (req, res) => {
    try {
        const equipos = await equiposService.getEquipos()
        res.json(equipos)
    } catch (error) {
        console.error('Error al obtener equipos:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

exports.asignarUsuario = async (req, res) => {
    try {
        await equiposService.asignarUsuario(req.body.num_serie, req.body.usuario)
        res.status(200).json({ mensaje: 'Se asigno exitosamente el usuario al equipo correspondiente' })
    } catch (error) {
        console.error('Error al asignar usuario al equipo:', error)
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Equipo no encontrado' })
        }
        if (error.message.includes('requerido')) {
            return res.status(400).json({ error: error.message })
        }
        res.status(500).json({ error: 'Error al asignar usuario al equipo' })
    }
}

exports.reporteFalla = async (req, res) => {
    try {
        await equiposService.reporteFalla(req.body.num_serie, req.body.falla)
        res.status(200).json({ mensaje: 'Estado actualizado a mantenimiento y reporte registrado exitosamente' })
    } catch (error) {
        console.error('Error al registrar reporte:', error)
        if (error.code === 'P2025') return res.status(404).json({ error: 'Equipo no encontrado' })
        if (error.message.includes('requeridos')) return res.status(400).json({ error: error.message })
        res.status(500).json({ error: 'Error al registrar el reporte' })
    }
}

exports.getReportes = async (req, res) => {
    try {
        const reportes = await equiposService.getReportes()
        res.json(reportes)
    } catch (error) {
        console.error('Error al obtener reportes:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

exports.resolverReporte = async (req, res) => {
    try {
        const { num_serie, id_historial, tecnico, solucion } = req.body
        await equiposService.resolverReporte(num_serie, id_historial, tecnico, solucion)
        res.status(200).json({ mensaje: 'Estado del equipo actualizado a activo y mantenimiento actualizado' })
    } catch (error) {
        console.error('Error al resolver reporte:', error)
        if (error.code === 'P2025') return res.status(404).json({ error: 'Equipo o reporte no encontrado' })
        if (error.message.includes('requeridos')) return res.status(400).json({ error: error.message })
        res.status(500).json({ error: 'Error al actualizar el reporte' })
    }
}

exports.buscarMantenimientos = async (req, res) => {
    try {
        const resultados = await equiposService.buscarMantenimientos(req.body.filter)
        res.json(resultados)
    } catch (error) {
        console.error('Error al buscar mantenimientos:', error)
        if (error.message.includes('proporcionar')) return res.status(400).json({ error: error.message })
        res.status(500).json({ error: 'Error en la consulta' })
    }
}