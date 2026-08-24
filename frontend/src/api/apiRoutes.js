import axios from 'axios'

axios.defaults.withCredentials = true

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('usuario')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const API_ROUTES = {
    LOGIN: `${BASE_URL}/login`,
    SOLICITAR_RECUPERACION: `${BASE_URL}/usuarios/solicitar-recuperacion`,
    RESTABLECER_PASSWORD: `${BASE_URL}/usuarios/restablecer-password`,
    EQUIPOS: `${BASE_URL}/equipos`,
    CREAR_EQUIPO: `${BASE_URL}/equipos/add`,
    ARCHIVO_EVIDENCIA: (nombre) => `${BASE_URL.replace('/api', '')}/uploads/${nombre}`,
    ESTADOS_EQUIPO: `${BASE_URL}/estados_equipo`,
    ASIGNAR_USUARIO: `${BASE_URL}/equipos/asignacion`,
    REPORTE_FALLA: `${BASE_URL}/equipos/reporte/add`,
    OBTENER_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte`,
    HISTORIAL_MANTENIMIENTOS: `${BASE_URL}/equipos/mantenimientos`,
    ACTUALIZAR_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte/solucion`,
    MANTENIMIENTOS_FIND: `${BASE_URL}/equipos/mantenimientos/find`,
    OBTENER_USUARIOS: `${BASE_URL}/usuarios`,
    CREAR_USUARIO: `${BASE_URL}/usuarios`,
    ACTUALIZAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    ELIMINAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    OBTENER_AREAS: `${BASE_URL}/areas`,
    CREAR_AREA: `${BASE_URL}/areas`,
    ACTUALIZAR_AREA: (area) => `${BASE_URL}/areas/${encodeURIComponent(area)}`,
    ELIMINAR_AREA: (area) => `${BASE_URL}/areas/${encodeURIComponent(area)}`,
    CAMBIAR_PASSWORD: `${BASE_URL}/usuarios/cambiar-password`,
    PRESTAMOS: `${BASE_URL}/prestamos`,
    PRESTAMOS_ACTIVOS: `${BASE_URL}/prestamos/activos`,
    CREAR_PRESTAMO: `${BASE_URL}/prestamos`,
    DEVOLVER_PRESTAMO: (id) => `${BASE_URL}/prestamos/${id}/devolver`,
    HISTORIAL_EQUIPO: (num_serie) => `${BASE_URL}/prestamos/historial/${num_serie}`,
    ESTADISTICAS: `${BASE_URL}/estadisticas`,
    DASHBOARD: `${BASE_URL}/dashboard`,
    EXPORTAR_EQUIPOS: `${BASE_URL}/dashboard/exportar-equipos`,
    ACTIVIDAD: `${BASE_URL}/actividad`,
    SOLICITUDES: `${BASE_URL}/solicitudes`,
    MIS_SOLICITUDES: `${BASE_URL}/solicitudes/mis`,
    RESponder_SOLICITUD: (id) => `${BASE_URL}/solicitudes/${id}/responder`,
}
