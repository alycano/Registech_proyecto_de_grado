import { useNavigate, NavLink } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../context/AuthContext'

const MENU = [
    { label: 'Panel Principal', icon: 'bi-grid-1x2', path: '/dashboard', roles: ['admin', 'inventario', 'sistemas'] },
    { label: 'Equipos', icon: 'bi-pc-display', path: '/equipment', roles: ['admin', 'inventario'] },
    { label: 'Prestamos', icon: 'bi-arrow-left-right', path: '/loans', roles: ['admin', 'inventario'] },
    { label: 'Mantenimiento', icon: 'bi-tools', path: '/maintenance', roles: ['admin', 'sistemas'] },
    { label: 'Departamentos', icon: 'bi-building', path: '/departments', roles: ['admin'] },
    { label: 'Reportes', icon: 'bi-file-earmark-bar-graph', path: '/reports', roles: ['admin', 'inventario', 'sistemas'] },
    { label: 'Configuracion', icon: 'bi-gear', path: '/settings', roles: ['admin', 'inventario', 'sistemas'] },
]

export default function Sidebar({ collapsed, onToggle, usuario, theme, onToggleTheme }) {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Cerrar sesion',
            text: '¿Estas seguro que deseas cerrar sesion?',
            showCancelButton: true,
            confirmButtonText: 'Si, cerrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
        }).then((result) => {
            if (result.isConfirmed) {
                logout()
                navigate('/login')
            }
        })
    }

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__brand">
                {!collapsed && <span className="sidebar__brand-text">Regis<span className="text-accent">Tech</span></span>}
                {collapsed && <span className="sidebar__brand-text sidebar__brand-text--center">RT</span>}
            </div>

            <nav className="sidebar__nav">
                {MENU.filter(item => item.roles.includes(usuario?.rol)).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <i className={`bi ${item.icon} sidebar__icon`}></i>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__footer">
                <button className="sidebar__link sidebar__logout" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-left sidebar__icon"></i>
                    {!collapsed && <span>Cerrar sesion</span>}
                </button>
            </div>
        </aside>
    )
}
