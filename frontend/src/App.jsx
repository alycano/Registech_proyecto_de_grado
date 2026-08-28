import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Layout from './components/layout/Layout'
import DashboardAdmin from './components/dashboard/DashboardAdmin'
import Tecnologia from './components/Tecnologia'
import Soportes from './components/Soportes'
import Equipos from './components/Equipos'
import GestionPrestamos from './components/GestionPrestamos'
import GestionMantenimiento from './components/GestionMantenimiento'
import Departamentos from './components/Departamentos'
import Reportes from './components/Reportes'
import Configuracion from './components/Configuracion'
import PMC from './components/PMC'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    if (!token) return <Navigate to="/login" />
    return children
}

function EquipmentPage() {
    const { usuario } = useAuth()
    switch (usuario?.rol) {
        case 'admin': return <Tecnologia usuario={usuario.usuario} />
        case 'inventario': return <Equipos />
        case 'sistemas': return <Soportes usuario={usuario.usuario} />
        default: return <Equipos />
    }
}

function AppRoutes() {
    const { usuario } = useAuth()

    const wrap = (Component, extraProps = {}) => (
        <ProtectedRoute>
            <Layout>
                <Component {...extraProps} />
            </Layout>
        </ProtectedRoute>
    )

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={wrap(DashboardAdmin)} />
            <Route path="/equipment" element={wrap(EquipmentPage)} />
            <Route path="/loans" element={wrap(GestionPrestamos)} />
            <Route path="/maintenance" element={wrap(GestionMantenimiento)} />
            <Route path="/departments" element={wrap(Departamentos)} />
            <Route path="/pmc" element={wrap(PMC)} />
            <Route path="/reports" element={wrap(Reportes)} />
            <Route path="/settings" element={wrap(Configuracion)} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    )
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    )
}

export default App
