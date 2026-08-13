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

module.exports = authMiddleware
