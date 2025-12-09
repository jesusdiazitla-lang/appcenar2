require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function crearAdminInicial() {
  try {
    console.log('🚀 Iniciando creación de administrador...\n');

    // Conectar a MongoDB
    const mongoUri = process.env.NODE_ENV === 'qa' 
      ? process.env.QA_MONGODB_URI 
      : process.env.DEV_MONGODB_URI;
    
    console.log(`📡 Conectando a MongoDB (${process.env.NODE_ENV || 'development'})...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya existe un admin
    const adminExistente = await Usuario.findOne({ rol: 'administrador' });
    
    if (adminExistente) {
      console.log('⚠️  Ya existe un administrador en el sistema:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 Nombre: ${adminExistente.nombre} ${adminExistente.apellido}`);
      console.log(`📧 Correo: ${adminExistente.correo}`);
      console.log(`🔑 Usuario: ${adminExistente.nombreUsuario}`);
      console.log(`✅ Estado: ${adminExistente.activo ? 'Activo' : 'Inactivo'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Preguntar si quiere actualizar la contraseña
      console.log('💡 Si quieres resetear la contraseña del admin existente:');
      console.log('   1. Elimina el usuario admin de la base de datos');
      console.log('   2. Vuelve a ejecutar este script\n');
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // ⚠️ CRÍTICO: NO HASHEAR AQUÍ - EL HOOK DEL MODELO LO HACE
    console.log('🔐 Creando administrador...');

    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sistema',
      cedula: '00000000000',
      correo: 'admin@appcenar.com',
      nombreUsuario: 'admin',
      password: 'admin123', // ← En texto plano, el hook pre('save') lo hashea
      rol: 'administrador',
      activo: true // ← Ya activo, no necesita email de activación
    });

    await admin.save(); // ← Aquí el hook pre('save') hashea la contraseña

    console.log('✅ ¡Administrador creado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 URL: http://localhost:8080/auth/login');
    console.log('📧 Correo: admin@appcenar.com');
    console.log('👤 Usuario: admin');
    console.log('🔑 Contraseña: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE:');
    console.log('   • Cambia esta contraseña después del primer login');
    console.log('   • Guarda estas credenciales en un lugar seguro');
    console.log('   • Crea tipos de comercio antes de registrar comercios\n');

    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📝 Detalles del error:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
crearAdminInicial();