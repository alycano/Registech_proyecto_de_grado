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

exports.login = async (correo, contrasena) => {
    const correoLimpio = sanitizarTexto(correo, 100).toLowerCase()
    const usuarioEncontrado = await usuariosRepository.findByCorreo(correoLimpio)

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

// CAMBIO DE CONTRASENA AUTENTICADO (EL USUARIO MISMO)
exports.cambiarPassword = async (usuario, contrasenaActual, contrasenaNueva) => {
    const usuarioLimpio = sanitizarTexto(usuario, 50)
    const guardado = await usuariosRepository.findByUsuario(usuarioLimpio)

    if (!guardado) throw new Error('NOT_FOUND')
    if (!compararContrasena(contrasenaActual, guardado)) throw new Error('CONTRASENA_INCORRECTA')

    const hashContrasena = bcrypt.hashSync(contrasenaNueva, 10)
    if (bcrypt.compareSync(contrasenaNueva, guardado.contrasena || guardado.contrasena_hash || '')) {
        throw new Error('MISMA_CONTRASENA')
    }

    await usuariosRepository.updatePassword(usuarioLimpio, hashContrasena)
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

    // Si la contrasena viene vacia se mantiene la actual (no se toca)
    const dataActualizar = { usuario, nombre, area, correo, estado }
    if (contrasena && String(contrasena).trim() !== '') {
        dataActualizar.contrasena = bcrypt.hashSync(contrasena, 10)
    }

    await usuariosRepository.update(usuarioParam, dataActualizar)
}

exports.deleteUsuario = async (usuarioParam) => {
    await usuariosRepository.delete(usuarioParam)
}

exports.solicitarRecuperacion = async (correo) => {
    if (!correo || typeof correo !== 'string') {
        throw new Error('REQ_FIELDS')
    }

    const { sanitizarTexto, esCorreoValido } = require('../utils/sanitize')
    const correoLimpio = sanitizarTexto(correo, 100).toLowerCase()

    if (!esCorreoValido(correoLimpio)) {
        throw new Error('INVALID_EMAIL')
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000))
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000)

    const usuarioEncontrado = await usuariosRepository.findByCorreo(correoLimpio)

    if (!usuarioEncontrado) {
        return {
            mensaje: 'Si el correo está registrado, recibirás un código de verificación',
            codigo: null
        }
    }

    await usuariosRepository.createResetToken(usuarioEncontrado.usuario, codigo, expiraEn)

    return {
        mensaje: 'Código de verificación generado',
        codigo: codigo,
        expira_en: expiraEn
    }
}

exports.restablecerPassword = async ({ correo, codigo, nuevaContrasena }) => {
    if (!correo || !codigo || !nuevaContrasena) {
        throw new Error('REQ_FIELDS')
    }

    const { sanitizarTexto, esCorreoValido } = require('../utils/sanitize')
    const correoLimpio = sanitizarTexto(correo, 100).toLowerCase()
    const codigoLimpio = sanitizarTexto(codigo, 10)

    if (!esCorreoValido(correoLimpio)) {
        throw new Error('INVALID_EMAIL')
    }

    if (!/^\d{6}$/.test(codigoLimpio)) {
        throw new Error('INVALID_CODE')
    }

    if (typeof nuevaContrasena !== 'string' || nuevaContrasena.length < 6) {
        throw new Error('SHORT_PASSWORD')
    }

    if (nuevaContrasena.length > 128) {
        throw new Error('SHORT_PASSWORD')
    }

    const usuarioEncontrado = await usuariosRepository.findByCorreo(correoLimpio)

    if (!usuarioEncontrado) {
        throw new Error('NOT_FOUND')
    }

    const tokenValido = await usuariosRepository.findValidResetToken(usuarioEncontrado.usuario, codigoLimpio)

    if (!tokenValido) {
        throw new Error('INVALID_TOKEN')
    }

    const hashContrasena = bcrypt.hashSync(nuevaContrasena, 10)

    await usuariosRepository.updatePassword(usuarioEncontrado.usuario, hashContrasena)

    await usuariosRepository.markTokenUsed(tokenValido.id)

    return {
        mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.'
    }
}
