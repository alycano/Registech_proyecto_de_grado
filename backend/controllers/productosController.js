const db = require('../config/db')
const { sanitizarTexto, sanitizarHtml, sanitizarNumero } = require('../utils/sanitize')

// OBTENER TODOS LOS PRODUCTOS
exports.getProductos = (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la consulta' })
        }
        res.json(results)
    })
}

// OBTENER UN PRODUCTO POR SU CODIGO
exports.getProductoPorCodigo = (req, res) => {
    const { codigo } = req.query
    const codigoLimpio = sanitizarTexto(codigo, 50)

    if (!codigoLimpio) {
        return res.status(400).json({ error: 'El código es obligatorio' })
    }

    const query = 'SELECT codigo, nom_producto, pre_publico FROM productos WHERE codigo = ?'
    db.query(query, [codigoLimpio], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el producto' })
        }
        res.json(results)
    })
}

// AGREGAR UN NUEVO PRODUCTO
exports.createProducto = (req, res) => {
    const { codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body

    const codigoLimpio = sanitizarTexto(codigo, 50)
    const nombreLimpio = sanitizarHtml(nom_producto, 150)
    const descripcionLimpia = sanitizarHtml(desc_producto, 500)
    const precioPublico = sanitizarNumero(pre_publico)
    const precioProveedor = sanitizarNumero(pre_proveedor)
    const existenciasNum = sanitizarNumero(existencias)

    if (!codigoLimpio || !nombreLimpio || !descripcionLimpia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (precioPublico === null || precioProveedor === null || existenciasNum === null) {
        return res.status(400).json({ error: 'Los precios y existencias deben ser números válidos' })
    }
    if (precioPublico < 0 || precioProveedor < 0 || existenciasNum < 0) {
        return res.status(400).json({ error: 'Los valores no pueden ser negativos' })
    }
    if (!Number.isInteger(existenciasNum)) {
        return res.status(400).json({ error: 'Las existencias deben ser un número entero' })
    }

    const query = 'INSERT INTO productos (codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES (?, ?, ?, ?, ?, ?)'
    db.query(query, [codigoLimpio, nombreLimpio, descripcionLimpia, precioPublico, precioProveedor, existenciasNum], (err) => {
        if (err) {
            console.error('Error al agregar el producto: ', err)
            return res.status(500).json({ error: 'Error al agregar el producto' })
        }

        res.status(201).json({
            codigo: codigoLimpio, nom_producto: nombreLimpio, desc_producto: descripcionLimpia, pre_publico: precioPublico, pre_proveedor: precioProveedor, existencias: existenciasNum
        })
    })
}

// EDITAR UN PRODUCTO (el codigo llega por la URL)
exports.updateProducto = (req, res) => {
    const { producto } = req.params
    const { nom_producto, desc_producto, pre_publico, pre_proveedor, existencias } = req.body

    const productoParam = sanitizarTexto(producto, 50)
    const nombreLimpio = sanitizarHtml(nom_producto, 150)
    const descripcionLimpia = sanitizarHtml(desc_producto, 500)
    const precioPublico = sanitizarNumero(pre_publico)
    const precioProveedor = sanitizarNumero(pre_proveedor)
    const existenciasNum = sanitizarNumero(existencias)

    if (!productoParam || !nombreLimpio || !descripcionLimpia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (precioPublico === null || precioProveedor === null || existenciasNum === null) {
        return res.status(400).json({ error: 'Los precios y existencias deben ser números válidos' })
    }
    if (precioPublico < 0 || precioProveedor < 0 || existenciasNum < 0) {
        return res.status(400).json({ error: 'Los valores no pueden ser negativos' })
    }
    if (!Number.isInteger(existenciasNum)) {
        return res.status(400).json({ error: 'Las existencias deben ser un número entero' })
    }

    const query = 'UPDATE productos SET nom_producto = ?, desc_producto = ?, pre_publico = ?, pre_proveedor = ?, existencias = ? WHERE codigo = ?'
    db.query(query, [nombreLimpio, descripcionLimpia, precioPublico, precioProveedor, existenciasNum, productoParam], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al editar el producto' })
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }

        res.json({ mensaje: 'Producto actualizado' })
    })
}

// ELIMINAR UN PRODUCTO
exports.deleteProducto = (req, res) => {
    const { producto } = req.params
    const productoParam = sanitizarTexto(producto, 50)

    if (!productoParam) {
        return res.status(400).json({ error: 'Producto inválido' })
    }

    const query = 'DELETE FROM productos WHERE codigo = ?'
    db.query(query, [productoParam], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el producto' })
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }

        res.json({ mensaje: 'Producto eliminado' })
    })
}
