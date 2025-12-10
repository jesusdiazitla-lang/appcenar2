const Usuario = require('../models/Usuario');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const bcrypt = require('bcryptjs');

// Dashboard con estadísticas
exports.mostrarDashboard = async (req, res) => {
  try {
    // ✅ CORRECCIÓN: Obtener fecha actual correctamente
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    console.log('🔍 Buscando pedidos de hoy:');
    console.log('   - Desde:', hoy);
    console.log('   - Hasta:', manana);

    // Estadísticas
    const totalPedidos = await Pedido.countDocuments();
    
    // ✅ CORRECCIÓN: Usar fechaPedido en lugar de fechaHora
    const pedidosHoy = await Pedido.countDocuments({
      fechaPedido: { 
        $gte: hoy,
        $lt: manana
      }
    });

    console.log('📊 Resultados:');
    console.log('   - Total pedidos:', totalPedidos);
    console.log('   - Pedidos de hoy:', pedidosHoy);

    const comerciosActivos = await Usuario.countDocuments({ rol: 'comercio', activo: true });
    const comerciosInactivos = await Usuario.countDocuments({ rol: 'comercio', activo: false });

    const clientesActivos = await Usuario.countDocuments({ rol: 'cliente', activo: true });
    const clientesInactivos = await Usuario.countDocuments({ rol: 'cliente', activo: false });

    const deliveriesActivos = await Usuario.countDocuments({ rol: 'delivery', activo: true });
    const deliveriesInactivos = await Usuario.countDocuments({ rol: 'delivery', activo: false });

    const totalProductos = await Producto.countDocuments();

    res.render('admin/dashboard', {
      layout: 'layouts/admin',
      estadisticas: {
        totalPedidos,
        pedidosHoy,
        comerciosActivos,
        comerciosInactivos,
        clientesActivos,
        clientesInactivos,
        deliveriesActivos,
        deliveriesInactivos,
        totalProductos
      }
    });
  } catch (error) {
    console.error('❌ Error en mostrarDashboard:', error);
    req.flash('error', 'Error al cargar dashboard');
    res.redirect('/admin/dashboard');
  }
};

// Listar clientes
exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Usuario.find({ rol: 'cliente' });
    
    // Obtener cantidad de pedidos por cliente
    const clientesConPedidos = await Promise.all(
      clientes.map(async (cliente) => {
        const cantidadPedidos = await Pedido.countDocuments({ cliente: cliente._id });
        return {
          ...cliente.toObject(),
          cantidadPedidos
        };
      })
    );

    res.render('admin/clientes', {
      layout: 'layouts/admin',
      clientes: clientesConPedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar clientes');
    res.redirect('/admin/dashboard');
  }
};

// Activar/Inactivar cliente
exports.toggleActivoCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const cliente = await Usuario.findById(clienteId);
    
    await Usuario.findByIdAndUpdate(clienteId, {
      activo: !cliente.activo
    });

    req.flash('success', `Cliente ${!cliente.activo ? 'activado' : 'inactivado'} exitosamente`);
    res.redirect('/admin/clientes');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar estado del cliente');
    res.redirect('/admin/clientes');
  }
};

// Listar deliveries
exports.listarDeliveries = async (req, res) => {
  try {
    const deliveries = await Usuario.find({ rol: 'delivery' });
    
    // Obtener cantidad de pedidos por delivery
    const deliveriesConPedidos = await Promise.all(
      deliveries.map(async (delivery) => {
        const cantidadPedidos = await Pedido.countDocuments({ 
          delivery: delivery._id,
          estado: 'completado'
        });
        return {
          ...delivery.toObject(),
          cantidadPedidos
        };
      })
    );

    res.render('admin/deliveries', {
      layout: 'layouts/admin',
      deliveries: deliveriesConPedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar deliveries');
    res.redirect('/admin/dashboard');
  }
};

// Activar/Inactivar delivery
exports.toggleActivoDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Usuario.findById(deliveryId);
    
    await Usuario.findByIdAndUpdate(deliveryId, {
      activo: !delivery.activo
    });

    req.flash('success', `Delivery ${!delivery.activo ? 'activado' : 'inactivado'} exitosamente`);
    res.redirect('/admin/deliveries');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar estado del delivery');
    res.redirect('/admin/deliveries');
  }
};

// Listar comercios
exports.listarComercios = async (req, res) => {
  try {
    const comercios = await Usuario.find({ rol: 'comercio' }).populate('tipoComercio');
    
    // Obtener cantidad de pedidos por comercio
    const comerciosConPedidos = await Promise.all(
      comercios.map(async (comercio) => {
        const cantidadPedidos = await Pedido.countDocuments({ comercio: comercio._id });
        return {
          ...comercio.toObject(),
          cantidadPedidos
        };
      })
    );

    res.render('admin/comercios', {
      layout: 'layouts/admin',
      comercios: comerciosConPedidos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar comercios');
    res.redirect('/admin/dashboard');
  }
};

// Activar/Inactivar comercio
exports.toggleActivoComercio = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const comercio = await Usuario.findById(comercioId);
    
    await Usuario.findByIdAndUpdate(comercioId, {
      activo: !comercio.activo
    });

    req.flash('success', `Comercio ${!comercio.activo ? 'activado' : 'inactivado'} exitosamente`);
    res.redirect('/admin/comercios');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar estado del comercio');
    res.redirect('/admin/comercios');
  }
};

