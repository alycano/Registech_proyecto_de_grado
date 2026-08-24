const express = require('express')
const router = express.Router()
const {
    login,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    solicitarRecuperacion,
    restablecerPassword,
    cambiarPassword
} = require('../controllers/usuariosController')
const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const { loginSchema, crearUsuarioSchema, actualizarUsuarioSchema, cambiarPasswordSchema } = require('../schemas/usuarios.schema')

router.post('/login', validate(loginSchema), login)
router.post('/usuarios/solicitar-recuperacion', solicitarRecuperacion)
router.post('/usuarios/restablecer-password', restablecerPassword)
router.post('/usuarios/cambiar-password', authMiddleware, validate(cambiarPasswordSchema), cambiarPassword)
router.get('/usuarios', authMiddleware, getUsuarios)
router.post('/usuarios', authMiddleware, validate(crearUsuarioSchema), createUsuario)
router.put('/usuarios/:usuario', authMiddleware, validate(actualizarUsuarioSchema), updateUsuario)
router.delete('/usuarios/:usuario', authMiddleware, deleteUsuario)

module.exports = router
