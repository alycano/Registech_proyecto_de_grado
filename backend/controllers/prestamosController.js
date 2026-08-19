const db = require('../config/db')
const { formatDate } = require('../utils/date')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

// OBTENER TODOS LOS PRESTAMOS
exports.getPrestamos = (req, res) => {
    const query = `
        SELECT p.*, e.equipo, e.descripcion
        FROM prestamos p
        LEFT JOIN equipos e ON p.num_serie = e.num_serie
        ORDER BY p.fecha_prestamo DESC
    `
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener prestamos:', err)
            return res.status(500).json({ error: 'Error al obtener prestamos' })
        }
        res.json(results)
    })
}

// OBTENER PRESTAMOS ACTIVOS
exports.getPrestamosActivos = (req, res) => {
    const query = `
        SELECT p.*, e.equipo, e.descripcion
        FROM prestamos p
        LEFT JOIN equipos e ON p.num_serie = e.num_serie
        WHERE p.estado = 'activo'
        ORDER BY p.fecha_prestamo DESC
    `
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener prestamos activos:', err)
            return res.status(500).json({ error: 'Error al obtener prestamos activos' })
        }
        res.json(results)
    })
}

// CREAR UN NUEVO PRESTAMO
exports.crearPrestamo = (req, res) => {
    const { num_serie, usuario_destino, observaciones } = req.body

    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const usuarioLimpio = sanitizarTexto(usuario_destino, 50)
    const observacionesLimpias = observaciones ? sanitizarHtml(observaciones, 500) : null

    if (!numSerieLimpio || !usuarioLimpio) {
        return res.status(400).json({ error: 'El numero de serie y el usuario destino son requeridos' })
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener la conexion', err)
            return res.status(500).json({ error: 'Error al obtener la conexion' })
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release()
                return res.status(500).json({ error: 'Error al iniciar la transaccion' })
            }

            // VERIFICAR QUE EL EQUIPO EXISTE Y ESTA DISPONIBLE
            const checkQuery = 'SELECT num_serie, estado FROM equipos WHERE num_serie = ?'
            connection.query(checkQuery, [numSerieLimpio], (errCheck, resultsCheck) => {
                if (errCheck) {
                    return connection.rollback(() => {
                        connection.release()
                        console.error('Error al verificar equipo', errCheck)
                        return res.status(500).json({ error: 'Error al verificar equipo' })
                    })
                }

                if (resultsCheck.length === 0) {
                    return connection.rollback(() => {
                        connection.release()
                        return res.status(404).json({ error: 'Equipo no encontrado' })
                    })
                }

                if (resultsCheck[0].estado !== 'Disponible') {
                    return connection.rollback(() => {
                        connection.release()
                        return res.status(400).json({ error: 'El equipo no esta disponible para prestamo' })
                    })
                }

                // CREAR EL PRESTAMO
                const fecha_prestamo = formatDate()
                const insertQuery = 'INSERT INTO prestamos (num_serie, usuario_destino, fecha_prestamo, estado, observaciones) VALUES (?, ?, ?, ?, ?)'
                connection.query(insertQuery, [numSerieLimpio, usuarioLimpio, fecha_prestamo, 'activo', observacionesLimpias], (errInsert) => {
                    if (errInsert) {
                        return connection.rollback(() => {
                            connection.release()
                            console.error('Error al crear prestamo', errInsert)
                            return res.status(500).json({ error: 'Error al crear prestamo' })
                        })
                    }

                    // ACTUALIZAR ESTADO DEL EQUIPO A ASIGNADO Y PONER RESPONSABLE
                    const updateQuery = 'UPDATE equipos SET estado = "Asignado", responsable = ? WHERE num_serie = ?'
                    connection.query(updateQuery, [usuarioLimpio, numSerieLimpio], (errUpdate) => {
                        if (errUpdate) {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Error al actualizar equipo', errUpdate)
                                return res.status(500).json({ error: 'Error al actualizar equipo' })
                            })
                        }

                        connection.commit((errCommit) => {
                            if (errCommit) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.error('Error al confirmar la transaccion', errCommit)
                                    return res.status(500).json({ error: 'Error al confirmar la transaccion' })
                                })
                            }
                            connection.release()
                            res.status(201).json({ mensaje: 'Prestamo registrado exitosamente' })
                        })
                    })
                })
            })
        })
    })
}

