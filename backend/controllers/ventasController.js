const db = require('../config/db')
const { formatDate } = require('../utils/date')

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

    if (!venta) {
        return res.status(400).send('No se recibio la venta')
    }

    const fecha_venta = formatDate()
    const id_venta = Date.now().toString()

    // SEPARAR LOS PRODUCTOS, EL TOTAL Y EL VENDEDOR
    const partes = venta.split('_')
    const productos = partes[0]
    const total_venta = parseFloat(partes[1])
    const vendedor = partes[2]

    // VALIDAR EL TOTAL DE LA VENTA
    if (isNaN(total_venta)) {
        return res.status(400).send('El total de la venta no es valido')
    }

    const query = `INSERT INTO ventas (id_venta, productos, total_venta, fecha_venta, vendedor) VALUES (?, ?, ?, ?, ?)`
    db.query(query, [id_venta, productos, total_venta, fecha_venta, vendedor], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).send('Error al insertar la venta')
        }

        res.status(201).send({
            mensaje: 'Venta registrada con exito',
            id_venta
        })
    })
}
