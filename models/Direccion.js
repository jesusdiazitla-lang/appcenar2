const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas por cliente
direccionSchema.index({ cliente: 1 });

const Direccion = mongoose.model('Direccion', direccionSchema);

module.exports = Direccion;
