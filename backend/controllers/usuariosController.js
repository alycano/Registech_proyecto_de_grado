const db = require('../config/db')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const { signToken } = require('../utils/jwt')
const { AREAS, sanitizarTexto, esCorreoValido } = require('../utils/sanitize')

function compararContrasena(contrasena, usuario) {
    const hashGuardado = usuario.contrasena_hash || usuario.contrasena
    if (typeof hashGuardado === 'string' && /^\$2[aby]\$\d+/.test(hashGuardado)) {
        return bcrypt.compareSync(contrasena, hashGuardado)
    }
    return contrasena === usuario.contrasena
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// LOGIN DE USUARIO
exports.login = (req, res) => {
    const { usuario, contrasena } = req.body

    const usuarioLimpio = sanitizarTexto(usuario, 50)

    if (!usuarioLimpio || typeof contrasena !== 'string' || !contrasena) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
    }
    if (contrasena.length > 128) {
        return res.status(400).json({ error: 'Credenciales inválidas' })
    }

    db.query(
        'SELECT * FROM usuarios WHERE usuario = ?',
        [usuarioLimpio],
        (err, results) => {
            if (err) {
                console.error('Error detallado en el Login de MySQL:', err)
                return res.status(500).json({ error: 'Error interno del servidor' })
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
            }

            const usuarioEncontrado = results[0]

            const contrasenaValida = compararContrasena(contrasena, usuarioEncontrado)

            if (!contrasenaValida) {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
            }

            const token = signToken({
                id: usuarioEncontrado.id_usuario,
                usuario: usuarioEncontrado.usuario,
                correo: usuarioEncontrado.correo,
                area: usuarioEncontrado.area
            })

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })

            res.status(200).json({
                mensaje: 'Login exitoso',
                token,
                usuario: {
                    usuario: usuarioEncontrado.usuario,
                    nombre: usuarioEncontrado.nombre,
                    area: usuarioEncontrado.area,
                    correo: usuarioEncontrado.correo,
                    estado: usuarioEncontrado.estado
                }
            })
        }
    )
}

// LOGIN CON GOOGLE
exports.loginGoogle = async (req, res) => {
    const { credential } = req.body

    if (typeof credential !== 'string' || !credential) {
        return res.status(400).json({ error: 'Falta el credential' })
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        const { sub: googleId, email, name, picture } = payload

        db.query(
            'SELECT * FROM usuarios WHERE google_id = ? OR correo = ?',
            [googleId, email],
            (err, results) => {
                if (err) {
                    console.error('Error buscando usuario de Google:', err)
                    return res.status(500).json({ error: 'Error en la consulta' })
                }

                const generarTokenYResponder = (usuario) => {
                    const token = signToken({
                        id: usuario.id_usuario,
                        correo: usuario.correo,
                        area: usuario.area
                    })

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })

                    res.json({
                        token,
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
                    const usuarioExistente = results[0]
                    db.query(
                        'UPDATE usuarios SET google_id = ?, nombre = ?, foto_url = ? WHERE id_usuario = ?',
                        [googleId, name, picture, usuarioExistente.id_usuario],
                        (errUpdate) => {
                            if (errUpdate) {
                                console.error('Error actualizando usuario de Google:', errUpdate)
                                return res.status(500).json({ error: 'Error al actualizar usuario' })
                            }
                            generarTokenYResponder({ ...usuarioExistente, nombre: name, foto_url: picture })
                        }
                    )
                } else {
                    db.query(
                        'INSERT INTO usuarios (google_id, correo, nombre, foto_url, estado) VALUES (?, ?, ?, ?, ?)',
                        [googleId, email, name, picture, 'activo'],
                        (errInsert, resultInsert) => {
                            if (errInsert) {
                                console.error('Error creando usuario de Google:', errInsert)
                                return res.status(500).json({ error: 'Error al crear usuario' })
                            }
                            generarTokenYResponder({
                                id_usuario: resultInsert.insertId,
                                correo: email,
                                nombre: name,
                                area: null,
                                estado: 'activo',
                                foto_url: picture
                            })
                        }
                    )
                }
            }
        )
    } catch (error) {
        console.error('Error en login con Google:', error)
        res.status(401).json({ error: 'Token inválido' })
    }
}

