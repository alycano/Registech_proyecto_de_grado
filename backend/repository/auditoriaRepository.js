const db = require('../lib/db')

exports.crearLog = async (usuario, accion) => {
    const { rows } = await db.query(
        'INSERT INTO auditoria (usuario, accion) VALUES ($1, $2) RETURNING *',
        [usuario, accion]
    )
    return rows[0]
}
