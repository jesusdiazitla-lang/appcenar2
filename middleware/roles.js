// Middleware para verificar roles específicos
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Debes iniciar sesión');
      return res.redirect('/auth/login');
    }

    if (!roles.includes(req.session.user.rol)) {
      req.flash('error', 'No tienes permisos para acceder a esta página');
      return res.status(403).send("Acceso denegado");
;
    }

    next();
  };
};

// Middlewares específicos por rol
const isCliente = checkRole('cliente');
const isComercio = checkRole('comercio');
const isDelivery = checkRole('delivery');
const isAdmin = checkRole('administrador');

// Middleware para múltiples roles
const isClienteOrAdmin = checkRole('cliente', 'administrador');
const isComercioOrAdmin = checkRole('comercio', 'administrador');
const isDeliveryOrAdmin = checkRole('delivery', 'administrador');

module.exports = checkRole;