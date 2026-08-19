import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import { formatearDinero, hoy, primerDiaMes } from "../utils/format"

const Ventas = () => {
    const [productos, setProductos] = useState([])
    const [ventas, setVentas] = useState([])
    const [loadingVentas, setLoadingVentas] = useState(true)

    const [modalRegistrar, setModalRegistrar] = useState(false)
    const [vendedor, setVendedor] = useState("")
    const [productoCodigo, setProductoCodigo] = useState("")
    const [cantidad, setCantidad] = useState(1)
    const [carrito, setCarrito] = useState([])

    const [inicio, setInicio] = useState(primerDiaMes())
    const [fin, setFin] = useState(hoy())

    // CARGAR LOS PRODUCTOS PARA EL SELECTOR DE VENTAS
    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_PRODUCTOS)
            .then(response => {
                setProductos(response.data)
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data || 'No se pudieron obtener las ventas'
                })
            })
    }, [])

    // FUNCION PARA CARGAR LAS VENTAS EN EL RANGO DE FECHAS
    const cargarVentas = () => {
        setLoadingVentas(true)
        axios.get(API_ROUTES.OBTENER_VENTAS, {
            params: { inicio, fin }
        })
        .then(response => {
            setVentas(response.data)
            setLoadingVentas(false)
        })
        .catch(err => {
            setLoadingVentas(false)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data || 'No se pudieron obtener las ventas'
            })
        })
    }

    useEffect(() => {
        cargarVentas()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const abrirRegistro = () => {
        setVendedor("")
        setProductoCodigo("")
        setCantidad(1)
        setCarrito([])
        setModalRegistrar(true)
    }

    const agregarAlCarrito = () => {
        const producto = productos.find(p => p.codigo === productoCodigo)
        if (!producto) {
            Swal.fire({ icon: 'error', title: 'Selecciona un producto' })
            return
        }

        const cantidadValida = Math.max(1, Number(cantidad) || 1)
        const yaExiste = carrito.find(c => c.codigo === producto.codigo)

        if (yaExiste) {
            setCarrito(carrito.map(c =>
                c.codigo === producto.codigo
                    ? { ...c, cantidad: c.cantidad + cantidadValida, subtotal: c.subtotal + (Number(producto.pre_publico) * cantidadValida) }
                    : c
            ))
        } else {
            setCarrito([
                ...carrito,
                {
                    codigo: producto.codigo,
                    nom_producto: producto.nom_producto,
                    cantidad: cantidadValida,
                    subtotal: Number(producto.pre_publico) * cantidadValida
                }
            ])
        }

        setProductoCodigo("")
        setCantidad(1)
    }

    const quitarDelCarrito = (codigo) => {
        setCarrito(carrito.filter(c => c.codigo !== codigo))
    }

    const totalCarrito = carrito.reduce((acc, c) => acc + c.subtotal, 0)

    const registrarVenta = () => {
        if (carrito.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Carrito vacio',
                text: 'Agrega al menos un producto'
            })
            return
        }

        if (!vendedor.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Falta el vendedor',
                text: 'Ingresa el nombre del vendedor'
            })
            return
        }

        const descripcionProductos = carrito.map(c => `${c.nom_producto} x${c.cantidad}`).join(', ')
        const venta = `${descripcionProductos}_${totalCarrito}_${vendedor.trim()}`

        axios.post(API_ROUTES.REGISTRAR_VENTA, { venta })
            .then(response => {
                Swal.fire({
                    icon: 'success',
                    title: 'Venta registrada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                })
                setModalRegistrar(false)
                setCarrito([])
                cargarVentas()
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al registrar la venta',
                    text: err.response?.data || 'Hubo un problema al registrar la venta'
                })
            })
    }

    const totalFiltrado = ventas.reduce((acc, v) => acc + Number(v.total_venta), 0)

    return (
        <div className="card">
            <div className="card-body">
                <div className="module-header">
                    <h4 className="module-title mb-0">
                        <i className="bi bi-receipt"></i>
                        Registro de Ventas
                    </h4>
                    <button className="btn btn-primary" onClick={abrirRegistro}>
                        <i className="bi bi-cart-plus"></i>
                        Registrar Venta
                    </button>
                </div>

                {/* FILTRO POR FECHAS */}
                <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                    <div>
                        <label className="form-label mb-1 small fw-semibold">Desde</label>
                        <input
                            type="date"
                            className="form-control"
                            value={inicio}
                            onChange={(e) => setInicio(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1 small fw-semibold">Hasta</label>
                        <input
                            type="date"
                            className="form-control"
                            value={fin}
                            onChange={(e) => setFin(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline-primary" onClick={cargarVentas}>
                        <i className="bi bi-funnel"></i>
                        Filtrar
                    </button>
                    <div className="ms-auto">
                        <span className="badge text-bg-success fs-6">
                            Total: {formatearDinero(totalFiltrado)}
                        </span>
                    </div>
                </div>

                {loadingVentas ? (
                    <div className="text-center py-5 text-secondary">
                        <div className="spinner-border text-primary mb-2" role="status"></div>
                        <div>Cargando ventas...</div>
                    </div>
                ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>ID Venta</th>
                                <th>Productos</th>
                                <th>Total</th>
                                <th>Fecha</th>
                                <th>Vendedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-secondary">
                                        No hay ventas en este rango de fechas
                                    </td>
                                </tr>
                            ) : (
                                ventas.map(venta => (
                                    <tr key={venta.id_venta}>
                                        <td className="fw-semibold">{venta.id_venta}</td>
                                        <td>{venta.productos}</td>
                                        <td className="fw-semibold">{formatearDinero(venta.total_venta)}</td>
                                        <td>{venta.fecha_venta}</td>
                                        <td>{venta.vendedor}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* MODAL REGISTRAR VENTA */}
            {modalRegistrar && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ display: 'block', zIndex: '1050' }}
                    onClick={() => setModalRegistrar(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-cart-plus me-1"></i>
                                    Registrar Venta
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalRegistrar(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Vendedor</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={vendedor}
                                        onChange={(e) => setVendedor(e.target.value)}
                                        placeholder="Nombre del vendedor"
                                    />
                                </div>

                                <label className="form-label">Agregar productos</label>
                                <div className="row g-2 mb-3">
                                    <div className="col-7">
                                        <select
                                            className="form-select"
                                            value={productoCodigo}
                                            onChange={(e) => setProductoCodigo(e.target.value)}
                                        >
                                            <option value="">Seleccionar producto...</option>
                                            {productos.map(producto => (
                                                <option key={producto.codigo} value={producto.codigo}>
                                                    {producto.codigo} - {producto.nom_producto} ({formatearDinero(producto.pre_publico)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-2">
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control"
                                            value={cantidad}
                                            onChange={(e) => setCantidad(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary w-100"
                                            onClick={agregarAlCarrito}
                                        >
                                            <i className="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                </div>

                                {carrito.length > 0 && (
                                    <div className="mb-3">
                                        <table className="table table-sm align-middle">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cant.</th>
                                                    <th>Subtotal</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {carrito.map(c => (
                                                    <tr key={c.codigo}>
                                                        <td>{c.nom_producto}</td>
                                                        <td>{c.cantidad}</td>
                                                        <td>{formatearDinero(c.subtotal)}</td>
                                                        <td className="text-end">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => quitarDelCarrito(c.codigo)}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="2" className="fw-bold">Total</td>
                                                    <td className="fw-bold">{formatearDinero(totalCarrito)}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalRegistrar(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={registrarVenta}
                                >
                                    <i className="bi bi-check2-circle"></i>
                                    Confirmar Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Ventas
