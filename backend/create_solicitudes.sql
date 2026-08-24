CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud SERIAL PRIMARY KEY,
    usuario_solicita VARCHAR(50) NOT NULL,
    tipo_equipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    justificacion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    respondido_por VARCHAR(50) NULL,
    respuesta TEXT NULL,
    creado_en TIMESTAMP DEFAULT NOW(),
    respondido_en TIMESTAMP NULL,
    FOREIGN KEY (usuario_solicita) REFERENCES usuarios(usuario)
);
