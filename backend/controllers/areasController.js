const prisma = require('../lib/prisma')

// OBTENER TODAS LAS AREAS

exports.getAreas = async (req, res) => {
    try {
        const areas = await prisma.areas.findMany()

        res.json(areas)
    } catch (error) {
        console.error('Error al obtener las áreas:', error)
        res.status(500).send('Error en la consulta')
    }
}