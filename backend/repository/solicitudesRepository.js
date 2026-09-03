const db = require('../lib/db')

exports.crearSolicitud = async (usuario, tipoEquipo, descripcion, justificacion) => {
    const detalle = [tipoEquipo, descripcion, justificacion && `Justificación: ${justificacion}`]
        .filter(Boolean)
        .join(' | ')
    const { rows } = await db.query(
        `INSERT INTO solicitudes (usuario, detalles) VALUES ($1, $2) RETURNING *`,
        [usuario, detalle]
    )
    return rows[0]
}

exports.findSolicitudes = async (estado) => {
    let query = 'SELECT * FROM solicitudes'
    const params = []
    if (estado) {
        query += ' WHERE estado = $1'
        params.push(estado)
    }
    query += ' ORDER BY creado_en DESC'
    const { rows } = await db.query(query, params)
    return rows
}

exports.findMisSolicitudes = async (usuario) => {
    const { rows } = await db.query(
        'SELECT * FROM solicitudes WHERE usuario = $1 ORDER BY creado_en DESC',
        [usuario]
    )
    return rows
}

exports.responderSolicitud = async (id, estado, respuesta) => {
    if (respuesta) {
        const { rows } = await db.query(
            `UPDATE solicitudes SET estado = $1, detalles = CASE
                 WHEN detalles IS NULL OR detalles = '' THEN $2
                 ELSE detalles || ' | Respuesta: ' || $2
             END WHERE id = $3 RETURNING *`,
            [estado, respuesta, id]
        )
        return rows[0]
    }
    const { rows } = await db.query(
        `UPDATE solicitudes SET estado = $1 WHERE id = $2 RETURNING *`,
        [estado, id]
    )
    return rows[0]
}

exports.contarPendientes = async () => {
    const { rows } = await db.query(`SELECT COUNT(*)::int as c FROM solicitudes WHERE estado = 'pendiente'`)
    return rows[0].c
}
