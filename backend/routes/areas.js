const express = require('express')
const router = express.Router()
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areasController')
const { authMiddleware, requireRol } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { crearAreaSchema, actualizarAreaSchema } = require('../schemas/areas.schema')

router.get('/areas', authMiddleware, getAreas)
router.post('/areas', authMiddleware, requireRol('admin'), validate(crearAreaSchema), createArea)
router.put('/areas/:area', authMiddleware, requireRol('admin'), validate(actualizarAreaSchema), updateArea)
router.delete('/areas/:area', authMiddleware, requireRol('admin'), deleteArea)

module.exports = router
