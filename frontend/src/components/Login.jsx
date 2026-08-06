import React, { useState } from "react"
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import Swal from 'sweetalert2'
import { GoogleLogin } from '@react-oauth/google'
import { API_ROUTES } from "../api/apiRoutes"

const Login = () => {
    const [ usuario, setUsuario ] = useState("")
    const [ contrasena, setContrasena ] = useState("")
    const [ error, setError ] = useState("")
    const [ mensaje, setMensaje ] = useState("")

    const navigate = useNavigate()

    const handleSubmit = async(e) => {
        e.preventDefault()

        setError("")
        setMensaje("")

        if(!usuario || !contrasena){
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Usuario y contraseña son requeridos'
            })
            return
        }

        const loginData = { usuario, contrasena }

        try {
            const response = await axios.post(API_ROUTES.LOGIN, loginData, {
                headers: { 'Content-Type': 'application/json' }
            })

            if(response.status == 200){
                if(response.data.usuario.estado === 'inactivo') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cuenta inactiva',
                        text: 'Tu cuenta esta inactiva. Contacta al administrador'
                    })
                    return
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Bienvenido',
                        text: 'Inicio de sesion exitoso'
                    })
                    navigate('/dashboard', { state: { usuario: response.data.usuario}})
                }
            }
        } catch(err) {
            if(err.response) {
                if(err.response.status === 400) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Usuario y contraseña son requeridos' })
                } else if(err.response.status === 401){
                    Swal.fire({ icon: 'error', title: 'Error de autenticacion', text: err.response.data })
                } else if(err.response.status === 402) {
                    Swal.fire({ icon: 'error', title: 'Error de autenticacion', text: err.response.data })
                } else {
                    Swal.fire({ icon: 'error', title: 'Error en la conexion', text: 'Error en conexion al servidor' })
                }
            }
        }
    }

    // NUEVO: maneja el login exitoso con Google
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post(
                API_ROUTES.GOOGLE_LOGIN,
                { credential: credentialResponse.credential },
                { withCredentials: true } // importante para que se guarde la cookie de sesión
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
            navigate('/dashboard', { state: { usuario: response.data.usuario } })
        } catch (err) {
            console.error(err)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo iniciar sesion con Google'
            })
        }
    }

    return(
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow-lg p-4" style={{width: '100%', maxWidth: '400px'}}>
            <h2 className="text-center mb-4"> Iniciar Sesion</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                <label htmlFor="usuario">Usuario:</label>
                <input
                type="text"
                autoComplete="username"
                className="form-control"
                id="usuario"
                value={usuario}
                onChange={ (e) => setUsuario(e.target.value) }
                placeholder="Ingresa tu usuario"
                />
                </div>

                <div className="form-group">
                    <label htmlFor="contrasena">Contraseña:</label>
                    <input
                    type="password"
                    autoComplete="current-password"
                    className="form-control"
                    id="contrasena"
                    value={contrasena}
                    onChange={ (e) => setContrasena(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-block mt-3">
                    Iniciar Sesion
                </button>
            </form>

            {/* NUEVO: separador y botón de Google */}
            <div className="text-center my-3 text-muted">o</div>
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

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
        </div>
    </div>
    )
}

export default Login