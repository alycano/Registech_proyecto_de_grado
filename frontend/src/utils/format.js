export const formatearDinero = (valor) => {
    const numero = Number(valor)
    if (isNaN(numero)) return '$0'
    return '$' + numero.toLocaleString('es-CO')
}

export const hoy = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const primerDiaMes = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
