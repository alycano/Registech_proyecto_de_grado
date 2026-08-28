const express = require('express');
const router = express.Router();
const pmcController = require('../controllers/pmcController');
const auth = require('../middlewares/auth');

// Verificar permisos (Opcional: podrias crear un middleware de roles)
// Por ahora solo exigimos que esté autenticado
router.use(auth);

router.get('/', pmcController.obtenerTodos);
router.post('/', pmcController.crearProducto);
router.put('/:id', pmcController.actualizarProducto);
router.delete('/:id', pmcController.eliminarProducto);

// Rutas rápidas de stock
router.post('/:id/entregar', pmcController.entregarProducto);
router.post('/:id/devolver', pmcController.devolverProducto);

module.exports = router;
