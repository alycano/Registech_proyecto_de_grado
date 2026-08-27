import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_ROUTES } from '../../api/apiRoutes'
import { toISODate } from '../../utils/equipoUtils'

export default function ModalRegistroEquipo({ areas, onClose, onRegistrado }) {
    const [guardando, setGuardando] = useState(false)
    const [nuevoEquipo, setNuevoEquipo] = useState({
        equipo: '', descripcion: '', sistema_operativo: '', num_serie: '',
        area: '', fecha_adquisicion: toISODate(new Date()), estado: 'Disponible'
    })

    const handleChange = (campo, valor) => {
        setNuevoEquipo(prev => ({ ...prev, [campo]: valor }))
    }

    const guardar = () => {
        if (!nuevoEquipo.equipo.trim() || !nuevoEquipo.num_serie.trim()) {
            Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'El nombre/modelo y el número de serie son obligatorios' })
            return
        }
        setGuardando(true)
        const formData = new FormData()
        Object.entries(nuevoEquipo).forEach(([campo, valor]) => formData.append(campo, valor || ''))

        axios.post(API_ROUTES.CREAR_EQUIPO, formData)
            .then(res => {
                setGuardando(false)
                Swal.fire({
                    icon: 'success', title: 'Equipo registrado',
                    html: `<strong>${res.data.equipo.equipo}</strong> ya está en el inventario`,
                    timer: 2500, showConfirmButton: false
                })
                onRegistrado(res.data.equipo)
            })
            .catch(err => {
                setGuardando(false)
                Swal.fire({ icon: 'error', title: 'Error al registrar', text: err.response?.data?.error || 'No se pudo registrar el equipo' })
            })
    }

    return (
        <div className="modal fade show d-block" tabIndex="-1"
            style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => !guardando && onClose()}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            <i className="bi bi-plus-circle me-2"></i>Registrar Equipo
                        </h5>
                        <button type="button" className="btn-close" onClick={() => !guardando && onClose()} disabled={guardando}></button>
                    </div>

                    <div className="modal-body">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="mb-2">
                                <label className="form-label fw-semibold mb-1">Nombre / Modelo del Equipo <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" placeholder="Ej. Dell XPS 13"
                                    value={nuevoEquipo.equipo} onChange={(e) => handleChange('equipo', e.target.value)}
                                    disabled={guardando} maxLength="100"
                                />
                            </div>

                            <div className="mb-2">
                                <label className="form-label fw-semibold mb-1">Especificaciones</label>
                                <textarea rows="2" className="form-control" placeholder="Procesador, memoria RAM, almacenamiento..."
                                    value={nuevoEquipo.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)}
                                    disabled={guardando} maxLength="500"
                                ></textarea>
                            </div>

                            <div className="row g-2 mb-2">
                                <div className="col-sm-6">
                                    <label className="form-label fw-semibold mb-1">Sistema Operativo</label>
                                    <input type="text" className="form-control" placeholder="Windows 11, macOS..."
                                        value={nuevoEquipo.sistema_operativo} onChange={(e) => handleChange('sistema_operativo', e.target.value)}
                                        disabled={guardando} maxLength="60"
                                    />
                                </div>
                                <div className="col-sm-6">
                                    <label className="form-label fw-semibold mb-1">Número de Serie (SN) <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control" placeholder="EQ-S26-XXX"
                                        value={nuevoEquipo.num_serie} onChange={(e) => handleChange('num_serie', e.target.value)}
                                        disabled={guardando} maxLength="50"
                                    />
                                </div>
                            </div>

                            <div className="row g-2 mb-2">
                                <div className="col-sm-6">
                                    <label className="form-label fw-semibold mb-1">Área</label>
                                    <select className="form-select" value={nuevoEquipo.area}
                                        onChange={(e) => handleChange('area', e.target.value)} disabled={guardando}
                                    >
                                        <option value="">Sin asignar</option>
                                        {areas.map(a => (
                                            <option key={a.area} value={a.area}>{a.area}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-sm-6">
                                    <label className="form-label fw-semibold mb-1">Fecha de adquisición</label>
                                    <input type="date" className="form-control"
                                        value={nuevoEquipo.fecha_adquisicion}
                                        onChange={(e) => handleChange('fecha_adquisicion', e.target.value)}
                                        disabled={guardando}
                                    />
                                </div>
                            </div>

                            <div className="mb-0">
                                <label className="form-label fw-semibold mb-1">Estado inicial</label>
                                <select className="form-select" value={nuevoEquipo.estado}
                                    onChange={(e) => handleChange('estado', e.target.value)} disabled={guardando}
                                >
                                    <option value="Disponible">Disponible</option>
                                    <option value="En mantenimiento">En mantenimiento</option>
                                    <option value="Baja">Baja</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
                        <button type="button" className="btn btn-success" onClick={guardar}
                            disabled={guardando || !nuevoEquipo.equipo.trim() || !nuevoEquipo.num_serie.trim()}
                        >
                            {guardando ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Registrando...</>
                            ) : (
                                <><i className="bi bi-check2-circle me-1"></i>Registrar Equipo</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
