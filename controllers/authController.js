const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const EmailService = require('../services/EmailService');

// Función auxiliar para obtener home según rol
function getRoleHome(rol) {
  switch(rol) {
    case 'cliente':
      return '/cliente/home';
    case 'comercio':
      return '/comercio/home';
    case 'delivery':
      return '/delivery/home';
    case 'administrador':
      return '/admin/dashboard';
    default:
      return '/auth/login';
  }
}

// Mostrar formulario de login
exports.mostrarLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect(getRoleHome(req.session.user.rol));
  }
  res.render('auth/login', { layout: 'layouts/public' });
};

// Mostrar formulario de registro cliente/delivery
exports.mostrarRegistroCliente = (req, res) => {
  res.render('auth/register-cliente', { layout: 'layouts/public' });
};

// Mostrar formulario de registro comercio
exports.mostrarRegistroComercio = async (req, res) => {
  try {
    const TipoComercio = require('../models/TipoComercio');
    const tiposComercio = await TipoComercio.find();
    res.render('auth/register-comercio', { 
      layout: 'layouts/public',
      tiposComercio 
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar tipos de comercio');
    res.redirect('/auth/login');
  }
};

// Procesar LOGIN
exports.login = async (req, res) => {
  try {
    console.log('=== INICIO LOGIN ===');
    const { usuarioOrEmail, password } = req.body;
    console.log('Usuario/Email ingresado:', usuarioOrEmail);

    const usuario = await Usuario.findOne({
      $or: [{ nombreUsuario: usuarioOrEmail }, { correo: usuarioOrEmail }]
    }).select('+password');

    console.log('Usuario encontrado:', usuario?._id);

    if (!usuario) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/auth/login');
    }

    if (!usuario.activo) {
      req.flash('error', 'Su cuenta está inactiva. Revise su correo para activarla.');
      return res.redirect('/auth/login');
    }

    console.log('Password hash en DB:', usuario.password);

    const passwordValido = await usuario.compararPassword(password);
    console.log('Password válido:', passwordValido);

    if (!passwordValido) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: usuario._id.toString(),
      rol: usuario.rol,
      nombre: usuario.nombre || usuario.nombreComercio,
      correo: usuario.correo,
      activo: usuario.activo,
      requiereCambioPassword: usuario.requiereCambioPassword || false
    };

    console.log('Sesión creada:', req.session.user);

    req.session.save((err) => {
      if (err) {
        console.error('❌ Error al guardar sesión:', err);
        req.flash('error', 'Error interno al establecer la sesión.');
        return res.redirect('/auth/login');
      }
      
      console.log('✅ Sesión guardada exitosamente');
      console.log('=== FIN LOGIN ===');
      
      // ✅ Si es admin y requiere cambio de password, redirigir a cambiar contraseña
      if (usuario.rol === 'administrador' && usuario.requiereCambioPassword) {
        return res.redirect('/admin/cambiar-password');
      }
      
      res.redirect(getRoleHome(usuario.rol));
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    req.flash('error', 'Error al iniciar sesión');
    res.redirect('/auth/login');
  }
};

// Registrar cliente/delivery
exports.registrarCliente = async (req, res) => {
  try {
    const { nombre, apellido, telefono, correo, nombreUsuario, rol, password, confirmarPassword } = req.body;

    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register-cliente');
    }

    const usuarioExistente = await Usuario.findOne({
      $or: [{ nombreUsuario }, { correo }]
    });

    if (usuarioExistente) {
      req.flash('error', 'El nombre de usuario o correo ya están registrados');
      return res.redirect('/auth/register-cliente');
    }

    const tokenActivacion = crypto.randomBytes(32).toString('hex');

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      telefono,
      correo,
      nombreUsuario,
      rol,
      password: password,
      activo: false,
      tokenActivacion,
      fotoPerfil: req.file ? `/uploads/${req.file.filename}` : null,
      estadoDisponibilidad: rol === 'delivery' ? 'disponible' : undefined
    });

    await nuevoUsuario.save();

    const urlActivacion = `${req.protocol}://${req.get('host')}/auth/activar/${tokenActivacion}`;
    await EmailService.enviarCorreoActivacion(correo, nombre, urlActivacion);

    req.flash('success', 'Registro exitoso. Por favor revise su correo para activar su cuenta.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Error en registro cliente:', error);
    req.flash('error', 'Error al registrar usuario');
    res.redirect('/auth/register-cliente');
  }
};

