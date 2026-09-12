import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import Paginador from "./ui/Paginador"

const Historiales = ({ usuario }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [filter, setFilter] = useState("")
    const [detalle, setDetalle] = useState(null)
    const [page, setPage] = useState(1)

    useEffect(() => {
        cargarHistorial()
    }, [])

    function cargarHistorial() {
        axios.get(API_ROUTES.HISTORIAL_MANTENIMIENTOS)
            .then(response => {
                setMantenimientos(
                    Array.isArray(response.data) ? response.data : []
                )
            })
            .catch(error => {
                console.error("Error al cargar historial:", error)

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar el historial de mantenimientos'
                })
            })
    }

    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilter(value)
        setPage(1)
    }

    const obtenerHistorial = () => {
        if (!filter.trim()) {
            cargarHistorial()
            return
        }

        axios.post(API_ROUTES.MANTENIMIENTOS_FIND, {
            filter: filter.trim()
        })
            .then(response => {
                if (response.data.length === 0) {
                    setMantenimientos([])
                    setPage(1)

                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin registros',
                        text: 'No existen reportes de mantenimientos'
                    })
                } else {
                    setMantenimientos(response.data)
                    setPage(1)
                }
            })
            .catch(err => {
                console.error("Error al buscar historial:", err)

                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar la solicitud',
                    text: 'Hubo un problema al enviar la solicitud, inténtalo nuevamente'
                })
            })
    }

    const ROWS = 10
    const totalPages = Math.max(
        1,
        Math.ceil(mantenimientos.length / ROWS)
    )

    const paginaActual = Math.min(page, totalPages)

    const mantenimientosPagina = mantenimientos.slice(
        (paginaActual - 1) * ROWS,
        paginaActual * ROWS
    )
