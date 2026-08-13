const express = require('express')
const router = express.Router()
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
router.get('/usuarios', authMiddleware, requireArea('Recursos Humanos', 'Tecnologia'), getUsuarios)
router.post('/usuarios', authMiddleware, requireArea('Recursos Humanos', 'Tecnologia'), createUsuario)
router.put('/usuarios/:usuario', authMiddleware, requireArea('Recursos Humanos', 'Tecnologia'), updateUsuario)
router.delete('/usuarios/:usuario', authMiddleware, requireArea('Recursos Humanos', 'Tecnologia'), deleteUsuario)

module.exports = router
