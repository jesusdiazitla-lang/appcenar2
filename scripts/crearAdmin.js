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
      
      console.log('💡 Si quieres resetear la contraseña del admin existente:');
      console.log('   1. Elimina el usuario admin de la base de datos');
      console.log('   2. Vuelve a ejecutar este script\n');
      
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🔐 Creando administrador...');

    // ✅ Crear admin con requiereCambioPassword = true
    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sistema',
      cedula: '00000000000',
      correo: 'admin@appcenar.com',
      nombreUsuario: 'admin',
      password: 'admin123', // ← Hook pre('save') lo hashea
      rol: 'administrador',
      activo: true,
      requiereCambioPassword: true  // ✅ NUEVO: Forzar cambio de contraseña
    });

    await admin.save();

    console.log('✅ ¡Administrador creado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES DE ACCESO TEMPORAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 URL: http://localhost:8080/auth/login');
    console.log('📧 Correo: admin@appcenar.com');
    console.log('👤 Usuario: admin');
    console.log('🔑 Contraseña: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANTE:');
    console.log('   • Al iniciar sesión, se te pedirá cambiar la contraseña');
    console.log('   • No podrás acceder al sistema hasta cambiar la contraseña');
    console.log('   • Usa una contraseña segura para proteger el sistema');
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