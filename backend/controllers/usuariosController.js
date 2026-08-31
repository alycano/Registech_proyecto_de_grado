const usuariosService = require('../services/usuariosService')
const crypto = require('crypto')
const { generarTokenCsrf } = require('../middlewares/csrf')

exports.login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body
        const { token, usuarioEncontrado } = await usuariosService.login(correo, contrasena)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        })

        const sessionId = crypto.randomBytes(16).toString('hex')
        const csrfToken = generarTokenCsrf(sessionId)

        res.cookie('session_id', sessionId, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000
        })

        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(usuarioEncontrado.usuario, `Inició sesión en el sistema`)

        return res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            csrf_token: csrfToken,
            usuario: {
                usuario: usuarioEncontrado.usuario,
                nombre: usuarioEncontrado.nombre,
                area: usuarioEncontrado.area,
                rol: usuarioEncontrado.rol,
                correo: usuarioEncontrado.correo,
                estado: usuarioEncontrado.estado
            }
        })
    } catch (error) {
        console.error('Error en el login:', error)
        if (error.message === 'REQ_FIELDS') return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' })
        if (error.message === 'INVALID_CREDS') return res.status(400).json({ error: 'Credenciales inválidas' })
        if (error.message === 'NOT_FOUND') return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })

        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}

exports.getUsuarios = async (req, res) => {
    try {
        const usuarios = await usuariosService.getUsuarios()
        res.json(usuarios)
    } catch (error) {
        console.error('Error al obtener usuarios:', error)
        res.status(500).json({ error: 'Error en la consulta' })
    }
}

exports.createUsuario = async (req, res) => {
    try {
        const nuevoUsuario = await usuariosService.createUsuario(req.body)
        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, `Creó el usuario ${nuevoUsuario.usuario}`)
        res.status(201).json({
            usuario: nuevoUsuario.usuario,
            nombre: nuevoUsuario.nombre,
            area: nuevoUsuario.area,
            correo: nuevoUsuario.correo,
            estado: nuevoUsuario.estado
        })
    } catch (error) {
        console.error('Error al agregar el usuario:', error)
        if (error.message === 'REQ_FIELDS') return res.status(400).json({ error: 'Todos los campos son obligatorios' })
        if (error.message === 'DUPLICATE') return res.status(409).json({ error: 'El nombre de usuario ya está en uso' })

        res.status(500).json({ error: 'Error al agregar el usuario' })
    }
}

exports.updateUsuario = async (req, res) => {
    try {
        await usuariosService.updateUsuario(req.params.usuario, req.body)
        res.json({ mensaje: 'Usuario actualizado' })
    } catch (error) {
        console.error('Error al editar:', error)
        if (error.message === 'REQ_FIELDS') return res.status(400).json({ error: 'Todos los campos son obligatorios' })
        if (error.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' })

        res.status(500).json({ error: 'Error al editar el usuario' })
    }
}

exports.deleteUsuario = async (req, res) => {
    try {
        await usuariosService.deleteUsuario(req.params.usuario)
        res.json({ mensaje: 'Usuario eliminado' })
    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        if (error.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' })
        if (error.code === '23503') return res.status(409).json({ error: 'No se puede eliminar el usuario porque tiene préstamos, solicitudes u otros registros asociados. Puedes desactivarlo cambiando su estado a inactivo.' })

        res.status(500).json({ error: 'Error al eliminar el usuario' })
    }
}

exports.solicitarRecuperacion = async (req, res) => {
    try {
        const result = await usuariosService.solicitarRecuperacion(req.body.correo)
        res.json(result)
    } catch (error) {
        console.error('Error en recuperación:', error)
        if (error.message === 'REQ_FIELDS') return res.status(400).json({ error: 'El correo es obligatorio' })
        if (error.message === 'INVALID_EMAIL') return res.status(400).json({ error: 'Formato de correo inválido' })

        res.status(500).json({ error: 'Error interno del servidor' })
    }
}

exports.restablecerPassword = async (req, res) => {
    try {
        const result = await usuariosService.restablecerPassword(req.body)
        res.json(result)
    } catch (error) {
        console.error('Error al restablecer contraseña:', error)
        if (error.message === 'REQ_FIELDS') return res.status(400).json({ error: 'Correo, código y nueva contraseña son obligatorios' })
        if (error.message === 'INVALID_EMAIL') return res.status(400).json({ error: 'Formato de correo inválido' })
        if (error.message === 'INVALID_CODE') return res.status(400).json({ error: 'El código debe ser de 6 dígitos' })
        if (error.message === 'SHORT_PASSWORD') return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo' })
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Correo no registrado en el sistema' })
        if (error.message === 'INVALID_TOKEN') return res.status(400).json({ error: 'El código es inválido o ha expirado. Solicita uno nuevo.' })

        res.status(500).json({ error: 'Error al restablecer la contraseña' })
    }
}

// CAMBIO DE CONTRASENA DEL USUARIO AUTENTICADO
exports.cambiarPassword = async (req, res) => {
    try {
        await usuariosService.cambiarPassword(req.usuario.usuario, req.body.contrasena_actual, req.body.contrasena_nueva)

        const auditoriaService = require('../services/auditoriaService')
        await auditoriaService.registrar(req.usuario.usuario, 'Cambio su contrasena')

        res.json({ mensaje: 'Contrasena actualizada correctamente' })
    } catch (error) {
        if (error.message === 'CONTRASENA_INCORRECTA') return res.status(401).json({ error: 'La contrasena actual no es correcta' })
        if (error.message === 'MISMA_CONTRASENA') return res.status(400).json({ error: 'La nueva contrasena debe ser diferente a la actual' })
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Usuario no encontrado' })
        console.error('Error al cambiar la contrasena:', error)
        res.status(500).json({ error: 'No se pudo cambiar la contrasena' })
    }
}
