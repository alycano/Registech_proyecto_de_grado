const usuariosService = require('../services/usuariosService')

exports.login = async (req, res) => {
    try {
        const { token, usuarioEncontrado } = await usuariosService.login(req.body.usuario, req.body.contrasena)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
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
        
        res.status(500).json({ error: 'Error al eliminar el usuario' })
    }
}