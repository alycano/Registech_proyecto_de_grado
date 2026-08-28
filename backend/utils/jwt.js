const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET

if (!SECRET && process.env.NODE_ENV !== 'test') {
    console.warn('⚠ JWT_SECRET no definido en .env — el sistema usa un fallback inseguro. Define JWT_SECRET en producción.')
}

const SECRET_FINAL = SECRET || 'clave-secreta-solo-para-desarrollo'

function signToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, SECRET_FINAL, { expiresIn })
}

function verifyToken(token) {
    return jwt.verify(token, SECRET_FINAL)
}

module.exports = { signToken, verifyToken }
