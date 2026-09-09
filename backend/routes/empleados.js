const express = require('express')

const router = express.Router()

const empleadosController = require('../controllers/empleadosController')

const { authMiddleware, requireRol } = require('../middlewares/auth')

router.get(
    '/empleados',
    authMiddleware,
    empleadosController.getEmpleados
)

router.post(
    '/empleados',
    authMiddleware,
    requireRol('admin'),
    empleadosController.createEmpleado
)

router.put(
    '/empleados/:id',
    authMiddleware,
    requireRol('admin'),
    empleadosController.updateEmpleado
)

router.delete(
    '/empleados/:id',
    authMiddleware,
    requireRol('admin'),
    empleadosController.deleteEmpleado
)

module.exports = router