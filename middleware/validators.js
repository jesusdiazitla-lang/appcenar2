const { body, validationResult } = require('express-validator');

// Función auxiliar para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    // Corregido: Redirige y termina la ejecución
    return res.redirect(req.get("Referrer") || "/");
  }
  next();
};

// Validaciones para registro de cliente/delivery
const validateClienteRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail(),
  
  body('nombreUsuario') // ✅ CORRECCIÓN: Nombre de campo ajustado
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 4, max: 20 }).withMessage('El usuario debe tener entre 4 y 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El usuario solo puede contener letras, números y guiones bajos'),
  
  body('rol')
    .notEmpty().withMessage('Debes seleccionar un rol')
    .isIn(['cliente', 'delivery']).withMessage('Rol inválido'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('confirmarPassword')
    .notEmpty().withMessage('Debes confirmar la contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ... (El resto de las validaciones permanecen sin cambios)

const validateComercioRegistro = [
  body('nombreComercio')
    .trim()
    .notEmpty().withMessage('El nombre del comercio es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail(),
  
  body('horaApertura')
    .notEmpty().withMessage('La hora de apertura es requerida'),
  
  body('horaCierre')
    .notEmpty().withMessage('La hora de cierre es requerida'),
  
  body('tipoComercioId')
    .notEmpty().withMessage('Debes seleccionar un tipo de comercio'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('confirmarPassword')
    .notEmpty().withMessage('Debes confirmar la contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ... (Incluye el resto de las validaciones aquí) ...

const validateLogin = [
    // ...
    handleValidationErrors
];

const validateForgotPassword = [
    // ...
    handleValidationErrors
];

const validateResetPassword = [
    // ...
    handleValidationErrors
];

const validatePerfil = [
    // ...
    handleValidationErrors
];

const validateDireccion = [
    // ...
    handleValidationErrors
];

const validateCategoria = [
    // ...
    handleValidationErrors
];

const validateProducto = [
    // ...
    handleValidationErrors
];

const validateTipoComercio = [
    // ...
    handleValidationErrors
];

const validateAdministrador = [
    // ...
    handleValidationErrors
];

const validateConfiguracion = [
    // ...
    handleValidationErrors
];

const validatePerfilComercio = [
    // ...
    handleValidationErrors
];


module.exports = {
  validateClienteRegistro,
  validateComercioRegistro,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validatePerfil,
  validateDireccion,
  validateCategoria,
  validateProducto,
  validateTipoComercio,
  validateAdministrador,
  validateConfiguracion,
  validatePerfilComercio,
  handleValidationErrors
};