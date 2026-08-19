import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Prestamos = () => {
    const [prestamos, setPrestamos] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalNuevo, setModalNuevo] = useState(false)
    const [equipos, setEquipos] = useState([])
    const [usuarios, setUsuarios] = useState([])

    const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
    const [usuarioDestino, setUsuarioDestino] = useState('')
    const [observaciones, setObservaciones] = useState('')

    useEffect(() => {
        cargarPrestamos()
    }, [])

    const cargarPrestamos = () => {
        setLoading(true)
        axios.get(API_ROUTES.PRESTAMOS_ACTIVOS)
            .then(response => {
                setPrestamos(response.data)
                setLoading(false)
            })
            .catch(err => {
                setLoading(false)
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron obtener los prestamos'
                })
            })
    }

    const abrirModalNuevo = () => {
        Promise.all([
            axios.get(API_ROUTES.EQUIPOS),
            axios.get(API_ROUTES.OBTENER_USUARIOS)
        ])
            .then(([resEquipos, resUsuarios]) => {
                setEquipos(resEquipos.data.filter(e => e.estado === 'Disponible'))
                setUsuarios(resUsuarios.data.filter(u => u.estado === 'activo'))
                setEquipoSeleccionado('')
                setUsuarioDestino('')
                setObservaciones('')
                setModalNuevo(true)
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos'
                })
            })
    }

    const crearPrestamo = () => {
        if (!equipoSeleccionado || !usuarioDestino) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Selecciona un equipo y un usuario destino'
            })
            return
        }

        axios.post(API_ROUTES.CREAR_PRESTAMO, {
            num_serie: equipoSeleccionado,
            usuario_destino: usuarioDestino,
            observaciones
        })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Prestamo registrado',
                    timer: 2000,
                    showConfirmButton: false
                })
                setModalNuevo(false)
                cargarPrestamos()
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear prestamo',
                    text: err.response?.data?.error || 'Hubo un error'
                })
            })
    }

    const devolverPrestamo = (id) => {
        Swal.fire({
            icon: 'question',
            title: 'Confirmar devolucion',
            text: 'El equipo sera devuelto y quedara disponible',
            showCancelButton: true,
            confirmButtonText: 'Si, devolver',
            cancelButtonText: 'Cancelar'
        })
            .then((result) => {
                if (result.isConfirmed) {
                    axios.put(API_ROUTES.DEVOLVER_PRESTAMO(id))
                        .then(() => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Equipo devuelto',
                                timer: 2000,
                                showConfirmButton: false
                            })
                            cargarPrestamos()
                        })
                        .catch(err => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al devolver',
                                text: err.response?.data?.error || 'Hubo un error'
                            })
                        })
                }
            })
    }

    const getDiasTranscurridos = (fecha) => {
        const hoy = new Date()
        const inicio = new Date(fecha)
        const diff = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24))
        return diff
    }

    const getDiasClass = (dias) => {
        if (dias > 30) return 'text-danger fw-bold'
        if (dias > 15) return 'text-warning'
        return 'text-success'
    }

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando prestamos...</div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-arrow-left-right"></i>
                        Prestamos Activos
                    </h4>
                    <div className="d-flex gap-2 align-items-center">
                        <span className="badge text-bg-success">{prestamos.length} activos</span>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={abrirModalNuevo}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Nuevo Prestamo
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>Num Serie</th>
                                <th>Equipo</th>
                                <th>Usuario Destino</th>
                                <th>Fecha Prestamo</th>
                                <th>Dias</th>
                                <th>Observaciones</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prestamos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-secondary">
                                        No hay prestamos activos
                                    </td>
                                </tr>
                            ) : (
                                prestamos.map(p => {
                                    const dias = getDiasTranscurridos(p.fecha_prestamo)
                                    return (
                                        <tr key={p.id_prestamo}>
                                            <td className="fw-semibold">{p.num_serie}</td>
                                            <td>{p.equipo || '-'}</td>
                                            <td>{p.usuario_destino}</td>
                                            <td>{p.fecha_prestamo?.slice(0, 10)}</td>
                                            <td>
                                                <span className={getDiasClass(dias)}>
                                                    {dias} dias
                                                </span>
                                            </td>
                                            <td>{p.observaciones || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => devolverPrestamo(p.id_prestamo)}
                                                >
                                                    <i className="bi bi-arrow-return-left"></i>
                                                    Devolver
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MODAL NUEVO PRESTAMO */}
                {modalNuevo && (
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ display: 'block', zIndex: '1050' }}
                        onClick={() => setModalNuevo(false)}
                    >
                        <div
                            className="modal-dialog modal-dialog-centered"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus-circle me-1"></i>
                                        Nuevo Prestamo
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setModalNuevo(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Equipo (solo disponibles)</label>
                                        <select
                                            className="form-select"
                                            value={equipoSeleccionado}
                                            onChange={(e) => setEquipoSeleccionado(e.target.value)}
                                        >
                                            <option value="">Seleccionar equipo...</option>
                                            {equipos.map(e => (
                                                <option key={e.num_serie} value={e.num_serie}>
                                                    {e.num_serie} - {e.equipo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Usuario Destino</label>
                                        <select
                                            className="form-select"
                                            value={usuarioDestino}
                                            onChange={(e) => setUsuarioDestino(e.target.value)}
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {usuarios.map(u => (
                                                <option key={u.usuario} value={u.usuario}>
                                                    {u.nombre} ({u.usuario})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Observaciones</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            placeholder="Opcional..."
                                        ></textarea>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            className="btn btn-primary"
                                            onClick={crearPrestamo}
                                        >
                                            <i className="bi bi-check-lg"></i>
                                            Registrar Prestamo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Prestamos