// Registrar comercio
exports.registrarComercio = async (req, res) => {
  try {
    const { nombreComercio, telefono, correo, horaApertura, horaCierre, tipoComercio, password, confirmarPassword } = req.body;

    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register-comercio');
    }

    const usuarioExistente = await Usuario.findOne({ correo });

    if (usuarioExistente) {
      req.flash('error', 'El correo ya está registrado');
      return res.redirect('/auth/register-comercio');
    }

    const tokenActivacion = crypto.randomBytes(32).toString('hex');

    const nuevoComercio = new Usuario({
      nombreComercio,
      telefono,
      correo,
      horaApertura,
      horaCierre,
      tipoComercio,
      rol: 'comercio',
      password: password,
      activo: false,
      tokenActivacion,
      logoComercio: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevoComercio.save();

    const urlActivacion = `${req.protocol}://${req.get('host')}/auth/activar/${tokenActivacion}`;
    await EmailService.enviarCorreoActivacion(correo, nombreComercio, urlActivacion);

    req.flash('success', 'Registro exitoso. Por favor revise su correo para activar su cuenta.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Error en registro comercio:', error);
    req.flash('error', 'Error al registrar comercio');
    res.redirect('/auth/register-comercio');
  }
};

// Activar cuenta
exports.activarCuenta = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ tokenActivacion: token });

    if (!usuario) {
      req.flash('error', 'Token de activación inválido o expirado');
      return res.redirect('/auth/login');
    }

    usuario.activo = true;
    usuario.tokenActivacion = null;
    await usuario.save();

    req.flash('success', 'Cuenta activada exitosamente. Ya puede iniciar sesión.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al activar cuenta');
    res.redirect('/auth/login');
  }
};

// Mostrar formulario de recuperar contraseña
exports.mostrarRecuperarPassword = (req, res) => {
  res.render('auth/forgot-password', { layout: 'layouts/public' });
};

// ✅ CORREGIDO: Procesar recuperar contraseña
exports.recuperarPassword = async (req, res) => {
  try {
    const { usuarioOrEmail } = req.body;

    console.log('🔐 Solicitud de recuperación para:', usuarioOrEmail);

    const usuario = await Usuario.findOne({
      $or: [{ nombreUsuario: usuarioOrEmail }, { correo: usuarioOrEmail }]
    });

    if (!usuario) {
      req.flash('error', 'Usuario o correo no encontrado');
      return res.redirect('/auth/forgot-password');
    }

    // ✅ Generar token y fecha de expiración (1 hora)
    const tokenReset = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 1);

    console.log('🔑 Token generado:', tokenReset);
    console.log('⏰ Expira el:', expiracion);

    // ✅ CORRECCIÓN: Usar los nombres correctos de campos
    usuario.tokenResetPassword = tokenReset;
    usuario.tokenExpiracion = expiracion;
    await usuario.save();

    console.log('✅ Token guardado en BD');

    const urlReset = `${req.protocol}://${req.get('host')}/auth/reset-password/${tokenReset}`;
    await EmailService.enviarCorreoResetPassword(
      usuario.correo, 
      usuario.nombre || usuario.nombreComercio, 
      urlReset
    );

    console.log('📧 Correo enviado a:', usuario.correo);

    req.flash('success', 'Se ha enviado un correo con instrucciones para restablecer su contraseña.');
    res.redirect('/auth/forgot-password');

  } catch (error) {
    console.error('❌ Error en recuperarPassword:', error);
    req.flash('error', 'Error al procesar solicitud');
    res.redirect('/auth/forgot-password');
  }
};

// ✅ CORREGIDO: Mostrar formulario de reset password
exports.mostrarResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔍 Verificando token:', token);

    // ✅ Buscar usuario con el token Y que no haya expirado
    const usuario = await Usuario.findOne({ 
      tokenResetPassword: token,
      tokenExpiracion: { $gt: new Date() } // Token no expirado
    });

    if (!usuario) {
      console.log('❌ Token inválido o expirado');
      req.flash('error', 'El enlace de recuperación es inválido o ha expirado. Solicite uno nuevo.');
      return res.redirect('/auth/forgot-password');
    }

    console.log('✅ Token válido para:', usuario.correo);

    res.render('auth/reset-password', {
      layout: 'layouts/public',
      token
    });

  } catch (error) {
    console.error('❌ Error en mostrarResetPassword:', error);
    req.flash('error', 'Error al cargar formulario');
    res.redirect('/auth/login');
  }
};

// ✅ CORREGIDO: Procesar reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmarPassword } = req.body;

    console.log('🔄 Procesando reset de password para token:', token);

    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect(`/auth/reset-password/${token}`);
    }

    // ✅ Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({ 
      tokenResetPassword: token,
      tokenExpiracion: { $gt: new Date() }
    });

    if (!usuario) {
      console.log('❌ Token inválido o expirado');
      req.flash('error', 'El enlace de recuperación es inválido o ha expirado. Solicite uno nuevo.');
      return res.redirect('/auth/forgot-password');
    }

    console.log('✅ Actualizando contraseña para:', usuario.correo);

    // ✅ Actualizar contraseña y limpiar tokens
    usuario.password = password;
    usuario.tokenResetPassword = null;
    usuario.tokenExpiracion = null;
    await usuario.save();

    console.log('✅ Contraseña actualizada exitosamente');

    req.flash('success', 'Contraseña actualizada exitosamente. Ya puede iniciar sesión.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    req.flash('error', 'Error al resetear contraseña');
    res.redirect('/auth/login');
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/auth/login');
  });
};