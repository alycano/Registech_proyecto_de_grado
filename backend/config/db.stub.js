const bcrypt = require('bcryptjs')

const areas = [
  'Tecnologia', 'Recursos Humanos', 'Soporte'
].map((area) => ({ area }))

const estados_equipos = [
  'Disponible', 'Asignado', 'En mantenimiento', 'Baja', 'Inactivo'
].map((estado) => ({ estado }))

function crearUsuario(id, usuario, contrasena, nombre, area, correo) {
  return {
    id_usuario: id,
    usuario,
    nombre,
    correo,
    contrasena,
    contrasena_hash: bcrypt.hashSync(contrasena, 10),
    area,
    estado: 'activo',
    google_id: null,
    foto_url: null
  }
}

const usuarios = [
  crearUsuario(1, 'admin', 'admin123', 'Administrador del Sistema', 'Tecnologia', 'admin@registech.com'),
  crearUsuario(2, 'rh', 'rh123', 'Gestion Recursos Humanos', 'Recursos Humanos', 'rh@registech.com'),
  crearUsuario(3, 'soporte', 'soporte123', 'Soporte Tecnico', 'Soporte', 'soporte@registech.com')
]

const equipos = [
  { num_serie: 'EQ-S26-001', equipo: 'Portatil ASUS Zenbook S 16', area: 'Desarrollo', descripcion: 'AMD Ryzen AI 9, 32GB RAM, 1TB SSD', estado: 'Asignado', responsable: '1017244321', fecha_adquisicion: '2025-02-15', fecha_asignacion: '2025-02-18', fecha_baja: null },
  { num_serie: 'EQ-S26-004', equipo: 'Servidor NAS Synology 4-Bay', area: 'Sistemas', descripcion: 'Almacenamiento en red local', estado: 'Disponible', responsable: null, fecha_adquisicion: '2024-08-14', fecha_asignacion: '2024-08-14', fecha_baja: null },
  { num_serie: 'EQ-S26-007', equipo: 'Portatil Lenovo ThinkPad E14', area: 'Sistemas', descripcion: 'AMD Ryzen 5 7530U, 16GB RAM', estado: 'Disponible', responsable: null, fecha_adquisicion: '2024-06-15', fecha_asignacion: '2024-06-15', fecha_baja: null },
  { num_serie: 'EQ-S26-009', equipo: 'Router Cisco ISR 4331', area: 'Infraestructura', descripcion: 'Router de servicios integrados', estado: 'Baja', responsable: null, fecha_adquisicion: '2020-04-12', fecha_asignacion: '2020-04-12', fecha_baja: '2025-11-30' },
  { num_serie: 'EQ-S26-012', equipo: 'Access Point Aruba AP-515', area: 'Infraestructura', descripcion: 'Punto de acceso inalambrico Wi-Fi 6', estado: 'En mantenimiento', responsable: null, fecha_adquisicion: '2022-10-14', fecha_asignacion: '2022-10-15', fecha_baja: null },
  { num_serie: 'EQ-S26-013', equipo: 'Portatil Acer Nitro V15', area: 'Soporte', descripcion: 'Intel Core i5, 16GB RAM, RTX 3050', estado: 'Disponible', responsable: null, fecha_adquisicion: '2024-10-10', fecha_asignacion: '2024-10-10', fecha_baja: null }
]

const historial_mantenimientos = []
const prestamos = []

const tablas = {
  areas,
  estados_equipos,
  usuarios,
  equipos,
  historial_mantenimientos,
  prestamos
}

function splitTopLevel(texto, separador) {
  const partes = []
  let actual = ''
  let profundidad = 0
  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i]
    if (caracter === '(') profundidad++
    if (caracter === ')') profundidad--
    if (profundidad === 0 && texto.slice(i, i + separador.length) === separador) {
      partes.push(actual.trim())
      i += separador.length - 1
      actual = ''
      continue
    }
    actual += caracter
  }
  partes.push(actual.trim())
  return partes.filter((parte) => parte !== '')
}

