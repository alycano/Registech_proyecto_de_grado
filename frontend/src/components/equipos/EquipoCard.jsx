import { getEstadoClass, getEstadoLabel } from '../../utils/equipoUtils'

export default function EquipoCard({ equipo, onPrestamo, onDevolver, vencimiento }) {
    const textoAlerta = vencimiento?.tipo === 'vencido'
        ? `VENCIDO (${vencimiento.dias}d)`
        : vencimiento?.dias === 0
            ? 'Vence HOY'
            : `Vence en ${vencimiento?.dias}d`

    return (
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
                    onClick={() => onPrestamo(equipo)}
                >
                    Préstamo
                </button>
            )}

            {equipo.estado === 'Asignado' && (
                <div className="d-flex flex-column gap-2 mt-auto">
                    <div className="d-flex justify-content-between align-items-center p-2 rounded border" style={{ background: 'var(--bg-surface-2)' }}>
                        <span className="small fw-semibold text-truncate" style={{ maxWidth: '140px' }}>
                            {equipo.responsable || 'Sin responsable'}
                        </span>
                        <button
                            className="btn btn-sm btn-outline-success px-2 py-0"
                            onClick={() => onDevolver(equipo)}
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
            )}
        </div>
    )
}
