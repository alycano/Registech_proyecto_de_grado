const db = require('../lib/db')

exports.findAll = async () => {
    const { rows } = await db.query('SELECT area FROM areas ORDER BY area')
    return rows
}

exports.exists = async (area) => {
    const { rows } = await db.query('SELECT 1 FROM areas WHERE LOWER(area) = LOWER($1)', [area])
    return rows.length > 0
}

exports.create = async (area) => {
    await db.query('INSERT INTO areas (area) VALUES ($1)', [area])
}

// Renombra el area y actualiza sus referencias en equipos y usuarios
exports.rename = async (viejaLimpia, nuevaLimpia) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')
        await client.query('UPDATE equipos SET area = $1 WHERE area = $2', [nuevaLimpia, viejaLimpia])
        await client.query('UPDATE usuarios SET area = $1 WHERE area = $2', [nuevaLimpia, viejaLimpia])
        const resultado = await client.query('UPDATE areas SET area = $1 WHERE area = $2', [nuevaLimpia, viejaLimpia])
        await client.query('COMMIT')
        return resultado.rowCount > 0
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.remove = async (area) => {
    const { rowCount } = await db.query('DELETE FROM areas WHERE LOWER(area) = LOWER($1)', [area])
    return rowCount > 0
}

// Cuenta cuantos equipos y usuarios usan el area
exports.contarUso = async (area) => {
    const { rows } = await db.query(
        `SELECT
            (SELECT COUNT(*)::int FROM equipos WHERE LOWER(area) = LOWER($1)) AS equipos,
            (SELECT COUNT(*)::int FROM usuarios WHERE LOWER(area) = LOWER($1)) AS usuarios`,
        [area]
    )
    return rows[0]
}
