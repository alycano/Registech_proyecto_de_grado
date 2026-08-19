import { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const HistorialPrestamos = () => {
    const [prestamos, setPrestamos] = useState([])
    const [filter, setFilter] = useState("")

    const handleFilterChange = (e) => {
        setFilter(e.target.value)
    }

    const buscarHistorial = () => {
        if (!filter) {
            Swal.fire({
                icon: 'error',
                title: 'Campo vacio',
                text: 'Ingresa el numero de serie del equipo'
            })
            return
        }

        axios.get(API_ROUTES.HISTORIAL_EQUIPO(filter))
            .then(response => {
                if (response.data.length === 0) {
                    setPrestamos([])
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin registros',
                        text: 'No se encontraron prestamos para este equipo'
                    })
                } else {
                    setPrestamos(response.data)
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al buscar el historial'
                })
            })
    }

    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'activo': return 'text-bg-success'
            case 'devuelto': return 'text-bg-secondary'
            default: return 'text-bg-light'
        }
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-clock-history"></i>
                        Historial de Prestamos
                    </h4>
                </div>

                <div className="d-flex justify-content-center mb-3">
                    <div className="input-group" style={{ maxWidth: '600px', width: '100%' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por numero de serie del equipo..."
                            value={filter}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') buscarHistorial() }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={buscarHistorial}
                        >
                            <i className="bi bi-filter"></i>
                            Buscar
                        </button>
                    </div>
                </div>

                {prestamos.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-inbox"></i>
                        <p className="mb-0">
                            Ingresa el numero de serie de un equipo para ver su historial de prestamos.
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead className="table-header">
                                <tr>
                                    <th>ID</th>
                                    <th>Num Serie</th>
                                    <th>Equipo</th>
                                    <th>Usuario Destino</th>
                                    <th>Fecha Prestamo</th>
                                    <th>Fecha Devolucion</th>
                                    <th>Estado</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prestamos.map(p => (
                                    <tr key={p.id_prestamo}>
                                        <td className="fw-semibold">{p.id_prestamo}</td>
                                        <td>{p.num_serie}</td>
                                        <td>{p.equipo || '-'}</td>
                                        <td>{p.usuario_destino}</td>
                                        <td>{p.fecha_prestamo?.slice(0, 10)}</td>
                                        <td>{p.fecha_devolucion?.slice(0, 10) || 'En curso'}</td>
                                        <td>
                                            <span className={`badge ${getEstadoClass(p.estado)}`}>
                                                {p.estado}
                                            </span>
                                        </td>
                                        <td>{p.observaciones || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistorialPrestamos
