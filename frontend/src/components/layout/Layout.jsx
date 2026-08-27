import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children }) {
    const { usuario } = useAuth()
    const [collapsed, setCollapsed] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.setAttribute('data-bs-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        const alCambiarTema = (e) => setTheme(e.detail)
        window.addEventListener('registech-theme', alCambiarTema)
        return () => window.removeEventListener('registech-theme', alCambiarTema)
    }, [])

    const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

    return (
        <div className={`app-layout ${collapsed ? 'app-layout--collapsed' : ''}`} data-theme={theme}>
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                usuario={usuario}
                theme={theme}
                onToggleTheme={toggleTheme}
            />
            <div className="app-main" data-theme={theme}>
                <Header
                    usuario={usuario}
                    onToggleSidebar={() => setCollapsed(!collapsed)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
                <main className="app-content" data-theme={theme}>
                    {children}
                </main>
            </div>
        </div>
    )
}