// DEVOLVER UN PRESTAMO
exports.devolverPrestamo = (req, res) => {
    const { id } = req.params

    const idLimpio = sanitizarTexto(id, 50)

    if (!idLimpio) {
        return res.status(400).json({ error: 'El id del prestamo es requerido' })
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error al obtener la conexion', err)
            return res.status(500).json({ error: 'Error al obtener la conexion' })
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release()
                return res.status(500).json({ error: 'Error al iniciar la transaccion' })
            }

            // VERIFICAR QUE EL PRESTAMO EXISTE Y ESTA ACTIVO
            const checkQuery = 'SELECT id_prestamo, num_serie, estado FROM prestamos WHERE id_prestamo = ?'
            connection.query(checkQuery, [idLimpio], (errCheck, resultsCheck) => {
                if (errCheck) {
                    return connection.rollback(() => {
                        connection.release()
                        console.error('Error al verificar prestamo', errCheck)
                        return res.status(500).json({ error: 'Error al verificar prestamo' })
                    })
                }

                if (resultsCheck.length === 0) {
                    return connection.rollback(() => {
                        connection.release()
                        return res.status(404).json({ error: 'Prestamo no encontrado' })
                    })
                }

                if (resultsCheck[0].estado !== 'activo') {
                    return connection.rollback(() => {
                        connection.release()
                        return res.status(400).json({ error: 'Este prestamo ya fue devuelto' })
                    })
                }

                const numSerie = resultsCheck[0].num_serie
                const fecha_devolucion = formatDate()

                // ACTUALIZAR EL PRESTAMO
                const updatePrestamoQuery = 'UPDATE prestamos SET fecha_devolucion = ?, estado = "devuelto" WHERE id_prestamo = ?'
                connection.query(updatePrestamoQuery, [fecha_devolucion, idLimpio], (errUpdatePrestamo) => {
                    if (errUpdatePrestamo) {
                        return connection.rollback(() => {
                            connection.release()
                            console.error('Error al actualizar prestamo', errUpdatePrestamo)
                            return res.status(500).json({ error: 'Error al actualizar prestamo' })
                        })
                    }

                    // ACTUALIZAR EL EQUIPO A DISPONIBLE
                    const updateEquipoQuery = 'UPDATE equipos SET estado = "Disponible", responsable = NULL WHERE num_serie = ?'
                    connection.query(updateEquipoQuery, [numSerie], (errUpdateEquipo) => {
                        if (errUpdateEquipo) {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Error al actualizar equipo', errUpdateEquipo)
                                return res.status(500).json({ error: 'Error al actualizar equipo' })
                            })
                        }

                        connection.commit((errCommit) => {
                            if (errCommit) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.error('Error al confirmar la transaccion', errCommit)
                                    return res.status(500).json({ error: 'Error al confirmar la transaccion' })
                                })
                            }
                            connection.release()
                            res.status(200).json({ mensaje: 'Devolucion registrada exitosamente' })
                        })
                    })
                })
            })
        })
    })
}

// HISTORIAL DE PRESTAMOS DE UN EQUIPO
exports.historialEquipo = (req, res) => {
    const { num_serie } = req.params

    const numSerieLimpio = sanitizarTexto(num_serie, 50)

    if (!numSerieLimpio) {
        return res.status(400).json({ error: 'El numero de serie es requerido' })
    }

    const query = `
        SELECT p.*, e.equipo, e.descripcion
        FROM prestamos p
        LEFT JOIN equipos e ON p.num_serie = e.num_serie
        WHERE p.num_serie = ?
        ORDER BY p.fecha_prestamo DESC
    `

    db.query(query, [numSerieLimpio], (err, results) => {
        if (err) {
            console.error('Error al obtener historial:', err)
            return res.status(500).json({ error: 'Error al obtener historial' })
        }
        res.json(results)
    })
}

// CONTAR ESTADOS PARA DASHBOARD
exports.getEstadisticas = (req, res) => {
    const query = `
        SELECT
            (SELECT COUNT(*) FROM equipos) AS total,
            (SELECT COUNT(*) FROM equipos WHERE estado = 'Disponible') AS disponibles,
            (SELECT COUNT(*) FROM prestamos WHERE estado = 'activo') AS prestados,
            (SELECT COUNT(*) FROM equipos WHERE estado = 'En mantenimiento') AS mantenimiento,
            (SELECT COUNT(*) FROM equipos WHERE estado = 'Baja') AS baja
    `
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener estadisticas:', err)
            return res.status(500).json({ error: 'Error al obtener estadisticas' })
        }
        res.json(results[0])
    })
}
