import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_ROUTES } from '../../api/apiRoutes'
import { toISODate, getEspecificaciones } from '../../utils/equipoUtils'

export default function ModalPrestamo({ equipo, usuarios, areas, onClose, onConfirmado }) {
    const [usuarioDestino, setUsuarioDestino] = useState('')
    const [areaPrestamo, setAreaPrestamo] = useState(equipo.area || '')
    const [fechaInicio, setFechaInicio] = useState(toISODate(new Date()))
    const [fechaLimite, setFechaLimite] = useState(toISODate(new Date(Date.now() + 7 * 86400000)))
    const [enviarCorreo, setEnviarCorreo] = useState(true)
    const [enviando, setEnviando] = useState(false)

    const calcularDiasPrestamo = () => {
        if (!fechaInicio || !fechaLimite) return null
        const ini = new Date(`${fechaInicio}T00:00:00`)
        const fin = new Date(`${fechaLimite}T00:00:00`)
        const diff = Math.round((fin - ini) / 86400000)
        return diff < 0 ? 0 : diff + 1
    }

    const confirmarPrestamo = () => {
        if (!usuarioDestino) {
            Swal.fire({ icon: 'warning', title: 'Selecciona un usuario', text: 'Debes elegir el usuario al que se le asigna el equipo' })
            return
        }
        setEnviando(true)
        const observacionesAuto = `Prestamo del ${fechaInicio} al ${fechaLimite}`

        axios.post(API_ROUTES.PRESTAMOS, {
            num_serie: equipo.num_serie,
            usuario_destino: usuarioDestino,
            fecha_inicio: fechaInicio,
            fecha_limite: fechaLimite,
            observaciones: observacionesAuto
        })
        .then(() => {
            setEnviando(false)
            Swal.fire({
                icon: 'success',
                title: 'Préstamo confirmado',
                html: enviarCorreo
                    ? `El equipo fue asignado correctamente.<br><small class="text-muted">Se envió el recibo por correo electrónico al usuario</small>`
                    : 'El equipo fue asignado correctamente.',
                timer: 3000,
                showConfirmButton: false
            })
            onConfirmado()
        })
        .catch(err => {
            setEnviando(false)
            const msg = err.response?.data?.error || 'Hubo un error al registrar el préstamo'
            Swal.fire({ icon: 'error', title: 'Error al confirmar préstamo', text: msg })
        })
    }

    return (
        <div className="modal fade show d-block" role="dialog" tabIndex="-1"
            style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => !enviando && onClose()}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Resumen del Préstamo de Equipo</h5>
                        <button type="button" className="btn-close" onClick={() => !enviando && onClose()} disabled={enviando}></button>
                    </div>

                    <div className="modal-body p-0">
                        <div className="row g-0">
                            <div className="col-md-5 p-4 border-end" style={{ background: 'var(--bg-surface-2)' }}>
                                <h5 className="fw-bold mb-1">{equipo.equipo}</h5>
                                <span className="badge estado-disponible mb-3">{equipo.area}</span>
                                <div className="card p-3 border mb-3" style={{ background: 'var(--bg-surface)' }}>
                                    <div className="fw-bold small text-muted text-uppercase mb-2">Ficha Técnica</div>
                                    <ul className="list-unstyled mb-2">
                                        {equipo.sistema_operativo && (
                                            <li className="text-secondary small py-1 border-bottom">
                                                <i className="bi bi-windows me-1"></i>{equipo.sistema_operativo}
                                            </li>
                                        )}
                                        {getEspecificaciones(equipo).map((spec, i) => (
                                            <li key={i} className="text-secondary small py-1 border-bottom">{spec}</li>
                                        ))}
                                        {getEspecificaciones(equipo).length === 0 && (
                                            <li className="text-muted small">Sin especificaciones registradas</li>
                                        )}
                                    </ul>
                                    <div className="d-flex justify-content-between align-items-center pt-2">
                                        <span className="text-muted small">Número de Serie:</span>
                                        <code className="fw-bold">{equipo.num_serie}</code>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-7 p-4">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Usuario Asignado</label>
                                        <select className="form-select" value={usuarioDestino}
                                            onChange={(e) => {
                                                setUsuarioDestino(e.target.value)
                                                const u = usuarios.find(x => x.nombre === e.target.value)
                                                if (u && u.area) setAreaPrestamo(u.area)
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
                                        <select className="form-select" value={areaPrestamo} onChange={(e) => setAreaPrestamo(e.target.value)}>
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
                                            <input type="date" className="form-control" value={fechaInicio} min={toISODate(new Date())}
                                                onChange={(e) => {
                                                    setFechaInicio(e.target.value)
                                                    if (fechaLimite < e.target.value) setFechaLimite(e.target.value)
                                                }}
                                            />
                                            <small className="text-muted">Fecha Inicio</small>
                                        </div>
                                        <div className="col-6">
                                            <input type="date" className="form-control" value={fechaLimite} min={fechaInicio}
                                                onChange={(e) => setFechaLimite(e.target.value)}
                                            />
                                            <small className="text-muted">Fecha Límite</small>
                                        </div>
                                    </div>

                                    <div className="notificacion-check">
                                        <div className="form-check mb-0">
                                            <input className="form-check-input" type="checkbox" id="checkCorreo"
                                                checked={enviarCorreo} onChange={(e) => setEnviarCorreo(e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="checkCorreo">
                                                Enviar recibo por correo electrónico al usuario
                                            </label>
                                        </div>
                                        {enviarCorreo && (() => {
                                            const usuarioObj = usuarios.find(u => u.nombre === usuarioDestino)
                                            return usuarioObj?.correo ? (
                                                <div className="small text-muted mt-2">
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
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>Cancelar</button>
                        <button type="button" className="btn btn-success" onClick={confirmarPrestamo} disabled={enviando}>
                            {enviando ? 'Confirmando...' : 'Confirmar Préstamo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
