const areasService = require('../services/areasService')

// OBTENER TODAS LAS AREAS
exports.getAreas = async (req, res) => {
    try {
        const areas = await areasService.getAllAreas()
        res.json(areas)
    } catch (error) {
        console.error('Error al obtener las áreas:', error)
        res.status(500).send('Error en la consulta')
    }
}

// CREAR UN NUEVO DEPARTAMENTO
exports.createArea = async (req, res) => {
    try {
        const resultado = await areasService.crearArea(req.body.area)

        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Creó el departamento ${resultado.area}`)

        res.status(201).json({ mensaje: 'Departamento creado correctamente', ...resultado })
    } catch (error) {
        if (error.message === 'AREA_DUPLICADA') return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' })
        if (error.message === 'AREA_INVALIDA') return res.status(400).json({ error: 'El nombre del departamento no es válido' })
        console.error('Error al crear el departamento:', error)
        res.status(500).json({ error: 'Error al crear el departamento' })
    }
}

// RENOMBRAR UN DEPARTAMENTO (MUEVE SUS EQUIPOS Y USUARIOS)
exports.updateArea = async (req, res) => {
    try {
        const resultado = await areasService.actualizarArea(req.params.area, req.body.area)

        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Renombró el departamento ${req.params.area} a ${resultado.area}`)

        res.json({ mensaje: 'Departamento actualizado correctamente', ...resultado })
    } catch (error) {
        if (error.message === 'AREA_DUPLICADA') return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' })
        if (error.message === 'AREA_NO_ENCONTRADA') return res.status(404).json({ error: 'El departamento no existe' })
        if (error.message === 'AREA_INVALIDA') return res.status(400).json({ error: 'El nombre del departamento no es válido' })
        console.error('Error al actualizar el departamento:', error)
        res.status(500).json({ error: 'Error al actualizar el departamento' })
    }
}

// ELIMINAR UN DEPARTAMENTO (SOLO SI NO ESTA EN USO)
exports.deleteArea = async (req, res) => {
    try {
        await areasService.eliminarArea(req.params.area)

        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Eliminó el departamento ${req.params.area}`)

        res.json({ mensaje: 'Departamento eliminado correctamente' })
    } catch (error) {
        if (error.message === 'AREA_EN_USO') {
            return res.status(409).json({
                error: `No se puede eliminar: tiene ${error.detalle.equipos} equipo(s) y ${error.detalle.usuarios} usuario(s) asignados`
            })
        }
        if (error.message === 'AREA_NO_ENCONTRADA') return res.status(404).json({ error: 'El departamento no existe' })
        console.error('Error al eliminar el departamento:', error)
        res.status(500).json({ error: 'Error al eliminar el departamento' })
    }
}
