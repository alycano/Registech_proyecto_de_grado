























CREATE TABLE areas (
    area VARCHAR(100) PRIMARY KEY
);

CREATE TABLE estados_equipos (
    estado VARCHAR(50) PRIMARY KEY
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    correo VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    estado VARCHAR(15) NOT NULL,
    google_id VARCHAR(100) NULL,
    foto_url TEXT NULL
);

CREATE TABLE equipos (
    num_serie VARCHAR(50) PRIMARY KEY,
    equipo VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL,
    responsable VARCHAR(20) NULL,
    fecha_adquisicion DATE NOT NULL,
    fecha_asignacion DATE NOT NULL,
    fecha_baja DATE NULL
);

CREATE TABLE historial_mantenimientos (
    id_historial VARCHAR(100) PRIMARY KEY,
    num_serie VARCHAR(50) NOT NULL,
    fecha_reporte DATE NOT NULL,
    fecha_solucion DATE NULL,
    usuario_tecnico VARCHAR(20) NULL,
    falla TEXT NOT NULL,
    solucion TEXT NULL
);

CREATE TABLE prestamos (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    num_serie VARCHAR(50) NOT NULL,
    usuario_destino VARCHAR(50) NOT NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion DATE NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    observaciones TEXT NULL,
    FOREIGN KEY (num_serie) REFERENCES equipos(num_serie)
);

INSERT INTO areas (area) VALUES
('Tecnologia'),
('Recursos Humanos'),
('Soporte');

INSERT INTO estados_equipos (estado) VALUES
('Disponible'),
('Asignado'),
('En mantenimiento'),
('Baja'),
('Inactivo');

INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES
('admin', 'admin123', 'Administrador del Sistema', 'Tecnologia', 'admin@registech.com', 'activo'),
('rh', 'rh123', 'Gestion Recursos Humanos', 'Recursos Humanos', 'rh@registech.com', 'activo'),
('soporte', 'soporte123', 'Soporte Tecnico', 'Soporte', 'soporte@registech.com', 'activo');

INSERT INTO equipos (num_serie, equipo, area, descripcion, estado, responsable, fecha_adquisicion, fecha_asignacion, fecha_baja) VALUES
('EQ-S26-001', 'Portatil ASUS Zenbook S 16', 'Desarrollo', 'AMD Ryzen AI 9, 32GB RAM, 1TB SSD', 'Asignado', '1017244321', '2025-02-15', '2025-02-18', NULL),
('EQ-S26-002', 'Portatil MacBook Air 13 M3', 'Desarrollo', 'Chip M3, 16GB RAM, 512GB SSD, Gris Espacial', 'Asignado', '1035944112', '2025-03-01', '2025-03-03', NULL),
('EQ-S26-003', 'Portatil ASUS ROG Zephyrus G16', 'Desarrollo', 'Intel Core Ultra 9, 32GB RAM, RTX 4070', 'Asignado', '1152443901', '2025-05-10', '2025-05-12', NULL),
('EQ-S26-004', 'Servidor NAS Synology 4-Bay', 'Sistemas', 'Almacenamiento en red local para respaldos', 'Disponible', NULL, '2024-08-14', '2024-08-14', NULL),
('EQ-S26-005', 'Mini PC Minisforum UM780 XTX', 'Sistemas', 'AMD Ryzen 7 7840HS, 32GB RAM', 'Asignado', '98541223', '2024-11-05', '2024-11-06', NULL),
('EQ-S26-006', 'Portatil Dell Latitude 5440', 'Sistemas', 'Intel Core i5-1335U, 16GB RAM', 'Asignado', '1015443210', '2024-03-20', '2024-03-22', NULL),
('EQ-S26-007', 'Portatil Lenovo ThinkPad E14', 'Sistemas', 'AMD Ryzen 5 7530U, 16GB RAM', 'Disponible', NULL, '2024-06-15', '2024-06-15', NULL),
('EQ-S26-008', 'Servidor Rack Dell PowerEdge R760', 'Sistemas', '2x Intel Xeon Silver, 128GB RAM', 'Asignado', '43210987', '2025-01-15', '2025-01-20', NULL),
('EQ-S26-009', 'Router Cisco ISR 4331', 'Infraestructura', 'Router de servicios integrados', 'Baja', NULL, '2020-04-12', '2020-04-12', '2025-11-30'),
('EQ-S26-010', 'Switch Catalyst 2960-X', 'Infraestructura', 'Switch de 48 puertos Gigabit', 'Asignado', '71235489', '2021-06-18', '2021-06-19', NULL),
('EQ-S26-011', 'Firewall Fortinet FortiGate 60F', 'Infraestructura', 'Dispositivo de seguridad perimetral', 'Asignado', '71235489', '2023-09-02', '2023-09-02', NULL),
('EQ-S26-012', 'Access Point Aruba AP-515', 'Infraestructura', 'Punto de acceso inalambrico Wi-Fi 6', 'En mantenimiento', NULL, '2022-10-14', '2022-10-15', NULL),
('EQ-S26-013', 'Portatil Acer Nitro V15', 'Soporte', 'Intel Core i5, 16GB RAM, RTX 3050', 'Disponible', NULL, '2024-10-10', '2024-10-10', NULL),
('EQ-S26-014', 'Analizador de Red Fluke LinkRunner', 'Soporte', 'Probador de cables de red', 'Asignado', '1015344219', '2023-05-12', '2023-05-14', NULL),
('EQ-S26-015', 'Monitor Dell 27 UltraSharp', 'Diseno', 'Pantalla IPS 4K con 100% sRGB', 'Asignado', '1020355410', '2024-05-10', '2024-05-12', NULL),
('EQ-S26-016', 'Portatil Razer Blade 14', 'Diseno', 'AMD Ryzen 9, 32GB RAM, RTX 4070', 'Asignado', '1037654321', '2025-02-28', '2025-03-02', NULL),
('EQ-S26-017', 'Tableta Digitalizadora Wacom Intuos Pro L', 'Diseno', 'Superficie tactil con lapiz Pro Pen 2', 'Asignado', '1020355410', '2023-07-19', '2023-07-20', NULL),
('EQ-S26-018', 'Monitor LG UltraFine 32', 'Diseno', 'Monitor complementario vertical', 'Disponible', NULL, '2024-11-12', '2024-11-12', NULL),
('EQ-S26-019', 'Camara Sony Alpha a7 IV', 'Diseno', 'Camara Mirrorless para registro de eventos', 'Asignado', '1182345678', '2024-02-10', '2024-02-11', NULL),
('EQ-S26-020', 'Portatil Lenovo ThinkPad X1 Carbon', 'Administracion', 'Intel Core Ultra 7, 16GB RAM', 'Asignado', '98541223', '2025-01-20', '2025-01-22', NULL),
('EQ-S26-021', 'Portatil HP EliteBook 840 G10', 'Administracion', 'Intel Core i7-1355U, 16GB RAM', 'Asignado', '32145987', '2024-04-05', '2024-04-08', NULL),
('EQ-S26-022', 'Impresora HP LaserJet Pro M404dw', 'Administracion', 'Impresora laser monocromatica', 'Asignado', '32145987', '2023-11-05', '2023-11-06', NULL),
('EQ-S26-023', 'Escaner Fujitsu ScanSnap iX1600', 'Administracion', 'Escaner de documentos a doble cara', 'Disponible', NULL, '2023-08-22', '2023-08-22', NULL),
('EQ-S26-024', 'Portatil Dell Inspiron 14 Plus', 'Talento Humano', 'Intel Core Ultra 5, 16GB RAM', 'Asignado', '1014356789', '2025-04-18', '2025-04-20', NULL),
('EQ-S26-025', 'Destructora de Papel Rexel Optimum', 'Talento Humano', 'Trituradora de corte en particulas', 'Asignado', '1014356789', '2023-02-14', '2023-02-15', NULL),
('EQ-S26-026', 'Tablet Samsung Galaxy Tab S9', 'Ventas', 'Pantalla 11 pulgadas con S-Pen', 'Asignado', '71554128', '2024-02-28', '2024-03-02', NULL),
('EQ-S26-027', 'Tablet iPad Air 5ta Gen', 'Ventas', 'Apple M1, 64GB Wi-Fi', 'Asignado', '1023456781', '2023-10-11', '2023-10-12', NULL),
('EQ-S26-028', 'Portatil HP Pavilion Aero 13', 'Ventas', 'AMD Ryzen 7, 16GB RAM', 'En mantenimiento', '1045678912', '2025-01-08', '2025-01-10', NULL),
('EQ-S26-029', 'Portatil Asus Vivobook 16', 'Ventas', 'AMD Ryzen 5, 16GB RAM', 'Asignado', '1054321678', '2024-07-22', '2024-07-25', NULL),
('EQ-S26-030', 'Proyector Epson PowerLite X49', 'Ventas', 'Proyector de 3.600 lumenes', 'Disponible', NULL, '2023-06-05', '2023-06-05', NULL),
('EQ-S26-031', 'Diademas Poly Blackwire 3320', 'Call Center', 'Auriculares con microfono', 'Baja', '1015344219', '2023-01-15', '2023-01-16', '2024-06-20'),
('EQ-S26-032', 'Telefono IP Grandstream GRP2615', 'Call Center', 'Telefono IP ejecutivo con 5 lineas', 'Asignado', '1067891234', '2023-03-18', '2023-03-20', NULL),
('EQ-S26-033', 'Telefono IP Grandstream GRP2615', 'Call Center', 'Telefono IP ejecutivo con 5 lineas', 'Asignado', '1078912345', '2023-03-18', '2023-03-20', NULL),
('EQ-S26-034', 'Impresora Termica Zebra ZD220', 'Logistica', 'Impresora de etiquetas de codigo de barras', 'Asignado', '1089123456', '2024-01-30', '2024-02-01', NULL),
('EQ-S26-035', 'Lector de Codigo de Barras Honeywell', 'Logistica', 'Escaner de mano inalambrico', 'Asignado', '1089123456', '2024-01-30', '2024-02-01', NULL);