// OBTENER TODOS LOS USUARIOS
exports.getUsuarios = (req, res) => {
    db.query('SELECT usuario, nombre, area, correo, estado FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err)
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// AGREGAR UN NUEVO USUARIO
exports.createUsuario = (req, res) => {
    const campos = req.body || {}

    const usuarioLimpio = sanitizarTexto(campos.usuario, 50)
    const nombreLimpio = sanitizarTexto(campos.nombre, 100)
    const areaLimpia = sanitizarTexto(campos.area, 50)
    const correoLimpio = sanitizarTexto(campos.correo, 100)
    const contrasenaPlana = typeof campos.contrasena === 'string' ? campos.contrasena : ''
    const estadoFinal = sanitizarTexto(campos.estado, 10) || 'activo'

    if (!usuarioLimpio || !contrasenaPlana || !nombreLimpio || !areaLimpia || !correoLimpio) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (contrasenaPlana.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    if (contrasenaPlana.length > 128) {
        return res.status(400).json({ error: 'La contraseña es demasiado larga' })
    }
    if (!esCorreoValido(correoLimpio)) {
        return res.status(400).json({ error: 'El correo no es válido' })
    }
    if (!AREAS.includes(areaLimpia)) {
        return res.status(400).json({ error: 'El área no es válida' })
    }
    if (!['activo', 'inactivo'].includes(estadoFinal)) {
        return res.status(400).json({ error: 'El estado no es válido' })
    }

    const contrasenaHash = bcrypt.hashSync(contrasenaPlana, 10)
    const query = 'INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES (?, ?, ?, ?, ?, ?)'

    db.query(query, [usuarioLimpio, contrasenaHash, nombreLimpio, areaLimpia, correoLimpio, estadoFinal], (err) => {
        if (err) {
            console.error('Error al agregar el usuario: ', err)
            return res.status(500).json({ error: 'Error al agregar el usuario' })
        }

        res.status(201).json({ usuario: usuarioLimpio, nombre: nombreLimpio, area: areaLimpia, correo: correoLimpio, estado: estadoFinal })
    })
}

// EDITAR UN USUARIO
exports.updateUsuario = (req, res) => {
    const { usuario: usuarioParam } = req.params
    const campos = req.body || {}

    const usuarioLimpio = sanitizarTexto(campos.usuario, 50)
    const nombreLimpio = sanitizarTexto(campos.nombre, 100)
    const areaLimpia = sanitizarTexto(campos.area, 50)
    const correoLimpio = sanitizarTexto(campos.correo, 100)
    const contrasenaPlana = typeof campos.contrasena === 'string' ? campos.contrasena : ''
    const estadoFinal = sanitizarTexto(campos.estado, 10)

    if (!usuarioLimpio || !contrasenaPlana || !nombreLimpio || !areaLimpia || !correoLimpio || !estadoFinal) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (contrasenaPlana.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    if (!esCorreoValido(correoLimpio)) {
        return res.status(400).json({ error: 'El correo no es válido' })
    }
    if (!AREAS.includes(areaLimpia)) {
        return res.status(400).json({ error: 'El área no es válida' })
    }
    if (!['activo', 'inactivo'].includes(estadoFinal)) {
        return res.status(400).json({ error: 'El estado no es válido' })
    }

    const contrasenaHash = bcrypt.hashSync(contrasenaPlana, 10)
    const query = 'UPDATE usuarios SET usuario = ?, contrasena = ?, nombre = ?, area = ?, correo = ?, estado = ? WHERE usuario = ?'

    db.query(query, [usuarioLimpio, contrasenaHash, nombreLimpio, areaLimpia, correoLimpio, estadoFinal, usuarioParam], (err, result) => {
        if (err) {
            console.error('Error al editar: ', err)
            return res.status(500).json({ error: 'Error al editar el usuario' })
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }

        res.json({ mensaje: 'Usuario actualizado' })
    })
}

// ELIMINAR UN USUARIO
exports.deleteUsuario = (req, res) => {
    const { usuario } = req.params
    const usuarioLimpio = sanitizarTexto(usuario, 50)

    if (!usuarioLimpio) {
        return res.status(400).json({ error: 'Usuario inválido' })
    }

    const query = `DELETE FROM usuarios WHERE usuario = ?`

    db.query(query, [usuarioLimpio], (err, result) => {
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