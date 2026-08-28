const express = require('express');

const router = express.Router();

const pmcController = require('../controllers/pmcController');

const { authMiddleware } = require('../middlewares/auth');

// Por ahora solo exigimos que esté autenticado
router.use(authMiddleware);

router.get('/', pmcController.obtenerTodos);

router.post('/', pmcController.crearProducto);

router.put('/:id', pmcController.actualizarProducto);

router.delete('/:id', pmcController.eliminarProducto);

// Rutas rápidas de stock
router.post('/:id/entregar', pmcController.entregarProducto);

router.post('/:id/devolver', pmcController.devolverProducto);

module.exports = router;