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

// Listar comercios por tipo - FUNCIÓN ACTUALIZADA ✨
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

    // 🆕 Obtener imagen destacada de cada comercio
    const comerciosConImagen = await Promise.all(
      comercios.map(async (comercio) => {
        const productoDestacado = await Producto.findOne({ comercio: comercio._id }).limit(1);
        return {
          ...comercio.toObject(),
          imagenDestacada: productoDestacado ? productoDestacado.imagen : null
        };
      })
    );

    console.log('📋 Debug listarComercios:');
    console.log('   - Total comercios:', comercios.length);
    console.log('   - Total favoritos:', favoritos.length);
    console.log('   - IDs de favoritos:', favoritosIds);

    res.render('cliente/comercios', {
      layout: 'layouts/cliente',
      comercios: comerciosConImagen, // 🆕 Usar comerciosConImagen
      tipoComercio,
      cantidadComercios: comercios.length,
      favoritosIds,
      busqueda
    });
  } catch (error) {
    console.error('❌ Error en listarComercios:', error);
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
    const { comercioId, productosIds } = req.body;

    console.log('🛒 Debug seleccionarDireccion:');
    console.log('   - comercioId:', comercioId);
    console.log('   - productosIds recibido:', productosIds);
    console.log('   - Tipo:', typeof productosIds);

    // Parsear productosIds si viene como string JSON
    let idsArray;
    if (typeof productosIds === 'string') {
      try {
        idsArray = JSON.parse(productosIds);
      } catch (e) {
        console.error('❌ Error al parsear productosIds:', e);
        req.flash('error', 'Error al procesar los productos seleccionados');
        return res.redirect(`/cliente/catalogo/${comercioId}`);
      }
    } else if (Array.isArray(productosIds)) {
      idsArray = productosIds;
    } else {
      console.error('❌ productosIds no es un array ni string');
      req.flash('error', 'No se seleccionaron productos');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

    console.log('   - IDs parseados:', idsArray);

    if (!idsArray || idsArray.length === 0) {
      req.flash('error', 'No se seleccionaron productos');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

    const direcciones = await Direccion.find({ cliente: req.session.user.id });
    const comercio = await Usuario.findById(comercioId);
    const productos = await Producto.find({ _id: { $in: idsArray } });

    console.log('   - Productos encontrados:', productos.length);

    if (productos.length === 0) {
      req.flash('error', 'No se encontraron los productos seleccionados');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

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
      productosIds: JSON.stringify(idsArray)
    });
  } catch (error) {
    console.error('❌ Error en seleccionarDireccion:', error);
    req.flash('error', 'Error al procesar pedido');
    res.redirect('/cliente/home');
  }
};

