const express = require('express')
const router = express.Router()
const {
    login,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario
} = require('../controllers/usuariosController')
const { authMiddleware } = require('../middlewares/auth')

router.post('/login', login)
router.get('/usuarios', authMiddleware, getUsuarios)
router.post('/usuarios', authMiddleware, createUsuario)
router.put('/usuarios/:usuario', authMiddleware, updateUsuario)
router.delete('/usuarios/:usuario', authMiddleware, deleteUsuario)

module.exports = router
