const equiposService = require('../services/equiposService')
const { eliminarArchivo } = require('../middlewares/upload')

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

// Registra un nuevo equipo en el inventario (foto opcional)
exports.agregarEquipo = async (req, res) => {
    const archivo = req.file

    try {
        const equipo = await equiposService.registrarEquipo(req.body, archivo?.filename)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Registró el equipo ${equipo.equipo} (${equipo.num_serie}) en el inventario`)
        res.status(201).json({ mensaje: 'Equipo registrado exitosamente', equipo })
    } catch (error) {
        // Si algo falla y se subio una foto, no queda archivo huerfano
        if (archivo) eliminarArchivo(archivo.filename)

        console.error('Error al registrar equipo:', error.message, error.code)
        if (error.message === 'EQUIPO_DUPLICADO') return res.status(409).json({ error: 'Ya existe un equipo con ese número de serie' })
        if (error.message === 'ESTADO_INVALIDO') return res.status(400).json({ error: 'El estado inicial del equipo es inválido' })
        if (error.message === 'SOLO_IMAGENES') return res.status(400).json({ error: 'Solo se permiten imágenes (jpg, png, webp)' })
        if (error.message && error.message.includes('requerido')) return res.status(400).json({ error: error.message })
        res.status(500).json({ error: 'Error al registrar el equipo' })
    }
}

exports.asignarUsuario = async (req, res) => {
    try {
        await equiposService.asignarUsuario(req.body.num_serie, req.body.usuario)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Asignó el equipo ${req.body.num_serie} a ${req.body.usuario}`)
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
    const { num_serie, falla } = req.body
    const archivo = req.file

    if (!archivo) {
        return res.status(400).json({ error: 'La evidencia fotográfica es obligatoria' })
    }

    try {
        const idHistorial = await equiposService.reporteFalla(num_serie, falla, archivo.filename)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Registró el daño del equipo ${num_serie} con evidencia fotográfica (orden ${idHistorial})`)
        res.status(200).json({ mensaje: 'Daño registrado. Orden pendiente de aprobación del administrador', id_historial: idHistorial })
    } catch (error) {
        eliminarArchivo(archivo.filename)
        console.error('Error al registrar reporte:', error)
        if (error.code === 'P2025') return res.status(404).json({ error: 'Equipo no encontrado' })
        if (error.message.includes('requeridos')) return res.status(400).json({ error: error.message })
        res.status(500).json({ error: 'Error al registrar el reporte' })
    }
}

exports.aprobarRechazarOrden = async (req, res) => {
    try {
        const { id_historial, decision } = req.body
        const resultado = await equiposService.decidirAprobacion(id_historial, decision, req.usuario.usuario)

        const auditoriaService = require('../services/auditoriaService')
        const accion = decision === 'aprobada' ? 'Aprobó' : 'Rechazó'
        await auditoriaService.registrar(req.usuario.usuario, `${accion} la orden de mantenimiento ${resultado.id_historial}`)

        const mensaje = decision === 'aprobada'
            ? 'Orden aprobada. El técnico ya puede trabajar en la reparación'
            : 'Orden rechazada. El equipo regresa a disponible'

        res.status(200).json({ mensaje, ...resultado })
    } catch (error) {
        console.error('Error al decidir la orden:', error)
        if (error.message === 'DECISION_INVALIDA') return res.status(400).json({ error: 'Decisión inválida' })
        if (error.message === 'ORDEN_NO_PENDIENTE') return res.status(409).json({ error: 'La orden no existe o ya fue procesada' })
        res.status(500).json({ error: 'Error al procesar la orden' })
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

exports.getHistorialMantenimientos = async (req, res) => {
    try {
        const historial = await equiposService.getHistorialCompleto()
        res.json(historial)
    } catch (error) {
        console.error('Error al obtener historial de mantenimientos:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

exports.resolverReporte = async (req, res) => {
    try {
        const { num_serie, id_historial, tecnico, solucion } = req.body
        await equiposService.resolverReporte(num_serie, id_historial, tecnico, solucion)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Resolvió la orden ${id_historial} del equipo ${num_serie}`)
        res.status(200).json({ mensaje: 'Estado del equipo actualizado a disponible y mantenimiento registrado' })
    } catch (error) {
        console.error('Error al resolver reporte:', error)
        if (error.code === 'P2025') return res.status(404).json({ error: 'Equipo o reporte no encontrado' })
        if (error.message === 'ORDEN_NO_APROBADA') return res.status(409).json({ error: 'La orden no está aprobada por el administrador o no existe' })
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