import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js"
import { Bar } from "react-chartjs-2"
import { API_ROUTES } from "../api/apiRoutes"
import { formatearDinero, hoy, primerDiaMes } from "../utils/format"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const Finanzas = () => {
    const [resumen, setResumen] = useState(null)
    const [loading, setLoading] = useState(true)

    const [inicio, setInicio] = useState(primerDiaMes())
    const [fin, setFin] = useState(hoy())

    const cargarResumen = () => {
        setLoading(true)
        axios.get(API_ROUTES.OBTENER_FINANZAS, {
            params: { inicio, fin }
        })
        .then(response => {
            setResumen(response.data)
            setLoading(false)
        })
        .catch(err => {
            setLoading(false)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data || 'No se pudieron obtener los datos financieros'
            })
        })
    }

    useEffect(() => {
        cargarResumen()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const dias = (resumen?.ventas_por_dia || []).map(d => {
        const partes = d.fecha_venta.split('T')[0].split('-')
        return `${partes[2]}/${partes[1]}`
    })

    const totales = (resumen?.ventas_por_dia || []).map(d => Number(d.total))

    const datosGrafico = {
        labels: dias,
        datasets: [{
            label: 'Ventas por dia',
            data: totales,
            backgroundColor: 'rgba(2, 132, 199, 0.75)',
            borderRadius: 6
        }]
    }

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                ticks: {
                    callback: (valor) => '$' + Number(valor).toLocaleString('es-CO')
                }
            }
        }
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-graph-up"></i>
                        Finanzas
                    </h4>
                </div>

                {/* FILTRO POR FECHAS */}
                <div className="d-flex flex-wrap gap-2 align-items-end mb-4">
                    <div>
                        <label className="form-label mb-1 small fw-semibold">Desde</label>
                        <input
                            type="date"
                            className="form-control"
                            value={inicio}
                            onChange={(e) => setInicio(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1 small fw-semibold">Hasta</label>
                        <input
                            type="date"
                            className="form-control"
                            value={fin}
                            onChange={(e) => setFin(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline-primary" onClick={cargarResumen}>
                        <i className="bi bi-funnel"></i>
                        Filtrar
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5 text-secondary">
                        <div className="spinner-border text-primary mb-2" role="status"></div>
                        <div>Cargando informacion financiera...</div>
                    </div>
                ) : (
                <>
                    {/* TARJETAS DE RESUMEN */}
                    <div className="row g-3 mb-4">
                        <div className="col-sm-6 col-lg-3">
                            <div className="card stat-card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="stat-icon">
                                            <i className="bi bi-cash-stack"></i>
                                        </div>
                                        <div>
                                            <div className="small text-secondary">Total Ventas</div>
                                            <div className="fs-5 fw-bold">{formatearDinero(resumen?.total_ventas)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card stat-card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="stat-icon">
                                            <i className="bi bi-receipt"></i>
                                        </div>
                                        <div>
                                            <div className="small text-secondary">Numero de Ventas</div>
                                            <div className="fs-5 fw-bold">{resumen?.cantidad_ventas ?? 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card stat-card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="stat-icon">
                                            <i className="bi bi-percent"></i>
                                        </div>
                                        <div>
                                            <div className="small text-secondary">Ticket Promedio</div>
                                            <div className="fs-5 fw-bold">{formatearDinero(resumen?.ticket_promedio)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card stat-card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="stat-icon">
                                            <i className="bi bi-trophy"></i>
                                        </div>
                                        <div>
                                            <div className="small text-secondary">Mejor Vendedor</div>
                                            <div className="fs-5 fw-bold">
                                                {resumen?.mejor_vendedor ? resumen.mejor_vendedor.vendedor : 'Sin datos'}
                                            </div>
                                            {resumen?.mejor_vendedor && (
                                                <div className="small text-success">
                                                    {formatearDinero(resumen.mejor_vendedor.total)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRAFICO DE VENTAS */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-bar-chart me-1"></i>
                                Ventas por dia
                            </h6>
                            {dias.length === 0 ? (
                                <div className="text-center py-4 text-secondary">
                                    No hay ventas en este rango de fechas
                                </div>
                            ) : (
                                <div style={{ height: '300px' }}>
                                    <Bar data={datosGrafico} options={opcionesGrafico} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TABLA DE VENTAS POR DIA */}
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead className="table-header">
                                <tr>
                                    <th>Fecha</th>
                                    <th>Ventas</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(resumen?.ventas_por_dia || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4 text-secondary">
                                            Sin registros de ventas en el periodo
                                        </td>
                                    </tr>
                                ) : (
                                    resumen.ventas_por_dia.map(d => (
                                        <tr key={d.fecha_venta}>
                                            <td>{d.fecha_venta.split('T')[0]}</td>
                                            <td>{d.cantidad}</td>
                                            <td className="text-end fw-semibold">{formatearDinero(d.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
                )}
            </div>
        </div>
    )
}

export default Finanzas
