import {useState, useEffect} from "react";
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES} from "../api/apiRoutes"

// Convierte Date a string YYYY-MM-DD sin problemas de zona horaria
const toISODate = (fecha) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const Equipos = ({ usuario }) => {
    const [ equipos, setEquipos ] = useState([])
    const [ usuarios, setUsuarios ] = useState([])
    const [ areas, setAreas ] = useState([])
    const [ prestamosActivos, setPrestamosActivos ] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Estado del modal de prestamo
    const [modalPrestamo, setModalPrestamo] = useState(false)
    const [equipoSeleccionado, setEquipoSeleccionado] = useState({})
    const [usuarioDestino, setUsuarioDestino] = useState('')
    const [areaPrestamo, setAreaPrestamo] = useState('')
    const [fechaInicio, setFechaInicio] = useState(toISODate(new Date()))
    const [fechaLimite, setFechaLimite] = useState(toISODate(new Date(Date.now() + 7 * 86400000)))
    const [enviarCorreo, setEnviarCorreo] = useState(true)
    const [enviando, setEnviando] = useState(false)

    const [filter, setFilter] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')

    // Estado del modal de registro de nuevo equipo
    const [modalRegistro, setModalRegistro] = useState(false)
    const [guardandoEquipo, setGuardandoEquipo] = useState(false)
    const [nuevoEquipo, setNuevoEquipo] = useState({
        equipo: '', descripcion: '', sistema_operativo: '', num_serie: '',
        area: '', fecha_adquisicion: '', estado: 'Disponible'
    })

    useEffect(() => {
        Promise.all([
            axios.get(API_ROUTES.EQUIPOS),
            axios.get(API_ROUTES.OBTENER_USUARIOS),
            axios.get(API_ROUTES.OBTENER_AREAS),
            axios.get(API_ROUTES.PRESTAMOS_ACTIVOS)
        ])
        .then(([resEquipos, resUsuarios, resAreas, resPrestamos]) => {
            setEquipos(resEquipos.data)
            setUsuarios(resUsuarios.data.filter(u => u.estado === 'activo'))
            setAreas(resAreas.data)
            setPrestamosActivos(resPrestamos.data)
            setLoading(false)
        })
        .catch(() => {
            setError('Hubo un error al obtener los equipos')
            setLoading(false)
        })
    }, [])

    if(loading){
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando equipos...</div>
            </div>
        )
    }

    if(error){
        return <div className="alert alert-danger text-center">{error}</div>
    }

    const handleFilterChange = (e) => {
        setFilter(e.target.value)
    }

    const filteredEquipos = equipos.filter(equipo => {
        const matchTexto = equipo.num_serie?.toLowerCase().includes(filter.toLowerCase()) ||
            equipo.responsable?.toLowerCase().includes(filter.toLowerCase()) ||
            equipo.equipo?.toLowerCase().includes(filter.toLowerCase())
        const matchEstado = !filtroEstado || equipo.estado === filtroEstado
        return matchTexto && matchEstado
    })

    // ABRE EL MODAL DE PRESTAMO PREPOBLADO CON EL EQUIPO SELECCIONADO
    const abrirModalPrestamo = (equipo) => {
        setEquipoSeleccionado({...equipo})
        setUsuarioDestino('')
        setAreaPrestamo(equipo.area || '')
        setFechaInicio(toISODate(new Date()))
        setFechaLimite(toISODate(new Date(Date.now() + 7 * 86400000)))
        setEnviarCorreo(true)
        setModalPrestamo(true)
    }

    // CONFIRMA EL PRESTAMO: REGISTRA EN PRESTAMOS Y MARCA EL EQUIPO COMO ASIGNADO
    const confirmarPrestamo = () => {
        if(!usuarioDestino){
            Swal.fire({
                icon: 'warning',
                title: 'Selecciona un usuario',
                text: 'Debes elegir el usuario al que se le asigna el equipo'
            })
            return
        }

        setEnviando(true)

        const observacionesAuto = `Prestamo del ${fechaInicio} al ${fechaLimite}`

        axios.post(API_ROUTES.PRESTAMOS, {
            num_serie: equipoSeleccionado.num_serie,
            usuario_destino: usuarioDestino,
            fecha_inicio: fechaInicio,
            fecha_limite: fechaLimite,
            observaciones: observacionesAuto
        })
        .then(async () => {
            setEquipos(prevEquipos => prevEquipos.map(e =>
                e.num_serie === equipoSeleccionado.num_serie
                    ? {...e, estado: 'Asignado', responsable: usuarioDestino}
                    : e
            ))
            // Sincroniza la lista de prestamos activos para que las alertas y la devolucion funcionen de inmediato
            try {
                const resPrestamos = await axios.get(API_ROUTES.PRESTAMOS_ACTIVOS)
                setPrestamosActivos(resPrestamos.data)
            } catch {
                // Fallback silencioso
            }

            setModalPrestamo(false)
            Swal.fire({
                icon: 'success',
                title: 'Préstamo confirmado',
                html: enviarCorreo
                    ? `El equipo fue asignado correctamente.<br><small class="text-muted">Se envió el recibo por correo electrónico al usuario</small>`
                    : 'El equipo fue asignado correctamente.',
                timer: 3000,
                showConfirmButton: false
            })
        })
        .catch(err => {
            const msg = err.response?.data?.error || 'Hubo un error al registrar el préstamo'
            Swal.fire({ icon: 'error', title: 'Error al confirmar préstamo', text: msg })
        })
        .finally(() => setEnviando(false))
    }

    // ABRE EL MODAL DE REGISTRO DE NUEVO EQUIPO
    const abrirModalRegistro = () => {
        setNuevoEquipo({
            equipo: '', descripcion: '', sistema_operativo: '', num_serie: '',
            area: '', fecha_adquisicion: toISODate(new Date()), estado: 'Disponible'
        })
        setModalRegistro(true)
    }

    // REGISTRA EL NUEVO EQUIPO EN EL INVENTARIO
    const guardarNuevoEquipo = () => {
        if (!nuevoEquipo.equipo.trim() || !nuevoEquipo.num_serie.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'El nombre/modelo y el número de serie son obligatorios'
            })
            return
        }

        setGuardandoEquipo(true)

        const formData = new FormData()
        Object.entries(nuevoEquipo).forEach(([campo, valor]) => formData.append(campo, valor || ''))

        axios.post(API_ROUTES.CREAR_EQUIPO, formData)
            .then(res => {
                setEquipos(prevEquipos => [res.data.equipo, ...prevEquipos])
                setModalRegistro(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Equipo registrado',
                    html: `<strong>${res.data.equipo.equipo}</strong> ya está en el inventario`,
                    timer: 2500,
                    showConfirmButton: false
                })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al registrar',
                    text: err.response?.data?.error || 'No se pudo registrar el equipo'
                })
            })
            .finally(() => setGuardandoEquipo(false))
    }

    // COLOR DEL BADGE SEGUN EL ESTADO DEL EQUIPO
    const getEstadoClass = (estado) => {
        switch(estado?.toLowerCase()) {
            case 'disponible': return 'estado-disponible'
            case 'asignado': return 'estado-prestamo'
            case 'mantenimiento': case 'en mantenimiento': return 'estado-mantenimiento'
            case 'baja': case 'inactivo': return 'estado-baja'
            default: return 'estado-baja'
        }
    }

    // ETIQUETA VISIBLE SEGUN EL ESTADO
    const getEstadoLabel = (estado) => {
        return estado === 'Asignado' ? 'En Préstamo' : estado
    }

    // FICHA TECNICA: SEPARA LA DESCRIPCION POR COMAS EN LINEAS DE ESPECIFICACIONES
    const getEspecificaciones = (equipo) => {
        if(!equipo.descripcion) return []
        return equipo.descripcion.split(',').map(s => s.trim()).filter(Boolean)
    }

    // ASIGNA UN ICONO DE BOOTSTRAP SEGUN EL TIPO DE ESPECIFICACION TECNICA
    const getSpecIcon = (spec) => {
        const s = spec.toLowerCase()
        if (s.includes('ghz') || s.includes('core') || s.includes('intel') || s.includes('ryzen') || s.includes('cpu') || s.includes('procesador')) return 'bi-cpu text-primary'
        if (s.includes('ram') || s.includes('gb ram') || s.includes('ddr') || s.includes('memoria')) return 'bi-memory text-primary'
        if (s.includes('ssd') || s.includes('hdd') || s.includes('disco') || s.includes('almacenamiento') || s.includes('tb') || s.includes('gb')) return 'bi-device-hdd text-primary'
        if (s.includes('windows') || s.includes('linux') || s.includes('ubuntu') || s.includes('macos') || s.includes('sistema') || s.includes('os')) return 'bi-windows text-primary'
        return 'bi-check2-circle text-success'
    }

    // CALCULA LA DURACION EN DIAS DEL PRESTAMO SELECCIONADO
    const calcularDiasPrestamo = () => {
        if (!fechaInicio || !fechaLimite) return null
        const ini = new Date(`${fechaInicio}T00:00:00`)
        const fin = new Date(`${fechaLimite}T00:00:00`)
        const diff = Math.round((fin - ini) / 86400000)
        return diff < 0 ? 0 : diff + 1
    }

    // CALCULA EL ESTADO DE VENCIMIENTO DEL PRESTAMO ACTIVO DE UN EQUIPO
    // Devuelve {tipo: 'vencido'|'por_vencer', dias, fecha} o null si no esta por vencer
    const getVencimiento = (numSerie) => {
        const prestamo = prestamosActivos.find(p => p.num_serie === numSerie)
        if(!prestamo?.fecha_devolucion) return null

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const limite = new Date(`${String(prestamo.fecha_devolucion).substring(0, 10)}T00:00:00`)
        const dias = Math.round((limite - hoy) / 86400000)

        if(dias < 0) return {tipo: 'vencido', dias: Math.abs(dias), fecha: limite}
        if(dias <= 2) return {tipo: 'por_vencer', dias, fecha: limite}
        return null
    }

    // REGISTRA LA DEVOLUCION DIRECTAMENTE DESDE LA TARJETA DEL EQUIPO
    const devolverEquipo = (equipo) => {
        const prestamo = prestamosActivos.find(p => p.num_serie === equipo.num_serie)
        if(!prestamo){
            Swal.fire({
                icon: 'warning',
                title: 'Sin préstamo activo',
                text: 'No se encontró un préstamo activo para este equipo'
            })
            return
        }

        Swal.fire({
            icon: 'question',
            title: '¿Registrar devolución?',
            html: `<strong>${equipo.equipo}</strong> volverá a estar <span class="text-success fw-bold">Disponible</span>`,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-arrow-return-left me-1"></i>Sí, devolver',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#16a34a'
        })
        .then(result => {
            if(!result.isConfirmed) return

            axios.post(API_ROUTES.DEVOLVER_PRESTAMO(prestamo.id_prestamo))
            .then(() => {
                setEquipos(equipos.map(e =>
                    e.num_serie === equipo.num_serie
                        ? {...e, estado: 'Disponible', responsable: null}
                        : e
                ))
                setPrestamosActivos(prestamosActivos.filter(p => p.num_serie !== equipo.num_serie))
                Swal.fire({
                    icon: 'success',
                    title: 'Devolución registrada',
                    text: `${equipo.equipo} está disponible nuevamente`,
                    timer: 2500,
                    showConfirmButton: false
                })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al devolver',
                    text: err.response?.data?.error || 'Hubo un error al registrar la devolución'
                })
            })
        })
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        Inventario de Equipos
                    </h4>
                    <div className="d-flex gap-2 align-items-center">
                        <span className="badge text-bg-primary">{equipos.length} registros</span>
                        <button
                            className="btn btn-sm btn-success rounded-pill"
                            onClick={abrirModalRegistro}
                        >
                            <i className="bi bi-plus-lg me-1"></i>
                            Agregar Equipo
                        </button>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="row g-2">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por numero de serie, equipo o responsable..."
                                    value={filter}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="Disponible">Disponible</option>
                                <option value="Asignado">En Préstamo</option>
                                <option value="En mantenimiento">En mantenimiento</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* CUADRICULA DE TARJETAS DE EQUIPOS */}
                {filteredEquipos.length === 0 ? (
                    <div className="empty-state">
                        <p className="text-muted my-3">No se encontraron equipos</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredEquipos.map(equipo => (
                            <div className="col-xl-4 col-md-6" key={equipo.num_serie}>
                                <div className={`card h-100 shadow-sm border p-3 d-flex flex-column justify-content-between ${equipo.estado === 'Baja' ? 'opacity-75' : ''}`}>
                                    <div>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="fw-bold mb-0">{equipo.equipo}</h6>
                                            <span className={`badge ${getEstadoClass(equipo.estado)}`}>
                                                {getEstadoLabel(equipo.estado)}
                                            </span>
                                        </div>
                                        <p className="small text-muted mb-2">{equipo.descripcion || 'Sin especificaciones registradas'}</p>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="dept-tag">{equipo.area}</span>
                                            <code className="small">{equipo.num_serie}</code>
                                        </div>
                                    </div>

                                    {equipo.estado === 'Disponible' && (
                                        <button
                                            className="btn btn-success btn-sm w-100"
                                            onClick={() => abrirModalPrestamo(equipo)}
                                        >
                                            Préstamo
                                        </button>
                                    )}

                                    {equipo.estado === 'Asignado' && (() => {
                                        const vencimiento = getVencimiento(equipo.num_serie)
                                        const textoAlerta = vencimiento?.tipo === 'vencido'
                                            ? `VENCIDO (${vencimiento.dias}d)`
                                            : vencimiento?.dias === 0
                                                ? 'Vence HOY'
                                                : `Vence en ${vencimiento?.dias}d`
                                        return (
                                            <div className="d-flex flex-column gap-2 mt-auto">
                                                <div className="d-flex justify-content-between align-items-center p-2 rounded border" style={{ background: 'var(--bg-surface-2)' }}>
                                                    <span className="small fw-semibold text-truncate" style={{ maxWidth: '140px' }}>
                                                        {equipo.responsable || 'Sin responsable'}
                                                    </span>
                                                    <button
                                                        className="btn btn-sm btn-outline-success px-2 py-0"
                                                        onClick={() => devolverEquipo(equipo)}
                                                        title="Registrar devolución"
                                                    >
                                                        Devolver
                                                    </button>
                                                </div>
                                                {vencimiento && (
                                                    <div className={`small p-1 rounded text-center fw-bold ${vencimiento.tipo === 'vencido' ? 'equipo-card__alerta--vencido' : 'equipo-card__alerta--pronto'}`}>
                                                        {textoAlerta} — {vencimiento.fecha.toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {/* MODAL RESUMEN DEL PRESTAMO DE EQUIPO */}
            {modalPrestamo && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)'}}
                    onClick={() => !enviando && setModalPrestamo(false)}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Resumen del Préstamo de Equipo
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !enviando && setModalPrestamo(false)}
                                    disabled={enviando}
                                >
                                </button>
                            </div>

                            <div className="modal-body p-0">
                                <div className="row g-0">

                                    {/* PANEL IZQUIERDO: DETALLES DEL HARDWARE */}
                                    <div className="col-md-5 p-4 border-end" style={{ background: 'var(--bg-surface-2)' }}>
                                        <h5 className="fw-bold mb-1">{equipoSeleccionado.equipo}</h5>
                                        <span className="badge estado-disponible mb-3">{equipoSeleccionado.area}</span>

                                        <div className="card p-3 border mb-3" style={{ background: 'var(--bg-surface)' }}>
                                            <div className="fw-bold small text-muted text-uppercase mb-2">Ficha Técnica</div>
                                            <ul className="list-unstyled mb-2">
                                                {equipoSeleccionado.sistema_operativo && (
                                                    <li className="text-secondary small py-1 border-bottom">
                                                        <i className="bi bi-windows me-1"></i>
                                                        {equipoSeleccionado.sistema_operativo}
                                                    </li>
                                                )}
                                                {getEspecificaciones(equipoSeleccionado).map((spec, i) => (
                                                    <li key={i} className="text-secondary small py-1 border-bottom">
                                                        {spec}
                                                    </li>
                                                ))}
                                                {getEspecificaciones(equipoSeleccionado).length === 0 && (
                                                    <li className="text-muted small">Sin especificaciones registradas</li>
                                                )}
                                            </ul>
                                            <div className="d-flex justify-content-between align-items-center pt-2">
                                                <span className="text-muted small">Número de Serie:</span>
                                                <code className="fw-bold">{equipoSeleccionado.num_serie}</code>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PANEL DERECHO: FORMULARIO DE ASIGNACION */}
                                    <div className="col-md-7 p-4">
                                        <form onSubmit={(e) => e.preventDefault()}>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Usuario Asignado</label>
                                                <select
                                                    className="form-select"
                                                    value={usuarioDestino}
                                                    onChange={(e) => {
                                                        setUsuarioDestino(e.target.value)
                                                        const u = usuarios.find(x => x.nombre === e.target.value)
                                                        if(u && u.area) setAreaPrestamo(u.area)
                                                    }}
                                                >
                                                    <option value="">Seleccionar beneficiario...</option>
                                                    {usuarios.map(u => (
                                                        <option key={u.usuario} value={u.nombre}>
                                                            {u.nombre} {u.area ? `(${u.area})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Área del Hospital</label>
                                                <select
                                                    className="form-select"
                                                    value={areaPrestamo}
                                                    onChange={(e) => setAreaPrestamo(e.target.value)}
                                                >
                                                    <option value="">Seleccionar departamento...</option>
                                                    {areas.map(a => (
                                                        <option key={a.area} value={a.area}>{a.area}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label fw-semibold mb-0">Rango de Fechas</label>
                                                {calcularDiasPrestamo() !== null && (
                                                    <span className="badge text-bg-primary">
                                                        {calcularDiasPrestamo()} día{calcularDiasPrestamo() !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="row g-2 mb-3">
                                                <div className="col-6">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={fechaInicio}
                                                        min={toISODate(new Date())}
                                                        onChange={(e) => {
                                                            setFechaInicio(e.target.value)
                                                            if(fechaLimite < e.target.value) setFechaLimite(e.target.value)
                                                        }}
                                                    />
                                                    <small className="text-muted">Fecha Inicio</small>
                                                </div>
                                                <div className="col-6">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={fechaLimite}
                                                        min={fechaInicio}
                                                        onChange={(e) => setFechaLimite(e.target.value)}
                                                    />
                                                    <small className="text-muted">Fecha Límite</small>
                                                </div>
                                            </div>

                                            <div className="form-check notificacion-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="checkCorreo"
                                                    checked={enviarCorreo}
                                                    onChange={(e) => setEnviarCorreo(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="checkCorreo">
                                                    Enviar recibo por correo electrónico al usuario
                                                </label>
                                                {enviarCorreo && (() => {
                                                    const usuarioObj = usuarios.find(u => u.nombre === usuarioDestino)
                                                    return usuarioObj?.correo ? (
                                                        <div className="small text-muted mt-1 ps-1">
                                                            Se enviará a: <span className="fw-semibold text-primary">{usuarioObj.correo}</span>
                                                        </div>
                                                    ) : null
                                                })()}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalPrestamo(false)}
                                    disabled={enviando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={confirmarPrestamo}
                                    disabled={enviando}
                                >
                                    {enviando ? 'Confirmando...' : 'Confirmar Préstamo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL REGISTRAR NUEVO EQUIPO */}
            {modalRegistro && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !guardandoEquipo && setModalRegistro(false)}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Registrar Equipo
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !guardandoEquipo && setModalRegistro(false)}
                                    disabled={guardandoEquipo}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="row g-3">

                                    {/* CAMPOS DE DATOS DEL EQUIPO */}
                                    <div className="col-12">
                                        <form onSubmit={(e) => e.preventDefault()}>
                                            <div className="mb-2">
                                                <label className="form-label fw-semibold mb-1">
                                                    Nombre / Modelo del Equipo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ej. Dell XPS 13"
                                                    value={nuevoEquipo.equipo}
                                                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value})}
                                                    disabled={guardandoEquipo}
                                                    maxLength="100"
                                                />
                                            </div>

                                            <div className="mb-2">
                                                <label className="form-label fw-semibold mb-1">Especificaciones</label>
                                                <textarea
                                                    rows="2"
                                                    className="form-control"
                                                    placeholder="Procesador, memoria RAM, almacenamiento..."
                                                    value={nuevoEquipo.descripcion}
                                                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, descripcion: e.target.value})}
                                                    disabled={guardandoEquipo}
                                                    maxLength="500"
                                                ></textarea>
                                            </div>

                                            <div className="row g-2 mb-2">
                                                <div className="col-sm-6">
                                                    <label className="form-label fw-semibold mb-1">Sistema Operativo</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Windows 11, macOS..."
                                                        value={nuevoEquipo.sistema_operativo}
                                                        onChange={(e) => setNuevoEquipo({...nuevoEquipo, sistema_operativo: e.target.value})}
                                                        disabled={guardandoEquipo}
                                                        maxLength="60"
                                                    />
                                                </div>
                                                <div className="col-sm-6">
                                                    <label className="form-label fw-semibold mb-1">
                                                        Número de Serie (SN) <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="EQ-S26-XXX"
                                                        value={nuevoEquipo.num_serie}
                                                        onChange={(e) => setNuevoEquipo({...nuevoEquipo, num_serie: e.target.value})}
                                                        disabled={guardandoEquipo}
                                                        maxLength="50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-2 mb-2">
                                                <div className="col-sm-6">
                                                    <label className="form-label fw-semibold mb-1">Área</label>
                                                    <select
                                                        className="form-select"
                                                        value={nuevoEquipo.area}
                                                        onChange={(e) => setNuevoEquipo({...nuevoEquipo, area: e.target.value})}
                                                        disabled={guardandoEquipo}
                                                    >
                                                        <option value="">Sin asignar</option>
                                                        {areas.map(a => (
                                                            <option key={a.area} value={a.area}>{a.area}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-sm-6">
                                                    <label className="form-label fw-semibold mb-1">Fecha de adquisición</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={nuevoEquipo.fecha_adquisicion}
                                                        onChange={(e) => setNuevoEquipo({...nuevoEquipo, fecha_adquisicion: e.target.value})}
                                                        disabled={guardandoEquipo}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-0">
                                                <label className="form-label fw-semibold mb-1">Estado inicial</label>
                                                <select
                                                    className="form-select"
                                                    value={nuevoEquipo.estado}
                                                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, estado: e.target.value})}
                                                    disabled={guardandoEquipo}
                                                >
                                                    <option value="Disponible">Disponible</option>
                                                    <option value="En mantenimiento">En mantenimiento</option>
                                                    <option value="Baja">Baja</option>
                                                </select>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalRegistro(false)}
                                    disabled={guardandoEquipo}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={guardarNuevoEquipo}
                                    disabled={guardandoEquipo || !nuevoEquipo.equipo.trim() || !nuevoEquipo.num_serie.trim()}
                                >
                                    {guardandoEquipo ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2-circle me-1"></i>
                                            Registrar Equipo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}

export default Equipos
