const express = require('express')
const router = express.Router()
const {
    getProductos,
    getProductoPorCodigo,
    createProducto,
    updateProducto,
    deleteProducto
} = require('../controllers/productosController')

router.get('/productos', getProductos)
router.get('/producto', getProductoPorCodigo)
router.post('/productos', createProducto)
router.put('/productos/:producto', updateProducto)
router.delete('/productos/:producto', deleteProducto)

module.exports = router
