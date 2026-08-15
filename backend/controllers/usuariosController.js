const db = require('../config/db')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const { sanitizarTexto, sanitizarHtml, esCorreoValido, AREAS } = require('../utils/sanitize')
const { signToken } = require('../utils/jwt')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// COMPARAR LA CONTRASEÑA INGRESADA CON LA GUARDADA (BCRYPT O TEXTO PLANO)
function compararContrasena(contrasena, usuarioEncontrado) {
    const guardada = usuarioEncontrado.contrasena || usuarioEncontrado.contrasena_hash

    if (typeof guardada === 'string' && guardada.startsWith('$2')) {
        return bcrypt.compareSync(contrasena, guardada)
    }

    return guardada === contrasena
}

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

// 1. REGISTRO SEGURO CON ENCRIPTACIÓN Y ESTADO PENDIENTE
exports.registrarConVerificacion = async (req, res) => {
    const { usuario, contrasena, nombre, area, correo } = req.body;

    if (!usuario || !contrasena || !nombre || !area || !correo) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(contrasena, salt);
        const tokenVerificacion = jwt.sign({ correo }, 'clave_secreta_temporal_123', { expiresIn: '1d' });

        const query = `INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado, reset_token) VALUES (?, ?, ?, ?, ?, 'pendiente', ?)`;

        db.query(query, [usuario, passwordHash, nombre, area, correo, tokenVerificacion], (err, results) => {
            if (err) {
                console.error('Error al registrar:', err);
                return res.status(500).send('El usuario o correo ya se encuentran registrados');
            }

            // Configuración opcional de Nodemailer para enviar el correo
            /* 
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            transporter.sendMail({
                to: correo,
                subject: 'Verifica tu cuenta',
                html: `<a href="http://localhost:5000/api/usuarios/verificar/${tokenVerificacion}">Haz clic aquí para verificar tu cuenta</a>`
            });
            */

            res.status(201).send({ mensaje: 'Usuario registrado con éxito. Revisa tu correo para verificar la cuenta.' });
        });
    } catch (error) {
        res.status(500).send('Error en el servidor al encriptar contraseña');
    }
};

// 2. VERIFICACIÓN DE CORREO ELECTRÓNICO
exports.verificarCorreo = (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const correo = decoded.correo;

        const query = `UPDATE usuarios SET estado = 'activo', reset_token = NULL WHERE correo = ?`;
        db.query(query, [correo], (err, result) => {
            if (err || result.affectedRows === 0) {
                return res.status(400).send('Token inválido o usuario no encontrado');
            }
            res.send('¡Correo verificado con éxito! Ya puedes iniciar sesión.');
        });
    } catch (error) {
        res.status(400).send('El enlace de verificación ha expirado o es inválido');
    }
};

// 3. RECUPERACIÓN DE CONTRASEÑA (Solicitar Token)
exports.solicitarRecuperacion = (req, res) => {
    const { correo } = req.body;

    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('No existe un usuario con este correo');
        }

        const tokenRecuperacion = jwt.sign({ correo }, 'clave_secreta_temporal_123', { expiresIn: '15m' });

        db.query('UPDATE usuarios SET reset_token = ? WHERE correo = ?', [tokenRecuperacion, correo], (errUpdate) => {
            if (errUpdate) {
                return res.status(500).send('Error al generar token de recuperación');
            }
            // Aquí puedes enviar el correo con el token usando Nodemailer igual que en el registro
            res.send({ mensaje: 'Correo de recuperación enviado con éxito', tokenRecuperacion });
        });
    });
};

// 4. RESTABLECER CONTRASEÑA NUEVA
exports.restablecerContrasena = async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    try {
        const decoded = jwt.verify(token, 'clave_secreta_temporal_123');
        const correo = decoded.correo;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(nuevaContrasena, salt);

        const query = `UPDATE usuarios SET contrasena = ?, reset_token = NULL WHERE correo = ? AND reset_token = ?`;
        db.query(query, [passwordHash, correo, token], (err, result) => {
            if (err || result.affectedRows === 0) {
                return res.status(400).send('Token inválido o ya utilizado');
            }
            res.send('Contraseña actualizada exitosamente');
        });
    } catch (error) {
        res.status(400).send('Token expirado o inválido');
    }
};