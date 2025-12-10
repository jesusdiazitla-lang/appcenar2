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

    // Obtener imagen destacada de cada comercio
    const comerciosConImagen = await Promise.all(
      comercios.map(async (comercio) => {
        const productoDestacado = await Producto.findOne({ comercio: comercio._id }).limit(1);
        return {
          ...comercio.toObject(),
          imagenDestacada: productoDestacado ? productoDestacado.imagen : null
        };
      })
    );

    res.render('cliente/comercios', {
      layout: 'layouts/cliente',
      comercios: comerciosConImagen,
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

// ==========================================
// FUNCIÓN CRÍTICA CORREGIDA: seleccionarDireccion
// ==========================================
exports.seleccionarDireccion = async (req, res) => {
  try {
    const { comercioId, productosIds } = req.body;

    console.log('🛒 Debug seleccionarDireccion:');
    console.log('   - comercioId:', comercioId);
    console.log('   - productosIds recibido:', productosIds);

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

    if (!idsArray || idsArray.length === 0) {
      req.flash('error', 'No se seleccionaron productos');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

    // Guardar carrito en sesión
    req.session.carritoTemporal = {
      comercioId,
      productosIds: idsArray,
      timestamp: new Date()
    };

    console.log('💾 Carrito guardado en sesión:', req.session.carritoTemporal);

    const direcciones = await Direccion.find({ cliente: req.session.user.id });
    const comercio = await Usuario.findById(comercioId);

    // ✅ CORRECCIÓN CRÍTICA: Obtener IDs únicos y contar cantidades
    const productosUnicos = [...new Set(idsArray)];
    const productos = await Producto.find({ _id: { $in: productosUnicos } });

    if (productos.length === 0) {
      req.flash('error', 'No se encontraron los productos seleccionados');
      return res.redirect(`/cliente/catalogo/${comercioId}`);
    }

    // ✅ Contar cantidades y agregar al producto
    const productosConCantidad = productos.map(producto => {
      const cantidad = idsArray.filter(id => id === producto._id.toString()).length;
      return {
        ...producto.toObject(),
        cantidad,
        subtotalItem: producto.precio * cantidad
      };
    });

    // Calcular subtotal REAL con cantidades
    const subtotal = productosConCantidad.reduce((sum, prod) => sum + prod.subtotalItem, 0);

    // Obtener ITBIS de configuración
    const configuracion = await Configuracion.findOne();
    const itbis = configuracion ? configuracion.itbis : 18;
    const valorItbis = (subtotal * itbis) / 100;
    const total = subtotal + valorItbis;

    console.log('📊 Resumen del pedido:');
    console.log('   - Productos únicos:', productosConCantidad.length);
    console.log('   - Total items:', idsArray.length);
    console.log('   - Subtotal:', subtotal.toFixed(2));
    console.log('   - ITBIS:', valorItbis.toFixed(2));
    console.log('   - Total:', total.toFixed(2));

    res.render('cliente/seleccionar-direccion', {
      layout: 'layouts/cliente',
      direcciones,
      comercio,
      productos: productosConCantidad, // ✅ Enviar productos con cantidad
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

// ==========================================
// Restaurar carrito desde sesión
// ==========================================
exports.restaurarCarrito = async (req, res) => {
  try {
    // Verificar si hay un carrito en sesión
    if (!req.session.carritoTemporal) {
      req.flash('warning', 'No hay un pedido pendiente');
      return res.redirect('/cliente/home');
    }

    const { comercioId, productosIds } = req.session.carritoTemporal;

    console.log('🔄 Restaurando carrito desde sesión');
    console.log('   - Comercio:', comercioId);
    console.log('   - Productos:', productosIds);

    // Redirigir al flujo normal de selección de dirección
    req.body = {
      comercioId,
      productosIds: JSON.stringify(productosIds)
    };

    return exports.seleccionarDireccion(req, res);
  } catch (error) {
    console.error('❌ Error al restaurar carrito:', error);
    req.flash('error', 'Error al restaurar el pedido');
    res.redirect('/cliente/home');
  }
};

// ==========================================
// FUNCIÓN CRÍTICA CORREGIDA: crearPedido
// ==========================================
exports.crearPedido = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📦 INICIANDO CREACIÓN DE PEDIDO');
    console.log('='.repeat(50));
    
    const { comercioId, productosIds, direccionId } = req.body;

    console.log('📥 Datos recibidos:', { comercioId, productosIds, direccionId });

    // Validaciones
    if (!comercioId || !productosIds || !direccionId) {
      console.error('❌ Faltan datos requeridos');
      req.flash('error', 'Faltan datos para crear el pedido');
      return res.redirect('/cliente/home');
    }

    // Parsear productosIds
    let idsArray;
    try {
      idsArray = JSON.parse(productosIds);
      console.log('✅ productosIds parseado:', idsArray);
      console.log('   - Total items en el pedido:', idsArray.length);
    } catch (e) {
      console.error('❌ Error al parsear productosIds:', e);
      req.flash('error', 'Error al procesar los productos');
      return res.redirect('/cliente/home');
    }

    if (!Array.isArray(idsArray) || idsArray.length === 0) {
      console.error('❌ productosIds no es válido:', idsArray);
      req.flash('error', 'No hay productos válidos');
      return res.redirect('/cliente/home');
    }

    // ✅ CORRECCIÓN CRÍTICA: Obtener productos únicos
    const productosUnicos = [...new Set(idsArray)];
    const productos = await Producto.find({ _id: { $in: productosUnicos } });
    
    if (productos.length === 0) {
      req.flash('error', 'No se encontraron los productos');
      return res.redirect('/cliente/home');
    }

    console.log('✅ Productos únicos encontrados:', productos.length);

    // Buscar dirección
    const direccion = await Direccion.findById(direccionId);
    if (!direccion) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/cliente/direcciones');
    }

    // Verificar comercio
    const comercio = await Usuario.findById(comercioId);
    if (!comercio) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/cliente/home');
    }

    // ✅ Calcular valores con cantidades
    let subtotal = 0;
    const productosSnapshot = [];

    productos.forEach(producto => {
      // Contar cuántas veces aparece este producto en el array
      const cantidad = idsArray.filter(id => id === producto._id.toString()).length;
      const subtotalItem = producto.precio * cantidad;
      
      console.log(`   - ${producto.nombre}: ${cantidad}x @ ${producto.precio} = ${subtotalItem}`);
      
      subtotal += subtotalItem;

      // ✅ Agregar cada unidad como un item separado en el snapshot
      for (let i = 0; i < cantidad; i++) {
        productosSnapshot.push({
          producto: producto._id,
          nombre: producto.nombre,
          precio: producto.precio,
          foto: producto.imagen
        });
      }
    });

    const configuracion = await Configuracion.findOne();
    const itbis = configuracion ? configuracion.itbis : 18;
    const valorItbis = (subtotal * itbis) / 100;
    const total = subtotal + valorItbis;

    console.log('📊 Cálculos finales:');
    console.log('   - Subtotal:', subtotal.toFixed(2));
    console.log('   - ITBIS (' + itbis + '%):', valorItbis.toFixed(2));
    console.log('   - Total:', total.toFixed(2));
    console.log('   - Items en snapshot:', productosSnapshot.length);

    // Crear pedido
    const pedidoData = {
      cliente: req.session.user.id,
      comercio: comercioId,
      delivery: null,
      direccion: direccionId,
      productos: productosSnapshot, // ✅ Ahora incluye todas las unidades
      subtotal: subtotal,
      itbis: valorItbis,
      total: total,
      estado: 'pendiente',
      fechaPedido: new Date()
    };

    const nuevoPedido = new Pedido(pedidoData);
    const pedidoGuardado = await nuevoPedido.save();
    
    console.log('✅ PEDIDO CREADO:', pedidoGuardado._id);
    console.log('   - Total de productos guardados:', pedidoGuardado.productos.length);

    // Limpiar carrito temporal de la sesión
    if (req.session.carritoTemporal) {
      delete req.session.carritoTemporal;
      console.log('🧹 Carrito temporal eliminado de la sesión');
    }

    req.flash('success', '¡Pedido realizado exitosamente! ID: ' + pedidoGuardado._id);
    res.redirect('/cliente/pedidos');
    
  } catch (error) {
    console.error('❌ ERROR AL CREAR PEDIDO:', error);
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
      .sort({ fechaPedido: -1 });

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
      .populate('direccion')
      .populate('productos.producto');

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