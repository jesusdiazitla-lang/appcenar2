const Direccion = require('../models/Direccion');

// Listar direcciones
exports.listar = async (req, res) => {
  try {
    const direcciones = await Direccion.find({ cliente: req.session.user.id });

    res.render('cliente/direcciones/index', {
      layout: 'layouts/cliente',
      direcciones
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar direcciones');
    res.redirect('/cliente/home');
  }
};

// Mostrar formulario de crear dirección
exports.mostrarCrear = (req, res) => {
  // 🆕 Indicar si viene del flujo de pago
  const desdeCarrito = !!req.session.carritoTemporal;
  
  res.render('cliente/direcciones/crear', {
    layout: 'layouts/cliente',
    desdeCarrito
  });
};

// ==========================================
// MODIFICAR LA FUNCIÓN: crear
// ==========================================

exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const nuevaDireccion = new Direccion({
      nombre,
      descripcion,
      cliente: req.session.user.id
    });

    await nuevaDireccion.save();
    req.flash('success', 'Dirección creada exitosamente');

    // 🆕 VERIFICAR SI HAY UN CARRITO PENDIENTE EN SESIÓN
    if (req.session.carritoTemporal) {
      console.log('🔄 Carrito temporal encontrado, redirigiendo a selección de dirección');
      
      // Redirigir de vuelta al flujo de pago con el carrito restaurado
      return res.redirect('/cliente/restaurar-carrito');
    }

    // Si no hay carrito, ir a la lista normal de direcciones
    res.redirect('/cliente/direcciones');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear dirección');
    res.redirect('/cliente/direcciones/crear');
  }
};

// Mostrar formulario de editar dirección
exports.mostrarEditar = async (req, res) => {
  try {
    const { direccionId } = req.params;
    const direccion = await Direccion.findOne({
      _id: direccionId,
      cliente: req.session.user.id
    });

    if (!direccion) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/cliente/direcciones');
    }

    res.render('cliente/direcciones/editar', {
      layout: 'layouts/cliente',
      direccion
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar dirección');
    res.redirect('/cliente/direcciones');
  }
};

// Editar dirección
exports.editar = async (req, res) => {
  try {
    const { direccionId } = req.params;
    const { nombre, descripcion } = req.body;

    await Direccion.findOneAndUpdate(
      { _id: direccionId, cliente: req.session.user.id },
      { nombre, descripcion }
    );

    req.flash('success', 'Dirección actualizada exitosamente');
    res.redirect('/cliente/direcciones');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al editar dirección');
    res.redirect(`/cliente/direcciones/editar/${req.params.direccionId}`);
  }
};

// Mostrar confirmación de eliminar
exports.mostrarEliminar = async (req, res) => {
  try {
    const { direccionId } = req.params;
    const direccion = await Direccion.findOne({
      _id: direccionId,
      cliente: req.session.user.id
    });

    if (!direccion) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/cliente/direcciones');
    }

    res.render('cliente/direcciones/eliminar', {
      layout: 'layouts/cliente',
      direccion
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar dirección');
    res.redirect('/cliente/direcciones');
  }
};

// Eliminar dirección
exports.eliminar = async (req, res) => {
  try {
    const { direccionId } = req.params;

    await Direccion.findOneAndDelete({
      _id: direccionId,
      cliente: req.session.user.id
    });

    req.flash('success', 'Dirección eliminada exitosamente');
    res.redirect('/cliente/direcciones');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar dirección');
    res.redirect('/cliente/direcciones');
  }
};