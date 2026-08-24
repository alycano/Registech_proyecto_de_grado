const dashboardService = require('../services/dashboardService')
const db = require('../lib/db')

exports.getDashboard = async (req, res) => {
    try {
        const data = await dashboardService.getDashboardData()
        res.json(data)
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error)
        res.status(500).json({ error: 'Error al obtener datos del dashboard' })
    }
}

exports.getNotificaciones = async (req, res) => {
    try {
        const [ordenes] = await Promise.all([
            db.query("SELECT COUNT(*)::int AS count FROM historial_mantenimientos WHERE estado_orden = 'pendiente' AND fecha_solucion IS NULL"),
        ])

        res.json({
            ordenesPendientes: ordenes.rows[0].count,
            total: ordenes.rows[0].count
        })
    } catch (error) {
        console.error('Error al obtener notificaciones:', error)
        res.status(500).json({ error: 'Error al obtener notificaciones' })
    }
}

exports.exportarEquipos = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT num_serie, equipo, area, descripcion, estado, responsable,
                    fecha_adquisicion, fecha_asignacion
             FROM equipos ORDER BY num_serie`
        )

        const header = 'Num Serie,Equipo,Area,Descripcion,Estado,Responsable,Fecha Adquisicion,Fecha Asignacion\n'
        const csv = rows.map(r =>
            [r.num_serie, r.equipo, r.area, `"${(r.descripcion||'').replace(/"/g,'""')}"`,
             r.estado, r.responsable||'', r.fecha_adquisicion, r.fecha_asignacion].join(',')
        ).join('\n')

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename=equipos_registech.csv')
        res.send('\uFEFF' + header + csv)
    } catch (error) {
        console.error('Error al exportar:', error)
        res.status(500).json({ error: 'Error al exportar' })
    }
}
