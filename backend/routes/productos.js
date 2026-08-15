const express = require('express')
const router = express.Router()
const {
    getProductos,
    getProductoPorCodigo,
    createProducto,
    updateProducto,
    deleteProducto
} = require('../controllers/productosController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/productos', authMiddleware, getProductos)
router.get('/producto', authMiddleware, getProductoPorCodigo)
router.post('/productos', authMiddleware, createProducto)
router.put('/productos/:producto', authMiddleware, updateProducto)
router.delete('/productos/:producto', authMiddleware, deleteProducto)

module.exports = router
