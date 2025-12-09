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

// Helpers
hbs.registerHelper('eq', (a, b) => a == b);
hbs.registerHelper('or', (a, b) => a || b);
hbs.registerHelper('and', (a, b) => a && b);
hbs.registerHelper('not', (a) => !a);
hbs.registerHelper('json', (context) => JSON.stringify(context));
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
hbs.registerHelper('formatCurrency', (amount) =>
  `RD$${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
);

// ======================================================
// 🧩 MIDDLEWARES
// ======================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ======================================================
// 🟦 CONFIGURACIÓN DE SESIONES
// ======================================================
if (!PREVIEW) {
  // 🔵 MODO NORMAL (con MongoDB)
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.NODE_ENV === 'qa'
        ? process.env.QA_MONGODB_URI
        : process.env.DEV_MONGODB_URI,
      touchAfter: 24 * 3600
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }));
} else {
  // 🟣 MODO PREVIEW (Sin BD)
  app.use(session({
    secret: 'preview-secret',
    resave: false,
    saveUninitialized: true
  }));
  console.log("⚠ Usando MemoryStore temporal (solo para preview sin BD)");
}

// ======================================================
// 🔥 PREVIEW USER (evita errores de autenticación)
// ======================================================
/*if (PREVIEW) {
  app.use((req, res, next) => {
    // Puedes cambiar el rol para ver otros paneles:
    // "cliente" | "comercio" | "delivery" | "administrador"
    req.session.user = {
      id: "preview123",
      nombre: "Demo Comercio",
      rol: "comercio"
    };
    res.locals.isAuthenticated = true;
    res.locals.currentUser = req.session.user;
    next();
  });

  console.log("⚠ Usuario demo cargado: rol comercio");
}*/

// Flash messages
app.use(flash());

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');

  if (!PREVIEW) {
    res.locals.currentUser = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
  }

  next();
});

// ======================================================
// 📦 RUTAS
// ======================================================
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
  console.error(' Error:', err);
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
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Preview Mode: ${PREVIEW}`);
  console.log('═══════════════════════════════════════');
});