// Crear pedido
exports.crearPedido = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📦 INICIANDO CREACIÓN DE PEDIDO');
    console.log('='.repeat(50));
    
    const { comercioId, productosIds, direccionId } = req.body;

    console.log('📥 Datos recibidos:');
    console.log('   - Body completo:', JSON.stringify(req.body, null, 2));
    console.log('   - comercioId:', comercioId);
    console.log('   - productosIds:', productosIds);
    console.log('   - direccionId:', direccionId);
    console.log('   - Usuario sesión:', req.session.user.id);

    // Validar que vengan todos los datos
    if (!comercioId) {
      console.error('❌ Falta comercioId');
      req.flash('error', 'Falta información del comercio');
      return res.redirect('/cliente/home');
    }

    if (!productosIds) {
      console.error('❌ Falta productosIds');
      req.flash('error', 'No se seleccionaron productos');
      return res.redirect('/cliente/home');
    }

    if (!direccionId) {
      console.error('❌ Falta direccionId');
      req.flash('error', 'Debe seleccionar una dirección de entrega');
      return res.redirect('/cliente/home');
    }

    // Parsear productosIds
    let idsArray;
    try {
      idsArray = JSON.parse(productosIds);
      console.log('✅ productosIds parseado:', idsArray);
    } catch (e) {
      console.error('❌ Error al parsear productosIds:', e);
      req.flash('error', 'Error al procesar los productos');
      return res.redirect('/cliente/home');
    }

    if (!Array.isArray(idsArray) || idsArray.length === 0) {
      console.error('❌ productosIds no es un array válido:', idsArray);
      req.flash('error', 'No hay productos válidos');
      return res.redirect('/cliente/home');
    }

    // Buscar productos
    console.log('🔍 Buscando productos con IDs:', idsArray);
    const productos = await Producto.find({ _id: { $in: idsArray } });
    console.log('✅ Productos encontrados:', productos.length);
    
    if (productos.length === 0) {
      console.error('❌ No se encontraron productos');
      req.flash('error', 'No se encontraron los productos');
      return res.redirect('/cliente/home');
    }

    // Buscar dirección
    console.log('🔍 Buscando dirección:', direccionId);
    const direccion = await Direccion.findById(direccionId);
    
    if (!direccion) {
      console.error('❌ Dirección no encontrada');
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/cliente/direcciones');
    }
    console.log('✅ Dirección encontrada:', direccion.nombre);

    // Verificar comercio
    console.log('🔍 Verificando comercio:', comercioId);
    const comercio = await Usuario.findById(comercioId);
    if (!comercio) {
      console.error('❌ Comercio no encontrado');
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/cliente/home');
    }
    console.log('✅ Comercio encontrado:', comercio.nombreComercio);

    // Calcular valores
    const subtotal = productos.reduce((sum, prod) => sum + prod.precio, 0);
    const configuracion = await Configuracion.findOne();
    const itbis = configuracion ? configuracion.itbis : 18;
    const valorItbis = (subtotal * itbis) / 100;
    const total = subtotal + valorItbis;

    console.log('💰 Cálculos:');
    console.log('   - Subtotal:', subtotal);
    console.log('   - ITBIS ('+itbis+'%):', valorItbis);
    console.log('   - Total:', total);

    // Preparar productos con snapshot de información
    const productosSnapshot = productos.map(p => ({
      producto: p._id,
      nombre: p.nombre,
      precio: p.precio,
      foto: p.imagen
    }));

    console.log('📸 Snapshot de productos:', productosSnapshot);

    // Crear objeto de pedido
    const pedidoData = {
      cliente: req.session.user.id,
      comercio: comercioId,
      delivery: null,
      direccion: direccionId,
      productos: productosSnapshot,
      subtotal: subtotal,
      itbis: valorItbis,
      total: total,
      estado: 'pendiente',
      fechaPedido: new Date()
    };

    console.log('📋 Objeto de pedido a guardar:');
    console.log(JSON.stringify(pedidoData, null, 2));

    // Crear y guardar pedido
    const nuevoPedido = new Pedido(pedidoData);
    
    console.log('💾 Guardando pedido en la base de datos...');
    const pedidoGuardado = await nuevoPedido.save();
    
    console.log('='.repeat(50));
    console.log('✅ PEDIDO CREADO EXITOSAMENTE');
    console.log('   ID del pedido:', pedidoGuardado._id);
    console.log('   Estado:', pedidoGuardado.estado);
    console.log('='.repeat(50));

    req.flash('success', '¡Pedido realizado exitosamente! ID: ' + pedidoGuardado._id);
    res.redirect('/cliente/pedidos');
    
  } catch (error) {
    console.error('='.repeat(50));
    console.error('❌ ERROR AL CREAR PEDIDO');
    console.error('='.repeat(50));
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('Nombre del error:', error.name);
    
    if (error.name === 'ValidationError') {
      console.error('Errores de validación:', error.errors);
    }
    
    console.error('='.repeat(50));
    
    req.flash('error', 'Error al crear pedido: ' + error.message);
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
    res.redirect('/cliente/home');
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