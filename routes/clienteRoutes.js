const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const direccionController = require('../controllers/direccionController');
const favoritoController = require('../controllers/favoritoController');
// ❌ NO USAR pedidoController para crear pedidos desde cliente
// const pedidoController = require('../controllers/pedidoController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const checkActiveAccount = require('../middleware/checkActiveAccount');
const upload = require('../config/multer');
const { validatePerfil, validateDireccion } = require('../middleware/validators');

// Aplicar middleware de autenticación y rol a todas las rutas
router.use(auth.isAuthenticated);
router.use(checkRole('cliente'));
router.use(checkActiveAccount);

// Home del cliente
router.get('/home', clienteController.mostrarHome);

// Listado de comercios
router.get('/comercios/:tipoId', clienteController.listarComercios);

// Catálogo de productos
router.get('/catalogo/:comercioId', clienteController.mostrarCatalogo);

// 🆕 AGREGAR ESTA RUTA - Restaurar carrito desde sesión
router.get('/restaurar-carrito', clienteController.restaurarCarrito);

// Seleccionar dirección y crear pedido
router.post('/seleccionar-direccion', clienteController.seleccionarDireccion);
router.post('/crear-pedido', clienteController.crearPedido);

// Perfil del cliente
router.get('/perfil', clienteController.mostrarPerfil);
router.post('/perfil', upload.single('fotoPerfil'), validatePerfil, clienteController.actualizarPerfil);

// Pedidos del cliente
router.get('/pedidos', clienteController.listarPedidos);
router.get('/pedido/:pedidoId', clienteController.mostrarDetallePedido);

// Direcciones del cliente
router.get('/direcciones', direccionController.listar);
router.get('/direcciones/crear', direccionController.mostrarCrear);
router.post('/direcciones/crear', validateDireccion, direccionController.crear);
router.get('/direcciones/editar/:direccionId', direccionController.mostrarEditar);
router.post('/direcciones/editar/:direccionId', validateDireccion, direccionController.editar);
router.get('/direcciones/eliminar/:direccionId', direccionController.mostrarEliminar);
router.post('/direcciones/eliminar/:direccionId', direccionController.eliminar);

// Favoritos del cliente
router.get('/favoritos', clienteController.listarFavoritos);
router.post('/favorito/toggle/:comercioId', favoritoController.toggle);

module.exports = router;