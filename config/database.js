require('dotenv').config();
const mongoose = require('mongoose');

const env = process.env.NODE_ENV || 'development';

let MONGODB_URI;

if (env === 'qa') {
  MONGODB_URI = process.env.QA_MONGODB_URI;
} else if (env === 'production') {
  MONGODB_URI = process.env.PROD_MONGODB_URI;
} else {
  MONGODB_URI = process.env.DEV_MONGODB_URI;
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✓ MongoDB conectado exitosamente [${env}]`);
    console.log(`✓ Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
