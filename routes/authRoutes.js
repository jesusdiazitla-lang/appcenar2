const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const upload = require('../config/multer');

// Importar ambos middleware correctamente
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const { 
  validateLogin, 
  validateClienteRegistro,
  validateComercioRegistro,
  validateForgotPassword,
  validateResetPassword 
} = require('../middleware/validators');

// ========== RUTAS PÚBLICAS (solo si NO está autenticado) ========== //

router.get('/login', isNotAuthenticated, authController.mostrarLogin);
router.get('/register-cliente', isNotAuthenticated, authController.mostrarRegistroCliente);
router.get('/register-comercio', isNotAuthenticated, authController.mostrarRegistroComercio);
router.get('/forgot-password', isNotAuthenticated, authController.mostrarRecuperarPassword);
router.get('/reset-password/:token', isNotAuthenticated, authController.mostrarResetPassword);

// Activación de cuenta NO requiere autenticación
router.get('/activar/:token', authController.activarCuenta);

// ========== RUTAS DE PROCESAMIENTO (también públicas) ========== //

router.post('/login', isNotAuthenticated, validateLogin, authController.login);

router.post(
  '/register-cliente',
  isNotAuthenticated,
  upload.single('fotoPerfil'),
  validateClienteRegistro,
  authController.registrarCliente
);

router.post(
  '/register-comercio',
  isNotAuthenticated,
  upload.single('logoComercio'),
  validateComercioRegistro,
  authController.registrarComercio
);

router.post('/forgot-password', isNotAuthenticated, validateForgotPassword, authController.recuperarPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// ========== LOGOUT (solo si está autenticado) ========== //
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;
