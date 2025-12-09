const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índice compuesto único para evitar duplicados
favoritoSchema.index({ cliente: 1, comercio: 1 }, { unique: true });

// Índice para búsquedas por cliente
favoritoSchema.index({ cliente: 1 });

const Favorito = mongoose.model('Favorito', favoritoSchema);

module.exports = Favorito;