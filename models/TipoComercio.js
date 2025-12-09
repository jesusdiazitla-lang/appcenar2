const mongoose = require('mongoose');

const tipoComercioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  icono: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Virtual para contar comercios de este tipo
tipoComercioSchema.virtual('cantidadComercios', {
  ref: 'Usuario',
  localField: '_id',
  foreignField: 'tipoComercio',
  count: true
});

// Asegurar que los virtuals se incluyan en JSON
tipoComercioSchema.set('toJSON', { virtuals: true });
tipoComercioSchema.set('toObject', { virtuals: true });

const TipoComercio = mongoose.model('TipoComercio', tipoComercioSchema);

module.exports = TipoComercio;