import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ROUTES } from '../api/apiRoutes'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'

const PMC = () => {
    const { usuario } = useAuth()
    const esAdmin = usuario?.rol === 'admin'

    const [pmcs, setPmcs] = useState([])
    const [loading, setLoading] = useState(true)

    const [vista, setVista] = useState('productos')

    const [modalCrear, setModalCrear] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevaDescripcion, setNuevaDescripcion] = useState('')
    const [nuevaCantidad, setNuevaCantidad] = useState('')
    const [guardando, setGuardando] = useState(false)

    const [modalSolicitar, setModalSolicitar] = useState(false)
    const [solicitarProducto, setSolicitarProducto] = useState(null)
    const [cantidadSolicitud, setCantidadSolicitud] = useState('')
    const [justificacionSolicitud, setJustificacionSolicitud] = useState('')
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)

    const [solicitudes, setSolicitudes] = useState([])

    const fetchPMCs = async () => {
        try {
            const response = await axios.get(API_ROUTES.PMC)
            setPmcs(response.data)
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Error al obtener inventario PMC'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSolicitudes = async () => {
        try {
            const url = esAdmin
                ? API_ROUTES.SOLICITUDES
                : API_ROUTES.MIS_SOLICITUDES
            const response = await axios.get(url)
            setSolicitudes(response.data)
        } catch {
            setSolicitudes([])
        }
    }

    useEffect(() => {
        fetchPMCs()
        fetchSolicitudes()
    }, [])

    const abrirModalCrear = () => {
        setNuevoNombre('')
        setNuevaDescripcion('')
        setNuevaCantidad('')
        setModalCrear(true)
    }

    const abrirModalSolicitar = (pmc) => {
        setSolicitarProducto(pmc)
        setCantidadSolicitud('')
        setJustificacionSolicitud('')
        setModalSolicitar(true)
    }

    const guardarConsumible = (e) => {
        e.preventDefault()

        const cantidad = parseInt(nuevaCantidad, 10)
        if (!nuevoNombre.trim()) {
            Swal.fire({ icon: 'warning', title: 'Falta el nombre', text: 'El nombre del consumible es obligatorio' })
            return
        }
        if (!cantidad || cantidad < 1) {
            Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'La cantidad total debe ser mayor a 0' })
            return
        }

        setGuardando(true)
        axios.post(API_ROUTES.PMC, {
            nombre: nuevoNombre.trim(),
            descripcion: nuevaDescripcion.trim() || null,
            cantidad_total: cantidad
        })
            .then(() => {
                setModalCrear(false)
                Swal.fire({ icon: 'success', title: '¡Creado!', text: 'El consumible ha sido registrado.', timer: 2000, showConfirmButton: false })
                fetchPMCs()
            })
            .catch(error => {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo crear', 'error')
            })
            .finally(() => setGuardando(false))
    }

    const enviarSolicitud = (e) => {
        e.preventDefault()

        const cantidad = parseInt(cantidadSolicitud, 10)
        if (!solicitarProducto) return
        if (!cantidad || cantidad < 1) {
            Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'Indica cuántas unidades necesitas' })
            return
        }

        setEnviandoSolicitud(true)
        axios.post(API_ROUTES.SOLICITUDES, {
            tipo_equipo: solicitarProducto.nombre,
            descripcion: `Solicitud de ${cantidad} unidad(es) de ${solicitarProducto.nombre}`,
            justificacion: justificacionSolicitud.trim() || null
        })
            .then(() => {
                setModalSolicitar(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud enviada',
                    text: 'Queda pendiente de aprobación por el administrador.',
                    timer: 2500,
                    showConfirmButton: false
                })
                fetchSolicitudes()
            })
            .catch(error => {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo enviar la solicitud', 'error')
            })
            .finally(() => setEnviandoSolicitud(false))
    }

    const responderSolicitud = async (id, estado) => {
        const accion = estado === 'aprobada' ? 'aprobar' : 'rechazar'
        const conf = await Swal.fire({
            title: `¿${accion} la solicitud?`,
            text: estado === 'aprobada'
                ? 'Se notificará al solicitante y se descontará del stock al entregar.'
                : 'La solicitud quedará marcada como rechazada.',
            icon: estado === 'aprobada' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: estado === 'aprobada' ? '#198754' : '#dc3545'
        })
        if (!conf.isConfirmed) return

        try {
            await axios.put(API_ROUTES.RESPONDER_SOLICITUD(id), { estado })
            Swal.fire({
                icon: 'success',
                title: estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada',
                timer: 2000,
                showConfirmButton: false
            })
            fetchSolicitudes()
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo procesar', 'error')
        }
    }

    const handleEntregar = async (id) => {
        try {
            await axios.post(API_ROUTES.PMC_ENTREGAR(id))
            fetchPMCs()
            Swal.fire({
                icon: 'success',
                title: 'Entregado',
                text: 'Se ha restado 1 unidad del stock disponible',
                timer: 2000,
                showConfirmButton: false
            })
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al entregar', 'error')
        }
    }

    const handleDevolver = async (id) => {
        try {
            await axios.post(API_ROUTES.PMC_DEVOLVER(id))
            fetchPMCs()
            Swal.fire({
                icon: 'success',
                title: 'Devuelto',
                text: 'Se ha sumado 1 unidad al stock disponible',
                timer: 2000,
                showConfirmButton: false
            })
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al devolver', 'error')
        }
    }

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_ROUTES.PMC}/${id}`)
                Swal.fire('Eliminado', 'El consumible ha sido eliminado.', 'success')
                fetchPMCs()
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar', 'error')
            }
        }
    }

    if (loading) return <div className="text-center mt-5">Cargando inventario PMC...</div>

    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente')

    return (
        <div>
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Inventario Menor (PMC)
                </h2>
                {esAdmin ? (
                    <button className="btn btn-primary" onClick={abrirModalCrear}>
                        <i className="bi bi-plus-circle me-2"></i>Registrar PMC
                    </button>
                ) : (
                    <span className="badge bg-secondary-subtle text-secondary-emphasis">
                        <i className="bi bi-cart me-1"></i>Solicita al administrador
                    </span>
                )}
            </div>

            <ul className="nav nav-pills mb-4 gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'productos' ? 'active' : ''}`}
                        onClick={() => setVista('productos')}
                    >
                        <i className="bi bi-box-seam me-1"></i>Productos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'solicitudes' ? 'active' : ''}`}
                        onClick={() => setVista('solicitudes')}
                    >
                        <i className="bi bi-clipboard-check me-1"></i>
                        Solicitudes
                        {solicitudesPendientes.length > 0 && (
                            <span className="badge text-bg-danger ms-2">{solicitudesPendientes.length}</span>
                        )}
                    </button>
                </li>
            </ul>

            {vista === 'productos' ? (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th className="text-center">Stock Total</th>
                                <th className="text-center">Stock Disponible</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pmcs.map(pmc => (
                                <tr key={pmc.id}>
                                    <td>{pmc.id}</td>
                                    <td>{pmc.nombre}</td>
                                    <td>{pmc.descripcion || 'N/A'}</td>
                                    <td className="text-center">{pmc.cantidad_total}</td>
                                    <td className="text-center text-success fw-bold">{pmc.cantidad_disponible}</td>
                                    <td className="text-center">
                                        {esAdmin ? (
                                            <div className="d-flex gap-2 justify-content-center">
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleEntregar(pmc.id)}
                                                    title="Entregar 1 unidad (-1)"
                                                    disabled={pmc.cantidad_disponible <= 0}
                                                >
                                                    <i className="bi bi-box-arrow-right me-1"></i>Entregar (-1)
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleDevolver(pmc.id)}
                                                    title="Devolver 1 unidad (+1)"
                                                    disabled={pmc.cantidad_disponible >= pmc.cantidad_total}
                                                >
                                                    <i className="bi bi-arrow-return-left me-1"></i>Devolver (+1)
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleEliminar(pmc.id)}
                                                    title="Eliminar registro"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => abrirModalSolicitar(pmc)}
                                                title="Solicitar al administrador"
                                            >
                                                <i className="bi bi-cart-plus me-1"></i>Solicitar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pmcs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No hay productos de menor cuantía registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>ID</th>
                                <th>Solicitante</th>
                                <th>Detalle / Producto</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                {esAdmin && <th className="text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.map(s => (
                                <tr key={s.id}>
                                    <td>{s.id}</td>
                                    <td>{s.usuario}</td>
                                    <td>{s.detalles || '—'}</td>
                                    <td>—</td>
                                    <td>
                                        {s.creado_en ? new Date(s.creado_en).toLocaleDateString('es-CO') : '—'}
                                    </td>
                                    <td>
                                        {s.estado === 'pendiente' ? (
                                            <span className="badge text-bg-warning">Pendiente</span>
                                        ) : s.estado === 'aprobada' ? (
                                            <span className="badge text-bg-success">Aprobada</span>
                                        ) : (
                                            <span className="badge text-bg-danger">Rechazada</span>
                                        )}
                                    </td>
                                    {esAdmin && (
                                        <td className="text-center">
                                            {s.estado === 'pendiente' ? (
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => responderSolicitud(s.id, 'aprobada')}
                                                    >
                                                        <i className="bi bi-check-lg me-1"></i>Aprobar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => responderSolicitud(s.id, 'rechazada')}
                                                    >
                                                        <i className="bi bi-x-lg me-1"></i>Rechazar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted small">Procesada</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {solicitudes.length === 0 && (
                                <tr>
                                    <td colSpan={esAdmin ? 6 : 5} className="text-center text-muted py-4">
                                        No hay solicitudes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL REGISTRAR CONSUMIBLE (ADMIN) */}
            {modalCrear && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !guardando && setModalCrear(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Registrar Nuevo Consumible (PMC)
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !guardando && setModalCrear(false)}
                                    disabled={guardando}
                                ></button>
                            </div>

                            <form onSubmit={guardarConsumible}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej: Mouse"
                                            value={nuevoNombre}
                                            onChange={(e) => setNuevoNombre(e.target.value)}
                                            disabled={guardando}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Descripción</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={nuevaDescripcion}
                                            onChange={(e) => setNuevaDescripcion(e.target.value)}
                                            disabled={guardando}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Cantidad Total</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 10"
                                            value={nuevaCantidad}
                                            onChange={(e) => setNuevaCantidad(e.target.value)}
                                            disabled={guardando}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalCrear(false)} disabled={guardando}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                                        {guardando ? 'Guardando...' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SOLICITAR PRODUCTO (INVENTARIO) */}
            {modalSolicitar && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !enviandoSolicitud && setModalSolicitar(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Solicitar {solicitarProducto?.nombre}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalSolicitar(false)}
                                    disabled={enviandoSolicitud}
                                ></button>
                            </div>

                            <form onSubmit={enviarSolicitud}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Cantidad solicitada
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 2"
                                            value={cantidadSolicitud}
                                            onChange={(e) => setCantidadSolicitud(e.target.value)}
                                            disabled={enviandoSolicitud}
                                            required
                                        />
                                        <small className="text-muted">
                                            Disponible: {solicitarProducto?.cantidad_disponible}
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Justificación
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Motivo de la solicitud..."
                                            value={justificacionSolicitud}
                                            onChange={(e) => setJustificacionSolicitud(e.target.value)}
                                            disabled={enviandoSolicitud}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setModalSolicitar(false)}
                                        disabled={enviandoSolicitud}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={enviandoSolicitud}>
                                        {enviandoSolicitud ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-send me-1"></i>Enviar Solicitud
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PMC
