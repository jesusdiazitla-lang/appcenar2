const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Direccion = require('../models/Direccion');
const Configuracion = require('../models/Configuracion');

// Crear pedido (usado por cliente)
exports.crear = async (req, res) => {
  try {
    const { comercioId, productosIds, direccionId } = req.body;

    // Parsear productosIds si viene como string JSON
    const productosArray = typeof productosIds === 'string' 
      ? JSON.parse(productosIds) 
      : productosIds;

    const productos = await Producto.find({ _id: { $in: productosArray } });
    const direccion = await Direccion.findById(direccionId);

    if (!direccion) {
      req.flash('error', 'Debe seleccionar una dirección de entrega');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

    // Calcular valores
    const subtotal = productos.reduce((sum, prod) => sum + prod.precio, 0);
    const configuracion = await Configuracion.findOne();
    const itbis = configuracion ? configuracion.itbis : 18;
    const total = subtotal + (subtotal * itbis / 100);

    // Crear pedido
    const nuevoPedido = new Pedido({
      cliente: req.session.user.id,
      comercio: comercioId,
      productos: productos.map(p => p._id),
      direccionEntrega: direccion.descripcion,
      subtotal,
      total,
      estado: 'pendiente'
    });

    await nuevoPedido.save();

    req.flash('success', 'Pedido realizado exitosamente');
    res.redirect('/cliente/pedidos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear pedido');
    res.redirect('/cliente/home');
  }
};

// Obtener detalle de pedido
exports.obtenerDetalle = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const pedido = await Pedido.findById(pedidoId)
      .populate('cliente')
      .populate('comercio')
      .populate('productos')
      .populate('delivery');

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// Asignar delivery a pedido (usado por comercio)
exports.asignarDelivery = async (req, res) => {
  try {
    const { pedidoId } = req.params;

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

    // Actualizar pedido
    await Pedido.findByIdAndUpdate(pedidoId, {
      delivery: deliveryDisponible._id,
      estado: 'en proceso'
    });

    // Marcar delivery como ocupado
    await Usuario.findByIdAndUpdate(deliveryDisponible._id, {
      estadoDisponibilidad: 'ocupado'
    });

    req.flash('success', 'Delivery asignado exitosamente');
    res.redirect(`/comercio/pedido/${pedidoId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al asignar delivery');
    res.redirect('/comercio/home');
  }
};

// Completar pedido (usado por delivery)
exports.completar = async (req, res) => {
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

// Listar pedidos por rol
exports.listarPorRol = async (req, res) => {
  try {
    const rol = req.session.user.rol;
    let query = {};

    switch(rol) {
      case 'cliente':
        query = { cliente: req.session.user.id };
        break;
      case 'comercio':
        query = { comercio: req.session.user.id };
        break;
      case 'delivery':
        query = { delivery: req.session.user.id };
        break;
      default:
        return res.status(403).json({ error: 'No autorizado' });
    }

    const pedidos = await Pedido.find(query)
      .populate('cliente')
      .populate('comercio')
      .populate('productos')
      .populate('delivery')
      .sort({ fechaHora: -1 });

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar pedidos' });
  }
};