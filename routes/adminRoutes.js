const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const tipoComercioController = require('../controllers/tipoComercioController');
const configuracionController = require('../controllers/configuracionController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roles');
const checkActiveAccount = require('../middleware/checkActiveAccount');
const upload = require('../config/multer');

// Aplicar middleware de autenticación y rol a todas las rutas
router.use(auth.isAuthenticated);
router.use(checkRole('administrador'));
router.use(checkActiveAccount);

// Dashboard principal
router.get('/dashboard', adminController.mostrarDashboard);

// ✅ NUEVO: Rutas para cambiar contraseña
router.get('/cambiar-password', adminController.mostrarCambiarPassword);
router.post('/cambiar-password', adminController.cambiarPassword);

// Gestión de Clientes
router.get('/clientes', adminController.listarClientes);
router.post('/clientes/toggle-activo/:clienteId', adminController.toggleActivoCliente);

// Gestión de Deliveries
router.get('/deliveries', adminController.listarDeliveries);
router.post('/deliveries/toggle-activo/:deliveryId', adminController.toggleActivoDelivery);

// Gestión de Comercios
router.get('/comercios', adminController.listarComercios);
router.post('/comercios/toggle-activo/:comercioId', adminController.toggleActivoComercio);

// Gestión de Administradores
router.get('/administradores', adminController.listarAdministradores);
router.get('/administradores/crear', adminController.mostrarCrearAdministrador);
router.post('/administradores/crear', adminController.crearAdministrador);
router.get('/administradores/editar/:adminId', adminController.mostrarEditarAdministrador);
router.post('/administradores/editar/:adminId', adminController.editarAdministrador);
router.post('/administradores/toggle-activo/:adminId', adminController.toggleActivoAdministrador);

// Gestión de Tipos de Comercio
router.get('/tipos-comercio', tipoComercioController.listar);
router.get('/tipos-comercio/crear', tipoComercioController.mostrarCrear);
router.post('/tipos-comercio/crear', upload.single('icono'), tipoComercioController.crear);
router.get('/tipos-comercio/editar/:tipoId', tipoComercioController.mostrarEditar);
router.post('/tipos-comercio/editar/:tipoId', upload.single('icono'), tipoComercioController.editar);
router.get('/tipos-comercio/eliminar/:tipoId', tipoComercioController.mostrarEliminar);
router.post('/tipos-comercio/eliminar/:tipoId', tipoComercioController.eliminar);

// Configuración del Sistema
router.get('/configuracion', configuracionController.mostrar);
router.get('/configuracion/editar', configuracionController.mostrarEditar);
router.post('/configuracion/editar', configuracionController.editar);

module.exports = router;