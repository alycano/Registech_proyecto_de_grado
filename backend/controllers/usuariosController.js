const db = require('../config/db')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// LOGIN DE USUARIO
exports.login = (req, res) => {
    const { usuario, contrasena } = req.body

    if (!usuario || !contrasena) {
        return res.status(400).send('Usuario y contraseña son obligatorios')
    }

    db.query(
        'SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?',
        [usuario, contrasena],
        (err, results) => {
            if (err) {
                console.error('Error detallado en el Login de MySQL:', err)
                return res.status(500).send('Error en la consulta: ' + err.message)
            }

            if (results.length === 0) {
                return res.status(401).send('Usuario o contraseña incorrectos')
            }

            const usuarioEncontrado = results[0]
            res.status(200).send({
                mensaje: 'Login exitoso',
                usuario: {
                    usuario: usuarioEncontrado.usuario,
                    nombre: usuarioEncontrado.nombre,
                    area: usuarioEncontrado.area,
                    estado: usuarioEncontrado.estado
                }
            })
        }
    )
}

// LOGIN CON GOOGLE
// ======================================================

exports.loginGoogle = async (req, res) => {

    const {
        credential
    } = req.body

    if (!credential) {
        return res.status(400).json({ error: 'Falta el credential' })
    }


    try {

        // ==============================================
        // VERIFICAR TOKEN DE GOOGLE
        // ==============================================

        const ticket =
            await client.verifyIdToken({
                idToken: credential,
                audience:
                    process.env.GOOGLE_CLIENT_ID
            })


        const payload =
            ticket.getPayload()


        const {
            sub: googleId,
            email,
            name,
            picture
        } = payload


        // ==============================================
        // BUSCAR USUARIO
        // ==============================================

        db.query(
            'SELECT * FROM usuarios WHERE google_id = ? OR correo = ?',
            [googleId, email],
            (err, results) => {

                if (err) {

                    console.error(
                        'Error buscando usuario de Google:',
                        err
                    )

                    return res.status(500).json({
                        error: 'Error en la consulta'
                    })
                }


                // ==========================================
                // GENERAR TOKEN Y RESPONDER
                // ==========================================

                const generarTokenYResponder = (usuario) => {
                    const token = jwt.sign(
                        { id: usuario.id_usuario, correo: usuario.correo },
                        process.env.JWT_SECRET,
                        { expiresIn: '7d' }
                    )


                        res.cookie(
                            'token',
                            token,
                            {
                                httpOnly: true,
                                secure:
                                    process.env.NODE_ENV ===
                                    'production',
                                sameSite: 'lax',
                                maxAge:
                                    7 * 24 * 60 * 60 * 1000
                            }
                        )


                    res.json({
                        usuario: {
                            id: usuario.id_usuario,
                            correo: usuario.correo,
                            nombre: usuario.nombre,
                            area: usuario.area,
                            estado: usuario.estado,
                            foto: usuario.foto_url || picture
                        }
                    })
                }

                if (results.length > 0) {

                    const usuarioExistente =
                        results[0]


                    db.query(
                        `UPDATE usuarios
                         SET google_id = ?,
                             nombre = ?,
                             foto_url = ?
                         WHERE id_usuario = ?`,
                        [
                            googleId,
                            name,
                            picture,
                            usuarioExistente.id_usuario
                        ],
                        (errUpdate) => {

                            if (errUpdate) {

                                console.error(
                                    'Error actualizando usuario de Google:',
                                    errUpdate
                                )

                                return res.status(500).json({
                                    error:
                                        'Error al actualizar usuario'
                                })
                            }


                            generarTokenYResponder({
                                ...usuarioExistente,
                                nombre: name,
                                foto_url: picture
                            })
                        }
                    )

                } else {

                    // ======================================
                    // CREAR USUARIO NUEVO DE GOOGLE
                    // ======================================

                    db.query(
                        `INSERT INTO usuarios
                        (
                            google_id,
                            correo,
                            nombre,
                            foto_url,
                            estado
                        )
                        VALUES (?, ?, ?, ?, ?)`,
                        [
                            googleId,
                            email,
                            name,
                            picture,
                            'activo'
                        ],
                        (
                            errInsert,
                            resultInsert
                        ) => {

                            if (errInsert) {

                                console.error(
                                    'Error creando usuario de Google:',
                                    errInsert
                                )

                                return res.status(500).json({
                                    error:
                                        'Error al crear usuario'
                                })
                            }


                            generarTokenYResponder({
                                id_usuario:
                                    resultInsert.insertId,
                                correo:
                                    email,
                                nombre:
                                    name,
                                area:
                                    null,
                                estado:
                                    'activo',
                                foto_url:
                                    picture
                            })
                        }
                    )
                }
            }
        )

    } catch (error) {

        console.error(
            'Error en login con Google:',
            error
        )

        return res.status(401).json({
            error: 'Token inválido'
        })
    }
}


// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================

exports.getUsuarios = (req, res) => {

    db.query(
        `SELECT
            usuario,
            nombre,
            area,
            correo,
            estado
         FROM usuarios`,
        (err, results) => {

            if (err) {

                console.error(
                    'Error al obtener usuarios:',
                    err
                )

                return res.status(500).send(
                    'Error en la consulta'
                )
            }


            res.json(results)
        }
    )
}


// ======================================================
// AGREGAR NUEVO USUARIO
// ======================================================

exports.createUsuario = (req, res) => {
    const { usuario, contrasena, nombre, area, correo, estado } = req.body

    if (!usuario || !contrasena || !nombre || !area || !correo) {
        return res.status(400).send('Todos los campos son obligatorios')
    }

    const estadoFinal = estado || 'activo'
    const query = `INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES (?, ?, ?, ?, ?, ?)`

    db.query(query, [usuario, contrasena, nombre, area, correo, estadoFinal], (err, results) => {
        if (err) {
            console.error('Error al agregar el usuario: ', err)
            return res.status(500).send('Error al agregar el usuario')
        }

        res.status(201).send({
            usuario, nombre, area, correo, estado: estadoFinal
        })
    })
}


// ======================================================
// EDITAR USUARIO
// ======================================================

exports.updateUsuario = (req, res) => {
    const { usuario: usuarioParam } = req.params
    const { usuario, contrasena, nombre, area, correo, estado } = req.body

    const query = `UPDATE usuarios SET usuario = ?, contrasena = ?, nombre = ?, area = ?, correo = ?, estado = ? WHERE usuario = ?`

    db.query(query, [usuario, contrasena, nombre, area, correo, estado, usuarioParam], (err, result) => {
        if (err) {
            console.error('Error al editar: ', err)
            return res.status(500).send('Error al editar el usuario')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado')
        }

        res.send('Usuario actualizado')
    })
}


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUsuario = (req, res) => {
    const { usuario } = req.params
    const query = `DELETE FROM usuarios WHERE usuario = ?`

    db.query(query, [usuario], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err)
            return res.status(500).send('Error al eliminar el usuario')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado')
        }

        res.send('Usuario eliminado')
    })
}