// Listar administradores
exports.listarAdministradores = async (req, res) => {
  try {
    const administradores = await Usuario.find({ rol: 'administrador' });

    res.render('admin/administradores/index', {
      layout: 'layouts/admin',
      administradores,
      usuarioLogueadoId: req.session.user.id
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar administradores');
    res.redirect('/admin/dashboard');
  }
};

// Mostrar formulario crear administrador
exports.mostrarCrearAdministrador = (req, res) => {
  res.render('admin/administradores/crear', {
    layout: 'layouts/admin'
  });
};

// Crear administrador
exports.crearAdministrador = async (req, res) => {
  try {
    const { nombre, apellido, cedula, correo, nombreUsuario, password, confirmarPassword } = req.body;

    if (password !== confirmarPassword) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/admin/administradores/crear');
    }

    // Verificar si usuario o correo ya existen
    const usuarioExistente = await Usuario.findOne({
      $or: [{ nombreUsuario }, { correo }]
    });

    if (usuarioExistente) {
      req.flash('error', 'El usuario o correo ya están registrados');
      return res.redirect('/admin/administradores/crear');
    }

    // ✅ NO hashear manualmente - el hook pre('save') lo hace automáticamente
    const nuevoAdmin = new Usuario({
      nombre,
      apellido,
      cedula,
      correo,
      nombreUsuario,
      password: password, // ✅ Password sin hashear - el modelo lo hashea
      rol: 'administrador',
      activo: true
    });

    await nuevoAdmin.save();
    
    console.log('✅ Nuevo administrador creado:', nuevoAdmin.nombreUsuario);
    
    req.flash('success', 'Administrador creado exitosamente');
    res.redirect('/admin/administradores');
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    req.flash('error', 'Error al crear administrador');
    res.redirect('/admin/administradores/crear');
  }
};

// Mostrar formulario editar administrador
exports.mostrarEditarAdministrador = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // No permitir que el admin logueado se edite a sí mismo
    if (adminId === req.session.user.id) {
      req.flash('warning', 'No puede editar su propio usuario');
      return res.redirect('/admin/administradores');
    }

    const admin = await Usuario.findById(adminId);

    res.render('admin/administradores/editar', {
      layout: 'layouts/admin',
      admin
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar administrador');
    res.redirect('/admin/administradores');
  }
};

// Editar administrador
exports.editarAdministrador = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { nombre, apellido, cedula, correo, nombreUsuario, password, confirmarPassword } = req.body;

    const updateData = { nombre, apellido, cedula, correo, nombreUsuario };

    if (password && password.trim() !== '') {
      if (password !== confirmarPassword) {
        req.flash('error', 'Las contraseñas no coinciden');
        return res.redirect(`/admin/administradores/editar/${adminId}`);
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await Usuario.findByIdAndUpdate(adminId, updateData);
    req.flash('success', 'Administrador actualizado exitosamente');
    res.redirect('/admin/administradores');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar administrador');
    res.redirect('/admin/administradores');
  }
};

// Activar/Inactivar administrador
exports.toggleActivoAdministrador = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // No permitir que el admin logueado se desactive a sí mismo
    if (adminId === req.session.user.id) {
      req.flash('warning', 'No puede desactivar su propio usuario');
      return res.redirect('/admin/administradores');
    }

    const admin = await Usuario.findById(adminId);
    await Usuario.findByIdAndUpdate(adminId, {
      activo: !admin.activo
    });

    req.flash('success', `Administrador ${!admin.activo ? 'activado' : 'inactivado'} exitosamente`);
    res.redirect('/admin/administradores');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar estado del administrador');
    res.redirect('/admin/administradores');
  }
};

// ✅ NUEVO: Mostrar formulario de cambio de contraseña
exports.mostrarCambiarPassword = (req, res) => {
  const requiereCambio = req.session.user.requiereCambioPassword || false;
  
  res.render('admin/cambiar-password', {
    layout: 'layouts/admin',
    requiereCambio
  });
};

// ✅ NUEVO: Procesar cambio de contraseña
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo, confirmarPassword } = req.body;

    console.log('🔐 Cambio de contraseña para admin:', req.session.user.id);

    // Validar que las nuevas contraseñas coincidan
    if (passwordNuevo !== confirmarPassword) {
      req.flash('error', 'Las contraseñas nuevas no coinciden');
      return res.redirect('/admin/cambiar-password');
    }

    // Validar longitud mínima
    if (passwordNuevo.length < 6) {
      req.flash('error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return res.redirect('/admin/cambiar-password');
    }

    // Buscar usuario con contraseña
    const admin = await Usuario.findById(req.session.user.id).select('+password');

    if (!admin) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/admin/cambiar-password');
    }

    // Verificar contraseña actual
    const passwordValido = await admin.compararPassword(passwordActual);

    if (!passwordValido) {
      req.flash('error', 'La contraseña actual es incorrecta');
      return res.redirect('/admin/cambiar-password');
    }

    // Actualizar contraseña y quitar flag de requerimiento
    admin.password = passwordNuevo;
    admin.requiereCambioPassword = false;
    await admin.save();

    console.log('✅ Contraseña actualizada exitosamente');

    // Actualizar sesión
    req.session.user.requiereCambioPassword = false;

    req.session.save((err) => {
      if (err) {
        console.error('Error al guardar sesión:', err);
      }
      
      req.flash('success', 'Contraseña actualizada exitosamente');
      res.redirect('/admin/dashboard');
    });

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    req.flash('error', 'Error al cambiar contraseña');
    res.redirect('/admin/cambiar-password');
  }
};