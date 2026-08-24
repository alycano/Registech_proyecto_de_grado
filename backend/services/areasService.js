const areasRepository = require('../repository/areasRepository')
const { sanitizarTexto } = require('../utils/sanitize')

exports.getAllAreas = async () => {
    return await areasRepository.findAll()
}

exports.crearArea = async (area) => {
    const limpia = sanitizarTexto(area, 100)
    if (!limpia || limpia.length < 2) throw new Error('AREA_INVALIDA')
    if (await areasRepository.exists(limpia)) throw new Error('AREA_DUPLICADA')
    await areasRepository.create(limpia)
    return { area: limpia }
}

exports.actualizarArea = async (vieja, nueva) => {
    const viejaLimpia = sanitizarTexto(vieja, 100)
    const nuevaLimpia = sanitizarTexto(nueva, 100)
    if (!nuevaLimpia || nuevaLimpia.length < 2) throw new Error('AREA_INVALIDA')
    if (!(await areasRepository.exists(viejaLimpia))) throw new Error('AREA_NO_ENCONTRADA')
    if (nuevaLimpia.toLowerCase() !== viejaLimpia.toLowerCase() && await areasRepository.exists(nuevaLimpia)) {
        throw new Error('AREA_DUPLICADA')
    }
    await areasRepository.rename(viejaLimpia, nuevaLimpia)
    return { area: nuevaLimpia }
}

exports.eliminarArea = async (area) => {
    const uso = await areasRepository.contarUso(area)
    if (uso.equipos > 0 || uso.usuarios > 0) {
        const error = new Error('AREA_EN_USO')
        error.detalle = uso
        throw error
    }
    const eliminada = await areasRepository.remove(area)
    if (!eliminada) throw new Error('AREA_NO_ENCONTRADA')
    return true
}
