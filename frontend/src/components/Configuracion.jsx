import { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import { useAuth } from "../context/AuthContext"

const Configuracion = () => {
    const { usuario } = useAuth()

    const [contrasenaActual, setContrasenaActual] = useState('')
    const [contrasenaNueva, setContrasenaNueva] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [guardando, setGuardando] = useState(false)

    const [tema, setTema] = useState(() => localStorage.getItem('theme') || 'light')

    const iniciales = (usuario?.nombre || usuario?.usuario || 'U')
        .split(' ')
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const cambiarTema = (nuevo) => {
        setTema(nuevo)
        localStorage.setItem('theme', nuevo)
        document.documentElement.setAttribute('data-theme', nuevo)
        document.documentElement.setAttribute('data-bs-theme', nuevo)
        window.dispatchEvent(new CustomEvent('registech-theme', { detail: nuevo }))
    }

    const guardarPassword = (e) => {
        e.preventDefault()

        if (!contrasenaActual || !contrasenaNueva) {
            Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Completa la contraseña actual y la nueva' })
            return
        }
        const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/
        if (!PASSWORD_REGEX.test(contrasenaNueva)) {
            Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo (!@#$%^&* etc.)' })
            return
        }
        if (contrasenaNueva !== confirmar) {
            Swal.fire({ icon: 'warning', title: 'No coinciden', text: 'La confirmación no coincide con la nueva contraseña' })
            return
        }

        setGuardando(true)
        axios.post(API_ROUTES.CAMBIAR_PASSWORD, {
            contrasena_actual: contrasenaActual,
            contrasena_nueva: contrasenaNueva
        })
            .then(res => {
                setContrasenaActual('')
                setContrasenaNueva('')
                setConfirmar('')
                Swal.fire({ icon: 'success', title: 'Contraseña actualizada', text: res.data?.mensaje, timer: 2500, showConfirmButton: false })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.error || 'No se pudo cambiar la contraseña'
                })
            })
            .finally(() => setGuardando(false))
    }

    return (
        <div>
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Configuración
                </h2>
                <span className="badge bg-primary-subtle text-primary-emphasis">
                    Tu cuenta y preferencias
                </span>
            </div>

            <div className="row g-3">
                {/* PERFIL */}
                <div className="col-md-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-person-circle me-2"></i>
                                Mi Perfil
                            </h6>

                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div
                                    className="d-flex align-items-center justify-content-center fw-bold rounded-circle"
                                    style={{ width: '64px', height: '64px', background: 'var(--brand)', color: '#fff', fontSize: '1.4rem' }}
                                >
                                    {iniciales}
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0">{usuario?.nombre}</h5>
                                    <span className="text-secondary small">@{usuario?.usuario}</span>
                                </div>
                            </div>

                            <table className="table table-sm mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-secondary" style={{ width: '40%' }}>
                                            <i className="bi bi-envelope me-2"></i>Correo
                                        </td>
                                        <td>{usuario?.correo}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-secondary">
                                            <i className="bi bi-building me-2"></i>Rol
                                        </td>
                                        <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : ''}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* APARIENCIA */}
                <div className="col-md-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-palette me-2"></i>
                                Apariencia
                            </h6>

                            <p className="text-secondary small">Elige el tema de la aplicación.</p>

                            <div className="d-flex gap-2">
                                <button
                                    className={`btn ${tema === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => cambiarTema('light')}
                                >
                                    <i className="bi bi-sun me-1"></i>
                                    Claro
                                </button>
                                <button
                                    className={`btn ${tema === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => cambiarTema('dark')}
                                >
                                    <i className="bi bi-moon-stars me-1"></i>
                                    Oscuro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEGURIDAD */}
                <div className="col-md-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-shield-lock me-2"></i>
                                Cambiar Contraseña
                            </h6>

                            <form onSubmit={guardarPassword}>
                                <div className="mb-2">
                                    <label className="form-label fw-semibold small mb-1">Contraseña actual</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={contrasenaActual}
                                        onChange={(e) => setContrasenaActual(e.target.value)}
                                        disabled={guardando}
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="form-label fw-semibold small mb-1">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={contrasenaNueva}
                                        onChange={(e) => setContrasenaNueva(e.target.value)}
                                        disabled={guardando}
                                    />
                                    <small className="text-muted">Mínimo 6 caracteres</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold small mb-1">Confirmar nueva contraseña</label>
                                    <input
                                        type="password"
                                        className={`form-control ${confirmar && contrasenaNueva !== confirmar ? 'is-invalid' : ''}`}
                                        value={confirmar}
                                        onChange={(e) => setConfirmar(e.target.value)}
                                        disabled={guardando}
                                    />
                                    {confirmar && contrasenaNueva !== confirmar && (
                                        <div className="invalid-feedback">Las contraseñas no coinciden</div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={guardando || !contrasenaActual || !contrasenaNueva || contrasenaNueva !== confirmar}
                                >
                                    {guardando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            Actualizar Contraseña
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Configuracion
