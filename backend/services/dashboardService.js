const dashboardRepository = require('../repository/dashboardRepository')

exports.getDashboardData = async () => {
    const [stats, equiposPorArea, prestamosPorArea, equiposPorEstado, prestamosRecientes] = await Promise.all([
        dashboardRepository.getStats(),
        dashboardRepository.getEquiposPorArea(),
        dashboardRepository.getPrestamosPorArea(),
        dashboardRepository.getEquiposPorEstado(),
        dashboardRepository.getPrestamosRecientes(10),
    ])

    return {
        stats,
        charts: {
            equiposPorArea,
            prestamosPorArea,
            equiposPorEstado,
        },
        prestamosRecientes,
    }
}
