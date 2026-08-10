import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import Tecnologia from './Tecnologia'
import RecursosHumanos from "./RecursosHumano"
import Soportes from "./Soportes"
import Almacen from "./Almacen"
import Ventas from "./Ventas"
import Finanzas from "./Finanzas"

const Dashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { usuario } = location.state || {}
    if (!usuario) {
        navigate('/login')
        return null
    }
    // FUNCION PARA MANEJAR EL CIERRE DE SESION
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
                    navigate('/login')
                })
            }
        })
    }
    const iniciales = usuario.nombre
        ? usuario.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'US'
    const renderAreaComponent = () => {
        switch (usuario.area) {
            case 'Tecnologia': return <Tecnologia usuario={usuario.usuario} />
            case 'Recursos Humanos': return <RecursosHumanos />
            case 'Soporte': return <Soportes usuario={usuario.usuario} />
            case 'Almacen': return <Almacen />
            case 'Ventas': return <Ventas />
            case 'Fianzas': return <Finanzas />
            default: return (
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