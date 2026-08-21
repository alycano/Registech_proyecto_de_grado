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
    GOOGLE_LOGIN: `${BASE_URL}/auth/google`,
    EQUIPOS: `${BASE_URL}/equipos`,
    ESTADOS_EQUIPO: `${BASE_URL}/estados_equipo`,
    ASIGNAR_USUARIO: `${BASE_URL}/equipos/asignacion`,
    REPORTE_FALLA: `${BASE_URL}/equipos/reporte/add`,
    OBTENER_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte`,
    ACTUALIZAR_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte/solucion`,
    MANTENIMIENTOS_FIND: `${BASE_URL}/equipos/mantenimientos/find`,
    OBTENER_USUARIOS: `${BASE_URL}/usuarios`,
    CREAR_USUARIO: `${BASE_URL}/usuarios`,
    ACTUALIZAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    ELIMINAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    OBTENER_AREAS: `${BASE_URL}/areas`,
    PRESTAMOS: `${BASE_URL}/prestamos`,
    PRESTAMOS_ACTIVOS: `${BASE_URL}/prestamos/activos`,
    CREAR_PRESTAMO: `${BASE_URL}/prestamos`,
    DEVOLVER_PRESTAMO: (id) => `${BASE_URL}/prestamos/${id}/devolver`,
    HISTORIAL_EQUIPO: (num_serie) => `${BASE_URL}/prestamos/historial/${num_serie}`,
    ESTADISTICAS: `${BASE_URL}/estadisticas`,
}
