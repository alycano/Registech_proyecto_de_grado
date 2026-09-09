import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_ROUTES } from '../api/apiRoutes'

const Departamentos = () => {

    // ======================================================
    // ESTADOS
    // ======================================================

    const [areas, setAreas] = useState([])
    const [prestamosActivos, setPrestamosActivos] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [equipos, setEquipos] = useState([])

    const [loading, setLoading] = useState(true)

    const [modalNuevo, setModalNuevo] = useState(false)
    const [modalEditar, setModalEditar] = useState(false)
    const [modalDetalles, setModalDetalles] = useState(false)

    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null)

    const [nombreArea, setNombreArea] = useState('')
    const [areaEditando, setAreaEditando] = useState('')


    // ======================================================
    // CARGAR DATOS
    // ======================================================

    const cargarDatos = async () => {

        try {

            setLoading(true)

            const [
                respuestaAreas,
                respuestaPrestamos,
                respuestaUsuarios,
                respuestaEmpleados,
                respuestaEquipos
            ] = await Promise.all([
                axios.get(API_ROUTES.OBTENER_AREAS),
                axios.get(API_ROUTES.PRESTAMOS_ACTIVOS),
                axios.get(API_ROUTES.OBTENER_USUARIOS),
                axios.get(API_ROUTES.OBTENER_EMPLEADOS),
                axios.get(API_ROUTES.EQUIPOS)
            ])

            setAreas(
                Array.isArray(respuestaAreas.data)
                    ? respuestaAreas.data
                    : []
            )

            setPrestamosActivos(
                Array.isArray(respuestaPrestamos.data)
                    ? respuestaPrestamos.data
                    : []
            )

            setUsuarios(
                Array.isArray(respuestaUsuarios.data)
                    ? respuestaUsuarios.data
                    : []
            )

            setEmpleados(
                Array.isArray(respuestaEmpleados.data)
                    ? respuestaEmpleados.data
                    : []
            )

            setEquipos(
                Array.isArray(respuestaEquipos.data)
                    ? respuestaEquipos.data
                    : []
            )

        } catch (error) {

            console.error(
                'Error al cargar departamentos:',
                error
            )

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los departamentos'
            })

        } finally {

            setLoading(false)

        }

    }


    useEffect(() => {
        cargarDatos()
    }, [])


    // ======================================================
    // OBTENER ÁREA DEL PRÉSTAMO
    // ======================================================
    //
    // IMPORTANTE:
    //
    // NO usamos equipos.area.
    //
    // El departamento de un equipo prestado se determina
    // mediante el área guardada en el préstamo.
    //
    // prestamos.area
    //
    // Esto permite que:
    //
    // 1. Un equipo disponible no pertenezca a un departamento.
    // 2. Un equipo prestado aparezca en el departamento
    //    del destinatario.
    // 3. Al devolverlo desaparezca del departamento.
    //
    // ======================================================

    const obtenerAreaPrestamo = (prestamo) => {

        if (!prestamo) {
            return null
        }

        return prestamo.area || null
    }


    // ======================================================
    // OBTENER DESTINATARIO
    // ======================================================

    const obtenerDestinatario = (prestamo) => {

        if (!prestamo) {
            return 'Sin destinatario'
        }

        return (
            prestamo.destinatario ||
            prestamo.empleado ||
            prestamo.usuario ||
            'Sin destinatario'
        )
    }


    // ======================================================
    // OBTENER EQUIPOS DE UN DEPARTAMENTO
    // ======================================================

    const obtenerEquiposArea = (area) => {

        const equipos = []
        const serialesAgregados = new Set()

        if (!area) {
            return equipos
        }

        prestamosActivos.forEach((prestamo) => {

            const areaPrestamo = obtenerAreaPrestamo(prestamo)

            if (!areaPrestamo) {
                return
            }

            if (
                areaPrestamo.toLowerCase() !==
                area.toLowerCase()
            ) {
                return
            }

            const equiposPrestamo =
                Array.isArray(prestamo.equipos)
                    ? prestamo.equipos
                    : []

            equiposPrestamo.forEach((equipo) => {

                if (!equipo || !equipo.num_serie) {
                    return
                }

                // Evitar duplicar equipos
                if (serialesAgregados.has(equipo.num_serie)) {
                    return
                }

                serialesAgregados.add(equipo.num_serie)

                equipos.push({
                    ...equipo,

                    id_prestamo:
                        prestamo.id_prestamo,

                    destinatario:
                        obtenerDestinatario(prestamo),

                    id_empleado:
                        prestamo.id_empleado || null,

                    id_usuario:
                        prestamo.id_usuario || null,

                    area:
                        areaPrestamo,

                    fecha_prestamo:
                        prestamo.fecha_prestamo,

                    fecha_devolucion:
                        prestamo.fecha_devolucion,

                    observaciones:
                        prestamo.observaciones || null
                })

            })

        })

        return equipos
    }


    // ======================================================
    // OBTENER USUARIOS DEL ÁREA
    // ======================================================

    const obtenerUsuariosArea = (area) => {

        if (!area) {
            return []
        }

        return usuarios.filter((usuario) => {

            if (!usuario?.area) {
                return false
            }

            return (
                usuario.area.toLowerCase() ===
                area.toLowerCase()
            )
        })
    }


    // ======================================================
    // OBTENER EMPLEADOS DEL ÁREA
    // ======================================================

    const obtenerEmpleadosArea = (area) => {

        if (!area) {
            return []
        }

        return empleados.filter((empleado) => {

            if (!empleado?.area) {
                return false
            }

            return (
                empleado.area.toLowerCase() ===
                area.toLowerCase()
            )
        })
    }


    // ======================================================
    // CONTAR EQUIPOS DEL ÁREA
    // ======================================================

    const contarEquipos = (area) => {
        if (!area) return 0
        return equipos.filter(e =>
            String(e.area || '').toLowerCase() === area.toLowerCase() &&
            String(e.estado).toLowerCase() !== 'baja'
        ).length
    }


    // ======================================================
    // CONTAR USUARIOS DEL ÁREA
    // ======================================================

    const contarUsuarios = (area) => {
        return obtenerUsuariosArea(area).length
    }


    // ======================================================
    // CONTAR EMPLEADOS DEL ÁREA
    // ======================================================

    const contarEmpleados = (area) => {
        return obtenerEmpleadosArea(area).length
    }


    // ======================================================
    // ABRIR DETALLES
    // ======================================================

    const abrirDetalles = (area) => {

        setDepartamentoSeleccionado({
            area
        })

        setModalDetalles(true)
    }


    // ======================================================
    // CERRAR DETALLES
    // ======================================================

    const cerrarDetalles = () => {

        setModalDetalles(false)
        setDepartamentoSeleccionado(null)
    }


    // ======================================================
    // CREAR DEPARTAMENTO
    // ======================================================

    const abrirNuevo = () => {

        setNombreArea('')
        setModalNuevo(true)
    }


    const cerrarNuevo = () => {

        setModalNuevo(false)
        setNombreArea('')
    }


    const crearDepartamento = async (e) => {

        e.preventDefault()

        const nombre = nombreArea.trim()

        if (!nombre) {

            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Ingrese el nombre del departamento'
            })

            return
        }

        if (nombre.length < 2) {

            Swal.fire({
                icon: 'warning',
                title: 'Nombre inválido',
                text: 'El nombre debe tener al menos 2 caracteres'
            })

            return
        }

        try {

            await axios.post(
                API_ROUTES.CREAR_AREA,
                {
                    area: nombre
                }
            )

            await Swal.fire({
                icon: 'success',
                title: 'Departamento creado',
                text: 'El departamento se creó correctamente',
                timer: 1800,
                showConfirmButton: false
            })

            cerrarNuevo()

            await cargarDatos()

        } catch (error) {

            console.error(
                'Error al crear departamento:',
                error
            )

            Swal.fire({
                icon: 'error',
                title: 'No se pudo crear',
                text:
                    error.response?.data?.error ||
                    'No se pudo crear el departamento'
            })
        }
    }


    // ======================================================
    // ABRIR EDITAR
    // ======================================================

    const abrirEditar = (area) => {

        setAreaEditando(area)
        setNombreArea(area)
        setModalEditar(true)
    }


    const cerrarEditar = () => {

        setModalEditar(false)
        setNombreArea('')
        setAreaEditando('')
    }


    // ======================================================
    // RENOMBRAR DEPARTAMENTO
    // ======================================================

    const actualizarDepartamento = async (e) => {

        e.preventDefault()

        const nuevoNombre = nombreArea.trim()

        if (!nuevoNombre) {

            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Ingrese el nuevo nombre'
            })

            return
        }

        if (nuevoNombre.length < 2) {

            Swal.fire({
                icon: 'warning',
                title: 'Nombre inválido',
                text: 'El nombre debe tener al menos 2 caracteres'
            })

            return
        }

        try {

            await axios.put(
                API_ROUTES.ACTUALIZAR_AREA(areaEditando),
                {
                    area: nuevoNombre
                }
            )

            await Swal.fire({
                icon: 'success',
                title: 'Departamento actualizado',
                text: 'El departamento se renombró correctamente',
                timer: 1800,
                showConfirmButton: false
            })

            cerrarEditar()

            await cargarDatos()

        } catch (error) {

            console.error(
                'Error al actualizar departamento:',
                error
            )

            Swal.fire({
                icon: 'error',
                title: 'No se pudo actualizar',
                text:
                    error.response?.data?.error ||
                    'No se pudo actualizar el departamento'
            })
        }
    }


    // ======================================================
    // ELIMINAR DEPARTAMENTO
    // ======================================================

    const eliminarDepartamento = async (area) => {

        const cantidadEquipos = contarEquipos(area)
        const cantidadUsuarios = contarUsuarios(area)
        const cantidadEmpleados = contarEmpleados(area)

        if (
            cantidadEquipos > 0 ||
            cantidadUsuarios > 0 ||
            cantidadEmpleados > 0
        ) {

            const partes = []

            if (cantidadEquipos > 0) {

                partes.push(
                    `${cantidadEquipos} equipo(s)`
                )
            }

            if (cantidadEmpleados > 0) {

                partes.push(
                    `${cantidadEmpleados} empleado(s)`
                )
            }

            if (cantidadUsuarios > 0) {

                partes.push(
                    `${cantidadUsuarios} usuario(s)`
                )
            }

            Swal.fire({
                icon: 'warning',
                title: 'No se puede eliminar',
                text:
                    `El departamento tiene ${partes.join(', ')} asociado(s). ` +
                    'Debe quedar libre antes de eliminarlo.'
            })

            return
        }

        const confirmacion = await Swal.fire({

            icon: 'warning',

            title:
                `¿Eliminar "${area}"?`,

            text:
                'Esta acción no se puede deshacer.',

            showCancelButton: true,

            confirmButtonText:
                'Sí, eliminar',

            cancelButtonText:
                'Cancelar',

            confirmButtonColor:
                '#dc3545'
        })

        if (!confirmacion.isConfirmed) {
            return
        }

        try {

            await axios.delete(
                API_ROUTES.ELIMINAR_AREA(area)
            )

            await Swal.fire({
                icon: 'success',
                title: 'Departamento eliminado',
                text: 'El departamento se eliminó correctamente',
                timer: 1800,
                showConfirmButton: false
            })

            await cargarDatos()

        } catch (error) {

            console.error(
                'Error al eliminar departamento:',
                error
            )

            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text:
                    error.response?.data?.error ||
                    'No se pudo eliminar el departamento'
            })
        }
    }


    // ======================================================
    // FORMATEAR FECHA
    // ======================================================

    const formatearFecha = (fecha) => {

        if (!fecha) {
            return 'Sin fecha'
        }

        const fechaObj = new Date(fecha)

        if (Number.isNaN(fechaObj.getTime())) {
            return 'Sin fecha'
        }

        return fechaObj.toLocaleDateString(
            'es-CO',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        )
    }


    // ======================================================
    // ESTADO DEL EQUIPO
    // ======================================================

    const obtenerClaseEstado = (estado) => {

        const estadoNormalizado =
            String(estado || '').toLowerCase()

        if (
            estadoNormalizado === 'asignado' ||
            estadoNormalizado === 'prestado'
        ) {
            return 'bg-primary'
        }

        if (estadoNormalizado === 'disponible') {
            return 'bg-success'
        }

        if (
            estadoNormalizado.includes('mantenimiento')
        ) {
            return 'bg-warning text-dark'
        }

        return 'bg-secondary'
    }


    // ======================================================
    // DATOS DEL MODAL DE DETALLES
    // ======================================================

    const equiposDetalles =
        departamentoSeleccionado
            ? obtenerEquiposArea(
                departamentoSeleccionado.area
            )
            : []

    const usuariosDetalles =
        departamentoSeleccionado
            ? obtenerUsuariosArea(
                departamentoSeleccionado.area
            )
            : []

    const empleadosDetalles =
        departamentoSeleccionado
            ? obtenerEmpleadosArea(
                departamentoSeleccionado.area
            )
            : []


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <div className="container-fluid py-4">

                <div className="d-flex justify-content-center align-items-center py-5">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Cargando...
                        </span>
                    </div>

                </div>

            </div>
        )
    }


    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="container-fluid py-4">

            {/* ==================================================
                ENCABEZADO
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Departamentos
                    </h2>

                    <p className="text-muted mb-0">
                        Gestiona los departamentos y consulta
                        los recursos asociados actualmente.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={abrirNuevo}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Nuevo departamento
                </button>

            </div>


            {/* ==================================================
                SIN DEPARTAMENTOS
            ================================================== */}

            {areas.length === 0 ? (

                <div className="card shadow-sm border-0">

                    <div className="card-body text-center py-5">

                        <i className="bi bi-building fs-1 text-muted"></i>

                        <h5 className="mt-3">
                            No hay departamentos registrados
                        </h5>

                        <p className="text-muted">
                            Crea el primer departamento para
                            comenzar a organizar los recursos.
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={abrirNuevo}
                        >
                            Crear departamento
                        </button>

                    </div>

                </div>

            ) : (

                <div className="row g-4">

                    {areas.map((item) => {

                        const area = item.area

                        const cantidadEquipos =
                            contarEquipos(area)

                        const cantidadUsuarios =
                            contarUsuarios(area)

                        const cantidadEmpleados =
                            contarEmpleados(area)

                        return (
                            <div
                                className="col-12 col-md-6 col-xl-4"
                                key={area}
                            >

                                <div className="card h-100 shadow-sm border-0">

                                    <div className="card-body">

                                        {/* ENCABEZADO DE LA TARJETA */}

                                        <div className="d-flex justify-content-between align-items-start mb-3">

                                            <div className="d-flex align-items-center">

                                                <div
                                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                                    style={{
                                                        width: '48px',
                                                        height: '48px'
                                                    }}
                                                >
                                                    <i className="bi bi-building text-primary fs-4"></i>
                                                </div>

                                                <div>

                                                    <h5 className="fw-bold mb-1">
                                                        {area}
                                                    </h5>

                                                    <small className="text-muted">
                                                        Departamento
                                                    </small>

                                                </div>

                                            </div>


                                            {/* MENÚ */}

                                            <div className="dropdown">

                                                <button
                                                    className="btn btn-sm btn-light"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>

                                                <ul className="dropdown-menu dropdown-menu-end">

                                                    <li>

                                                        <button
                                                            type="button"
                                                            className="dropdown-item"
                                                            onClick={() =>
                                                                abrirEditar(area)
                                                            }
                                                        >
                                                            <i className="bi bi-pencil me-2"></i>
                                                            Editar
                                                        </button>

                                                    </li>

                                                    <li>
                                                        <hr className="dropdown-divider" />
                                                    </li>

                                                    <li>

                                                        <button
                                                            type="button"
                                                            className="dropdown-item text-danger"
                                                            onClick={() =>
                                                                eliminarDepartamento(area)
                                                            }
                                                        >
                                                            <i className="bi bi-trash me-2"></i>
                                                            Eliminar
                                                        </button>

                                                    </li>

                                                </ul>

                                            </div>

                                        </div>


                                        {/* ESTADÍSTICAS */}

                                        <div className="row g-2 mb-3">

                                            <div className="col-4">

                                                <div className="bg-light rounded p-3 text-center">

                                                    <i className="bi bi-laptop text-primary fs-5"></i>

                                                    <div className="fw-bold fs-5 mt-1">
                                                        {cantidadEquipos}
                                                    </div>

                                                    <small className="text-muted">
                                                        Equipos
                                                    </small>

                                                </div>

                                            </div>


                                            <div className="col-4">

                                                <div className="bg-light rounded p-3 text-center">

                                                    <i className="bi bi-person-badge text-success fs-5"></i>

                                                    <div className="fw-bold fs-5 mt-1">
                                                        {cantidadEmpleados}
                                                    </div>

                                                    <small className="text-muted">
                                                        Empleados
                                                    </small>

                                                </div>

                                            </div>


                                            <div className="col-4">

                                                <div className="bg-light rounded p-3 text-center">

                                                    <i className="bi bi-people text-info fs-5"></i>

                                                    <div className="fw-bold fs-5 mt-1">
                                                        {cantidadUsuarios}
                                                    </div>

                                                    <small className="text-muted">
                                                        Usuarios
                                                    </small>

                                                </div>

                                            </div>

                                        </div>


                                        {/* INFORMACIÓN */}

                                        <div className="mb-3">

                                            <div className="d-flex align-items-center text-muted small mb-2">

                                                <i className="bi bi-info-circle me-2"></i>

                                                <span>
                                                     Los equipos se muestran aquí mientras estén prestados
        a personas de este departamento.

                                                </span>

                                            </div>

                                        </div>


                                        {/* BOTÓN DETALLES */}

                                        <button
                                            type="button"
                                            className="btn btn-primary btn-detalle-solid w-100"
                                            onClick={() =>
                                                abrirDetalles(area)
                                            }
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            Ver detalles
                                        </button>

                                    </div>

                                </div>

                            </div>
                        )
                    })}

                </div>

            )}


            {/* ==================================================
                MODAL NUEVO DEPARTAMENTO
            ================================================== */}

            {modalNuevo && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title">

                                    <i className="bi bi-building-add me-2"></i>

                                    Nuevo departamento

                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarNuevo}
                                ></button>

                            </div>


                            <form onSubmit={crearDepartamento}>

                                <div className="modal-body">

                                    <label
                                        htmlFor="nombreDepartamento"
                                        className="form-label fw-semibold"
                                    >
                                        Nombre del departamento
                                    </label>

                                    <input
                                        id="nombreDepartamento"
                                        type="text"
                                        className="form-control"
                                        value={nombreArea}
                                        onChange={(e) =>
                                            setNombreArea(e.target.value)
                                        }
                                        maxLength={100}
                                        placeholder="Ej. Sistemas"
                                        autoFocus
                                    />

                                </div>


                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cerrarNuevo}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        <i className="bi bi-save me-2"></i>
                                        Crear departamento
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}


            {/* ==================================================
                MODAL EDITAR DEPARTAMENTO
            ================================================== */}

            {modalEditar && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title">

                                    <i className="bi bi-pencil-square me-2"></i>

                                    Editar departamento

                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarEditar}
                                ></button>

                            </div>


                            <form onSubmit={actualizarDepartamento}>

                                <div className="modal-body">

                                    <label
                                        htmlFor="editarDepartamento"
                                        className="form-label fw-semibold"
                                    >
                                        Nombre del departamento
                                    </label>

                                    <input
                                        id="editarDepartamento"
                                        type="text"
                                        className="form-control"
                                        value={nombreArea}
                                        onChange={(e) =>
                                            setNombreArea(e.target.value)
                                        }
                                        maxLength={100}
                                        autoFocus
                                    />


                                    <div className="alert alert-info mt-3 mb-0">

                                        <i className="bi bi-info-circle me-2"></i>

                                        Al cambiar el nombre, también se
                                        actualizará el departamento de los
                                        empleados, usuarios y préstamos
                                        asociados.

                                    </div>

                                </div>


                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cerrarEditar}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        <i className="bi bi-check-lg me-2"></i>
                                        Guardar cambios
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}


            {/* ==================================================
                MODAL DETALLES
            ================================================== */}

            {modalDetalles && departamentoSeleccionado && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.6)'
                    }}
                >

                    <div
                        className="modal-dialog modal-xl modal-dialog-scrollable"
                        role="document"
                    >

                        <div className="modal-content">

                            {/* HEADER */}

                            <div className="modal-header">

                                <div>

                                    <h4 className="modal-title fw-bold mb-1">

                                        <i className="bi bi-building me-2 text-primary"></i>

                                        {departamentoSeleccionado.area}

                                    </h4>

                                    <small className="text-muted">
                                        Detalles del departamento
                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarDetalles}
                                ></button>

                            </div>


                            <div className="modal-body">

                                {/* ==================================================
                                    RESUMEN
                                ================================================== */}

                                <div className="row g-3 mb-4">

                                    <div className="col-12 col-md-4">

                                        <div className="card border-0 bg-primary bg-opacity-10 h-100">

                                            <div className="card-body">

                                                <div className="d-flex justify-content-between align-items-center">

                                                    <div>

                                                        <small className="text-muted">
                                                            Equipos prestados
                                                        </small>

                                                        <h3 className="fw-bold mb-0 text-primary">
                                                            {equiposDetalles.length}
                                                        </h3>

                                                    </div>

                                                    <i className="bi bi-laptop fs-1 text-primary"></i>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="card border-0 bg-success bg-opacity-10 h-100">

                                            <div className="card-body">

                                                <div className="d-flex justify-content-between align-items-center">

                                                    <div>

                                                        <small className="text-muted">
                                                            Empleados
                                                        </small>

                                                        <h3 className="fw-bold mb-0 text-success">
                                                            {empleadosDetalles.length}
                                                        </h3>

                                                    </div>

                                                    <i className="bi bi-person-badge fs-1 text-success"></i>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="card border-0 bg-info bg-opacity-10 h-100">

                                            <div className="card-body">

                                                <div className="d-flex justify-content-between align-items-center">

                                                    <div>

                                                        <small className="text-muted">
                                                            Usuarios
                                                        </small>

                                                        <h3 className="fw-bold mb-0 text-info">
                                                            {usuariosDetalles.length}
                                                        </h3>

                                                    </div>

                                                    <i className="bi bi-people fs-1 text-info"></i>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* ==================================================
                                    EQUIPOS
                                ================================================== */}

                                <div className="mb-4">

                                    <div className="d-flex align-items-center mb-3">

                                        <i className="bi bi-laptop me-2 text-primary"></i>

                                        <h5 className="fw-bold mb-0">
                                            Equipos actualmente asignados
                                        </h5>

                                    </div>


                                    {equiposDetalles.length === 0 ? (

                                        <div className="alert alert-light border">

                                            <i className="bi bi-info-circle me-2"></i>

                                            No hay equipos actualmente prestados
                                            a personas de este departamento.

                                        </div>

                                    ) : (

                                        <div className="row g-3">

                                            {equiposDetalles.map((equipo, index) => (

                                                <div
                                                    className="col-12 col-md-6"
                                                    key={
                                                        equipo.num_serie ||
                                                        index
                                                    }
                                                >

                                                    <div className="card h-100 border shadow-sm">

                                                        <div className="card-body">

                                                            <div className="d-flex justify-content-between align-items-start mb-3">

                                                                <div>

                                                                    <h6 className="fw-bold mb-1">
                                                                        {equipo.equipo || 'Equipo'}
                                                                    </h6>

                                                                    <small className="text-muted">

                                                                        Serial:{' '}

                                                                        <strong>
                                                                            {equipo.num_serie}
                                                                        </strong>

                                                                    </small>

                                                                </div>


                                                                <span
                                                                    className={`badge ${obtenerClaseEstado(
                                                                        equipo.estado ||
                                                                        equipo.estado_equipo
                                                                    )}`}
                                                                >
                                                                    {
                                                                        equipo.estado ||
                                                                        equipo.estado_equipo ||
                                                                        'Asignado'
                                                                    }
                                                                </span>

                                                            </div>


                                                            <div className="small">

                                                                <div className="mb-2">

                                                                    <i className="bi bi-person me-2 text-muted"></i>

                                                                    <strong>
                                                                        Destinatario:
                                                                    </strong>{' '}

                                                                    {equipo.destinatario}

                                                                </div>


                                                                <div className="mb-2">

                                                                    <i className="bi bi-building me-2 text-muted"></i>

                                                                    <strong>
                                                                        Departamento:
                                                                    </strong>{' '}

                                                                    {equipo.area}

                                                                </div>


                                                                <div className="mb-2">

                                                                    <i className="bi bi-calendar-check me-2 text-muted"></i>

                                                                    <strong>
                                                                        Fecha del préstamo:
                                                                    </strong>{' '}

                                                                    {formatearFecha(
                                                                        equipo.fecha_prestamo
                                                                    )}

                                                                </div>


                                                                <div className="mb-2">

                                                                    <i className="bi bi-calendar-event me-2 text-muted"></i>

                                                                    <strong>
                                                                        Fecha límite:
                                                                    </strong>{' '}

                                                                    {equipo.fecha_devolucion
                                                                        ? formatearFecha(
                                                                            equipo.fecha_devolucion
                                                                        )
                                                                        : 'Sin fecha límite'}

                                                                </div>


                                                                {equipo.sistema_operativo && (

                                                                    <div className="mb-2">

                                                                        <i className="bi bi-window me-2 text-muted"></i>

                                                                        <strong>
                                                                            Sistema:
                                                                        </strong>{' '}

                                                                        {equipo.sistema_operativo}

                                                                    </div>

                                                                )}


                                                                {equipo.descripcion && (

                                                                    <div className="mb-2">

                                                                        <i className="bi bi-card-text me-2 text-muted"></i>

                                                                        <strong>
                                                                            Descripción:
                                                                        </strong>{' '}

                                                                        {equipo.descripcion}

                                                                    </div>

                                                                )}

                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    )}

                                </div>


                                {/* ==================================================
                                    EMPLEADOS
                                ================================================== */}

                                <div className="mb-4">

                                    <div className="d-flex align-items-center mb-3">

                                        <i className="bi bi-person-badge me-2 text-success"></i>

                                        <h5 className="fw-bold mb-0">
                                            Empleados del departamento
                                        </h5>

                                    </div>


                                    {empleadosDetalles.length === 0 ? (

                                        <div className="alert alert-light border">

                                            <i className="bi bi-info-circle me-2"></i>

                                            No hay empleados registrados
                                            en este departamento.

                                        </div>

                                    ) : (

                                        <div className="table-responsive">

                                            <table className="table table-hover align-middle">

                                                <thead className="table-light">

                                                    <tr>

                                                        <th>
                                                            Nombre
                                                        </th>

                                                        <th>
                                                            Documento
                                                        </th>

                                                        <th>
                                                            Correo
                                                        </th>

                                                        <th>
                                                            Estado
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {empleadosDetalles.map((empleado) => (

                                                        <tr
                                                            key={
                                                                empleado.id_empleado
                                                            }
                                                        >

                                                            <td className="fw-semibold">

                                                                {
                                                                    empleado.nombre ||
                                                                    'Sin nombre'
                                                                }

                                                            </td>


                                                            <td>

                                                                {
                                                                    empleado.documento ||
                                                                    'Sin documento'
                                                                }

                                                            </td>


                                                            <td>

                                                                {
                                                                    empleado.correo ||
                                                                    'Sin correo'
                                                                }

                                                            </td>


                                                            <td>

                                                                <span className="badge bg-secondary">

                                                                    {
                                                                        empleado.estado ||
                                                                        'Sin estado'
                                                                    }

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>


                                {/* ==================================================
                                    USUARIOS
                                ================================================== */}

                                <div>

                                    <div className="d-flex align-items-center mb-3">

                                        <i className="bi bi-people me-2 text-info"></i>

                                        <h5 className="fw-bold mb-0">
                                            Usuarios del departamento
                                        </h5>

                                    </div>


                                    {usuariosDetalles.length === 0 ? (

                                        <div className="alert alert-light border">

                                            <i className="bi bi-info-circle me-2"></i>

                                            No hay usuarios registrados
                                            en este departamento.

                                        </div>

                                    ) : (

                                        <div className="table-responsive">

                                            <table className="table table-hover align-middle">

                                                <thead className="table-light">

                                                    <tr>

                                                        <th>
                                                            Nombre
                                                        </th>

                                                        <th>
                                                            Usuario
                                                        </th>

                                                        <th>
                                                            Correo
                                                        </th>

                                                        <th>
                                                            Estado
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {usuariosDetalles.map((usuario) => (

                                                        <tr
                                                            key={
                                                                usuario.id_usuario
                                                            }
                                                        >

                                                            <td className="fw-semibold">

                                                                {
                                                                    usuario.nombre ||
                                                                    'Sin nombre'
                                                                }

                                                            </td>


                                                            <td>

                                                                {
                                                                    usuario.usuario ||
                                                                    'Sin usuario'
                                                                }

                                                            </td>


                                                            <td>

                                                                {
                                                                    usuario.correo ||
                                                                    'Sin correo'
                                                                }

                                                            </td>


                                                            <td>

                                                                <span className="badge bg-secondary">

                                                                    {
                                                                        usuario.estado ||
                                                                        'Sin estado'
                                                                    }

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    ))}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cerrarDetalles}
                                >
                                    Cerrar
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    )
}

export default Departamentos