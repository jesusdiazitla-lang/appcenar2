// middleware/roles.js - CORREGIDO

// Middleware para verificar roles específicos
const checkRole = (...roles) => {
  return (req, res, next) => {
    // ✅ Verificar si hay sesión y usuario
    if (!req.session || !req.session.user) {
      req.flash('error', 'Debes iniciar sesión');
      return res.redirect('/auth/login');
    }

    // ✅ Verificar si el rol del usuario está permitido
    if (!roles.includes(req.session.user.rol)) {
      req.flash('error', 'No tienes permisos para acceder a esta página');
      
      // ✅ CORRECCIÓN: Redirigir al home del usuario según su rol
      const redirectPaths = {
        cliente: '/cliente/home',
        comercio: '/comercio/home',
        delivery: '/delivery/home',
        administrador: '/admin/dashboard'
      };
      
      const destino = redirectPaths[req.session.user.rol] || '/auth/login';
      return res.redirect(destino);
    }

    // ✅ Si pasa las verificaciones, continuar
    next();
  };
};

// ✅ Exportar la función checkRole
module.exports = checkRole;