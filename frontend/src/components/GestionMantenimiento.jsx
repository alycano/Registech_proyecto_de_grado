import { useState, useEffect } from "react"
import axios from "axios"
import Soportes from "./Soportes"
import Historiales from "./Historiales"
import { API_ROUTES } from "../api/apiRoutes"
import { useAuth } from "../context/AuthContext"

const GestionMantenimiento = () => {
    const { usuario } = useAuth()
    const esAdmin = usuario?.rol === 'admin'

    const [vista, setVista] = useState('activas')
    const [kpis, setKpis] = useState(null)

    // RESUMEN GENERAL PARA LAS TARJETAS KPI (SOLO ADMIN, REFRESCA CADA 15s)
    useEffect(() => {
        if (!esAdmin) return

        const cargarKpis = () => {
            axios.get(API_ROUTES.HISTORIAL_MANTENIMIENTOS)
                .then(res => {
                    const data = res.data
                    setKpis({
                        total: data.length,
                        porAprobar: data.filter(m => m.estado_orden === 'pendiente').length,
                        enReparacion: data.filter(m => m.estado_orden === 'aprobada' && !m.fecha_solucion).length,
                        completados: data.filter(m => m.fecha_solucion).length
                    })
                })
                .catch(() => setKpis(null))
        }

        cargarKpis()
        const intervalo = setInterval(cargarKpis, 15000)
        return () => clearInterval(intervalo)
    }, [esAdmin])

    return (
        <div>
            {/* ENCABEZADO */}
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Mantenimiento
                </h2>
                <span className="badge bg-primary-subtle text-primary-emphasis">
                    Ordenes de trabajo y reparaciones
                </span>
            </div>

            {/* TARJETAS RESUMEN (SOLO ADMIN) */}
            {esAdmin && (
                !kpis ? (
                    <div className="text-center py-4 text-secondary">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Cargando resumen...
                    </div>
                ) : (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3 col-6">
                            <div className="card border shadow-sm h-100">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="kpi-icon kpi-icon--primario">
                                        <i className="bi bi-clipboard-data"></i>
                                    </div>
                                    <div>
                                        <div className="fs-4 fw-bold">{kpis.total}</div>
                                        <div className="text-secondary small">Órdenes totales</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3 col-6">
                            <div className="card border shadow-sm h-100">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="kpi-icon kpi-icon--amarillo">
                                        <i className="bi bi-hourglass-split"></i>
                                    </div>
                                    <div>
                                        <div className="fs-4 fw-bold">{kpis.porAprobar}</div>
                                        <div className="text-secondary small">Por aprobar</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3 col-6">
                            <div className="card border shadow-sm h-100">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="kpi-icon kpi-icon--rojo">
                                        <i className="bi bi-wrench-adjustable"></i>
                                    </div>
                                    <div>
                                        <div className="fs-4 fw-bold">{kpis.enReparacion}</div>
                                        <div className="text-secondary small">En reparación</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3 col-6">
                            <div className="card border shadow-sm h-100">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="kpi-icon kpi-icon--verde">
                                        <i className="bi bi-check2-circle"></i>
                                    </div>
                                    <div>
                                        <div className="fs-4 fw-bold">{kpis.completados}</div>
                                        <div className="text-secondary small">Completados</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* PESTANAS (SOLO ADMIN) */}
            {esAdmin && (
                <ul className="nav nav-pills mb-4 gap-2">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${vista === 'activas' ? 'active' : ''}`}
                            onClick={() => setVista('activas')}
                        >
                            <i className="bi bi-inbox me-1"></i>
                            Órdenes Activas
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${vista === 'historial' ? 'active' : ''}`}
                            onClick={() => setVista('historial')}
                        >
                            <i className="bi bi-journal-text me-1"></i>
                            Historial Completo
                        </button>
                    </li>
                </ul>
            )}

            {/* CONTENIDO SEGUN ROL / PESTANA */}
            {esAdmin ? (
                vista === 'activas'
                    ? <Soportes usuario={usuario?.usuario} esAdmin />
                    : <Historiales usuario={usuario?.usuario} />
            ) : (
                <Soportes usuario={usuario?.usuario} esAdmin={false} />
            )}
        </div>
    )
}

export default GestionMantenimiento
