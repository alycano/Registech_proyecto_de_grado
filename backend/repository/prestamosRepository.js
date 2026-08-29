const db = require('../lib/db')

exports.findPrestamos = async () => {
    const { rows } = await db.query(
        `SELECT 
            p.*,
            pe.num_serie,
            e.equipo,
            e.descripcion,
            e.area as equipo_area
         FROM prestamos p
         JOIN prestamo_equipos pe ON p.id_prestamo = pe.id_prestamo
         JOIN equipos e ON pe.num_serie = e.num_serie
         ORDER BY p.fecha_prestamo DESC`
    )

    return rows
}

exports.findPrestamosActivos = async () => {
    const { rows } = await db.query(
        `SELECT 
            p.*,
            pe.num_serie,
            e.equipo,
            e.descripcion,
            e.area as equipo_area
         FROM prestamos p
         JOIN prestamo_equipos pe ON p.id_prestamo = pe.id_prestamo
         JOIN equipos e ON pe.num_serie = e.num_serie
         WHERE p.estado = 'activo'
         ORDER BY p.fecha_prestamo DESC`
    )

    return rows
}

exports.findPrestamoActivoPorEquipo = async (numSerieLimpio) => {
    const { rows } = await db.query(
        `SELECT 
            p.*,
            pe.num_serie,
            e.equipo,
            e.descripcion,
            e.area as equipo_area
         FROM prestamos p
         JOIN prestamo_equipos pe ON p.id_prestamo = pe.id_prestamo
         JOIN equipos e ON pe.num_serie = e.num_serie
         WHERE pe.num_serie = $1
           AND p.estado = 'activo'
         ORDER BY p.fecha_prestamo DESC
         LIMIT 1`,
        [numSerieLimpio]
    )

    return rows[0] || null
}


// ======================================================
// CREAR PRÉSTAMO CON VARIOS EQUIPOS
// ======================================================

exports.crearPrestamoTransaction = async (
    numSeriesLimpios,
    usuarioLimpio,
    observacionesLimpias,
    fechaInicio = null,
    fechaLimite = null,
    area = null
) => {
    const client = await db.pool.connect()

    try {
        await client.query('BEGIN')

        if (!Array.isArray(numSeriesLimpios) || numSeriesLimpios.length === 0) {
            throw new Error('REQUERIDOS')
        }

        // Verificar que todos los equipos existan y estén disponibles
        for (const numSerie of numSeriesLimpios) {
            const { rows } = await client.query(
                'SELECT * FROM equipos WHERE num_serie = $1',
                [numSerie]
            )

            const equipo = rows[0]

            if (!equipo) {
                throw new Error('EQUIPO_NO_ENCONTRADO')
            }

            if (equipo.estado !== 'Disponible') {
                throw new Error('EQUIPO_NO_DISPONIBLE')
            }
        }

        // Crear un único préstamo
        const { rows: prestamoRows } = await client.query(
            `INSERT INTO prestamos
                (
                    usuario_destino,
                    area,
                    fecha_prestamo,
                    fecha_devolucion,
                    estado,
                    observaciones
                )
             VALUES
                (
                    $1,
                    $2,
                    COALESCE($4::date, CURRENT_DATE),
                    $5::date,
                    'activo',
                    $3
                )
             RETURNING id_prestamo`,
            [
                usuarioLimpio,
                area,
                observacionesLimpias,
                fechaInicio,
                fechaLimite
            ]
        )

        const idPrestamo = prestamoRows[0].id_prestamo

        // Relacionar todos los equipos con el préstamo
        for (const numSerie of numSeriesLimpios) {

            await client.query(
                `INSERT INTO prestamo_equipos
                    (id_prestamo, num_serie)
                 VALUES ($1, $2)`,
                [idPrestamo, numSerie]
            )

            // Marcar cada equipo como asignado
            await client.query(
                `UPDATE equipos
                 SET estado = $1,
                     responsable = $2
                 WHERE num_serie = $3`,
                ['Asignado', usuarioLimpio, numSerie]
            )
        }

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}


// ======================================================
// DEVOLVER PRÉSTAMO
// ======================================================

exports.devolverPrestamoTransaction = async (
    idLimpio,
    observaciones,
    evidencia
) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')

        // -----------------------------------------------
        // 1. Buscar préstamo
        // -----------------------------------------------

        const { rows: pRows } = await client.query(
            `SELECT *
             FROM prestamos
             WHERE id_prestamo = $1`,
            [idLimpio]
        )

        const prestamo = pRows[0]

        if (!prestamo) {
            throw new Error('PRESTAMO_NO_ENCONTRADO')
        }

        if (prestamo.estado !== 'activo') {
            throw new Error('PRESTAMO_YA_DEVUELTO')
        }

        // -----------------------------------------------
        // 2. Obtener TODOS los equipos del préstamo
        // -----------------------------------------------

        const { rows: equiposPrestamo } = await client.query(
            `SELECT num_serie
             FROM prestamo_equipos
             WHERE id_prestamo = $1`,
            [idLimpio]
        )

        // -----------------------------------------------
        // 3. Registrar devolución
        // -----------------------------------------------

        await client.query(
            `UPDATE prestamos
             SET fecha_devolucion = CURRENT_DATE,
                 estado = 'devuelto',
                 observaciones = COALESCE($2, observaciones),
                 evidencia = $3
             WHERE id_prestamo = $1`,
            [
                idLimpio,
                observaciones,
                evidencia
            ]
        )

        // -----------------------------------------------
        // 4. Liberar TODOS los equipos
        // -----------------------------------------------

        for (const equipo of equiposPrestamo) {

            await client.query(
                `UPDATE equipos
                 SET estado = $1,
                     responsable = NULL
                 WHERE num_serie = $2`,
                [
                    'Disponible',
                    equipo.num_serie
                ]
            )
        }

        await client.query('COMMIT')

    } catch (e) {

        await client.query('ROLLBACK')
        throw e

    } finally {

        client.release()

    }
}


