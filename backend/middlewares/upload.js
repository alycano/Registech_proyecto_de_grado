const multer = require('multer')
const path = require('path')
const fs = require('fs')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase()
        const nombreBase = (req.body.num_serie || 'equipo').replace(/[^a-zA-Z0-9-_]/g, '')
        cb(null, `evidencia-${nombreBase}-${Date.now()}${extension}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
            return cb(new Error('SOLO_IMAGENES'))
        }
        cb(null, true)
    }
})

function eliminarArchivo(rutaRelativa) {
    if (!rutaRelativa) return
    const rutaAbsoluta = path.join(UPLOADS_DIR, path.basename(rutaRelativa))
    fs.unlink(rutaAbsoluta, () => {})
}

module.exports = { upload, UPLOADS_DIR, eliminarArchivo }
