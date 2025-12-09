const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.NODE_ENV === 'qa' 
      ? process.env.QA_MONGODB_URI 
      : process.env.DEV_MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update (24 horas en segundos)
    crypto: {
      secret: process.env.SESSION_SECRET
    }
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    httpOnly: true, // No accesible desde JavaScript (protección XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'lax' // Protección CSRF
  },
  name: 'appcenar.sid' // Nombre personalizado de la cookie de sesión
};

module.exports = sessionConfig;