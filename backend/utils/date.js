// Devuelve la fecha en formato YYYY-MM-DD (por defecto la fecha actual)
function formatDate(date = new Date()) {
    const anio = date.getFullYear()
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const dia = String(date.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
}

module.exports = { formatDate }
