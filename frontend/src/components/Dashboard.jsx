import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import Tecnologia from './Tecnologia'
import RecursosHumanos from "./RecursosHumano"
import Soportes from "./Soportes"
import { API_ROUTES } from "../api/apiRoutes"

const Dashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()

    let usuario = null
    try {
        const usuarioGuardado = localStorage.getItem('usuario')
        const fromState = location.state?.usuario
        usuario = fromState || (usuarioGuardado ? JSON.parse(usuarioGuardado) : null)
    } catch {
        usuario = null
    }

    const [estadisticas, setEstadisticas] = useState(null)

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login')
        }
    }, [navigate])

    useEffect(() => {
        if (usuario?.area === 'Tecnologia') {
            axios.get(API_ROUTES.ESTADISTICAS)
                .then(response => {
                    setEstadisticas(response.data)
                })
                .catch(() => {})
        }
    }, [usuario])

    const handleLogout = () => {
        Swal.fire({
            icon: 'warning',
            title: '¿Estas seguro?',
            text: 'Quieres cerrar sesion',
            showCancelButton: true,
            confirmButtonText: 'Si, cerrar sesion',
            cancelButtonText: 'Cancelar'
        })
        .then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Hasta Luego',
                    text: 'Gracias por usar la aplicacion',
                    timer: 2000,
                    showConfirmButton: false
                })
                .then(() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('usuario')
                    navigate('/login')
                })
            }
        })
    }

    const iniciales = usuario.nombre
        ? usuario.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'US'

    const renderEstadisticas = () => {
        if (!estadisticas) return null

        return (
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card text-center border-primary">
                        <div className="card-body">
                            <div className="display-6 fw-bold text-primary">{estadisticas.total || 0}</div>
                            <div className="text-muted small">Total Equipos</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card text-center border-success">
                        <div className="card-body">
                            <div className="display-6 fw-bold text-success">{estadisticas.disponibles || 0}</div>
                            <div className="text-muted small">Disponibles</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card text-center border-warning">
                        <div className="card-body">
                            <div className="display-6 fw-bold text-warning">{estadisticas.prestados || 0}</div>
                            <div className="text-muted small">Prestados</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card text-center border-danger">
                        <div className="card-body">
                            <div className="display-6 fw-bold text-danger">{estadisticas.mantenimiento || 0}</div>
                            <div className="text-muted small">Mantenimiento</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderAreaComponent = () => {
        switch (usuario.area) {
            case 'Tecnologia':
                return (
                    <>
                        {renderEstadisticas()}
                        <Tecnologia usuario={usuario.usuario} />
                    </>
                )
            case 'Recursos Humanos':
                return <RecursosHumanos />
            case 'Soporte':
                return <Soportes usuario={usuario.usuario} />
            default:
                return (
                    <div className="empty-state">
                        <i className="bi bi-tools"></i>
                        <h5 className="fw-bold text-secondary mb-1">Modulo en desarrollo</h5>
                        <p className="mb-0">
                            El modulo de tu area (<strong>{usuario.area}</strong>) se esta construyendo.
                        </p>
                    </div>
                )
        }
    }

    return (
        <div className="min-vh-100 d-flex flex-column">
            {/* BARRA SUPERIOR */}
            <nav className="navbar navbar-expand app-navbar px-3 px-md-4 py-2">
                <div className="container-fluid">
                    <span className="navbar-brand">
                        Registech
                    </span>
                    <div className="d-flex align-items-center gap-2">
                        <span className="user-chip">
                            <span className="user-avatar">{iniciales}</span>
                            <span>
                                <strong>{usuario.nombre}</strong>
                                <small>{usuario.area}</small>
                            </span>
                        </span>
                        <button
                            className="btn btn-danger btn-sm rounded-pill px-3"
                            onClick={handleLogout}
                            title="Cerrar sesion"
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            Salir
                        </button>
                    </div>
                </div>
            </nav>
            {/* CONTENIDO DEL AREA */}
            <main className="container py-4 flex-grow-1">
                {renderAreaComponent()}
            </main>
        </div>
    )
}

export default Dashboard
