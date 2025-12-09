const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Campos comunes para todos los roles
  correo: {
    type: String,
    required: true,
    unique: true, // Define el índice único aquí
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
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
    sparse: true, // Permite nulos
    unique: true // Asegura que no haya nombres de usuario duplicados
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
    default: true // true = disponible, false = ocupado
  },

  // Campos específicos para administrador (mantenidos solo si son relevantes)
  cedula: {
    type: String,
    trim: true,
    sparse: true // Permite nulos
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });
usuarioSchema.index({ nombreUsuario: 1 }); // Índice para el campo renombrado

// ======================================================
// 🔑 HOOK CORREGIDO: Hash de contraseña antes de guardar
// ======================================================
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña se ha modificado O si es un nuevo documento
  if (!this.isModified('password') && !this.isNew) {
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

// Método para comparar contraseñas
// models/Usuario.js (SOLO REEMPLAZAR esta sección)

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
    console.log("=======================================");
    console.log("DEBUG LOGIN: COMPARANDO CONTRASEÑAS");
    console.log(`Hash de la DB: ${this.password}`);
    console.log(`Contraseña Ingresada: ${passwordIngresado}`);
    
    // Ejecutar la comparación
    const match = await bcrypt.compare(passwordIngresado, this.password);
    
    console.log(`Resultado de bcrypt.compare: ${match}`);
    console.log("=======================================");
    
    return match;
};

// Método para obtener datos públicos del usuario (sin contraseña)
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