import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

// Convierte Date a string YYYY-MM-DD
const toISODate = (fecha) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

// Dias que faltan para la fecha limite (negativo = vencido)
const diasRestantes = (fecha) => {
    if (!fecha) return null
    const limite = String(fecha).substring(0, 10)
    return Math.round((new Date(limite) - new Date(toISODate(new Date()))) / 86400000)
}

const Prestamos = () => {
    const [prestamos, setPrestamos] = useState([])
    const [equiposDisponibles, setEquiposDisponibles] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)

    // Filtro de búsqueda
    const [busqueda, setBusqueda] = useState('')

    // Estado del modal de préstamo
    const [modalNuevo, setModalNuevo] = useState(false)
    const [numSerie, setNumSerie] = useState('')
    const [usuarioDestino, setUsuarioDestino] = useState('')
    const [areaPrestamo, setAreaPrestamo] = useState('')
    const [fechaInicio, setFechaInicio] = useState(toISODate(new Date()))
    const [fechaLimite, setFechaLimite] = useState(toISODate(new Date(Date.now() + 7 * 86400000)))
    const [observaciones, setObservaciones] = useState('')
    const [enviarCorreo, setEnviarCorreo] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = () => {
        setLoading(true)
        Promise.all([
            axios.get(API_ROUTES.PRESTAMOS_ACTIVOS),
            axios.get(API_ROUTES.EQUIPOS),
            axios.get(API_ROUTES.OBTENER_USUARIOS),
            axios.get(API_ROUTES.OBTENER_AREAS)
        ])
            .then(([resPrestamos, resEquipos, resUsuarios, resAreas]) => {
                setPrestamos(resPrestamos.data)
                setEquiposDisponibles(resEquipos.data.filter(e => e.estado === 'Disponible'))
                setUsuarios(resUsuarios.data.filter(u => u.estado === 'activo'))
                setAreas(resAreas.data)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos de préstamos'
                })
            })
    }

    const abrirModalNuevo = () => {
        setNumSerie('')
        setUsuarioDestino('')
        setAreaPrestamo('')
        setFechaInicio(toISODate(new Date()))
        setFechaLimite(toISODate(new Date(Date.now() + 7 * 86400000)))
        setObservaciones('')
        setEnviarCorreo(true)
        setModalNuevo(true)
    }

    const handleSelectEquipo = (serie) => {
        setNumSerie(serie)
        const eq = equiposDisponibles.find(e => e.num_serie === serie)
        if (eq && eq.area) {
            setAreaPrestamo(eq.area)
        }
    }

    const handleSelectUsuario = (nombre) => {
        setUsuarioDestino(nombre)
        const u = usuarios.find(x => x.nombre === nombre)
        if (u && u.area) {
            setAreaPrestamo(u.area)
        }
    }

    const crearPrestamo = () => {
        if (!numSerie || !usuarioDestino) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Selecciona un equipo y un usuario destino'
            })
            return
        }

        setGuardando(true)
        const obsFinal = observaciones.trim() || `Préstamo del ${fechaInicio} al ${fechaLimite}`

        axios.post(API_ROUTES.CREAR_PRESTAMO, {
            num_serie: numSerie,
            usuario_destino: usuarioDestino,
            area: areaPrestamo,
            fecha_inicio: fechaInicio,
            fecha_limite: fechaLimite,
            observaciones: obsFinal
        })
            .then(() => {
                setModalNuevo(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Préstamo registrado',
                    text: 'El equipo fue asignado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                })
                cargarDatos()
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al registrar préstamo',
                    text: err.response?.data?.error || 'No se pudo crear el préstamo'
                })
            })
            .finally(() => setGuardando(false))
    }

    const devolverPrestamo = (id, equipoNombre) => {
        Swal.fire({
            icon: 'question',
            title: '¿Confirmar devolución?',
            text: `${equipoNombre || 'El equipo'} volverá a estar disponible`,
            showCancelButton: true,
            confirmButtonText: 'Sí, devolver',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#16a34a'
        })
            .then((result) => {
                if (result.isConfirmed) {
                    axios.post(API_ROUTES.DEVOLVER_PRESTAMO(id))
                        .then(() => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Equipo devuelto',
                                timer: 2000,
                                showConfirmButton: false
                            })
                            cargarDatos()
                        })
                        .catch(err => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al devolver',
                                text: err.response?.data?.error || 'Hubo un error al registrar la devolución'
                            })
                        })
                }
            })
    }

    // Filtra la lista según el texto de búsqueda
    const filteredPrestamos = prestamos.filter(p => {
        const texto = busqueda.toLowerCase().trim()
        return !texto ||
            p.num_serie?.toLowerCase().includes(texto) ||
            p.equipo?.toLowerCase().includes(texto) ||
            p.usuario_destino?.toLowerCase().includes(texto) ||
            p.observaciones?.toLowerCase().includes(texto)
    })

    const usuarioSeleccionadoObj = usuarios.find(u => u.nombre === usuarioDestino)

    // Conteos de vencimiento para los chips del encabezado
    const totalVencidos = prestamos.filter(p => (diasRestantes(p.fecha_devolucion) ?? 0) < 0).length
    const totalPorVencer = prestamos.filter(p => {
        const d = diasRestantes(p.fecha_devolucion)
        return d !== null && d >= 0 && d <= 3
    }).length

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando préstamos...</div>
            </div>
        )
    }

    return (
        <div className="card shadow-sm border">
            <div className="card-body">
                {/* ENCABEZADO */}
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h4 className="mb-0 fw-bold">
                            Préstamos Activos
                        </h4>
                        <span className="chip-alerta chip-alerta--ok">{prestamos.length} activos</span>
                        {totalPorVencer > 0 && (
                            <span className="chip-alerta chip-alerta--pronto">{totalPorVencer} por vencer</span>
                        )}
                        {totalVencidos > 0 && (
                            <span className="chip-alerta chip-alerta--vencido">{totalVencidos} vencidos</span>
                        )}
                    </div>

                    <button
                        className="btn btn-success btn-sm"
                        onClick={abrirModalNuevo}
                    >
                        + Nuevo Préstamo
                    </button>
                </div>

                {/* BUSCADOR */}
                <div className="mb-3">
                    <div className="input-group">
                        <span className="input-group-text bg-light">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por número de serie, equipo o usuario..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setBusqueda('')}
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLA DE PRÉSTAMOS */}
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle mb-0">
                        <thead className="table-header">
                            <tr>
                                <th>N/S</th>
                                <th>Equipo</th>
                                <th>Usuario Destino</th>
                                <th>Área</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Límite</th>
                                <th>Observaciones</th>
                                <th className="text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrestamos.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">
                                        No hay préstamos registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredPrestamos.map(p => (
                                    <tr key={p.id_prestamo}>
                                        <td className="fw-semibold">
                                            <code>{p.num_serie}</code>
                                        </td>
                                        <td>{p.equipo || '-'}</td>
                                        <td>{p.usuario_destino}</td>
                                        <td>{p.area || '-'}</td>
                                        <td>{p.fecha_prestamo ? String(p.fecha_prestamo).substring(0, 10) : '—'}</td>
                                        <td>
                                            {p.fecha_devolucion ? String(p.fecha_devolucion).substring(0, 10) : '—'}
                                            {(() => {
                                                const d = diasRestantes(p.fecha_devolucion)
                                                if (d === null || d > 3) return null
                                                if (d < 0) {
                                                    return (
                                                        <div className="mt-1">
                                                            <span className="chip-alerta chip-alerta--vencido">VENCIDO ({Math.abs(d)}d)</span>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="mt-1">
                                                        <span className="chip-alerta chip-alerta--pronto">
                                                            {d === 0 ? 'Vence hoy' : `Vence en ${d}d`}
                                                        </span>
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                        <td>{p.observaciones || '-'}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() => devolverPrestamo(p.id_prestamo, p.equipo)}
                                            >
                                                Devolver
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE NUEVO PRÉSTAMO */}
            {modalNuevo && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !guardando && setModalNuevo(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Registrar Préstamo
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !guardando && setModalNuevo(false)}
                                    disabled={guardando}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    {/* EQUIPO */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Equipo (Disponibles)</label>
                                        <select
                                            className="form-select"
                                            value={numSerie}
                                            onChange={(e) => handleSelectEquipo(e.target.value)}
                                        >
                                            <option value="">Seleccionar equipo...</option>
                                            {equiposDisponibles.map(e => (
                                                <option key={e.num_serie} value={e.num_serie}>
                                                    {e.equipo} ({e.num_serie})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* USUARIO DESTINO */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Usuario Destino</label>
                                        <select
                                            className="form-select"
                                            value={usuarioDestino}
                                            onChange={(e) => handleSelectUsuario(e.target.value)}
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {usuarios.map(u => (
                                                <option key={u.usuario} value={u.nombre}>
                                                    {u.nombre} {u.area ? `(${u.area})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ÁREA */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Área / Departamento</label>
                                        <select
                                            className="form-select"
                                            value={areaPrestamo}
                                            onChange={(e) => setAreaPrestamo(e.target.value)}
                                        >
                                            <option value="">Seleccionar área...</option>
                                            {areas.map(a => (
                                                <option key={a.area} value={a.area}>{a.area}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* FECHAS */}
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Fecha Inicio</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={fechaInicio}
                                                min={toISODate(new Date())}
                                                onChange={(e) => {
                                                    setFechaInicio(e.target.value)
                                                    if (fechaLimite < e.target.value) setFechaLimite(e.target.value)
                                                }}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Fecha Devolución</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={fechaLimite}
                                                min={fechaInicio}
                                                onChange={(e) => setFechaLimite(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* OBSERVACIONES */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Observaciones</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* CHECKBOX CORREO */}
                                    <div className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkCorreo"
                                            checked={enviarCorreo}
                                            onChange={(e) => setEnviarCorreo(e.target.checked)}
                                        />
                                        <label className="form-check-label small" htmlFor="checkCorreo">
                                            Enviar recibo por correo electrónico al usuario
                                        </label>
                                        {enviarCorreo && usuarioSeleccionadoObj?.correo && (
                                            <div className="small text-muted ps-1 mt-1">
                                                Correo: <strong>{usuarioSeleccionadoObj.correo}</strong>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalNuevo(false)}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={crearPrestamo}
                                    disabled={guardando || !numSerie || !usuarioDestino}
                                >
                                    {guardando ? 'Registrando...' : 'Registrar Préstamo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Prestamos
