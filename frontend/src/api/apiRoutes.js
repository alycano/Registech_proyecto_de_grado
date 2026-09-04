import axios from 'axios'

axios.defaults.withCredentials = true

function getCsrfToken() {
    return localStorage.getItem('csrf_token')
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
}

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    const method = config.method?.toUpperCase()
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
        const csrf = getCsrfToken() || getCookie('csrf_token')
        if (csrf) {
            config.headers['X-CSRF-Token'] = csrf
        }
    }

    return config
})

axios.interceptors.response.use(
    (response) => {
        const newCsrf = response.data?.csrf_token
        if (newCsrf) {
            localStorage.setItem('csrf_token', newCsrf)
        }
        const newToken = response.headers['x-refresh-token']
        if (newToken) {
            localStorage.setItem('token', newToken)
        }
        return response
    },
    (error) => {
        const url = error?.config?.url || ''
        const esLogin = url.includes('/login') || url.includes('/solicitar-recuperacion') || url.includes('/restablecer-password')
        if (error.response) {
            if (error.response.status === 401 && !esLogin) {
                localStorage.removeItem('token')
                localStorage.removeItem('usuario')
                localStorage.removeItem('csrf_token')
                window.location.href = '/login'
            }
            if (error.response.status === 403 && error.response.data?.error?.includes('CSRF')) {
                localStorage.removeItem('csrf_token')
                window.location.href = '/login'
            }
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
    LIBERAR_EQUIPO: (numSerie) => `${BASE_URL}/equipos/${encodeURIComponent(numSerie)}/liberar`,
    REPORTE_FALLA: `${BASE_URL}/equipos/reporte/add`,
    OBTENER_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte`,
    HISTORIAL_MANTENIMIENTOS: `${BASE_URL}/equipos/mantenimientos`,
    ACTUALIZAR_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte/solucion`,
    MANTENIMIENTOS_FIND: `${BASE_URL}/equipos/mantenimientos/find`,
    OBTENER_USUARIOS: `${BASE_URL}/usuarios`,
    CREAR_USUARIO: `${BASE_URL}/usuarios`,
    ACTUALIZAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    ELIMINAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    VERIFICAR_ELIMINACION: (usuario) =>
    `${BASE_URL}/usuarios/${usuario}/verificar-eliminacion`,
    OBTENER_AREAS: `${BASE_URL}/areas`,
    CREAR_AREA: `${BASE_URL}/areas`,
    ACTUALIZAR_AREA: (area) => `${BASE_URL}/areas/${encodeURIComponent(area)}`,
    ELIMINAR_AREA: (area) => `${BASE_URL}/areas/${encodeURIComponent(area)}`,
    CAMBIAR_PASSWORD: `${BASE_URL}/usuarios/cambiar-password`,
    PRESTAMOS: `${BASE_URL}/prestamos`,
    PRESTAMOS_ACTIVOS: `${BASE_URL}/prestamos/activos`,
    PRESTAMOS_ACTIVOS_POR_EQUIPO: (num_serie) => `${BASE_URL}/prestamos/activos/${encodeURIComponent(num_serie)}`,
    CREAR_PRESTAMO: `${BASE_URL}/prestamos`,
   DEVOLVER_EQUIPO: (id, num_serie) =>
    `${BASE_URL}/prestamos/${id}/equipos/${encodeURIComponent(num_serie)}/devolver`,
    HISTORIAL_EQUIPO: (num_serie) =>
    `${BASE_URL}/equipos/${encodeURIComponent(num_serie)}/historial`,
    ESTADISTICAS: `${BASE_URL}/estadisticas`,
    DASHBOARD: `${BASE_URL}/dashboard`,
    EXPORTAR_EQUIPOS: `${BASE_URL}/dashboard/exportar-equipos`,
    ACTIVIDAD: `${BASE_URL}/actividad`,
    SOLICITUDES: `${BASE_URL}/solicitudes`,
    MIS_SOLICITUDES: `${BASE_URL}/solicitudes/mis`,
    RESPONDER_SOLICITUD: (id) => `${BASE_URL}/solicitudes/${id}/responder`,
    PMC: `${BASE_URL}/pmc`,
    PMC_ENTREGAR: (id) => `${BASE_URL}/pmc/${id}/entregar`,
    PMC_DEVOLVER: (id) => `${BASE_URL}/pmc/${id}/devolver`,
    APROBACION_ORDEN: `${BASE_URL}/equipos/reporte/aprobacion`,
   NOTIFICACIONES: `${BASE_URL}/notificaciones`,
NOTIFICACIONES_NO_LEIDAS: `${BASE_URL}/notificaciones/no-leidas`,
MARCAR_NOTIFICACION_LEIDA: (id) => `${BASE_URL}/notificaciones/${id}/leida`,
MARCAR_NOTIFICACIONES_LEIDAS: `${BASE_URL}/notificaciones/leidas/todas`,
}
