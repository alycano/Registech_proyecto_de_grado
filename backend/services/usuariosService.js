const usuariosRepository = require('../repository/usuariosRepository')
const bcrypt = require('bcryptjs')
const { signToken } = require('../utils/jwt')
const { sanitizarTexto } = require('../utils/sanitize')

function compararContrasena(contrasena, usuarioEncontrado) {
    const guardada = usuarioEncontrado.contrasena || usuarioEncontrado.contrasena_hash
    if (typeof guardada === 'string' && guardada.startsWith('$2')) {
        return bcrypt.compareSync(contrasena, guardada)
    }
    return guardada === contrasena
}

exports.login = async (usuario, contrasena) => {
    const usuarioLimpio = sanitizarTexto(usuario, 50)
    const usuarioEncontrado = await usuariosRepository.findByUsuario(usuarioLimpio)

    if (!usuarioEncontrado) {
        throw new Error('NOT_FOUND')
    }

    const contrasenaValida = compararContrasena(contrasena, usuarioEncontrado)

    if (!contrasenaValida) {
        throw new Error('NOT_FOUND')
    }

    const token = signToken({
        id: usuarioEncontrado.id_usuario,
        usuario: usuarioEncontrado.usuario,
        correo: usuarioEncontrado.correo,
        area: usuarioEncontrado.area
    })

    return { token, usuarioEncontrado }
}

exports.googleLogin = async (googleId, email, name, picture) => {
    // 1. Buscar si el usuario ya existe por google_id o correo
    let usuarioEncontrado = await usuariosRepository.findByGoogleIdOrCorreo(googleId, email)

    if (usuarioEncontrado) {
        // Actualizar datos de Google si ya existía
        await usuariosRepository.update(usuarioEncontrado.usuario, {
            google_id: googleId,
            nombre: name,
            foto_url: picture,
            contrasena: usuarioEncontrado.contrasena, // Mantener requeridos
            area: usuarioEncontrado.area,
            correo: usuarioEncontrado.correo,
            estado: usuarioEncontrado.estado
        })
        // Recargar usuario para el token
        usuarioEncontrado = await usuariosRepository.findByUsuario(usuarioEncontrado.usuario)
    } else {
        // Generar un nombre de usuario basado en el correo
        const baseUsuario = email.split('@')[0]
        
        // Crear nuevo usuario
        usuarioEncontrado = await usuariosRepository.create({
            usuario: baseUsuario,
            correo: email,
            nombre: name,
            google_id: googleId,
            foto_url: picture,
            contrasena: 'google_oauth_no_password',
            area: 'Por asignar',
            estado: 'activo'
        })
    }

    if (usuarioEncontrado.estado === 'inactivo') {
        throw new Error('INACTIVE')
    }

    const token = signToken({
        id: usuarioEncontrado.id_usuario,
        usuario: usuarioEncontrado.usuario,
        correo: usuarioEncontrado.correo,
        area: usuarioEncontrado.area
    })

    return { token, usuarioEncontrado }
}


exports.getUsuarios = async () => {
    return await usuariosRepository.findAll()
}

exports.createUsuario = async (data) => {
    const { usuario, contrasena, nombre, area, correo, estado } = data

    const usuarioExistente = await usuariosRepository.findByUsuario(usuario)
    if (usuarioExistente) {
        throw new Error('DUPLICATE')
    }

    const contrasenaHash = bcrypt.hashSync(contrasena, 10)

    return await usuariosRepository.create({
        usuario,
        contrasena: contrasenaHash,
        nombre,
        area,
        correo,
        estado: estado || 'activo'
    })
}

exports.updateUsuario = async (usuarioParam, data) => {
    const { usuario, contrasena, nombre, area, correo, estado } = data

    const contrasenaHash = bcrypt.hashSync(contrasena, 10)

    await usuariosRepository.update(usuarioParam, {
        usuario,
        contrasena: contrasenaHash,
        nombre,
        area,
        correo,
        estado
    })
}

exports.deleteUsuario = async (usuarioParam) => {
    await usuariosRepository.delete(usuarioParam)
}
