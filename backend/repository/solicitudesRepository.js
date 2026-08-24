const db = require('../lib/db')

exports.crearSolicitud = async (usuario, tipoEquipo, descripcion, justificacion) => {
    const { rows } = await db.query(
        `INSERT INTO solicitudes (usuario_solicita, tipo_equipo, descripcion, justificacion)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [usuario, tipoEquipo, descripcion || null, justificacion || null]
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
        'SELECT * FROM solicitudes WHERE usuario_solicita = $1 ORDER BY creado_en DESC',
        [usuario]
    )
    return rows
}

exports.responderSolicitud = async (id, respondidoPor, estado, respuesta) => {
    const { rows } = await db.query(
        `UPDATE solicitudes
         SET estado = $1, respondido_por = $2, respuesta = $3, respondido_en = NOW()
         WHERE id_solicitud = $4 RETURNING *`,
        [estado, respondidoPor, respuesta || null, id]
    )
    return rows[0]
}

exports.contarPendientes = async () => {
    const { rows } = await db.query(`SELECT COUNT(*)::int as c FROM solicitudes WHERE estado = 'pendiente'`)
    return rows[0].c
}
