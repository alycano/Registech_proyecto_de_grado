const db = require('../config/db')
const { formatDate } = require('../utils/date')
const { sanitizarTexto, sanitizarNumero } = require('../utils/sanitize')

// OBTENER LAS VENTAS EN UN RANGO DE FECHAS
exports.getVentas = (req, res) => {
    const { inicio, fin } = req.query

    if (!inicio || !fin) {
        return res.status(400).send('Las fechas son obligatorias')
    }

    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

    // VALIDAMOS QUE LAS FECHAS SEAN CORRECTAS
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return res.status(400).send('Las fechas proporcionadas no son validas')
    }

    // ASEGURAMOS QUE LA FECHA DE INICIO NO SEA MAYOR A LA FECHA FINAL
    if (fechaInicio > fechaFin) {
        return res.status(400).send('La fecha de inicio no puede ser mayor a la fecha final')
    }

    // FORMATEAMOS LAS FECHAS YYYY-MM-DD PARA LA CONSULTA SQL
    const fechaInicioStr = formatDate(fechaInicio)
    const fechaFinStr = formatDate(fechaFin)
    const query = `SELECT * FROM ventas WHERE fecha_venta BETWEEN ? AND ?`

    db.query(query, [fechaInicioStr, fechaFinStr], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send('Error al obtener las ventas')
        }

        res.json(results)
    })
}

// REGISTRAR UNA NUEVA VENTA
// Recibe un string con el formato 'PRODUCTOS_TOTAL_VENDEDOR'
exports.createVenta = (req, res) => {
    const { venta } = req.body

    if (typeof venta !== 'string' || !venta) {
        return res.status(400).json({ error: 'No se recibio la venta' })
    }

    const fecha_venta = formatDate()
    const id_venta = Date.now().toString()

    // SEPARAR LOS PRODUCTOS, EL TOTAL Y EL VENDEDOR
    const partes = venta.split('_')
    if (partes.length < 3) {
        return res.status(400).json({ error: 'El formato de la venta es invalido' })
    }

    const productos = sanitizarTexto(partes[0], 500)
    const total_venta = sanitizarNumero(partes[1])
    const vendedor = sanitizarTexto(partes[2], 50)

    // VALIDAR EL TOTAL DE LA VENTA
    if (total_venta === null || total_venta < 0) {
        return res.status(400).json({ error: 'El total de la venta no es valido' })
    }
    if (!productos || !vendedor) {
        return res.status(400).json({ error: 'El formato de la venta es invalido' })
    }

    const query = 'INSERT INTO ventas (id_venta, productos, total_venta, fecha_venta, vendedor) VALUES (?, ?, ?, ?, ?)'
    db.query(query, [id_venta, productos, total_venta, fecha_venta, vendedor], (err) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ error: 'Error al insertar la venta' })
        }

        res.status(201).json({
            mensaje: 'Venta registrada con exito',
            id_venta
        })
    })
}
