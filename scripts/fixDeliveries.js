require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function fixDeliveries() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    
    const mongoUri = process.env.NODE_ENV === 'qa' 
      ? process.env.QA_MONGODB_URI 
      : process.env.DEV_MONGODB_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todos los deliveries
    const deliveries = await Usuario.find({ rol: 'delivery' });
    
    console.log(`📊 Se encontraron ${deliveries.length} deliveries\n`);

    for (const delivery of deliveries) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 ${delivery.nombre} ${delivery.apellido}`);
      console.log(`   ID: ${delivery._id}`);
      console.log(`   Usuario: ${delivery.nombreUsuario}`);
      console.log(`   Activo: ${delivery.activo}`);
      console.log(`   Estado actual disponibilidad: ${delivery.estadoDisponibilidad || delivery.disponible || 'NO DEFINIDO'}`);

      // Si tiene el campo viejo 'disponible', migrar al nuevo
      const nuevoEstado = delivery.disponible === false ? 'ocupado' : 'disponible';
      
      await Usuario.findByIdAndUpdate(delivery._id, {
        $set: { estadoDisponibilidad: nuevoEstado },
        $unset: { disponible: 1 } // Eliminar el campo viejo
      });

      console.log(`   ✅ Actualizado a: ${nuevoEstado}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Todos los deliveries han sido actualizados');
    
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

fixDeliveries();