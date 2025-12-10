require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function migrarLogoComercio() {
  try {
    console.log('🚀 Iniciando migración de logos de comercio...\n');

    // Conectar a MongoDB
    const mongoUri = process.env.NODE_ENV === 'qa' 
      ? process.env.QA_MONGODB_URI 
      : process.env.DEV_MONGODB_URI;
    
    console.log(`📡 Conectando a MongoDB (${process.env.NODE_ENV || 'development'})...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todos los comercios que tengan el campo 'logo' en lugar de 'logoComercio'
    const comercios = await Usuario.find({ rol: 'comercio' });
    
    console.log(`📊 Se encontraron ${comercios.length} comercios\n`);

    let comerciosActualizados = 0;
    let comerciosSinLogo = 0;

    for (const comercio of comercios) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🏪 ${comercio.nombreComercio}`);
      console.log(`   ID: ${comercio._id}`);
      
      // Acceder al documento raw para ver campos que no están en el schema
      const rawDoc = await mongoose.connection.collection('usuarios').findOne({ _id: comercio._id });
      
      if (rawDoc.logo && !rawDoc.logoComercio) {
        console.log(`   ⚠️  Tiene campo 'logo': ${rawDoc.logo}`);
        console.log(`   🔄 Migrando a 'logoComercio'...`);
        
        // Actualizar: renombrar 'logo' a 'logoComercio'
        await mongoose.connection.collection('usuarios').updateOne(
          { _id: comercio._id },
          { 
            $rename: { logo: 'logoComercio' }
          }
        );
        
        console.log(`   ✅ Migrado exitosamente`);
        comerciosActualizados++;
      } else if (rawDoc.logoComercio) {
        console.log(`   ✅ Ya tiene 'logoComercio': ${rawDoc.logoComercio}`);
      } else {
        console.log(`   ℹ️  No tiene logo registrado`);
        comerciosSinLogo++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMEN DE MIGRACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total de comercios: ${comercios.length}`);
    console.log(`   Comercios migrados: ${comerciosActualizados}`);
    console.log(`   Comercios sin logo: ${comerciosSinLogo}`);
    console.log(`   Ya actualizados: ${comercios.length - comerciosActualizados - comerciosSinLogo}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (comerciosActualizados > 0) {
      console.log('✅ Migración completada exitosamente');
    } else {
      console.log('ℹ️  No se requirieron cambios');
    }
    
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
migrarLogoComercio();