import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Reportes = ({ usuario }) => {
    const esAdmin = usuario?.rol === 'admin'

    const [conteos, setConteos] = useState({})
    const [descargando, setDescargando] = useState('')

    useEffect(() => {
        const peticiones = [
            axios.get(API_ROUTES.EQUIPOS).then(res => setConteos(c => ({ ...c, equipos: res.data.length }))).catch(() => {}),
            axios.get(API_ROUTES.PRESTAMOS).then(res => setConteos(c => ({ ...c, prestamos: res.data.length }))).catch(() => {}),
            axios.get(API_ROUTES.OBTENER_USUARIOS).then(res => setConteos(c => ({ ...c, usuarios: res.data.length }))).catch(() => {})
        ]
        if (esAdmin) {
            peticiones.push(
                axios.get(API_ROUTES.HISTORIAL_MANTENIMIENTOS).then(res => setConteos(c => ({ ...c, mantenimientos: res.data.length }))).catch(() => {})
            )
        }
        Promise.all(peticiones)
    }, [esAdmin])

    const descargarEquipos = () => {
        setDescargando('equipos')
        axios.get(API_ROUTES.EXPORTAR_EQUIPOS, { responseType: 'blob' })
            .then(res => {
                const url = URL.createObjectURL(res.data)
                const link = document.createElement('a')
                link.href = url
                link.download = `inventario_equipos_${new Date().toISOString().slice(0, 10)}.xlsx`
                link.click()
                URL.revokeObjectURL(url)
            })
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el reporte de equipos' })
            })
            .finally(() => setDescargando(''))
    }

    const descargarExcel = (nombreArchivo, cabecera, filas) => {
        const escapar = (v) => String(v ?? '')
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<?mso-application progid="Excel.Sheet"?>\n'
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
        xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
        xml += '  <Styles>\n'
        xml += '    <Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/></Style>\n'
        xml += '  </Styles>\n'
        xml += '  <Worksheet ss:Name="Hoja1">\n'
        xml += '    <Table>\n'
        xml += '      <Row>\n'
        cabecera.forEach(h => { xml += `        <Cell ss:StyleID="hdr"><Data ss:Type="String">${escapar(h)}</Data></Cell>\n` })
        xml += '      </Row>\n'
        filas.forEach(fila => {
            xml += '      <Row>\n'
            fila.forEach(v => { xml += `        <Cell><Data ss:Type="String">${escapar(v)}</Data></Cell>\n` })
            xml += '      </Row>\n'
        })
        xml += '    </Table>\n  </Worksheet>\n</Workbook>'
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = nombreArchivo
        link.click()
        URL.revokeObjectURL(url)
    }

    const descargarPrestamos = () => {
        setDescargando('prestamos')
        axios.get(API_ROUTES.PRESTAMOS)
            .then(res => {
                descargarExcel(
                    `prestamos_${new Date().toISOString().slice(0, 10)}.xls`,
                    ['ID Prestamo', 'Num Serie', 'Equipo', 'Usuario Destino', 'Area', 'Fecha Inicio', 'Fecha Limite/Devolucion', 'Estado', 'Observaciones'],
                    res.data.map(p => [
                        p.id_prestamo, p.num_serie, p.equipo || '', p.usuario_destino,
                        p.area || '', String(p.fecha_prestamo || '').slice(0, 10),
                        String(p.fecha_devolucion || '').slice(0, 10), p.estado, p.observaciones || ''
                    ])
                )
                if (res.data.length === 0) {
                    Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay prestamos registrados todavia' })
                }
            })
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el reporte de prestamos' })
            })
            .finally(() => setDescargando(''))
    }

    const descargarMantenimientos = () => {
        setDescargando('mantenimientos')
        axios.get(API_ROUTES.HISTORIAL_MANTENIMIENTOS)
            .then(res => {
                descargarExcel(
                    `mantenimientos_${new Date().toISOString().slice(0, 10)}.xls`,
                    ['ID Orden', 'Num Serie', 'Equipo', 'Falla', 'Estado Orden', 'Aprobada Por', 'Fecha Aprobacion', 'Tecnico', 'Solucion', 'Fecha Reporte', 'Fecha Solucion'],
                    res.data.map(m => [
                        m.id_historial, m.num_serie, m.equipo || '', m.falla, m.estado_orden,
                        m.aprobada_por || '',
                        m.fecha_aprobacion ? String(m.fecha_aprobacion).slice(0, 10) : '',
                        m.usuario_tecnico || '', m.solucion || '',
                        String(m.fecha_reporte || '').slice(0, 10),
                        m.fecha_solucion ? String(m.fecha_solucion).slice(0, 10) : ''
                    ])
                )
            })
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el reporte de mantenimientos' })
            })
            .finally(() => setDescargando(''))
    }

    const descargarUsuarios = () => {
        setDescargando('usuarios')
        axios.get(API_ROUTES.OBTENER_USUARIOS)
            .then(res => {
                descargarExcel(
                    `usuarios_${new Date().toISOString().slice(0, 10)}.xls`,
                    ['Usuario', 'Nombre', 'Correo', 'Area', 'Estado'],
                    res.data.map(u => [u.usuario, u.nombre, u.correo, u.area || '', u.estado || ''])
                )
            })
            .catch(() => {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el reporte de usuarios' })
            })
            .finally(() => setDescargando(''))
    }

    const tarjetas = [
        {
            id: 'equipos',
            icono: 'bi-pc-display',
            titulo: 'Inventario de Equipos',
            descripcion: 'Todos los equipos con su estado, area y responsable.',
            registros: conteos.equipos,
            accion: descargarEquipos
        },
        {
            id: 'prestamos',
            icono: 'bi-arrow-left-right',
            titulo: 'Prestamos',
            descripcion: 'Historial completo de prestamos con fechas y estados.',
            registros: conteos.prestamos,
            accion: descargarPrestamos
        },
        ...(esAdmin ? [{
            id: 'mantenimientos',
            icono: 'bi-tools',
            titulo: 'Mantenimientos',
            descripcion: 'Ordenes de trabajo, aprobaciones y soluciones aplicadas.',
            registros: conteos.mantenimientos,
            accion: descargarMantenimientos
        }] : []),
        {
            id: 'usuarios',
            icono: 'bi-people',
            titulo: 'Usuarios',
            descripcion: 'Listado de cuentas con su departamento (sin contrasenas).',
            registros: conteos.usuarios,
            accion: descargarUsuarios
        }
    ]

    return (
        <div>
            <div className="module-header">
                <h2 className="module-title mb-0">
                    Reportes
                </h2>
                <span className="badge bg-primary-subtle text-primary-emphasis">
                    Exportación en formato Excel
                </span>
            </div>

            <div className="row g-3">
                {tarjetas.map(t => (
                    <div className="col-md-6" key={t.id}>
                        <div className="card border shadow-sm h-100">
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="kpi-icon kpi-icon--primario">
                                        <i className={`bi ${t.icono}`}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">{t.titulo}</h6>
                                        <small className="text-secondary">
                                            {t.registros === undefined ? '...' : `${t.registros} registro${t.registros === 1 ? '' : 's'}`}
                                        </small>
                                    </div>
                                </div>

                                <p className="text-secondary small mb-3">{t.descripcion}</p>

                                <button
                                    className="btn btn-sm btn-primary align-self-start mt-auto"
                                    onClick={t.accion}
                                    disabled={descargando !== ''}
                                >
                                    {descargando === t.id ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-download me-1"></i>
                                            Descargar Excel
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Reportes
