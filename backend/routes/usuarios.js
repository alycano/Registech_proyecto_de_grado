const express = require('express')
const router = express.Router()
const {
    login,
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario
} = require('../controllers/usuariosController')

router.post('/login', login)
router.get('/usuarios', getUsuarios)
router.post('/usuarios', createUsuario)
router.put('/usuarios/:usuario', updateUsuario)
router.delete('/usuarios/:usuario', deleteUsuario)

module.exports = router
