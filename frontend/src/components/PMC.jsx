import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ROUTES } from '../api/apiRoutes'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'

const PMC = () => {

    const { usuario } = useAuth()

    const esAdmin = usuario?.rol === 'admin'
    const esInventario = usuario?.rol === 'inventario'
    const puedeGestionar = esAdmin || esInventario

    // ======================================================
    // INVENTARIO PMC
    // ======================================================

    const [pmcs, setPmcs] = useState([])
    const [loading, setLoading] = useState(true)

    // ======================================================
    // VISTA
    // ======================================================

    const [vista, setVista] = useState('productos')

    // ======================================================
    // CREAR PMC
    // ======================================================

    const [modalCrear, setModalCrear] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevaDescripcion, setNuevaDescripcion] = useState('')
    const [nuevaCantidad, setNuevaCantidad] = useState('')
    const [guardando, setGuardando] = useState(false)

    // ======================================================
    // SOLICITUDES
    // ======================================================

    const [modalSolicitar, setModalSolicitar] = useState(false)
    const [solicitarProducto, setSolicitarProducto] = useState(null)
    const [cantidadSolicitud, setCantidadSolicitud] = useState('')
    const [justificacionSolicitud, setJustificacionSolicitud] = useState('')
    const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)

    const [solicitudes, setSolicitudes] = useState([])

    // ======================================================
    // DESTINATARIOS
    // ======================================================

    const [empleados, setEmpleados] = useState([])
    const [usuarios, setUsuarios] = useState([])

    // ======================================================
    // MODAL ENTREGA
    // ======================================================

    const [modalEntrega, setModalEntrega] = useState(false)
    const [productoEntrega, setProductoEntrega] = useState(null)

    const [cantidadEntrega, setCantidadEntrega] = useState('')
    const [tipoDestinatario, setTipoDestinatario] = useState('empleado')
    const [destinatarioId, setDestinatarioId] = useState('')
    const [fechaEntrega, setFechaEntrega] = useState('')
    const [observacionesEntrega, setObservacionesEntrega] = useState('')

    const [guardandoEntrega, setGuardandoEntrega] = useState(false)

    // ======================================================
    // HISTORIAL DE ENTREGAS PMC
    // ======================================================

    const [entregas, setEntregas] = useState([])
    const [loadingEntregas, setLoadingEntregas] = useState(false)
    const [busquedaHistorial, setBusquedaHistorial] = useState('')

    // ======================================================
    // OBTENER INVENTARIO
    // ======================================================

    const fetchPMCs = async () => {

        try {

            const response = await axios.get(API_ROUTES.PMC)

            setPmcs(
                Array.isArray(response.data)
                    ? response.data
                    : []
            )

        } catch (error) {

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.error ||
                    'Error al obtener inventario PMC'
            })

        } finally {

            setLoading(false)

        }
    }

    // ======================================================
    // OBTENER SOLICITUDES
    // ======================================================

    const fetchSolicitudes = async () => {

        try {

            const url = esAdmin
                ? API_ROUTES.SOLICITUDES
                : API_ROUTES.MIS_SOLICITUDES

            const response = await axios.get(url)

            setSolicitudes(
                Array.isArray(response.data)
                    ? response.data
                    : []
            )

        } catch (error) {

            setSolicitudes([])

        }
    }

    // ======================================================
    // OBTENER EMPLEADOS
    // ======================================================

    const fetchEmpleados = async () => {

        try {

            const response = await axios.get(
                API_ROUTES.OBTENER_EMPLEADOS
            )

            const data = Array.isArray(response.data)
                ? response.data
                : []

            setEmpleados(data)

        } catch (error) {

            console.error(
                'Error al obtener empleados:',
                error
            )

            setEmpleados([])
        }
    }

    // ======================================================
    // OBTENER USUARIOS
    // ======================================================

    const fetchUsuarios = async () => {

        try {

            const response = await axios.get(
                API_ROUTES.OBTENER_USUARIOS
            )

            const data = Array.isArray(response.data)
                ? response.data
                : []

            setUsuarios(data)

        } catch (error) {

            console.error(
                'Error al obtener usuarios:',
                error
            )

            setUsuarios([])
        }
    }

    // ======================================================
    // OBTENER HISTORIAL DE ENTREGAS PMC
    // ======================================================

    const fetchEntregas = async () => {

        if (!puedeGestionar) {
            return
        }

        setLoadingEntregas(true)

        try {

            const response = await axios.get(
                `${API_ROUTES.PMC}/entregas/historial`
            )

            setEntregas(
                Array.isArray(response.data)
                    ? response.data
                    : []
            )

        } catch (error) {

            console.error(
                'Error al obtener historial PMC:',
                error
            )

            setEntregas([])

        } finally {

            setLoadingEntregas(false)

        }
    }

    // ======================================================
    // CARGA INICIAL
    // ======================================================

    useEffect(() => {

        fetchPMCs()
        fetchSolicitudes()

        if (puedeGestionar) {
            fetchEmpleados()
            fetchUsuarios()
            fetchEntregas()
        }

    }, [esAdmin, puedeGestionar])

    // ======================================================
    // CREAR PMC
    // ======================================================

    const abrirModalCrear = () => {

        setNuevoNombre('')
        setNuevaDescripcion('')
        setNuevaCantidad('')
        setModalCrear(true)

    }

    // ======================================================
    // GUARDAR PMC
    // ======================================================

    const guardarConsumible = (e) => {

        e.preventDefault()

        const cantidad = parseInt(
            nuevaCantidad,
            10
        )

        if (!nuevoNombre.trim()) {

            Swal.fire({
                icon: 'warning',
                title: 'Falta el nombre',
                text: 'El nombre del consumible es obligatorio'
            })

            return
        }

        if (!cantidad || cantidad < 1) {

            Swal.fire({
                icon: 'warning',
                title: 'Cantidad inválida',
                text: 'La cantidad total debe ser mayor a 0'
            })

            return
        }

        setGuardando(true)

        axios.post(
            API_ROUTES.PMC,
            {
                nombre: nuevoNombre.trim(),
                descripcion:
                    nuevaDescripcion.trim() || null,
                cantidad_total: cantidad
            }
        )
            .then(() => {

                setModalCrear(false)

                Swal.fire({
                    icon: 'success',
                    title: '¡Creado!',
                    text: 'El consumible ha sido registrado.',
                    timer: 2000,
                    showConfirmButton: false
                })

                fetchPMCs()

            })
            .catch(error => {

                Swal.fire(
                    'Error',
                    error.response?.data?.error ||
                    'No se pudo crear',
                    'error'
                )

            })
            .finally(() => {

                setGuardando(false)

            })
    }

    // ======================================================
    // ABRIR MODAL SOLICITAR
    // ======================================================

    const abrirModalSolicitar = (pmc) => {

        setSolicitarProducto(pmc)
        setCantidadSolicitud('')
        setJustificacionSolicitud('')
        setModalSolicitar(true)

    }

    // ======================================================
    // ENVIAR SOLICITUD
    // ======================================================

    const enviarSolicitud = (e) => {

        e.preventDefault()

        const cantidad = parseInt(
            cantidadSolicitud,
            10
        )

        if (!solicitarProducto) {
            return
        }

        if (!cantidad || cantidad < 1) {

            Swal.fire({
                icon: 'warning',
                title: 'Cantidad inválida',
                text: 'Indica cuántas unidades necesitas'
            })

            return
        }

        if (
            cantidad >
            Number(solicitarProducto.cantidad_disponible || 0)
        ) {

            Swal.fire({
                icon: 'warning',
                title: 'Cantidad no disponible',
                text:
                    `Solo hay ${solicitarProducto.cantidad_disponible} unidad(es) disponible(s).`
            })

            return
        }

        setEnviandoSolicitud(true)

        axios.post(
            API_ROUTES.SOLICITUDES,
            {
                tipo_equipo:
                    solicitarProducto.nombre,

                descripcion:
                    `Solicitud de ${cantidad} unidad(es) de ${solicitarProducto.nombre}`,

                justificacion:
                    justificacionSolicitud.trim() || null
            }
        )
            .then(() => {

                setModalSolicitar(false)

                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud enviada',
                    text:
                        'Queda pendiente de aprobación por el administrador.',
                    timer: 2500,
                    showConfirmButton: false
                })

                fetchSolicitudes()

            })
            .catch(error => {

                Swal.fire(
                    'Error',
                    error.response?.data?.error ||
                    'No se pudo enviar la solicitud',
                    'error'
                )

            })
            .finally(() => {

                setEnviandoSolicitud(false)

            })
    }

    // ======================================================
    // APROBAR / RECHAZAR SOLICITUD
    // ======================================================

    const responderSolicitud = async (
        id,
        estado
    ) => {

        const accion =
            estado === 'aprobada'
                ? 'aprobar'
                : 'rechazar'

        const conf = await Swal.fire({

            title: `¿${accion} la solicitud?`,

            text:
                estado === 'aprobada'
                    ? 'Se notificará al solicitante y se descontará del stock al entregar.'
                    : 'La solicitud quedará marcada como rechazada.',

            icon:
                estado === 'aprobada'
                    ? 'question'
                    : 'warning',

            showCancelButton: true,

            confirmButtonText:
                `Sí, ${accion}`,

            cancelButtonText:
                'Cancelar',

            confirmButtonColor:
                estado === 'aprobada'
                    ? '#198754'
                    : '#dc3545'
        })

        if (!conf.isConfirmed) {
            return
        }

        try {

            await axios.put(
                API_ROUTES.RESPONDER_SOLICITUD(id),
                { estado }
            )

            Swal.fire({

                icon: 'success',

                title:
                    estado === 'aprobada'
                        ? 'Solicitud aprobada'
                        : 'Solicitud rechazada',

                timer: 2000,

                showConfirmButton: false
            })

            fetchSolicitudes()

        } catch (error) {

            Swal.fire(
                'Error',
                error.response?.data?.error ||
                'No se pudo procesar',
                'error'
            )

        }
    }

    // ======================================================
    // ABRIR MODAL ENTREGA
    // ======================================================

    const abrirModalEntrega = (pmc) => {

        const hoy = new Date()
            .toISOString()
            .split('T')[0]

        setProductoEntrega(pmc)

        setCantidadEntrega('')

        setTipoDestinatario('empleado')

        setDestinatarioId('')

        setFechaEntrega(hoy)

        setObservacionesEntrega('')

        setModalEntrega(true)
    }

    // ======================================================
    // CAMBIAR TIPO DE DESTINATARIO
    // ======================================================

    const cambiarTipoDestinatario = (tipo) => {

        setTipoDestinatario(tipo)

        setDestinatarioId('')

    }

    // ======================================================
    // OBTENER DESTINATARIO SELECCIONADO
    // ======================================================

    const obtenerDestinatarioSeleccionado = () => {

        if (!destinatarioId) {
            return null
        }

        if (tipoDestinatario === 'empleado') {

            return empleados.find(
                empleado =>
                    String(empleado.id_empleado) ===
                    String(destinatarioId)
            )

        }

        return usuarios.find(
            usuario =>
                String(usuario.id_usuario) ===
                String(destinatarioId)
        )
    }

    const destinatarioSeleccionado =
        obtenerDestinatarioSeleccionado()

    // ======================================================
    // OBTENER ÁREA AUTOMÁTICA
    // ======================================================

    const areaDestinatario =
        destinatarioSeleccionado?.area || ''

    // ======================================================
    // REGISTRAR ENTREGA PMC
    // ======================================================

    const registrarEntrega = async (e) => {

        e.preventDefault()

        if (!productoEntrega) {
            return
        }

        const cantidad = parseInt(
            cantidadEntrega,
            10
        )

        // --------------------------------------------------
        // VALIDAR CANTIDAD
        // --------------------------------------------------

        if (!cantidad || cantidad < 1) {

            Swal.fire({
                icon: 'warning',
                title: 'Cantidad inválida',
                text:
                    'La cantidad a entregar debe ser mayor a 0.'
            })

            return
        }

        if (
            cantidad >
            Number(productoEntrega.cantidad_disponible || 0)
        ) {

            Swal.fire({
                icon: 'warning',
                title: 'Stock insuficiente',
                text:
                    `Solo hay ${productoEntrega.cantidad_disponible} unidad(es) disponible(s).`
            })

            return
        }

        // --------------------------------------------------
        // VALIDAR DESTINATARIO
        // --------------------------------------------------

        if (!destinatarioId) {

            Swal.fire({
                icon: 'warning',
                title: 'Falta el destinatario',
                text:
                    'Selecciona el empleado o usuario que recibirá el producto.'
            })

            return
        }

        // --------------------------------------------------
        // VALIDAR ÁREA
        // --------------------------------------------------

        if (!areaDestinatario.trim()) {

            Swal.fire({
                icon: 'warning',
                title: 'Área no disponible',
                text:
                    'El destinatario seleccionado no tiene un área registrada.'
            })

            return
        }

        // --------------------------------------------------
        // VALIDAR FECHA
        // --------------------------------------------------

        if (!fechaEntrega) {

            Swal.fire({
                icon: 'warning',
                title: 'Falta la fecha',
                text:
                    'Selecciona la fecha de entrega.'
            })

            return
        }

        setGuardandoEntrega(true)

        try {

            const datosEntrega = {

                cantidad,

                id_empleado:
                    tipoDestinatario === 'empleado'
                        ? destinatarioId
                        : null,

                id_usuario:
                    tipoDestinatario === 'usuario'
                        ? Number(destinatarioId)
                        : null,

                area:
                    areaDestinatario.trim(),

                fecha_entrega:
                    fechaEntrega,

                observaciones:
                    observacionesEntrega.trim() || null
            }

            await axios.post(
                API_ROUTES.PMC_ENTREGAR(
                    productoEntrega.id
                ),
                datosEntrega
            )

            setModalEntrega(false)

            Swal.fire({

                icon: 'success',

                title: 'Entrega registrada',

                text:
                    `${cantidad} unidad(es) de "${productoEntrega.nombre}" fueron entregadas correctamente a ${destinatarioSeleccionado?.nombre || 'el destinatario seleccionado'}.`,

                timer: 3000,

                showConfirmButton: false
            })

            await fetchPMCs()

            await fetchEntregas()

        } catch (error) {

            Swal.fire({

                icon: 'error',

                title: 'Error al registrar la entrega',

                text:
                    error.response?.data?.error ||
                    'No se pudo registrar la entrega.'
            })

        } finally {

            setGuardandoEntrega(false)

        }
    }

    // ======================================================
    // ELIMINAR PRODUCTO
    // ======================================================

    const handleEliminar = async (id) => {

        const result = await Swal.fire({

            title: '¿Estás seguro?',

            text:
                'No podrás revertir esto',

            icon: 'warning',

            showCancelButton: true,

            confirmButtonColor: '#d33',

            cancelButtonColor: '#3085d6',

            confirmButtonText:
                'Sí, eliminar',

            cancelButtonText:
                'Cancelar'
        })

        if (!result.isConfirmed) {
            return
        }

        try {

            await axios.delete(
                `${API_ROUTES.PMC}/${id}`
            )

            Swal.fire(
                'Eliminado',
                'El consumible ha sido eliminado.',
                'success'
            )

            fetchPMCs()

        } catch (error) {

            Swal.fire(
                'Error',
                error.response?.data?.error ||
                'No se pudo eliminar',
                'error'
            )
        }
    }

    // ======================================================
    // OBTENER NOMBRE DESTINATARIO HISTORIAL
    // ======================================================

    const obtenerNombreEntrega = (entrega) => {

        if (entrega.empleado) {
            return entrega.empleado
        }

        if (entrega.usuario) {
            return entrega.usuario
        }

        if (entrega.nombre_usuario) {
            return entrega.nombre_usuario
        }

        return 'Sin destinatario'
    }

    // ======================================================
    // ABREVIAR UUID
    // ======================================================

    const abreviarUuid = (id) => {
        const s = String(id || '')
        const partes = s.split('-')
        if (partes.length > 1) {
            return `${partes[0]}-${partes[1]}…`
        }
        return s
    }

    // ======================================================
    // FILTRAR HISTORIAL
    // ======================================================

    const entregasFiltradas = entregas.filter(
        (entrega) => {
            const q = busquedaHistorial
                .trim()
                .toLowerCase()

            if (!q) return true

            const texto = [
                entrega.producto,
                obtenerNombreEntrega(entrega),
                entrega.area,
                entrega.observaciones,
                String(entrega.cantidad || '')
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            return texto.includes(q)
        }
    )

    // ======================================================
    // ESTADO DE CARGA
    // ======================================================

    if (loading) {

        return (
            <div className="text-center mt-5">

                <div
                    className="spinner-border text-primary mb-2"
                    role="status"
                ></div>

                <div>
                    Cargando inventario PMC...
                </div>

            </div>
        )
    }

    // ======================================================
    // SOLICITUDES PENDIENTES
    // ======================================================

    const solicitudesPendientes =
        solicitudes.filter(
            solicitud =>
                solicitud.estado === 'pendiente'
        )

    // ======================================================
    // DESTINATARIOS ACTIVOS
    // ======================================================

    const empleadosActivos =
        empleados.filter(
            empleado =>
                !empleado.estado ||
                empleado.estado.toLowerCase() === 'activo'
        )

    const usuariosActivos =
        usuarios.filter(
            usuario =>
                !usuario.estado ||
                usuario.estado.toLowerCase() === 'activo'
        )

    // ======================================================
    // VISTA
    // ======================================================

    return (

        <div>

            {/* ==================================================
                ENCABEZADO
            ================================================== */}

            <div className="module-header">

                <h2 className="module-title mb-0">
                    Inventario Menor (PMC)
                </h2>

                {puedeGestionar ? (

                    <button
                        className="btn btn-primary"
                        onClick={abrirModalCrear}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Registrar PMC
                    </button>

                ) : (

                    <span className="badge bg-secondary-subtle text-secondary-emphasis">

                        <i className="bi bi-cart me-1"></i>

                        Solicita al administrador

                    </span>

                )}

            </div>

            {/* ==================================================
                PESTAÑAS
            ================================================== */}

            <ul className="nav nav-pills mb-4 gap-2">

                {/* PRODUCTOS */}

                <li className="nav-item">

                    <button
                        className={`nav-link ${
                            vista === 'productos'
                                ? 'active'
                                : ''
                        }`}
                        onClick={() =>
                            setVista('productos')
                        }
                    >

                        <i className="bi bi-box-seam me-1"></i>

                        Productos

                    </button>

                </li>

                {/* SOLICITUDES */}

                <li className="nav-item">

                    <button
                        className={`nav-link ${
                            vista === 'solicitudes'
                                ? 'active'
                                : ''
                        }`}
                        onClick={() =>
                            setVista('solicitudes')
                        }
                    >

                        <i className="bi bi-clipboard-check me-1"></i>

                        Solicitudes

                        {solicitudesPendientes.length > 0 && (

                            <span className="badge text-bg-danger ms-2">

                                {solicitudesPendientes.length}

                            </span>

                        )}

                    </button>

                </li>

                {/* HISTORIAL */}

                {puedeGestionar && (

                    <li className="nav-item">

                        <button
                            className={`nav-link ${
                                vista === 'historial'
                                    ? 'active'
                                    : ''
                            }`}
                            onClick={() => {

                                setVista('historial')

                                fetchEntregas()

                            }}
                        >

                            <i className="bi bi-clock-history me-1"></i>

                            Historial

                        </button>

                    </li>

                )}

            </ul>

            {/* ==================================================
                PRODUCTOS
            ================================================== */}

            {vista === 'productos' && (

                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle">

                        <thead className="table-header">

                            <tr>

                                <th>ID</th>

                                <th>Nombre</th>

                                <th>Descripción</th>

                                <th className="text-center">
                                    Stock Total
                                </th>

                                <th className="text-center">
                                    Stock Disponible
                                </th>

                                <th className="text-center">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {pmcs.map(pmc => (

                                <tr key={pmc.id}>

                                    <td>

                                        <code
                                            className="text-dark fw-bold"
                                            title={pmc.id}
                                        >
                                            {abreviarUuid(pmc.id)}
                                        </code>

                                    </td>

                                    <td>
                                        {pmc.nombre}
                                    </td>

                                    <td>
                                        {pmc.descripcion || 'N/A'}
                                    </td>

                                    <td className="text-center">
                                        {pmc.cantidad_total}
                                    </td>

                                    <td className="text-center">

                                        <span className="text-success fw-bold">

                                            {pmc.cantidad_disponible}

                                        </span>

                                    </td>

                                    <td className="text-center">

                                        {puedeGestionar ? (

                                            <div className="d-flex gap-2 justify-content-center">

                                                {/* ENTREGAR */}

                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() =>
                                                        abrirModalEntrega(pmc)
                                                    }
                                                    title="Registrar entrega"
                                                    disabled={
                                                        Number(
                                                            pmc.cantidad_disponible || 0
                                                        ) <= 0
                                                    }
                                                >

                                                    <i className="bi bi-box-arrow-right me-1"></i>

                                                    Entregar

                                                </button>

                                                {/* ELIMINAR */}

                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() =>
                                                        handleEliminar(
                                                            pmc.id
                                                        )
                                                    }
                                                    title="Eliminar registro"
                                                >

                                                    <i className="bi bi-trash"></i>

                                                </button>

                                            </div>

                                        ) : (

                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                    abrirModalSolicitar(
                                                        pmc
                                                    )
                                                }
                                                title="Solicitar al administrador"
                                                disabled={
                                                    Number(
                                                        pmc.cantidad_disponible || 0
                                                    ) <= 0
                                                }
                                            >

                                                <i className="bi bi-cart-plus me-1"></i>

                                                Solicitar

                                            </button>

                                        )}

                                    </td>

                                </tr>

                            ))}

                            {pmcs.length === 0 && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center text-muted py-4"
                                    >
                                        No hay productos de menor cuantía registrados.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            )}

            {/* ==================================================
                SOLICITUDES
            ================================================== */}

            {vista === 'solicitudes' && (

                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle">

                        <thead className="table-header">

                            <tr>

                                <th>ID</th>

                                <th>Solicitante</th>

                                <th>Detalle / Producto</th>

                                <th>Fecha</th>

                                <th>Estado</th>

                                {esAdmin && (
                                    <th className="text-center">
                                        Acciones
                                    </th>
                                )}

                            </tr>

                        </thead>

                        <tbody>

                            {solicitudes.map(s => (

                                <tr key={s.id}>

                                    <td>
                                        <strong
                                            className="text-dark"
                                        >
                                            SOL-{String(s.id).padStart(4, '0')}
                                        </strong>
                                    </td>

                                    <td>
                                        {s.usuario}
                                    </td>

                                    <td>
                                        {s.detalles || '—'}
                                    </td>

                                    <td>

                                        {s.creado_en
                                            ? new Date(
                                                s.creado_en
                                            ).toLocaleDateString(
                                                'es-CO'
                                            )
                                            : '—'
                                        }

                                    </td>

                                    <td>

                                        {s.estado === 'pendiente' ? (

                                            <span className="badge text-bg-warning">
                                                Pendiente
                                            </span>

                                        ) : s.estado === 'aprobada' ? (

                                            <span className="badge text-bg-success">
                                                Aprobada
                                            </span>

                                        ) : (

                                            <span className="badge text-bg-danger">
                                                Rechazada
                                            </span>

                                        )}

                                    </td>

                                    {esAdmin && (

                                        <td className="text-center">

                                            {s.estado === 'pendiente' ? (

                                                <div className="d-flex gap-2 justify-content-center">

                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() =>
                                                            responderSolicitud(
                                                                s.id,
                                                                'aprobada'
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-check-lg me-1"></i>

                                                        Aprobar

                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() =>
                                                            responderSolicitud(
                                                                s.id,
                                                                'rechazada'
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-x-lg me-1"></i>

                                                        Rechazar

                                                    </button>

                                                </div>

                                            ) : (

                                                <span className="text-muted small">
                                                    Procesada
                                                </span>

                                            )}

                                        </td>

                                    )}

                                </tr>

                            ))}

                            {solicitudes.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={
                                            esAdmin
                                                ? 6
                                                : 5
                                        }
                                        className="text-center text-muted py-4"
                                    >
                                        No hay solicitudes.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            )}

            {/* ==================================================
                HISTORIAL DE ENTREGAS
            ================================================== */}

            {vista === 'historial' &&
                puedeGestionar && (

                    <div className="table-responsive">

                        <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">

                            <div className="input-group" style={{ maxWidth: '340px' }}>

                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por producto, destinatario, área..."
                                    value={busquedaHistorial}
                                    onChange={(e) =>
                                        setBusquedaHistorial(e.target.value)
                                    }
                                />

                                {busquedaHistorial && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() =>
                                            setBusquedaHistorial('')
                                        }
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}

                            </div>

                            {busquedaHistorial && (
                                <span className="text-muted small">
                                    {entregasFiltradas.length} de {entregas.length}
                                </span>
                            )}

                        </div>

                        {loadingEntregas ? (

                            <div className="text-center py-5">

                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                ></div>

                                <div className="mt-2 text-muted">
                                    Cargando historial...
                                </div>

                            </div>

                        ) : (

                            <table className="table table-striped table-hover align-middle">

                                <thead className="table-header">

                                    <tr>

                                        <th>ID</th>

                                        <th>Producto</th>

                                        <th>Cantidad</th>

                                        <th>Destinatario</th>

                                        <th>Tipo</th>

                                        <th>Área</th>

                                        <th>Fecha</th>

                                        <th>Observaciones</th>

                                        <th>Estado</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {entregasFiltradas.map(
                                        entrega => (

                                            <tr
                                                key={
                                                    entrega.id_entrega
                                                }
                                            >

                                                <td>

                                                    <code
                                                        className="text-dark fw-bold"
                                                        title={entrega.id_entrega}
                                                    >
                                                        {abreviarUuid(entrega.id_entrega)}
                                                    </code>

                                                </td>

                                                <td>
                                                    {entrega.producto}
                                                </td>

                                                <td className="text-center">

                                                    <span className="fw-bold">
                                                        {entrega.cantidad}
                                                    </span>

                                                </td>

                                                <td>
                                                    {obtenerNombreEntrega(
                                                        entrega
                                                    )}
                                                </td>

                                                <td>

                                                    {entrega.id_empleado ? (

                                                        <span className="badge text-bg-info">
                                                            Empleado
                                                        </span>

                                                    ) : (

                                                        <span className="badge text-bg-primary">
                                                            Usuario
                                                        </span>

                                                    )}

                                                </td>

                                                <td>
                                                    {entrega.area}
                                                </td>

                                                <td>

                                                    {entrega.fecha_entrega
                                                        ? new Date(
                                                            entrega.fecha_entrega
                                                        ).toLocaleDateString(
                                                            'es-CO'
                                                        )
                                                        : '—'
                                                    }

                                                </td>

                                                <td>
                                                    {entrega.observaciones || '—'}
                                                </td>

                                                <td>

                                                    <span className="badge text-bg-success">
                                                        Entregado
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                    {entregasFiltradas.length === 0 && (

                                        <tr>

                                            <td
                                                colSpan="9"
                                                className="text-center text-muted py-4"
                                            >
                                                No hay entregas PMC registradas.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        )}

                    </div>

                )}

            {/* ==================================================
                MODAL CREAR PMC
            ================================================== */}

            {modalCrear && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        display: 'block',
                        zIndex: '1050',
                        backgroundColor:
                            'rgba(0,0,0,0.5)'
                    }}
                    onClick={() =>
                        !guardando &&
                        setModalCrear(false)
                    }
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold">

                                    Registrar Nuevo Consumible (PMC)

                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        !guardando &&
                                        setModalCrear(false)
                                    }
                                    disabled={guardando}
                                ></button>

                            </div>

                            <form
                                onSubmit={
                                    guardarConsumible
                                }
                            >

                                <div className="modal-body">

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Nombre
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej: Cable HDMI"
                                            value={
                                                nuevoNombre
                                            }
                                            onChange={e =>
                                                setNuevoNombre(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardando
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Descripción
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={
                                                nuevaDescripcion
                                            }
                                            onChange={e =>
                                                setNuevaDescripcion(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardando
                                            }
                                        ></textarea>

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Cantidad Total
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 10"
                                            value={
                                                nuevaCantidad
                                            }
                                            onChange={e =>
                                                setNuevaCantidad(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardando
                                            }
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalCrear(false)
                                        }
                                        disabled={
                                            guardando
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            guardando
                                        }
                                    >

                                        {guardando
                                            ? 'Guardando...'
                                            : 'Registrar'
                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

            {/* ==================================================
                MODAL SOLICITAR
            ================================================== */}

            {modalSolicitar && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        display: 'block',
                        zIndex: '1050',
                        backgroundColor:
                            'rgba(0,0,0,0.5)'
                    }}
                    onClick={() =>
                        !enviandoSolicitud &&
                        setModalSolicitar(false)
                    }
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold">

                                    Solicitar{' '}
                                    {
                                        solicitarProducto?.nombre
                                    }

                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setModalSolicitar(
                                            false
                                        )
                                    }
                                    disabled={
                                        enviandoSolicitud
                                    }
                                ></button>

                            </div>

                            <form
                                onSubmit={
                                    enviarSolicitud
                                }
                            >

                                <div className="modal-body">

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Cantidad solicitada

                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 2"
                                            value={
                                                cantidadSolicitud
                                            }
                                            onChange={e =>
                                                setCantidadSolicitud(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                enviandoSolicitud
                                            }
                                            required
                                        />

                                        <small className="text-muted">

                                            Disponible:{' '}

                                            {
                                                solicitarProducto?.cantidad_disponible
                                            }

                                        </small>

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Justificación

                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Motivo de la solicitud..."
                                            value={
                                                justificacionSolicitud
                                            }
                                            onChange={e =>
                                                setJustificacionSolicitud(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                enviandoSolicitud
                                            }
                                        ></textarea>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalSolicitar(
                                                false
                                            )
                                        }
                                        disabled={
                                            enviandoSolicitud
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            enviandoSolicitud
                                        }
                                    >

                                        {enviandoSolicitud ? (

                                            <>

                                                <span className="spinner-border spinner-border-sm me-2"></span>

                                                Enviando...

                                            </>

                                        ) : (

                                            <>

                                                <i className="bi bi-send me-1"></i>

                                                Enviar Solicitud

                                            </>

                                        )}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

            {/* ==================================================
                MODAL REGISTRAR ENTREGA
            ================================================== */}

            {modalEntrega && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        display: 'block',
                        zIndex: '1050',
                        backgroundColor:
                            'rgba(0,0,0,0.5)'
                    }}
                    onClick={() =>
                        !guardandoEntrega &&
                        setModalEntrega(false)
                    }
                >

                    <div
                        className="modal-dialog modal-dialog-centered modal-lg"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            {/* HEADER */}

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold mb-1">

                                        Registrar entrega PMC

                                    </h5>

                                    <small className="text-muted">

                                        Producto:{' '}

                                        <strong>
                                            {
                                                productoEntrega?.nombre
                                            }
                                        </strong>

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        !guardandoEntrega &&
                                        setModalEntrega(false)
                                    }
                                    disabled={
                                        guardandoEntrega
                                    }
                                ></button>

                            </div>

                            {/* FORMULARIO */}

                            <form
                                onSubmit={
                                    registrarEntrega
                                }
                            >

                                <div className="modal-body">

                                    {/* INFORMACIÓN DEL PRODUCTO */}

                                    <div className="alert alert-primary">

                                        <div className="d-flex justify-content-between align-items-center">

                                            <div>

                                                <i className="bi bi-box-seam me-2"></i>

                                                <strong>
                                                    {
                                                        productoEntrega?.nombre
                                                    }
                                                </strong>

                                            </div>

                                            <span className="badge text-bg-success">

                                                Disponible:{' '}

                                                {
                                                    productoEntrega?.cantidad_disponible
                                                }

                                            </span>

                                        </div>

                                    </div>

                                    {/* CANTIDAD */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Cantidad a entregar

                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            max={
                                                productoEntrega?.cantidad_disponible
                                            }
                                            step="1"
                                            className="form-control"
                                            placeholder="Ej: 2"
                                            value={
                                                cantidadEntrega
                                            }
                                            onChange={e =>
                                                setCantidadEntrega(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardandoEntrega
                                            }
                                            required
                                        />

                                        <small className="text-muted">

                                            Máximo disponible:{' '}

                                            {
                                                productoEntrega?.cantidad_disponible
                                            }

                                        </small>

                                    </div>

                                    {/* TIPO DESTINATARIO */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Tipo de destinatario

                                        </label>

                                        <div className="d-flex gap-2">

                                            <button
                                                type="button"
                                                className={`btn flex-fill ${
                                                    tipoDestinatario ===
                                                    'empleado'
                                                        ? 'btn-primary'
                                                        : 'btn-outline-primary'
                                                }`}
                                                onClick={() =>
                                                    cambiarTipoDestinatario(
                                                        'empleado'
                                                    )
                                                }
                                                disabled={
                                                    guardandoEntrega
                                                }
                                            >

                                                <i className="bi bi-person-badge me-2"></i>

                                                Empleado

                                            </button>

                                            <button
                                                type="button"
                                                className={`btn flex-fill ${
                                                    tipoDestinatario ===
                                                    'usuario'
                                                        ? 'btn-primary'
                                                        : 'btn-outline-primary'
                                                }`}
                                                onClick={() =>
                                                    cambiarTipoDestinatario(
                                                        'usuario'
                                                    )
                                                }
                                                disabled={
                                                    guardandoEntrega
                                                }
                                            >

                                                <i className="bi bi-person-circle me-2"></i>

                                                Usuario

                                            </button>

                                        </div>

                                    </div>

                                    {/* DESTINATARIO */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            {tipoDestinatario ===
                                            'empleado'
                                                ? 'Empleado'
                                                : 'Usuario'
                                            }

                                        </label>

                                        <select
                                            className="form-select"
                                            value={
                                                destinatarioId
                                            }
                                            onChange={e =>
                                                setDestinatarioId(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardandoEntrega
                                            }
                                            required
                                        >

                                            <option value="">

                                                Seleccionar{' '}

                                                {tipoDestinatario ===
                                                'empleado'
                                                    ? 'empleado'
                                                    : 'usuario'
                                                }

                                            </option>

                                            {tipoDestinatario ===
                                            'empleado' ? (

                                                empleadosActivos.map(
                                                    empleado => (

                                                        <option
                                                            key={
                                                                empleado.id_empleado
                                                            }
                                                            value={
                                                                empleado.id_empleado
                                                            }
                                                        >

                                                            {
                                                                empleado.nombre
                                                            }

                                                           

                                                           

                                                        </option>

                                                    )
                                                )

                                            ) : (

                                                usuariosActivos.map(
                                                    usuario => (

                                                        <option
                                                            key={
                                                                usuario.id_usuario
                                                            }
                                                            value={
                                                                usuario.id_usuario
                                                            }
                                                        >

                                                            {
                                                                usuario.nombre
                                                            }

                                                            


                                                        </option>

                                                    )
                                                )

                                            )}

                                        </select>

                                    </div>

                                    {/* ÁREA AUTOMÁTICA */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Área del destinatario

                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={
                                                areaDestinatario
                                            }
                                            
                                        />

                                    

                                    </div>

                                    {/* FECHA */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Fecha de entrega

                                        </label>

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={
                                                fechaEntrega
                                            }
                                            onChange={e =>
                                                setFechaEntrega(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardandoEntrega
                                            }
                                            required
                                        />

                                    </div>

                                    {/* OBSERVACIONES */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Observaciones

                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Ej: Entregado para uso en sala de reuniones..."
                                            value={
                                                observacionesEntrega
                                            }
                                            onChange={e =>
                                                setObservacionesEntrega(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                guardandoEntrega
                                            }
                                        ></textarea>

                                    </div>

                                </div>

                                {/* FOOTER */}

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalEntrega(
                                                false
                                            )
                                        }
                                        disabled={
                                            guardandoEntrega
                                        }
                                    >

                                        Cancelar

                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            guardandoEntrega
                                        }
                                    >

                                        {guardandoEntrega ? (

                                            <>

                                                <span className="spinner-border spinner-border-sm me-2"></span>

                                                Registrando...

                                            </>

                                        ) : (

                                            <>

                                                <i className="bi bi-check-circle me-2"></i>

                                                Registrar entrega

                                            </>

                                        )}

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