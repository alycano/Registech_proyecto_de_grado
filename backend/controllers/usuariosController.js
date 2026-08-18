const db = require('../config/db')
const { OAuth2Client } = require('google-auth-library')
const axios = require('axios')
const bcrypt = require('bcryptjs')

const {
    sanitizarTexto,
    sanitizarHtml,
    esCorreoValido,
    AREAS
} = require('../utils/sanitize')

const { signToken } = require('../utils/jwt')
const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
)


// COMPARAR CONTRASEÑA


function compararContrasena(contrasena, usuarioEncontrado) {

    const guardada =
        usuarioEncontrado.contrasena ||
        usuarioEncontrado.contrasena_hash

    if (
        typeof guardada === 'string' &&
        guardada.startsWith('$2')
    ) {
        return bcrypt.compareSync(
            contrasena,
            guardada
        )
    }

    return guardada === contrasena
}



// LOGIN DE USUARIO CON reCAPTCHA


exports.login = async (req, res) => {

    const {
        usuario,
        contrasena,
        captchaToken
    } = req.body


    // ==================================================
    // VALIDAR USUARIO Y CONTRASEÑA
    // ==================================================

    const usuarioLimpio = sanitizarTexto(
        usuario,
        50
    )

    if (
        !usuarioLimpio ||
        typeof contrasena !== 'string' ||
        !contrasena
    ) {
        return res.status(400).json({
            error: 'Usuario y contraseña son obligatorios'
        })
    }

    if (contrasena.length > 128) {
        return res.status(400).json({
            error: 'Credenciales inválidas'
        })
    }


    // ==================================================
    // VALIDAR CAPTCHA
    // ==================================================

    if (!captchaToken) {
        return res.status(400).json({
            error: 'Debes completar el CAPTCHA'
        })
    }


    try {

        // ==================================================
        // VERIFICAR CAPTCHA CON GOOGLE
        // ==================================================

        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret:
                        process.env.RECAPTCHA_SECRET_KEY,
                    response:
                        captchaToken
                }
            }
        )


        if (!captchaResponse.data.success) {
            return res.status(400).json({
                error: 'CAPTCHA inválido'
            })
        }


        // ==================================================
        // BUSCAR USUARIO EN MYSQL
        // ==================================================

        db.query(
            'SELECT * FROM usuarios WHERE usuario = ?',
            [usuarioLimpio],
            (err, results) => {

                if (err) {

                    console.error(
                        'Error detallado en el Login de MySQL:',
                        err
                    )

                    return res.status(500).json({
                        error:
                            'Error interno del servidor'
                    })
                }


                // ==================================================
                // USUARIO NO ENCONTRADO
                // ==================================================

                if (results.length === 0) {

                    return res.status(401).json({
                        error:
                            'Usuario o contraseña incorrectos'
                    })
                }


                const usuarioEncontrado =
                    results[0]


                // ==================================================
                // COMPROBAR CONTRASEÑA
                // ==================================================

                const contrasenaValida =
                    compararContrasena(
                        contrasena,
                        usuarioEncontrado
                    )


                if (!contrasenaValida) {

                    return res.status(401).json({
                        error:
                            'Usuario o contraseña incorrectos'
                    })
                }


                // ==================================================
                // GENERAR TOKEN JWT
                // ==================================================

                const token = signToken({

                    id:
                        usuarioEncontrado.id_usuario,

                    usuario:
                        usuarioEncontrado.usuario,

                    correo:
                        usuarioEncontrado.correo,

                    area:
                        usuarioEncontrado.area
                })


                // ==================================================
                // GUARDAR TOKEN EN COOKIE
                // ==================================================

                res.cookie(
                    'token',
                    token,
                    {
                        httpOnly: true,

                        secure:
                            process.env.NODE_ENV === 'production',

                        sameSite: 'lax',

                        maxAge:
                            7 * 24 * 60 * 60 * 1000
                    }
                )


                // ==================================================
                // RESPUESTA EXITOSA
                // ==================================================

                return res.status(200).json({

                    mensaje:
                        'Login exitoso',

                    token,

                    usuario: {

                        usuario:
                            usuarioEncontrado.usuario,

                        nombre:
                            usuarioEncontrado.nombre,

                        area:
                            usuarioEncontrado.area,

                        correo:
                            usuarioEncontrado.correo,

                        estado:
                            usuarioEncontrado.estado
                    }
                })
            }
        )

    } catch (error) {

        console.error(
            'Error verificando reCAPTCHA:',
            error
        )

        return res.status(500).json({
            error:
                'Error al verificar el CAPTCHA'
        })
    }
}



// LOGIN CON GOOGLE


