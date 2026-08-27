const crypto = require('crypto')

const tokens = new Map()

const CLEANUP_INTERVAL = 5 * 60 * 1000 // cada 5 minutos
let cleanupTimer = null

function limpiarTokensExpirados() {
    const now = Date.now()
    for (const [sessionId, entry] of tokens.entries()) {
        if (now > entry.expires) {
            tokens.delete(sessionId)
        }
    }
}

function iniciarCleanup() {
    if (cleanupTimer) return
    cleanupTimer = setInterval(limpiarTokensExpirados, CLEANUP_INTERVAL)
    if (cleanupTimer.unref) cleanupTimer.unref()
}

function detenerCleanup() {
    if (cleanupTimer) {
        clearInterval(cleanupTimer)
        cleanupTimer = null
    }
}

function generarTokenCsrf(sessionId) {
    limpiarTokensExpirados()
    const token = crypto.randomBytes(32).toString('hex')
    tokens.set(sessionId, { token, expires: Date.now() + 60 * 60 * 1000 })
    return token
}

function verificarCsrf(sessionId, token) {
    if (!sessionId || !token) return false
    const entry = tokens.get(sessionId)
    if (!entry) return false
    if (Date.now() > entry.expires) {
        tokens.delete(sessionId)
        return false
    }
    try {
        const a = Buffer.from(entry.token, 'hex')
        const b = Buffer.from(token, 'hex')
        if (a.length !== b.length) return false
        return crypto.timingSafeEqual(a, b)
    } catch {
        return false
    }
}

function eliminarToken(sessionId) {
    tokens.delete(sessionId)
}

function middlewareCsrf(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next()
    }

    const sessionId = req.cookies?.session_id
    const csrfToken = req.headers['x-csrf-token']

    if (!sessionId || !verificarCsrf(sessionId, csrfToken)) {
        return res.status(403).json({ error: 'Token CSRF inválido o faltante' })
    }

    next()
}

iniciarCleanup()

module.exports = { generarTokenCsrf, verificarCsrf, eliminarToken, middlewareCsrf, detenerCleanup }
