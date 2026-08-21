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