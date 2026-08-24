class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // status será 'fail' para errores 4xx (cliente), y 'error' para 5xx (servidor)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // Bandera para diferenciar errores operativos de bugs de programación
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
