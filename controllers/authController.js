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
  // Si ya está logueado, redirigir al home según su rol
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

// Procesar login
exports.login = async (req, res) => {
  try {
    const { usuarioOrEmail, password } = req.body;

    // Buscar usuario, forzando la inclusión del hash de contraseña.
    const usuario = await Usuario.findOne({
      $or: [{ nombreUsuario: usuarioOrEmail }, { correo: usuarioOrEmail }]
    }).select('+password'); // <--- 🔑 CORRECCIÓN CRÍTICA DE MONGODB

    if (!usuario) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/auth/login');
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      req.flash('error', 'Su cuenta está inactiva. Revise su correo para activarla.');
      return res.redirect('/auth/login');
    }

    // Verificar contraseña usando el método del modelo
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      req.flash('error', 'Credenciales incorrectas');
      return res.redirect('/auth/login');
    }

    // Crear sesión
    req.session.user = {
      id: usuario._id,
      rol: usuario.rol,
      nombre: usuario.nombre || usuario.nombreComercio,
      correo: usuario.correo
    };

    // Guardar la sesión explícitamente antes de redirigir
    req.session.save((err) => {
        if (err) {
            console.error('Error al guardar sesión después del login:', err);
            req.flash('error', 'Error interno al establecer la sesión.');
            return res.redirect('/auth/login');
        }
        // Redirigir según rol SOLO después de que la sesión se haya guardado
        res.redirect(getRoleHome(usuario.rol));
    });

  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al iniciar sesión');
    res.redirect('/auth/login');
  }
};

// Registrar cliente o delivery
exports.registrarCliente = async (req, res) => {
  try {
    const { nombre, apellido, telefono, correo, nombreUsuario, rol, password, confirmarPassword } = req.body;

    // Validar que las contraseñas coincidan
    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register-cliente');
    }

    // Verificar si el usuario o correo ya existen
    const usuarioExistente = await Usuario.findOne({
      $or: [{ nombreUsuario }, { correo }]
    });

    if (usuarioExistente) {
      req.flash('error', 'El nombre de usuario o correo ya están registrados');
      return res.redirect('/auth/register-cliente');
    }

    // 🛑 NO HASHEAMOS AQUÍ. EL HOOK pre('save') DEL MODELO SE ENCARGA DEL HASHEO.

    // Generar token de activación
    const tokenActivacion = crypto.randomBytes(32).toString('hex');

    // Crear usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      telefono,
      correo,
      nombreUsuario,
      rol,
      password: password, // PASAMOS LA CONTRASEÑA EN CLARO
      activo: false,
      tokenActivacion,
      fotoPerfil: req.file ? `/uploads/${req.file.filename}` : null,
      estadoDisponibilidad: rol === 'delivery' ? 'disponible' : undefined
    });

    await nuevoUsuario.save(); // save() llama al hook pre('save') que hashea la contraseña

    // Enviar correo de activación
    const urlActivacion = `${req.protocol}://${req.get('host')}/auth/activar/${tokenActivacion}`;
    await EmailService.enviarCorreoActivacion(correo, nombre, urlActivacion);

    req.flash('success', 'Registro exitoso. Por favor revise su correo para activar su cuenta.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al registrar usuario');
    res.redirect('/auth/register-cliente');
  }
};

// Registrar comercio
exports.registrarComercio = async (req, res) => {
  try {
    const { nombreComercio, telefono, correo, horaApertura, horaCierre, tipoComercio, password, confirmarPassword } = req.body;

    // Validar que las contraseñas coincidan
    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register-comercio');
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ correo });

    if (usuarioExistente) {
      req.flash('error', 'El correo ya está registrado');
      return res.redirect('/auth/register-comercio');
    }

    // Hashear contraseña (Para Comercio lo mantenemos aquí si su modelo no usa el hook global)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar token de activación
    const tokenActivacion = crypto.randomBytes(32).toString('hex');

    // Crear comercio
    const nuevoComercio = new Usuario({
      nombreComercio,
      telefono,
      correo,
      horaApertura,
      horaCierre,
      tipoComercio,
      rol: 'comercio',
      password: hashedPassword,
      activo: false,
      tokenActivacion,
      logoComercio: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevoComercio.save();

    // Enviar correo de activación
    const urlActivacion = `${req.protocol}://${req.get('host')}/auth/activar/${tokenActivacion}`;
    await EmailService.enviarCorreoActivacion(correo, nombreComercio, urlActivacion);

    req.flash('success', 'Registro exitoso. Por favor revise su correo para activar su cuenta.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error(error);
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

// Procesar recuperar contraseña
exports.recuperarPassword = async (req, res) => {
  try {
    const { usuarioOrEmail } = req.body;

    // Buscar usuario por nombre de usuario o correo
    const usuario = await Usuario.findOne({
      $or: [{ nombreUsuario: usuarioOrEmail }, { correo: usuarioOrEmail }]
    });

    if (!usuario) {
      req.flash('error', 'Usuario o correo no encontrado');
      return res.redirect('/auth/forgot-password');
    }

    // Generar token de reseteo
    const tokenReset = crypto.randomBytes(32).toString('hex');
    usuario.tokenResetPassword = tokenReset;
    await usuario.save();

    // Enviar correo con enlace de reseteo
    const urlReset = `${req.protocol}://${req.get('host')}/auth/reset-password/${tokenReset}`;
    await EmailService.enviarCorreoResetPassword(usuario.correo, usuario.nombre || usuario.nombreComercio, urlReset);

    req.flash('success', 'Se ha enviado un correo con instrucciones para restablecer su contraseña.');
    res.redirect('/auth/forgot-password');

  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al procesar solicitud');
    res.redirect('/auth/forgot-password');
  }
};

// Mostrar formulario de reset password
exports.mostrarResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ tokenResetPassword: token });

    if (!usuario) {
      req.flash('error', 'Token inválido o expirado');
      return res.redirect('/auth/login');
    }

    res.render('auth/reset-password', {
      layout: 'layouts/public',
      token
    });

  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar formulario');
    res.redirect('/auth/login');
  }
};

// Procesar reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmarPassword } = req.body;

    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect(`/auth/reset-password/${token}`);
    }

    const usuario = await Usuario.findOne({ tokenResetPassword: token });

    if (!usuario) {
      req.flash('error', 'Token inválido o expirado');
      return res.redirect('/auth/login');
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.tokenResetPassword = null;
    await usuario.save();

    req.flash('success', 'Contraseña actualizada exitosamente. Ya puede iniciar sesión.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error(error);
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