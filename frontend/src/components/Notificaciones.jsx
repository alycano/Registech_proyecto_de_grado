import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Notificaciones = () => {
    const [notificaciones, setNotificaciones] = useState([])
    const [mostrar, setMostrar] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [fotoAmpliada, setFotoAmpliada] = useState(null)

    // ======================================================
    // CARGAR NOTIFICACIONES
    // ======================================================

    const cargarNotificaciones = async () => {
        try {
            const response = await axios.get(API_ROUTES.NOTIFICACIONES)
            setNotificaciones(response.data || [])
        } catch (error) {
            console.error("Error al cargar notificaciones:", error)
        }
    }

    // ======================================================
    // CARGAR AL INICIAR Y CADA 15 SEGUNDOS
    // ======================================================

    useEffect(() => {
        cargarNotificaciones()

        const intervalo = setInterval(() => {
            cargarNotificaciones()
        }, 15000)

        return () => clearInterval(intervalo)
    }, [])

    // ======================================================
    // MARCAR UNA NOTIFICACION COMO LEIDA
    // ======================================================

    const marcarComoLeida = async (id) => {
        try {
            await axios.patch(
                API_ROUTES.MARCAR_NOTIFICACION_LEIDA(id)
            )

            setNotificaciones(prev =>
                prev.map(notificacion =>
                    notificacion.id === id
                        ? { ...notificacion, leida: true }
                        : notificacion
                )
            )
        } catch (error) {
            console.error("Error al marcar notificación:", error)
        }
    }

    // ======================================================
    // MARCAR TODAS COMO LEIDAS
    // ======================================================

    const marcarTodasComoLeidas = async () => {
        try {
            await axios.patch(
                API_ROUTES.MARCAR_NOTIFICACIONES_LEIDAS
            )

            setNotificaciones(prev =>
                prev.map(notificacion => ({
                    ...notificacion,
                    leida: true
                }))
            )
        } catch (error) {
            console.error("Error al marcar notificaciones:", error)
        }
    }

    // ======================================================
    // ABRIR NOTIFICACION
    // ======================================================

    const abrirNotificacion = async (notificacion) => {
        if (!notificacion.leida) {
            await marcarComoLeida(notificacion.id)
        }

        if (notificacion.id_historial) {
            Swal.fire({
                icon: "info",
                title: notificacion.titulo,
                text: notificacion.mensaje,
                confirmButtonText: "Entendido"
            })
        }
    }

    const noLeidas = notificaciones.filter(
        notificacion => !notificacion.leida
    ).length

    return (
        <>
            {/* ==================================================
                CAMPANA
            ================================================== */}

            <div
                className="position-relative"
                style={{ display: "inline-block" }}
            >
                <button
                    type="button"
                    className="btn btn-link text-decoration-none position-relative"
                    onClick={() => setMostrar(!mostrar)}
                    title="Notificaciones"
                >
                    <i className="bi bi-bell fs-5"></i>

                    {noLeidas > 0 && (
                        <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{
                                fontSize: "0.65rem"
                            }}
                        >
                            {noLeidas > 99 ? "99+" : noLeidas}
                        </span>
                    )}
                </button>

                {/* ==================================================
                    PANEL DE NOTIFICACIONES
                ================================================== */}

                {mostrar && (
                    <>
                        {/* Fondo para cerrar al hacer clic afuera */}
                        <div
                            className="position-fixed top-0 start-0 w-100 h-100"
                            style={{
                                zIndex: 1040
                            }}
                            onClick={() => setMostrar(false)}
                        ></div>

                        <div
                            className="card shadow-lg position-absolute"
                            style={{
                                width: "380px",
                                maxWidth: "90vw",
                                right: 0,
                                top: "calc(100% + 10px)",
                                zIndex: 1050
                            }}
                        >
                            {/* CABECERA */}

                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>
                                        <i className="bi bi-bell me-2"></i>
                                        Notificaciones
                                    </strong>

                                    {noLeidas > 0 && (
                                        <span className="badge bg-danger ms-2">
                                            {noLeidas}
                                        </span>
                                    )}
                                </div>

                                {noLeidas > 0 && (
                                    <button
                                        className="btn btn-sm btn-link text-decoration-none"
                                        onClick={marcarTodasComoLeidas}
                                    >
                                        Marcar todas
                                    </button>
                                )}
                            </div>

                            {/* CONTENIDO */}

                            <div
                                style={{
                                    maxHeight: "450px",
                                    overflowY: "auto"
                                }}
                            >
                                {notificaciones.length === 0 ? (
                                    <div className="text-center py-5 text-secondary">
                                        <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
                                        <div>
                                            No tienes notificaciones
                                        </div>
                                    </div>
                                ) : (
                                    notificaciones.map(notificacion => (
                                        <div
                                            key={notificacion.id}
                                            className={`p-3 border-bottom ${
                                                !notificacion.leida
                                                    ? "bg-primary-subtle"
                                                    : ""
                                            }`}
                                            style={{
                                                cursor: "pointer"
                                            }}
                                            onClick={() =>
                                                abrirNotificacion(
                                                    notificacion
                                                )
                                            }
                                        >
                                            <div className="d-flex gap-3">

                                                {/* ICONO */}

                                                <div>
                                                    <div
                                                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                                                            !notificacion.leida
                                                                ? "bg-primary text-white"
                                                                : "bg-secondary-subtle text-secondary"
                                                        }`}
                                                        style={{
                                                            width: "40px",
                                                            height: "40px"
                                                        }}
                                                    >
                                                        <i
                                                            className={
                                                                notificacion.tipo ===
                                                                "mantenimiento"
                                                                    ? "bi bi-tools"
                                                                    : "bi bi-bell"
                                                            }
                                                        ></i>
                                                    </div>
                                                </div>

                                                {/* TEXTO */}

                                                <div className="flex-grow-1">

                                                    <div className="d-flex justify-content-between gap-2">

                                                        <strong
                                                            className="small"
                                                        >
                                                            {
                                                                notificacion.titulo
                                                            }
                                                        </strong>

                                                        {!notificacion.leida && (
                                                            <span
                                                                className="badge bg-primary"
                                                                style={{
                                                                    fontSize:
                                                                        "0.6rem"
                                                                }}
                                                            >
                                                                NUEVA
                                                            </span>
                                                        )}

                                                    </div>

                                                    <p className="small text-secondary mb-1">
                                                        {
                                                            notificacion.mensaje
                                                        }
                                                    </p>

                                                    <small className="text-muted">
                                                        {new Date(
                                                            notificacion.creado_en
                                                        ).toLocaleString(
                                                            "es-CO"
                                                        )}
                                                    </small>

                                                </div>

                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* PIE */}

                            {notificaciones.length > 0 && (
                                <div className="card-footer text-center">
                                    <small className="text-secondary">
                                        Actualización automática cada 15
                                        segundos
                                    </small>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ==================================================
                MODAL FOTO
            ================================================== */}

            {fotoAmpliada && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        background: "rgba(0,0,0,0.75)",
                        zIndex: 1060
                    }}
                    onClick={() => setFotoAmpliada(null)}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-centered"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-content bg-transparent border-0">

                            <div className="text-end mb-2">
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={() =>
                                        setFotoAmpliada(null)
                                    }
                                >
                                    <i className="bi bi-x-lg me-1"></i>
                                    Cerrar
                                </button>
                            </div>

                            <img
                                src={API_ROUTES.ARCHIVO_EVIDENCIA(
                                    fotoAmpliada
                                )}
                                alt="Evidencia"
                                className="img-fluid rounded shadow"
                            />

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Notificaciones