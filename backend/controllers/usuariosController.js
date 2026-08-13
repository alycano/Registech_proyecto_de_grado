const db = require('../config/db')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

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
exports.loginGoogle = async (req, res) => {
    const { credential } = req.body

    if (!credential) {
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
                    const token = jwt.sign(
                        { id: usuario.id_usuario, correo: usuario.correo },
                        process.env.JWT_SECRET,
                        { expiresIn: '7d' }
                    )

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })

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

// EDITAR UN USUARIO
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

// ELIMINAR UN USUARIO
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