import React, { useState } from "react";

import Equipos from './Equipos'
import Soportes from './Soportes'
import Historiales from './Historiales'

const Tecnologia = ({ usuario }) => { //recibimos el usuario como prop
    const [vista, setVista] = useState('equipos')
    const mostrarEquipos = () => setVista('equipos')
    const mostrarSoportes = () => setVista('soportes')
    const mostrarHistoriales = () => setVista('historiales')

    return (
        <div>
            {/* HEADER DEL MODULO */}
            <div className="module-header">
                <h2 className="module-title">
                    <i className="bi bi-laptop-fill"></i>
                    Gestion Tecnologia
                </h2>
                <div className="badge bg-primary-subtle text-primary-emphasis">
                    <i className="bi bi-person-badge"></i>
                    Usuario: {usuario}
                </div>
            </div>

            {/* PESTAÑAS PARA CAMBIAR DE VISTA */}
            <ul className="nav nav-pills mb-4 gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'equipos' ? 'active' : ''}`}
                        onClick={mostrarEquipos}
                    >
                        <i className="bi bi-hdd-stack"></i>
                        Equipos
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'soportes' ? 'active' : ''}`}
                        onClick={mostrarSoportes}
                    >
                        <i className="bi bi-tools"></i>
                        Soportes
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${vista === 'historiales' ? 'active' : ''}`}
                        onClick={mostrarHistoriales}
                    >
                        <i className="bi bi-clock-history"></i>
                        Historiales
                    </button>
                </li>
            </ul>

            {/* MOSTRAR EL COMPONENTE CORRESPONDIENTE */}
            <div>
                {vista === 'equipos' && <Equipos />}
                {vista === 'soportes' && <Soportes usuario={usuario} />}
                {vista === 'historiales' && <Historiales usuario={usuario} />}
            </div>
        </div>
    )

}

export default Tecnologia
