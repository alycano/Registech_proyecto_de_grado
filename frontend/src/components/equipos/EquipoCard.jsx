import { useState, useEffect } from 'react'
import axios from 'axios'
import { getEstadoClass, getEstadoLabel, getEspecificaciones } from '../../utils/equipoUtils'
import { API_ROUTES } from '../../api/apiRoutes'

export default function EquipoCard({ equipo, onPrestamo, onDevolver, vencimiento }) {
    const [verDetalle, setVerDetalle] = useState(false)
    const [historial, setHistorial] = useState([])
    const [cargandoHistorial, setCargandoHistorial] = useState(false)
    const [errorHistorial, setErrorHistorial] = useState('')

    const textoAlerta = vencimiento?.tipo === 'vencido'
        ? `VENCIDO (${vencimiento.dias}d)`
        : vencimiento?.dias === 0
            ? 'Vence HOY'
            : `Vence en ${vencimiento?.dias}d`

    const imagen = equipo.imagen
        ? API_ROUTES.ARCHIVO_EVIDENCIA(equipo.imagen)
        : null

    const especificaciones = getEspecificaciones(equipo)

    // ======================================================
    // CARGAR HISTORIAL DE USO
    // ======================================================

    useEffect(() => {
        if (!verDetalle) return

        const cargarHistorial = async () => {
            try {
                setCargandoHistorial(true)
                setErrorHistorial('')

                const response = await axios.get(
                    API_ROUTES.HISTORIAL_EQUIPO(equipo.num_serie)
                )

                setHistorial(response.data || [])
            } catch (error) {
                console.error('Error al cargar historial:', error)
                setErrorHistorial(
                    'No se pudo cargar el historial de uso.'
                )
            } finally {
                setCargandoHistorial(false)
            }
        }

        cargarHistorial()
    }, [verDetalle, equipo.num_serie])

    // ======================================================
    // ACCIONES DEL MODAL
    // ======================================================

    const AccionesDetalle = (
        <>
            {equipo.estado === 'Disponible' && (
                <button
                    className="btn btn-success"
                    onClick={() => {
                        setVerDetalle(false)
                        onPrestamo(equipo)
                    }}
                >
                    <i className="bi bi-arrow-return-right me-1"></i>
                    Registrar Préstamo
                </button>
            )}

            {equipo.estado === 'Asignado' && (
                <button
                    className="btn btn-success"
                    onClick={() => {
                        setVerDetalle(false)
                        onDevolver(equipo)
                    }}
                >
                    <i className="bi bi-arrow-return-left me-1"></i>
                    Registrar Devolución
                </button>
            )}
        </>
    )

    return (
        <>
            {/* ======================================================
                TARJETA DEL EQUIPO
            ====================================================== */}

            <div
                className={`equipo-card h-100 ${
                    equipo.estado === 'Baja'
                        ? 'equipo-card--baja'
                        : ''
                }`}
            >
                <div className="equipo-card__visual">
                    {imagen ? (
                        <img
                            src={imagen}
                            alt={equipo.equipo}
                            className="equipo-card__img"
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    ) : (
                        <i className="bi bi-pc-display"></i>
                    )}

                    <span
                        className={`badge equipo-card__badge ${getEstadoClass(
                            equipo.estado
                        )}`}
                    >
                        {getEstadoLabel(equipo.estado)}
                    </span>
                </div>

                <div className="equipo-card__body d-flex flex-column flex-grow-1">
                    <div className="equipo-card__titulo">
                        {equipo.equipo}
                    </div>

                    <div className="equipo-card__meta mb-2">
                        <span className="dept-tag">
                            {equipo.area}
                        </span>

                        <code className="equipo-card__ns">
                            {equipo.num_serie}
                        </code>
                    </div>

                    <p className="equipo-card__specs">
                        {equipo.descripcion ||
                            'Sin especificaciones registradas'}
                    </p>

                    <div className="mt-auto">
                        <div className="d-flex gap-2 mb-2">
                            <button
                                className="btn btn-sm btn-primary flex-grow-1"
                                onClick={() => setVerDetalle(true)}
                            >
                                <i className="bi bi-info-circle me-1"></i>
                                Ver detalles
                            </button>

                            {equipo.estado === 'Disponible' && (
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => onPrestamo(equipo)}
                                >
                                    <i className="bi bi-arrow-return-right me-1"></i>
                                    Préstamo
                                </button>
                            )}
                        </div>

                        {equipo.estado === 'Asignado' && (
                            <div className="equipo-card__responsable justify-content-between">
                                <span
                                    className="text-truncate"
                                    style={{ maxWidth: '135px' }}
                                >
                                    <i className="bi bi-person-fill"></i>
                                    {equipo.responsable ||
                                        'Sin responsable'}
                                </span>

                                <button
                                    className="btn btn-sm btn-success px-2 py-0"
                                    onClick={() => onDevolver(equipo)}
                                    title="Registrar devolución"
                                >
                                    <i className="bi bi-arrow-return-left me-1"></i>
                                    Devolver
                                </button>
                            </div>
                        )}

                        {vencimiento && (
                            <div
                                className={`small p-1 rounded text-center fw-bold mt-2 ${
                                    vencimiento.tipo === 'vencido'
                                        ? 'equipo-card__alerta--vencido'
                                        : 'equipo-card__alerta--pronto'
                                }`}
                            >
                                {textoAlerta} —{' '}
                                {vencimiento.fecha.toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ======================================================
                MODAL DETALLES
            ====================================================== */}

            {verDetalle && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{
                        display: 'block',
                        zIndex: '1050',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    onClick={() => setVerDetalle(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        style={{ maxWidth: '540px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">

                            {/* ==================================================
                                ENCABEZADO
                            ================================================== */}

                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Detalles del Equipo
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setVerDetalle(false)}
                                ></button>
                            </div>

                            {/* ==================================================
                                CUERPO
                            ================================================== */}

                            <div
                                className="modal-body p-0"
                                style={{
                                    maxHeight: '75vh',
                                    overflowY: 'auto'
                                }}
                            >

                                {/* INFORMACIÓN PRINCIPAL */}

                                <div
                                    className="d-flex align-items-center gap-3 p-4"
                                    style={{
                                        background: 'var(--bg-surface-2)'
                                    }}
                                >
                                    <div className="prestamo-modal__imagen mb-0 flex-shrink-0">
                                        {imagen ? (
                                            <img
                                                src={imagen}
                                                alt={equipo.equipo}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <i className="bi bi-pc-display"></i>
                                        )}
                                    </div>

                                    <div>
                                        <div className="fw-bold fs-5">
                                            {equipo.equipo}
                                        </div>

                                        <div>
                                            <span
                                                className={`badge ${getEstadoClass(
                                                    equipo.estado
                                                )}`}
                                            >
                                                {getEstadoLabel(
                                                    equipo.estado
                                                )}
                                            </span>
                                        </div>

                                        <div className="small text-muted mt-1">
                                            {equipo.area} •{' '}
                                            <code>{equipo.num_serie}</code>
                                        </div>
                                    </div>
                                </div>

                                {/* FICHA TÉCNICA */}

                                <div className="p-4">
                                    <div className="fw-bold small text-muted text-uppercase mb-2">
                                        Ficha Técnica
                                    </div>

                                    <ul className="prestamo-modal__specs">
                                        {equipo.sistema_operativo && (
                                            <li>
                                                <i className="bi bi-windows"></i>
                                                {equipo.sistema_operativo}
                                            </li>
                                        )}

                                        {especificaciones.map(
                                            (spec, i) => (
                                                <li key={i}>
                                                    <i className="bi bi-check2-circle text-success"></i>
                                                    {spec}
                                                </li>
                                            )
                                        )}

                                        {especificaciones.length === 0 &&
                                            !equipo.sistema_operativo && (
                                                <li className="text-muted">
                                                    Sin especificaciones
                                                    registradas
                                                </li>
                                            )}
                                    </ul>

                                    <div className="prestamo-modal__ficha-row">
                                        <span>Responsable</span>

                                        <strong>
                                            {equipo.responsable ||
                                                'Sin asignar'}
                                        </strong>
                                    </div>

                                    <div className="prestamo-modal__ficha-row">
                                        <span>Fecha de adquisición</span>

                                        <strong>
                                            {equipo.fecha_adquisicion
                                                ? String(
                                                      equipo.fecha_adquisicion
                                                  ).substring(0, 10)
                                                : 'No registrada'}
                                        </strong>
                                    </div>

                                    <div className="prestamo-modal__ficha-row">
                                        <span>Fecha de asignación</span>

                                        <strong>
                                            {equipo.fecha_asignacion
                                                ? String(
                                                      equipo.fecha_asignacion
                                                  ).substring(0, 10)
                                                : 'No registrada'}
                                        </strong>
                                    </div>

                                    {/* ==================================================
                                        HISTORIAL DE USO
                                    ================================================== */}

                                    <div className="mt-4 pt-3 border-top">

                                        <div className="fw-bold small text-muted text-uppercase mb-3">
                                            <i className="bi bi-clock-history me-2"></i>
                                            Historial de uso
                                        </div>

                                        {/* CARGANDO */}

                                        {cargandoHistorial && (
                                            <div className="text-center py-3">
                                                <div
                                                    className="spinner-border spinner-border-sm text-primary"
                                                    role="status"
                                                ></div>

                                                <div className="small text-muted mt-2">
                                                    Cargando historial...
                                                </div>
                                            </div>
                                        )}

                                        {/* ERROR */}

                                        {!cargandoHistorial &&
                                            errorHistorial && (
                                                <div className="alert alert-danger small mb-0">
                                                    <i className="bi bi-exclamation-circle me-2"></i>
                                                    {errorHistorial}
                                                </div>
                                            )}

                                        {/* SIN HISTORIAL */}

                                        {!cargandoHistorial &&
                                            !errorHistorial &&
                                            historial.length === 0 && (
                                                <div className="text-center text-muted py-3">
                                                    <i className="bi bi-clock-history fs-3 d-block mb-2"></i>

                                                    <div className="small">
                                                        Este equipo no tiene
                                                        historial de uso
                                                        registrado.
                                                    </div>
                                                </div>
                                            )}

                                        {/* HISTORIAL */}

                                        {!cargandoHistorial &&
                                            !errorHistorial &&
                                            historial.length > 0 && (
                                                <div className="d-flex flex-column gap-3">

                                                    {historial.map(
                                                        (
                                                            registro,
                                                            index
                                                        ) => {
                                                            const estaActivo =
                                                                !registro.fecha_devolucion ||
                                                                String(
                                                                    registro.estado
                                                                ).toLowerCase() ===
                                                                    'activo'

                                                            return (
                                                                <div
                                                                    key={`${registro.id_prestamo}-${index}`}
                                                                    className="border rounded p-3"
                                                                >

                                                                    {/* USUARIO */}

                                                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                                                        <div>
                                                                            <div className="fw-bold">
                                                                                <i className="bi bi-person-circle me-2"></i>

                                                                                {registro.nombre ||
                                                                                    registro.usuario ||
                                                                                    'Usuario no registrado'}
                                                                            </div>

                                                                            <div className="small text-muted mt-1">
                                                                                @
                                                                                {registro.usuario ||
                                                                                    'Sin usuario'}
                                                                            </div>
                                                                        </div>

                                                                        {estaActivo ? (
                                                                            <span className="badge bg-success">
                                                                                En uso
                                                                            </span>
                                                                        ) : (
                                                                            <span className="badge bg-secondary">
                                                                                Devuelto
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* INFORMACIÓN DEL USUARIO */}

                                                                    <div className="small mt-3">

                                                                        {registro.correo && (
                                                                            <div className="mb-1">
                                                                                <i className="bi bi-envelope me-2 text-muted"></i>
                                                                                {
                                                                                    registro.correo
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        {registro.area_usuario && (
                                                                            <div className="mb-1">
                                                                                <i className="bi bi-building me-2 text-muted"></i>
                                                                                {
                                                                                    registro.area_usuario
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        {registro.rol && (
                                                                            <div>
                                                                                <i className="bi bi-person-badge me-2 text-muted"></i>
                                                                                {
                                                                                    registro.rol
                                                                                }
                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                    {/* FECHAS */}

                                                                    <div className="mt-3 pt-2 border-top small">

                                                                        <div className="d-flex justify-content-between">
                                                                            <span className="text-muted">
                                                                                <i className="bi bi-calendar-check me-2"></i>
                                                                                Préstamo
                                                                            </span>

                                                                            <strong>
                                                                                {registro.fecha_prestamo
                                                                                    ? String(
                                                                                          registro.fecha_prestamo
                                                                                      ).substring(
                                                                                          0,
                                                                                          10
                                                                                      )
                                                                                    : 'No registrada'}
                                                                            </strong>
                                                                        </div>

                                                                        <div className="d-flex justify-content-between mt-2">
                                                                            <span className="text-muted">
                                                                                <i className="bi bi-calendar-x me-2"></i>
                                                                                Devolución
                                                                            </span>

                                                                            <strong>
                                                                                {registro.fecha_devolucion
                                                                                    ? String(
                                                                                          registro.fecha_devolucion
                                                                                      ).substring(
                                                                                          0,
                                                                                          10
                                                                                      )
                                                                                    : 'Actualmente'}
                                                                            </strong>
                                                                        </div>

                                                                    </div>

                                                                    {/* OBSERVACIONES */}

                                                                    {registro.observaciones && (
                                                                        <div className="small text-muted mt-3">
                                                                            <i className="bi bi-chat-left-text me-2"></i>
                                                                            {
                                                                                registro.observaciones
                                                                            }
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            )
                                                        }
                                                    )}

                                                </div>
                                            )}

                                    </div>
                                </div>
                            </div>

                            {/* ==================================================
                                FOOTER
                            ================================================== */}

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setVerDetalle(false)}
                                >
                                    Cerrar
                                </button>

                                {AccionesDetalle}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}