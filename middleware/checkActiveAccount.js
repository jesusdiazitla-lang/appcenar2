// Middleware para verificar que la cuenta del usuario esté activa
const checkActiveAccount = (req, res, next) => {
  // Si no hay usuario en sesión, pasar al siguiente middleware
  if (!req.session || !req.session.user) {
    return next();
  }

  // Si el usuario está inactivo
  if (!req.session.user.activo) {
    req.flash('warning', 'Tu cuenta está inactiva. Por favor revisa tu correo para activarla o contacta a un administrador.');
    
    // Destruir la sesión
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
      }
      res.clearCookie('appcenar.sid');
      return res.redirect('/auth/login');
    });
    return;
  }

  // Si está activo, continuar
  next();
};

module.exports = checkActiveAccount;