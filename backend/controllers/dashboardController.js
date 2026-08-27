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

        const ExcelJS = require('exceljs')
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'RegisTech'
        workbook.created = new Date()

        const sheet = workbook.addWorksheet('Inventario de Equipos', {
            properties: { defaultColWidth: 18 }
        })

        sheet.columns = [
            { header: 'Num Serie', key: 'num_serie', width: 20 },
            { header: 'Equipo', key: 'equipo', width: 25 },
            { header: 'Area', key: 'area', width: 20 },
            { header: 'Descripcion', key: 'descripcion', width: 35 },
            { header: 'Estado', key: 'estado', width: 18 },
            { header: 'Responsable', key: 'responsable', width: 22 },
            { header: 'Fecha Adquisicion', key: 'fecha_adquisicion', width: 20 },
            { header: 'Fecha Asignacion', key: 'fecha_asignacion', width: 20 },
        ]

        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
        headerRow.alignment = { horizontal: 'center' }

        rows.forEach(row => {
            const r = sheet.addRow(row)
            r.eachCell(cell => {
                cell.alignment = { vertical: 'middle' }
            })
        })

        const colores = {
            'Disponible': 'FF22C55E',
            'Asignado': 'FF3B82F6',
            'En mantenimiento': 'FFEF4444',
            'Baja': 'FF6B7280',
        }
        for (let i = 2; i <= sheet.rowCount; i++) {
            const cell = sheet.getRow(i).getCell('estado')
            const val = String(cell.value || '')
            if (colores[val]) {
                cell.font = { bold: true, color: { argb: colores[val] } }
            }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename=equipos_registech.xlsx')

        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        console.error('Error al exportar:', error)
        res.status(500).json({ error: 'Error al exportar' })
    }
}
