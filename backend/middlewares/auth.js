const { verifyToken } = require('../utils/jwt')

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token no proporcionado' })
    }

    try {
        req.usuario = verifyToken(token)
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Token invalido o expirado' })
    }
}

function requireArea(...areasPermitidas) {
    return (req, res, next) => {
        if (!req.usuario || !areasPermitidas.includes(req.usuario.area)) {
            return res.status(403).json({ error: 'No tienes permisos para esta accion' })
        }
        next()
    }
}

module.exports = { authMiddleware, requireArea }
