import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ROUTES } from '../api/apiRoutes'
import Swal from 'sweetalert2'

const PMC = () => {
    const [pmcs, setPmcs] = useState([])
    const [loading, setLoading] = useState(true)

    const [modalCrear, setModalCrear] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevaDescripcion, setNuevaDescripcion] = useState('')
    const [nuevaCantidad, setNuevaCantidad] = useState('')
    const [guardando, setGuardando] = useState(false)

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

    const abrirModalCrear = () => {
        setNuevoNombre('')
        setNuevaDescripcion('')
        setNuevaCantidad('')
        setModalCrear(true)
    }

    const guardarConsumible = (e) => {
        e.preventDefault()

        const cantidad = parseInt(nuevaCantidad, 10)
        if (!nuevoNombre.trim()) {
            Swal.fire({ icon: 'warning', title: 'Falta el nombre', text: 'El nombre del consumible es obligatorio' })
            return
        }
        if (!cantidad || cantidad < 1) {
            Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'La cantidad total debe ser mayor a 0' })
            return
        }

        setGuardando(true)
        axios.post(API_ROUTES.PMC, {
            nombre: nuevoNombre.trim(),
            descripcion: nuevaDescripcion.trim() || null,
            cantidad_total: cantidad
        })
            .then(() => {
                setModalCrear(false)
                Swal.fire({ icon: 'success', title: '¡Creado!', text: 'El consumible ha sido registrado.', timer: 2000, showConfirmButton: false })
                fetchPMCs()
            })
            .catch(error => {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo crear', 'error')
            })
            .finally(() => setGuardando(false))
    }

    const handleEntregar = async (id) => {
        try {
            await axios.post(API_ROUTES.PMC_ENTREGAR(id))
            fetchPMCs()
            Swal.fire({
                icon: 'success',
                title: 'Entregado',
                text: 'Se ha restado 1 unidad del stock disponible',
                timer: 2000,
                showConfirmButton: false
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
                timer: 2000,
                showConfirmButton: false
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
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Inventario Menor (PMC)
                </h2>
                <button className="btn btn-primary" onClick={abrirModalCrear}>
                    <i className="bi bi-plus-circle me-2"></i>Registrar PMC
                </button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                    <thead className="table-header">
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
                                    <div className="d-flex gap-2 justify-content-center">
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleEntregar(pmc.id)}
                                            title="Entregar 1 unidad (-1)"
                                            disabled={pmc.cantidad_disponible <= 0}
                                        >
                                            <i className="bi bi-box-arrow-right me-1"></i>Entregar (-1)
                                        </button>
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleDevolver(pmc.id)}
                                            title="Devolver 1 unidad (+1)"
                                            disabled={pmc.cantidad_disponible >= pmc.cantidad_total}
                                        >
                                            <i className="bi bi-arrow-return-left me-1"></i>Devolver (+1)
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
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

            {/* MODAL REGISTRAR CONSUMIBLE */}
            {modalCrear && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => !guardando && setModalCrear(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    Registrar Nuevo Consumible (PMC)
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => !guardando && setModalCrear(false)}
                                    disabled={guardando}
                                ></button>
                            </div>

                            <form onSubmit={guardarConsumible}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej: Mouse"
                                            value={nuevoNombre}
                                            onChange={(e) => setNuevoNombre(e.target.value)}
                                            disabled={guardando}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Descripción</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={nuevaDescripcion}
                                            onChange={(e) => setNuevaDescripcion(e.target.value)}
                                            disabled={guardando}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Cantidad Total</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 10"
                                            value={nuevaCantidad}
                                            onChange={(e) => setNuevaCantidad(e.target.value)}
                                            disabled={guardando}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalCrear(false)} disabled={guardando}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                                        {guardando ? 'Guardando...' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PMC