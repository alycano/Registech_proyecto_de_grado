import { useState } from 'react'
import { getEstadoClass, getEstadoLabel, getEspecificaciones } from '../../utils/equipoUtils'
import { API_ROUTES } from '../../api/apiRoutes'

export default function EquipoCard({ equipo, onPrestamo, onDevolver, vencimiento }) {
    const [verDetalle, setVerDetalle] = useState(false)

    const textoAlerta = vencimiento?.tipo === 'vencido'
        ? `VENCIDO (${vencimiento.dias}d)`
        : vencimiento?.dias === 0
            ? 'Vence HOY'
            : `Vence en ${vencimiento?.dias}d`

    const imagen = equipo.imagen ? API_ROUTES.ARCHIVO_EVIDENCIA(equipo.imagen) : null
    const especificaciones = getEspecificaciones(equipo)

    const AccionesDetalle = (
        <>
            {equipo.estado === 'Disponible' && (
                <button
                    className="btn btn-success"
                    onClick={() => { setVerDetalle(false); onPrestamo(equipo) }}
                >
                    <i className="bi bi-arrow-return-right me-1"></i>Registrar Préstamo
                </button>
            )}
            {equipo.estado === 'Asignado' && (
                <button
                    className="btn btn-success"
                    onClick={() => { setVerDetalle(false); onDevolver(equipo) }}
                >
                    <i className="bi bi-arrow-return-left me-1"></i>Registrar Devolución
                </button>
            )}
        </>
    )

    return (
        <>
            <div className={`equipo-card h-100 ${equipo.estado === 'Baja' ? 'equipo-card--baja' : ''}`}>
                <div className="equipo-card__visual">
                    {imagen ? (
                        <img
                            src={imagen}
                            alt={equipo.equipo}
                            className="equipo-card__img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    ) : (
                        <i className="bi bi-pc-display"></i>
                    )}
                    <span className={`badge equipo-card__badge ${getEstadoClass(equipo.estado)}`}>
                        {getEstadoLabel(equipo.estado)}
                    </span>
                </div>

                <div className="equipo-card__body d-flex flex-column flex-grow-1">
                    <div className="equipo-card__titulo">{equipo.equipo}</div>
                    <div className="equipo-card__meta mb-2">
                        <span className="dept-tag">{equipo.area}</span>
                        <code className="equipo-card__ns">{equipo.num_serie}</code>
                    </div>
                    <p className="equipo-card__specs">{equipo.descripcion || 'Sin especificaciones registradas'}</p>

                    <div className="mt-auto">
                        <div className="d-flex gap-2 mb-2">
                            <button className="btn btn-sm btn-primary flex-grow-1" onClick={() => setVerDetalle(true)}>
                                <i className="bi bi-info-circle me-1"></i>Ver detalles
                            </button>
                            {equipo.estado === 'Disponible' && (
                                <button className="btn btn-sm btn-success" onClick={() => onPrestamo(equipo)}>
                                    <i className="bi bi-arrow-return-right me-1"></i>Préstamo
                                </button>
                            )}
                        </div>

                        {equipo.estado === 'Asignado' && (
                            <div className="equipo-card__responsable justify-content-between">
                                <span className="text-truncate" style={{ maxWidth: '135px' }}>
                                    <i className="bi bi-person-fill"></i>
                                    {equipo.responsable || 'Sin responsable'}
                                </span>
                                <button
                                    className="btn btn-sm btn-success px-2 py-0"
                                    onClick={() => onDevolver(equipo)}
                                    title="Registrar devolución"
                                >
                                    <i className="bi bi-arrow-return-left me-1"></i>Devolver
                                </button>
                            </div>
                        )}

                        {vencimiento && (
                            <div className={`small p-1 rounded text-center fw-bold mt-2 ${vencimiento.tipo === 'vencido' ? 'equipo-card__alerta--vencido' : 'equipo-card__alerta--pronto'}`}>
                                {textoAlerta} — {vencimiento.fecha.toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {verDetalle && (
                <div className="modal fade show d-block" role="dialog" tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setVerDetalle(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Detalles del Equipo</h5>
                                <button type="button" className="btn-close" onClick={() => setVerDetalle(false)}></button>
                            </div>

                            <div className="modal-body p-0">
                                <div className="d-flex align-items-center gap-3 p-4" style={{ background: 'var(--bg-surface-2)' }}>
                                    <div className="prestamo-modal__imagen mb-0 flex-shrink-0">
                                        {imagen ? (
                                            <img src={imagen} alt={equipo.equipo} loading="lazy"
                                                onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                        ) : (
                                            <i className="bi bi-pc-display"></i>
                                        )}
                                    </div>
                                    <div>
                                        <div className="fw-bold fs-5">{equipo.equipo}</div>
                                        <div>
                                            <span className={`badge ${getEstadoClass(equipo.estado)}`}>
                                                {getEstadoLabel(equipo.estado)}
                                            </span>
                                        </div>
                                        <div className="small text-muted mt-1">{equipo.area} • <code>{equipo.num_serie}</code></div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="fw-bold small text-muted text-uppercase mb-2">Ficha Técnica</div>
                                    <ul className="prestamo-modal__specs">
                                        {equipo.sistema_operativo && (
                                            <li><i className="bi bi-windows"></i>{equipo.sistema_operativo}</li>
                                        )}
                                        {especificaciones.map((spec, i) => (
                                            <li key={i}><i className="bi bi-check2-circle text-success"></i>{spec}</li>
                                        ))}
                                        {especificaciones.length === 0 && !equipo.sistema_operativo && (
                                            <li className="text-muted">Sin especificaciones registradas</li>
                                        )}
                                    </ul>

                                    <div className="prestamo-modal__ficha-row">
                                        <span>Responsable</span>
                                        <strong>{equipo.responsable || 'Sin asignar'}</strong>
                                    </div>
                                    <div className="prestamo-modal__ficha-row">
                                        <span>Fecha de adquisición</span>
                                        <strong>{equipo.fecha_adquisicion ? String(equipo.fecha_adquisicion).substring(0, 10) : 'No registrada'}</strong>
                                    </div>
                                    <div className="prestamo-modal__ficha-row">
                                        <span>Fecha de asignación</span>
                                        <strong>{equipo.fecha_asignacion ? String(equipo.fecha_asignacion).substring(0, 10) : 'No registrada'}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setVerDetalle(false)}>Cerrar</button>
                                {AccionesDetalle}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}