function evaluarAtomo(atomo, fila, params) {
  atomo = atomo.trim().replace(/^\(|\)$/g, '').trim()

  if (atomo.includes(' OR ')) {
    return splitTopLevel(atomo, ' OR ').some((a) => evaluarAtomo(a, fila, params))
  }
  if (atomo.includes(' AND ')) {
    return splitTopLevel(atomo, ' AND ').every((a) => evaluarAtomo(a, fila, params))
  }

  let m = atomo.match(/^(\w+)\s+(IS\s+NOT\s+NULL|IS\s+NULL)$/i)
  if (m) {
    const columna = m[1]
    return m[2].toUpperCase().includes('NOT') ? fila[columna] != null : fila[columna] == null
  }

  m = atomo.match(/^(\w+)\s+BETWEEN\s+\?\s+AND\s+\?$/i)
  if (m) {
    const minimo = params.shift()
    const maximo = params.shift()
    return fila[m[1]] >= minimo && fila[m[1]] <= maximo
  }

  m = atomo.match(/^(\w+)\s*(=|!=|<>|<=|>=|<|>)\s*(.*)$/i)
  if (m) {
    const columna = m[1]
    const operador = m[2].toLowerCase()
    const valorRaw = m[3].trim()
    let valor
    if (valorRaw === '?') {
      valor = params.shift()
    } else if (valorRaw.startsWith('"') || valorRaw.startsWith("'")) {
      valor = valorRaw.slice(1, -1)
    } else {
      valor = Number(valorRaw)
      if (Number.isNaN(valor)) valor = valorRaw
    }

    if (valor === null) {
      if (operador === '=') return fila[columna] == null
      if (operador === '!=' || operador === '<>') return fila[columna] != null
      return false
    }

    const campo = fila[columna]
    switch (operador) {
      case '=': return campo == valor
      case '!=':
      case '<>': return campo != valor
      case '<': return campo < valor
      case '>': return campo > valor
      case '<=': return campo <= valor
      case '>=': return campo >= valor
      default: return false
    }
  }

  throw new Error('Condicion WHERE no soportada: ' + atomo)
}

function evaluarWhere(whereSql, filas, params) {
  if (!whereSql.trim()) return filas
  return filas.filter((fila) => evaluarAtomo(whereSql.trim(), fila, [...params]))
}

function ejecutarSelect(sql, params) {
  const fromMatch = sql.match(/FROM\s+(\w+)/i)
  if (!fromMatch) throw new Error('SELECT sin FROM: ' + sql)
  const tabla = fromMatch[1].toLowerCase()
  const columnas = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)/i)[1].trim()

  let whereSql = ''
  const whereMatch = sql.match(/WHERE\s+(.*)$/is)
  if (whereMatch) {
    const indiceOrder = whereMatch[1].toUpperCase().indexOf(' ORDER BY ')
    whereSql = indiceOrder >= 0 ? whereMatch[1].slice(0, indiceOrder) : whereMatch[1]
  }

  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i)

  let filas = evaluarWhere(whereSql, tablas[tabla] || [], params)

  if (orderMatch) {
    const columna = orderMatch[1]
    const direccion = (orderMatch[2] || 'ASC').toUpperCase()
    filas = [...filas].sort((a, b) => {
      const va = a[columna]
      const vb = b[columna]
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
      return direccion === 'DESC' ? -cmp : cmp
    })
  }

  if (columnas === '*') return filas

  const listaColumnas = columnas.split(',').map((c) => c.trim())
  return filas.map((fila) => {
    const resultado = {}
    listaColumnas.forEach((columna) => {
      resultado[columna] = fila[columna]
    })
    return resultado
  })
}

