import { useState, useEffect, useCallback } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import { toISODate } from "../utils/equipoUtils"
import EquipoCard from "./equipos/EquipoCard"
import ModalPrestamo from "./equipos/ModalPrestamo"
import ModalRegistroEquipo from "./equipos/ModalRegistroEquipo"

const Equipos = ({ usuario }) => {
    const [equipos, setEquipos] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [areas, setAreas] = useState([])
    const [prestamosActivos, setPrestamosActivos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalPrestamo, setModalPrestamo] = useState(false)
    const [equipoSeleccionado, setEquipoSeleccionado] = useState({})
    const [modalRegistro, setModalRegistro] = useState(false)

    const [filter, setFilter] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const location = useLocation()

    const cargarDatos = useCallback(() => {
        setLoading(true)
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

    useEffect(() => {
        cargarDatos()
    }, [location.pathname, cargarDatos])

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando equipos...</div>
            </div>
        )
    }

    if (error) {
        return <div className="alert alert-danger text-center">{error}</div>
    }

    const filteredEquipos = equipos.filter(equipo => {
        const matchTexto = equipo.num_serie?.toLowerCase().includes(filter.toLowerCase()) ||
            equipo.responsable?.toLowerCase().includes(filter.toLowerCase()) ||
            equipo.equipo?.toLowerCase().includes(filter.toLowerCase())
        const matchEstado = !filtroEstado || equipo.estado === filtroEstado
        return matchTexto && matchEstado
    })

    const getVencimiento = (numSerie) => {
        const prestamo = prestamosActivos.find(p => p.num_serie === numSerie)
        if (!prestamo?.fecha_devolucion) return null
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const limite = new Date(`${String(prestamo.fecha_devolucion).substring(0, 10)}T00:00:00`)
        const dias = Math.round((limite - hoy) / 86400000)
        if (dias < 0) return { tipo: 'vencido', dias: Math.abs(dias), fecha: limite }
        if (dias <= 2) return { tipo: 'por_vencer', dias, fecha: limite }
        return null
    }

    const abrirModalPrestamo = (equipo) => {
        setEquipoSeleccionado({ ...equipo })
        setModalPrestamo(true)
    }

    const devolverEquipo = async (equipo) => {
        let prestamo
        try {
            const res = await axios.get(API_ROUTES.PRESTAMOS_ACTIVOS_POR_EQUIPO(equipo.num_serie))
            prestamo = res.data
        } catch {
            Swal.fire({ icon: 'warning', title: 'Sin préstamo activo', text: 'No se encontró un préstamo activo para este equipo' })
            return
        }
        Swal.fire({
            icon: 'question', title: '¿Registrar devolución?',
            html: `<strong>${equipo.equipo}</strong> volverá a estar <span class="text-success fw-bold">Disponible</span>`,
            showCancelButton: true, confirmButtonText: '<i class="bi bi-arrow-return-left me-1"></i>Sí, devolver',
            cancelButtonText: 'Cancelar', confirmButtonColor: '#16a34a'
        }).then(result => {
            if (!result.isConfirmed) return
            axios.post(API_ROUTES.DEVOLVER_PRESTAMO(prestamo.id_prestamo))
            .then(() => {
                cargarDatos()
                Swal.fire({ icon: 'success', title: 'Devolución registrada', text: `${equipo.equipo} está disponible nuevamente`, timer: 2500, showConfirmButton: false })
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Error al devolver', text: err.response?.data?.error || 'Hubo un error al registrar la devolución' })
            })
        })
    }

    const handlePrestamoConfirmado = async () => {
        setModalPrestamo(false)
        cargarDatos()
    }

    const handleEquipoRegistrado = (nuevoEquipo) => {
        setModalRegistro(false)
        setEquipos(prev => [nuevoEquipo, ...prev])
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">Inventario de Equipos</h4>
                    <div className="d-flex gap-2 align-items-center">
                        <span className="badge text-bg-primary">{equipos.length} registros</span>
                        <button className="btn btn-sm btn-success rounded-pill" onClick={() => setModalRegistro(true)}>
                            <i className="bi bi-plus-lg me-1"></i>Agregar Equipo
                        </button>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="row g-2">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-search"></i></span>
                                <input type="text" className="form-control"
                                    placeholder="Buscar por numero de serie, equipo o responsable..."
                                    value={filter} onChange={(e) => setFilter(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                <option value="">Todos los estados</option>
                                <option value="Disponible">Disponible</option>
                                <option value="Asignado">En Préstamo</option>
                                <option value="En mantenimiento">En mantenimiento</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>
                </div>

                {filteredEquipos.length === 0 ? (
                    <div className="empty-state">
                        <p className="text-muted my-3">No se encontraron equipos</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredEquipos.map(equipo => (
                            <div className="col-xl-4 col-md-6" key={equipo.num_serie}>
                                <EquipoCard
                                    equipo={equipo}
                                    onPrestamo={abrirModalPrestamo}
                                    onDevolver={devolverEquipo}
                                    vencimiento={getVencimiento(equipo.num_serie)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {modalPrestamo && (
                    <ModalPrestamo
                        equipo={equipoSeleccionado}
                        usuarios={usuarios}
                        areas={areas}
                        onClose={() => setModalPrestamo(false)}
                        onConfirmado={handlePrestamoConfirmado}
                    />
                )}

                {modalRegistro && (
                    <ModalRegistroEquipo
                        areas={areas}
                        onClose={() => setModalRegistro(false)}
                        onRegistrado={handleEquipoRegistrado}
                    />
                )}
            </div>
        </div>
    )
}

export default Equipos
