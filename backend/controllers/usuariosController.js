const db = require('../config/db')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)


// ======================================================
// FUNCIONES AUXILIARES DE SEGURIDAD
// ======================================================

// Limpiar texto recibido
const sanitizarTexto = (texto, maxLength = 100) => {
    if (typeof texto !== 'string') {
        return ''
    }

    return texto
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, maxLength)
}


// Validar correo
const esCorreoValido = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(correo)
}


// Comparar contraseña con hash
const compararContrasena = async (contrasena, usuario) => {
    if (!usuario || !usuario.contrasena) {
        return false
    }

    try {
        return await bcrypt.compare(
            contrasena,
            usuario.contrasena
        )
    } catch (error) {
        return false
    }
}


// Generar JWT
const signToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    )
}


// ======================================================
// LOGIN DE USUARIO CON reCAPTCHA
// ======================================================

exports.login = async (req, res) => {

    const {
        usuario,
        contrasena,
        captchaToken
    } = req.body


    // Validar usuario y contraseña
    if (!usuario || !contrasena) {
        return res.status(400).json({
            error: 'Usuario y contraseña son obligatorios'
        })
    }


    // Validar CAPTCHA
    if (!captchaToken) {
        return res.status(400).json({
            error: 'Debes completar el CAPTCHA'
        })
    }


    try {

        // ==============================================
        // VERIFICAR CAPTCHA CON GOOGLE
        // ==============================================

        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaToken
                }
            }
        )


        if (!captchaResponse.data.success) {
            return res.status(400).json({
                error: 'CAPTCHA inválido'
            })
        }


        // ==============================================
        // LIMPIAR Y VALIDAR DATOS
        // ==============================================

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


        // ==============================================
        // BUSCAR USUARIO EN MYSQL
        // ==============================================

        db.query(
            'SELECT * FROM usuarios WHERE usuario = ?',
            [usuarioLimpio],
            async (err, results) => {

                if (err) {

                    console.error(
                        'Error detallado en el Login de MySQL:',
                        err
                    )

                    return res.status(500).json({
                        error: 'Error interno del servidor'
                    })
                }


                // Usuario no encontrado
                if (results.length === 0) {
                    return res.status(401).json({
                        error: 'Usuario o contraseña incorrectos'
                    })
                }


                const usuarioEncontrado = results[0]


                // ==========================================
                // COMPARAR CONTRASEÑA
                // ==========================================

                const contrasenaValida =
                    await compararContrasena(
                        contrasena,
                        usuarioEncontrado
                    )


                if (!contrasenaValida) {
                    return res.status(401).json({
                        error: 'Usuario o contraseña incorrectos'
                    })
                }


                // ==========================================
                // GENERAR TOKEN
                // ==========================================

                const token = signToken({
                    id: usuarioEncontrado.id_usuario,
                    usuario: usuarioEncontrado.usuario,
                    correo: usuarioEncontrado.correo,
                    area: usuarioEncontrado.area
                })


                // ==========================================
                // GUARDAR TOKEN EN COOKIE
                // ==========================================

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


                // ==========================================
                // RESPUESTA
                // ==========================================

                return res.status(200).json({
                    mensaje: 'Login exitoso',
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
            error: 'Error al verificar el CAPTCHA'
        })
    }
}


// ======================================================
// LOGIN CON GOOGLE
// ======================================================

