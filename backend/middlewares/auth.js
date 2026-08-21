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

        req.usuario = verifyToken(token)

        next()

    } catch (error) {

        return res.status(401).json({
            error: 'Token invalido o expirado'
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

module.exports = {
    authMiddleware,
    requireArea
}