const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  itbis: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 18 // 18% por defecto
  }
}, {
  timestamps: true
});

// Solo puede haber una configuración en el sistema
configuracionSchema.statics.obtenerConfiguracion = async function() {
  let config = await this.findOne();
  
  // Si no existe, crear una con valores por defecto
  if (!config) {
    config = await this.create({ itbis: 18 });
  }
  
  return config;
};

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

module.exports = Configuracion;