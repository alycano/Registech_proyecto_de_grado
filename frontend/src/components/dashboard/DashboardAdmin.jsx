import { useEffect, useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_ROUTES } from '../../api/apiRoutes'
import { useAuth } from '../../context/AuthContext'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const STATUS_COLORS = {
    Disponible: '#22c55e',
    Asignado: '#3b82f6',
    'En mantenimiento': '#ef4444',
    Baja: '#6b7280',
}

const ACTIVITY_COLORS = {
    prestamo: '#3b82f6',
    devolucion: '#22c55e',
    mantenimiento: '#f59e0b',
    default: '#94a3b8',
}

const KPICard = ({ icon, label, value, color }) => (
    <div className="kpi-card" style={{ '--kpi-accent': color }}>
        <div className="kpi-card__icon" style={{ background: color + '12', color }}>
            <i className={`bi ${icon}`}></i>
        </div>
        <div className="kpi-card__body">
            <div className="kpi-card__value">{value}</div>
            <div className="kpi-card__label">{label}</div>
        </div>
    </div>
)

function timeAgo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `Hace ${days}d`
}

function getActivityColor(accion) {
    const a = accion.toLowerCase()
    if (a.includes('prestamo') || a.includes('prestó')) return ACTIVITY_COLORS.prestamo
    if (a.includes('devoluci') || a.includes('devol')) return ACTIVITY_COLORS.devolucion
    if (a.includes('mantenimiento') || a.includes('reporte') || a.includes('falla')) return ACTIVITY_COLORS.mantenimiento
    return ACTIVITY_COLORS.default
}

