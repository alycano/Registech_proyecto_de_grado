import { useState } from "react"

import Equipos from './Equipos'
import Usuarios from './RecursosHumano'

const Tecnologia = ({ usuario }) => {
    const [vista, setVista] = useState('equipos')

    return (
        <div>
            {/* HEADER DEL MODULO */}
            <div className="module-header">
                <h2 className="module-title">
                    Panel de Administración
                </h2>
                <div className="badge bg-primary-subtle text-primary-emphasis">
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
                        Equipos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setVista('usuarios')}
                    >
                        Usuarios
                    </button>
                </li>
            </ul>

            {/* MOSTRAR EL COMPONENTE CORRESPONDIENTE */}
            <div>
                {vista === 'equipos' && <Equipos />}
                {vista === 'usuarios' && <Usuarios />}
            </div>
        </div>
    )
}

export default Tecnologia
