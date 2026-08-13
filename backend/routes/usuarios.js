const express = require('express')
const router = express.Router()
const usuariosController = require('../controllers/usuariosController');
const {
    login,
    loginGoogle,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario
} = require('../controllers/usuariosController')

router.post('/login', login)
router.post('/auth/google', loginGoogle)
router.get('/usuarios', getUsuarios)
router.post('/usuarios', createUsuario)
router.put('/usuarios/:usuario', updateUsuario)
router.delete('/usuarios/:usuario', deleteUsuario)

// --- NUEVAS RUTAS A AGREGAR ---
router.post('/register', usuariosController.registrarConVerificacion);
router.get('/verificar/:token', usuariosController.verificarCorreo);
router.post('/recuperar-password', usuariosController.solicitarRecuperacion);
router.post('/restablecer-password', usuariosController.restablecerContrasena);

module.exports = router