const db = require('../config/db')

// OBTENER TODOS LOS PRODUCTOS
exports.getProductos = (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// OBTENER UN PRODUCTO POR SU CODIGO
exports.getProductoPorCodigo = (req, res) => {
    const { codigo } = req.query

    const query = 'SELECT codigo, nom_producto, pre_publico FROM productos WHERE codigo = ?'
    db.query(query, [codigo], (err, results) => {
        if (err) {
            return res.status(500).send('Error al obtener el producto')
        }
        res.json(results)
    })
}

// AGREGAR UN NUEVO PRODUCTO
exports.createProducto = (req, res) => {
    const { codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body

    if (!codigo || !nom_producto || !desc_producto || !pre_publico || !pre_proveedor || !existencias) {
        return res.status(400).send('Todos los campos son obligatorios')
    }

    const query = 'INSERT INTO productos (codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES (?, ?, ?, ?, ?, ?)'
    db.query(query, [codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias], (err, result) => {
        if (err) {
            console.error('Error al agregar el producto: ', err)
            return res.status(500).send('Error al agregar el producto')
        }

        res.status(201).send({
            codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias
        })
    })
}

// EDITAR UN PRODUCTO (el codigo llega por la URL)
exports.updateProducto = (req, res) => {
    const { producto } = req.params
    const { nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body

    const query = 'UPDATE productos SET nom_producto = ?, desc_producto = ?, pre_publico = ?, pre_proveedor = ?, existencias = ? WHERE codigo = ?'
    db.query(query, [nom_producto, desc_producto, pre_publico, pre_proveedor, existencias, producto], (err, result) => {
        if (err) {
            return res.status(500).send('Error al editar el producto')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado')
        }

        res.send('Producto actualizado')
    })
}

// ELIMINAR UN PRODUCTO
exports.deleteProducto = (req, res) => {
    const { producto } = req.params

    const query = 'DELETE FROM productos WHERE codigo = ?'
    db.query(query, [producto], (err, result) => {
        if (err) {
            return res.status(500).send('Error al eliminar el producto')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Producto no encontrado')
        }

        res.send('Producto eliminado')
    })
}
