require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const connectDB = require('./config/database');
const checkPasswordChange = require('./middleware/checkPasswordChange');  // ✅ NUEVO

const app = express();
const PORT = process.env.PORT || 8080;
const PREVIEW = process.env.PREVIEW_MODE === 'true';

// ======================================================
// 🔌 CONEXIÓN A MONGODB (desactivada en modo preview)
// ======================================================
if (!PREVIEW) {
  connectDB();
} else {
  console.log("⚠ MODO PREVIEW ACTIVADO — No se conectará a MongoDB.");
}

// ======================================================
// ⚙️ CONFIGURACIÓN DE HANDLEBARS
// ======================================================
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// ========== HELPERS DE HANDLEBARS ==========
hbs.registerHelper('eq', (a, b) => a == b);
hbs.registerHelper('or', (a, b) => a || b);
hbs.registerHelper('and', (a, b) => a && b);
hbs.registerHelper('not', (a) => !a);
hbs.registerHelper('json', (context) => JSON.stringify(context));
hbs.registerHelper('includes', function(array, value) {
  if (!Array.isArray(array)) return false;
  return array.includes(value.toString());
});
hbs.registerHelper('formatDate', function (date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});
hbs.registerHelper('formatCurrency', (amount) => {
  if (!amount && amount !== 0) return 'RD$ 0.00';
  return `RD$${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
});
hbs.registerHelper('subtract', (a, b) => Number(a) - Number(b));
hbs.registerHelper('add', (a, b) => Number(a) + Number(b));
hbs.registerHelper('multiply', (a, b) => Number(a) * Number(b));
hbs.registerHelper('divide', (a, b) => {
  if (b === 0) return 0;
  return Number(a) / Number(b);
});
hbs.registerHelper('toString', function(value) {
  if (!value) return '';
  return value.toString();
});

console.log('✅ Helpers de Handlebars registrados correctamente');

// ======================================================
// 🧩 MIDDLEWARES
// ======================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ========== CONFIGURACIÓN DE SESIONES ==========
if (!PREVIEW) {
  // ✅ Determinar la URL de MongoDB según el entorno
  const mongoUrl = process.env.NODE_ENV === 'production' 
    ? process.env.MONGODB_URI  // Railway/Producción
    : process.env.NODE_ENV === 'qa' 
      ? process.env.QA_MONGODB_URI 
      : process.env.DEV_MONGODB_URI;

  console.log('🔍 Configuración de sesión:');
  console.log('   - Entorno:', process.env.NODE_ENV || 'development');
  console.log('   - MongoDB URL:', mongoUrl ? '✅ Configurada' : '❌ No encontrada');

  if (!mongoUrl) {
    console.error('❌ ERROR: No se encontró MONGODB_URI en las variables de entorno');
    console.error('   Variables disponibles:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    process.exit(1);
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUrl,
      touchAfter: 24 * 3600,
      ttl: 7 * 24 * 60 * 60 // 7 días
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }));

  console.log('✅ Sesiones configuradas con MongoDB Store');
} else {
  app.use(session({
    secret: 'preview-secret',
    resave: false,
    saveUninitialized: true
  }));
  console.log("⚠ Usando MemoryStore temporal (solo para preview sin BD)");
}

// ========== FLASH MESSAGES ==========
app.use(flash());

// ========== VARIABLES GLOBALES PARA VISTAS ==========
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');

  res.locals.currentUser = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;

  console.log('🔍 Middleware variables globales:');
  console.log('   - Usuario en sesión:', req.session?.user?.rol || 'Ninguno');
  console.log('   - isAuthenticated:', res.locals.isAuthenticated);

  next();
});

// ✅ NUEVO: Middleware para verificar cambio de contraseña (ANTES de las rutas)
app.use(checkPasswordChange);

// ========== RUTAS ==========
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const comercioRoutes = require('./routes/comercioRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/auth', authRoutes);
app.use('/cliente', clienteRoutes);
app.use('/comercio', comercioRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  if (req.session.user) {
    switch (req.session.user.rol) {
      case 'cliente':
        return res.redirect('/cliente/home');
      case 'comercio':
        return res.redirect('/comercio/home');
      case 'delivery':
        return res.redirect('/delivery/home');
      case 'administrador':
        return res.redirect('/admin/dashboard');
    }
  }
  res.redirect('/auth/login');
});

// ======================================================
// ❌ ERROR 404
// ======================================================
app.use((req, res) => {
  res.status(404).render('errors/404', {
    layout: 'layouts/public',
    title: 'Página no encontrada'
  });
});

// ❗ ERROR 500
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).render('errors/500', {
    layout: 'layouts/public',
    title: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ======================================================
// 🚀 INICIAR SERVIDOR
// ======================================================
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`  AppCenar corriendo en http://localhost:${PORT}`);
  console.log(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Preview Mode: ${PREVIEW}`);
  console.log('═══════════════════════════════════════');
});