const areasRepository = require('../repository/areasRepository')
const { sanitizarTexto } = require('../utils/sanitize')
const AppError = require('../utils/AppError')

exports.getAllAreas = async () => {
    return await areasRepository.findAll()
}

exports.crearArea = async (area) => {
    const limpia = sanitizarTexto(area, 100)
    if (!limpia || limpia.length < 2) throw new AppError('El nombre del departamento no es válido', 400)
    if (await areasRepository.exists(limpia)) throw new AppError('Ya existe un departamento con ese nombre', 409)
    await areasRepository.create(limpia)
    return { area: limpia }
}

exports.actualizarArea = async (vieja, nueva) => {
    const viejaLimpia = sanitizarTexto(vieja, 100)
    const nuevaLimpia = sanitizarTexto(nueva, 100)
    if (!nuevaLimpia || nuevaLimpia.length < 2) throw new AppError('El nombre del departamento no es válido', 400)
    if (!(await areasRepository.exists(viejaLimpia))) throw new AppError('El departamento no existe', 404)
    if (nuevaLimpia.toLowerCase() !== viejaLimpia.toLowerCase() && await areasRepository.exists(nuevaLimpia)) {
        throw new AppError('Ya existe un departamento con ese nombre', 409)
    }
    await areasRepository.rename(viejaLimpia, nuevaLimpia)
    return { area: nuevaLimpia }
}

exports.eliminarArea = async (area) => {
    const uso = await areasRepository.contarUso(area)
    if (uso.equipos > 0 || uso.usuarios > 0) {
        throw new AppError(`No se puede eliminar: tiene ${uso.equipos} equipo(s) y ${uso.usuarios} usuario(s) asignados`, 409)
    }
    const eliminada = await areasRepository.remove(area)
    if (!eliminada) throw new AppError('El departamento no existe', 404)
    return true
}
