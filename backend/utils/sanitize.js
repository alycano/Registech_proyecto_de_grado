const AREAS = ['Tecnologia', 'Recursos Humanos', 'Soporte']

function sanitizarTexto(valor, maxLongitud = 255) {
    if (typeof valor !== 'string') return ''
    let texto = valor.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    texto = texto.trim()
    if (maxLongitud > 0 && texto.length > maxLongitud) {
        texto = texto.slice(0, maxLongitud)
    }
    return texto
}

function sanitizarHtml(valor, maxLongitud = 255) {
    let texto = sanitizarTexto(valor, maxLongitud)
    texto = texto.replace(/<script[\s\S]*?<\/script>/gi, '')
    texto = texto.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    texto = texto.replace(/(href|src|action)\s*=\s*("|')?\s*javascript:[^"']*/gi, '$1=""')
    return texto
}

function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}

function sanitizarNumero(valor) {
    if (valor === null || valor === undefined || valor === '') return null
    const numero = Number(valor)
    if (!Number.isFinite(numero)) return null
    return numero
}

module.exports = { AREAS, sanitizarTexto, sanitizarHtml, esCorreoValido, sanitizarNumero }
