import React, { useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import Swal from 'sweetalert2'
import { GoogleLogin } from '@react-oauth/google'
import { API_ROUTES } from "../api/apiRoutes"

const Login = () => {
    const [usuario, setUsuario] = useState("")
    const [contrasena, setContrasena] = useState("")
    const [captchaToken, setCaptchaToken] = useState(null)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!usuario || !contrasena) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Usuario y contraseña son requeridos'
            })
            return
        }

        // Verificar que el usuario haya completado el CAPTCHA
        if (!captchaToken) {
            Swal.fire({
                icon: 'warning',
                title: 'Verificación requerida',
                text: 'Por favor, confirma que no eres un robot'
            })
            return
        }

        const loginData = {
            usuario,
            contrasena,
            captchaToken
        }

        try {
            const response = await axios.post(
                API_ROUTES.LOGIN,
                loginData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.status === 200) {

                if (response.data.usuario.estado === 'inactivo') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cuenta inactiva',
                        text: 'Tu cuenta esta inactiva. Contacta al administrador'
                    })
                    return
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Bienvenido',
                    text: 'Inicio de sesion exitoso'
                })

                navigate('/dashboard', {
                    state: {
                        usuario: response.data.usuario
                    }
                })
            }

        } catch (err) {
            if (err.response) {

                if (
                    err.response.status === 400 ||
                    err.response.status === 401 ||
                    err.response.status === 402
                ) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de autenticacion',
                        text: err.response.data
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en la conexion',
                        text: 'Error en conexion al servidor'
                    })
                }

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error en la conexion',
                    text: 'No se pudo conectar con el servidor'
                })
            }
        }
    }

    // MANEJA EL LOGIN EXITOSO CON GOOGLE
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post(
                API_ROUTES.GOOGLE_LOGIN,
                {
                    credential: credentialResponse.credential
                },
                {
                    withCredentials: true
                }
            )

            if (response.data.usuario.estado === 'inactivo') {
                Swal.fire({
                    icon: 'error',
                    title: 'Cuenta inactiva',
                    text: 'Tu cuenta esta inactiva. Contacta al administrador'
                })
                return
            }

            Swal.fire({
                icon: 'success',
                title: 'Bienvenido',
                text: 'Inicio de sesion exitoso'
            })

            navigate('/dashboard', {
                state: {
                    usuario: response.data.usuario
                }
            })

        } catch (err) {
            console.error(err)

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo iniciar sesion con Google'
            })
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <div className="card-body p-4 p-md-5">

                    <div className="text-center mb-4">
                        <h2 className="auth-title mb-1">
                            Registech
                        </h2>

                        <p className="auth-subtitle mb-0">
                            Sistema de inventario y gestión de TI
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* USUARIO */}
                        <div className="mb-3">
                            <label
                                className="form-label fw-semibold"
                                htmlFor="usuario"
                            >
                                Usuario
                            </label>

                            <div className="auth-input-group">
                                <i className="bi bi-person"></i>

                                <input
                                    type="text"
                                    autoComplete="username"
                                    className="form-control"
                                    id="usuario"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Ingresa tu usuario"
                                />
                            </div>
                        </div>

                        {/* CONTRASEÑA */}
                        <div className="mb-4">
                            <label
                                className="form-label fw-semibold"
                                htmlFor="contrasena"
                            >
                                Contraseña
                            </label>

                            <div className="auth-input-group">
                                <i className="bi bi-lock"></i>

                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    className="form-control"
                                    id="contrasena"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                />
                            </div>
                        </div>

                        {/* reCAPTCHA */}
                        <div className="mb-4 d-flex justify-content-center">
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(token) => setCaptchaToken(token)}
                                onExpired={() => setCaptchaToken(null)}
                                onErrored={() => setCaptchaToken(null)}
                            />
                        </div>

                        {/* BOTÓN LOGIN */}
                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 fw-semibold"
                        >
                            <i className="bi bi-box-arrow-in-right"></i>
                            {' '}Iniciar Sesion
                        </button>

                    </form>

                    {/* SEPARADOR Y BOTON DE GOOGLE */}
                    <div className="text-center my-3 text-muted">
                        o
                    </div>

                    <div className="d-flex justify-content-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Fallo el inicio de sesion con Google'
                                })
                            }}
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Login