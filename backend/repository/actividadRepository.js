const db = require('../lib/db')

exports.getActividadReciente = async (limit = 15) => {
    const { rows } = await db.query(
        `SELECT usuario, accion, fecha FROM auditoria ORDER BY fecha DESC LIMIT $1`,
        [limit]
    )
    return rows
}
