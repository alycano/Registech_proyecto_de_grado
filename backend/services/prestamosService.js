const prestamosRepository = require('../repository/prestamosRepository')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

exports.getPrestamos = async () => {
    return await prestamosRepository.findPrestamos()
}

exports.getPrestamosActivos = async () => {
    return await prestamosRepository.findPrestamosActivos()
}

exports.crearPrestamo = async (num_serie, usuario_destino, observaciones) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const usuarioLimpio = sanitizarTexto(usuario_destino, 50)
    const observacionesLimpias = observaciones ? sanitizarHtml(observaciones, 500) : null

    await prestamosRepository.crearPrestamoTransaction(numSerieLimpio, usuarioLimpio, observacionesLimpias)
}

exports.devolverPrestamo = async (id) => {
    const idLimpio = sanitizarTexto(id, 50)
    await prestamosRepository.devolverPrestamoTransaction(idLimpio)
}

exports.historialEquipo = async (num_serie) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    return await prestamosRepository.findHistorialEquipo(numSerieLimpio)
}

exports.getEstadisticas = async () => {
    return await prestamosRepository.getEstadisticasData()
}