exports.loginGoogle = async (req, res) => {

    const {
        credential
    } = req.body


    // Validar credential
    if (
        typeof credential !== 'string' ||
        !credential
    ) {
        return res.status(400).json({
            error: 'Falta el credential'
        })
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

                const generarTokenYResponder =
                    (usuario) => {

                        const token = signToken({
                            id:
                                usuario.id_usuario,
                            correo:
                                usuario.correo,
                            area:
                                usuario.area
                        })


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
                            token,
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


                // ==========================================
                // USUARIO YA EXISTE
                // ==========================================

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

    const campos = req.body || {}


    // Limpiar información
    const usuarioLimpio =
        sanitizarTexto(
            campos.usuario,
            50
        )

    const nombreLimpio =
        sanitizarTexto(
            campos.nombre,
            100
        )

    const areaLimpia =
        sanitizarTexto(
            campos.area,
            50
        )

    const correoLimpio =
        sanitizarTexto(
            campos.correo,
            100
        )

    const contrasenaPlana =
        typeof campos.contrasena === 'string'
            ? campos.contrasena
            : ''

    const estadoFinal =
        sanitizarTexto(
            campos.estado,
            10
        ) || 'activo'


    // Validar campos
    if (
        !usuarioLimpio ||
        !contrasenaPlana ||
        !nombreLimpio ||
        !areaLimpia ||
        !correoLimpio
    ) {
        return res.status(400).json({
            error:
                'Todos los campos son obligatorios'
        })
    }


    // Validar contraseña
    if (contrasenaPlana.length < 6) {
        return res.status(400).json({
            error:
                'La contraseña debe tener al menos 6 caracteres'
        })
    }


    if (contrasenaPlana.length > 128) {
        return res.status(400).json({
            error:
                'La contraseña es demasiado larga'
        })
    }


    // Validar correo
    if (!esCorreoValido(correoLimpio)) {
        return res.status(400).json({
            error:
                'El correo no es válido'
        })
    }


    // Validar estado
    if (
        !['activo', 'inactivo'].includes(
            estadoFinal
        )
    ) {
        return res.status(400).json({
            error:
                'El estado no es válido'
        })
    }


    // Encriptar contraseña
    const contrasenaHash =
        bcrypt.hashSync(
            contrasenaPlana,
            10
        )


    const query =
        `INSERT INTO usuarios
        (
            usuario,
            contrasena,
            nombre,
            area,
            correo,
            estado
        )
        VALUES (?, ?, ?, ?, ?, ?)`


    db.query(
        query,
        [
            usuarioLimpio,
            contrasenaHash,
            nombreLimpio,
            areaLimpia,
            correoLimpio,
            estadoFinal
        ],
        (err) => {

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
                usuario:
                    usuarioLimpio,
                nombre:
                    nombreLimpio,
                area:
                    areaLimpia,
                correo:
                    correoLimpio,
                estado:
                    estadoFinal
            })
        }
    )
}


// ======================================================
// EDITAR USUARIO
// ======================================================

exports.updateUsuario = (req, res) => {

    const {
        usuario: usuarioParam
    } = req.params

    const campos =
        req.body || {}


    const usuarioLimpio =
        sanitizarTexto(
            campos.usuario,
            50
        )

    const nombreLimpio =
        sanitizarTexto(
            campos.nombre,
            100
        )

    const areaLimpia =
        sanitizarTexto(
            campos.area,
            50
        )

    const correoLimpio =
        sanitizarTexto(
            campos.correo,
            100
        )

    const contrasenaPlana =
        typeof campos.contrasena === 'string'
            ? campos.contrasena
            : ''

    const estadoFinal =
        sanitizarTexto(
            campos.estado,
            10
        )


    // Validar campos
    if (
        !usuarioLimpio ||
        !contrasenaPlana ||
        !nombreLimpio ||
        !areaLimpia ||
        !correoLimpio ||
        !estadoFinal
    ) {
        return res.status(400).json({
            error:
                'Todos los campos son obligatorios'
        })
    }


    // Validar contraseña
    if (contrasenaPlana.length < 6) {
        return res.status(400).json({
            error:
                'La contraseña debe tener al menos 6 caracteres'
        })
    }


    if (contrasenaPlana.length > 128) {
        return res.status(400).json({
            error:
                'La contraseña es demasiado larga'
        })
    }


    // Validar correo
    if (!esCorreoValido(correoLimpio)) {
        return res.status(400).json({
            error:
                'El correo no es válido'
        })
    }


    // Validar estado
    if (
        !['activo', 'inactivo'].includes(
            estadoFinal
        )
    ) {
        return res.status(400).json({
            error:
                'El estado no es válido'
        })
    }


    // Encriptar contraseña
    const contrasenaHash =
        bcrypt.hashSync(
            contrasenaPlana,
            10
        )


    const query =
        `UPDATE usuarios
         SET
            usuario = ?,
            contrasena = ?,
            nombre = ?,
            area = ?,
            correo = ?,
            estado = ?
         WHERE usuario = ?`


    db.query(
        query,
        [
            usuarioLimpio,
            contrasenaHash,
            nombreLimpio,
            areaLimpia,
            correoLimpio,
            estadoFinal,
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


            if (
                result.affectedRows === 0
            ) {
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


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUsuario = (req, res) => {

    const {
        usuario
    } = req.params


    const usuarioLimpio =
        sanitizarTexto(
            usuario,
            50
        )


    if (!usuarioLimpio) {
        return res.status(400).json({
            error:
                'Usuario inválido'
        })
    }


    const query =
        `DELETE FROM usuarios
         WHERE usuario = ?`


    db.query(
        query,
        [usuarioLimpio],
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


            if (
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    error:
                        'Usuario no encontrado'
                })
            }


            res.send(
                'Usuario eliminado'
            )
        }
    )
}


// ======================================================
// REGISTRO SEGURO CON VERIFICACIÓN
// ======================================================

exports.registrarConVerificacion =
    async (req, res) => {

        const {
            usuario,
            contrasena,
            nombre,
            area,
            correo
        } = req.body


        if (
            !usuario ||
            !contrasena ||
            !nombre ||
            !area ||
            !correo
        ) {
            return res.status(400).send(
                'Todos los campos son obligatorios'
            )
        }


        try {

            const salt =
                await bcrypt.genSalt(10)

            const passwordHash =
                await bcrypt.hash(
                    contrasena,
                    salt
                )


            const tokenVerificacion =
                jwt.sign(
                    {
                        correo
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '1d'
                    }
                )


            const query =
                `INSERT INTO usuarios
                (
                    usuario,
                    contrasena,
                    nombre,
                    area,
                    correo,
                    estado,
                    reset_token
                )
                VALUES (?, ?, ?, ?, ?, 'pendiente', ?)`


            db.query(
                query,
                [
                    usuario,
                    passwordHash,
                    nombre,
                    area,
                    correo,
                    tokenVerificacion
                ],
                (err) => {

                    if (err) {

                        console.error(
                            'Error al registrar:',
                            err
                        )

                        return res.status(500).send(
                            'El usuario o correo ya se encuentran registrados'
                        )
                    }


                    res.status(201).send({
                        mensaje:
                            'Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.'
                    })
                }
            )

        } catch (error) {

            console.error(
                'Error registrando usuario:',
                error
            )

            res.status(500).send(
                'Error en el servidor al encriptar contraseña'
            )
        }
    }


// ======================================================
// VERIFICACIÓN DE CORREO ELECTRÓNICO
// ======================================================

exports.verificarCorreo =
    (req, res) => {

        const {
            token
        } = req.params


        try {

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                )


            const correo =
                decoded.correo


            const query =
                `UPDATE usuarios
                 SET
                    estado = 'activo',
                    reset_token = NULL
                 WHERE correo = ?`


            db.query(
                query,
                [correo],
                (err, result) => {

                    if (
                        err ||
                        result.affectedRows === 0
                    ) {
                        return res.status(400).send(
                            'Token inválido o usuario no encontrado'
                        )
                    }


                    res.send(
                        '¡Correo verificado con éxito! Ya puedes iniciar sesión.'
                    )
                }
            )

        } catch (error) {

            res.status(400).send(
                'El enlace de verificación ha expirado o es inválido'
            )
        }
    }


