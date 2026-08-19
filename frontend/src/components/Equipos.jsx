import {useState, useEffect} from "react";
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES} from "../api/apiRoutes"

const Equipos = ({ usuario }) => {
    const [ equipos, setEquipos ] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [ equipoSeleccionado, setEquipoSeleccionado] = useState({})
    
    const [ modalAsignacion, setModalAsignacion] = useState(false)
    const [ usuarioAsignado, setUsuarioAsignado] = useState('')

    const [ modalEquipo, setModalEquipo] = useState(false)

    const [ filter, setFilter] = useState('')

    useEffect(() => {
        axios.get(API_ROUTES.EQUIPOS)
        .then(response => {
            setEquipos(response.data)
            setLoading(false)
        })
        .catch(err => {
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

    const filteredEquipos = equipos.filter(equipo =>
        equipo.num_serie?.toLowerCase().includes(filter.toLowerCase()) ||
        equipo.responsable?.toLowerCase().includes(filter.toLowerCase())
    )

    // FUNCION PARA ABRIR EL MODAL DE ASIGNACION DE USUARIO AL EQUIPO
    const asignarUsuario = (equipo) => {
        setEquipoSeleccionado({...equipo})
        setUsuarioAsignado(equipo.responsable || '')
        setModalAsignacion(true)
    }

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO DE USUARIO
    const handleUsuarioChange = (e) => {
        setUsuarioAsignado(e.target.value)
    }

    // FUNCION PARA ASIGNAR EL USUARIO AL EQUIPO
    const asignarResponsable = () => {
        const { num_serie } = equipoSeleccionado

        axios.post(API_ROUTES.ASIGNAR_USUARIO, {
            num_serie,
            usuario: usuarioAsignado
        })
        .then(response => {
            const updateEquipos = equipos.map(equipo => {
                if(equipo.num_serie === num_serie) {
                    return {...equipo, responsable: usuarioAsignado}
                }
                return equipo
            })
            setEquipos(updateEquipos)
            setModalAsignacion(false)
            Swal.fire({
                icon: 'success',
                title: 'Usuario asignado correctamente',
                timer: 2000,
                showConfirmButton: false
            })
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error al asignar usuario',
                text: 'Hubo un error al asignar el usuario al equipo'
            })
        })
    }

    // FUNCION PARA EDITAR EQUIPO
    const editarEquipo = (equipo) => {
        setEquipoSeleccionado({...equipo})
    }

    // FUNCION PARA ABRIR MODAL REPORTE DE FALLA
    const reportarFalla = (equipo) => {
        setEquipoSeleccionado({...equipo})
        setModalEquipo(true)
    }

    // FUNCION PARA MANEJAR CAMBIOS EN LOS CAMPOS
    const handleChange = (e) => {
        setEquipoSeleccionado({
            ...equipoSeleccionado,
            [e.target.name]: e.target.value
        })
    }

    // FUNCION PARA GUARDAR REPORTE DE FALLA
    const guardarReporteFalla = () => {
        const { num_serie, falla } = equipoSeleccionado

        axios.post(API_ROUTES.REPORTE_FALLA, {
            num_serie,
            falla
        })
        .then(response => {
            const updateEquipos = equipos.map(equipo => {
                if(equipo.num_serie === num_serie) {
                    return {...equipo, estado: 'Mantenimiento'}
                }
                return equipo
            })
            setEquipos(updateEquipos)
            setModalEquipo(false)
            Swal.fire({
                icon: 'success',
                title: 'Reporte enviado correctamente',
                timer: 2000,
                showConfirmButton: false
            })
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar reporte',
                text: 'Hubo un error al enviar el reporte de falla'
            })
        })
    }

    // FUNCION PARA ASIGNAR CLASES DE COLOR SEGUN EL ESTADO
    const getEstadoClass = (estado) => {
        switch(estado?.toLowerCase()) {
            case 'baja': case 'inactivo': return 'text-bg-danger'
            case 'activo': case 'asignado': return 'text-bg-success'
            case 'mantenimiento': case 'en mantenimiento': return 'text-bg-warning'
            case 'disponible': return 'text-bg-info'
            case 'reservado': return 'text-bg-secondary'
            default: return 'text-bg-light'
        }
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-hdd-stack"></i>
                        Inventario de Equipos
                    </h4>
                    <span className="badge text-bg-primary">{equipos.length} registros</span>
                </div>

                <div className="mb-3">
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por numero de serie o responsable..."
                            value={filter}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>Numero de Serie</th>
                                <th>Equipo</th>
                                <th>Area</th>
                                <th>Estado</th>
                                <th>Responsable</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-secondary">
                                        No se encontraron equipos
                                    </td>
                                </tr>
                            ) : (
                                filteredEquipos.map(equipo => (
                                    <tr key={equipo.num_serie}>
                                        <td className="fw-semibold">{equipo.num_serie}</td>
                                        <td>{equipo.equipo || '-'}</td>
                                        <td>{equipo.area || '-'}</td>
                                        <td>
                                            <span className={`badge ${getEstadoClass(equipo.estado)}`}>
                                                {equipo.estado}
                                            </span>
                                        </td>
                                        <td>{equipo.responsable || 'Sin asignar'}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => asignarUsuario(equipo)}
                                            >
                                                <i className="bi bi-person-plus"></i>
                                                Asignar
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={() => reportarFalla(equipo)}
                                            >
                                                <i className="bi bi-wrench"></i>
                                                Reportar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            {/* MODAL ASIGNACION DE USUARIO */}
            {modalAsignacion && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{display: 'block', zIndex: '1050'}}
                    onClick={() => setModalAsignacion(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Asignar Usuario</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalAsignacion(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <form>
                                    <div className="form-group mb-3">
                                        <label>Numero de Serie</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="num_serie"
                                            value={equipoSeleccionado.num_serie}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Usuario</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="usuario"
                                            value={usuarioAsignado}
                                            onChange={handleUsuarioChange}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalAsignacion(false)}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={asignarResponsable}
                                >
                                    Asignar Usuario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REPORTE FALLA */}
            {modalEquipo && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{display: 'block', zIndex: '1050'}}
                    onClick={() => setModalEquipo(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nuevo reporte de falla</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalEquipo(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <form>
                                    <div className="form-group mb-3">
                                        <label>Numero de Serie</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="num_serie"
                                            value={equipoSeleccionado.num_serie}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Falla del Equipo</label>
                                        <textarea
                                            className="form-control"
                                            name="falla"
                                            value={equipoSeleccionado.falla || ''}
                                            onChange={handleChange}
                                            rows="3"
                                        >
                                        </textarea>
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalEquipo(false)}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarReporteFalla}
                                >
                                    Enviar Reporte
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
