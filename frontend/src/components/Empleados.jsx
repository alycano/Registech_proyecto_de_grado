import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_ROUTES } from '../api/apiRoutes'

const Empleados = () => {

    const [empleados, setEmpleados] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalEmpleado, setModalEmpleado] = useState(false)
    const [filteredEmpleados, setFilteredEmpleados] = useState([])

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState({
        nombre: '',
        tipo_documento: 'CC',
        documento: '',
        correo: '',
        area: '',
        estado: 'activo',
        isEditing: false
    })

    const [filter, setFilter] = useState('')

    // ======================================================
    // OBTENER EMPLEADOS Y ÁREAS
    // ======================================================
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resEmpleados, resAreas] = await Promise.all([
                    axios.get(API_ROUTES.OBTENER_EMPLEADOS),
                    axios.get(API_ROUTES.OBTENER_AREAS)
                ])

                const empleadosData = Array.isArray(resEmpleados.data)
                    ? resEmpleados.data
                    : []

                const areasData = Array.isArray(resAreas.data)
                    ? resAreas.data
                    : []

                setEmpleados(empleadosData)
                setFilteredEmpleados(empleadosData)
                setAreas(areasData)
                setLoading(false)

            } catch (err) {
                console.error('Error al cargar empleados:', err)

                setError('Hubo un error al obtener los empleados')
                setLoading(false)
            }
        }

        cargarDatos()
    }, [])

    // ======================================================
    // FILTRAR EMPLEADOS
    // ======================================================
    const handleFilterChange = (e) => {

        const value = e.target.value

        setFilter(value)

        const texto = value.toLowerCase()

        const filtered = empleados.filter(empleado =>
            (empleado.nombre || '').toLowerCase().includes(texto) ||
            (empleado.documento || '').toLowerCase().includes(texto) ||
            (empleado.correo || '').toLowerCase().includes(texto) ||
            (empleado.area || '').toLowerCase().includes(texto) ||
            (empleado.estado || '').toLowerCase().includes(texto) ||
            (empleado.tipo_documento || '').toLowerCase().includes(texto)
        )

        setFilteredEmpleados(filtered)
    }

    // ======================================================
    // NUEVO EMPLEADO
    // ======================================================
    const nuevoEmpleado = () => {

        setEmpleadoSeleccionado({
            nombre: '',
            tipo_documento: 'CC',
            documento: '',
            correo: '',
            area: '',
            estado: 'activo',
            isEditing: false
        })

        setModalEmpleado(true)
    }

    // ======================================================
    // EDITAR EMPLEADO
    // ======================================================
    const editarEmpleado = (empleado) => {

        setEmpleadoSeleccionado({
            ...empleado,
            isEditing: true
        })

        setModalEmpleado(true)
    }

    // ======================================================
    // CAMBIOS EN FORMULARIO
    // ======================================================
    const handleChange = (e) => {

        const { name, value } = e.target

        setEmpleadoSeleccionado({
            ...empleadoSeleccionado,
            [name]: value
        })
    }

    // ======================================================
    // GUARDAR EMPLEADO
    // ======================================================
    const guardarEmpleado = async () => {

        if (
            !empleadoSeleccionado.nombre.trim() ||
            !empleadoSeleccionado.tipo_documento ||
            !empleadoSeleccionado.documento.trim() ||
            !empleadoSeleccionado.area
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obligatorios',
                text: 'Completa nombre, tipo de documento, documento y área.'
            })

            return
        }

        try {

            if (empleadoSeleccionado.isEditing) {

                const response = await axios.put(
                    API_ROUTES.ACTUALIZAR_EMPLEADO(
                        empleadoSeleccionado.id_empleado
                    ),
                    {
                        nombre: empleadoSeleccionado.nombre,
                        tipo_documento: empleadoSeleccionado.tipo_documento,
                        documento: empleadoSeleccionado.documento,
                        correo: empleadoSeleccionado.correo,
                        area: empleadoSeleccionado.area,
                        estado: empleadoSeleccionado.estado
                    }
                )

                const updateEmpleados = empleados.map(empleado =>
                    empleado.id_empleado === empleadoSeleccionado.id_empleado
                        ? {
                            ...empleado,
                            ...empleadoSeleccionado,
                            ...response.data
                        }
                        : empleado
                )

                setEmpleados(updateEmpleados)
                setFilteredEmpleados(
                    filtrarEmpleados(updateEmpleados, filter)
                )

                setModalEmpleado(false)

                Swal.fire({
                    icon: 'success',
                    title: 'Empleado actualizado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                })

            } else {

                const response = await axios.post(
                    API_ROUTES.CREAR_EMPLEADO,
                    {
                        nombre: empleadoSeleccionado.nombre,
                        tipo_documento: empleadoSeleccionado.tipo_documento,
                        documento: empleadoSeleccionado.documento,
                        correo: empleadoSeleccionado.correo,
                        area: empleadoSeleccionado.area,
                        estado: empleadoSeleccionado.estado
                    }
                )

                const newEmpleados = [
                    ...empleados,
                    response.data
                ]

                setEmpleados(newEmpleados)
                setFilteredEmpleados(
                    filtrarEmpleados(newEmpleados, filter)
                )

                setModalEmpleado(false)

                Swal.fire({
                    icon: 'success',
                    title: 'Empleado creado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                })
            }

        } catch (err) {

            console.error('Error al guardar empleado:', err)

            setError('Error al guardar el empleado')

            Swal.fire({
                icon: 'error',
                title: 'Hubo un error',
                text: err.response?.data?.error ||
                    'No se pudo guardar el empleado.'
            })
        }
    }

    // ======================================================
    // FUNCIÓN PARA FILTRAR
    // ======================================================
    const filtrarEmpleados = (lista, texto) => {

        const valor = texto.toLowerCase()

        return lista.filter(empleado =>
            (empleado.nombre || '').toLowerCase().includes(valor) ||
            (empleado.documento || '').toLowerCase().includes(valor) ||
            (empleado.correo || '').toLowerCase().includes(valor) ||
            (empleado.area || '').toLowerCase().includes(valor) ||
            (empleado.estado || '').toLowerCase().includes(valor) ||
            (empleado.tipo_documento || '').toLowerCase().includes(valor)
        )
    }

    // ======================================================
    // ELIMINAR EMPLEADO
    // ======================================================
    const eliminarEmpleado = async (empleado) => {

        const resultado = await Swal.fire({
            icon: 'warning',
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar definitivamente al empleado ${empleado.nombre}?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33'
        })

        if (!resultado.isConfirmed) {
            return
        }

        try {

            await axios.delete(
                API_ROUTES.ELIMINAR_EMPLEADO(
                    empleado.id_empleado
                )
            )

            const updateEmpleados = empleados.filter(
                e => e.id_empleado !== empleado.id_empleado
            )

            setEmpleados(updateEmpleados)
            setFilteredEmpleados(
                filtrarEmpleados(updateEmpleados, filter)
            )

            Swal.fire({
                icon: 'success',
                title: 'Empleado eliminado',
                text: 'El empleado fue eliminado correctamente.',
                showConfirmButton: false,
                timer: 1500
            })

        } catch (err) {

            console.error('Error al eliminar empleado:', err)

            const mensaje =
                err.response?.data?.error ||
                'No se pudo eliminar el empleado.'

            Swal.fire({
                icon: 'warning',
                title: 'No se puede eliminar',
                text: mensaje,
                confirmButtonText: 'Aceptar'
            })
        }
    }

    // ======================================================
    // CAMBIAR ESTADO
    // ======================================================
    const cambiarEstado = async (empleado) => {

        const estaActivo = empleado.estado === 'activo'
        const nuevoEstado = estaActivo ? 'inactivo' : 'activo'

        const resultado = await Swal.fire({
            title: estaActivo
                ? '¿Inactivar empleado?'
                : '¿Reactivar empleado?',

            text: estaActivo
                ? `${empleado.nombre} no podrá recibir nuevos préstamos mientras esté inactivo.`
                : `${empleado.nombre} volverá a estar disponible para nuevos préstamos.`,

            icon: 'warning',

            showCancelButton: true,

            confirmButtonText: estaActivo
                ? 'Sí, inactivar'
                : 'Sí, reactivar',

            cancelButtonText: 'Cancelar',

            confirmButtonColor: estaActivo
                ? '#f0ad4e'
                : '#198754'
        })

        if (!resultado.isConfirmed) {
            return
        }

        try {

            const response = await axios.put(
                API_ROUTES.ACTUALIZAR_EMPLEADO(
                    empleado.id_empleado
                ),
                {
                    estado: nuevoEstado
                }
            )

            const updateEmpleados = empleados.map(e =>
                e.id_empleado === empleado.id_empleado
                    ? {
                        ...e,
                        ...response.data,
                        estado: nuevoEstado
                    }
                    : e
            )

            setEmpleados(updateEmpleados)
            setFilteredEmpleados(
                filtrarEmpleados(updateEmpleados, filter)
            )

            Swal.fire(
                estaActivo
                    ? 'Empleado inactivado'
                    : 'Empleado reactivado',

                estaActivo
                    ? 'El empleado ya no aparecerá como destino para nuevos préstamos.'
                    : 'El empleado vuelve a estar disponible para nuevos préstamos.',

                'success'
            )

        } catch (error) {

            console.error('Error al cambiar estado:', error)

            const mensaje =
                error.response?.data?.error ||
                'No se pudo cambiar el estado del empleado.'

            Swal.fire(
                'Error',
                mensaje,
                'error'
            )
        }
    }

    // ======================================================
    // CLASE SEGÚN ESTADO
    // ======================================================
    const getEstadoClass = (estado) => {

        switch ((estado || '').toLowerCase()) {

            case 'inactivo':
                return 'text-bg-danger'

            case 'activo':
                return 'text-bg-success'

            default:
                return 'text-bg-light'
        }
    }

    // ======================================================
    // LOADING
    // ======================================================
    if (loading) {

        return (
            <div className="text-center py-5 text-secondary">

                <div
                    className="spinner-border text-primary mb-2"
                    role="status"
                ></div>

                <div>
                    Cargando empleados...
                </div>

            </div>
        )
    }

    // ======================================================
    // ERROR
    // ======================================================
    if (error) {

        return (
            <div className="alert alert-danger text-center">
                {error}
            </div>
        )
    }

    // ======================================================
    // VISTA
    // ======================================================
    return (

        <div className="card">

            <div className="card-body">

                {/* ENCABEZADO */}
                <div className="module-header">

                    <h4 className="module-title mb-0">
                        Gestión de Empleados
                    </h4>

                    <span className="badge text-bg-primary">
                        {filteredEmpleados.length} empleados
                    </span>

                </div>

                {/* FILTRO Y BOTÓN */}
                <div className="d-flex justify-content-between align-items-center mb-3">

                    <div
                        className="input-group"
                        style={{ maxWidth: '400px' }}
                    >

                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por nombre, documento o área..."
                            value={filter}
                            onChange={handleFilterChange}
                        />

                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={nuevoEmpleado}
                    >
                        + Nuevo Empleado
                    </button>

                </div>

                {/* TABLA */}
                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle">

                        <thead className="table-header">

                            <tr>

                                <th>Nombre</th>

                                <th>Documento</th>

                                <th>Área</th>

                                <th>Correo</th>

                                <th>Estado</th>

                                <th className="text-center">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredEmpleados.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-4 text-secondary"
                                    >
                                        No se encontraron empleados
                                    </td>

                                </tr>

                            ) : (

                                filteredEmpleados.map((empleado) => (

                                    <tr key={empleado.id_empleado}>

                                        <td>
                                            {empleado.nombre}
                                        </td>

                                        <td>
                                            {empleado.tipo_documento}{' '}
                                            {empleado.documento}
                                        </td>

                                        <td>
                                            {empleado.area}
                                        </td>

                                        <td>
                                            {empleado.correo || (
                                                <span className="text-secondary">
                                                    Sin correo
                                                </span>
                                            )}
                                        </td>

                                        <td>

                                            <span
                                                className={`badge ${getEstadoClass(empleado.estado)}`}
                                            >
                                                {empleado.estado === 'activo'
                                                    ? 'Activo'
                                                    : 'Inactivo'
                                                }
                                            </span>

                                        </td>

                                        <td className="text-center">

                                            <button
                                                className="btn btn-primary btn-sm me-1"
                                                onClick={() =>
                                                    editarEmpleado(empleado)
                                                }
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil me-1"></i>
                                                Editar
                                            </button>

                                            <button
                                                className="btn btn-warning btn-sm me-1"
                                                onClick={() =>
                                                    cambiarEstado(empleado)
                                                }
                                                title={
                                                    empleado.estado === 'activo'
                                                        ? 'Inactivar'
                                                        : 'Reactivar'
                                                }
                                            >
                                                <i
                                                    className={
                                                        empleado.estado === 'activo'
                                                            ? 'bi bi-person-x me-1'
                                                            : 'bi bi-person-check me-1'
                                                    }
                                                ></i>

                                                {empleado.estado === 'activo'
                                                    ? 'Inactivar'
                                                    : 'Reactivar'
                                                }
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() =>
                                                    eliminarEmpleado(empleado)
                                                }
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash me-1"></i>
                                                Eliminar
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* MODAL EMPLEADO */}
                {modalEmpleado && (

                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{
                            display: 'block',
                            zIndex: '1050'
                        }}
                        onClick={() => setModalEmpleado(false)}
                    >

                        <div
                            className="modal-dialog modal-dialog-centered"
                            onClick={(e) => e.stopPropagation()}
                        >

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5 className="modal-title">

                                        {empleadoSeleccionado.isEditing
                                            ? 'Editar Empleado'
                                            : 'Nuevo Empleado'
                                        }

                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() =>
                                            setModalEmpleado(false)
                                        }
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <form>

                                        {/* NOMBRE */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Nombre completo
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={
                                                    empleadoSeleccionado.nombre
                                                }
                                                onChange={handleChange}
                                                maxLength="200"
                                            />

                                        </div>

                                        {/* TIPO DOCUMENTO */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Tipo de documento
                                            </label>

                                            <select
                                                className="form-control"
                                                name="tipo_documento"
                                                value={
                                                    empleadoSeleccionado.tipo_documento
                                                }
                                                onChange={handleChange}
                                            >

                                                <option value="CC">
                                                    CC
                                                </option>

                                                <option value="CE">
                                                    CE
                                                </option>

                                                <option value="TI">
                                                    TI
                                                </option>

                                                <option value="PAS">
                                                    PAS
                                                </option>

                                            </select>

                                        </div>

                                        {/* DOCUMENTO */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Documento
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="documento"
                                                value={
                                                    empleadoSeleccionado.documento
                                                }
                                                onChange={handleChange}
                                                maxLength="30"
                                            />

                                        </div>

                                        {/* ÁREA */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Área
                                            </label>

                                            <select
                                                className="form-control"
                                                name="area"
                                                value={
                                                    empleadoSeleccionado.area
                                                }
                                                onChange={handleChange}
                                            >

                                                <option value="">
                                                    Seleccionar área
                                                </option>

                                                {areas.map((area, index) => {

                                                    const nombreArea =
                                                        typeof area === 'string'
                                                            ? area
                                                            : area.area

                                                    return (
                                                        <option
                                                            key={index}
                                                            value={nombreArea}
                                                        >
                                                            {nombreArea}
                                                        </option>
                                                    )
                                                })}

                                            </select>

                                        </div>

                                        {/* CORREO */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Correo
                                            </label>

                                            <input
                                                type="email"
                                                className="form-control"
                                                name="correo"
                                                value={
                                                    empleadoSeleccionado.correo || ''
                                                }
                                                onChange={handleChange}
                                                maxLength="100"
                                            />

                                        </div>

                                        {/* ESTADO */}
                                        <div className="form-group mb-3">

                                            <label>
                                                Estado
                                            </label>

                                            <select
                                                className="form-control"
                                                name="estado"
                                                value={
                                                    empleadoSeleccionado.estado
                                                }
                                                onChange={handleChange}
                                            >

                                                <option value="activo">
                                                    activo
                                                </option>

                                                <option value="inactivo">
                                                    inactivo
                                                </option>

                                            </select>

                                        </div>

                                    </form>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalEmpleado(false)
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={guardarEmpleado}
                                    >

                                        {empleadoSeleccionado.isEditing
                                            ? 'Guardar cambios'
                                            : 'Guardar empleado'
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>
    )
}

export default Empleados