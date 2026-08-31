import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

// =========================================================
// FECHAS
// =========================================================

const toISODate = (fecha) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, "0")
    const d = String(fecha.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
}

const diasRestantes = (fecha) => {
    if (!fecha) return null

    const limite = String(fecha).substring(0, 10)

    return Math.round(
        (new Date(limite) - new Date(toISODate(new Date()))) / 86400000
    )
}

// =========================================================
// FUNCIONES PARA OBTENER DATOS DEL EQUIPO
// =========================================================

// Obtiene el número de serie sin importar cómo venga del backend
const obtenerNumeroSerie = (equipo) => {
    if (!equipo) return ""

    return (
        equipo.num_serie ||
        equipo.numero_serie ||
        equipo.serie ||
        equipo.equipo?.num_serie ||
        equipo.equipo?.numero_serie ||
        equipo.equipo?.serie ||
        equipo.equipo?.equipo?.num_serie ||
        equipo.equipo?.equipo?.numero_serie ||
        ""
    )
}

// Obtiene el nombre del equipo
const obtenerNombreEquipo = (equipo) => {
    if (!equipo) return "Equipo"

    if (typeof equipo.equipo === "string") {
        return equipo.equipo
    }

    return (
        equipo.nombre_equipo ||
        equipo.equipo?.nombre_equipo ||
        equipo.equipo?.equipo ||
        equipo.nombre ||
        "Equipo"
    )
}

// =========================================================
// COMPONENTE
// =========================================================