export default function DashboardAdmin() {
    const { usuario } = useAuth()
    const [data, setData] = useState(null)
    const [actividad, setActividad] = useState([])
    const [solicitudes, setSolicitudes] = useState([])
    const [ordenes, setOrdenes] = useState([])
    const [fotoAmpliada, setFotoAmpliada] = useState(null)
    const [detalleOrden, setDetalleOrden] = useState(null)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const ROWS = 5

    const rol = usuario?.rol

    const cargarOrdenes = () => {
        if (rol === 'admin' || rol === 'sistemas') {
            return axios.get(API_ROUTES.OBTENER_MANTENIMIENTOS).then(o => setOrdenes(o.data)).catch(() => {})
        }
        return Promise.resolve()
    }

    useEffect(() => {
        const promises = [
            axios.get(API_ROUTES.DASHBOARD),
            axios.get(API_ROUTES.ACTIVIDAD).catch(() => ({ data: [] })),
        ]
        if (rol === 'admin') {
            promises.push(axios.get(API_ROUTES.SOLICITUDES).catch(() => ({ data: [] })))
        } else {
            promises.push(Promise.resolve({ data: [] }))
        }
        promises.push(cargarOrdenes())

        Promise.all(promises).then(([d, a, s]) => {
            setData(d.data)
            setActividad(a.data)
            setSolicitudes(s.data)
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])

    const handleDecidir = (idHistorial, decision) => {
        const accion = decision === 'aprobada' ? 'aprobar' : 'rechazar'
        Swal.fire({
            icon: 'question',
            title: `¿Seguro que deseas ${accion} la orden?`,
            text: decision === 'aprobada'
                ? 'El técnico podrá comenzar la reparación'
                : 'El equipo regresará al estado disponible',
            showCancelButton: true,
            confirmButtonText: `Si, ${accion}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: decision === 'aprobada' ? '#198754' : '#dc3545'
        }).then(result => {
            if (!result.isConfirmed) return
            axios.post(API_ROUTES.APROBACION_ORDEN, { id_historial: idHistorial, decision })
                .then(res => {
                    Swal.fire({ icon: 'success', title: res.data?.mensaje || 'Listo', timer: 2000, showConfirmButton: false })
                    cargarOrdenes()
                    axios.get(API_ROUTES.ACTIVIDAD).then(a => setActividad(a.data)).catch(() => {})
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err.response?.data?.error || 'No se pudo procesar la orden'
                    })
                })
        })
    }

    const handleExportar = () => {
        axios.get(API_ROUTES.EXPORTAR_EQUIPOS, { responseType: 'blob' }).then(res => {
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = 'equipos_registech.xlsx'
            a.click()
            window.URL.revokeObjectURL(url)
        })
    }

    const handleResponder = (id, estado) => {
        axios.put(API_ROUTES.RESPONDER_SOLICITUD(id), { estado, respuesta: estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada' })
            .then(() => {
                setSolicitudes(prev => prev.map(s =>
                    s.id_solicitud === id ? { ...s, estado } : s
                ))
            })
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status" style={{width:'2rem',height:'2rem'}}></div>
            </div>
        )
    }

    if (!data) return <div className="alert alert-danger">Error al cargar el dashboard</div>

    const { stats, charts, prestamosRecientes } = data

    const donutData = {
        labels: charts.equiposPorEstado.map(e => e.estado),
        datasets: [{
            data: charts.equiposPorEstado.map(e => e.total),
            backgroundColor: charts.equiposPorEstado.map(e => STATUS_COLORS[e.estado] || '#94a3b8'),
            borderWidth: 0,
            hoverOffset: 4,
        }],
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
    const textColor = isDark ? '#94a3b8' : '#475569'

    const donutOpts = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, color: textColor } } },
    }

    const barColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899']

    const barData = {
        labels: charts.equiposPorArea.map(a => a.area),
        datasets: [{
            data: charts.equiposPorArea.map(a => a.total),
            backgroundColor: barColors.slice(0, charts.equiposPorArea.length),
            borderRadius: 4,
            barThickness: 30,
        }],
    }

    const barOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor } },
        },
    }

    const totalPages = Math.ceil(prestamosRecientes.length / ROWS)
    const paginatedLoans = prestamosRecientes.slice((page - 1) * ROWS, page * ROWS)
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length

    return (
        <div className="dashboard-admin">
            <div className="dashboard-admin__header">
                <div>
                    <h2 className="dashboard-admin__title">
                        {rol === 'sistemas' ? 'Panel de Mantenimiento' : rol === 'inventario' ? 'Panel de Inventario' : 'Panel de Control'}
                    </h2>
                    <p className="dashboard-admin__subtitle">
                        {rol === 'sistemas' ? 'Gestión de órdenes y mantenimiento' : rol === 'inventario' ? 'Vista general de equipos y préstamos' : 'Vista general del sistema'}
                    </p>
                </div>
                {rol === 'admin' && (
                    <button className="btn btn-sm btn-primary rounded-pill" onClick={handleExportar}>
                        <i className="bi bi-download me-1"></i>Exportar Excel
                    </button>
                )}
            </div>

            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                    <KPICard icon="bi-pc-display" label="Total Equipos" value={stats.total} color="#3b82f6" />
                </div>
                <div className="col-sm-6 col-xl-3">
                    <KPICard icon="bi-person-check" label="Asignados" value={stats.asignados} color="#22c55e" />
                </div>
                <div className="col-sm-6 col-xl-3">
                    <KPICard icon="bi-check-circle" label="Disponibles" value={stats.disponibles} color="#f59e0b" />
                </div>
                <div className="col-sm-6 col-xl-3">
                    <KPICard icon="bi-wrench" label="Mantenimiento" value={stats.mantenimiento} color="#ef4444" />
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className={`col-lg-${rol === 'admin' ? 4 : 6}`}>
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <h5 className="chart-card__title">Por Estado</h5>
                        </div>
                        <div className="chart-card__body" style={{ height: '240px' }}>
                            <Doughnut data={donutData} options={donutOpts} />
                        </div>
                    </div>
                </div>
                <div className={`col-lg-${rol === 'admin' ? 5 : 6}`}>
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <h5 className="chart-card__title">Por Area</h5>
                        </div>
                        <div className="chart-card__body" style={{ height: '240px' }}>
                            <Bar data={barData} options={barOpts} />
                        </div>
                    </div>
                </div>
                {rol === 'admin' && (
                <div className="col-lg-3">
                    <div className="chart-card">
                        <div className="chart-card__header">
                            <h5 className="chart-card__title">Actividad</h5>
                            {pendientes > 0 && <span className="chart-card__badge">{pendientes} pend.</span>}
                        </div>
                        {actividad.length === 0 ? (
                            <div className="text-center text-muted py-3" style={{fontSize:'0.82rem'}}>Sin actividad reciente</div>
                        ) : (
                            <ul className="activity-feed">
                                {actividad.slice(0, 10).map((a, i) => (
                                    <li key={i} className="activity-item">
                                        <span className="activity-dot" style={{background: getActivityColor(a.accion)}}></span>
                                        <div>
                                            <div className="activity-text" title={`${a.usuario} ${a.accion}`}><strong>{a.usuario}</strong> {a.accion}</div>
                                            <div className="activity-time">{timeAgo(a.fecha)}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                )}
            </div>

            {(rol === 'admin' || rol === 'sistemas') && ordenes.filter(o => o.estado_orden === 'pendiente').length > 0 && (
                <div className="table-card mb-4">
                    <div className="table-card__header">
                        <h5 className="chart-card__title mb-0">
                            <i className="bi bi-clipboard-check me-2"></i>
                            Ordenes de Mantenimiento por Aprobar
                        </h5>
                        <span className="chart-card__badge">
                            {ordenes.filter(o => o.estado_orden === 'pendiente').length} pendientes
                        </span>
                    </div>
                    <div className="table-responsive table-scroll">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-header">
                                <tr>
                                    <th>Evidencia</th>
                                    <th>Equipo</th>
                                    <th>Diagnostico</th>
                                    <th>Tecnico</th>
                                    <th className="text-end">Decision</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.filter(o => o.estado_orden === 'pendiente').map(o => (
                                    <tr key={o.id_historial}>
                                        <td style={{ width: '90px' }}>
                                            {o.evidencia ? (
                                                <img
                                                    src={API_ROUTES.ARCHIVO_EVIDENCIA(o.evidencia)}
                                                    alt={`Evidencia ${o.num_serie}`}
                                                    className="rounded border"
                                                    style={{ width: '72px', height: '54px', objectFit: 'cover', cursor: 'zoom-in' }}
                                                    onClick={() => setFotoAmpliada(o.evidencia)}
                                                    title="Click para ampliar"
                                                />
                                            ) : (
                                                <span className="text-muted small">Sin foto</span>
                                            )}
                                        </td>
                                        <td><strong>{o.equipo || o.num_serie}</strong><br /><small className="text-muted">{o.num_serie}</small></td>
                                        <td style={{ maxWidth: '260px' }}>{o.falla}</td>
                                        <td>{o.usuario_tecnico || '-'}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => setDetalleOrden(o)}
                                            >
                                                <i className="bi bi-eye me-1"></i>Ver detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="row g-4 cards-equal-row">
                {rol !== 'sistemas' && (
                <div className={rol === 'admin' ? 'col-lg-7' : 'col-lg-12'}>
                    <div className="table-card">
                        <div className="table-card__header">
                            <h5 className="chart-card__title mb-0">Prestamos Recientes</h5>
                        </div>
                        {paginatedLoans.length === 0 ? (
                            <div className="empty-state"><i className="bi bi-inbox"></i><h5>Sin prestamos aun</h5></div>
                        ) : (
                            <>
                                <div className="table-responsive table-scroll">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-header">
                                            <tr>
                                                <th>Equipo</th>
                                                <th>Solicitante</th>
                                                <th>Depto.</th>
                                                <th>Fecha</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedLoans.map(p => (
                                                <tr key={`${p.id_prestamo}-${p.num_serie}`}>
                                                    <td><strong>{p.equipo}</strong><br/><small className="text-muted">{p.num_serie}</small></td>
                                                    <td>{p.usuario_destino}</td>
                                                    <td><span className="dept-tag">{p.equipo_area}</span></td>
                                                    <td>{formatDate(p.fecha_prestamo)}</td>
                                                    <td>
                                                        <span className={`badge ${p.estado === 'activo' ? 'estado-prestamo' : 'estado-disponible'}`}>{p.estado}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                        <small className="text-muted">{(page-1)*ROWS+1}-{Math.min(page*ROWS, prestamosRecientes.length)} de {prestamosRecientes.length}</small>
                                        <div className="btn-group btn-group-sm">
                                            <button className="btn btn-outline-secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}><i className="bi bi-chevron-left"></i></button>
                                            <button className="btn btn-outline-secondary" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}><i className="bi bi-chevron-right"></i></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                )}
                {rol === 'admin' && (
                <div className="col-lg-5">
                    <div className="table-card">
                        <div className="table-card__header">
                            <h5 className="chart-card__title mb-0">Solicitudes de Equipos</h5>
                            {pendientes > 0 && <span className="chart-card__badge">{pendientes} pendientes</span>}
                        </div>
                        {solicitudes.length === 0 ? (
                            <div className="empty-state"><i className="bi bi-inbox"></i><h5>Sin solicitudes</h5><p>Las solicitudes de los usuarios apareceran aqui</p></div>
                        ) : (
                            <div className="table-responsive table-scroll">
                                <table className="table table-hover mb-0">
                                    <thead className="table-header">
                                        <tr>
                                            <th>Equipo</th>
                                            <th>Solicitante</th>
                                            <th>Justificacion</th>
                                            <th>Estado</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {solicitudes.slice(0, 5).map(s => (
                                            <tr key={s.id_solicitud}>
                                                <td><strong>{s.tipo_equipo}</strong></td>
                                                <td>{s.usuario_solicita}</td>
                                                <td><small className="text-muted">{s.justificacion || '-'}</small></td>
                                                    <td>
                                                    <span className={`badge ${s.estado === 'aprobada' ? 'estado-disponible' : s.estado === 'rechazada' ? 'estado-baja' : 'estado-mantenimiento'}`}>{s.estado}</span>
                                                </td>
                                                <td>
                                                    {s.estado === 'pendiente' && (
                                                        <div className="btn-group btn-group-sm">
                                                            <button className="btn btn-outline-success btn-sm" onClick={()=>handleResponder(s.id_solicitud,'aprobada')} title="Aprobar">
                                                                <i className="bi bi-check-lg"></i>
                                                            </button>
                                                            <button className="btn btn-outline-danger btn-sm" onClick={()=>handleResponder(s.id_solicitud,'rechazada')} title="Rechazar">
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* MODAL DETALLES DE ORDEN CON APROBACION ADENTRO (SOLO ADMIN) */}
            {detalleOrden && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setDetalleOrden(null)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Detalles de la Orden</h5>
                                <button type="button" className="btn-close" onClick={() => setDetalleOrden(null)}></button>
                            </div>
                            <div className="modal-body">
                                {detalleOrden.evidencia && (
                                    <div className="text-center mb-3">
                                        <img
                                            src={API_ROUTES.ARCHIVO_EVIDENCIA(detalleOrden.evidencia)}
                                            alt="Evidencia del daño"
                                            className="img-thumbnail"
                                            style={{ maxHeight: '190px', cursor: 'zoom-in' }}
                                            onClick={() => setFotoAmpliada(detalleOrden.evidencia)}
                                        />
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h6 className="fw-bold mb-1">{detalleOrden.equipo || 'Equipo'}</h6>
                                        <code>{detalleOrden.num_serie}</code>
                                        {detalleOrden.area && (
                                            <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">{detalleOrden.area}</span>
                                        )}
                                    </div>
                                    <span className="badge text-bg-warning">Pendiente de aprobación</span>
                                </div>

                                <table className="table table-sm mb-3">
                                    <tbody>
                                        <tr>
                                            <td className="text-secondary" style={{ width: '40%' }}>ID Orden</td>
                                            <td className="fw-semibold">{detalleOrden.id_historial}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-secondary">Fecha de reporte</td>
                                            <td>{new Date(detalleOrden.fecha_reporte).toLocaleDateString('es-CO')}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-secondary">Reportado por</td>
                                            <td>Soporte Técnico</td>
                                        </tr>
                                        <tr>
                                            <td className="text-secondary">Diagnóstico</td>
                                            <td>{detalleOrden.falla}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDetalleOrden(null)}>
                                    Cerrar
                                </button>
                                {rol === 'admin' && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() => { setDetalleOrden(null); handleDecidir(detalleOrden.id_historial, 'aprobada') }}
                                        >
                                            <i className="bi bi-check-lg me-1"></i>Aprobar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => { setDetalleOrden(null); handleDecidir(detalleOrden.id_historial, 'rechazada') }}
                                        >
                                            <i className="bi bi-x-lg me-1"></i>Rechazar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {fotoAmpliada && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1060', background: 'rgba(0,0,0,0.75)' }}
                    onClick={() => setFotoAmpliada(null)}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content bg-transparent border-0">
                            <div className="text-end mb-2">
                                <button className="btn btn-sm btn-outline-light rounded-pill" onClick={() => setFotoAmpliada(null)}>
                                    <i className="bi bi-x-lg me-1"></i>Cerrar
                                </button>
                            </div>
                            <img
                                src={API_ROUTES.ARCHIVO_EVIDENCIA(fotoAmpliada)}
                                alt="Evidencia ampliada"
                                className="img-fluid rounded shadow"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
