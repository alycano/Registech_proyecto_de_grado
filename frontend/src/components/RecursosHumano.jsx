import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const RecursosHumanos = () => {

    const [usuarios, setUsuarios] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalUsuario, setModalUsuario] = useState(false)
    const [filteredUsuarios, setFilteredUsuarios] = useState([])
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        area: '',
        correo: '',
        estado: '',
        isEditing: false
    })

    const [filter, setFilter] = useState('')

    // ======================================================
    // OBTENER USUARIOS
    // ======================================================
    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_USUARIOS)
            .then(response => {
                setUsuarios(response.data)
                setFilteredUsuarios(response.data)
                setLoading(false)
            })
            .catch(err => {
                setError('Hubo un error al obtener los usuarios')
                setLoading(false)
            })
    }, [])

    // ======================================================
    // OBTENER ÁREAS
    // ======================================================
    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_AREAS)
            .then(response => {
                setAreas(response.data)
            })
            .catch(err => {
                setError('Hubo un error al obtener las áreas')
            })
    }, [])

    // ======================================================
    // FILTRAR USUARIOS
    // ======================================================
    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilter(value)

        const filtered = usuarios.filter(usuario =>
            usuario.nombre.toLowerCase().includes(value.toLowerCase()) ||
            usuario.usuario.toLowerCase().includes(value.toLowerCase()) ||
            usuario.area.toLowerCase().includes(value.toLowerCase()) ||
            usuario.estado.toLowerCase().includes(value.toLowerCase())
        )

        setFilteredUsuarios(filtered)
    }

    // ======================================================
    // NUEVO USUARIO
    // ======================================================
    const nuevoUsuario = () => {
        setUsuarioSeleccionado({
            nombre: '',
            usuario: '',
            contrasena: '',
            area: '',
            correo: '',
            estado: 'activo',
            isEditing: false
        })

        setModalUsuario(true)
    }

    // ======================================================
    // EDITAR USUARIO
    // ======================================================
    const editarUsuario = (usuario) => {
        setUsuarioSeleccionado({
            ...usuario,
            isEditing: true
        })

        setModalUsuario(true)
    }

    // ======================================================
    // CAMBIOS EN FORMULARIO
    // ======================================================
    const handleChange = (e) => {
        const { name, value } = e.target

        setUsuarioSeleccionado({
            ...usuarioSeleccionado,
            [name]: value
        })
    }

    // ======================================================
    // GUARDAR USUARIO
    // ======================================================
    const guardarUsuario = () => {

        if (usuarioSeleccionado.isEditing) {

            axios.put(
                API_ROUTES.ACTUALIZAR_USUARIO(usuarioSeleccionado.usuario),
                {
                    nombre: usuarioSeleccionado.nombre,
                    contrasena: usuarioSeleccionado.contrasena,
                    area: usuarioSeleccionado.area,
                    correo: usuarioSeleccionado.correo,
                    estado: usuarioSeleccionado.estado
                }
            )
                .then(response => {

                    const updateUsuarios = usuarios.map(usuario =>
                        usuario.usuario === usuarioSeleccionado.usuario
                            ? { ...usuarioSeleccionado, ...response.data }
                            : usuario
                    )

                    setUsuarios(updateUsuarios)
                    setFilteredUsuarios(updateUsuarios)
                    setModalUsuario(false)

                    Swal.fire({
                        icon: 'success',
                        title: 'Usuario actualizado correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    })
                })
                .catch(err => {

                    setError('Error al actualizar el usuario')

                    Swal.fire({
                        icon: 'error',
                        title: 'Hubo un error al actualizar el usuario',
                        showConfirmButton: false,
                        timer: 1500
                    })
                })

        } else {

            axios.post(
                API_ROUTES.CREAR_USUARIO,
                usuarioSeleccionado
            )
                .then(response => {

                    const newUsuarios = [
                        ...usuarios,
                        response.data
                    ]

                    setUsuarios(newUsuarios)
                    setFilteredUsuarios(newUsuarios)
                    setModalUsuario(false)

                    Swal.fire({
                        icon: 'success',
                        title: 'Usuario creado correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    })
                })
                .catch(err => {

                    setError('Error al crear el usuario')

                    Swal.fire({
                        icon: 'error',
                        title: 'Error al crear el usuario',
                        text: err.response?.data?.error ||
                            'Hubo un problema al crear el usuario'
                    })
                })
        }
    }

    // ======================================================
    // ELIMINAR / DESACTIVAR USUARIO
    // ======================================================
   const borrarUsuario = async (usuario) => {
    try {

        // ======================================================
        // PRIMERO VERIFICAMOS QUÉ DEBE HACER EL SISTEMA
        // ======================================================
        const response = await axios.get(
            API_ROUTES.VERIFICAR_ELIMINACION(usuario.usuario)
        )

        // ======================================================
        // TIENE PRÉSTAMO ACTIVO O PARCIAL
        // ======================================================
        if (response.data.tienePrestamoActivo) {

            Swal.fire({
                icon: 'error',
                title: 'No se puede eliminar',
                text: 'Este usuario tiene un préstamo activo y no puede ser eliminado.',
                confirmButtonText: 'Aceptar'
            })

            return
        }

        // ======================================================
        // TIENE HISTORIAL PERO NO TIENE PRÉSTAMO ACTIVO
        // ======================================================
        if (response.data.tieneHistorial) {

            const result = await Swal.fire({
                icon: 'warning',
                title: 'Usuario con historial',
                text: `El usuario ${usuario.nombre} tiene historial de préstamos. No se puede eliminar y será desactivado.`,
                showCancelButton: true,
                confirmButtonText: 'Sí, desactivar',
                cancelButtonText: 'Cancelar'
            })

            if (!result.isConfirmed) {
                return
            }

        } else {

            // ==================================================
            // NUNCA HA TENIDO PRÉSTAMOS → SE PUEDE ELIMINAR
            // ==================================================
            const result = await Swal.fire({
                icon: 'warning',
                title: '¿Estás seguro?',
                text: `¿Deseas eliminar definitivamente al usuario ${usuario.nombre}?`,
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            })

            if (!result.isConfirmed) {
                return
            }
        }

        // ======================================================
        // EJECUTAR ELIMINACIÓN O DESACTIVACIÓN
        // ======================================================
        const resultado = await axios.delete(
            API_ROUTES.ELIMINAR_USUARIO(usuario.usuario)
        )

        // ======================================================
        // FUE DESACTIVADO
        // ======================================================
        if (resultado.data?.desactivado) {

            const updateUsuarios = usuarios.map(u =>
                u.usuario === usuario.usuario
                    ? {
                        ...u,
                        estado: 'inactivo'
                    }
                    : u
            )

            setUsuarios(updateUsuarios)
            setFilteredUsuarios(updateUsuarios)

            Swal.fire({
                icon: 'warning',
                title: 'Usuario desactivado',
                text: 'El usuario tiene historial de préstamos y ha sido desactivado correctamente.',
                confirmButtonText: 'Aceptar'
            })

            return
        }

        // ======================================================
        // FUE ELIMINADO
        // ======================================================
        const updateUsuarios = usuarios.filter(
            u => u.usuario !== usuario.usuario
        )

        setUsuarios(updateUsuarios)
        setFilteredUsuarios(updateUsuarios)

        Swal.fire({
            icon: 'success',
            title: 'Usuario eliminado',
            text: 'El usuario fue eliminado correctamente.',
            showConfirmButton: false,
            timer: 1500
        })

    } catch (err) {

        // ======================================================
        // ERROR DE PRÉSTAMO ACTIVO
        // ======================================================
        if (err.response?.status === 409) {

            Swal.fire({
                icon: 'error',
                title: 'No se puede eliminar',
                text: err.response?.data?.error ||
                    'Este usuario tiene un préstamo activo y no puede ser eliminado.',
                confirmButtonText: 'Aceptar'
            })

            return
        }

        // ======================================================
        // OTRO ERROR
        // ======================================================
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.error ||
                'Hubo un problema al procesar la solicitud.'
        })
    }
}

    // ======================================================
    // CLASE SEGÚN ESTADO
    // ======================================================
    const getEstadoClass = (estado) => {

        switch (estado.toLowerCase()) {

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

                <div>Cargando usuarios...</div>
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

                <div className="module-header">

                    <h4 className="module-title mb-0">
                        Gestión de Usuarios
                    </h4>

                    <span className="badge text-bg-primary">
                        {filteredUsuarios.length} usuarios
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
                            placeholder="Filtrar por nombre, usuario o área..."
                            value={filter}
                            onChange={handleFilterChange}
                        />

                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={nuevoUsuario}
                    >
                        + Nuevo Usuario
                    </button>

                </div>

                {/* TABLA */}
                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle">

                        <thead className="table-header">

                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Área</th>
                                <th>Correo</th>
                                <th>Estado</th>
                                <th className="text-center">
                                    Acciones
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredUsuarios.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-4 text-secondary"
                                    >
                                        No se encontraron usuarios
                                    </td>

                                </tr>

                            ) : (

                                filteredUsuarios.map((usuario) => (

                                    <tr key={usuario.usuario}>

                                        <td>
                                            {usuario.nombre}
                                        </td>

                                        <td>
                                            {usuario.usuario}
                                        </td>

                                        <td>
                                            {usuario.area}
                                        </td>

                                        <td>
                                            {usuario.correo}
                                        </td>

                                        <td>

                                            <span
                                                className={`badge ${getEstadoClass(usuario.estado)}`}
                                            >
                                                {usuario.estado === 'activo'
                                                    ? 'Activo'
                                                    : 'Inactivo'
                                                }
                                            </span>

                                        </td>

                                        <td className="text-center">

                                            <button
                                                className="btn btn-primary btn-sm me-1"
                                                onClick={() => editarUsuario(usuario)}
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil me-1"></i>
                                                Editar
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => borrarUsuario(usuario)}
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

                {/* MODAL USUARIO */}
                {modalUsuario && (

                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{
                            display: 'block',
                            zIndex: '1050'
                        }}
                        onClick={() => setModalUsuario(false)}
                    >

                        <div
                            className="modal-dialog modal-dialog-centered"
                            onClick={(e) => e.stopPropagation()}
                        >

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5 className="modal-title">
                                        {usuarioSeleccionado.isEditing
                                            ? "Editar Usuario"
                                            : "Nuevo Usuario"
                                        }
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setModalUsuario(false)}
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <form>

                                        <div className="form-group mb-3">

                                            <label>Nombre</label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={usuarioSeleccionado.nombre}
                                                onChange={handleChange}
                                            />

                                        </div>

                                        <div className="form-group mb-3">

                                            <label>Usuario</label>

                                            <input
                                                type="text"
                                                autoComplete="username"
                                                className="form-control"
                                                name="usuario"
                                                value={usuarioSeleccionado.usuario || ''}
                                                onChange={handleChange}
                                            />

                                        </div>

                                        <div className="form-group mb-3">

                                            <label>Contraseña</label>

                                            <input
                                                type="password"
                                                autoComplete={
                                                    usuarioSeleccionado.isEditing
                                                        ? "current-password"
                                                        : "new-password"
                                                }
                                                className="form-control"
                                                name="contrasena"
                                                value={usuarioSeleccionado.contrasena || ""}
                                                onChange={handleChange}
                                            />

                                        </div>

                                        <div className="form-group mb-3">

                                            <label>Área</label>

                                            <select
                                                className="form-control"
                                                name="area"
                                                value={usuarioSeleccionado.area}
                                                onChange={handleChange}
                                            >

                                                <option value="">
                                                    Seleccionar área
                                                </option>

                                                {areas.map((area, index) => (

                                                    <option
                                                        key={index}
                                                        value={area.area}
                                                    >
                                                        {area.area}
                                                    </option>

                                                ))}

                                            </select>

                                        </div>

                                        <div className="form-group mb-3">

                                            <label>Correo</label>

                                            <input
                                                type="email"
                                                className="form-control"
                                                name="correo"
                                                value={usuarioSeleccionado.correo}
                                                onChange={handleChange}
                                            />

                                        </div>

                                        <div className="form-group mb-3">

                                            <label>Estado</label>

                                            <select
                                                className="form-control"
                                                name="estado"
                                                value={usuarioSeleccionado.estado}
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
                                        onClick={() => setModalUsuario(false)}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={guardarUsuario}
                                    >
                                        {usuarioSeleccionado.isEditing
                                            ? "Guardar cambios"
                                            : "Guardar usuario"
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

export default RecursosHumanos