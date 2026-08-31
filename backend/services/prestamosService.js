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

exports.getPrestamoActivoPorEquipo = async (num_serie) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    return await prestamosRepository.findPrestamoActivoPorEquipo(numSerieLimpio)
}


exports.crearPrestamo = async (
    num_series,
    usuario_destino,
    observaciones,
    fecha_inicio,
    fecha_limite,
    area
) => {
    const usuarioLimpio = sanitizarTexto(usuario_destino, 50)

    const numSeriesLimpios = Array.isArray(num_series)
        ? num_series.map(numSerie => sanitizarTexto(numSerie, 50))
        : []

    const observacionesLimpias = observaciones
        ? sanitizarHtml(observaciones, 500)
        : null

    const areaLimpia = area
        ? sanitizarTexto(area, 100)
        : null

    const fechaInicioLimpia = validarFecha(fecha_inicio)
    const fechaLimiteLimpia = validarFecha(fecha_limite)

    if (
        numSeriesLimpios.length === 0 ||
        !usuarioLimpio
    ) {
        throw new Error('REQUERIDOS')
    }

    if (
        fechaInicioLimpia &&
        fechaLimiteLimpia &&
        fechaLimiteLimpia < fechaInicioLimpia
    ) {
        throw new Error('FECHAS_INVALIDAS')
    }

    await prestamosRepository.crearPrestamoTransaction(
        numSeriesLimpios,
        usuarioLimpio,
        observacionesLimpias,
        fechaInicioLimpia,
        fechaLimiteLimpia,
        areaLimpia
    )
}



exports.devolverPrestamo = async (id, observaciones, evidencia) => {
    const idLimpio = sanitizarTexto(id, 50)

    const obsLimpia = observaciones
        ? sanitizarTexto(observaciones, 500)
        : null

    await prestamosRepository.devolverPrestamoTransaction(
        idLimpio,
        obsLimpia,
        evidencia
    )
}


exports.devolverEquipo = async (
    id,
    num_serie,
    observaciones,
    evidencia
) => {
    const idLimpio = sanitizarTexto(id, 50)

    const numSerieLimpio = sanitizarTexto(num_serie, 50)

    const obsLimpia = observaciones
        ? sanitizarTexto(observaciones, 500)
        : null

    return await prestamosRepository.devolverEquipoTransaction(
        idLimpio,
        numSerieLimpio,
        obsLimpia,
        evidencia
    )
}

exports.historialEquipo = async (num_serie) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    return await prestamosRepository.findHistorialEquipo(numSerieLimpio)
}

exports.getEstadisticas = async () => {
    return await prestamosRepository.getEstadisticasData()
}

exports.devolverEquipoParcial = async (id_prestamo, num_serie, observaciones) => {
    const idLimpio = sanitizarTexto(id_prestamo, 50)
    const serieLimpia = sanitizarTexto(num_serie, 50)
    const obsLimpia = observaciones ? sanitizarTexto(observaciones, 500) : null

    if (!idLimpio || !serieLimpia) {
        throw new Error('REQUERIDOS')
    }

    await prestamosRepository.devolverEquipoParcialTransaction(idLimpio, serieLimpia, obsLimpia)
}