const auditoriaRepository = require('../repository/auditoriaRepository')

exports.registrar = async (usuario, accion) => {
    try {
        await auditoriaRepository.crearLog(usuario, accion)
    } catch (error) {
        console.error('Error al registrar auditoría:', error)
    }
}
