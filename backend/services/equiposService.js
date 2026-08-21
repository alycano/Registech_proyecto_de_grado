const equiposRepository = require('../repository/equiposRepository')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

exports.getEstadosEquipo = async () => {
    return await equiposRepository.findEstados()
}

exports.getEquipos = async () => {
    return await equiposRepository.findEquipos()
}

exports.asignarUsuario = async (num_serie, usuario) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    if (!numSerieLimpio) throw new Error('El numero de serie es requerido')

    const responsable = sanitizarTexto(usuario, 50) || null
    await equiposRepository.updateResponsable(numSerieLimpio, responsable)
}

exports.reporteFalla = async (num_serie, falla) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const fallaLimpia = sanitizarHtml(falla, 500)

    if (!numSerieLimpio || !fallaLimpia) {
        throw new Error('El numero de serie y la falla son requeridos')
    }

    const fecha_reporte = new Date()
    const id_historial = Date.now().toString()

    await equiposRepository.createReporteTransaction(numSerieLimpio, id_historial, fecha_reporte, fallaLimpia)
}

exports.getReportes = async () => {
    return await equiposRepository.findReportesPendientes()
}

exports.resolverReporte = async (num_serie, id_historial, tecnico, solucion) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const idHistorialLimpio = sanitizarTexto(id_historial, 30)
    const tecnicoLimpio = sanitizarTexto(tecnico, 50)
    const solucionLimpia = sanitizarHtml(solucion, 1000)

    if (!numSerieLimpio || !idHistorialLimpio || !tecnicoLimpio || !solucionLimpia) {
        throw new Error('El numero de serie, id_historial, tecnico y solucion son requeridos')
    }

    const fecha_solucion = new Date()

    await equiposRepository.resolverReporteTransaction(numSerieLimpio, idHistorialLimpio, fecha_solucion, tecnicoLimpio, solucionLimpia)
}

exports.buscarMantenimientos = async (filter) => {
    const filtroLimpio = sanitizarTexto(filter, 100)
    if (!filtroLimpio) throw new Error('Se debe proporcionar al menos uno de los elementos')

    return await equiposRepository.buscarMantenimientos(filtroLimpio)
}
