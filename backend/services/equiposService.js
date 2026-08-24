const equiposRepository = require('../repository/equiposRepository')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

exports.getEstadosEquipo = async () => {
    return await equiposRepository.findEstados()
}

exports.getEquipos = async () => {
    return await equiposRepository.findEquipos()
}

// Registra un nuevo equipo; imagen es el nombre del archivo subido por multer (opcional)
exports.registrarEquipo = async (datos, imagen) => {
    const estadoValido = ['Disponible', 'En mantenimiento', 'Baja']
    if (!estadoValido.includes(datos.estado)) {
        throw new Error('ESTADO_INVALIDO')
    }

    let fechaAdquisicion = null
    if (datos.fecha_adquisicion && /^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_adquisicion)) {
        fechaAdquisicion = datos.fecha_adquisicion
    }

    return await equiposRepository.crearEquipo({
        num_serie: sanitizarTexto(datos.num_serie, 50),
        equipo: sanitizarTexto(datos.equipo, 100),
        area: sanitizarTexto(datos.area, 100) || 'Sin asignar',
        descripcion: datos.descripcion ? sanitizarHtml(datos.descripcion, 500) : null,
        sistema_operativo: datos.sistema_operativo ? sanitizarTexto(datos.sistema_operativo, 60) : null,
        estado: datos.estado,
        fecha_adquisicion: fechaAdquisicion,
        imagen: imagen || null
    })
}

exports.asignarUsuario = async (num_serie, usuario) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const responsable = sanitizarTexto(usuario, 50) || null
    await equiposRepository.updateResponsable(numSerieLimpio, responsable)
}

exports.reporteFalla = async (num_serie, falla, evidencia) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const fallaLimpia = sanitizarHtml(falla, 500)
    const fecha_reporte = new Date()
    const id_historial = Date.now().toString()

    await equiposRepository.createReporteTransaction(numSerieLimpio, id_historial, fecha_reporte, fallaLimpia, evidencia)
    return id_historial
}

exports.getReportes = async () => {
    return await equiposRepository.findReportesPendientes()
}

exports.getHistorialCompleto = async () => {
    return await equiposRepository.findHistorialCompleto()
}

exports.decidirAprobacion = async (id_historial, decision, aprobadoPor = null) => {
    if (!['aprobada', 'rechazada'].includes(decision)) {
        throw new Error('DECISION_INVALIDA')
    }

    const idHistorialLimpio = sanitizarTexto(id_historial, 30)
    const ordenActualizada = await equiposRepository.decidirOrden(idHistorialLimpio, decision, aprobadoPor ? sanitizarTexto(aprobadoPor, 50) : null)

    if (!ordenActualizada) {
        throw new Error('ORDEN_NO_PENDIENTE')
    }

    return { id_historial: idHistorialLimpio, decision }
}

exports.resolverReporte = async (num_serie, id_historial, tecnico, solucion) => {
    const numSerieLimpio = sanitizarTexto(num_serie, 50)
    const idHistorialLimpio = sanitizarTexto(id_historial, 30)
    const tecnicoLimpio = sanitizarTexto(tecnico, 50)
    const solucionLimpia = sanitizarHtml(solucion, 1000)
    const fecha_solucion = new Date()

    const resultado = await equiposRepository.resolverReporteTransaction(numSerieLimpio, idHistorialLimpio, fecha_solucion, tecnicoLimpio, solucionLimpia)

    if (!resultado) {
        throw new Error('ORDEN_NO_APROBADA')
    }
}

exports.buscarMantenimientos = async (filter) => {
    const filtroLimpio = sanitizarTexto(filter, 100)
    return await equiposRepository.buscarMantenimientos(filtroLimpio)
}
