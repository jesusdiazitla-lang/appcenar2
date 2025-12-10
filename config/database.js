require('dotenv').config();
const mongoose = require('mongoose');

const env = process.env.NODE_ENV || 'development';

// ✅ Determinar la URL de MongoDB según el entorno
let MONGODB_URI;

if (env === 'production') {
  // Railway u otro servicio en producción
  MONGODB_URI = process.env.MONGODB_URI;
} else if (env === 'qa') {
  MONGODB_URI = process.env.QA_MONGODB_URI;
} else {
  MONGODB_URI = process.env.DEV_MONGODB_URI;
}

console.log('🔍 Configuración de Base de Datos:');
console.log('   - Entorno:', env);
console.log('   - MongoDB URI:', MONGODB_URI ? '✅ Configurada' : '❌ No encontrada');

const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      console.error('❌ ERROR CRÍTICO: No se encontró MONGODB_URI');
      console.error('   Variables de entorno disponibles:');
      console.error('   -', Object.keys(process.env).filter(k => k.includes('MONGO')).join(', '));
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
    });
    
    console.log(`✅ MongoDB conectado exitosamente [${env}]`);
    console.log(`   Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('   Detalles del error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;