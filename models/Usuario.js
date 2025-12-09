const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Campos comunes para todos los roles
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false // ⚠️ CRÍTICO: Excluir password por defecto
  },
  rol: {
    type: String,
    enum: ['cliente', 'delivery', 'comercio', 'administrador'],
    required: true
  },
  activo: {
    type: Boolean,
    default: false
  },
  tokenActivacion: {
    type: String,
    default: null
  },
  tokenRecuperacion: {
    type: String,
    default: null
  },
  tokenExpiracion: {
    type: Date,
    default: null
  },

  // Campos para cliente, delivery, y administrador
  nombre: {
    type: String,
    trim: true
  },
  apellido: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  foto: {
    type: String,
    default: null
  },
  nombreUsuario: { 
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },

  // Campos específicos para comercio
  nombreComercio: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  horaApertura: {
    type: String
  },
  horaCierre: {
    type: String
  },
  tipoComercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoComercio'
  },

  // Campos específicos para delivery
  disponible: {
    type: Boolean,
    default: true
  },

  // Campos específicos para administrador
  cedula: {
    type: String,
    trim: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });
usuarioSchema.index({ nombreUsuario: 1 });

// ======================================================
// 🔑 HOOK: Hash de contraseña antes de guardar
// ======================================================
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña se ha modificado O si es un nuevo documento
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ======================================================
// 🔓 MÉTODO: Comparar contraseñas
// ======================================================
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  try {
    // El password del documento ya viene seleccionado con .select('+password')
    return await bcrypt.compare(passwordIngresado, this.password);
  } catch (error) {
    console.error('Error al comparar password:', error);
    return false;
  }
};

// ======================================================
// 🔒 MÉTODO: Datos públicos (sin contraseña)
// ======================================================
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.password;
  delete usuario.tokenActivacion;
  delete usuario.tokenRecuperacion;
  delete usuario.tokenExpiracion;
  return usuario;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;