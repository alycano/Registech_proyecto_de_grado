const areasService = require('../services/areasService')
const auditoriaService = require('../services/auditoriaService')

// OBTENER TODAS LAS AREAS
exports.getAreas = async (req, res) => {
    try {
        const areas = await areasService.getAllAreas()
        res.json(areas)
    } catch (error) {
        console.error('Error al obtener las áreas:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

// CREAR UN NUEVO DEPARTAMENTO
exports.createArea = async (req, res) => {
    const resultado = await areasService.crearArea(req.body.area)
    await auditoriaService.registrar(req.usuario.usuario, `Creó el departamento ${resultado.area}`)
    res.status(201).json({ mensaje: 'Departamento creado correctamente', ...resultado })
}

// RENOMBRAR UN DEPARTAMENTO (MUEVE SUS EQUIPOS Y USUARIOS)
exports.updateArea = async (req, res) => {
    const resultado = await areasService.actualizarArea(req.params.area, req.body.area)
    await auditoriaService.registrar(req.usuario.usuario, `Renombró el departamento ${req.params.area} a ${resultado.area}`)
    res.json({ mensaje: 'Departamento actualizado correctamente', ...resultado })
}

// ELIMINAR UN DEPARTAMENTO (SOLO SI NO ESTA EN USO)
exports.deleteArea = async (req, res) => {
    await areasService.eliminarArea(req.params.area)
    await auditoriaService.registrar(req.usuario.usuario, `Eliminó el departamento ${req.params.area}`)
    res.json({ mensaje: 'Departamento eliminado correctamente' })
}
