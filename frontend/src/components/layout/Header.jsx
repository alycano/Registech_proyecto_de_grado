import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ROUTES } from '../../api/apiRoutes'

export default function Header({ usuario, onToggleSidebar, theme, onToggleTheme }) {
    const [pendientes, setPendientes] = useState(0)
    const navigate = useNavigate()

    const cargarNotificaciones = () => {
        if (!localStorage.getItem('token')) return
        axios.get(API_ROUTES.NOTIFICACIONES)
            .then(res => setPendientes(res.data?.total || 0))
            .catch(() => {})
    }

    useEffect(() => {
        cargarNotificaciones()
        const intervalo = setInterval(cargarNotificaciones, 30000)
        return () => clearInterval(intervalo)
    }, [])

    const iniciales = usuario?.nombre
        ? usuario.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'US'

    const handleCampana = () => {
        navigate('/dashboard')
    }

    return (
        <header className="app-header">
            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-link app-header__toggle" onClick={onToggleSidebar}>
                    <i className="bi bi-list fs-4"></i>
                </button>
                <div className="app-header__search d-none d-md-flex">
                    <i className="bi bi-search"></i>
                    <input type="text" placeholder="Buscar..." className="form-control" />
                </div>
            </div>

            <div className="d-flex align-items-center gap-2">
                <button className="btn btn-link app-header__icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                    <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'} fs-5`}></i>
                </button>

                <button
                    className="btn btn-link app-header__icon-btn position-relative"
                    onClick={handleCampana}
                    title={pendientes > 0 ? `${pendientes} orden(es) de mantenimiento por aprobar` : 'Sin notificaciones'}
                >
                    <i className={`bi ${pendientes > 0 ? 'bi-bell-fill' : 'bi-bell'} fs-5`}></i>
                    {pendientes > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                            {pendientes > 9 ? '9+' : pendientes}
                        </span>
                    )}
                </button>

                <div className="app-header__user">
                    <span className="app-header__avatar">{iniciales}</span>
                    <div className="d-none d-md-block">
                        <div className="app-header__name">{usuario?.nombre || 'Usuario'}</div>
                        <div className="app-header__role">{usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : usuario?.area || ''}</div>
                    </div>
                </div>
            </div>
        </header>
    )
}
