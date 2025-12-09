const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
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
  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar categorías duplicadas por comercio
categoriaSchema.index({ nombre: 1, comercio: 1 }, { unique: true });

// Virtual para contar productos de esta categoría
categoriaSchema.virtual('cantidadProductos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'categoria',
  count: true
});

categoriaSchema.set('toJSON', { virtuals: true });
categoriaSchema.set('toObject', { virtuals: true });

const Categoria = mongoose.model('Categoria', categoriaSchema);

module.exports = Categoria;