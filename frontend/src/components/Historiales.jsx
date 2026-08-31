import { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Historiales = ({ usuario }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [filter, setFilter] = useState("")
    const [detalle, setDetalle] = useState(null)

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO FILTRO
    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilter(value)
    }

    // FUNCION PARA SOLICITAR EL HISTORIAL
    const obtenerHistorial = () => {
        // VALIDAR QUE NO ESTE VACIO EL CAMPO DE FILTRO
        if (!filter) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor introduce el id del historial, el numero de serie o el tecnico'
            })
            return
        }

        // ENVIAMOS LA SOLICITUD AL BACKEND
        axios.post(API_ROUTES.MANTENIMIENTOS_FIND, { filter })
            .then(response => {
                if (response.data.length === 0) {
                    setMantenimientos([])
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin registros',
                        text: 'No existen reportes de mantenimientos'
                    })
                } else {
                    setMantenimientos(response.data)
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar la solicitud',
                    text: 'Hubo un problema al enviar la solicitud, intentalo nuevamente'
                })
            })
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        Historial de Mantenimientos
                    </h4>
                </div>

                {/* CONTENEDOR ADICIONAL PARA CENTAR EL INPUT Y LOS BOTONES */}
                <div className="d-flex justify-content-center mb-3">
                    <div className="input-group" style={{ maxWidth: '600px', width: '100%' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por id mantenimiento, numero de serie o tecnico"
                            value={filter}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') obtenerHistorial() }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={obtenerHistorial}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {mantenimientos.length === 0 ? (
                    <div className="empty-state">
                        <p className="text-muted my-3">
                            Aún no hay resultados. Usa el buscador para consultar el historial.
                        </p>
                    </div>
                ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr className="text-center">
                                <th>ID Mantenimiento</th>
                                <th>Numero Serie</th>
                                <th>Falla</th>
                                <th>Solucion</th>
                                <th>Tecnico</th>
                                <th>Fecha Reporte</th>
                                <th>Fecha Solucion</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mantenimientos.map((equipo) => (
                                <tr key={equipo.id_historial}>
                                    <td className="fw-semibold">{equipo.id_historial}</td>
                                    <td>{equipo.num_serie}</td>
                                    <td>{equipo.falla}</td>
                                    <td>{equipo.solucion || 'Pendiente'}</td>
                                    <td>{equipo.usuario_tecnico || '-'}</td>
                                    <td>{equipo.fecha_reporte ? equipo.fecha_reporte.slice(0, 10) : '-'}</td>
                                    <td>{equipo.fecha_solucion ? equipo.fecha_solucion.slice(0, 10) : '-'}</td>
                                    <td className="text-center">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setDetalle(equipo)}
                                        >
                                            <i className="bi bi-eye me-1"></i>Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* MODAL VER DETALLES */}
            {detalle && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Detalle del Mantenimiento
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setDetalle(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">ID Mantenimiento</small>
                                            <div className="fw-semibold">{detalle.id_historial}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Número de serie</small>
                                            <div className="fw-semibold">{detalle.num_serie}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Estado</small>
                                            <div>
                                                {detalle.estado_orden === 'pendiente' && <span className="badge text-bg-warning">Pendiente de aprobación</span>}
                                                {detalle.estado_orden === 'aprobada' && !detalle.fecha_solucion && <span className="badge text-bg-primary">En reparación</span>}
                                                {detalle.estado_orden === 'rechazada' && <span className="badge text-bg-danger">Rechazada</span>}
                                                {detalle.fecha_solucion && <span className="badge text-bg-success">Completada</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Equipo</small>
                                            <div>{detalle.equipo || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {detalle.evidencia && (
                                    <div className="text-center mb-3">
                                        <small className="text-secondary fw-semibold d-block mb-1">Evidencia fotográfica</small>
                                        <img
                                            src={API_ROUTES.ARCHIVO_EVIDENCIA(detalle.evidencia)}
                                            alt="Evidencia del daño"
                                            className="img-fluid rounded border"
                                            style={{ maxHeight: '220px' }}
                                        />
                                    </div>
                                )}

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Falla reportada</small>
                                            <div className="text-break">{detalle.falla || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Solución</small>
                                            <div className="text-break">{detalle.solucion || 'Aún sin resolver'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Técnico responsable</small>
                                            <div>{detalle.usuario_tecnico || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Aprobada por</small>
                                            <div>{detalle.aprobada_por || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Fecha de reporte</small>
                                            <div>{detalle.fecha_reporte ? detalle.fecha_reporte.slice(0, 10) : '-'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <small className="text-secondary fw-semibold">Fecha de solución</small>
                                            <div>{detalle.fecha_solucion ? detalle.fecha_solucion.slice(0, 10) : '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Historiales
