const express = require('express');
const router = express.Router();
const comercioController = require('../controllers/comercioController');
const categoriaController = require('../controllers/categoriaController');
const productoController = require('../controllers/productoController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const checkActiveAccount = require('../middleware/checkActiveAccount');
const upload = require('../config/multer');
const { validatePerfilComercio, validateCategoria, validateProducto } = require('../middleware/validators');

// Aplicar middleware de autenticación y rol a todas las rutas
router.use(auth.isAuthenticated);
router.use(checkRole('cliente'));
router.use(checkActiveAccount);


// Home del comercio (listado de pedidos)
router.get('/home', comercioController.mostrarHome);

// Detalle de pedido y asignar delivery
router.get('/pedido/:pedidoId', comercioController.mostrarDetallePedido);
router.post('/pedido/:pedidoId/asignar-delivery', comercioController.asignarDelivery);

// Perfil del comercio
router.get('/perfil', comercioController.mostrarPerfil);
router.post('/perfil', upload.single('logoComercio'), validatePerfilComercio, comercioController.actualizarPerfil);

// Mantenimiento de categorías
router.get('/categorias', categoriaController.listar);
router.get('/categorias/crear', categoriaController.mostrarCrear);
router.post('/categorias/crear', validateCategoria, categoriaController.crear);
router.get('/categorias/editar/:categoriaId', categoriaController.mostrarEditar);
router.post('/categorias/editar/:categoriaId', validateCategoria, categoriaController.editar);
router.get('/categorias/eliminar/:categoriaId', categoriaController.mostrarEliminar);
router.post('/categorias/eliminar/:categoriaId', categoriaController.eliminar);

// Mantenimiento de productos
router.get('/productos', productoController.listar);
router.get('/productos/crear', productoController.mostrarCrear);
router.post('/productos/crear', upload.single('imagen'), validateProducto, productoController.crear);
router.get('/productos/editar/:productoId', productoController.mostrarEditar);
router.post('/productos/editar/:productoId', upload.single('imagen'), validateProducto, productoController.editar);
router.get('/productos/eliminar/:productoId', productoController.mostrarEliminar);
router.post('/productos/eliminar/:productoId', productoController.eliminar);

module.exports = router;