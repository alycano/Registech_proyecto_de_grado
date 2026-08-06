const BASE_URL = 'http://localhost:3000/api'

export const API_ROUTES = {
    LOGIN: `${BASE_URL}/login`,
    EQUIPOS: `${BASE_URL}/equipos`,
    ESTADOS_EQUIPO: `${BASE_URL}/estados_equipo`,
    ASIGNAR_USUARIO: `${BASE_URL}/equipos/asignacion`,
    REPORTE_FALLA: `${BASE_URL}/equipos/reporte/add`,
    OBTENER_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte`,
    ACTUALIZAR_MANTENIMIENTOS: `${BASE_URL}/equipos/reporte/solucion`,
    MANTENIMIENTOS_FIND: `${BASE_URL}/equipos/mantenimientos/find`,
    OBTENER_PRODUCTOS: `${BASE_URL}/productos`,
    CREAR_PRODUCTO: `${BASE_URL}/productos`,
    ACTUALIZAR_PRODUCTO: (codigo) => `${BASE_URL}/productos/${codigo}`,
    ELIMINAR_PRODUCTO: (codigo) => `${BASE_URL}/productos/${codigo}`,
    OBTENER_PRODUCTO_POR_CODIGO: (codigo) => `${BASE_URL}/producto?codigo=${codigo}`,
    OBTENER_VENTAS: `${BASE_URL}/ventas`,
    REGISTRAR_VENTA: `${BASE_URL}/ventas`,
    OBTENER_USUARIOS: `${BASE_URL}/usuarios`,
    CREAR_USUARIO: `${BASE_URL}/usuarios`,
    ACTUALIZAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    ELIMINAR_USUARIO: (usuario) => `${BASE_URL}/usuarios/${usuario}`,
    OBTENER_AREAS: `${BASE_URL}/areas`,
}
