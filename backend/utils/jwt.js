const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'clave-secreta-solo-para-desarrollo'

function signToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, SECRET, { expiresIn })
}

function verifyToken(token) {
    return jwt.verify(token, SECRET)
}

module.exports = { signToken, verifyToken }