// ======================================================
// HISTORIAL DE UN EQUIPO
// ======================================================

exports.findHistorialEquipo = async (numSerieLimpio) => {

    const { rows } = await db.query(
        `SELECT
            p.*,
            pe.num_serie,
            e.equipo,
            e.descripcion,
            e.area as equipo_area
         FROM prestamos p
         JOIN prestamo_equipos pe
             ON p.id_prestamo = pe.id_prestamo
         JOIN equipos e
             ON pe.num_serie = e.num_serie
         WHERE pe.num_serie = $1
         ORDER BY p.fecha_prestamo DESC`,
        [numSerieLimpio]
    )

    return rows
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticasData = async () => {

    const { rows: totalRows } = await db.query(
        'SELECT COUNT(*)::int as c FROM equipos'
    )

    const { rows: dispRows } = await db.query(
        `SELECT COUNT(*)::int as c
         FROM equipos
         WHERE estado = 'Disponible'`
    )

    const { rows: presRows } = await db.query(
        `SELECT COUNT(*)::int as c
         FROM prestamos
         WHERE estado = 'activo'`
    )

    const { rows: mantRows } = await db.query(
        `SELECT COUNT(*)::int as c
         FROM equipos
         WHERE estado = 'En mantenimiento'`
    )

    const { rows: bajaRows } = await db.query(
        `SELECT COUNT(*)::int as c
         FROM equipos
         WHERE estado = 'Baja'`
    )

    return {
        total: totalRows[0].c,
        disponibles: dispRows[0].c,
        prestados: presRows[0].c,
        mantenimiento: mantRows[0].c,
        baja: bajaRows[0].c
    }
}

// Registra la devolución parcial de un equipo específico dentro de un préstamo
exports.devolverEquipoParcialTransaction = async (id_prestamo, num_serie, observaciones) => {
    const client = await db.pool.connect()

    try {
        await client.query('BEGIN')

        // 1. Verificar si existe la relación en la tabla intermedia
        const { rows: peRows } = await client.query(
            `SELECT * FROM prestamo_equipos WHERE id_prestamo = $1 AND num_serie = $2`,
            [id_prestamo, num_serie]
        )

        const prestamoEquipo = peRows[0]

        if (!prestamoEquipo) {
            throw new Error('EQUIPO_NO_ENCONTRADO_EN_PRESTAMO')
        }

        if (prestamoEquipo.estado === 'devuelto') {
            throw new Error('EQUIPO_YA_DEVUELTO')
        }

        // 2. Actualizar el estado del equipo en la tabla intermedia a 'devuelto'
        await client.query(
            `UPDATE prestamo_equipos SET estado = 'devuelto' WHERE id_prestamo = $1 AND num_serie = $2`,
            [id_prestamo, num_serie]
        )

        // 3. Cambiar el estado del equipo general en la tabla 'equipos' a 'Disponible' y limpiar responsable
        await client.query(
            `UPDATE equipos SET estado = 'Disponible', responsable = NULL WHERE num_serie = $1`,
            [num_serie]
        )

        // 4. Verificar cuántos equipos siguen pendientes (estado 'prestado' o distinto de 'devuelto') en este préstamo
        const { rows: countRows } = await client.query(
            `SELECT COUNT(*)::int as pendientes FROM prestamo_equipos WHERE id_prestamo = $1 AND estado != 'devuelto'`,
            [id_prestamo]
        )

        const equiposPendientes = countRows[0].pendientes

        // 5. Si ya no quedan equipos pendientes, se finaliza el préstamo; si no, queda como parcial
        if (equiposPendientes === 0) {
            await client.query(
                `UPDATE prestamos SET estado = 'finalizado', fecha_devolucion = CURRENT_DATE, observaciones = COALESCE($2, observaciones) WHERE id_prestamo = $1`,
                [id_prestamo, observaciones || null]
            )
        } else {
            await client.query(
                `UPDATE prestamos SET estado = 'parcial' WHERE id_prestamo = $1`,
                [id_prestamo]
            )
        }

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
};