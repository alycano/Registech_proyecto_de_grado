import { useState, useEffect } from "react"
import axios from "axios"
import Prestamos from "./Prestamos"
import HistorialPrestamos from "./HistorialPrestamos"
import { API_ROUTES } from "../api/apiRoutes"

const GestionPrestamos = () => {
    const [vista, setVista] = useState('activos')
    const [kpis, setKpis] = useState(null)

    // RESUMEN GENERAL PARA LAS TARJETAS KPI (SE REFRESCA CADA 15s)
    useEffect(() => {
        const cargarKpis = () => {
            axios.get(API_ROUTES.PRESTAMOS)
                .then(res => {
                    const data = res.data
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    const comoFecha = (f) => f ? new Date(`${String(f).substring(0, 10)}T00:00:00`) : null

                    const activos = data.filter(p => p.estado === 'activo')
                    const vencidos = activos.filter(p => {
                        const f = comoFecha(p.fecha_devolucion)
                        return f && f < hoy
                    }).length
                    const porVencer = activos.filter(p => {
                        const f = comoFecha(p.fecha_devolucion)
                        if (!f) return false
                        const dias = Math.round((f - hoy) / 86400000)
                        return dias >= 0 && dias <= 3
                    }).length

                    setKpis({
                        activos: activos.length,
                        porVencer,
                        vencidos,
                        devueltos: data.filter(p => p.estado === 'devuelto').length
                    })
                })
                .catch(() => setKpis(null))
        }

        cargarKpis()
        const intervalo = setInterval(cargarKpis, 15000)
        return () => clearInterval(intervalo)
    }, [])

    return (
        <div>
            {/* ENCABEZADO */}
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Gestión de Préstamos
                </h2>
                <span className="badge bg-primary-subtle text-primary-emphasis">
                    Control de equipos asignados
                </span>
            </div>

            {/* TARJETAS RESUMEN */}
            {!kpis ? (
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
                                    <i className="bi bi-arrow-left-right"></i>
                                </div>
                                <div>
                                    <div className="fs-4 fw-bold">{kpis.activos}</div>
                                    <div className="text-secondary small">Préstamos activos</div>
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
                                    <div className="fs-4 fw-bold">{kpis.porVencer}</div>
                                    <div className="text-secondary small">Por vencer (3 días)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 col-6">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body d-flex align-items-center gap-3">
                                <div className="kpi-icon kpi-icon--rojo">
                                    <i className="bi bi-exclamation-triangle"></i>
                                </div>
                                <div>
                                    <div className="fs-4 fw-bold">{kpis.vencidos}</div>
                                    <div className="text-secondary small">Vencidos</div>
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
                                    <div className="fs-4 fw-bold">{kpis.devueltos}</div>
                                    <div className="text-secondary small">Devoluciones totales</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PESTANAS */}
            <ul className="nav nav-pills mb-4 gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'activos' ? 'active' : ''}`}
                        onClick={() => setVista('activos')}
                    >
                        <i className="bi bi-clock-history me-1"></i>
                        Préstamos Activos
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

            {/* CONTENIDO SEGUN PESTANA */}
            {vista === 'activos' ? <Prestamos /> : <HistorialPrestamos />}
        </div>
    )
}

export default GestionPrestamos
