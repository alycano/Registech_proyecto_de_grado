import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import Layout from './components/layout/Layout'
import DashboardAdmin from './components/dashboard/DashboardAdmin'
import Tecnologia from './components/Tecnologia'
import RecursosHumanos from './components/RecursosHumano'
import Soportes from './components/Soportes'
import GestionPrestamos from './components/GestionPrestamos'
import GestionMantenimiento from './components/GestionMantenimiento'
import Departamentos from './components/Departamentos'
import Reportes from './components/Reportes'
import Configuracion from './components/Configuracion'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    if (!token) return <Navigate to="/login" />
    return children
}

const getUsuario = () => {
    try {
        const saved = localStorage.getItem('usuario')
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

function EquipmentPage({ usuario }) {
    switch (usuario?.area) {
        case 'Tecnologia': return <Tecnologia usuario={usuario.usuario} />
        case 'Recursos Humanos': return <RecursosHumanos />
        case 'Soporte': return <Soportes usuario={usuario.usuario} />
        default: return <div className="alert alert-info">Modulo en desarrollo</div>
    }
}

function App() {
    const [usuario, setUsuario] = useState(getUsuario)

    useEffect(() => {
        const interval = setInterval(() => setUsuario(getUsuario()), 1000)
        return () => clearInterval(interval)
    }, [])

    const wrap = (Component, props) => (
        <ProtectedRoute>
            <Layout usuario={usuario}>
                <Component {...props} />
            </Layout>
        </ProtectedRoute>
    )

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={wrap(DashboardAdmin)} />
                <Route path="/equipment" element={wrap(EquipmentPage, { usuario })} />
                <Route path="/loans" element={wrap(GestionPrestamos)} />
                <Route path="/maintenance" element={wrap(GestionMantenimiento, { usuario })} />
                <Route path="/departments" element={wrap(Departamentos, { usuario })} />
                <Route path="/reports" element={wrap(Reportes, { usuario })} />
                <Route path="/settings" element={wrap(Configuracion, { usuario })} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    )
}

export default App
