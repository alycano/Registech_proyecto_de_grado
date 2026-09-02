const db = require('../lib/db')

exports.findByUsuario = async (usuarioLimpio) => {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE usuario = $1', [usuarioLimpio])
    return rows[0] || null
}

exports.findByCorreo = async (correo) => {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo])
    return rows[0] || null
}

exports.findAll = async () => {
    const { rows } = await db.query(
        'SELECT usuario, nombre, area, rol, correo, estado FROM usuarios'
    )
    return rows
}

exports.create = async (data) => {
    const { rows } = await db.query(
        `INSERT INTO usuarios (usuario, nombre, correo, contrasena, area, rol, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [data.usuario, data.nombre, data.correo, data.contrasena, data.area, data.rol || 'inventario', data.estado || 'activo']
    )
    return rows[0]
}

exports.update = async (usuarioParam, data) => {
    const fields = []
    const values = []
    let idx = 1
    for (const [key, val] of Object.entries(data)) {
        fields.push(`${key} = $${idx}`)
        values.push(val)
        idx++
    }
    values.push(usuarioParam)
    const { rows } = await db.query(
        `UPDATE usuarios SET ${fields.join(', ')} WHERE usuario = $${idx} RETURNING *`,
        values
    )
    return rows[0]
}

exports.tienePrestamoActivo = async (usuarioParam) => {
    const { rows } = await db.query(
        `SELECT 1
         FROM prestamos p
         INNER JOIN usuarios u ON u.id_usuario = p.usuario_destino
         WHERE u.usuario = $1
           AND p.estado IN ('activo', 'parcial')
         LIMIT 1`,
        [usuarioParam]
    )

    return rows.length > 0
}

exports.tieneHistorialPrestamos = async (usuarioParam) => {
    const { rows } = await db.query(
        `SELECT 1
         FROM prestamos p
         INNER JOIN usuarios u ON u.id_usuario = p.usuario_destino
         WHERE u.usuario = $1
         LIMIT 1`,
        [usuarioParam]
    )

    return rows.length > 0
}


exports.delete = async (usuarioParam) => {
    const client = await db.pool.connect()

    try {
        await client.query('BEGIN')

        // Los reset_tokens referencian a usuarios por FK
        await client.query(
            'DELETE FROM reset_tokens WHERE usuario = $1',
            [usuarioParam]
        )

        const { rowCount } = await client.query(
            'DELETE FROM usuarios WHERE usuario = $1',
            [usuarioParam]
        )

        await client.query('COMMIT')

        if (rowCount === 0) {
            const err = new Error('NOT_FOUND')
            err.code = 'P2025'
            throw err
        }

    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.createResetToken = async (usuario, codigo, expiraEn) => {
    await db.query('DELETE FROM reset_tokens WHERE usuario = $1', [usuario])
    const { rows } = await db.query(
        'INSERT INTO reset_tokens (usuario, codigo, expira_en) VALUES ($1, $2, $3) RETURNING *',
        [usuario, codigo, expiraEn]
    )
    return rows[0]
}

exports.findValidResetToken = async (usuario, codigo) => {
    const { rows } = await db.query(
        'SELECT * FROM reset_tokens WHERE usuario = $1 AND codigo = $2 AND usado = false AND expira_en > NOW()',
        [usuario, codigo]
    )
    return rows[0] || null
}

exports.markTokenUsed = async (tokenId) => {
    await db.query('UPDATE reset_tokens SET usado = true WHERE id = $1', [tokenId])
}

exports.updatePassword = async (usuario, hashContrasena) => {
    await db.query('UPDATE usuarios SET contrasena = $1 WHERE usuario = $2', [hashContrasena, usuario])
}
