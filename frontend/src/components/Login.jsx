
import { useState, useEffect } from "react"
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import Swal from 'sweetalert2'
import { API_ROUTES } from "../api/apiRoutes"
import { useAuth } from "../context/AuthContext"

// Cuentas de demostración para la sustentación (credenciales reales de la BD, verificadas).
const CUENTAS_DEMO = [
    { rol: 'Administrador', icono: 'bi-shield-lock', correo: 'admin@registech.com', contrasena: 'admin123' },
    { rol: 'Sistemas', icono: 'bi-gear', correo: 'soporte@registech.com', contrasena: 'soporte123' },
    { rol: 'Inventario', icono: 'bi-box-seam', correo: 'rh@registech.com', contrasena: 'rh123' },
]

const Login = () => {
    const [correo, setCorreo] = useState("")
    const [contrasena, setContrasena] = useState("")
    const [loading, setLoading] = useState(false)
    const [verPassword, setVerPassword] = useState(false)
    const [recordarme, setRecordarme] = useState(false)
    const [dropdownDemo, setDropdownDemo] = useState(false)

    const [modalRecuperar, setModalRecuperar] = useState(false)
    const [pasoRecuperacion, setPasoRecuperacion] = useState(1)
    const [correoRecuperacion, setCorreoRecuperacion] = useState("")
    const [codigoRecuperacion, setCodigoRecuperacion] = useState("")
    const [codigoDemoGenerado, setCodigoDemoGenerado] = useState("")
    const [nuevaContrasena, setNuevaContrasena] = useState("")
    const [confirmarContrasena, setConfirmarContrasena] = useState("")
    const [verNuevaPassword, setVerNuevaPassword] = useState(false)
    const [loadingRecuperar, setLoadingRecuperar] = useState(false)

    const navigate = useNavigate()
    const { login } = useAuth()

    useEffect(() => {
        const correoGuardado = localStorage.getItem('registech_recordar_correo')
        if (correoGuardado) {
            setCorreo(correoGuardado)
            setRecordarme(true)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!correo.trim() || !contrasena) {
            Swal.fire({
                icon: 'error',
                title: 'Campos requeridos',
                text: 'Correo y contraseña son requeridos'
            })
            return
        }

        setLoading(true)

        try {
            const response = await axios.post(
                API_ROUTES.LOGIN,
                {
                    correo: correo.trim(),
                    contrasena
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )

            if (response.status === 200) {
                if (response.data.usuario?.estado === 'inactivo') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cuenta inactiva',
                        text: 'Tu cuenta está inactiva. Contacta al administrador'
                    })
                    return
                }

                if (recordarme) {
                    localStorage.setItem('registech_recordar_correo', correo.trim())
                } else {
                    localStorage.removeItem('registech_recordar_correo')
                }

                localStorage.setItem('token', response.data.token)
                login(response.data.usuario)

                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: 'Inicio de sesión exitoso',
                    timer: 1500,
                    showConfirmButton: false
                })

                setTimeout(() => {
                    navigate('/dashboard', {
                        state: { usuario: response.data.usuario }
                    })
                }, 1500)
            }
        } catch (err) {
            if (err.response) {
                if ([400, 401, 402].includes(err.response.status)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de autenticación',
                        text: err.response.data?.error || err.response.data?.mensaje || err.response.data
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en el servidor',
                        text: err.response.data?.error || 'Error en conexión al servidor'
                    })
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor'
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const autocompletarPorCorreo = (correoValue) => {
        const cuenta = CUENTAS_DEMO.find((c) => c.correo === correoValue)
        if (cuenta) setContrasena(cuenta.contrasena)
    }

    const handleAbrirRecuperar = () => {        setPasoRecuperacion(1)
        setCorreoRecuperacion("")
        setCodigoRecuperacion("")
        setCodigoDemoGenerado("")
        setNuevaContrasena("")
        setConfirmarContrasena("")
        setModalRecuperar(true)
    }

    const handleSolicitarCodigo = async (e) => {
        e.preventDefault()

        const correoLimpio = correoRecuperacion.trim()
        if (!correoLimpio) {
            Swal.fire({ icon: 'warning', title: 'Correo requerido', text: 'Por favor, ingresa tu correo electrónico registrado' })
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(correoLimpio)) {
            Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Ingresa un formato de correo electrónico válido' })
            return
        }

        setLoadingRecuperar(true)

        try {
            const response = await axios.post(
                API_ROUTES.SOLICITAR_RECUPERACION,
                { correo: correoLimpio },
                { headers: { 'Content-Type': 'application/json' } }
            )

            const codigoRecibido = response.data?.codigo || response.data?.reset_code || response.data?.code || ''
            setCodigoDemoGenerado(codigoRecibido)
            setPasoRecuperacion(2)

            Swal.fire({
                icon: 'info',
                title: 'Código Generado',
                html: codigoRecibido
                    ? `<p class="mb-2">Tu código de verificación es:</p><div class="p-2 bg-light rounded"><b style="font-size: 1.6rem; color: #0284c7; letter-spacing: 4px;">${codigoRecibido}</b></div><p class="text-muted small mt-2 mb-0">En producción este código se enviaría por correo electrónico.</p>`
                    : 'Se ha generado un código de verificación. Ingrésalo a continuación.',
                confirmButtonText: 'Continuar'
            })
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo generar el código. Verifica que el correo esté registrado.'
            })
        } finally {
            setLoadingRecuperar(false)
        }
    }

    const handleRestablecerPassword = async (e) => {
        e.preventDefault()

        const codigoLimpio = codigoRecuperacion.trim()

        if (!codigoLimpio) {
            Swal.fire({ icon: 'warning', title: 'Código requerido', text: 'Por favor, ingresa el código de 6 dígitos' })
            return
        }

        if (codigoLimpio.length !== 6) {
            Swal.fire({ icon: 'warning', title: 'Código inválido', text: 'El código de verificación debe tener exactamente 6 dígitos' })
            return
        }

        if (!nuevaContrasena) {
            Swal.fire({ icon: 'warning', title: 'Contraseña requerida', text: 'Por favor, ingresa tu nueva contraseña' })
            return
        }

        const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/
        if (!PASSWORD_REGEX.test(nuevaContrasena)) {
            Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo (!@#$%^&* etc.)' })
            return
        }

        if (nuevaContrasena !== confirmarContrasena) {
            Swal.fire({ icon: 'error', title: 'Las contraseñas no coinciden', text: 'Por favor, verifica que ambas contraseñas sean idénticas' })
            return
        }

        setLoadingRecuperar(true)

        try {
            const response = await axios.post(
                API_ROUTES.RESTABLECER_PASSWORD,
                {
                    correo: correoRecuperacion.trim(),
                    codigo: codigoLimpio,
                    nuevaContrasena
                },
                { headers: { 'Content-Type': 'application/json' } }
            )

            Swal.fire({
                icon: 'success',
                title: '¡Contraseña Actualizada!',
                text: response.data?.mensaje || 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.'
            })

            setModalRecuperar(false)
            setContrasena("")
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error al restablecer',
                text: err.response?.data?.error || err.response?.data?.mensaje || 'El código es inválido o ha expirado.'
            })
        } finally {
            setLoadingRecuperar(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <div className="card-body p-4 p-md-5">

                    <div className="text-center mb-4">
                        <h2 className="auth-title mb-1">
                            Regis<span className="text-primary">Tech</span>
                        </h2>
                        <p className="auth-subtitle fw-semibold mb-1">
                            Bienvenido de nuevo
                        </p>
                        <p className="auth-subtitle mb-0">
                            Por favor ingresa tus credenciales
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">
                            <label className="form-label fw-semibold" htmlFor="correo">
                                Correo Electrónico
                            </label>
                            <div className="auth-input-group">
                                <i className="bi bi-envelope"></i>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    className="form-control has-toggle"
                                    id="correo"
                                    value={correo}
                                    onChange={(e) => {
                                        setCorreo(e.target.value)
                                        autocompletarPorCorreo(e.target.value)
                                    }}
                                    placeholder="Selecciona o escribe tu correo"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-pwd"
                                    onClick={() => setDropdownDemo(!dropdownDemo)}
                                    title="Cuentas de demostración"
                                    tabIndex="-1"
                                    disabled={loading}
                                >
                                    <i className={`bi ${dropdownDemo ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                                </button>

                                {dropdownDemo && (
                                    <div className="demo-dropdown">
                                        <div className="demo-dropdown__header">
                                            Cuentas de demostración
                                        </div>
                                        {CUENTAS_DEMO.map((cuenta) => (
                                            <button
                                                key={cuenta.rol}
                                                type="button"
                                                className="demo-dropdown__item"
                                                onClick={() => {
                                                    setCorreo(cuenta.correo)
                                                    setContrasena(cuenta.contrasena)
                                                    setDropdownDemo(false)
                                                }}
                                                disabled={loading}
                                            >
                                                <span className="demo-dropdown__text">
                                                    <span className="demo-dropdown__rol">{cuenta.rol}</span>
                                                    <span className="demo-dropdown__correo">{cuenta.correo}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold" htmlFor="contrasena">
                                Contraseña
                            </label>
                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={verPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    className="form-control has-toggle"
                                    id="contrasena"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="btn-toggle-pwd"
                                    onClick={() => setVerPassword(!verPassword)}
                                    title={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                    tabIndex="-1"
                                >
                                    <i className={verPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                </button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="recordarme"
                                    checked={recordarme}
                                    onChange={(e) => setRecordarme(e.target.checked)}
                                    disabled={loading}
                                />
                                <label className="form-check-label small text-muted user-select-none" htmlFor="recordarme">
                                    Recordarme
                                </label>
                            </div>

                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                onClick={handleAbrirRecuperar}
                                style={{ fontSize: '0.85rem' }}
                            >
                                ¿Olvidé mi contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 fw-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right"></i>
                                    {' '}Iniciar Sesión
                                </>
                            )}
                        </button>

                    </form>

                </div>
            </div>

            {modalRecuperar && (
                <div
                    className="modal fade show"
                    role="dialog"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: 1050 }}
                    onClick={() => !loadingRecuperar && setModalRecuperar(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title fw-bold text-primary">
                                    Recuperar Contraseña
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalRecuperar(false)}
                                    disabled={loadingRecuperar}
                                    aria-label="Cerrar"
                                ></button>
                            </div>

                            <div className="modal-body p-4">

                                {pasoRecuperacion === 1 && (
                                    <form onSubmit={handleSolicitarCodigo}>
                                        <p className="text-muted small mb-3">
                                            Ingresa el correo electrónico asociado a tu cuenta de RegisTech. Te proporcionaremos un código temporal de 6 dígitos para restablecer tu contraseña.
                                        </p>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold" htmlFor="correoRecup">
                                                Correo Electrónico
                                            </label>
                                            <div className="auth-input-group">
                                                <i className="bi bi-envelope"></i>
                                                <input
                                                    type="email"
                                                    id="correoRecup"
                                                    className="form-control"
                                                    placeholder="ejemplo@correo.com"
                                                    value={correoRecuperacion}
                                                    onChange={(e) => setCorreoRecuperacion(e.target.value)}
                                                    required
                                                    disabled={loadingRecuperar}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setModalRecuperar(false)}
                                                disabled={loadingRecuperar}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={loadingRecuperar}
                                            >
                                                {loadingRecuperar ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Generando código...
                                                    </>
                                                ) : (
                                                    <>
                                                        Solicitar Código
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {pasoRecuperacion === 2 && (
                                    <form onSubmit={handleRestablecerPassword}>

                                        {codigoDemoGenerado && (
                                            <div className="demo-code-box">
                                                <div className="text-success fw-semibold small mb-1">
                                                    <i className="bi bi-info-circle-fill me-1"></i>
                                                    Modo Demostración / Exposición
                                                </div>
                                                <div className="demo-code-badge">
                                                    {codigoDemoGenerado}
                                                </div>
                                                <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                                                    (En producción este código se envía a tu bandeja de correo)
                                                </small>
                                            </div>
                                        )}

                                        <p className="text-muted small mb-3">
                                            Ingresa el código de 6 dígitos enviado para <b>{correoRecuperacion}</b> y escribe tu nueva contraseña.
                                        </p>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold" htmlFor="codigoRecup">
                                                Código de Verificación (6 dígitos)
                                            </label>
                                            <input
                                                type="text"
                                                id="codigoRecup"
                                                className="form-control code-input"
                                                placeholder="000000"
                                                maxLength="6"
                                                value={codigoRecuperacion}
                                                onChange={(e) => setCodigoRecuperacion(e.target.value.replace(/\D/g, ''))}
                                                required
                                                disabled={loadingRecuperar}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold" htmlFor="nuevaContrasena">
                                                Nueva Contraseña
                                            </label>
                                            <div className="auth-input-group">
                                                <i className="bi bi-lock"></i>
                                                <input
                                                    type={verNuevaPassword ? "text" : "password"}
                                                    id="nuevaContrasena"
                                                    className="form-control has-toggle"
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={nuevaContrasena}
                                                    onChange={(e) => setNuevaContrasena(e.target.value)}
                                                    required
                                                    disabled={loadingRecuperar}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-toggle-pwd"
                                                    onClick={() => setVerNuevaPassword(!verNuevaPassword)}
                                                    tabIndex="-1"
                                                >
                                                    <i className={verNuevaPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold" htmlFor="confirmarContrasena">
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <div className="auth-input-group">
                                                <i className="bi bi-lock-fill"></i>
                                                <input
                                                    type={verNuevaPassword ? "text" : "password"}
                                                    id="confirmarContrasena"
                                                    className="form-control"
                                                    placeholder="Repite tu nueva contraseña"
                                                    value={confirmarContrasena}
                                                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                                                    required
                                                    disabled={loadingRecuperar}
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => setPasoRecuperacion(1)}
                                                disabled={loadingRecuperar}
                                            >
                                                <i className="bi bi-arrow-left me-1"></i>
                                                Cambiar Correo
                                            </button>

                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => setModalRecuperar(false)}
                                                    disabled={loadingRecuperar}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={loadingRecuperar}
                                                >
                                                    {loadingRecuperar ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            Actualizando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-check2-circle me-1"></i>
                                                            Restablecer Contraseña
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login
