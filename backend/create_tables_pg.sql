CREATE TABLE IF NOT EXISTS areas (
    area VARCHAR(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS estados_equipos (
    estado VARCHAR(50) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    correo VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    estado VARCHAR(15) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipos (
    num_serie VARCHAR(50) PRIMARY KEY,
    equipo VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    descripcion TEXT,
    sistema_operativo VARCHAR(60) NULL,
    imagen VARCHAR(255) NULL,
    estado VARCHAR(50) NOT NULL,
    responsable VARCHAR(100) NULL,
    fecha_adquisicion DATE NOT NULL,
    fecha_asignacion DATE NULL,
    fecha_baja DATE NULL
);

CREATE TABLE IF NOT EXISTS historial_mantenimientos (
    id_historial VARCHAR(100) PRIMARY KEY,
    num_serie VARCHAR(50) NOT NULL,
    fecha_reporte DATE NOT NULL,
    fecha_solucion DATE NULL,
    usuario_tecnico VARCHAR(20) NULL,
    falla TEXT NOT NULL,
    solucion TEXT NULL,
    evidencia VARCHAR(255) NULL,
    estado_orden VARCHAR(20) NOT NULL DEFAULT 'aprobada',
    aprobada_por VARCHAR(50) NULL,
    fecha_aprobacion DATE NULL
);

CREATE TABLE IF NOT EXISTS prestamos (
    id_prestamo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_serie VARCHAR(50) NOT NULL,
    usuario_destino VARCHAR(50) NOT NULL,
    area VARCHAR(100) NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion DATE NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    observaciones TEXT NULL,
    FOREIGN KEY (num_serie) REFERENCES equipos(num_serie)
);

CREATE TABLE IF NOT EXISTS reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (usuario) REFERENCES usuarios(usuario)
);

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(50) NOT NULL,
    accion VARCHAR(500) NOT NULL,
    fecha TIMESTAMP DEFAULT NOW()
);

INSERT INTO areas (area) VALUES
('Tecnologia'),
('Recursos Humanos'),
('Soporte')
ON CONFLICT (area) DO NOTHING;

INSERT INTO estados_equipos (estado) VALUES
('Disponible'),
('Asignado'),
('En mantenimiento'),
('Baja'),
('Inactivo')
ON CONFLICT (estado) DO NOTHING;

INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES
('admin', 'admin123', 'Administrador del Sistema', 'Tecnologia', 'admin@registech.com', 'activo'),
('rh', 'rh123', 'Gestion Recursos Humanos', 'Recursos Humanos', 'rh@registech.com', 'activo'),
('soporte', 'soporte123', 'Soporte Tecnico', 'Soporte', 'soporte@registech.com', 'activo')
ON CONFLICT (usuario) DO NOTHING;

INSERT INTO equipos (num_serie, equipo, area, descripcion, estado, responsable, fecha_adquisicion, fecha_asignacion, fecha_baja) VALUES
('EQ-S26-001', 'Portatil ASUS Zenbook S 16', 'Tecnologia', 'AMD Ryzen AI 9, 32GB RAM, 1TB SSD', 'Asignado', '1017244321', '2025-02-15', '2025-02-18', NULL),
('EQ-S26-004', 'Servidor NAS Synology 4-Bay', 'Tecnologia', 'Almacenamiento en red local para respaldos', 'Disponible', NULL, '2024-08-14', '2024-08-14', NULL),
('EQ-S26-007', 'Portatil Lenovo ThinkPad E14', 'Tecnologia', 'AMD Ryzen 5 7530U, 16GB RAM', 'Disponible', NULL, '2024-06-15', '2024-06-15', NULL),
('EQ-S26-009', 'Router Cisco ISR 4331', 'Tecnologia', 'Router de servicios integrados', 'Baja', NULL, '2020-04-12', '2020-04-12', '2025-11-30'),
('EQ-S26-012', 'Access Point Aruba AP-515', 'Tecnologia', 'Punto de acceso inalambrico Wi-Fi 6', 'En mantenimiento', NULL, '2022-10-14', '2022-10-15', NULL),
('EQ-S26-013', 'Portatil Acer Nitro V15', 'Soporte', 'Intel Core i5, 16GB RAM, RTX 3050', 'Disponible', NULL, '2024-10-10', '2024-10-10', NULL),
('EQ-S26-014', 'Analizador de Red Fluke LinkRunner', 'Soporte', 'Probador de cables de red', 'Asignado', '1015344219', '2023-05-12', '2023-05-14', NULL),
('EQ-S26-024', 'Portatil Dell Inspiron 14 Plus', 'Recursos Humanos', 'Intel Core Ultra 5, 16GB RAM', 'Asignado', '1014356789', '2025-04-18', '2025-04-20', NULL)
ON CONFLICT (num_serie) DO NOTHING;
