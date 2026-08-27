const db = require('../lib/db')

exports.findPrestamos = async () => {
    const { rows } = await db.query(
        `SELECT p.*, e.equipo, e.descripcion, e.area as equipo_area
         FROM prestamos p
         JOIN equipos e ON p.num_serie = e.num_serie
         ORDER BY p.fecha_prestamo DESC`
    )
    return rows
}

exports.findPrestamosActivos = async () => {
    const { rows } = await db.query(
        `SELECT p.*, e.equipo, e.descripcion, e.area as equipo_area
         FROM prestamos p
         JOIN equipos e ON p.num_serie = e.num_serie
         WHERE p.estado = 'activo'
         ORDER BY p.fecha_prestamo DESC`
    )
    return rows
}

exports.findPrestamoActivoPorEquipo = async (numSerieLimpio) => {
    const { rows } = await db.query(
        `SELECT p.*, e.equipo, e.descripcion, e.area as equipo_area
         FROM prestamos p
         JOIN equipos e ON p.num_serie = e.num_serie
         WHERE p.num_serie = $1 AND p.estado = 'activo'
         ORDER BY p.fecha_prestamo DESC
         LIMIT 1`,
        [numSerieLimpio]
    )
    return rows[0] || null
}

// fechaInicio: dia en que inicia el prestamo (null = hoy)
// fechaLimite: fecha de devolucion pactada; mientras el prestamo este activo se guarda
// ahi y al registrar la devolucion real se sobrescribe con CURRENT_DATE
exports.crearPrestamoTransaction = async (numSerieLimpio, usuarioLimpio, observacionesLimpias, fechaInicio = null, fechaLimite = null, area = null) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')

        const { rows: eqRows } = await client.query(
            'SELECT * FROM equipos WHERE num_serie = $1', [numSerieLimpio]
        )
        const equipo = eqRows[0]
        if (!equipo) throw new Error('EQUIPO_NO_ENCONTRADO')
        if (equipo.estado !== 'Disponible') throw new Error('EQUIPO_NO_DISPONIBLE')

        await client.query(
            `INSERT INTO prestamos (num_serie, usuario_destino, area, fecha_prestamo, fecha_devolucion, estado, observaciones)
             VALUES ($1, $2, $6, COALESCE($4::date, CURRENT_DATE), $5::date, 'activo', $3)`,
            [numSerieLimpio, usuarioLimpio, observacionesLimpias, fechaInicio, fechaLimite, area]
        )
        await client.query(
            'UPDATE equipos SET estado = $1, responsable = $2 WHERE num_serie = $3',
            ['Asignado', usuarioLimpio, numSerieLimpio]
        )

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.devolverPrestamoTransaction = async (idLimpio) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')

        const { rows: pRows } = await client.query(
            'SELECT * FROM prestamos WHERE id_prestamo = $1', [idLimpio]
        )
        const prestamo = pRows[0]
        if (!prestamo) throw new Error('PRESTAMO_NO_ENCONTRADO')
        if (prestamo.estado !== 'activo') throw new Error('PRESTAMO_YA_DEVUELTO')

        await client.query(
            `UPDATE prestamos SET fecha_devolucion = CURRENT_DATE, estado = 'devuelto' WHERE id_prestamo = $1`,
            [idLimpio]
        )
        await client.query(
            'UPDATE equipos SET estado = $1, responsable = NULL WHERE num_serie = $2',
            ['Disponible', prestamo.num_serie]
        )

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.findHistorialEquipo = async (numSerieLimpio) => {
    const { rows } = await db.query(
        `SELECT p.*, e.equipo, e.descripcion, e.area as equipo_area
         FROM prestamos p
         JOIN equipos e ON p.num_serie = e.num_serie
         WHERE p.num_serie = $1
         ORDER BY p.fecha_prestamo DESC`,
        [numSerieLimpio]
    )
    return rows
}

exports.getEstadisticasData = async () => {
    const { rows: totalRows } = await db.query('SELECT COUNT(*)::int as c FROM equipos')
    const { rows: dispRows } = await db.query(`SELECT COUNT(*)::int as c FROM equipos WHERE estado = 'Disponible'`)
    const { rows: presRows } = await db.query(`SELECT COUNT(*)::int as c FROM prestamos WHERE estado = 'activo'`)
    const { rows: mantRows } = await db.query(`SELECT COUNT(*)::int as c FROM equipos WHERE estado = 'En mantenimiento'`)
    const { rows: bajaRows } = await db.query(`SELECT COUNT(*)::int as c FROM equipos WHERE estado = 'Baja'`)
    return {
        total: totalRows[0].c,
        disponibles: dispRows[0].c,
        prestados: presRows[0].c,
        mantenimiento: mantRows[0].c,
        baja: bajaRows[0].c
    }
}
