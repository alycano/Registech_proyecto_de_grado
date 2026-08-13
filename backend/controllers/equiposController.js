const db = require('../config/db')
const { formatDate } = require('../utils/date')

// OBTENER TODOS LOS ESTADOS DE LOS EQUIPOS
exports.getEstadosEquipo = (req, res) => {
    db.query('SELECT * FROM estados_equipos', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// OBTENER TODOS LOS EQUIPOS
exports.getEquipos = (req, res) => {
    db.query('SELECT * FROM equipos', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// ASIGNAR USUARIO A UN EQUIPO
exports.asignarUsuario = (req, res) => {
    const { num_serie, usuario } = req.body

    if (!num_serie) {
        return res.status(400).send('El numero de serie es requerido')
    }

    // SI EL USUARIO NO EXISTE O ESTA VACIO, ASIGNAMOS NULL
    const responsable = usuario && usuario.trim() !== '' ? usuario : null
    const query = 'UPDATE equipos SET responsable = ? WHERE num_serie = ?'

    db.query(query, [responsable, num_serie], (err, results) => {
        if (err) {
            console.error('Error al asignar usuario al equipo', err)
            return res.status(500).send('Error al asignar usuario al equipo')
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Equipo no encontrado')
        }

        res.status(200).send('Se asigno exitosamente el usuario al equipo correspondiente')
    })
}

// REGISTRAR UN NUEVO REPORTE DE FALLA
exports.reporteFalla = (req, res) => {
    const { num_serie, falla } = req.body

    if (!num_serie || !falla) {
        return res.status(400).send('El numero de serie y la falla son requeridos')
    }

    const fecha_reporte = formatDate()
    const id_historial = Date.now()

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).send('Error al iniciar la transaccion')
        }

        // ACTUALIZAR EL ESTADO DEL EQUIPO A MANTENIMIENTO
        const updateEstadoQuery = 'UPDATE equipos SET estado="Mantenimiento" WHERE num_serie=?'
        db.query(updateEstadoQuery, [num_serie], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado del equipo', err)
                    return res.status(500).send('Error al actualizar el estado del equipo')
                })
            }

            if (result.affectedRows === 0) {
                return db.rollback(() => {
                    return res.status(404).send('Equipo no encontrado')
                })
            }

            // INSERTAR EL NUEVO REGISTRO EN LA TABLA HISTORIAL_MANTENIMIENTOS
            const insertHistorialQuery = 'INSERT INTO historial_mantenimientos(id_historial, num_serie, fecha_reporte, falla) VALUES(?, ?, ?, ?)'
            db.query(insertHistorialQuery, [id_historial, num_serie, fecha_reporte, falla], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al insertar el registro en la tabla historial de mantenimientos', err)
                        return res.status(500).send('Error al insertar el registro en la tabla historial de mantenimientos')
                    })
                }

                // CONFIRMAR LA TRANSACCION
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transaccion', err)
                            return res.status(500).send('Error al confirmar la transaccion')
                        })
                    }
                    res.status(200).send('Estado actualizado a mantenimiento y reporte registrado exitosamente')
                })
            })
        })
    })
}

// OBTENER LOS MANTENIMIENTOS PENDIENTES ORDENADOS POR FECHA DE REPORTE
exports.getReportes = (req, res) => {
    const query = 'SELECT * FROM historial_mantenimientos WHERE fecha_solucion IS NULL ORDER BY fecha_reporte ASC'

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// ACTUALIZAR LA SOLUCION EN EL HISTORIAL Y CAMBIAR EL ESTADO DEL EQUIPO
exports.resolverReporte = (req, res) => {
    const { num_serie, id_historial, tecnico, solucion } = req.body

    if (!num_serie || !id_historial || !tecnico || !solucion) {
        return res.status(400).send('El numero de serie, id_historial, tecnico y solucion son requeridos')
    }

    const fecha_solucion = formatDate()

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).send('Error al iniciar la transaccion')
        }

        // ACTUALIZAR EL ESTADO DEL EQUIPO A ACTIVO
        const updateEstadoQuery = 'UPDATE equipos SET estado="Activo" WHERE num_serie=?'
        db.query(updateEstadoQuery, [num_serie], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado del equipo', err)
                    return res.status(500).send('Error al actualizar el estado del equipo')
                })
            }

            // ACTUALIZAR EL REGISTRO EN LA TABLA HISTORIAL_MANTENIMIENTOS
            const updateHistorialQuery = 'UPDATE historial_mantenimientos SET fecha_solucion=?, usuario_tecnico=?, solucion=? WHERE id_historial=?'
            db.query(updateHistorialQuery, [fecha_solucion, tecnico, solucion, id_historial], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al actualizar el historial', err)
                        return res.status(500).send('Error al actualizar el historial')
                    })
                }

                // CONFIRMAR LA TRANSACCION
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transaccion', err)
                            return res.status(500).send('Error al confirmar la transaccion')
                        })
                    }

                    res.status(200).send('Estado del equipo actualizado a activo y mantenimiento actualizado')
                })
            })
        })
    })
}

// BUSCAR MANTENIMIENTOS POR FILTRO
exports.buscarMantenimientos = (req, res) => {
    const { filter } = req.body

    if (!filter) {
        return res.status(400).json({
            error: 'Se debe proporcionar al menos uno de los elementos'
        })
    }

    const query = `SELECT * FROM historial_mantenimientos WHERE (id_historial = ?
    OR num_serie = ?
    OR usuario_tecnico = ?)
    AND solucion IS NOT NULL`

    db.query(query, [filter, filter, filter], (err, result) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(result)
    })
}
