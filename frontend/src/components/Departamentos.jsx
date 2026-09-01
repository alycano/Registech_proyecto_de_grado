import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import { useAuth } from "../context/AuthContext"

const Departamentos = () => {
    const { usuario } = useAuth()
    const esAdmin = usuario?.rol === 'admin'

    const [areas, setAreas] = useState([])
    const [equipos, setEquipos] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal de crear / editar departamento
    const [modalAbierto, setModalAbierto] = useState(false)
    const [modoEdicion, setModoEdicion] = useState(null)
    const [nombreArea, setNombreArea] = useState('')
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        Promise.all([
            axios.get(API_ROUTES.OBTENER_AREAS).then(res => setAreas(res.data.map(a => a.area))),
            axios.get(API_ROUTES.EQUIPOS).then(res => setEquipos(res.data)),
            axios.get(API_ROUTES.OBTENER_USUARIOS).then(res => setUsuarios(res.data))
        ])
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los departamentos' })
            })
            .finally(() => setLoading(false))
    }, [])

    const contarEquipos = (area) => equipos.filter(e => e.area === area).length
    const contarUsuarios = (area) => usuarios.filter(u => u.area === area).length

    const abrirCrear = () => {
        setModoEdicion(null)
        setNombreArea('')
        setModalAbierto(true)
    }

    const abrirEditar = (area) => {
        setModoEdicion(area)
        setNombreArea(area)
        setModalAbierto(true)
    }

    const guardar = () => {
        if (!nombreArea.trim() || nombreArea.trim().length < 2) {
            Swal.fire({ icon: 'warning', title: 'Nombre inválido', text: 'Escribe un nombre de al menos 2 caracteres' })
            return
        }

        setGuardando(true)
        const peticion = modoEdicion
            ? axios.put(API_ROUTES.ACTUALIZAR_AREA(modoEdicion), { area: nombreArea.trim() })
            : axios.post(API_ROUTES.CREAR_AREA, { area: nombreArea.trim() })

        peticion
            .then(() => {
                setModalAbierto(false)
                Swal.fire({
                    icon: 'success',
                    title: modoEdicion ? 'Departamento actualizado' : 'Departamento creado',
                    timer: 2000,
                    showConfirmButton: false
                })
                return axios.get(API_ROUTES.OBTENER_AREAS).then(res => setAreas(res.data.map(a => a.area)))
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.error || 'No se pudo guardar el departamento'
                })
            })
            .finally(() => setGuardando(false))
    }

    const pluralizar = (n, palabra) => `${n} ${palabra}${n === 1 ? '' : 's'}`

    const eliminar = (area, nEquipos, nUsuarios) => {
        const enUso = nEquipos > 0 || nUsuarios > 0
        Swal.fire({
            icon: 'warning',
            title: enUso ? `No se puede eliminar ${area}` : `¿Eliminar ${area}?`,
            html: enUso
                ? `Este departamento tiene ${pluralizar(nEquipos, 'equipo')} y ${pluralizar(nUsuarios, 'usuario')} asignados.<br>Mueve o libera estos registros para poder eliminarlo.`
                : 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            allowOutsideClick: () => !Swal.isLoading()
        }).then(result => {
            if (!result.isConfirmed || enUso) return

            axios.delete(API_ROUTES.ELIMINAR_AREA(area))
                .then(() => {
                    setAreas(prev => prev.filter(a => a !== area))
                    Swal.fire({ icon: 'success', title: 'Departamento eliminado', timer: 1800, showConfirmButton: false })
                })
                .catch(err => {
                    Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err.response?.data?.error })
                })
        })
    }

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando departamentos...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Departamentos
                </h2>
                <div className="d-flex gap-2 align-items-center">
                    <span className="badge bg-primary-subtle text-primary-emphasis">{areas.length} departamentos</span>
                    {esAdmin && (
                        <button className="btn btn-sm btn-success rounded-pill" onClick={abrirCrear}>
                            <i className="bi bi-plus-lg me-1"></i>
                            Nuevo Departamento
                        </button>
                    )}
                </div>
            </div>

            <div className="row g-3">
                {areas.length === 0 ? (
                    <div className="col-12">
                        <div className="empty-state card">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-building fs-1 text-secondary"></i>
                                <p className="text-secondary mt-2 mb-0">No hay departamentos registrados</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    areas.map(area => {
                        const nEq = contarEquipos(area)
                        const nUs = contarUsuarios(area)
                        return (
                            <div className="col-md-4 col-sm-6" key={area}>
                                <div className="card border shadow-sm h-100">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="kpi-icon kpi-icon--primario">
                                                <i className="bi bi-building"></i>
                                            </div>
                                            {esAdmin && (
                                                <div className="d-flex gap-1">
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        title="Renombrar"
                                                        onClick={() => abrirEditar(area)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        title="Eliminar"
                                                        onClick={() => eliminar(area, nEq, nUs)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h6 className="fw-bold mb-3">{area}</h6>

                                        <div className="d-flex gap-3 mt-auto">
                                            <span className="small text-secondary">
                                                <i className="bi bi-pc-display me-1"></i>
                                                {nEq} equipo{nEq === 1 ? '' : 's'}
                                            </span>
                                            <span className="small text-secondary">
                                                <i className="bi bi-people me-1"></i>
                                                {nUs} usuario{nUs === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* MODAL CREAR / EDITAR DEPARTAMENTO */}
            {modalAbierto && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !guardando && setModalAbierto(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    {modoEdicion ? 'Renombrar Departamento' : 'Nuevo Departamento'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)} disabled={guardando}></button>
                            </div>

                            <div className="modal-body">
                                {modoEdicion && (
                                    <div className="alert alert-info py-2 small">
                                        Al renombrar se actualizan automáticamente los equipos y usuarios asignados.
                                    </div>
                                )}
                                <label className="form-label fw-semibold">Nombre del departamento</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej. Contabilidad"
                                    value={nombreArea}
                                    onChange={(e) => setNombreArea(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
                                    disabled={guardando}
                                    maxLength="100"
                                    autoFocus
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)} disabled={guardando}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn btn-success" onClick={guardar} disabled={guardando || !nombreArea.trim()}>
                                    {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Departamentos
