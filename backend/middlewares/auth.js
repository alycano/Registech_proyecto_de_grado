const { verifyToken } = require('../utils/jwt')

function authMiddleware(req, res, next) {

    // BUSCAR TOKEN EN AUTHORIZATION
    const header = req.headers.authorization || ''
    const [scheme, bearerToken] = header.split(' ')

    // BUSCAR TOKEN EN COOKIE
    const cookieToken = req.cookies?.token

    const token =
        scheme === 'Bearer' && bearerToken
            ? bearerToken
            : cookieToken

    if (!token) {
        return res.status(401).json({
            error: 'Token no proporcionado'
        })
    }

    try {
        const payload = verifyToken(token)
        req.usuario = payload

        // REFRESCAR EL TOKEN (SLIDING SESSION) PARA 15 MINUTOS MÁS
        const { iat, exp, ...userData } = payload
        const newToken = require('../utils/jwt').signToken(userData, '15m')

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 MINUTOS
        })

        // (Opcional) Si el frontend necesita leer el token actualizado desde los headers
        res.setHeader('x-refresh-token', newToken)

        next()
    } catch (error) {
        return res.status(401).json({
            error: 'Token invalido o expirado por inactividad'
        })
    }
}

function requireArea(...areasPermitidas) {

    return (req, res, next) => {

        if (
            !req.usuario ||
            !areasPermitidas.includes(req.usuario.area)
        ) {
            return res.status(403).json({
                error: 'No tienes permisos para esta accion'
            })
        }

        next()
    }
}

function requireRol(...rolesPermitidos) {

    return (req, res, next) => {

        if (
            !req.usuario ||
            !rolesPermitidos.includes(req.usuario.rol)
        ) {
            return res.status(403).json({
                error: 'No tienes permisos para esta accion'
            })
        }

        next()
    }
}

module.exports = {
    authMiddleware,
    requireArea,
    requireRol
}