import { useState } from "react"

import Equipos from './Equipos'
import Usuarios from './RecursosHumano'
import Prestamos from './Prestamos'
import HistorialPrestamos from './HistorialPrestamos'
import Historiales from './Historiales'
import Soportes from './Soportes'

const Tecnologia = ({ usuario }) => {
    const [vista, setVista] = useState('equipos')

    return (
        <div>
            {/* HEADER DEL MODULO */}
            <div className="module-header">
                <h2 className="module-title">
                    <i className="bi bi-laptop-fill"></i>
                    Panel de Administracion
                </h2>
                <div className="badge bg-primary-subtle text-primary-emphasis">
                    <i className="bi bi-person-badge"></i>
                    Admin: {usuario}
                </div>
            </div>

            {/* PESTANAS PARA CAMBIAR DE VISTA */}
            <ul className="nav nav-pills mb-4 gap-2 flex-wrap">
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'equipos' ? 'active' : ''}`}
                        onClick={() => setVista('equipos')}
                    >
                        <i className="bi bi-hdd-stack"></i>
                        Equipos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'prestamos' ? 'active' : ''}`}
                        onClick={() => setVista('prestamos')}
                    >
                        <i className="bi bi-arrow-left-right"></i>
                        Prestamos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'historial-prestamos' ? 'active' : ''}`}
                        onClick={() => setVista('historial-prestamos')}
                    >
                        <i className="bi bi-clock-history"></i>
                        Historial Prestamos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'soportes' ? 'active' : ''}`}
                        onClick={() => setVista('soportes')}
                    >
                        <i className="bi bi-tools"></i>
                        Soportes
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'historiales' ? 'active' : ''}`}
                        onClick={() => setVista('historiales')}
                    >
                        <i className="bi bi-clipboard-data"></i>
                        Historial Mantenimientos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setVista('usuarios')}
                    >
                        <i className="bi bi-people-fill"></i>
                        Usuarios
                    </button>
                </li>
            </ul>

            {/* MOSTRAR EL COMPONENTE CORRESPONDIENTE */}
            <div>
                {vista === 'equipos' && <Equipos />}
                {vista === 'prestamos' && <Prestamos />}
                {vista === 'historial-prestamos' && <HistorialPrestamos />}
                {vista === 'soportes' && <Soportes usuario={usuario} />}
                {vista === 'historiales' && <Historiales usuario={usuario} />}
                {vista === 'usuarios' && <Usuarios />}
            </div>
        </div>
    )
}

export default Tecnologia
