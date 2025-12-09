const Configuracion = require('../models/Configuracion');

// Mostrar configuración
exports.mostrar = async (req, res) => {
  try {
    let configuracion = await Configuracion.findOne();

    // Si no existe configuración, crear una por defecto
    if (!configuracion) {
      configuracion = new Configuracion({ itbis: 18 });
      await configuracion.save();
    }

    res.render('admin/configuracion/index', {
      layout: 'layouts/admin',
      configuracion
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar configuración');
    res.redirect('/admin/dashboard');
  }
};

// Mostrar formulario de editar configuración
exports.mostrarEditar = async (req, res) => {
  try {
    let configuracion = await Configuracion.findOne();

    // Si no existe configuración, crear una por defecto
    if (!configuracion) {
      configuracion = new Configuracion({ itbis: 18 });
      await configuracion.save();
    }

    res.render('admin/configuracion/editar', {
      layout: 'layouts/admin',
      configuracion
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar formulario');
    res.redirect('/admin/configuracion');
  }
};

// Editar configuración
exports.editar = async (req, res) => {
  try {
    const { itbis } = req.body;

    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = new Configuracion({ itbis });
      await configuracion.save();
    } else {
      configuracion.itbis = itbis;
      await configuracion.save();
    }

    req.flash('success', 'Configuración actualizada exitosamente');
    res.redirect('/admin/configuracion');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar configuración');
    res.redirect('/admin/configuracion/editar');
  }
};