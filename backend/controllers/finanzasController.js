const db = require('../config/db')
const { formatDate } = require('../utils/date')

// OBTENER RESUMEN FINANCIERO EN UN RANGO DE FECHAS
exports.getResumen = (req, res) => {
    const { inicio, fin } = req.query

    if (!inicio || !fin) {
        return res.status(400).send('Las fechas son obligatorias')
    }

    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return res.status(400).send('Las fechas proporcionadas no son validas')
    }

    if (fechaInicio > fechaFin) {
        return res.status(400).send('La fecha de inicio no puede ser mayor a la fecha final')
    }

    const fechaInicioStr = formatDate(fechaInicio)
    const fechaFinStr = formatDate(fechaFin)

    const queryResumen = 'SELECT COALESCE(SUM(total_venta), 0) AS total_ventas, COUNT(*) AS cantidad_ventas FROM ventas WHERE fecha_venta BETWEEN ? AND ?'
    const queryVendedor = 'SELECT vendedor, SUM(total_venta) AS total FROM ventas WHERE fecha_venta BETWEEN ? AND ? GROUP BY vendedor ORDER BY total DESC LIMIT 1'
    const queryDiario = 'SELECT fecha_venta, COUNT(*) AS cantidad, SUM(total_venta) AS total FROM ventas WHERE fecha_venta BETWEEN ? AND ? GROUP BY fecha_venta ORDER BY fecha_venta ASC'

    db.query(queryResumen, [fechaInicioStr, fechaFinStr], (err, resumenRows) => {
        if (err) {
            console.error('Error al obtener el resumen financiero:', err)
            return res.status(500).send('Error en la consulta')
        }

        db.query(queryVendedor, [fechaInicioStr, fechaFinStr], (err, vendedorRows) => {
            if (err) {
                console.error('Error al obtener el mejor vendedor:', err)
                return res.status(500).send('Error en la consulta')
            }

            db.query(queryDiario, [fechaInicioStr, fechaFinStr], (err, diarioRows) => {
                if (err) {
                    console.error('Error al obtener las ventas por dia:', err)
                    return res.status(500).send('Error en la consulta')
                }

                const resumen = resumenRows[0]
                res.json({
                    total_ventas: resumen.total_ventas,
                    cantidad_ventas: resumen.cantidad_ventas,
                    ticket_promedio: Number(resumen.cantidad_ventas) > 0
                        ? (resumen.total_ventas / resumen.cantidad_ventas)
                        : 0,
                    mejor_vendedor: vendedorRows[0] || null,
                    ventas_por_dia: diarioRows
                })
            })
        })
    })
}
