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
