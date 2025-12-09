const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const checkActiveAccount = require('../middleware/checkActiveAccount');
const upload = require('../config/multer');
const { validatePerfil } = require('../middleware/validators');

// Aplicar middleware de autenticación y rol a todas las rutas
router.use(auth.isAuthenticated);
router.use(checkRole('delivery'));
router.use(checkActiveAccount);

// Home del delivery (listado de pedidos asignados)
router.get('/home', deliveryController.mostrarHome);

// Detalle de pedido
router.get('/pedido/:pedidoId', deliveryController.mostrarDetallePedido);

// Completar pedido
router.post('/pedido/:pedidoId/completar', deliveryController.completarPedido);

// Perfil del delivery
router.get('/perfil', deliveryController.mostrarPerfil);
router.post('/perfil', upload.single('fotoPerfil'), validatePerfil, deliveryController.actualizarPerfil);

module.exports = router;