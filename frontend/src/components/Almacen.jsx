import React, { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const formatearDinero = (valor) => {
    const numero = Number(valor)
    if (isNaN(numero)) return '$0'
    return '$' + numero.toLocaleString('es-CO')
}

const Almacen = () => {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState("")
    const [modalProducto, setModalProducto] = useState(false)
    const [productoSeleccionado, setProductoSeleccionado] = useState({
        codigo: '',
        nom_producto: '',
        desc_producto: '',
        pre_publico: '',
        pre_proveedor: '',
        existencias: '',
        isEditing: false
    })

    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_PRODUCTOS)
            .then(response => {
                setProductos(response.data)
                setLoading(false)
            })
            .catch(err => {
                setError('Hubo un error al obtener los productos')
                setLoading(false)
            })
    }, [])

    const handleFilterChange = (e) => setFilter(e.target.value)

    const filteredProductos = productos.filter(producto =>
        producto.codigo?.toLowerCase().includes(filter.toLowerCase()) ||
        producto.nom_producto?.toLowerCase().includes(filter.toLowerCase())
    )

    const nuevoProducto = () => {
        setProductoSeleccionado({
            codigo: '',
            nom_producto: '',
            desc_producto: '',
            pre_publico: '',
            pre_proveedor: '',
            existencias: '',
            isEditing: false
        })
        setModalProducto(true)
    }

    const editarProducto = (producto) => {
        setProductoSeleccionado({
            ...producto,
            isEditing: true
        })
        setModalProducto(true)
    }

    const handleChange = (e) => {
        setProductoSeleccionado({
            ...productoSeleccionado,
            [e.target.name]: e.target.value
        })
    }

    const guardarProducto = () => {
        const { codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias, isEditing } = productoSeleccionado

        if (!nom_producto || !desc_producto || !pre_publico || !pre_proveedor || !existencias) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Todos los campos son obligatorios'
            })
            return
        }

        if (isEditing) {
            axios.put(API_ROUTES.ACTUALIZAR_PRODUCTO(productoSeleccionado.codigo), {
                nom_producto, desc_producto, pre_publico, pre_proveedor, existencias
            })
            .then(response => {
                const updateProductos = productos.map(p =>
                    p.codigo === productoSeleccionado.codigo
                        ? { ...p, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias }
                        : p
                )
                setProductos(updateProductos)
                setModalProducto(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Producto actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al actualizar el producto',
                    text: 'Hubo un problema al actualizar el producto'
                })
            })
        } else {
            if (!codigo) {
                Swal.fire({
                    icon: 'error',
                    title: 'Campo requerido',
                    text: 'El codigo del producto es obligatorio'
                })
                return
            }

            axios.post(API_ROUTES.CREAR_PRODUCTO, {
                codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias
            })
            .then(response => {
                setProductos([...productos, response.data])
                setModalProducto(false)
                Swal.fire({
                    icon: 'success',
                    title: 'Producto creado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                })
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear el producto',
                    text: 'Verifica que el codigo no este en uso'
                })
            })
        }
    }

    const eliminarProducto = (producto) => {
        Swal.fire({
            icon: 'warning',
            title: '¿Estas seguro?',
            text: `Se eliminara el producto ${producto.nom_producto}`,
            showCancelButton: true,
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar'
        })
        .then((result) => {
            if (result.isConfirmed) {
                axios.delete(API_ROUTES.ELIMINAR_PRODUCTO(producto.codigo))
                .then(() => {
                    setProductos(productos.filter(p => p.codigo !== producto.codigo))
                    Swal.fire({
                        icon: 'success',
                        title: 'Producto eliminado',
                        timer: 1500,
                        showConfirmButton: false
                    })
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar el producto',
                        text: 'Hubo un problema al eliminar el producto'
                    })
                })
            }
        })
    }

    const getStockClass = (existencias) => {
        const n = Number(existencias)
        if (n === 0) return 'text-bg-danger'
        if (n < 20) return 'text-bg-warning'
        return 'text-bg-success'
    }

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando productos...</div>
            </div>
        )
    }

    if (error) {
        return <div className="alert alert-danger text-center">{error}</div>
    }

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-box-seam"></i>
                        Inventario de Productos
                    </h4>
                    <span className="badge text-bg-primary">{productos.length} productos</span>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
                    <div className="input-group" style={{ maxWidth: '380px' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por codigo o nombre..."
                            value={filter}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={nuevoProducto}>
                        <i className="bi bi-plus-circle"></i>
                        Nuevo Producto
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>Codigo</th>
                                <th>Nombre</th>
                                <th>Descripcion</th>
                                <th>Precio Publico</th>
                                <th>Precio Proveedor</th>
                                <th>Existencias</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-secondary">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map(producto => (
                                    <tr key={producto.codigo}>
                                        <td className="fw-semibold">{producto.codigo}</td>
                                        <td>{producto.nom_producto}</td>
                                        <td>{producto.desc_producto}</td>
                                        <td>{formatearDinero(producto.pre_publico)}</td>
                                        <td>{formatearDinero(producto.pre_proveedor)}</td>
                                        <td>
                                            <span className={`badge ${getStockClass(producto.existencias)}`}>
                                                {producto.existencias}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-warning me-1"
                                                onClick={() => editarProducto(producto)}
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => eliminarProducto(producto)}
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL PRODUCTO */}
            {modalProducto && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050' }}
                    onClick={() => setModalProducto(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {productoSeleccionado.isEditing ? "Editar Producto" : "Nuevo Producto"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalProducto(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label">Codigo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="codigo"
                                            value={productoSeleccionado.codigo}
                                            onChange={handleChange}
                                            disabled={productoSeleccionado.isEditing}
                                            placeholder="Ej: HOG-021"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nom_producto"
                                            value={productoSeleccionado.nom_producto}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Descripcion</label>
                                        <textarea
                                            className="form-control"
                                            name="desc_producto"
                                            value={productoSeleccionado.desc_producto}
                                            onChange={handleChange}
                                            rows="2"
                                        >
                                        </textarea>
                                    </div>

                                    <div className="row">
                                        <div className="col-6 mb-3">
                                            <label className="form-label">Precio Publico</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pre_publico"
                                                value={productoSeleccionado.pre_publico}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-6 mb-3">
                                            <label className="form-label">Precio Proveedor</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pre_proveedor"
                                                value={productoSeleccionado.pre_proveedor}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Existencias</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="existencias"
                                            value={productoSeleccionado.existencias}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalProducto(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarProducto}
                                >
                                    {productoSeleccionado.isEditing ? "Guardar cambios" : "Guardar producto"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Almacen
