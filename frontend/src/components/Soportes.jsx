import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Soportes = ({ usuario, esAdmin }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [equipos, setEquipos] = useState([])
    const [loading, setLoading] = useState(true)

    const [modalNuevo, setModalNuevo] = useState(false)
    const [equipoReportado, setEquipoReportado] = useState("")
    const [descripcionDano, setDescripcionDano] = useState("")
    const [fotoDano, setFotoDano] = useState(null)
    const [previewFoto, setPreviewFoto] = useState(null)
    const [enviandoReporte, setEnviandoReporte] = useState(false)

    const [modalVisible, setModalVisible] = useState(false)
    const [selectedFalla, setSelectedFalla] = useState("")
    const [selectedNumSerie, setSelectedNumSerie] = useState("")
    const [selectedIdHistorial, setSelectedIdHistorial] = useState("")
    const [selectedEvidencia, setSelectedEvidencia] = useState("")
    const [solucion, setSolucion] = useState("")

    const [fotoAmpliada, setFotoAmpliada] = useState(null)

    // Modal de detalles de la orden (solo lectura para el admin)
    const [ordenDetalle, setOrdenDetalle] = useState(null)

    const cargarMantenimientos = () => {
        return axios.get(API_ROUTES.OBTENER_MANTENIMIENTOS)
            .then(response => setMantenimientos(response.data))
            .catch(() => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron obtener las órdenes de trabajo',
                    confirmButtonText: 'Ok'
                })
            })
    }

    useEffect(() => {
        Promise.all([
            cargarMantenimientos(),
            axios.get(API_ROUTES.EQUIPOS).then(response => setEquipos(response.data)).catch(() => {})
        ]).finally(() => setLoading(false))
    }, [])

    // ABRIR / CERRAR MODAL DE REGISTRO DE DANO CON FOTO
    const abrirModalNuevo = () => {
        setEquipoReportado("")
        setDescripcionDano("")
        setFotoDano(null)
        setPreviewFoto(null)
        setModalNuevo(true)
    }

    const handleSeleccionarFoto = (e) => {
        const archivo = e.target.files[0]
        if (!archivo) return

        if (!archivo.type.startsWith('image/')) {
            Swal.fire({ icon: 'warning', title: 'Archivo inválido', text: 'Debes seleccionar una imagen (jpg, png, webp)' })
            e.target.value = ''
            return
        }
        if (archivo.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'Imagen muy pesada', text: 'La foto no debe superar los 5 MB' })
            e.target.value = ''
            return
        }

        setFotoDano(archivo)
        setPreviewFoto(URL.createObjectURL(archivo))
    }

    // REGISTRAR EL DANO CON LA FOTO (MULTIPART)
    const guardarReporteDano = (e) => {
        e.preventDefault()

        if (!equipoReportado) {
            Swal.fire({ icon: 'warning', title: 'Falta el equipo', text: 'Selecciona el equipo dañado' })
            return
        }
        if (!descripcionDano.trim()) {
            Swal.fire({ icon: 'warning', title: 'Falta el diagnóstico', text: 'Describe el daño detectado' })
            return
        }
        if (!fotoDano) {
            Swal.fire({ icon: 'warning', title: 'Falta la evidencia', text: 'Debes adjuntar la fotografía del daño' })
            return
        }

        setEnviandoReporte(true)

        const formData = new FormData()
        formData.append('num_serie', equipoReportado)
        formData.append('falla', descripcionDano.trim())
        formData.append('foto', fotoDano)

        axios.post(API_ROUTES.REPORTE_FALLA, formData)
            .then(() => {
                setModalNuevo(false)
                URL.revokeObjectURL(previewFoto)
                setPreviewFoto(null)
                setFotoDano(null)
                Swal.fire({
                    icon: 'success',
                    title: 'Orden registrada',
                    text: 'El administrador recibirá la notificación para aprobarla',
                    timer: 2500,
                    showConfirmButton: false
                })
                cargarMantenimientos()
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al registrar',
                    text: err.response?.data?.error || 'No se pudo registrar el daño'
                })
            })
            .finally(() => setEnviandoReporte(false))
    }

    // ABRIR / CERRAR MODAL DE SOLUCION
    const handleOpenModal = (falla, idHistorial, num_serie, evidencia) => {
        setSelectedFalla(falla)
        setSelectedIdHistorial(idHistorial)
        setSelectedNumSerie(num_serie)
        setSelectedEvidencia(evidencia || "")
        setSolucion("")
        setModalVisible(true)
    }

    const handleCloseModal = () => {
        setModalVisible(false)
        setSolucion("")
    }

    const registrarSolucion = (e) => {
        e.preventDefault()

        if (!solucion.trim()) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Por favor, ingresa la solucion', confirmButtonText: 'Ok' })
            return
        }
        if (!selectedNumSerie || !selectedIdHistorial || !usuario) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Faltan datos requeridos', confirmButtonText: 'Ok' })
            return
        }

        axios.post(API_ROUTES.ACTUALIZAR_MANTENIMIENTOS, {
            num_serie: selectedNumSerie,
            id_historial: selectedIdHistorial,
            tecnico: usuario,
            solucion: solucion
        })
            .then((response) => {
                handleCloseModal()
                Swal.fire({ icon: 'success', title: 'Exito', text: response.data?.mensaje || response.data, confirmButtonText: 'Ok' })
                cargarMantenimientos()
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.error || 'No se pudo registrar la solución'
                })
            })
    }

    const getBadgeOrden = (estado) => {
        switch (estado) {
            case 'pendiente': return <span className="badge text-bg-warning">Pendiente de aprobación</span>
            case 'aprobada': return <span className="badge text-bg-success">Aprobada - En reparación</span>
            case 'rechazada': return <span className="badge text-bg-danger">Rechazada</span>
            default: return <span className="badge text-bg-secondary">{estado}</span>
        }
    }

    const pendientesAprobacion = mantenimientos.filter(m => m.estado_orden === 'pendiente').length
    const enReparacion = mantenimientos.filter(m => m.estado_orden === 'aprobada').length

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        Bandeja de Órdenes de Mantenimiento
                    </h4>
                    <div className="d-flex gap-2 align-items-center">
                        {pendientesAprobacion > 0 && (
                            <span className="badge text-bg-warning">{pendientesAprobacion} por aprobar</span>
                        )}
                        <span className="badge text-bg-primary">{enReparacion} en reparación</span>
                        {!esAdmin && (
                            <button className="btn btn-sm btn-primary" onClick={abrirModalNuevo}>
                                + Registrar Daño
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5 text-secondary">
                        <div className="spinner-border text-primary mb-2" role="status"></div>
                        <div>Cargando ordenes...</div>
                    </div>
                ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>ID Orden</th>
                                <th>Numero de Serie</th>
                                <th>Fecha</th>
                                <th>Diagnostico</th>
                                <th>Evidencia</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mantenimientos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-secondary">
                                        No hay ordenes de trabajo
                                    </td>
                                </tr>
                            ) : (
                                mantenimientos.map(m => (
                                    <tr key={m.id_historial}>
                                        <td className="fw-semibold">{m.id_historial}</td>
                                        <td>{m.num_serie}</td>
                                        <td>{new Date(m.fecha_reporte).toLocaleDateString('es-CO')}</td>
                                        <td style={{ maxWidth: '220px' }}>{m.falla}</td>
                                        <td>
                                            {m.evidencia ? (
                                                <img
                                                    src={API_ROUTES.ARCHIVO_EVIDENCIA(m.evidencia)}
                                                    alt="Evidencia del daño"
                                                    className="rounded border"
                                                    style={{ width: '56px', height: '42px', objectFit: 'cover', cursor: 'zoom-in' }}
                                                    onClick={() => setFotoAmpliada(m.evidencia)}
                                                />
                                            ) : (
                                                <span className="text-muted small">Sin foto</span>
                                            )}
                                        </td>
                                        <td>{getBadgeOrden(m.estado_orden)}</td>
                                        <td>
                                            {esAdmin ? (
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setOrdenDetalle(m)}
                                                >
                                                    <i className="bi bi-eye me-1"></i>
                                                    Detalles
                                                </button>
                                            ) : m.estado_orden === 'aprobada' ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleOpenModal(m.falla, m.id_historial, m.num_serie, m.evidencia)}
                                                >
                                                    Reparado
                                                </button>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-secondary" disabled title="Esperando aprobación del administrador">
                                                    Esperando
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* MODAL REGISTRAR DANO CON EVIDENCIA */}
                {modalNuevo && (
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => !enviandoReporte && setModalNuevo(false)}
                    >
                        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">
                                        Registrar Daño con Evidencia
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setModalNuevo(false)} disabled={enviandoReporte}></button>
                                </div>

                                <form onSubmit={guardarReporteDano}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Equipo dañado</label>
                                            <select
                                                className="form-select"
                                                value={equipoReportado}
                                                onChange={(e) => setEquipoReportado(e.target.value)}
                                                disabled={enviandoReporte}
                                                required
                                            >
                                                <option value="">Selecciona un equipo...</option>
                                                {equipos.map(eq => (
                                                    <option key={eq.num_serie} value={eq.num_serie}>
                                                        {eq.num_serie} — {eq.equipo || 'Equipo'} ({eq.estado})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Diagnóstico del daño</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                placeholder="Describe el fallo que presenta el equipo..."
                                                value={descripcionDano}
                                                onChange={(e) => setDescripcionDano(e.target.value)}
                                                disabled={enviandoReporte}
                                                maxLength="500"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Fotografía del daño <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="file"
                                                className={`form-control ${fotoDano ? 'is-valid' : ''}`}
                                                accept="image/*"
                                                onChange={handleSeleccionarFoto}
                                                disabled={enviandoReporte}
                                                required
                                            />
                                            <small className="text-muted">JPG, PNG o WEBP. Máximo 5 MB.</small>
                                        </div>

                                        {previewFoto && (
                                            <div className="text-center mt-3">
                                                <img
                                                    src={previewFoto}
                                                    alt="Vista previa del daño"
                                                    className="img-thumbnail"
                                                    style={{ maxHeight: '200px' }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setModalNuevo(false)} disabled={enviandoReporte}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={enviandoReporte}>
                                            {enviandoReporte ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-send me-1"></i>
                                                    Enviar para aprobación
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL REGISTRAR SOLUCION */}
                {modalVisible && (
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ display: 'block', zIndex: '1050' }}
                        onClick={handleCloseModal}
                    >
                        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="bi bi-wrench-adjustable me-1"></i>
                                        Registrar solucion
                                    </h5>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                </div>

                                <div className="modal-body">
                                    {selectedEvidencia && (
                                        <div className="text-center mb-3">
                                            <img
                                                src={API_ROUTES.ARCHIVO_EVIDENCIA(selectedEvidencia)}
                                                alt="Evidencia del daño"
                                                className="img-thumbnail"
                                                style={{ maxHeight: '180px' }}
                                            />
                                        </div>
                                    )}
                                    <p><strong>Diagnostico: </strong>{selectedFalla}</p>
                                    <p><strong>Numero de Serie: </strong>{selectedNumSerie}</p>
                                    <p><strong>Tecnico: </strong>{usuario}</p>

                                    <form onSubmit={registrarSolucion}>
                                        <div className="mb-3">
                                            <label htmlFor="solucion" className="form-label">Solucion</label>
                                            <textarea
                                                className="form-control"
                                                id="solucion"
                                                value={solucion}
                                                onChange={(e) => setSolucion(e.target.value)}
                                                required
                                            >
                                            </textarea>
                                        </div>

                                        <div className="text-center">
                                            <button className="btn btn-primary" type="submit">
                                                <i className="bi bi-check-lg"></i>
                                                Registrar Solucion
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL DETALLES DE LA ORDEN (SOLO LECTURA) */}
                {ordenDetalle && (
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setOrdenDetalle(null)}
                    >
                        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">
                                        <i className="bi bi-card-text me-2"></i>
                                        Detalles de la Orden
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setOrdenDetalle(null)}></button>
                                </div>

                                <div className="modal-body">
                                    {ordenDetalle.evidencia && (
                                        <div className="text-center mb-3">
                                            <img
                                                src={API_ROUTES.ARCHIVO_EVIDENCIA(ordenDetalle.evidencia)}
                                                alt="Evidencia del daño"
                                                className="img-thumbnail"
                                                style={{ maxHeight: '190px', cursor: 'zoom-in' }}
                                                onClick={() => setFotoAmpliada(ordenDetalle.evidencia)}
                                            />
                                            <div>
                                                <small className="text-muted">Haz clic en la imagen para ampliarla</small>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 className="fw-bold mb-1">{ordenDetalle.equipo || 'Equipo'}</h6>
                                            <code>{ordenDetalle.num_serie}</code>
                                            {ordenDetalle.area && (
                                                <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">{ordenDetalle.area}</span>
                                            )}
                                        </div>
                                        {getBadgeOrden(ordenDetalle.estado_orden)}
                                    </div>

                                    <table className="table table-sm mb-3">
                                        <tbody>
                                            <tr>
                                                <td className="text-secondary" style={{ width: '40%' }}>ID Orden</td>
                                                <td className="fw-semibold">{ordenDetalle.id_historial}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-secondary">Fecha de reporte</td>
                                                <td>{new Date(ordenDetalle.fecha_reporte).toLocaleDateString('es-CO')}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-secondary">Reportado por</td>
                                                <td>Soporte Técnico</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="mb-3">
                                        <div className="fw-semibold small text-uppercase text-secondary mb-1">Diagnóstico del daño</div>
                                        <p className="mb-0 border rounded p-2" style={{ background: 'var(--bg-surface-2)' }}>
                                            {ordenDetalle.falla}
                                        </p>
                                    </div>

                                    {/* INFORMACION DE LA APROBACION */}
                                    {ordenDetalle.estado_orden === 'aprobada' ? (
                                        <div className="border rounded p-2 mb-0 d-flex align-items-center gap-2" style={{ background: '#dcfce7' }}>
                                            <i className="bi bi-patch-check-fill" style={{ color: '#14532d' }}></i>
                                            <div className="small">
                                                <strong style={{ color: '#14532d' }}>Orden aprobada</strong>
                                                <span style={{ color: '#14532d' }}>
                                                    {ordenDetalle.aprobada_por ? ` por ${ordenDetalle.aprobada_por}` : ''}
                                                    {ordenDetalle.fecha_aprobacion ? ` el ${new Date(ordenDetalle.fecha_aprobacion).toLocaleDateString('es-CO')}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border rounded p-2 mb-0 d-flex align-items-center gap-2" style={{ background: '#fef9c3' }}>
                                            <i className="bi bi-hourglass-split" style={{ color: '#854d0e' }}></i>
                                            <div className="small fw-semibold" style={{ color: '#854d0e' }}>
                                                Pendiente de aprobación del administrador
                                            </div>
                                        </div>
                                    )}

                                    {/* SOLUCION SI YA EXISTE */}
                                    {ordenDetalle.fecha_solucion && (
                                        <div className="mt-3">
                                            <div className="fw-semibold small text-uppercase text-secondary mb-1">Solución aplicada</div>
                                            <p className="mb-1 border rounded p-2" style={{ background: 'var(--bg-surface-2)' }}>{ordenDetalle.solucion}</p>
                                            <small className="text-secondary">
                                                <i className="bi bi-tools me-1"></i>
                                                Técnico: {ordenDetalle.usuario_tecnico || '—'} · {new Date(ordenDetalle.fecha_solucion).toLocaleDateString('es-CO')}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setOrdenDetalle(null)}>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL FOTO AMPLIADA */}
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
                                    <button className="btn btn-sm btn-light rounded-pill" onClick={() => setFotoAmpliada(null)}>
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
        </div>
    )
}

export default Soportes
