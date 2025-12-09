const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  direccion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Direccion',
    required: true
  },
  productos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    nombre: String,
    precio: Number,
    foto: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  itbis: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en proceso', 'completado'],
    default: 'pendiente'
  },
  fechaPedido: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
pedidoSchema.index({ cliente: 1, fechaPedido: -1 });
pedidoSchema.index({ comercio: 1, fechaPedido: -1 });
pedidoSchema.index({ delivery: 1, estado: 1 });
pedidoSchema.index({ estado: 1 });

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;