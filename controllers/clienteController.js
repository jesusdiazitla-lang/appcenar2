const Usuario = require('../models/Usuario');
const TipoComercio = require('../models/TipoComercio');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const Direccion = require('../models/Direccion');
const Favorito = require('../models/Favorito');
const Configuracion = require('../models/Configuracion');

// Mostrar home del cliente (tipos de comercios)
exports.mostrarHome = async (req, res) => {
  try {
    const tiposComercio = await TipoComercio.find();
    res.render('cliente/home', {
      layout: 'layouts/cliente',
      tiposComercio
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar tipos de comercio');
    res.redirect('/cliente/home');
  }
};

// Listar comercios por tipo
exports.listarComercios = async (req, res) => {
  try {
    const { tipoId } = req.params;
    const { busqueda } = req.query;

    let query = { rol: 'comercio', tipoComercio: tipoId, activo: true };

    if (busqueda) {
      query.nombreComercio = { $regex: busqueda, $options: 'i' };
    }

    const comercios = await Usuario.find(query).populate('tipoComercio');
    const tipoComercio = await TipoComercio.findById(tipoId);

    // Obtener favoritos del cliente
    const favoritos = await Favorito.find({ cliente: req.session.user.id });
    const favoritosIds = favoritos.map(f => f.comercio.toString());

    res.render('cliente/comercios', {
      layout: 'layouts/cliente',
      comercios,
      tipoComercio,
      cantidadComercios: comercios.length,
      favoritosIds
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar comercios');
    res.redirect('/cliente/home');
  }
};

// Mostrar catálogo de productos de un comercio
exports.mostrarCatalogo = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const comercio = await Usuario.findById(comercioId);
    
    const productos = await Producto.find({ comercio: comercioId })
      .populate('categoria')
      .sort({ categoria: 1 });

    // Agrupar productos por categoría
    const productosPorCategoria = {};
    productos.forEach(producto => {
      const categoriaNombre = producto.categoria ? producto.categoria.nombre : 'Sin categoría';
      if (!productosPorCategoria[categoriaNombre]) {
        productosPorCategoria[categoriaNombre] = [];
      }
      productosPorCategoria[categoriaNombre].push(producto);
    });

    res.render('cliente/catalogo', {
      layout: 'layouts/cliente',
      comercio,
      productosPorCategoria
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar catálogo');
    res.redirect('/cliente/home');
  }
};

// Mostrar selección de dirección para pedido
exports.seleccionarDireccion = async (req, res) => {
  try {
    const { comercioId } = req.body;
    const { productosIds } = req.body; // Array de IDs de productos

    const direcciones = await Direccion.find({ cliente: req.session.user.id });
    const comercio = await Usuario.findById(comercioId);
    const productos = await Producto.find({ _id: { $in: productosIds } });

    // Calcular subtotal
    const subtotal = productos.reduce((sum, prod) => sum + prod.precio, 0);

    // Obtener ITBIS de configuración
    const configuracion = await Configuracion.findOne();
    const itbis = configuracion ? configuracion.itbis : 18;
    const valorItbis = (subtotal * itbis) / 100;
    const total = subtotal + valorItbis;

    res.render('cliente/seleccionar-direccion', {
      layout: 'layouts/cliente',
      direcciones,
      comercio,
      productos,
      subtotal: subtotal.toFixed(2),
      itbis,
      valorItbis: valorItbis.toFixed(2),
      total: total.toFixed(2),
      productosIds: JSON.stringify(productosIds)
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al procesar pedido');
    res.redirect('/cliente/home');
  }
};

// Crear pedido
exports.crearPedido = async (req, res) => {
  try {
    const { comercioId, productosIds, direccionId } = req.body;

    const productos = await Producto.find({ _id: { $in: JSON.parse(productosIds) } });
    const direccion = await Direccion.findById(direccionId);

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

    req.flash('success', 'Pedido creado exitosamente');
    res.redirect('/cliente/pedidos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear pedido');
    res.redirect('/cliente/home');
  }
};

// Mostrar perfil del cliente
exports.mostrarPerfil = async (req, res) => {
  try {
    const cliente = await Usuario.findById(req.session.user.id);
    res.render('cliente/perfil', {
      layout: 'layouts/cliente',
      cliente
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar perfil');
    res.redirect('/cliente/home');
  }
};

// Actualizar perfil del cliente
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, telefono } = req.body;
    const updateData = { nombre, apellido, telefono };

    if (req.file) {
      updateData.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    await Usuario.findByIdAndUpdate(req.session.user.id, updateData);

    req.flash('success', 'Perfil actualizado exitosamente');
    res.redirect('/cliente/perfil');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar perfil');
    res.redirect('/cliente/perfil');
  }
};

// Listar pedidos del cliente
exports.listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find({ cliente: req.session.user.id })
      .populate('comercio')
      .populate('productos')
      .sort({ fechaHora: -1 });

    res.render('cliente/pedidos', {
      layout: 'layouts/cliente',
      pedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar pedidos');
    res.redirect('/cliente/home');
  }
};

// Mostrar detalle de un pedido
exports.mostrarDetallePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const pedido = await Pedido.findById(pedidoId)
      .populate('comercio')
      .populate('productos');

    res.render('cliente/pedido-detalle', {
      layout: 'layouts/cliente',
      pedido
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar detalle del pedido');
    res.redirect('/cliente/pedidos');
  }
};

// Listar favoritos
exports.listarFavoritos = async (req, res) => {
  try {
    const favoritos = await Favorito.find({ cliente: req.session.user.id })
      .populate('comercio');

    res.render('cliente/favoritos', {
      layout: 'layouts/cliente',
      favoritos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar favoritos');
    res.redirect('/cliente/home');
  }
};