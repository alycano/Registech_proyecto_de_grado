export const toISODate = (fecha) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'disponible': return 'estado-disponible'
        case 'asignado': return 'estado-prestamo'
        case 'mantenimiento': case 'en mantenimiento': return 'estado-mantenimiento'
        case 'baja': case 'inactivo': return 'estado-baja'
        default: return 'estado-baja'
    }
}

export const getEstadoLabel = (estado) => {
    return estado === 'Asignado' ? 'En Préstamo' : estado
}

export const getEspecificaciones = (equipo) => {
    if (!equipo.descripcion) return []
    return equipo.descripcion.split(',').map(s => s.trim()).filter(Boolean)
}

export const getSpecIcon = (spec) => {
    const s = spec.toLowerCase()
    if (s.includes('ghz') || s.includes('core') || s.includes('intel') || s.includes('ryzen') || s.includes('cpu') || s.includes('procesador')) return 'bi-cpu text-primary'
    if (s.includes('ram') || s.includes('gb ram') || s.includes('ddr') || s.includes('memoria')) return 'bi-memory text-primary'
    if (s.includes('ssd') || s.includes('hdd') || s.includes('disco') || s.includes('almacenamiento') || s.includes('tb') || s.includes('gb')) return 'bi-device-hdd text-primary'
    if (s.includes('windows') || s.includes('linux') || s.includes('ubuntu') || s.includes('macos') || s.includes('sistema') || s.includes('os')) return 'bi-windows text-primary'
    return 'bi-check2-circle text-success'
}