function ejecutarInsert(sql, params) {
  const m = sql.match(/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/is)
  if (!m) throw new Error('INSERT no soportado: ' + sql)

  const tabla = m[1].toLowerCase()
  const columnas = m[2].split(',').map((c) => c.trim())
  const valores = m[3].split(',').map((v) => v.trim())

  const fila = {}
  columnas.forEach((columna, i) => {
    fila[columna] = valores[i] === '?' ? params.shift() : valores[i].replace(/^["']|["']$/g, '')
  })

  const filas = tablas[tabla]
  if (tabla === 'usuarios') {
    fila.id_usuario = filas.reduce((max, f) => Math.max(max, Number(f.id_usuario) || 0), 0) + 1
  }
  if (tabla === 'prestamos') {
    fila.id_prestamo = filas.reduce((max, f) => Math.max(max, Number(f.id_prestamo) || 0), 0) + 1
  }
  filas.push(fila)

  return { affectedRows: 1, insertId: fila.id_usuario || fila.id_prestamo || Date.now() }
}

function ejecutarUpdate(sql, params) {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*))?$/is)
  if (!m) throw new Error('UPDATE no soportado: ' + sql)

  const tabla = m[1].toLowerCase()
  const setClause = m[2]
  const whereSql = m[3] ? m[3].trim() : ''

  const asignaciones = setClause.split(',').map((asignacion) => {
    const am = asignacion.match(/^(\w+)\s*=\s*(.*)$/)
    if (!am) throw new Error('Asignacion SET no soportada: ' + asignacion)
    const columna = am[1]
    const valorRaw = am[2].trim()
    let valor
    if (valorRaw === '?') {
      valor = params.shift()
    } else if (valorRaw.startsWith('"') || valorRaw.startsWith("'")) {
      valor = valorRaw.slice(1, -1)
    } else {
      valor = Number(valorRaw)
      if (Number.isNaN(valor)) valor = valorRaw
    }
    return [columna, valor]
  })

  const filas = tablas[tabla]
  const afectadas = evaluarWhere(whereSql, filas, params)
  afectadas.forEach((fila) => {
    asignaciones.forEach(([columna, valor]) => {
      fila[columna] = valor
    })
  })

  return { affectedRows: afectadas.length }
}

function ejecutarDelete(sql, params) {
  const m = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?$/is)
  if (!m) throw new Error('DELETE no soportado: ' + sql)

  const tabla = m[1].toLowerCase()
  const whereSql = m[2] ? m[2].trim() : ''

  const filas = tablas[tabla]
  const aEliminar = whereSql
    ? filas.filter((fila) => evaluarAtomo(whereSql, fila, [...params]))
    : [...filas]

  aEliminar.forEach((fila) => {
    filas.splice(filas.indexOf(fila), 1)
  })

  return { affectedRows: aEliminar.length }
}

function query(sql, paramsOrCallback, maybeCallback) {
  let params = []
  let callback = paramsOrCallback
  if (typeof paramsOrCallback === 'function') {
    callback = paramsOrCallback
  } else {
    params = paramsOrCallback || []
    callback = maybeCallback
  }

  try {
    const tipo = sql.trim().match(/^(\w+)/i)[1].toLowerCase()
    let resultado
    switch (tipo) {
      case 'select': resultado = ejecutarSelect(sql, params); break
      case 'insert': resultado = ejecutarInsert(sql, params); break
      case 'update': resultado = ejecutarUpdate(sql, params); break
      case 'delete': resultado = ejecutarDelete(sql, params); break
      default: throw new Error('Operacion no soportada: ' + tipo)
    }
    callback(null, resultado)
  } catch (err) {
    callback(err, null)
  }
}

function getConnection(cb) {
  cb(null, { query, beginTransaction, commit, rollback, release: () => {} })
}
function beginTransaction(callback) { callback(null) }
function commit(callback) { callback(null) }
function rollback(callback) { callback(null) }

module.exports = { query, getConnection, beginTransaction, commit, rollback }
