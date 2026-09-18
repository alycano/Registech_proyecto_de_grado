import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
    getEstadoClass,
    getEstadoLabel,
    getEspecificaciones
} from '../../utils/equipoUtils'
import { API_ROUTES } from '../../api/apiRoutes'
import { useAuth } from '../../context/AuthContext'

export default function EquipoCard({
    equipo,
    unidades = [],
    onPrestamo,
    onDevolver,
    vencimiento,
    onEquipoActualizado
}) {
    const { usuario } = useAuth()

    const unidadesEquipo =
        unidades.length > 0
            ? unidades
            : [equipo]

    const esGrupo =
        unidadesEquipo.length > 1

    const [verDetalle, setVerDetalle] = useState(false)
    const [historial, setHistorial] = useState([])
    const [mantenimientos, setMantenimientos] = useState([])
    const [historialSeleccionado, setHistorialSeleccionado] = useState(null)
    const [cargandoHistorial, setCargandoHistorial] = useState(false)
    const [errorHistorial, setErrorHistorial] = useState('')

    const [unidadDetalle, setUnidadDetalle] = useState(equipo)

    const [currentImagen, setCurrentImagen] = useState(equipo.imagen)
    const [subiendoFoto, setSubiendoFoto] = useState(false)
    const fileInputRef = useRef(null)

    const textoAlerta = vencimiento?.tipo === 'vencido'
        ? `VENCIDO (${vencimiento.dias}d)`
        : vencimiento?.dias === 0
            ? 'Vence HOY'
            : `Vence en ${vencimiento?.dias}d`

    const imagen = currentImagen
        ? (
            currentImagen.startsWith('http')
                ? currentImagen
                : API_ROUTES.ARCHIVO_EVIDENCIA(currentImagen)
        )
        : null

    const especificaciones =
        getEspecificaciones(unidadDetalle)

    const puedeGestionar =
        usuario &&
        usuario.rol === 'admin'

    const puedeReportarDano =
        usuario &&
        (
            usuario.rol === 'admin' ||
            usuario.rol === 'soporte'
        )

    // ======================================================
    // PRÉSTAMO
    // ======================================================

    const handlePrestamo = async () => {

        const disponibles =
            unidadesEquipo.filter(
                unidad =>
                    unidad.estado === 'Disponible'
            )

        if (disponibles.length === 0) {

            Swal.fire({
                icon: 'warning',
                title: 'No hay unidades disponibles',
                text:
                    'Todas las unidades de este modelo están asignadas o no disponibles.'
            })

            return
        }

        if (disponibles.length === 1) {

            onPrestamo(disponibles[0])

            return
        }

        const opciones = disponibles
            .map(
                unidad => `
                    <option value="${unidad.num_serie}">
                        ${unidad.num_serie}
                    </option>
                `
            )
            .join('')

        const { value: numSerie } =
            await Swal.fire({

                title: 'Seleccionar unidad',

                html: `
                    <div class="text-start">

                        <label class="form-label">
                            Selecciona el número de serie
                            que deseas prestar:
                        </label>

                        <select
                            id="unidad-prestamo"
                            class="form-select"
                        >
                            ${opciones}
                        </select>

                    </div>
                `,

                showCancelButton: true,

                confirmButtonText:
                    'Continuar',

                cancelButtonText:
                    'Cancelar',

                confirmButtonColor:
                    '#16a34a',

                preConfirm: () => {

                    const select =
                        document.getElementById(
                            'unidad-prestamo'
                        )

                    return select?.value
                }
            })

        if (!numSerie) {
            return
        }

        const unidadSeleccionada =
            disponibles.find(
                unidad =>
                    unidad.num_serie === numSerie
            )

        if (unidadSeleccionada) {
            onPrestamo(unidadSeleccionada)
        }
    }

    // ======================================================
    // REINTEGRAR EQUIPO
    // ======================================================

    const handleReintegrar = async () => {

        const { isConfirmed } =
            await Swal.fire({

                title:
                    '¿Reintegrar equipo?',

                html: `
                    El equipo
                    <strong>
                        ${unidadDetalle.equipo}
                    </strong>
                    (${unidadDetalle.num_serie})
                    volverá a estar
                    <span class="text-success fw-bold">
                        Disponible
                    </span>.
                `,

                icon: 'question',

                showCancelButton: true,

                confirmButtonColor:
                    '#16a34a',

                confirmButtonText:
                    '<i class="bi bi-arrow-counterclockwise me-1"></i>Sí, reintegrar',

                cancelButtonText:
                    'Cancelar'
            })

        if (!isConfirmed) {
            return
        }

        try {

            const res = await axios.post(
                API_ROUTES.REINTEGRAR_EQUIPO(
                    unidadDetalle.num_serie
                )
            )

            Swal.fire({
                icon: 'success',
                title: 'Equipo reintegrado',
                text:
                    'El equipo ahora se encuentra disponible.',
                timer: 2500,
                showConfirmButton: false
            })

            if (onEquipoActualizado) {

                onEquipoActualizado(
                    res.data.equipo
                )
            }

        } catch (error) {

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.error ||
                    'No se pudo reintegrar el equipo'
            })
        }
    }

    // ======================================================
    // CARGAR HISTORIAL
    // ======================================================

    useEffect(() => {

        if (!verDetalle) {
            return
        }

        const cargarHistorial = async () => {

            try {

                setCargandoHistorial(true)
                setErrorHistorial('')

                const [
                    responseUso,
                    responseMantenimientos
                ] = await Promise.all([

                    axios.get(
                        API_ROUTES.HISTORIAL_EQUIPO(
                            unidadDetalle.num_serie
                        )
                    ),

                    axios.get(
                        API_ROUTES.HISTORIAL_MANTENIMIENTOS
                    )
                ])

                setHistorial(
                    Array.isArray(
                        responseUso.data
                    )
                        ? responseUso.data
                        : []
                )

                const todosLosMantenimientos =
                    Array.isArray(
                        responseMantenimientos.data
                    )
                        ? responseMantenimientos.data
                        : []

                const mantenimientosEquipo =
                    todosLosMantenimientos.filter(
                        mantenimiento =>
                            String(
                                mantenimiento.num_serie
                            ) ===
                            String(
                                unidadDetalle.num_serie
                            )
                    )

                setMantenimientos(
                    mantenimientosEquipo
                )

            } catch (error) {

                console.error(
                    'Error al cargar historial del equipo:',
                    error
                )

                setErrorHistorial(
                    'No se pudo cargar el historial del equipo.'
                )

            } finally {

                setCargandoHistorial(false)
            }
        }

        cargarHistorial()

    }, [
        verDetalle,
        unidadDetalle.num_serie
    ])

    // ======================================================
    // MANEJO DE FOTOS
    // ======================================================

    const puedeEditarFoto =
        usuario &&
        (
            usuario.rol === 'admin' ||
            usuario.rol === 'inventario'
        )

    const handleFileChange = async (e) => {

        const file =
            e.target.files[0]

        if (!file) {
            return
        }

        setSubiendoFoto(true)

        const formData =
            new FormData()

        formData.append(
            'foto',
            file
        )

        try {

            const res =
                await axios.patch(
                    API_ROUTES.ACTUALIZAR_FOTO(
                        unidadDetalle.num_serie
                    ),
                    formData,
                    {
                        headers: {
                            'Content-Type':
                                'multipart/form-data'
                        }
                    }
                )

            setCurrentImagen(
                res.data.imagen
            )

        } catch (error) {

            console.error(
                'Error al actualizar foto:',
                error
            )

            alert(
                'Error al actualizar la foto'
            )

        } finally {

            setSubiendoFoto(false)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleEliminarFoto = async () => {

        if (
            !confirm(
                '¿Seguro que deseas eliminar la foto actual?'
            )
        ) {
            return
        }

        setSubiendoFoto(true)

        try {

            await axios.patch(
                API_ROUTES.ACTUALIZAR_FOTO(
                    unidadDetalle.num_serie
                ),
                {
                    eliminar: 'true'
                }
            )

            setCurrentImagen(null)

        } catch (error) {

            console.error(
                'Error al eliminar foto:',
                error
            )

            alert(
                'Error al eliminar la foto'
            )

        } finally {

            setSubiendoFoto(false)
        }
    }

    // ======================================================
    // REGISTRAR DAÑO
    // ======================================================

    const handleReportarDano = async () => {

        const {
            value: falla,
            isConfirmed
        } = await Swal.fire({

            icon: 'warning',

            title:
                'Registrar daño',

            html: `
                Describe el daño del equipo
                <strong>
                    ${unidadDetalle.equipo}
                </strong>
                (${unidadDetalle.num_serie})
            `,

            input:
                'textarea',

            inputPlaceholder:
                'Ej. Pantalla rota, no enciende, teclado dañado...',

            inputAttributes: {
                maxlength: '500'
            },

            inputValidator:
                (value) =>
                    !value ||
                    !value.trim()
                        ? 'Describe el daño detectado'
                        : null,

            showCancelButton: true,

            confirmButtonText:
                '<i class="bi bi-cone-striped me-1"></i>Registrar daño',

            cancelButtonText:
                'Cancelar',

            confirmButtonColor:
                '#ef4444',

            cancelButtonColor:
                '#64748b'
        })

        if (
            !isConfirmed ||
            !falla ||
            !falla.trim()
        ) {
            return
        }

        const formData =
            new FormData()

        formData.append(
            'num_serie',
            unidadDetalle.num_serie
        )

        formData.append(
            'falla',
            falla.trim()
        )

        try {

            const res =
                await axios.post(
                    API_ROUTES.REPORTE_FALLA,
                    formData
                )

            Swal.fire({
                icon: 'success',
                title: 'Daño registrado',
                text:
                    res.data?.mensaje ||
                    'Se creó la orden de soporte para este equipo.',
                timer: 3000,
                showConfirmButton: false
            })

            setVerDetalle(false)

            if (onEquipoActualizado) {

                onEquipoActualizado({
                    ...unidadDetalle,
                    estado:
                        'En mantenimiento'
                })
            }

        } catch (error) {

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.error ||
                    'No se pudo registrar el daño'
            })
        }
    }

    // ======================================================
    // CANCELAR REPORTE
    // ======================================================

    const handleCancelarReporte = async () => {

        const { isConfirmed } =
            await Swal.fire({

                icon: 'warning',

                title:
                    '¿Cancelar reporte?',

                html: `
                    ¿Estás seguro de que deseas cancelar
                    el reporte de falla del equipo
                    <strong>
                        ${unidadDetalle.equipo}
                    </strong>?

                    El equipo volverá a estar
                    disponible/asignado.
                `,

                showCancelButton: true,

                confirmButtonText:
                    'Sí, cancelar reporte',

                cancelButtonText:
                    'No, mantener',

                confirmButtonColor:
                    '#ef4444',

                cancelButtonColor:
                    '#64748b'
            })

        if (!isConfirmed) {
            return
        }

        try {

            const res =
                await axios.delete(
                    API_ROUTES.CANCELAR_REPORTE(
                        unidadDetalle.num_serie
                    )
                )

            Swal.fire({
                icon: 'success',
                title: 'Reporte cancelado',
                text:
                    res.data?.mensaje ||
                    'El reporte de mantenimiento ha sido cancelado.',
                timer: 3000,
                showConfirmButton: false
            })

            setVerDetalle(false)

            if (onEquipoActualizado) {

                onEquipoActualizado(
                    res.data.equipo || {
                        ...unidadDetalle,
                        estado:
                            res.data.equipo_estado
                    }
                )
            }

        } catch (error) {

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.error ||
                    'No se pudo cancelar el reporte'
            })
        }
    }

    // ======================================================
    // ABRIR DETALLE
    // ======================================================

    const abrirDetalle = () => {

        setUnidadDetalle(
            unidadesEquipo[0]
        )

        setHistorialSeleccionado(null)

        setVerDetalle(true)
    }

    // ======================================================
    // SELECCIONAR UNIDAD
    // ======================================================

    const seleccionarUnidad = (unidad) => {

        setUnidadDetalle(unidad)

        setHistorialSeleccionado(null)
        setHistorial([])
        setMantenimientos([])
        setErrorHistorial('')
        setCurrentImagen(unidad.imagen)
    }

    // ======================================================
    // SELECCIONAR HISTORIAL
    // ======================================================

    const seleccionarHistorial = (tipo) => {

        setHistorialSeleccionado(tipo)
    }

    // ======================================================
    // ACCIONES DEL MODAL
    // ======================================================

    const AccionesDetalle = (
        <>
            {/* Botón de Préstamo si está Disponible */}

            {unidadDetalle.estado === 'Disponible' &&
                usuario?.rol === 'admin' && (

                    <button
                        className="btn btn-sm btn-success"
                        onClick={handlePrestamo}
                    >
                        <i className="bi bi-arrow-return-right me-1"></i>
                        Préstamo
                    </button>

                )}

            {/* Botón de Devolución */}

            {(unidadDetalle.estado === 'Asignado' ||
                unidadDetalle.estado === 'en_prestamo' ||
                unidadDetalle.estado === 'En préstamo') &&
                usuario?.rol === 'admin' && (

                    <button
                        className="btn btn-sm btn-warning text-dark fw-semibold"
                        onClick={() => {
                            setVerDetalle(false)
                            onDevolver &&
                                onDevolver(unidadDetalle)
                        }}
                    >
                        <i className="bi bi-arrow-return-left me-1"></i>
                        Devolver
                    </button>

                )}

            {/* Reintegrar */}

            {(unidadDetalle.estado === 'Baja' ||
                unidadDetalle.estado === 'Extraviado') &&
                puedeGestionar && (

                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setVerDetalle(false)
                            handleReintegrar()
                        }}
                    >
                        <i className="bi bi-arrow-counterclockwise me-1"></i>
                        Reintegrar Equipo
                    </button>

                )}

            {/* Registrar daño */}

            {(unidadDetalle.estado === 'Disponible' ||
                unidadDetalle.estado === 'Asignado') &&
                usuario?.rol === 'soporte' && (

                    <button
                        className="btn btn-outline-danger"
                        onClick={handleReportarDano}
                    >
                        <i className="bi bi-cone-striped me-1"></i>
                        Registrar daño
                    </button>

                )}

            {/* Cancelar reporte */}

            {unidadDetalle.estado === 'En mantenimiento' &&
                puedeReportarDano && (

                    <button
                        className="btn btn-outline-danger"
                        onClick={handleCancelarReporte}
                    >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancelar reporte de daño
                    </button>

                )}

        </>
    )

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <>
            {/* ======================================================
                TARJETA DEL EQUIPO
            ====================================================== */}

            <div
                className={`equipo-card h-100 ${
                    equipo.estado === 'Baja'
                        ? 'equipo-card--baja'
                        : ''
                }`}
            >

                <div className="equipo-card__visual">

                    {imagen ? (

                        <img
                            src={imagen}
                            alt={equipo.equipo}
                            className="equipo-card__img"
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.style.display =
                                    'none'
                            }}
                        />

                    ) : (

                        <i className="bi bi-pc-display"></i>

                    )}

                    {esGrupo ? (

                        <span className="badge equipo-card__badge text-bg-primary">
                            {unidadesEquipo.length} unidades
                        </span>

                    ) : (

                        <span
                            className={`badge equipo-card__badge ${getEstadoClass(
                                equipo.estado
                            )}`}
                        >
                            {getEstadoLabel(
                                equipo.estado
                            )}
                        </span>

                    )}

                </div>

                <div className="equipo-card__body d-flex flex-column flex-grow-1">

                    <div className="equipo-card__titulo">
                        {equipo.equipo}
                    </div>

                    <div className="equipo-card__meta mb-2">

                        <span className="dept-tag">
                            {equipo.area}
                        </span>

                        {esGrupo ? (

                            <span className="equipo-card__ns">
                                {unidadesEquipo.length}{' '}
                                {unidadesEquipo.length === 1
                                    ? 'unidad'
                                    : 'unidades'}
                            </span>

                        ) : (

                            <code className="equipo-card__ns">
                                {equipo.num_serie}
                            </code>

                        )}

                    </div>

                    <p className="equipo-card__specs">
                        {equipo.descripcion ||
                            'Sin especificaciones registradas'}
                    </p>

                    <div className="mt-auto">

                        <div className="d-flex gap-2 mb-2">

                            <button
                                className="btn btn-sm btn-primary btn-detalle-solid flex-grow-1"
                                onClick={abrirDetalle}
                            >
                                <i className="bi bi-info-circle me-1"></i>
                                Ver detalles
                            </button>

                            {usuario?.rol === 'admin' && (

                                (equipo.estado === 'Asignado' ||
                                    equipo.estado === 'en_prestamo' ||
                                    equipo.estado === 'En préstamo') ? (

                                    <button
                                        className="btn btn-sm btn-warning text-dark fw-semibold"
                                        onClick={() =>
                                            onDevolver &&
                                            onDevolver(equipo)
                                        }
                                    >
                                        <i className="bi bi-arrow-return-left me-1"></i>
                                        Devolver
                                    </button>

                                ) : (

                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={handlePrestamo}
                                    >
                                        <i className="bi bi-arrow-return-right me-1"></i>
                                        Préstamo
                                    </button>

                                )

                            )}

                        </div>

                        {!esGrupo &&
                            equipo.estado === 'Asignado' && (

                                <div className="equipo-card__responsable">

                                    <span
                                        className="text-truncate"
                                        style={{
                                            maxWidth:
                                                '135px'
                                        }}
                                    >

                                        <i className="bi bi-person-fill"></i>

                                        {equipo.responsable ||
                                            'Sin responsable'}

                                    </span>

                                </div>

                            )}

                        {puedeGestionar &&
                            (
                                equipo.estado === 'Baja' ||
                                equipo.estado === 'Extraviado'
                            ) && (

                                <div className="d-flex gap-2 mt-2">

                                    <button
                                        className="btn btn-sm btn-success w-100"
                                        onClick={
                                            handleReintegrar
                                        }
                                        title="Reintegrar al inventario"
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-1"></i>
                                        Reintegrar
                                    </button>

                                </div>

                            )}

                        {!esGrupo &&
                            vencimiento && (

                                <div
                                    className={`small p-1 rounded text-center fw-bold mt-2 ${
                                        vencimiento.tipo === 'vencido'
                                            ? 'equipo-card__alerta--vencido'
                                            : 'equipo-card__alerta--pronto'
                                    }`}
                                >
                                    {textoAlerta} —{' '}
                                    {vencimiento.fecha.toLocaleDateString()}
                                </div>

                            )}

                    </div>

                </div>

            </div>

            {/* ======================================================
                MODAL DETALLES
            ====================================================== */}

            {verDetalle && (

                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{
                        display: 'block',
                        zIndex: '1050',
                        backgroundColor:
                            'rgba(0,0,0,0.5)'
                    }}
                    onClick={() =>
                        setVerDetalle(false)
                    }
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        style={{
                            maxWidth: '620px'
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            {/* CABECERA */}

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold">
                                    Detalles del Equipo
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setVerDetalle(false)
                                    }
                                ></button>

                            </div>

                            {/* CUERPO */}

                            <div
                                className="modal-body p-0"
                                style={{
                                    maxHeight: '75vh',
                                    overflowY: 'auto'
                                }}
                            >

                                {/* INFORMACIÓN PRINCIPAL */}

                                <div
                                    className="d-flex align-items-center gap-3 p-4"
                                    style={{
                                        background:
                                            'var(--bg-surface-2)'
                                    }}
                                >

                                    <div className="prestamo-modal__imagen mb-0 flex-shrink-0 position-relative group-hover">

                                        {imagen ? (

                                            <img
                                                src={imagen}
                                                alt={unidadDetalle.equipo}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        'none'
                                                }}
                                            />

                                        ) : (

                                            <i className="bi bi-pc-display"></i>

                                        )}

                                        {puedeEditarFoto && (

                                            <div
                                                className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-row align-items-center justify-content-center gap-2 bg-dark bg-opacity-50"
                                                style={{
                                                    opacity:
                                                        subiendoFoto
                                                            ? 1
                                                            : 0,
                                                    transition:
                                                        'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) =>
                                                    !subiendoFoto &&
                                                    (
                                                        e.currentTarget.style.opacity =
                                                            '1'
                                                    )
                                                }
                                                onMouseLeave={(e) =>
                                                    !subiendoFoto &&
                                                    (
                                                        e.currentTarget.style.opacity =
                                                            '0'
                                                    )
                                                }
                                            >

                                                {subiendoFoto ? (

                                                    <div
                                                        className="spinner-border text-light spinner-border-sm"
                                                        role="status"
                                                    ></div>

                                                ) : (

                                                    <>

                                                        <label
                                                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm"
                                                            title="Cambiar foto"
                                                            style={{
                                                                cursor:
                                                                    'pointer',
                                                                width:
                                                                    '32px',
                                                                height:
                                                                    '32px'
                                                            }}
                                                        >

                                                            <i
                                                                className="bi bi-camera"
                                                                style={{
                                                                    fontSize:
                                                                        '14px'
                                                                }}
                                                            ></i>

                                                            <input
                                                                type="file"
                                                                className="d-none"
                                                                accept="image/jpeg,image/png,image/webp"
                                                                onChange={
                                                                    handleFileChange
                                                                }
                                                                ref={
                                                                    fileInputRef
                                                                }
                                                            />

                                                        </label>

                                                        {imagen && (

                                                            <button
                                                                className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm"
                                                                title="Eliminar foto"
                                                                onClick={
                                                                    handleEliminarFoto
                                                                }
                                                                style={{
                                                                    width:
                                                                        '32px',
                                                                    height:
                                                                        '32px'
                                                                }}
                                                            >

                                                                <i
                                                                    className="bi bi-trash"
                                                                    style={{
                                                                        fontSize:
                                                                            '14px'
                                                                    }}
                                                                ></i>

                                                            </button>

                                                        )}

                                                    </>

                                                )}

                                            </div>

                                        )}

                                    </div>

                                    <div>

                                        <div className="fw-bold fs-5">
                                            {unidadDetalle.equipo}
                                        </div>

                                        {esGrupo ? (

                                            <div className="mt-1">

                                                <span className="badge text-bg-primary">
                                                    {unidadesEquipo.length}{' '}
                                                    unidades
                                                </span>

                                            </div>

                                        ) : (

                                            <div>

                                                <span
                                                    className={`badge ${getEstadoClass(
                                                        unidadDetalle.estado
                                                    )}`}
                                                >
                                                    {getEstadoLabel(
                                                        unidadDetalle.estado
                                                    )}
                                                </span>

                                            </div>

                                        )}

                                        <div className="small text-muted mt-1">

                                            {unidadDetalle.area}
                                            {' • '}
                                            <code>
                                                {unidadDetalle.num_serie}
                                            </code>

                                        </div>

                                    </div>

                                </div>

                                {/* UNIDADES DEL MODELO */}

                                {esGrupo && (

                                    <div className="px-4 pt-4">

                                        <div className="fw-bold small text-muted text-uppercase mb-2">
                                            Unidades de este modelo
                                        </div>

                                        <div className="d-flex flex-column gap-2">

                                            {unidadesEquipo.map(
                                                unidad => (

                                                    <button
                                                        type="button"
                                                        key={
                                                            unidad.num_serie
                                                        }
                                                        className={`border rounded p-3 text-start ${
                                                            unidadDetalle.num_serie ===
                                                            unidad.num_serie
                                                                ? 'border-primary bg-primary bg-opacity-10'
                                                                : 'bg-transparent'
                                                        }`}
                                                        onClick={() =>
                                                            seleccionarUnidad(
                                                                unidad
                                                            )
                                                        }
                                                    >

                                                        <div className="d-flex justify-content-between align-items-center gap-2">

                                                            <div>

                                                                <div className="fw-semibold">

                                                                    <i className="bi bi-pc-display me-2"></i>

                                                                    {unidad.num_serie}

                                                                </div>

                                                                <div className="small text-muted mt-1">

                                                                    {unidad.area ||
                                                                        'Sin área'}

                                                                    {unidad.responsable
                                                                        ? ` • ${unidad.responsable}`
                                                                        : ''}

                                                                </div>

                                                            </div>

                                                            <span
                                                                className={`badge ${getEstadoClass(
                                                                    unidad.estado
                                                                )}`}
                                                            >
                                                                {getEstadoLabel(
                                                                    unidad.estado
                                                                )}
                                                            </span>

                                                        </div>

                                                    </button>

                                                )
                                            )}

                                        </div>

                                        <div className="small text-muted mt-2">
                                            Selecciona una unidad para consultar
                                            su información e historial.
                                        </div>

                                    </div>

                                )}

                                {/* ESTADO ACTUAL */}

                                <div className="px-4 pt-4">

                                    <div className="border rounded p-3">

                                        <div className="small text-muted mb-1">
                                            Estado actual del equipo
                                        </div>

                                        <div className="d-flex align-items-center gap-2">

                                            <span
                                                className={`badge ${getEstadoClass(
                                                    unidadDetalle.estado
                                                )}`}
                                            >
                                                {getEstadoLabel(
                                                    unidadDetalle.estado
                                                )}
                                            </span>

                                            <span className="small text-muted">
                                                Este es el estado actual de la
                                                unidad seleccionada.
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                {/* FICHA TÉCNICA */}

                                <div className="p-4">

                                    <div className="fw-bold small text-muted text-uppercase mb-2">
                                        Ficha Técnica
                                    </div>

                                    <ul className="prestamo-modal__specs">

                                        {unidadDetalle.sistema_operativo && (

                                            <li>

                                                <i className="bi bi-windows"></i>

                                                {unidadDetalle.sistema_operativo}

                                            </li>

                                        )}

                                        {especificaciones.map(
                                            (spec, i) => (

                                                <li key={i}>

                                                    <i className="bi bi-check2-circle text-success"></i>

                                                    {spec}

                                                </li>

                                            )
                                        )}

                                        {especificaciones.length === 0 &&
                                            !unidadDetalle.sistema_operativo && (

                                                <li className="text-muted">
                                                    Sin especificaciones
                                                    registradas
                                                </li>

                                            )}

                                    </ul>

                                    <div className="prestamo-modal__ficha-row">

                                        <span>
                                            Fecha de registro
                                        </span>

                                        <strong>

                                            {unidadDetalle.fecha_adquisicion
                                                ? String(
                                                    unidadDetalle.fecha_adquisicion
                                                ).substring(
                                                    0,
                                                    10
                                                )
                                                : 'No registrada'}

                                        </strong>

                                    </div>

                                    {/* HISTORIAL */}

                                    <div className="mt-4 pt-3 border-top">

                                        <div className="fw-bold small text-muted text-uppercase mb-3">

                                            <i className="bi bi-clock-history me-2"></i>

                                            Historial del equipo

                                        </div>

                                        <div className="d-flex gap-2">

                                            <button
                                                type="button"
                                                className={`btn flex-fill ${
                                                    historialSeleccionado ===
                                                    'prestamos'
                                                        ? 'btn-primary'
                                                        : 'btn-outline-primary'
                                                }`}
                                                onClick={() =>
                                                    seleccionarHistorial(
                                                        'prestamos'
                                                    )
                                                }
                                            >

                                                <i className="bi bi-arrow-left-right me-2"></i>

                                                Préstamos

                                            </button>

                                            <button
                                                type="button"
                                                className={`btn flex-fill ${
                                                    historialSeleccionado ===
                                                    'mantenimientos'
                                                        ? 'btn-warning'
                                                        : 'btn-outline-warning'
                                                }`}
                                                onClick={() =>
                                                    seleccionarHistorial(
                                                        'mantenimientos'
                                                    )
                                                }
                                            >

                                                <i className="bi bi-tools me-2"></i>

                                                Mantenimientos

                                            </button>

                                        </div>

                                        {!cargandoHistorial &&
                                            !errorHistorial &&
                                            !historialSeleccionado && (

                                                <div className="text-center text-muted py-4">

                                                    <i className="bi bi-clock-history fs-2 d-block mb-2"></i>

                                                    <div className="small">

                                                        Selecciona un historial
                                                        para consultar los
                                                        registros del equipo.

                                                    </div>

                                                </div>

                                            )}

                                        {cargandoHistorial && (

                                            <div className="text-center py-4">

                                                <div
                                                    className="spinner-border spinner-border-sm text-primary"
                                                    role="status"
                                                ></div>

                                                <div className="small text-muted mt-2">
                                                    Cargando historial...
                                                </div>

                                            </div>

                                        )}

                                        {!cargandoHistorial &&
                                            errorHistorial && (

                                                <div className="alert alert-danger small mt-3 mb-0">

                                                    <i className="bi bi-exclamation-circle me-2"></i>

                                                    {errorHistorial}

                                                </div>

                                            )}

                                        {/* HISTORIAL DE PRÉSTAMOS */}

                                        {!cargandoHistorial &&
                                            !errorHistorial &&
                                            historialSeleccionado ===
                                                'prestamos' && (

                                                <div className="mt-3">

                                                    {historial.length === 0 ? (

                                                        <div className="text-center text-muted py-4 border rounded">

                                                            <i className="bi bi-clock-history fs-3 d-block mb-2"></i>

                                                            <div className="small">

                                                                Este equipo no tiene
                                                                historial de
                                                                préstamos
                                                                registrado.

                                                            </div>

                                                        </div>

                                                    ) : (

                                                        <div className="d-flex flex-column gap-3">

                                                            {historial.map(
                                                                (
                                                                    registro,
                                                                    index
                                                                ) => {

                                                                    const estaActivo =
                                                                        !registro.fecha_devolucion ||
                                                                        String(
                                                                            registro.estado
                                                                        ).toLowerCase() ===
                                                                            'activo'

                                                                    return (

                                                                        <div
                                                                            key={`${registro.id_prestamo}-${index}`}
                                                                            className="border rounded p-3"
                                                                        >

                                                                            <div className="d-flex justify-content-between align-items-start gap-2">

                                                                                <div>

                                                                                    <div className="fw-bold">

                                                                                        <i className="bi bi-person-circle me-2"></i>

                                                                                        {registro.nombre ||
                                                                                            registro.usuario ||
                                                                                            'Usuario no registrado'}

                                                                                    </div>

                                                                                    <div className="small text-muted mt-1">
                                                                                        @
                                                                                        {registro.usuario ||
                                                                                            'Sin usuario'}
                                                                                    </div>

                                                                                </div>

                                                                                {estaActivo ? (

                                                                                    <span className="badge bg-success">
                                                                                        En uso
                                                                                    </span>

                                                                                ) : (

                                                                                    <span className="badge bg-secondary">
                                                                                        Devuelto
                                                                                    </span>

                                                                                )}

                                                                            </div>

                                                                            <div className="small mt-3">

                                                                                {registro.correo && (

                                                                                    <div className="mb-1">

                                                                                        <i className="bi bi-envelope me-2 text-muted"></i>

                                                                                        {
                                                                                            registro.correo
                                                                                        }

                                                                                    </div>

                                                                                )}

                                                                                {registro.area_usuario && (

                                                                                    <div className="mb-1">

                                                                                        <i className="bi bi-building me-2 text-muted"></i>

                                                                                        {
                                                                                            registro.area_usuario
                                                                                        }

                                                                                    </div>

                                                                                )}

                                                                                {registro.rol && (

                                                                                    <div>

                                                                                        <i className="bi bi-person-badge me-2 text-muted"></i>

                                                                                        {
                                                                                            registro.rol
                                                                                        }

                                                                                    </div>

                                                                                )}

                                                                            </div>

                                                                            <div className="mt-3 pt-2 border-top small">

                                                                                <div className="d-flex justify-content-between">

                                                                                    <span className="text-muted">

                                                                                        <i className="bi bi-calendar-check me-2"></i>

                                                                                        Préstamo

                                                                                    </span>

                                                                                    <strong>

                                                                                        {registro.fecha_prestamo
                                                                                            ? String(
                                                                                                registro.fecha_prestamo
                                                                                            ).substring(
                                                                                                0,
                                                                                                10
                                                                                            )
                                                                                            : 'No registrada'}

                                                                                    </strong>

                                                                                </div>

                                                                                <div className="d-flex justify-content-between mt-2">

                                                                                    <span className="text-muted">

                                                                                        <i className="bi bi-calendar-x me-2"></i>

                                                                                        Devolución

                                                                                    </span>

                                                                                    <strong>

                                                                                        {registro.fecha_devolucion
                                                                                            ? String(
                                                                                                registro.fecha_devolucion
                                                                                            ).substring(
                                                                                                0,
                                                                                                10
                                                                                            )
                                                                                            : 'Actualmente'}

                                                                                    </strong>

                                                                                </div>

                                                                            </div>

                                                                            {registro.observaciones && (

                                                                                <div className="small text-muted mt-3">

                                                                                    <i className="bi bi-chat-left-text me-2"></i>

                                                                                    {
                                                                                        registro.observaciones
                                                                                    }

                                                                                </div>

                                                                            )}

                                                                        </div>

                                                                    )
                                                                }
                                                            )}

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                        {/* HISTORIAL DE MANTENIMIENTOS */}

                                        {!cargandoHistorial &&
                                            !errorHistorial &&
                                            historialSeleccionado ===
                                                'mantenimientos' && (

                                                <div className="mt-3">

                                                    {mantenimientos.length ===
                                                    0 ? (

                                                        <div className="text-center text-muted py-4 border rounded">

                                                            <i className="bi bi-tools fs-3 d-block mb-2"></i>

                                                            <div className="small">

                                                                Este equipo no tiene
                                                                mantenimientos
                                                                registrados.

                                                            </div>

                                                        </div>

                                                    ) : (

                                                        <div className="d-flex flex-column gap-3">

                                                            {mantenimientos.map(
                                                                mantenimiento => {

                                                                    const fueDadoDeBaja =
                                                                        String(
                                                                            mantenimiento.solucion ||
                                                                                ''
                                                                        )
                                                                            .toLowerCase()
                                                                            .startsWith(
                                                                                'no se puede reparar:'
                                                                            )

                                                                    const estaPendiente =
                                                                        mantenimiento.estado_orden ===
                                                                            'pendiente' &&
                                                                        !mantenimiento.fecha_solucion

                                                                    return (

                                                                        <div
                                                                            key={
                                                                                mantenimiento.id_historial
                                                                            }
                                                                            className={`border rounded p-3 ${
                                                                                fueDadoDeBaja
                                                                                    ? 'border-danger'
                                                                                    : ''
                                                                            }`}
                                                                        >

                                                                            <div className="d-flex justify-content-between align-items-start gap-2 mb-3">

                                                                                <div>

                                                                                    <div className="fw-bold">

                                                                                        <i className="bi bi-wrench-adjustable me-2"></i>

                                                                                        Mantenimiento

                                                                                    </div>

                                                                                    <div className="small text-muted mt-1 text-break">

                                                                                        ID:{' '}

                                                                                        {
                                                                                            mantenimiento.id_historial
                                                                                        }

                                                                                    </div>

                                                                                </div>

                                                                                {fueDadoDeBaja ? (

                                                                                    <span className="badge text-bg-danger">

                                                                                        <i className="bi bi-x-octagon me-1"></i>

                                                                                        Dado de baja

                                                                                    </span>

                                                                                ) : estaPendiente ? (

                                                                                    <span className="badge text-bg-warning">

                                                                                        <i className="bi bi-hourglass-split me-1"></i>

                                                                                        Pendiente

                                                                                    </span>

                                                                                ) : (

                                                                                    <span className="badge text-bg-success">

                                                                                        <i className="bi bi-check-circle me-1"></i>

                                                                                        Reparado

                                                                                    </span>

                                                                                )}

                                                                            </div>

                                                                            <div className="mb-3">

                                                                                <div className="small text-muted mb-1">
                                                                                    Falla reportada
                                                                                </div>

                                                                                <div className="text-break">

                                                                                    {
                                                                                        mantenimiento.falla ||
                                                                                        '-'
                                                                                    }

                                                                                </div>

                                                                            </div>

                                                                            <div className="mb-3">

                                                                                <div className="small text-muted mb-1">

                                                                                    {fueDadoDeBaja
                                                                                        ? 'Motivo de baja'
                                                                                        : 'Solución'}

                                                                                </div>

                                                                                <div
                                                                                    className={`p-2 rounded ${
                                                                                        fueDadoDeBaja
                                                                                            ? 'bg-danger bg-opacity-10'
                                                                                            : 'bg-light'
                                                                                    }`}
                                                                                >

                                                                                    {
                                                                                        mantenimiento.solucion ||
                                                                                        'Sin solución registrada'
                                                                                    }

                                                                                </div>

                                                                            </div>

                                                                            <div className="row g-2 small">

                                                                                <div className="col-md-6">

                                                                                    <div className="border-top pt-2">

                                                                                        <div className="text-muted">
                                                                                            Técnico
                                                                                        </div>

                                                                                        <strong>

                                                                                            {
                                                                                                mantenimiento.nombre_tecnico ||
                                                                                                mantenimiento.usuario_tecnico ||
                                                                                                '-'
                                                                                            }

                                                                                        </strong>

                                                                                    </div>

                                                                                </div>

                                                                                <div className="col-md-6">

                                                                                    <div className="border-top pt-2">

                                                                                        <div className="text-muted">
                                                                                            Aprobado por
                                                                                        </div>

                                                                                        <strong>

                                                                                            {
                                                                                                mantenimiento.aprobada_por ||
                                                                                                '-'
                                                                                            }

                                                                                        </strong>

                                                                                    </div>

                                                                                </div>

                                                                            </div>

                                                                            <div className="mt-3 pt-2 border-top small">

                                                                                <div className="d-flex justify-content-between">

                                                                                    <span className="text-muted">

                                                                                        <i className="bi bi-calendar-event me-2"></i>

                                                                                        Reporte

                                                                                    </span>

                                                                                    <strong>

                                                                                        {mantenimiento.fecha_reporte
                                                                                            ? String(
                                                                                                mantenimiento.fecha_reporte
                                                                                            ).substring(
                                                                                                0,
                                                                                                10
                                                                                            )
                                                                                            : '-'}

                                                                                    </strong>

                                                                                </div>

                                                                                <div className="d-flex justify-content-between mt-2">

                                                                                    <span className="text-muted">

                                                                                        <i className="bi bi-calendar-check me-2"></i>

                                                                                        Solución

                                                                                    </span>

                                                                                    <strong>

                                                                                        {mantenimiento.fecha_solucion
                                                                                            ? String(
                                                                                                mantenimiento.fecha_solucion
                                                                                            ).substring(
                                                                                                0,
                                                                                                10
                                                                                            )
                                                                                            : 'Pendiente'}

                                                                                    </strong>

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                    )
                                                                }
                                                            )}

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                    </div>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setVerDetalle(false)
                                    }
                                >
                                    Cerrar
                                </button>

                                {AccionesDetalle}

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </>
    )
}