import React, { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const RecursosHumanos = () => {

    const [ usuarios, setUsuarios ] = useState([])
    const [ areas, setAreas ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)

    const [ modalUsuario, setModalUsuario ] = useState(false)
    const [ filteredUsuarios, setFilteredUsuarios ] = useState([])
    const [ usuarioSeleccionado, setUsuarioSeleccionado ] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        area: '',
        correo: '',
        estado: '',
        isEditing: false
    })

    const [ filter, setFilter ] = useState('')

    // USEEFFECT PARA OBTENER LOS USUARIOS DEL BACKEND
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

    // USEEFFECT PARA OBTENER LAS AREAS DEL BACKEND
    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_AREAS)
        .then(response => {
            setAreas(response.data)
        })
        .catch(err => {
            setError('Hubo un error al obtener las áreas')
        })
    }, [])

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO DE FILTRO
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

    // FUNCION PARA ABRIR EL MODAL DEL NUEVO USUARIO
    const nuevoUsuario = () => {
        setUsuarioSeleccionado({
            nombre: '',
            usuario: '',
            contrasena: '',
            area: '',
            correo: '',
            estado: '',
            isEditing: false
        })

        setModalUsuario(true)
    }

    // FUNCION PARA ABRIR EL MODAL CON LOS DATOS DEL USUARIO A EDITAR
    const editarUsuario = (usuario) => {
        setUsuarioSeleccionado({
            ...usuario,
            isEditing: true
        })

        setModalUsuario(true)
    }

    // FUNCION PARA MANEJAR CAMBIOS EN EL FORMULARIO
    const handleChange = (e) => {
        const { name, value } = e.target
        setUsuarioSeleccionado({
            ...usuarioSeleccionado,
            [name]: value
        })
    }

    // FUNCION PARA GUARDAR UN NUEVO USUARIO O EDITAR UNO EXISTENTE
    const guardarUsuario = () => {
        if (usuarioSeleccionado.isEditing) {
            axios.put(API_ROUTES.ACTUALIZAR_USUARIO(usuarioSeleccionado.usuario), {
                nombre: usuarioSeleccionado.nombre,
                contrasena: usuarioSeleccionado.contrasena,
                area: usuarioSeleccionado.area,
                correo: usuarioSeleccionado.correo,
                estado: usuarioSeleccionado.estado
            })
            .then(response => {
                const updateUsuarios = usuarios.map(usuario =>
                    usuario.usuario === usuarioSeleccionado.usuario ? { ...usuarioSeleccionado, ...response.data } : usuario
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
                    title: 'Hubo un error al actualizar los usuarios',
                    showConfirmButton: false,
                    timer: 1500
                })
            })
        } else {
            axios.post(API_ROUTES.CREAR_USUARIO, usuarioSeleccionado)
            .then(response => {
                const newUsuarios = [...usuarios, response.data]
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
                    text: 'Hubo un problema al crear el usuario',
                    timer: 1500
                })
            })
        }
    }

    // FUNCION PARA BORRAR UN USUARIO
    const borrarUsuario = (usuario) => {
        Swal.fire({
            icon: 'warning',
            title: '¿Estas seguro?',
            text: `No podras revertir la eliminacion del ${usuario.nombre}`,
            showCancelButton: true,
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar'
        })
        .then((result) => {
            if (result.isConfirmed) {
                axios.delete(API_ROUTES.ELIMINAR_USUARIO(usuario.usuario))
                .then(() => {
                    const updateUsuarios = usuarios.filter(u => u.usuario !== usuario.usuario)
                    setUsuarios(updateUsuarios)
                    setFilteredUsuarios(updateUsuarios)

                    Swal.fire({
                        icon: 'success',
                        title: 'Usuario eliminado',
                        showConfirmButton: false,
                        timer: 1500
                    })
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar el usuario',
                        text: 'Hubo un problema al eliminar el usuario'
                    })
                })
            }
        })
    }

    // FUNCION PARA ASIGNAR CLASES DE COLOR SEGUN EL ESTADO
    const getEstadoClass = (estado) => {
        switch(estado.toLowerCase()) {
            case 'inactivo': return 'text-bg-danger'
            case 'activo': return 'text-bg-success'
            default: return 'text-bg-light'
        }
    }

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div>Cargando usuarios...</div>
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
                        <i className="bi bi-people-fill"></i>
                        Listado de asociados
                    </h4>
                    <span className="badge text-bg-primary">{filteredUsuarios.length} usuarios</span>
                </div>

                {/* INPUT PARA FILTRAR USUARIOS */}
                <div className="d-flex justify-content-start mb-3">
                    <div className="input-group" style={{ maxWidth: '400px' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por nombre, usuario, area o estado"
                            value={filter}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                {/* BOTON PARA AGREGAR UN NUEVO USUARIO */}
                <div className="d-flex justify-content-end mb-3">
                    <button
                        className="btn btn-primary"
                        onClick={nuevoUsuario}
                    >
                        <i className="bi bi-person-plus"></i> Nuevo Usuario
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-header">
                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Area</th>
                                <th>Correo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsuarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-secondary">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                            filteredUsuarios.map((usuario, index) => (
                                <tr key={index}>
                                    <td>{usuario.nombre}</td>
                                    <td>{usuario.usuario}</td>
                                    <td>{usuario.area}</td>
                                    <td>{usuario.correo}</td>
                                    <td>
                                        <span className={`badge ${getEstadoClass(usuario.estado)}`}>
                                            {usuario.estado}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button
                                            className="btn btn-warning btn-sm me-1"
                                            onClick={() => editarUsuario(usuario)}
                                            title="Editar"
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                        </button>

                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => borrarUsuario(usuario)}
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

            {/* MODAL DE USUARIO */}
            {modalUsuario && (
                <div className="modal show" style={{display: 'block'}} onClick={() => setModalUsuario(false)}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {usuarioSeleccionado.isEditing ? "Editar Usuario" : "Nuevo Usuario"}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalUsuario(false)}
                                >
                                </button>
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
                                            autoComplete={usuarioSeleccionado.isEditing ? "current-password" : "new-password"}
                                            className="form-control"
                                            name="contrasena"
                                            value={usuarioSeleccionado.contrasena || ""}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Area</label>
                                        <select
                                            className="form-control"
                                            name="area"
                                            value={usuarioSeleccionado.area}
                                            onChange={handleChange}
                                        >
                                            <option value="">Seleccionar area</option>
                                            {areas.map((area, index) => (
                                                <option key={index} value={area.area}>
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
                                            <option value="activo">activo</option>
                                            <option value="inactivo">inactivo</option>
                                        </select>
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalUsuario(false)}>
                                    Cancelar
                                </button>

                                <button type="button" className="btn btn-primary" onClick={guardarUsuario}>
                                    {usuarioSeleccionado.isEditing ? "Guardar cambios" : "Guardar usuario"}
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

