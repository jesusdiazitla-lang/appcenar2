const Usuario = require('../models/Usuario');
const Pedido = require('../models/Pedido');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

// Mostrar home del comercio (listado de pedidos)
exports.mostrarHome = async (req, res) => {
  try {
    const pedidos = await Pedido.find({ comercio: req.session.user.id })
      .populate('cliente')
      .populate('productos')
      .populate('delivery')
      .sort({ fechaHora: -1 });

    res.render('comercio/home', {
      layout: 'layouts/comercio',
      pedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/comercio/home');
  }
};

// Mostrar detalle de pedido
exports.mostrarDetallePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('comercio')
      .populate('productos.producto')
      .populate('direccion')  // ✅ Populate de la dirección
      .populate('delivery');

    if (!pedido) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/comercio/home');
    }

    // ✅ CORREGIDO: Usar layout de comercio
    res.render('comercio/pedido-detalle', {
      layout: 'layouts/comercio',
      pedido
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar detalle del pedido');
    res.redirect('/comercio/home');
  }
};
// Asignar delivery a pedido
// Asignar delivery a pedido
exports.asignarDelivery = async (req, res) => {
  try {
    const { pedidoId } = req.params;

    console.log('🚚 Asignando delivery al pedido:', pedidoId);

    // Buscar delivery disponible
    const deliveryDisponible = await Usuario.findOne({
      rol: 'delivery',
      estadoDisponibilidad: 'disponible',
      activo: true
    });

    if (!deliveryDisponible) {
      req.flash('error', 'No hay delivery disponible en este momento. Intente más tarde.');
      return res.redirect(`/comercio/pedido/${pedidoId}`);
    }

    console.log('✅ Delivery encontrado:', deliveryDisponible.nombre);

    // Actualizar pedido
    await Pedido.findByIdAndUpdate(pedidoId, {
      delivery: deliveryDisponible._id,
      estado: 'en proceso'
    });

    // Marcar delivery como ocupado
    await Usuario.findByIdAndUpdate(deliveryDisponible._id, {
      estadoDisponibilidad: 'ocupado'
    });

    console.log('✅ Pedido actualizado a "en proceso"');

    req.flash('success', `Delivery ${deliveryDisponible.nombre} ${deliveryDisponible.apellido} asignado exitosamente`);
    
    // ✅ CORRECCIÓN: Redirigir a la vista del COMERCIO, NO del delivery
    res.redirect(`/comercio/pedido/${pedidoId}`);
    
  } catch (error) {
    console.error('❌ Error al asignar delivery:', error);
    req.flash('error', 'Error al asignar delivery');
    res.redirect('/comercio/home');
  }
};

// Mostrar perfil del comercio
exports.mostrarPerfil = async (req, res) => {
  try {
    const comercio = await Usuario.findById(req.session.user.id);
    res.render('comercio/perfil', {
      layout: 'layouts/comercio',
      comercio
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar perfil');
    res.redirect('/comercio/home');
  }
};

// Actualizar perfil del comercio
exports.actualizarPerfil = async (req, res) => {
  try {
    const { telefono, correo, horaApertura, horaCierre } = req.body;
    const updateData = { telefono, correo, horaApertura, horaCierre };

    if (req.file) {
      updateData.logoComercio = `/uploads/${req.file.filename}`;
    }

    await Usuario.findByIdAndUpdate(req.session.user.id, updateData);

    req.flash('success', 'Perfil actualizado exitosamente');
    res.redirect('/comercio/perfil');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar perfil');
    res.redirect('/comercio/perfil');
  }
};