const obtenerEstado = (mantenimiento) => {
    const solucion = mantenimiento.solucion || ''

    if (
        mantenimiento.fecha_solucion &&
        solucion.startsWith('No se puede reparar:')
    ) {
        return {
            texto: 'Equipo dado de baja',
            clase: 'text-bg-danger'
        }
    }

    if (mantenimiento.fecha_solucion) {
        return {
            texto: 'Completada',
            clase: 'text-bg-success'
        }
    }

    if (mantenimiento.estado_orden === 'aprobada') {
        return {
            texto: 'En reparación',
            clase: 'text-bg-primary'
        }
    }

    if (mantenimiento.estado_orden === 'pendiente') {
        return {
            texto: 'Pendiente de aprobación',
            clase: 'text-bg-warning'
        }
    }

    if (mantenimiento.estado_orden === 'rechazada') {
        return {
            texto: 'Rechazada',
            clase: 'text-bg-danger'
        }
    }

    return {
        texto: 'Sin estado',
        clase: 'text-bg-secondary'
    }
}

    return (
        <div className="card">
            <div className="card-body">

                {/* ENCABEZADO */}
                <div className="module-header mb-4">
                    <h4 className="module-title mb-0">
                        Historial de Mantenimientos
                    </h4>
                </div>

                {/* BUSCADOR */}
                <div className="d-flex justify-content-center mb-4">
                    <div
                        className="input-group"
                        style={{ maxWidth: '600px', width: '100%' }}
                    >
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por ID, número de serie o técnico"
                            value={filter}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    obtenerHistorial()
                                }
                            }}
                        />

                        <button
                            className="btn btn-primary"
                            onClick={obtenerHistorial}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* TABLA */}
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
                                    <th>Número de Serie</th>
                                    <th>Falla</th>
                                    <th>Solución</th>
                                    <th>Técnico</th>
                                    <th>Fecha Reporte</th>
                                    <th>Fecha Solución</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {mantenimientosPagina.map((equipo) => (
                                    <tr key={equipo.id_historial}>
                                        <td className="fw-semibold">
                                            {equipo.id_historial}
                                        </td>

                                        <td>
                                            {equipo.num_serie}
                                        </td>

                                        <td>
                                            {equipo.falla}
                                        </td>

                                        <td>
                                            {equipo.solucion || 'Pendiente'}
                                        </td>

                                        <td>
                                            {equipo.nombre_tecnico ||
                                                equipo.usuario_tecnico ||
                                                '-'}
                                        </td>

                                        <td>
                                            {equipo.fecha_reporte
                                                ? equipo.fecha_reporte.slice(0, 10)
                                                : '-'}
                                        </td>

                                        <td>
                                            {equipo.fecha_solucion
                                                ? equipo.fecha_solucion.slice(0, 10)
                                                : '-'}
                                        </td>

                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-primary btn-detalle-solid"
                                                onClick={() => setDetalle(equipo)}
                                            >
                                                <i className="bi bi-eye me-1"></i>
                                                Ver detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Paginador
                    page={paginaActual}
                    setPage={setPage}
                    totalItems={mantenimientos.length}
                    size={ROWS}
                />
            </div>

            {/* MODAL DETALLE */}
            {detalle && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.45)'
                    }}
                    onClick={() => setDetalle(null)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content border-0 shadow">

                            {/* CABECERA */}
                            <div className="modal-header px-4 py-3">
                                <div>
                                    <h5 className="modal-title fw-bold mb-1">
                                        Detalle del mantenimiento
                                    </h5>

                                    <small className="text-muted">
                                        Información completa de la orden
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setDetalle(null)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">

                                {/* ESTADO E ID */}
                                <div className="bg-light rounded p-3 mb-4">
                                    <div className="row align-items-center">

                                        <div className="col-md-8">
                                            <small className="text-muted d-block mb-1">
                                                ID de mantenimiento
                                            </small>

                                            <div className="fw-bold text-break">
                                                {detalle.id_historial}
                                            </div>
                                        </div>

                                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                            <small className="text-muted d-block mb-1">
                                                Estado
                                            </small>

                                            <span
                                                className={`badge ${obtenerEstado(detalle).clase}`}
                                            >
                                                {obtenerEstado(detalle).texto}
                                            </span>
                                        </div>

                                    </div>
                                </div>

                                {/* INFORMACIÓN DEL EQUIPO */}
                                <div className="mb-4">

                                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                                        <i className="bi bi-pc-display me-2"></i>
                                        Información del equipo
                                    </h6>

                                    <div className="row g-3">

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Número de serie
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.num_serie || '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Equipo
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.equipo || '-'}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* FALLA */}
                                <div className="mb-4">

                                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Reporte de la falla
                                    </h6>

                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block mb-2">
                                            Falla reportada
                                        </small>

                                        <div className="text-break">
                                            {detalle.falla || '-'}
                                        </div>
                                    </div>

                                </div>

                                {/* EVIDENCIA */}
                                {detalle.evidencia && (
                                    <div className="mb-4">

                                        <h6 className="fw-bold border-bottom pb-2 mb-3">
                                            <i className="bi bi-camera me-2"></i>
                                            Evidencia fotográfica
                                        </h6>

                                        <div className="text-center p-3 border rounded bg-light">
                                            <img
                                                src={API_ROUTES.ARCHIVO_EVIDENCIA(
                                                    detalle.evidencia
                                                )}
                                                alt="Evidencia del daño"
                                                className="img-fluid rounded border"
                                                style={{
                                                    maxHeight: '260px',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>

                                    </div>
                                )}

                                {/* RESOLUCIÓN */}
                                <div className="mb-4">

                                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                                        <i className="bi bi-tools me-2"></i>
                                        Resolución
                                    </h6>

                                    <div className="p-3 border rounded">
                                        <small className="text-muted d-block mb-2">
                                            Solución
                                        </small>

                                        <div className="text-break">
                                            {detalle.solucion ||
                                                'Aún sin resolver'}
                                        </div>
                                    </div>

                                </div>

                                {/* SEGUIMIENTO */}
                                <div>

                                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                                        <i className="bi bi-person-check me-2"></i>
                                        Seguimiento
                                    </h6>

                                    <div className="row g-3">

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Técnico responsable
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.nombre_tecnico ||
                                                        detalle.usuario_tecnico ||
                                                        '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Aprobada por
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.aprobada_por || '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Fecha de reporte
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.fecha_reporte
                                                        ? detalle.fecha_reporte.slice(0, 10)
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="p-3 border rounded h-100">
                                                <small className="text-muted d-block mb-1">
                                                    Fecha de solución
                                                </small>

                                                <div className="fw-semibold">
                                                    {detalle.fecha_solucion
                                                        ? detalle.fecha_solucion.slice(0, 10)
                                                        : '-'}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* PIE */}
                            <div className="modal-footer px-4 py-3">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setDetalle(null)}
                                >
                                    Cerrar
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Historiales