// ======================================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ======================================================

exports.solicitarRecuperacion =
    (req, res) => {

        const {
            correo
        } = req.body


        db.query(
            'SELECT * FROM usuarios WHERE correo = ?',
            [correo],
            (err, results) => {

                if (
                    err ||
                    results.length === 0
                ) {
                    return res.status(404).send(
                        'No existe un usuario con este correo'
                    )
                }


                const tokenRecuperacion =
                    jwt.sign(
                        {
                            correo
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: '15m'
                        }
                    )


                db.query(
                    `UPDATE usuarios
                     SET reset_token = ?
                     WHERE correo = ?`,
                    [
                        tokenRecuperacion,
                        correo
                    ],
                    (errUpdate) => {

                        if (errUpdate) {
                            return res.status(500).send(
                                'Error al generar token de recuperación'
                            )
                        }


                        res.send({
                            mensaje:
                                'Correo de recuperación enviado con éxito',
                            tokenRecuperacion
                        })
                    }
                )
            }
        )
    }


// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

exports.restablecerContrasena =
    async (req, res) => {

        const {
            token,
            nuevaContrasena
        } = req.body


        try {

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                )


            const correo =
                decoded.correo


            const salt =
                await bcrypt.genSalt(10)


            const passwordHash =
                await bcrypt.hash(
                    nuevaContrasena,
                    salt
                )


            const query =
                `UPDATE usuarios
                 SET
                    contrasena = ?,
                    reset_token = NULL
                 WHERE correo = ?
                 AND reset_token = ?`


            db.query(
                query,
                [
                    passwordHash,
                    correo,
                    token
                ],
                (err, result) => {

                    if (
                        err ||
                        result.affectedRows === 0
                    ) {
                        return res.status(400).send(
                            'Token inválido o ya utilizado'
                        )
                    }


                    res.send(
                        'Contraseña actualizada exitosamente'
                    )
                }
            )

        } catch (error) {

            res.status(400).send(
                'Token expirado o inválido'
            )
        }
    }