const Prestamos = () => {

    const [prestamos, setPrestamos] = useState([])
    const [equiposDisponibles, setEquiposDisponibles] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)

    // Buscador
    const [busqueda, setBusqueda] = useState("")

    // =====================================================
    // MODAL NUEVO PRÉSTAMO
    // =====================================================

    const [modalNuevo, setModalNuevo] = useState(false)

    const [numSeries, setNumSeries] = useState([])
    const [usuarioDestino, setUsuarioDestino] = useState("")
    const [areaPrestamo, setAreaPrestamo] = useState("")

    const [fechaInicio, setFechaInicio] = useState(
        toISODate(new Date())
    )

    const [fechaLimite, setFechaLimite] = useState(
        toISODate(new Date(Date.now() + 7 * 86400000))
    )

    const [observaciones, setObservaciones] = useState("")
    const [enviarCorreo, setEnviarCorreo] = useState(true)
    const [guardando, setGuardando] = useState(false)

    // =====================================================
    // MODAL VER PRÉSTAMO
    // =====================================================

    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null)

    const [equiposSeleccionados, setEquiposSeleccionados] = useState([])

    const [datosDevolucion, setDatosDevolucion] = useState({})

    // =====================================================
    // CARGAR DATOS
    // =====================================================

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {

        setLoading(true)

        try {

            const [
                resPrestamos,
                resEquipos,
                resUsuarios,
                resAreas
            ] = await Promise.all([

                axios.get(API_ROUTES.PRESTAMOS_ACTIVOS),

                axios.get(API_ROUTES.EQUIPOS),

                axios.get(API_ROUTES.OBTENER_USUARIOS),

                axios.get(API_ROUTES.OBTENER_AREAS)

            ])

            console.log("PRESTAMOS:", resPrestamos.data)
            console.log("EQUIPOS:", resEquipos.data)

            setPrestamos(
                Array.isArray(resPrestamos.data)
                    ? resPrestamos.data
                    : []
            )

            setEquiposDisponibles(
                Array.isArray(resEquipos.data)
                    ? resEquipos.data.filter(
                        e => e.estado === "Disponible"
                    )
                    : []
            )

            setUsuarios(
                Array.isArray(resUsuarios.data)
                    ? resUsuarios.data.filter(
                        u => u.estado === "activo"
                    )
                    : []
            )

            setAreas(
                Array.isArray(resAreas.data)
                    ? resAreas.data
                    : []
            )

        } catch (error) {

            console.error("ERROR CARGANDO DATOS:", error)

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los datos de préstamos"
            })

        } finally {

            setLoading(false)

        }
    }

    // =====================================================
    // NUEVO PRÉSTAMO
    // =====================================================

    const abrirModalNuevo = () => {

        setNumSeries([])

        setUsuarioDestino("")

        setAreaPrestamo("")

        setFechaInicio(
            toISODate(new Date())
        )

        setFechaLimite(
            toISODate(
                new Date(
                    Date.now() + 7 * 86400000
                )
            )
        )

        setObservaciones("")

        setEnviarCorreo(true)

        setModalNuevo(true)
    }

    // =====================================================
    // SELECCIONAR EQUIPO PARA PRÉSTAMO
    // =====================================================

    const handleSelectEquipo = (serie) => {

        if (!serie) return

        setNumSeries(prev => {

            if (prev.includes(serie)) {
                return prev
            }

            return [
                ...prev,
                serie
            ]
        })

        const equipo = equiposDisponibles.find(
            e => obtenerNumeroSerie(e) === serie
        )

        if (
            equipo &&
            equipo.area &&
            !areaPrestamo
        ) {

            setAreaPrestamo(
                equipo.area
            )
        }
    }

    // =====================================================
    // SELECCIONAR USUARIO
    // =====================================================

    const handleSelectUsuario = (nombre) => {

        setUsuarioDestino(nombre)

        const usuario = usuarios.find(
            x => x.nombre === nombre
        )

        if (
            usuario &&
            usuario.area
        ) {

            setAreaPrestamo(
                usuario.area
            )
        }
    }

    // =====================================================
    // CREAR PRÉSTAMO
    // =====================================================

    const crearPrestamo = async () => {

        if (
            numSeries.length === 0 ||
            !usuarioDestino
        ) {

            Swal.fire({
                icon: "warning",
                title: "Campos requeridos",
                text: "Selecciona al menos un equipo y un usuario destino"
            })

            return
        }

        try {

            setGuardando(true)

            const obsFinal =
                observaciones.trim() ||
                `Préstamo del ${fechaInicio} al ${fechaLimite}`

            await axios.post(
                API_ROUTES.CREAR_PRESTAMO,
                {
                    num_series: numSeries,
                    usuario_destino: usuarioDestino,
                    area: areaPrestamo,
                    fecha_inicio: fechaInicio,
                    fecha_limite: fechaLimite,
                    observaciones: obsFinal
                }
            )

            setModalNuevo(false)

            Swal.fire({
                icon: "success",
                title: "Préstamo registrado",
                text: "Los equipos fueron asignados correctamente",
                timer: 2000,
                showConfirmButton: false
            })

            cargarDatos()

        } catch (error) {

            console.error(
                "ERROR CREANDO PRÉSTAMO:",
                error
            )

            Swal.fire({
                icon: "error",
                title: "Error al registrar préstamo",
                text:
                    error.response?.data?.error ||
                    "No se pudo crear el préstamo"
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // AGRUPAR PRÉSTAMOS
    // =====================================================

    const prestamosAgrupados = Object.values(

        prestamos.reduce(
            (grupos, prestamo) => {

                const id = prestamo.id_prestamo

                if (!grupos[id]) {

                    grupos[id] = {
                        ...prestamo,
                        equipos: []
                    }

                }

                grupos[id].equipos.push({
                    ...prestamo
                })

                return grupos

            },
            {}
        )

    )

    // =====================================================
    // PRÉSTAMOS ACTIVOS
    // =====================================================

    const prestamosActivos = prestamosAgrupados.filter(
        p =>
            p.estado === "activo" ||
            p.estado === "parcial"
    )

    // =====================================================
    // BUSCADOR
    // =====================================================

    const filteredPrestamos =
        prestamosActivos.filter(p => {

            const texto =
                busqueda
                    .toLowerCase()
                    .trim()

            if (!texto) return true

            return (

                String(
                    p.id_prestamo
                )
                    .toLowerCase()
                    .includes(texto)

                ||

                p.usuario_destino
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.area
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.observaciones
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.equipos?.some(e => {

                    const serie =
                        obtenerNumeroSerie(e)

                    const nombre =
                        obtenerNombreEquipo(e)

                    return (

                        serie
                            .toLowerCase()
                            .includes(texto)

                        ||

                        nombre
                            .toLowerCase()
                            .includes(texto)

                    )

                })

            )

        })

    // =====================================================
    // ABRIR PRÉSTAMO
    // =====================================================

    const verPrestamo = (prestamo) => {

        console.log(
            "PRÉSTAMO SELECCIONADO:",
            prestamo
        )

        console.log(
            "EQUIPOS:",
            prestamo.equipos
        )

        setPrestamoSeleccionado(
            prestamo
        )

        setEquiposSeleccionados([])

        setDatosDevolucion({})
    }

    // =====================================================
    // CERRAR PRÉSTAMO
    // =====================================================

    const cerrarPrestamo = () => {

        setPrestamoSeleccionado(null)

        setEquiposSeleccionados([])

        setDatosDevolucion({})
    }

    // =====================================================
    // SELECCIONAR EQUIPO
    // =====================================================

    const seleccionarEquipo = (numSerie) => {

        setEquiposSeleccionados(prev => {

            if (
                prev.includes(numSerie)
            ) {

                return prev.filter(
                    serie =>
                        serie !== numSerie
                )

            }

            return [
                ...prev,
                numSerie
            ]

        })

    }

    // =====================================================
    // SELECCIONAR TODOS
    // =====================================================

    const seleccionarTodos = () => {

        if (!prestamoSeleccionado) {
            return
        }

        const equipos =
            prestamoSeleccionado.equipos || []

        const series =
            equipos
                .map(e =>
                    obtenerNumeroSerie(e)
                )
                .filter(Boolean)

        if (
            equiposSeleccionados.length ===
            series.length
        ) {

            setEquiposSeleccionados([])

        } else {

            setEquiposSeleccionados(
                series
            )

        }
    }

    // =====================================================
    // OBSERVACIÓN
    // =====================================================

    const cambiarObservacion = (
        numSerie,
        valor
    ) => {

        setDatosDevolucion(prev => ({

            ...prev,

            [numSerie]: {

                ...prev[numSerie],

                observaciones:
                    valor

            }

        }))

    }

    // =====================================================
    // IMAGEN
    // =====================================================

    const cambiarImagen = (
        numSerie,
        archivo
    ) => {

        setDatosDevolucion(prev => ({

            ...prev,

            [numSerie]: {

                ...prev[numSerie],

                evidencia:
                    archivo

            }

        }))

    }

    // =====================================================
    // DEVOLVER UN EQUIPO
    // =====================================================

    const devolverEquipo = async (
        prestamo,
        equipo
    ) => {

        const numSerie =
            obtenerNumeroSerie(equipo)

        const nombreEquipo =
            obtenerNombreEquipo(equipo)

        console.log(
            "DEVOLVIENDO EQUIPO:",
            {
                idPrestamo:
                    prestamo.id_prestamo,

                numSerie,

                equipo:
                    nombreEquipo
            }
        )

        // Si no encontramos serie,
        // NO hacemos la petición
        if (!numSerie) {

            Swal.fire({
                icon: "error",
                title: "Número de serie no encontrado",
                text:
                    "El backend no está enviando el número de serie de este equipo."
            })

            console.error(
                "EQUIPO SIN NUMERO DE SERIE:",
                equipo
            )

            return false
        }

        const datos =
            datosDevolucion[numSerie] || {}

        const formData =
            new FormData()

        if (
            datos.observaciones &&
            datos.observaciones.trim()
        ) {

            formData.append(
                "observaciones",
                datos.observaciones.trim()
            )

        }

        if (datos.evidencia) {

            formData.append(
                "evidencia",
                datos.evidencia
            )

        }

        try {

            const url =
                API_ROUTES.DEVOLVER_EQUIPO(
                    prestamo.id_prestamo,
                    numSerie
                )

            console.log(
                "URL DEVOLUCIÓN:",
                url
            )

            await axios.post(
                url,
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            )

            return true

        } catch (error) {

            console.error(
                "ERROR DEVOLVIENDO:",
                error
            )

            console.error(
                "RESPUESTA:",
                error.response?.data
            )

            Swal.fire({
                icon: "error",
                title: "Error al devolver",
                text:
                    error.response?.data?.error ||
                    `No se pudo devolver ${numSerie}`
            })

            return false
        }
    }

    // =====================================================
    // DEVOLVER SELECCIONADOS
    // =====================================================

    const devolverSeleccionados = async () => {

        if (!prestamoSeleccionado) {
            return
        }

        const seleccionados =
            prestamoSeleccionado.equipos?.filter(
                equipo => {

                    const serie =
                        obtenerNumeroSerie(
                            equipo
                        )

                    return equiposSeleccionados.includes(
                        serie
                    )

                }
            ) || []

        if (
            seleccionados.length === 0
        ) {

            Swal.fire({
                icon: "warning",
                title: "Selecciona un equipo",
                text:
                    "Debes seleccionar al menos un equipo."
            })

            return
        }

        const resultado =
            await Swal.fire({

                icon: "question",

                title:
                    "Confirmar devolución",

                text:
                    `¿Deseas devolver ${seleccionados.length} equipo(s)?`,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Sí, devolver",

                cancelButtonText:
                    "Cancelar",

                confirmButtonColor:
                    "#16a34a"

            })

        if (
            !resultado.isConfirmed
        ) {
            return
        }

        try {

            setGuardando(true)

            let exitosos = 0

            for (
                const equipo of seleccionados
            ) {

                const resultadoDevolucion =
                    await devolverEquipo(
                        prestamoSeleccionado,
                        equipo
                    )

                if (
                    resultadoDevolucion
                ) {

                    exitosos++

                }

            }

            if (
                exitosos ===
                seleccionados.length
            ) {

                Swal.fire({
                    icon: "success",
                    title: "Devolución registrada",
                    text:
                        "Los equipos fueron devueltos correctamente.",
                    timer: 2000,
                    showConfirmButton:
                        false
                })

            } else if (
                exitosos > 0
            ) {

                Swal.fire({
                    icon: "warning",
                    title: "Devolución parcial",
                    text:
                        `${exitosos} de ${seleccionados.length} equipos fueron devueltos.`
                })

            }

            cerrarPrestamo()

            cargarDatos()

        } catch (error) {

            console.error(
                error
            )

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "No se pudieron procesar las devoluciones."
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // DEVOLVER TODO
    // =====================================================

    const devolverTodo = async () => {

        if (!prestamoSeleccionado) {
            return
        }

        const equipos =
            prestamoSeleccionado.equipos || []

        if (
            equipos.length === 0
        ) {

            Swal.fire({
                icon: "warning",
                title: "Sin equipos",
                text:
                    "Este préstamo no tiene equipos."
            })

            return
        }

        const sinSerie =
            equipos.filter(
                equipo =>
                    !obtenerNumeroSerie(
                        equipo
                    )
            )

        if (
            sinSerie.length > 0
        ) {

            console.error(
                "EQUIPOS SIN SERIE:",
                sinSerie
            )

            Swal.fire({
                icon: "error",
                title:
                    "Falta el número de serie",
                text:
                    "Uno o más equipos no tienen número de serie en los datos recibidos por el frontend."
            })

            return
        }

        const resultado =
            await Swal.fire({

                icon: "warning",

                title:
                    "Devolver todos",

                text:
                    `¿Deseas devolver los ${equipos.length} equipos de este préstamo?`,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Sí, devolver todo",

                cancelButtonText:
                    "Cancelar",

                confirmButtonColor:
                    "#16a34a"

            })

        if (
            !resultado.isConfirmed
        ) {

            return

        }

        try {

            setGuardando(true)

            let exitosos = 0

            for (
                const equipo of equipos
            ) {

                const resultadoDevolucion =
                    await devolverEquipo(
                        prestamoSeleccionado,
                        equipo
                    )

                if (
                    resultadoDevolucion
                ) {

                    exitosos++

                }

            }

            if (
                exitosos ===
                equipos.length
            ) {

                Swal.fire({
                    icon: "success",
                    title:
                        "Préstamo devuelto",
                    text:
                        "Todos los equipos fueron devueltos correctamente.",
                    timer: 2000,
                    showConfirmButton:
                        false
                })

            } else if (
                exitosos > 0
            ) {

                Swal.fire({
                    icon: "warning",
                    title:
                        "Devolución parcial",
                    text:
                        `${exitosos} de ${equipos.length} equipos fueron devueltos.`
                })

            }

            cerrarPrestamo()

            cargarDatos()

        } catch (error) {

            console.error(
                error
            )

            Swal.fire({
                icon: "error",
                title:
                    "Error",
                text:
                    "No se pudieron devolver todos los equipos."
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // USUARIO SELECCIONADO
    // =====================================================

    const usuarioSeleccionadoObj =
        usuarios.find(
            u =>
                u.nombre ===
                usuarioDestino
        )

    // =====================================================
    // CONTADORES
    // =====================================================

    const totalVencidos =
        prestamosActivos.filter(
            p =>
                (
                    diasRestantes(
                        p.fecha_devolucion
                    ) ?? 0
                ) < 0
        ).length

    const totalPorVencer =
        prestamosActivos.filter(
            p => {

                const d =
                    diasRestantes(
                        p.fecha_devolucion
                    )

                return (
                    d !== null &&
                    d >= 0 &&
                    d <= 3
                )
            }
        ).length

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="card shadow-sm border">

            <div className="card-body">

                {/* =========================================
                    ENCABEZADO
                ========================================= */}

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">

                    <div className="d-flex align-items-center gap-2 flex-wrap">

                        <h4 className="mb-0 fw-bold">
                            Préstamos Activos
                        </h4>

                        <span className="chip-alerta chip-alerta--ok">
                            {prestamosActivos.length} activos
                        </span>

                        {totalPorVencer > 0 && (

                            <span className="chip-alerta chip-alerta--pronto">
                                {totalPorVencer} por vencer
                            </span>

                        )}

                        {totalVencidos > 0 && (

                            <span className="chip-alerta chip-alerta--vencido">
                                {totalVencidos} vencidos
                            </span>

                        )}

                    </div>

                    <button
                        className="btn btn-success btn-sm"
                        onClick={abrirModalNuevo}
                    >
                        + Nuevo Préstamo
                    </button>

                </div>

                {/* =========================================
                    BUSCADOR
                ========================================= */}

                <div className="mb-3">

                    <div className="input-group">

                        <span className="input-group-text bg-light">
                            <i className="bi bi-search"></i>
                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por préstamo, usuario, área o equipo..."
                            value={busqueda}
                            onChange={e =>
                                setBusqueda(
                                    e.target.value
                                )
                            }
                        />

                        {busqueda && (

                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                    setBusqueda("")
                                }
                            >
                                Limpiar
                            </button>

                        )}

                    </div>

                </div>

                {/* =========================================
                    TABLA
                ========================================= */}

                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle mb-0">

                        <thead className="table-header">

                            <tr>

                                <th>Préstamo</th>

                                <th>Usuario Destino</th>

                                <th>Área</th>

                                <th>Fecha Inicio</th>

                                <th>Fecha Límite</th>

                                <th>Observaciones</th>

                                <th className="text-center">
                                    Acción
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center py-4"
                                    >
                                        Cargando préstamos...
                                    </td>

                                </tr>

                            ) : filteredPrestamos.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center py-4 text-muted"
                                    >
                                        No hay préstamos registrados
                                    </td>

                                </tr>

                            ) : (

                                filteredPrestamos.map(p => (

                                    <tr
                                        key={p.id_prestamo}
                                    >

                                        <td className="fw-semibold">

                                            <code>
                                                #{p.id_prestamo}
                                            </code>

                                        </td>

                                        <td>
                                            {p.usuario_destino || "-"}
                                        </td>

                                        <td>
                                            {p.area || "-"}
                                        </td>

                                        <td>

                                            {p.fecha_prestamo
                                                ? String(
                                                    p.fecha_prestamo
                                                ).substring(0, 10)
                                                : "—"
                                            }

                                        </td>

                                        <td>

                                            {p.fecha_devolucion
                                                ? String(
                                                    p.fecha_devolucion
                                                ).substring(0, 10)
                                                : "—"
                                            }

                                            {(() => {

                                                const d =
                                                    diasRestantes(
                                                        p.fecha_devolucion
                                                    )

                                                if (
                                                    d === null ||
                                                    d > 3
                                                ) {
                                                    return null
                                                }

                                                if (
                                                    d < 0
                                                ) {

                                                    return (

                                                        <div className="mt-1">

                                                            <span className="chip-alerta chip-alerta--vencido">

                                                                VENCIDO (
                                                                {Math.abs(d)}
                                                                d)

                                                            </span>

                                                        </div>

                                                    )

                                                }

                                                return (

                                                    <div className="mt-1">

                                                        <span className="chip-alerta chip-alerta--pronto">

                                                            {d === 0
                                                                ? "Vence hoy"
                                                                : `Vence en ${d}d`
                                                            }

                                                        </span>

                                                    </div>

                                                )

                                            })()}

                                        </td>

                                        <td>
                                            {p.observaciones || "-"}
                                        </td>

                                        <td className="text-center">

                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() =>
                                                    verPrestamo(p)
                                                }
                                            >
                                                Ver
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =================================================
                MODAL VER PRÉSTAMO
            ================================================= */}

            {prestamoSeleccionado && (

                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                        zIndex: 1060
                    }}
                    onClick={cerrarPrestamo}
                >

                    <div
                        className="modal-dialog modal-dialog-centered modal-lg"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold mb-1">

                                        Préstamo #
                                        {prestamoSeleccionado.id_prestamo}

                                    </h5>

                                    <small className="text-muted">

                                        {prestamoSeleccionado.usuario_destino}

                                        {" • "}

                                        {prestamoSeleccionado.area || "Sin área"}

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarPrestamo}
                                ></button>

                            </div>

                            <div className="modal-body">

                                <div className="row mb-3">

                                    <div className="col-md-6">

                                        <small className="text-muted d-block">
                                            Fecha de inicio
                                        </small>

                                        <strong>

                                            {prestamoSeleccionado.fecha_prestamo
                                                ? String(
                                                    prestamoSeleccionado.fecha_prestamo
                                                ).substring(0, 10)
                                                : "—"
                                            }

                                        </strong>

                                    </div>

                                    <div className="col-md-6">

                                        <small className="text-muted d-block">
                                            Fecha límite
                                        </small>

                                        <strong>

                                            {prestamoSeleccionado.fecha_devolucion
                                                ? String(
                                                    prestamoSeleccionado.fecha_devolucion
                                                ).substring(0, 10)
                                                : "—"
                                            }

                                        </strong>

                                    </div>

                                </div>

                                <hr />

                                <div className="d-flex justify-content-between align-items-center mb-3">

                                    <div>

                                        <strong>
                                            Equipos del préstamo
                                        </strong>

                                        <div className="small text-muted">
                                            Selecciona los equipos que deseas devolver.
                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={seleccionarTodos}
                                        disabled={
                                            !prestamoSeleccionado.equipos?.length
                                        }
                                    >

                                        {equiposSeleccionados.length ===
                                            prestamoSeleccionado.equipos.length
                                            ? "Deseleccionar todos"
                                            : "Seleccionar todos"
                                        }

                                    </button>

                                </div>

                                {/* =========================================
                                    LISTA DE EQUIPOS
                                ========================================= */}

                                {prestamoSeleccionado.equipos?.map(
                                    (equipo, index) => {

                                        const numSerie =
                                            obtenerNumeroSerie(
                                                equipo
                                            )

                                        const nombreEquipo =
                                            obtenerNombreEquipo(
                                                equipo
                                            )

                                        const seleccionado =
                                            equiposSeleccionados.includes(
                                                numSerie
                                            )

                                        const datos =
                                            datosDevolucion[
                                            numSerie
                                            ] || {}

                                        return (

                                            <div
                                                key={
                                                    numSerie ||
                                                    `equipo-${index}`
                                                }
                                                className={`border rounded p-3 mb-3 ${
                                                    seleccionado
                                                        ? "border-success bg-light"
                                                        : ""
                                                }`}
                                            >

                                                <div className="d-flex align-items-start gap-3">

                                                    <div className="pt-1">

                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={
                                                                seleccionado
                                                            }
                                                            onChange={() => {

                                                                if (!numSerie) {

                                                                    Swal.fire({
                                                                        icon: "error",
                                                                        title: "Sin número de serie",
                                                                        text:
                                                                            "Este equipo no tiene un número de serie recibido desde el backend."
                                                                    })

                                                                    return
                                                                }

                                                                seleccionarEquipo(
                                                                    numSerie
                                                                )

                                                            }}
                                                            style={{
                                                                width: "20px",
                                                                height: "20px",
                                                                cursor: "pointer"
                                                            }}
                                                        />

                                                    </div>

                                                    <div className="flex-grow-1">

                                                        <div className="d-flex justify-content-between">

                                                            <div>

                                                                <strong>
                                                                    {nombreEquipo}
                                                                </strong>

                                                                <div className="small text-muted">

                                                                    Serie:

                                                                    {" "}

                                                                    {numSerie || (
                                                                        <span className="text-danger fw-bold">
                                                                            SIN NÚMERO DE SERIE
                                                                        </span>
                                                                    )}

                                                                </div>

                                                            </div>

                                                            {seleccionado && (

                                                                <span className="badge bg-success">
                                                                    Seleccionado
                                                                </span>

                                                            )}

                                                        </div>

                                                        {seleccionado && (

                                                            <div className="mt-3">

                                                                <div className="mb-2">

                                                                    <label className="form-label small fw-semibold">

                                                                        Descripción / Observaciones

                                                                    </label>

                                                                    <textarea
                                                                        className="form-control form-control-sm"
                                                                        rows="2"
                                                                        placeholder="Ej. Se entrega con una tecla dañada..."
                                                                        value={
                                                                            datos.observaciones ||
                                                                            ""
                                                                        }
                                                                        onChange={e =>
                                                                            cambiarObservacion(
                                                                                numSerie,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />

                                                                </div>

                                                                <div>

                                                                    <label className="form-label small fw-semibold">

                                                                        Evidencia fotográfica

                                                                    </label>

                                                                    <input
                                                                        type="file"
                                                                        className="form-control form-control-sm"
                                                                        accept="image/*"
                                                                        onChange={e =>
                                                                            cambiarImagen(
                                                                                numSerie,
                                                                                e.target.files[0]
                                                                            )
                                                                        }
                                                                    />

                                                                    {datos.evidencia && (

                                                                        <div className="small text-success mt-1">

                                                                            ✓{" "}

                                                                            {
                                                                                datos.evidencia.name
                                                                            }

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    }
                                )}

                            </div>

                            <div className="modal-footer d-flex justify-content-between">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cerrarPrestamo}
                                    disabled={guardando}
                                >
                                    Cerrar
                                </button>

                                <div className="d-flex gap-2">

                                    <button
                                        type="button"
                                        className="btn btn-outline-success"
                                        onClick={
                                            devolverSeleccionados
                                        }
                                        disabled={
                                            guardando ||
                                            equiposSeleccionados.length === 0
                                        }
                                    >

                                        {guardando
                                            ? "Procesando..."
                                            : `Devolver seleccionados (${equiposSeleccionados.length})`
                                        }

                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={devolverTodo}
                                        disabled={
                                            guardando ||
                                            !prestamoSeleccionado.equipos?.length
                                        }
                                    >
                                        Devolver todo
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                MODAL NUEVO PRÉSTAMO
            ================================================= */}

            {modalNuevo && (

                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                        zIndex: 1050
                    }}
                    onClick={() =>
                        !guardando &&
                        setModalNuevo(false)
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
                                    Registrar Préstamo
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        !guardando &&
                                        setModalNuevo(false)
                                    }
                                    disabled={guardando}
                                ></button>

                            </div>

                            <div className="modal-body">

                                <form
                                    onSubmit={e =>
                                        e.preventDefault()
                                    }
                                >

                                    {/* EQUIPOS */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Equipos ({numSeries.length} seleccionados)

                                        </label>

                                        <select
                                            className="form-select"
                                            value=""
                                            onChange={e =>
                                                handleSelectEquipo(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Seleccionar equipo...
                                            </option>

                                            {equiposDisponibles
                                                .filter(
                                                    e =>
                                                        !numSeries.includes(
                                                            obtenerNumeroSerie(e)
                                                        )
                                                )
                                                .map(e => {

                                                    const serie =
                                                        obtenerNumeroSerie(e)

                                                    const nombre =
                                                        obtenerNombreEquipo(e)

                                                    return (

                                                        <option
                                                            key={serie}
                                                            value={serie}
                                                        >

                                                            {nombre}

                                                            {" "}

                                                            ({serie})

                                                        </option>

                                                    )
                                                })
                                            }

                                        </select>

                                        {equiposDisponibles.length === 0 && (

                                            <div className="small text-danger mt-1">

                                                No hay equipos disponibles.

                                            </div>

                                        )}

                                        {numSeries.length > 0 && (

                                            <div className="mt-2">

                                                {numSeries.map(
                                                    serie => {

                                                        const equipo =
                                                            equiposDisponibles.find(
                                                                e =>
                                                                    obtenerNumeroSerie(e) ===
                                                                    serie
                                                            )

                                                        return (

                                                            <div
                                                                key={serie}
                                                                className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light"
                                                            >

                                                                <div>

                                                                    <strong>

                                                                        {
                                                                            obtenerNombreEquipo(
                                                                                equipo
                                                                            )
                                                                        }

                                                                    </strong>

                                                                    <div className="small text-muted">

                                                                        {serie}

                                                                    </div>

                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() =>
                                                                        setNumSeries(
                                                                            prev =>
                                                                                prev.filter(
                                                                                    s =>
                                                                                        s !==
                                                                                        serie
                                                                                )
                                                                        )
                                                                    }
                                                                    disabled={guardando}
                                                                >
                                                                    Quitar
                                                                </button>

                                                            </div>

                                                        )
                                                    }
                                                )}

                                            </div>

                                        )}

                                    </div>

                                    {/* USUARIO */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Usuario Destino
                                        </label>

                                        <select
                                            className="form-select"
                                            value={usuarioDestino}
                                            onChange={e =>
                                                handleSelectUsuario(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Seleccionar usuario...
                                            </option>

                                            {usuarios.map(u => (

                                                <option
                                                    key={u.usuario}
                                                    value={u.nombre}
                                                >

                                                    {u.nombre}

                                                    {u.area
                                                        ? ` (${u.area})`
                                                        : ""
                                                    }

                                                </option>

                                            ))}

                                        </select>

                                    </div>

                                    {/* ÁREA */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Área / Departamento
                                        </label>

                                        <select
                                            className="form-select"
                                            value={areaPrestamo}
                                            onChange={e =>
                                                setAreaPrestamo(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Seleccionar área...
                                            </option>

                                            {areas.map(a => (

                                                <option
                                                    key={a.area}
                                                    value={a.area}
                                                >
                                                    {a.area}
                                                </option>

                                            ))}

                                        </select>

                                    </div>

                                    {/* FECHAS */}

                                    <div className="row g-2 mb-3">

                                        <div className="col-6">

                                            <label className="form-label fw-semibold">
                                                Fecha Inicio
                                            </label>

                                            <input
                                                type="date"
                                                className="form-control"
                                                value={fechaInicio}
                                                min={toISODate(new Date())}
                                                onChange={e => {

                                                    setFechaInicio(
                                                        e.target.value
                                                    )

                                                    if (
                                                        fechaLimite <
                                                        e.target.value
                                                    ) {

                                                        setFechaLimite(
                                                            e.target.value
                                                        )

                                                    }

                                                }}
                                            />

                                        </div>

                                        <div className="col-6">

                                            <label className="form-label fw-semibold">
                                                Fecha Devolución
                                            </label>

                                            <input
                                                type="date"
                                                className="form-control"
                                                value={fechaLimite}
                                                min={fechaInicio}
                                                onChange={e =>
                                                    setFechaLimite(
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                    {/* OBSERVACIONES */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Observaciones
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={observaciones}
                                            onChange={e =>
                                                setObservaciones(
                                                    e.target.value
                                                )
                                            }
                                        ></textarea>

                                    </div>

                                    {/* CORREO */}

                                    <div className="form-check mb-2">

                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkCorreo"
                                            checked={enviarCorreo}
                                            onChange={e =>
                                                setEnviarCorreo(
                                                    e.target.checked
                                                )
                                            }
                                        />

                                        <label
                                            className="form-check-label small"
                                            htmlFor="checkCorreo"
                                        >

                                            Enviar recibo por correo electrónico al usuario

                                        </label>

                                        {enviarCorreo &&
                                            usuarioSeleccionadoObj?.correo && (

                                                <div className="small text-muted ps-1 mt-1">

                                                    Correo:

                                                    {" "}

                                                    <strong>
                                                        {
                                                            usuarioSeleccionadoObj.correo
                                                        }
                                                    </strong>

                                                </div>

                                            )}

                                    </div>

                                </form>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setModalNuevo(false)
                                    }
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={crearPrestamo}
                                    disabled={
                                        guardando ||
                                        numSeries.length === 0 ||
                                        !usuarioDestino
                                    }
                                >

                                    {guardando
                                        ? "Registrando..."
                                        : "Registrar Préstamo"
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    )
}

export default Prestamos