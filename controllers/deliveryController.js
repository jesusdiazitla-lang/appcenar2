const Usuario = require('../models/Usuario');
const Pedido = require('../models/Pedido');

// Mostrar home del delivery (pedidos asignados)
exports.mostrarHome = async (req, res) => {
  try {
    const pedidos = await Pedido.find({ delivery: req.session.user.id })
      .populate('comercio')
      .populate('productos')
      .sort({ fechaHora: -1 });

    res.render('delivery/home', {
      layout: 'layouts/delivery',
      pedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/delivery/home');
  }
};

// Mostrar detalle de pedido
exports.mostrarDetallePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const pedido = await Pedido.findById(pedidoId)
      .populate('comercio')
      .populate('productos')
      .populate('cliente');

    res.render('delivery/pedido-detalle', {
      layout: 'layouts/delivery',
      pedido
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar detalle del pedido');
    res.redirect('/delivery/home');
  }
};

// Completar pedido
exports.completarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;

    // Actualizar estado del pedido
    await Pedido.findByIdAndUpdate(pedidoId, {
      estado: 'completado'
    });

    // Marcar delivery como disponible
    await Usuario.findByIdAndUpdate(req.session.user.id, {
      estadoDisponibilidad: 'disponible'
    });

    req.flash('success', 'Pedido completado exitosamente');
    res.redirect(`/delivery/pedido/${pedidoId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al completar pedido');
    res.redirect('/delivery/home');
  }
};

// Mostrar perfil del delivery
exports.mostrarPerfil = async (req, res) => {
  try {
    const delivery = await Usuario.findById(req.session.user.id);
    res.render('delivery/perfil', {
      layout: 'layouts/delivery',
      delivery
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar perfil');
    res.redirect('/delivery/home');
  }
};

// Actualizar perfil del delivery
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono } = req.body;
    const updateData = { nombre, apellido, telefono };

    if (req.file) {
      updateData.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    await Usuario.findByIdAndUpdate(req.session.user.id, updateData);

    req.flash('success', 'Perfil actualizado exitosamente');
    res.redirect('/delivery/perfil');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar perfil');
    res.redirect('/delivery/perfil');
  }
};