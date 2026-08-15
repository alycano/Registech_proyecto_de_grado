import React, { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Historiales = ({ usuario }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [filter, setFilter] = useState("")

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO FILTRO
    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilter(value)
    }

    // FUNCION PARA SOLICITAR EL HISTORIAL
    const obtenerHistorial = () => {
        // VALIDAR QUE NO ESTE VACIO EL CAMPO DE FILTRO
        if (!filter) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor introduce el id del historial, el numero de serie o el tecnico'
            })
            return
        }

        // ENVIAMOS LA SOLICITUD AL BACKEND
        axios.post(API_ROUTES.MANTENIMIENTOS_FIND, { filter })
            .then(response => {
                if (response.data.length == 0) {
                    setMantenimientos([])
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin registros',
                        text: 'No existen reportes de mantenimientos'
                    })
                } else {
                    setMantenimientos(response.data)
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar la solicitud',
                    text: 'Hubo un problema al enviar la solicitud, intentalo nuevamente'
                })
            })
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-clock-history"></i>
                        Historial de Mantenimientos
                    </h4>
                </div>

                {/* CONTENEDOR ADICIONAL PARA CENTAR EL INPUT Y LOS BOTONES */}
                <div className="d-flex justify-content-center mb-3">
                    <div className="input-group" style={{ maxWidth: '600px', width: '100%' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por id mantenimiento, numero de serie o tecnico"
                            value={filter}
                            onChange={handleFilterChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') obtenerHistorial() }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={obtenerHistorial}
                        >
                            <i className="bi bi-filter"></i>
                            Buscar
                        </button>
                    </div>
                </div>

                {mantenimientos.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-inbox"></i>
                        <p className="mb-0">
                            Aun no hay resultados. Usa el buscador para consultar el historial.
                        </p>
                    </div>
                ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr className="text-center">
                                <th>ID Mantenimiento</th>
                                <th>Numero Serie</th>
                                <th>Falla</th>
                                <th>Solucion</th>
                                <th>Tecnico</th>
                                <th>Fecha Reporte</th>
                                <th>Fecha Solucion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mantenimientos.map((equipo, index) => (
                                <tr key={index}>
                                    <td className="fw-semibold">{equipo.id_historial}</td>
                                    <td>{equipo.num_serie}</td>
                                    <td>{equipo.falla}</td>
                                    <td>{equipo.solucion || 'Pendiente'}</td>
                                    <td>{equipo.usuario_tecnico || '-'}</td>
                                    <td>{equipo.fecha_reporte ? equipo.fecha_reporte.slice(0, 10) : '-'}</td>
                                    <td>{equipo.fecha_solucion ? equipo.fecha_solucion.slice(0, 10) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    )
}

export default Historiales