exports.loginGoogle = async (req, res) => {

    const { credential } = req.body


    if (
        typeof credential !== 'string' ||
        !credential
    ) {

        return res.status(400).json({
            error: 'Falta el credential'
        })
    }


    try {

        // ==================================================
        // VALIDAR TOKEN DE GOOGLE
        // ==================================================

        const ticket =
            await client.verifyIdToken({

                idToken:
                    credential,

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


        // ==================================================
        // BUSCAR USUARIO
        // ==================================================

        db.query(
            'SELECT * FROM usuarios WHERE google_id = ? OR correo = ?',
            [
                googleId,
                email
            ],
            (err, results) => {

                if (err) {

                    console.error(
                        'Error buscando usuario de Google:',
                        err
                    )

                    return res.status(500).json({
                        error:
                            'Error en la consulta'
                    })
                }


                // ==================================================
                // GENERAR TOKEN Y RESPONDER
                // ==================================================

                const generarTokenYResponder =
                    (usuario) => {

                        const token =
                            signToken({

                                id:
                                    usuario.id_usuario,

                                correo:
                                    usuario.correo
                            })


                        res.cookie(
                            'token',
                            token,
                            {
                                httpOnly: true,

                                secure:
                                    process.env.NODE_ENV === 'production',

                                sameSite: 'lax',

                                maxAge:
                                    7 * 24 * 60 * 60 * 1000
                            }
                        )


                        res.json({

                            usuario: {

                                id:
                                    usuario.id_usuario,

                                correo:
                                    usuario.correo,

                                nombre:
                                    usuario.nombre,

                                area:
                                    usuario.area,

                                estado:
                                    usuario.estado,

                                foto:
                                    usuario.foto_url ||
                                    picture
                            }
                        })
                    }


                // ==================================================
                // USUARIO EXISTENTE
                // ==================================================

                if (results.length > 0) {

                    const usuarioExistente =
                        results[0]


                    db.query(
                        'UPDATE usuarios SET google_id = ?, nombre = ?, foto_url = ? WHERE id_usuario = ?',

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

                                nombre:
                                    name,

                                foto_url:
                                    picture
                            })
                        }
                    )

                } else {

                    // ==================================================
                    // CREAR USUARIO NUEVO DE GOOGLE
                    // ==================================================

                    db.query(
                        'INSERT INTO usuarios (google_id, correo, nombre, foto_url, estado) VALUES (?, ?, ?, ?, ?)',

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
            error:
                'Token inválido'
        })
    }
}



// OBTENER TODOS LOS USUARIOS


exports.getUsuarios = (req, res) => {

    db.query(
        'SELECT usuario, nombre, area, correo, estado FROM usuarios',

        (err, results) => {

            if (err) {

                console.error(
                    'Error al obtener usuarios:',
                    err
                )

                return res.status(500).json({
                    error:
                        'Error en la consulta'
                })
            }

            res.json(results)
        }
    )
}



// AGREGAR UN NUEVO USUARIO


exports.createUsuario = (req, res) => {

    const {
        usuario,
        contrasena,
        nombre,
        area,
        correo,
        estado
    } = req.body


    if (
        !usuario ||
        !contrasena ||
        !nombre ||
        !area ||
        !correo
    ) {

        return res.status(400).json({
            error:
                'Todos los campos son obligatorios'
        })
    }


    const estadoFinal =
        estado || 'activo'


    const query = `
        INSERT INTO usuarios
        (
            usuario,
            contrasena,
            nombre,
            area,
            correo,
            estado
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `


    db.query(
        query,

        [
            usuario,
            contrasena,
            nombre,
            area,
            correo,
            estadoFinal
        ],

        (err, results) => {

            if (err) {

                console.error(
                    'Error al agregar el usuario:',
                    err
                )

                return res.status(500).json({
                    error:
                        'Error al agregar el usuario'
                })
            }


            res.status(201).json({

                usuario,

                nombre,

                area,

                correo,

                estado:
                    estadoFinal
            })
        }
    )
}



// EDITAR UN USUARIO


exports.updateUsuario = (req, res) => {

    const {
        usuario: usuarioParam
    } = req.params


    const {
        usuario,
        contrasena,
        nombre,
        area,
        correo,
        estado
    } = req.body


    const query = `
        UPDATE usuarios
        SET
            usuario = ?,
            contrasena = ?,
            nombre = ?,
            area = ?,
            correo = ?,
            estado = ?
        WHERE usuario = ?
    `


    db.query(
        query,

        [
            usuario,
            contrasena,
            nombre,
            area,
            correo,
            estado,
            usuarioParam
        ],

        (err, result) => {

            if (err) {

                console.error(
                    'Error al editar:',
                    err
                )

                return res.status(500).json({
                    error:
                        'Error al editar el usuario'
                })
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        'Usuario no encontrado'
                })
            }


            res.json({
                mensaje:
                    'Usuario actualizado'
            })
        }
    )
}



// ELIMINAR UN USUARIO


exports.deleteUsuario = (req, res) => {

    const { usuario } = req.params


    const query = `
        DELETE FROM usuarios
        WHERE usuario = ?
    `


    db.query(
        query,

        [usuario],

        (err, result) => {

            if (err) {

                console.error(
                    'Error al eliminar usuario:',
                    err
                )

                return res.status(500).json({
                    error:
                        'Error al eliminar el usuario'
                })
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error:
                        'Usuario no encontrado'
                })
            }


            res.json({
                mensaje:
                    'Usuario eliminado'
            })
        }
    )
}