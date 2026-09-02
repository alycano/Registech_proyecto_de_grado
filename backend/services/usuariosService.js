const usuariosRepository = require('../repository/usuariosRepository')
const bcrypt = require('bcryptjs')
const { signToken } = require('../utils/jwt')
const { sanitizarTexto } = require('../utils/sanitize')

function compararContrasena(contrasena, usuarioEncontrado) {
    const guardada = usuarioEncontrado.contrasena || usuarioEncontrado.contrasena_hash
    if (typeof guardada === 'string' && guardada.startsWith('$2')) {
        return bcrypt.compareSync(contrasena, guardada)
    }
    return false
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
        area: usuarioEncontrado.area,
        rol: usuarioEncontrado.rol
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
    const { usuario, contrasena, nombre, area, rol, correo, estado } = data

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
        rol: rol || 'inventario',
        correo,
        estado: estado || 'activo'
    })
}

exports.updateUsuario = async (usuarioParam, data) => {
    const { contrasena, nombre, area, rol, correo, estado } = data

    const dataActualizar = { nombre, area, correo, estado }
    if (rol) dataActualizar.rol = rol
    if (contrasena && String(contrasena).trim() !== '') {
        dataActualizar.contrasena = bcrypt.hashSync(contrasena, 10)
    }

    await usuariosRepository.update(usuarioParam, dataActualizar)
}

exports.deleteUsuario = async (usuarioParam) => {

    // Verificar si tiene un préstamo activo o parcial
    const tieneActivo = await usuariosRepository.tienePrestamoActivo(usuarioParam)

    if (tieneActivo) {
        throw new Error('PRESTAMO_ACTIVO')
    }

    // Verificar si alguna vez ha tenido un préstamo
    const tieneHistorial = await usuariosRepository.tieneHistorialPrestamos(usuarioParam)

    if (tieneHistorial) {

        // Tiene historial → no se elimina, se desactiva
        await usuariosRepository.update(usuarioParam, {
            estado: 'inactivo'
        })

        throw new Error('DESACTIVADO')
    }

    // Nunca ha tenido préstamos → se elimina normalmente
    await usuariosRepository.delete(usuarioParam)
}



exports.verificarEliminacion = async (usuarioParam) => {

    const tieneActivo = await usuariosRepository.tienePrestamoActivo(usuarioParam)

    if (tieneActivo) {
        return {
            puedeEliminar: false,
            tieneHistorial: true,
            tienePrestamoActivo: true
        }
    }

    const tieneHistorial = await usuariosRepository.tieneHistorialPrestamos(usuarioParam)

    if (tieneHistorial) {
        return {
            puedeEliminar: false,
            tieneHistorial: true,
            tienePrestamoActivo: false
        }
    }

    return {
        puedeEliminar: true,
        tieneHistorial: false,
        tienePrestamoActivo: false
    }
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
            mensaje: 'Si el correo está registrado, recibirás un código de verificación'
        }
    }

    await usuariosRepository.createResetToken(usuarioEncontrado.usuario, codigo, expiraEn)

    try {
        const { enviarCorreo } = require('./mailService')
        await enviarCorreo({
            para: correoLimpio,
            asunto: 'Registech - Código de recuperación de contraseña',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#2563eb">Recuperación de contraseña</h2>
                    <p>Hola <strong>${usuarioEncontrado.nombre || usuarioEncontrado.usuario}</strong>,</p>
                    <p>Tu código de verificación es:</p>
                    <div style="background:#f3f4f6;padding:20px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#1e40af;border-radius:8px">${codigo}</div>
                    <p style="color:#6b7280;font-size:14px">Este código expira en 15 minutos.</p>
                    <p style="color:#6b7280;font-size:14px">Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `
        })
    } catch (e) {
        console.warn('Error enviando correo de recuperación:', e.message)
    }

    return {
        mensaje: 'Si el correo está registrado, recibirás un código de verificación'
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

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,128}$/
    if (typeof nuevaContrasena !== 'string' || !PASSWORD_REGEX.test(nuevaContrasena)) {
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
