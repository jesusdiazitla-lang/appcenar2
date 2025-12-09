const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
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
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  imagen: {  // <- Cambié de 'foto' a 'imagen' según tu vista
    type: String,
    required: true
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
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

// Índices para búsquedas eficientes
productoSchema.index({ comercio: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ nombre: 1 });

// Exportar el modelo verificando si ya existe
module.exports = mongoose.models.Producto || mongoose.model('Producto', productoSchema);