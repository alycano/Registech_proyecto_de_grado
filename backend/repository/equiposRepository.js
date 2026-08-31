const db = require('../lib/db')


// ======================================================
// OBTENER ESTADOS DE EQUIPOS
// ======================================================

exports.findEstados = async () => {

    const { rows } = await db.query(
        'SELECT estado FROM estados_equipos'
    )

    return rows
}


// ======================================================
// OBTENER EQUIPOS
// ======================================================

exports.findEquipos = async () => {

    const { rows } = await db.query(
        'SELECT * FROM equipos'
    )

    return rows
}


// ======================================================
// CREAR EQUIPO
// ======================================================

exports.crearEquipo = async (datos) => {

    try {

        const { rows } = await db.query(

            `INSERT INTO equipos (
                num_serie,
                equipo,
                area,
                descripcion,
                sistema_operativo,
                imagen,
                estado,
                fecha_adquisicion
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                COALESCE($8::date, CURRENT_DATE)
            )
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

        if (e.code === '23505') {
            throw new Error('EQUIPO_DUPLICADO')
        }

        throw e
    }
}


// ======================================================
// ACTUALIZAR RESPONSABLE
// ======================================================

exports.updateResponsable = async (
    numSerieLimpio,
    responsable
) => {

    const { rows } = await db.query(

        `UPDATE equipos
         SET responsable = $1
         WHERE num_serie = $2
         RETURNING *`,

        [
            responsable,
            numSerieLimpio
        ]
    )

    return rows[0]
}


// ======================================================
// BUSCAR USUARIO
// ======================================================

exports.buscarUsuario = async (usuario) => {

    const { rows } = await db.query(

        `SELECT
            usuario,
            nombre,
            correo,
            rol
         FROM usuarios
         WHERE usuario = $1
         LIMIT 1`,

        [usuario]
    )

    return rows[0] || null
}


// ======================================================
// OBTENER USUARIOS POR ROL
// ======================================================

exports.obtenerUsuariosPorRol = async (rol) => {

    const { rows } = await db.query(

        `SELECT
            usuario,
            nombre,
            correo,
            rol
         FROM usuarios
         WHERE rol = $1
         AND estado = 'Activo'
         ORDER BY usuario ASC`,

        [rol]
    )

    return rows
}


// ======================================================
// CREAR REPORTE DE FALLA
//
// Guarda:
// - quién reportó
// - estado de la orden
// - quién aprobó
// - evidencia
//
// ======================================================

exports.createReporteTransaction = async (
    numSerieLimpio,
    id_historial,
    fecha_reporte,
    fallaLimpia,
    evidencia,
    estadoOrden = 'pendiente',
    aprobadoPor = null,
    usuarioReporta = null
) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')


        // ==================================================
        // PONER EQUIPO EN MANTENIMIENTO
        // ==================================================

        await client.query(

            `UPDATE equipos
             SET estado = $1
             WHERE num_serie = $2`,

            [
                'En mantenimiento',
                numSerieLimpio
            ]
        )


        // ==================================================
        // CREAR HISTORIAL
        // ==================================================

        await client.query(

            `INSERT INTO historial_mantenimientos (
                id_historial,
                num_serie,
                fecha_reporte,
                usuario_reporta,
                falla,
                evidencia,
                estado_orden,
                aprobada_por,
                fecha_aprobacion
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                CASE
                    WHEN $7 = 'aprobada'
                    THEN CURRENT_DATE
                    ELSE NULL
                END
            )`,

            [
                id_historial,
                numSerieLimpio,
                fecha_reporte,
                usuarioReporta || null,
                fallaLimpia,
                evidencia || null,
                estadoOrden,
                aprobadoPor || null
            ]
        )


        await client.query('COMMIT')

    } catch (e) {

        await client.query('ROLLBACK')

        throw e

    } finally {

        client.release()
    }
}


// ======================================================
// OBTENER REPORTES ACTIVOS
//
// Muestra:
// - pendientes
// - aprobadas
//
// No muestra:
// - rechazadas
// - solucionadas
// ======================================================

exports.findReportesPendientes = async () => {

    const { rows } = await db.query(

        `SELECT
            hm.*,
            e.equipo,
            e.area,
            e.descripcion AS descripcion_equipo,
            e.estado AS estado_equipo,
            e.responsable
         FROM historial_mantenimientos hm
         JOIN equipos e
           ON hm.num_serie = e.num_serie
         WHERE hm.fecha_solucion IS NULL
         AND hm.estado_orden != 'rechazada'
         ORDER BY hm.fecha_reporte ASC`

    )

    return rows
}


// ======================================================
// HISTORIAL COMPLETO
// ======================================================

exports.findHistorialCompleto = async () => {

    const { rows } = await db.query(

        `SELECT
            hm.*,
            e.equipo,
            e.area,
            e.descripcion AS descripcion_equipo,
            e.estado AS estado_equipo,
            e.responsable
         FROM historial_mantenimientos hm
         JOIN equipos e
           ON hm.num_serie = e.num_serie
         ORDER BY hm.fecha_reporte DESC`

    )

    return rows
}


// ======================================================
// BUSCAR REPORTE POR ID
// ======================================================

exports.buscarReportePorId = async (
    idHistorialLimpio
) => {

    const { rows } = await db.query(

        `SELECT
            hm.*,
            e.equipo,
            e.area,
            e.descripcion AS descripcion_equipo,
            e.estado AS estado_equipo,
            e.responsable
         FROM historial_mantenimientos hm
         JOIN equipos e
           ON hm.num_serie = e.num_serie
         WHERE hm.id_historial = $1
         LIMIT 1`,

        [idHistorialLimpio]
    )

    return rows[0] || null
}


// ======================================================
// APROBAR / RECHAZAR ORDEN
// ======================================================

exports.decidirOrden = async (
    idHistorialLimpio,
    decision,
    aprobadoPor = null
) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')

        let resultado


        // ==================================================
        // APROBAR
        // ==================================================

        if (decision === 'aprobada') {

            resultado = await client.query(

                `UPDATE historial_mantenimientos
                 SET
                    estado_orden = 'aprobada',
                    aprobada_por = $2,
                    fecha_aprobacion = CURRENT_DATE
                 WHERE id_historial = $1
                 AND estado_orden = 'pendiente'
                 AND fecha_solucion IS NULL
                 RETURNING *`,

                [
                    idHistorialLimpio,
                    aprobadoPor
                ]
            )

        }


        // ==================================================
        // RECHAZAR
        // ==================================================

        else {

            resultado = await client.query(

                `UPDATE historial_mantenimientos
                 SET
                    estado_orden = 'rechazada'
                 WHERE id_historial = $1
                 AND estado_orden = 'pendiente'
                 AND fecha_solucion IS NULL
                 RETURNING *`,

                [
                    idHistorialLimpio
                ]
            )


            // ==================================================
            // SI SE RECHAZA:
            // EL EQUIPO VUELVE A ESTAR DISPONIBLE
            // ==================================================

            if (resultado.rows[0]) {

                await client.query(

                    `UPDATE equipos
                     SET estado = $1
                     WHERE num_serie = $2`,

                    [
                        'Disponible',
                        resultado.rows[0].num_serie
                    ]
                )
            }
        }


        await client.query('COMMIT')


        if (!resultado.rows[0]) {
            return null
        }


        return resultado.rows[0]

    } catch (e) {

        await client.query('ROLLBACK')

        throw e

    } finally {

        client.release()
    }
}


// ======================================================
// RESOLVER REPORTE
// ======================================================

exports.resolverReporteTransaction = async (
    numSerieLimpio,
    idHistorialLimpio,
    fecha_solucion,
    tecnicoLimpio,
    solucionLimpia
) => {

    const client = await db.pool.connect()

    try {

        await client.query('BEGIN')


        // ==================================================
        // REGISTRAR SOLUCIÓN
        // ==================================================

        const orden = await client.query(

            `UPDATE historial_mantenimientos
             SET
                fecha_solucion = $1,
                usuario_tecnico = $2,
                solucion = $3
             WHERE id_historial = $4
             AND estado_orden = 'aprobada'
             AND fecha_solucion IS NULL
             RETURNING *`,

            [
                fecha_solucion,
                tecnicoLimpio,
                solucionLimpia,
                idHistorialLimpio
            ]
        )


        if (!orden.rows[0]) {

            await client.query('ROLLBACK')

            return null
        }


        // ==================================================
        // EQUIPO DISPONIBLE
        // ==================================================

        await client.query(

            `UPDATE equipos
             SET estado = $1
             WHERE num_serie = $2`,

            [
                'Disponible',
                numSerieLimpio
            ]
        )


        await client.query('COMMIT')


        return orden.rows[0]

    } catch (e) {

        await client.query('ROLLBACK')

        throw e

    } finally {

        client.release()
    }
}


// ======================================================
// BUSCAR MANTENIMIENTOS
// ======================================================

exports.buscarMantenimientos = async (
    filtroLimpio
) => {

    const { rows } = await db.query(

        `SELECT
            hm.*,
            e.equipo,
            e.area
         FROM historial_mantenimientos hm
         JOIN equipos e
           ON hm.num_serie = e.num_serie
         WHERE hm.solucion IS NOT NULL
         AND (
             hm.id_historial LIKE $1
             OR hm.num_serie LIKE $1
             OR hm.usuario_tecnico LIKE $1
         )
         ORDER BY hm.fecha_solucion DESC`,

        [
            `%${filtroLimpio}%`
        ]
    )

    return rows
}