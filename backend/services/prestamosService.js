const prestamosRepository = require('../repository/prestamosRepository')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

// Valida formato YYYY-MM-DD; devuelve null si viene vacio o invalido
function validarFecha(valor) {
    if (!valor) return null
    return /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) ? String(valor) : null
}

exports.getPrestamos = async () => {
    return await prestamosRepository.findPrestamos()
}

exports.getPrestamosActivos = async () => {
    return await prestamosRepository.findPrestamosActivos()
}

exports.crearPrestamo = async (num_serie, usuario_destino, observaciones, fecha_inicio, fecha_limite, area) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const usuarioLimpio = sanitizarTexto(usuario_destino, 50)
    const observacionesLimpias = observaciones ? sanitizarHtml(observaciones, 500) : null
    const areaLimpia = area ? sanitizarTexto(area, 100) : null

    const fechaInicioLimpia = validarFecha(fecha_inicio)
    const fechaLimiteLimpia = validarFecha(fecha_limite)

    if (fechaInicioLimpia && fechaLimiteLimpia && fechaLimiteLimpia < fechaInicioLimpia) {
        throw new Error('FECHAS_INVALIDAS')
    }

    await prestamosRepository.crearPrestamoTransaction(
        numSerieLimpio,
        usuarioLimpio,
        observacionesLimpias,
        fechaInicioLimpia,
        fechaLimiteLimpia,
        areaLimpia
    )
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
