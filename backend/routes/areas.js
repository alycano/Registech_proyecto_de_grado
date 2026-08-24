const express = require('express')
const router = express.Router()
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areasController')
const { authMiddleware, requireArea } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { crearAreaSchema, actualizarAreaSchema } = require('../schemas/areas.schema')

router.get('/areas', authMiddleware, getAreas)
router.post('/areas', authMiddleware, requireArea('Tecnologia'), validate(crearAreaSchema), createArea)
router.put('/areas/:area', authMiddleware, requireArea('Tecnologia'), validate(actualizarAreaSchema), updateArea)
router.delete('/areas/:area', authMiddleware, requireArea('Tecnologia'), deleteArea)

module.exports = router
