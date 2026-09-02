const express = require('express')

const router = express.Router()

const {
    login,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    verificarEliminacion,
    solicitarRecuperacion,
    restablecerPassword,
    cambiarPassword
} = require('../controllers/usuariosController')

const { authMiddleware, requireRol } = require('../middlewares/auth')

const { validate } = require('../middlewares/validate')

const {
    loginSchema,
    crearUsuarioSchema,
    actualizarUsuarioSchema,
    cambiarPasswordSchema
} = require('../schemas/usuarios.schema')


router.post('/login', validate(loginSchema), login)

router.post(
    '/usuarios/solicitar-recuperacion',
    solicitarRecuperacion
)

router.post(
    '/usuarios/restablecer-password',
    restablecerPassword
)

router.post(
    '/usuarios/cambiar-password',
    authMiddleware,
    validate(cambiarPasswordSchema),
    cambiarPassword
)

router.get(
    '/usuarios',
    authMiddleware,
    getUsuarios
)

router.post(
    '/usuarios',
    authMiddleware,
    requireRol('admin'),
    validate(crearUsuarioSchema),
    createUsuario
)

router.put(
    '/usuarios/:usuario',
    authMiddleware,
    requireRol('admin'),
    validate(actualizarUsuarioSchema),
    updateUsuario
)

// VERIFICAR SI SE PUEDE ELIMINAR O DEBE DESACTIVAR
router.get(
    '/usuarios/:usuario/verificar-eliminacion',
    authMiddleware,
    requireRol('admin'),
    verificarEliminacion
)

// ELIMINAR USUARIO
router.delete(
    '/usuarios/:usuario',
    authMiddleware,
    requireRol('admin'),
    deleteUsuario
)

module.exports = router