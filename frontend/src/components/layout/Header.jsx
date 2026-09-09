import { useNavigate } from 'react-router-dom'
import Notificaciones from '../Notificaciones'

export default function Header({ usuario, theme, onToggleTheme }) {
    const navigate = useNavigate()

    const iniciales = usuario?.nombre
        ? usuario.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'US'

    return (
        <header className="app-header">
            <div className="app-header__actions d-flex align-items-center gap-2">
                <button className="btn btn-link app-header__icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                    <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'} fs-5`}></i>
                </button>

                {/* COMPONENTE DE NOTIFICACIONES */}
                <Notificaciones />

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
