import { useState, useEffect } from "react"
import axios from "axios"
import { API_ROUTES } from "../api/apiRoutes"

const HistorialPrestamos = () => {
    const [prestamos, setPrestamos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("")

    useEffect(() => {
        axios.get(API_ROUTES.PRESTAMOS)
            .then(response => {
                setPrestamos(response.data)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [])

    // DIAS ENTRE EL INICIO Y LA DEVOLUCION (O HOY SI SIGUE ACTIVO)
    const getDuracion = (p) => {
        if (!p.fecha_prestamo) return null
        const inicio = new Date(`${String(p.fecha_prestamo).substring(0, 10)}T00:00:00`)
        const fin = p.fecha_devolucion && p.estado === 'devuelto'
            ? new Date(`${String(p.fecha_devolucion).substring(0, 10)}T00:00:00`)
            : new Date(); fin.setHours(0, 0, 0, 0)
        return Math.max(0, Math.round((fin - inicio) / 86400000))
    }

    // ESTADO DEL PRESTAMO ACTIVO RESPECTO A SU FECHA LIMITE
    const getSituacion = (p) => {
        if (p.estado !== 'activo' || !p.fecha_devolucion) return null
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const limite = new Date(`${String(p.fecha_devolucion).substring(0, 10)}T00:00:00`)
        const dias = Math.round((limite - hoy) / 86400000)
        if (dias < 0) return {tipo: 'vencido', dias}
        if (dias <= 2) return {tipo: 'por_vencer', dias}
        return null
    }

    const filteredPrestamos = prestamos.filter(p => {
        const texto = filter.toLowerCase()
        const matchTexto = !texto ||
            p.num_serie?.toLowerCase().includes(texto) ||
            p.equipo?.toLowerCase().includes(texto) ||
            p.usuario_destino?.toLowerCase().includes(texto)
        const matchEstado = !filtroEstado || p.estado === filtroEstado
        return matchTexto && matchEstado
    })

    const activos = prestamos.filter(p => p.estado === 'activo').length
    const devueltos = prestamos.length - activos

    const getEstadoClass = (estado) => estado === 'activo' ? 'estado-prestamo' : 'estado-disponible'

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando historial...</div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        Historial de Préstamos
                    </h4>
                    <div className="d-flex gap-2">
                        <span className="badge estado-prestamo">{activos} activos</span>
                        <span className="badge estado-disponible">{devueltos} devueltos</span>
                    </div>
                </div>

                {/* FILTROS EN VIVO */}
                <div className="row g-2 mb-3">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por equipo, numero de serie o usuario..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="devuelto">Devueltos</option>
                        </select>
                    </div>
                </div>

                {filteredPrestamos.length === 0 ? (
                    <div className="empty-state">
                        <p className="text-muted my-3">No hay préstamos que coincidan con la búsqueda</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead className="table-header">
                                <tr>
                                    <th>Equipo</th>
                                    <th>Usuario</th>
                                    <th>Inicio</th>
                                    <th>Límite / Devolución</th>
                                    <th>Duración</th>
                                    <th>Detalles / Evidencia</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrestamos.map(p => {
                                    const duracion = getDuracion(p)
                                    const situacion = getSituacion(p)
                                    return (
                                        <tr key={`${p.id_prestamo}-${p.num_serie}`}>
                                            <td>
                                                <div className="fw-semibold">{p.equipo || '-'}</div>
                                                <code className="equipo-card__ns">{p.num_serie}</code>
                                            </td>
                                            <td>{p.usuario_destino}</td>
                                            <td>{String(p.fecha_prestamo).substring(0, 10)}</td>
                                            <td>
                                                {String(p.fecha_devolucion || '').substring(0, 10) || '—'}
                                                {!p.fecha_devolucion && <small className="text-muted d-block">(sin límite)</small>}
                                            </td>
                                            <td>
                                                {duracion !== null && (
                                                    <span className="text-secondary">{duracion} día{duracion !== 1 ? 's' : ''}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '180px', fontSize: '0.85rem' }}>
                                                    {p.observaciones ? <span className="text-muted">{p.observaciones}</span> : <span className="text-muted fst-italic">Sin observaciones</span>}
                                                </div>
                                                {p.evidencia && (
                                                    <a 
                                                        href={API_ROUTES.ARCHIVO_EVIDENCIA(p.evidencia)} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="btn btn-sm btn-primary mt-1"
                                                    >
                                                        <i className="bi bi-image me-1"></i> Ver Foto
                                                    </a>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${getEstadoClass(p.estado)}`}>
                                                    {p.estado === 'activo' ? 'Activo' : 'Devuelto'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistorialPrestamos
