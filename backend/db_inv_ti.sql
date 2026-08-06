create table areas(
    area varchar(100) primary key
);

create table estados_equipos(
    estado varchar(50) primary key
);

create table usuarios(
    id_usuario serial primary key,
    usuario varchar(50) not null unique,
    nombre varchar(200) not null,
    correo varchar(50) not null unique,
    contrasena varchar(100) not null,
    area varchar(100) not null,
    estado varchar(15) not null
);

create table equipos(
    num_serie varchar(50) primary key,
    equipo varchar(100) not null,
    area varchar(100) not null,
    descripcion text,
    estado varchar(50) not null,
    responsable varchar(20) null,
    fecha_adquisicion date not null,
    fecha_asignacion date not null,
    fecha_baja date null
);

create table historial_mantenimientos(
    id_historial varchar(100) primary key,
    num_serie varchar(50) not null,
    fecha_reporte date not null,
    fecha_solucion date null,
    usuario_tecnico varchar(20) null,
    falla text not null,
    solucion text null
);

create table productos(
    codigo varchar(50) primary key,
    nom_producto varchar(100) not null,
    desc_producto text not null,
    pre_publico numeric not null,
    pre_proveedor numeric not null,
    existencias int not null
);

create table ventas(
    id_venta varchar(150) primary key,
    productos text not null,
    total_venta numeric not null,
    fecha_venta date not null,
    vendedor varchar(20) not null
);

insert into areas (area) values
('Tecnologia'),
('Administración'),
('Recursos Humanos'),
('Fianzas'),
('Soporte'),
('Almacen'),
('Ventas');

INSERT INTO productos (codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES
('HOG-001', 'Cobija Térmica Flanela Finlandek', 'Cobija térmica para cama doble, color gris, 100% poliéster', 69900, 45000, 45),
('HOG-002', 'Sartén Antiadherente Imusa Talent 24cm', 'Sartén de aluminio con antiadherente de alta duración Triforce', 54900, 36000, 120),
('HOG-003', 'Juego de Vasos de Vidrio x6 Finlandek', 'Set de 6 vasos de vidrio templado de 12 onzas para uso diario', 24900, 15000, 85),
('HOG-004', 'Almohada Siliconada Confort Finlandek', 'Almohada con relleno de fibra siliconada y forro de microfibra', 32900, 20000, 150),
('HOG-005', 'Licuadora Oster Monterrey 2 Velocidades', 'Licuadora con jarra de vidrio de 1.25 litros y acople metálico', 189900, 135000, 30),
('HOG-006', 'Set de Cubiertos x24 Tramontina Dynamic', 'Juego de cubiertos con mango de madera rústica y hojas de acero', 79900, 52000, 60),
('HOG-007', 'Toalla de Baño Cuerpo Cuerpo Cannon', 'Toalla unicolor de algodón de 400g de alta absorción', 36900, 24000, 200),
('HOG-008', 'Olla a Presión Imusa Secury 4.5L', 'Olla de presión en aluminio con sistema de seguridad integrado', 149900, 105000, 40),
('HOG-009', 'Cesta Organizadora Plástica Ekono', 'Canastilla organizadora mediana de plástico perforado color blanco', 12900, 7500, 310),
('HOG-010', 'Tendedero de Ropa Plegable Metálico', 'Tendedero extensible de piso con recubrimiento antioxidante', 89900, 58000, 25),
('HOG-011', 'Juego de Sábanas Doble Finlandek', 'Set de sábanas microfibra de 140x190cm, incluye 2 fundas', 59900, 38000, 75),
('HOG-012', 'Vajilla Cerámica x16 Piezas Corona', 'Juego de vajilla redonda para 4 personas, color blanco liso', 124900, 85000, 18),
('HOG-013', 'Cafetera Goteo Kalley 4-6 Tazas', 'Cafetera eléctrica con filtro lavable y jarra de vidrio', 74900, 49000, 55),
('HOG-014', 'Bandeja de Bambú Multiusos Hogar', 'Bandeja organizadora de madera de bambú con asas laterales', 42900, 27000, 40),
('HOG-015', 'Sanduchera Eléctrica Universal', 'Sanduchera con placas antiadherentes y luces indicadoras', 69900, 46000, 90),
('HOG-016', 'Basurera con Pedal Plástica 12L Vaivén', 'Caneca para basura de pedal, ideal para cocina o baño', 34900, 21000, 110),
('HOG-017', 'Set de Recipientes Herméticos x5 Hermetix', 'Juego de refractarias plásticas cuadradas aptas para microondas', 29900, 18500, 140),
('HOG-018', 'Espejo de Pared Decorativo Finlandek', 'Espejo con marco plástico negro de 30x40cm para habitación', 24900, 14000, 65),
('HOG-019', 'Plancha a Vapor Samurai Easygliss', 'Plancha de ropa con suela cerámica y sistema antigoteo', 139900, 95000, 35),
('HOG-020', 'Freidora de Aire Digital Kalley 3.5L', 'Airfryer con panel táctil y canasta antiadherente removible', 249900, 175000, 28);

insert into estados_equipos (estado) values
('Activo'),
('En mantenimiento'),
('Baja'),
('Inactivo'),
('Reservado');

INSERT INTO equipos (num_serie, equipo, area, descripcion, estado, responsable, fecha_adquisicion, fecha_asignacion, fecha_baja) VALUES
('EQ-S26-001', 'Portátil ASUS Zenbook S 16', 'Desarrollo', 'AMD Ryzen AI 9, 32GB RAM, 1TB SSD', 'Asignado', '1017244321', '2025-02-15', '2025-02-18', NULL),
('EQ-S26-002', 'Portátil MacBook Air 13 M3', 'Desarrollo', 'Chip M3, 16GB RAM, 512GB SSD, Gris Espacial', 'Asignado', '1035944112', '2025-03-01', '2025-03-03', NULL),
('EQ-S26-003', 'Portátil ASUS ROG Zephyrus G16', 'Desarrollo', 'Intel Core Ultra 9, 32GB RAM, RTX 4070, Enfoque compilación pesada', 'Asignado', '1152443901', '2025-05-10', '2025-05-12', NULL),
('EQ-S26-004', 'Servidor NAS Synology 4-Bay', 'Sistemas', 'Almacenamiento en red local para respaldos internos', 'Disponible', NULL, '2024-08-14', '2024-08-14', NULL),
('EQ-S26-005', 'Mini PC Minisforum UM780 XTX', 'Sistemas', 'AMD Ryzen 7 7840HS, 32GB RAM, Estación de monitoreo', 'Asignado', '98541223', '2024-11-05', '2024-11-06', NULL),
('EQ-S26-006', 'Portátil Dell Latitude 5440', 'Sistemas', 'Intel Core i5-1335U, 16GB RAM, 512GB SSD. Uso TI Soporte', 'Asignado', '1015443210', '2024-03-20', '2024-03-22', NULL),
('EQ-S26-007', 'Portátil Lenovo ThinkPad E14', 'Sistemas', 'AMD Ryzen 5 7530U, 16GB RAM. Equipo de contingencia para ingeniería', 'Disponible', NULL, '2024-06-15', '2024-06-15', NULL),
('EQ-S26-008', 'Servidor Rack Dell PowerEdge R760', 'Sistemas', '2x Intel Xeon Silver, 128GB RAM, 4TB SAS para base de datos local', 'Asignado', '43210987', '2025-01-15', '2025-01-20', NULL),
('EQ-S26-009', 'Router Cisco ISR 4331', 'Infraestructura', 'Router de servicios integrados para la red principal de la sede', 'Baja', NULL, '2020-04-12', '2020-04-12', '2025-11-30'),
('EQ-S26-010', 'Switch Catalyst 2960-X', 'Infraestructura', 'Switch de 48 puertos Gigabit PoE+ para distribución interna', 'Asignado', '71235489', '2021-06-18', '2021-06-19', NULL),
('EQ-S26-011', 'Firewall Fortinet FortiGate 60F', 'Infraestructura', 'Dispositivo de seguridad perimetral y túneles VPN corporativos', 'Asignado', '71235489', '2023-09-02', '2023-09-02', NULL),
('EQ-S26-012', 'Access Point Aruba AP-515', 'Infraestructura', 'Punto de acceso inalámbrico Wi-Fi 6 para zona de desarrollo', 'Mantenimiento', NULL, '2022-10-14', '2022-10-15', NULL),
('EQ-S26-013', 'Portátil Acer Nitro V15', 'Soporte Técnico', 'Intel Core i5, 16GB RAM, RTX 3050. Usado para pruebas de red', 'Disponible', NULL, '2024-10-10', '2024-10-10', NULL),
('EQ-S26-014', 'Analizador de Red Fluke LinkRunner', 'Soporte Técnico', 'Probador de cables de red y diagnóstico de fallas físicas', 'Asignado', '1015344219', '2023-05-12', '2023-05-14', NULL),
('EQ-S26-015', 'Monitor Dell 27 UltraSharp', 'Diseño', 'Pantalla IPS 4K con 100% sRGB para edición y diagramación', 'Asignado', '1020355410', '2024-05-10', '2024-05-12', NULL),
('EQ-S26-016', 'Portátil Razer Blade 14', 'Diseño', 'AMD Ryzen 9, 32GB RAM, RTX 4070. Edición de video 4K', 'Asignado', '1037654321', '2025-02-28', '2025-03-02', NULL),
('EQ-S26-017', 'Tableta Digitalizadora Wacom Intuos Pro L', 'Diseño', 'Superficie táctil de precisión con lápiz Pro Pen 2', 'Asignado', '1020355410', '2023-07-19', '2023-07-20', NULL),
('EQ-S26-018', 'Monitor LG UltraFine 32 Uniclass', 'Diseño', 'Monitor complementario vertical para flujos de diseño UI/UX', 'Disponible', NULL, '2024-11-12', '2024-11-12', NULL),
('EQ-S26-019', 'Cámara Sony Alpha a7 IV', 'Diseño', 'Cámara Mirrorless para registro de eventos y contenido corporativo', 'Asignado', '1182345678', '2024-02-10', '2024-02-11', NULL),
('EQ-S26-020', 'Portátil Lenovo ThinkPad X1 Carbon', 'Administración', 'Intel Core Ultra 7, 16GB RAM, 512GB SSD, Chasis liviano', 'Asignado', '98541223', '2025-01-20', '2025-01-22', NULL),
('EQ-S26-021', 'Portátil HP EliteBook 840 G10', 'Administración', 'Intel Core i7-1355U, 16GB RAM, Pantalla antirreflejo', 'Asignado', '32145987', '2024-04-05', '2024-04-08', NULL),
('EQ-S26-022', 'Impresora HP LaserJet Pro M404dw', 'Administración', 'Impresora láser monocromática de alta velocidad para contratos', 'Asignado', '32145987', '2023-11-05', '2023-11-06', NULL),
('EQ-S26-023', 'Escáner Fujitsu ScanSnap iX1600', 'Administración', 'Escáner de documentos a doble cara para digitalización masiva', 'Disponible', NULL, '2023-08-22', '2023-08-22', NULL),
('EQ-S26-024', 'Portátil Dell Inspiron 14 Plus', 'Talento Humano', 'Intel Core Ultra 5, 16GB RAM, 1TB SSD. Manejo de nómina', 'Asignado', '1014356789', '2025-04-18', '2025-04-20', NULL),
('EQ-S26-025', 'Destructora de Papel Rexel Optimum', 'Talento Humano', 'Trituradora de corte en partículas para seguridad de datos', 'Asignado', '1014356789', '2023-02-14', '2023-02-15', NULL),
('EQ-S26-026', 'Tablet Samsung Galaxy Tab S9', 'Ventas', 'Pantalla 11 pulgadas con S-Pen para demostraciones comerciales', 'Asignado', '71554128', '2024-02-28', '2024-03-02', NULL),
('EQ-S26-027', 'Tablet iPad Air 5ta Gen', 'Ventas', 'Apple M1, 64GB Wi-Fi, Color Azul. Catálogos interactivos', 'Asignado', '1023456781', '2023-10-11', '2023-10-12', NULL),
('EQ-S26-028', 'Portátil HP Pavilion Aero 13', 'Ventas', 'AMD Ryzen 7, 16GB RAM, Peso ultra liviano de 990g para viajes', 'Mantenimiento', '1045678912', '2025-01-08', '2025-01-10', NULL),
('EQ-S26-029', 'Portátil Asus Vivobook 16', 'Ventas', 'AMD Ryzen 5, 16GB RAM. Equipo remoto para asesor comercial', 'Asignado', '1054321678', '2024-07-22', '2024-07-25', NULL),
('EQ-S26-030', 'Proyector Epson PowerLite X49', 'Ventas', 'Proyector de 3.600 lúmenes para sala de juntas y propuestas', 'Disponible', NULL, '2023-06-05', '2023-06-05', NULL),
('EQ-S26-031', 'Diademas Poly Blackwire 3320', 'Call Center', 'Auriculares con micrófono y cancelación de ruido para asesores', 'Baja', '1015344219', '2023-01-15', '2023-01-16', '2024-06-20'),
('EQ-S26-032', 'Teléfono IP Grandstream GRP2615', 'Call Center', 'Teléfono IP ejecutivo con soporte de 5 líneas y Wi-Fi', 'Asignado', '1067891234', '2023-03-18', '2023-03-20', NULL),
('EQ-S26-033', 'Teléfono IP Grandstream GRP2615', 'Call Center', 'Teléfono IP ejecutivo con soporte de 5 líneas y Wi-Fi', 'Asignado', '1078912345', '2023-03-18', '2023-03-20', NULL),
('EQ-S26-034', 'Impresora Térmica Zebra ZD220', 'Logística', 'Impresora de etiquetas de código de barras para despachos', 'Asignado', '1089123456', '2024-01-30', '2024-02-01', NULL),
('EQ-S26-035', 'Lector de Código de Barras Honeywell', 'Logística', 'Escáner de mano inalámbrico de alta resistencia para bodega', 'Asignado', '1089123456', '2024-01-30', '2024-02-01', NULL);

INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES
('admin', 'admin123', 'Administrador del Sistema', 'Tecnologia', 'admin@registech.com', 'activo'),
('rh', 'rh123', 'Gestion Recursos Humanos', 'Recursos Humanos', 'rh@registech.com', 'activo'),
('soporte', 'soporte123', 'Soporte Tecnico', 'Soporte', 'soporte@registech.com', 'activo'),
('almacen', 'almacen123', 'Encargado de Almacen', 'Almacen', 'almacen@registech.com', 'activo'),
('ventas', 'ventas123', 'Asesor de Ventas', 'Ventas', 'ventas@registech.com', 'activo'),
('fianzas', 'fianzas123', 'Area de Fianzas', 'Fianzas', 'fianzas@registech.com', 'activo'),
('administracion', 'administracion123', 'Area Administrativa', 'Administración', 'administracion@registech.com', 'activo');