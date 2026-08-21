const express = require('express')
const router = express.Router()
const {
    login,
    googleLogin,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario
} = require('../controllers/usuariosController')
const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { loginSchema, crearUsuarioSchema, actualizarUsuarioSchema } = require('../schemas/usuarios.schema')

router.post('/login', validate(loginSchema), login)
router.post('/auth/google', googleLogin)
router.get('/usuarios', authMiddleware, getUsuarios)
router.post('/usuarios', authMiddleware, validate(crearUsuarioSchema), createUsuario)
router.put('/usuarios/:usuario', authMiddleware, validate(actualizarUsuarioSchema), updateUsuario)
router.delete('/usuarios/:usuario', authMiddleware, deleteUsuario)

module.exports = router
