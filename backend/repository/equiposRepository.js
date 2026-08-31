const db = require('../lib/db')

exports.findEstados = async () => {
    const { rows } = await db.query('SELECT estado FROM estados_equipos')
    return rows
}

exports.findEquipos = async () => {
    const { rows } = await db.query('SELECT * FROM equipos')
    return rows
}

// Registra un nuevo equipo en el inventario
exports.crearEquipo = async (datos) => {
    try {
        const { rows } = await db.query(
            `INSERT INTO equipos (num_serie, equipo, area, descripcion, sistema_operativo, imagen, estado, fecha_adquisicion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE))
             RETURNING *`,
            [
                datos.num_serie,
                datos.equipo,
                datos.area || 'Sin asignar',
                datos.descripcion || null,
                datos.sistema_operativo || null,
                datos.imagen || null,
                datos.estado,
                datos.fecha_adquisicion || null
            ]
        )
        return rows[0]
    } catch (e) {
        // 23505 = unique_violation (num_serie ya existe)
        if (e.code === '23505') throw new Error('EQUIPO_DUPLICADO')
        throw e
    }
}

exports.updateResponsable = async (numSerieLimpio, responsable) => {
    const { rows } = await db.query(
        'UPDATE equipos SET responsable = $1 WHERE num_serie = $2 RETURNING *',
        [responsable, numSerieLimpio]
    )
    return rows[0]
}

// Libera un equipo que quedó marcado como asignado sin préstamo activo
exports.liberarEquipo = async (numSerieLimpio) => {
    const { rows } = await db.query(
        `UPDATE equipos
         SET estado = $1,
             responsable = NULL
         WHERE num_serie = $2
         RETURNING *`,
        ['Disponible', numSerieLimpio]
    )
    return rows[0]
}

exports.createReporteTransaction = async (numSerieLimpio, id_historial, fecha_reporte, fallaLimpia, evidencia) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')
        await client.query('UPDATE equipos SET estado = $1 WHERE num_serie = $2', ['En mantenimiento', numSerieLimpio])
        await client.query(
            'INSERT INTO historial_mantenimientos (id_historial, num_serie, fecha_reporte, falla, evidencia, estado_orden) VALUES ($1, $2, $3, $4, $5, $6)',
            [id_historial, numSerieLimpio, fecha_reporte, fallaLimpia, evidencia || null, 'pendiente']
        )
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.findReportesPendientes = async () => {
    const { rows } = await db.query(
        `SELECT hm.*, e.equipo, e.area
         FROM historial_mantenimientos hm
         JOIN equipos e ON hm.num_serie = e.num_serie
         WHERE hm.fecha_solucion IS NULL AND hm.estado_orden != 'rechazada'
         ORDER BY hm.fecha_reporte ASC`
    )
    return rows
}

// Historial completo de mantenimientos (resueltos, pendientes y rechazados)
exports.findHistorialCompleto = async () => {
    const { rows } = await db.query(
        `SELECT hm.*, e.equipo, e.area
         FROM historial_mantenimientos hm
         JOIN equipos e ON hm.num_serie = e.num_serie
         ORDER BY hm.fecha_reporte DESC`
    )
    return rows
}

exports.decidirOrden = async (idHistorialLimpio, decision, aprobadoPor = null) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')

        let resultado
        if (decision === 'aprobada') {
            resultado = await client.query(
                "UPDATE historial_mantenimientos SET estado_orden = 'aprobada', aprobada_por = $2, fecha_aprobacion = CURRENT_DATE WHERE id_historial = $1 AND estado_orden = 'pendiente' AND fecha_solucion IS NULL RETURNING num_serie",
                [idHistorialLimpio, aprobadoPor]
            )
        } else {
            resultado = await client.query(
                "UPDATE historial_mantenimientos SET estado_orden = 'rechazada' WHERE id_historial = $1 AND estado_orden = 'pendiente' AND fecha_solucion IS NULL RETURNING num_serie",
                [idHistorialLimpio]
            )
            if (resultado.rows[0]) {
                await client.query('UPDATE equipos SET estado = $1 WHERE num_serie = $2', ['Disponible', resultado.rows[0].num_serie])
            }
        }

        await client.query('COMMIT')
        return resultado.rows[0] || null
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.resolverReporteTransaction = async (numSerieLimpio, idHistorialLimpio, fecha_solucion, tecnicoLimpio, solucionLimpia) => {
    const client = await db.pool.connect()
    try {
        await client.query('BEGIN')
        const orden = await client.query(
            "UPDATE historial_mantenimientos SET fecha_solucion = $1, usuario_tecnico = $2, solucion = $3 WHERE id_historial = $4 AND estado_orden = 'aprobada' AND fecha_solucion IS NULL RETURNING num_serie",
            [fecha_solucion, tecnicoLimpio, solucionLimpia, idHistorialLimpio]
        )
        if (!orden.rows[0]) {
            await client.query('ROLLBACK')
            return null
        }
        await client.query('UPDATE equipos SET estado = $1 WHERE num_serie = $2', ['Disponible', numSerieLimpio])
        await client.query('COMMIT')
        return orden.rows[0]
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

exports.buscarMantenimientos = async (filtroLimpio) => {
    const { rows } = await db.query(
        `SELECT * FROM historial_mantenimientos
         WHERE solucion IS NOT NULL
         AND (id_historial LIKE $1 OR num_serie LIKE $1 OR usuario_tecnico LIKE $1)`,
        [`%${filtroLimpio}%`]
    )
    return rows
}
