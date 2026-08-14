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
const { authMiddleware, requireArea } = require('../middlewares/auth')

router.post('/login', login)
router.post('/auth/google', loginGoogle)
router.get('/usuarios', getUsuarios)
router.post('/usuarios', createUsuario)
router.put('/usuarios/:usuario', updateUsuario)
router.delete('/usuarios/:usuario', deleteUsuario)

module.exports = router
