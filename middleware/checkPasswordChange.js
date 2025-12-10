// Middleware para verificar si el administrador requiere cambio de contraseña
const checkPasswordChange = (req, res, next) => {
  // Solo aplica para administradores
  if (req.session?.user?.rol !== 'administrador') {
    return next();
  }

  // Si requiere cambio de contraseña y no está en la ruta de cambio
  if (req.session.user.requiereCambioPassword) {
    const rutasPermitidas = [
      '/admin/cambiar-password',
      '/auth/logout'
    ];

    // Si está intentando acceder a una ruta que no es cambiar contraseña
    if (!rutasPermitidas.includes(req.path)) {
      console.log('⚠️ Admin requiere cambio de contraseña, redirigiendo...');
      return res.redirect('/admin/cambiar-password');
    }
  }

  next();
};

module.exports = checkPasswordChange;