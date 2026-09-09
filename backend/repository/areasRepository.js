const db = require('../lib/db')

// ======================================================
// OBTENER TODAS LAS ÁREAS
// ======================================================

exports.findAll = async () => {
    const { rows } = await db.query(
        `
        SELECT area
        FROM areas
        ORDER BY area
        `
    )

    return rows
}


// ======================================================
// VERIFICAR SI EXISTE UN ÁREA
// ======================================================

exports.exists = async (area) => {

    const { rows } = await db.query(
        `
        SELECT 1
        FROM areas
        WHERE LOWER(area) = LOWER($1)
        `,
        [area]
    )

    return rows.length > 0
}


// ======================================================
// CREAR ÁREA
// ======================================================

exports.create = async (area) => {

    await db.query(
        `
        INSERT INTO areas (area)
        VALUES ($1)
        `,
        [area]
    )
}


// ======================================================
// RENOMBRAR ÁREA
// ======================================================
//
// IMPORTANTE:
//
// NO modificamos equipos.area.
//
// Los equipos disponibles pertenecen al inventario general,
// por lo que NO deben considerarse pertenecientes a un
// departamento.
//
// Cuando un equipo está prestado, su departamento se obtiene
// desde prestamos.area.
//
// Al renombrar un departamento sí actualizamos:
//
//   - usuarios.area
//   - empleados.area
//   - prestamos.area
//   - areas.area
//
// ======================================================

exports.rename = async (viejaLimpia, nuevaLimpia) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')


        // ==================================================
        // ACTUALIZAR USUARIOS
        // ==================================================

        await client.query(
            `
            UPDATE usuarios
            SET area = $1
            WHERE LOWER(area) = LOWER($2)
            `,
            [
                nuevaLimpia,
                viejaLimpia
            ]
        )


        // ==================================================
        // ACTUALIZAR EMPLEADOS
        // ==================================================

        await client.query(
            `
            UPDATE empleados
            SET area = $1
            WHERE LOWER(area) = LOWER($2)
            `,
            [
                nuevaLimpia,
                viejaLimpia
            ]
        )


        // ==================================================
        // ACTUALIZAR PRÉSTAMOS
        // ==================================================
        //
        // Esto es importante porque los equipos prestados
        // toman su departamento desde prestamos.area.
        //
        // Si renombramos "Sistemas" a "Tecnología", los
        // préstamos activos deben pasar a "Tecnología".
        //
        // ==================================================

        await client.query(
            `
            UPDATE prestamos
            SET area = $1
            WHERE LOWER(area) = LOWER($2)
            `,
            [
                nuevaLimpia,
                viejaLimpia
            ]
        )


        // ==================================================
        // ACTUALIZAR EL DEPARTAMENTO
        // ==================================================

        const resultado = await client.query(
            `
            UPDATE areas
            SET area = $1
            WHERE LOWER(area) = LOWER($2)
            `,
            [
                nuevaLimpia,
                viejaLimpia
            ]
        )


        await client.query('COMMIT')

        return resultado.rowCount > 0

    } catch (error) {

        await client.query('ROLLBACK')

        throw error

    } finally {

        client.release()

    }
}


// ======================================================
// ELIMINAR ÁREA
// ======================================================

exports.remove = async (area) => {

    const { rowCount } = await db.query(
        `
        DELETE FROM areas
        WHERE LOWER(area) = LOWER($1)
        `,
        [area]
    )

    return rowCount > 0
}


// ======================================================
// CONTAR USO DEL ÁREA
// ======================================================
//
// Un departamento se considera ocupado si tiene:
//
//   1. Usuarios pertenecientes al departamento.
//   2. Empleados pertenecientes al departamento.
//   3. Equipos actualmente prestados a personas de ese
//      departamento.
//
// IMPORTANTE:
//
// NO contamos equipos.area.
//
// Un equipo disponible puede tener un valor antiguo en
// equipos.area y aun así NO pertenece al departamento.
//
// ======================================================

exports.contarUso = async (area) => {

    const { rows } = await db.query(
        `
        SELECT

            (
                SELECT COUNT(*)::int
                FROM usuarios
                WHERE LOWER(area) = LOWER($1)
            ) AS usuarios,


            (
                SELECT COUNT(*)::int
                FROM empleados
                WHERE LOWER(area) = LOWER($1)
            ) AS empleados,


            (
                SELECT COUNT(*)::int
                FROM equipos e
                WHERE LOWER(e.area) = LOWER($1)
                  AND e.estado <> 'Baja'
            ) AS equipos

        `,
        [area]
    )

    return rows[0]
}