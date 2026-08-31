import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ROUTES } from '../api/apiRoutes'
import Swal from 'sweetalert2'

const PMC = () => {
    const [pmcs, setPmcs] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchPMCs = async () => {
        try {
            const response = await axios.get(API_ROUTES.PMC)
            setPmcs(response.data)
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Error al obtener inventario PMC'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPMCs()
    }, [])

    const handleCrear = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Registrar Nuevo Consumible (PMC)',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Nombre (Ej: Mouse)">' +
                '<input id="swal-input2" class="swal2-input" placeholder="Descripción">' +
                '<input id="swal-input3" type="number" class="swal2-input" placeholder="Cantidad Total">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nombre = document.getElementById('swal-input1').value
                const cantidad_total = document.getElementById('swal-input3').value
                if (!nombre || !cantidad_total) {
                    Swal.showValidationMessage('Nombre y cantidad total son obligatorios')
                }
                return {
                    nombre,
                    descripcion: document.getElementById('swal-input2').value,
                    cantidad_total: parseInt(cantidad_total)
                }
            }
        })

        if (formValues) {
            try {
                await axios.post(API_ROUTES.PMC, formValues)
                Swal.fire('¡Creado!', 'El consumible ha sido registrado.', 'success')
                fetchPMCs()
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo crear', 'error')
            }
        }
    }

    const handleEntregar = async (id) => {
        try {
            await axios.post(API_ROUTES.PMC_ENTREGAR(id))
            fetchPMCs()
            Swal.fire({
                icon: 'success',
                title: 'Entregado',
                text: 'Se ha restado 1 unidad del stock disponible',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            })
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al entregar', 'error')
        }
    }

    const handleDevolver = async (id) => {
        try {
            await axios.post(API_ROUTES.PMC_DEVOLVER(id))
            fetchPMCs()
            Swal.fire({
                icon: 'success',
                title: 'Devuelto',
                text: 'Se ha sumado 1 unidad al stock disponible',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            })
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al devolver', 'error')
        }
    }

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_ROUTES.PMC}/${id}`)
                Swal.fire('Eliminado', 'El consumible ha sido eliminado.', 'success')
                fetchPMCs()
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar', 'error')
            }
        }
    }

    if (loading) return <div className="text-center mt-5">Cargando inventario PMC...</div>

    return (
        <div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Inventario Menor (PMC)</h1>
                <button className="btn btn-primary" onClick={handleCrear}>
                    <i className="bi bi-plus-circle me-2"></i>Registrar PMC
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th className="text-center">Stock Total</th>
                            <th className="text-center">Stock Disponible</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pmcs.map(pmc => (
                            <tr key={pmc.id}>
                                <td>{pmc.id}</td>
                                <td>{pmc.nombre}</td>
                                <td>{pmc.descripcion || 'N/A'}</td>
                                <td className="text-center">{pmc.cantidad_total}</td>
                                <td className="text-center text-success fw-bold">{pmc.cantidad_disponible}</td>
                                <td className="text-center">
                                    <div className="btn-group" role="group">
                                        <button 
                                            className="btn btn-sm btn-outline-danger" 
                                            onClick={() => handleEntregar(pmc.id)}
                                            title="Entregar 1 unidad (-1)"
                                            disabled={pmc.cantidad_disponible <= 0}
                                        >
                                            Entregar (-1)
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-success" 
                                            onClick={() => handleDevolver(pmc.id)}
                                            title="Devolver 1 unidad (+1)"
                                            disabled={pmc.cantidad_disponible >= pmc.cantidad_total}
                                        >
                                            Devolver (+1)
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger ms-2" 
                                            onClick={() => handleEliminar(pmc.id)}
                                            title="Eliminar registro"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pmcs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center text-muted py-4">
                                    No hay productos de menor cuantía registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PMC
