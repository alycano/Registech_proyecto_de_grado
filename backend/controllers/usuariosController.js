const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')
const { signToken } = require('../utils/jwt')
const { sanitizarTexto } = require('../utils/sanitize')

// COMPARAR CONTRASEÑA
function compararContrasena(contrasena, usuarioEncontrado) {

    const guardada =
        usuarioEncontrado.contrasena ||
        usuarioEncontrado.contrasena_hash

    if (
        typeof guardada === 'string' &&
        guardada.startsWith('$2')
    ) {
        return bcrypt.compareSync(
            contrasena,
            guardada
        )
    }

    return guardada === contrasena
}

// LOGIN
exports.login = async (req, res) => {

    const { usuario, contrasena } = req.body

    const usuarioLimpio = sanitizarTexto(usuario, 50)

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

    try {

        const usuarioEncontrado = await prisma.usuarios.findUnique({
            where: {
                usuario: usuarioLimpio
            }
        })

        if (!usuarioEncontrado) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            })
        }

        const contrasenaValida = compararContrasena(
            contrasena,
            usuarioEncontrado
        )

        if (!contrasenaValida) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            })
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

        return res.status(500).json({
            error: 'Error interno del servidor'
        })
    }
}

// OBTENER TODOS LOS USUARIOS
exports.getUsuarios = async (req, res) => {

    try {

        const usuarios = await prisma.usuarios.findMany({
            select: {
                usuario: true,
                nombre: true,
                area: true,
                correo: true,
                estado: true
            }
        })

        res.json(usuarios)

    } catch (error) {

        console.error('Error al obtener usuarios:', error)

        res.status(500).json({
            error: 'Error en la consulta'
        })
    }
}

// AGREGAR UN NUEVO USUARIO
exports.createUsuario = async (req, res) => {

    const {
        usuario,
        contrasena,
        nombre,
        area,
        correo,
        estado
    } = req.body

    if (
        !usuario ||
        !contrasena ||
        !nombre ||
        !area ||
        !correo
    ) {
        return res.status(400).json({
            error: 'Todos los campos son obligatorios'
        })
    }

    try {

        const usuarioExistente = await prisma.usuarios.findUnique({
            where: {
                usuario
            }
        })

        if (usuarioExistente) {
            return res.status(409).json({
                error: 'El nombre de usuario ya está en uso'
            })
        }

        const contrasenaHash = bcrypt.hashSync(
            contrasena,
            10
        )

        const nuevoUsuario = await prisma.usuarios.create({
            data: {
                usuario,
                contrasena: contrasenaHash,
                nombre,
                area,
                correo,
                estado: estado || 'activo'
            }
        })

        res.status(201).json({
            usuario: nuevoUsuario.usuario,
            nombre: nuevoUsuario.nombre,
            area: nuevoUsuario.area,
            correo: nuevoUsuario.correo,
            estado: nuevoUsuario.estado
        })

    } catch (error) {

        console.error('Error al agregar el usuario:', error)

        res.status(500).json({
            error: 'Error al agregar el usuario'
        })
    }
}

// EDITAR UN USUARIO
exports.updateUsuario = async (req, res) => {

    const { usuario: usuarioParam } = req.params

    const {
        usuario,
        contrasena,
        nombre,
        area,
        correo,
        estado
    } = req.body

    if (
        !usuario ||
        !contrasena ||
        !nombre ||
        !area ||
        !correo
    ) {
        return res.status(400).json({
            error: 'Todos los campos son obligatorios'
        })
    }

    try {

        const contrasenaHash = bcrypt.hashSync(
            contrasena,
            10
        )

        await prisma.usuarios.update({
            where: {
                usuario: usuarioParam
            },
            data: {
                usuario,
                contrasena: contrasenaHash,
                nombre,
                area,
                correo,
                estado
            }
        })

        res.json({
            mensaje: 'Usuario actualizado'
        })

    } catch (error) {

        console.error('Error al editar:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al editar el usuario'
        })
    }
}

// ELIMINAR UN USUARIO
exports.deleteUsuario = async (req, res) => {

    const { usuario } = req.params

    try {

        await prisma.usuarios.delete({
            where: {
                usuario
            }
        })

        res.json({
            mensaje: 'Usuario eliminado'
        })

    } catch (error) {

        console.error('Error al eliminar usuario:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al eliminar el usuario'
        })
    }
}