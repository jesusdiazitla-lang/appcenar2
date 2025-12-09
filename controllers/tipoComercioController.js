const TipoComercio = require('../models/TipoComercio');
const Usuario = require('../models/Usuario');

// Listar tipos de comercio
exports.listar = async (req, res) => {
  try {
    const tiposComercios = await TipoComercio.find();

    // Obtener cantidad de comercios por tipo
    const tiposConComercios = await Promise.all(
      tiposComercios.map(async (tipo) => {
        const cantidadComercios = await Usuario.countDocuments({
          rol: 'comercio',
          tipoComercio: tipo._id
        });
        return {
          ...tipo.toObject(),
          cantidadComercios
        };
      })
    );

    res.render('admin/tipos-comercio/index', {
      layout: 'layouts/admin',
      tiposComercios: tiposConComercios
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar tipos de comercio');
    res.redirect('/admin/dashboard');
  }
};

// Mostrar formulario de crear tipo de comercio
exports.mostrarCrear = (req, res) => {
  res.render('admin/tipos-comercio/crear', {
    layout: 'layouts/admin'
  });
};

// Crear tipo de comercio
exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const nuevoTipo = new TipoComercio({
      nombre,
      descripcion,
      icono: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevoTipo.save();
    req.flash('success', 'Tipo de comercio creado exitosamente');
    res.redirect('/admin/tipos-comercio');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear tipo de comercio');
    res.redirect('/admin/tipos-comercio/crear');
  }
};

// Mostrar formulario de editar tipo de comercio
exports.mostrarEditar = async (req, res) => {
  try {
    const { tipoId } = req.params;
    const tipoComercio = await TipoComercio.findById(tipoId);

    if (!tipoComercio) {
      req.flash('error', 'Tipo de comercio no encontrado');
      return res.redirect('/admin/tipos-comercio');
    }

    res.render('admin/tipos-comercio/editar', {
      layout: 'layouts/admin',
      tipoComercio
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar tipo de comercio');
    res.redirect('/admin/tipos-comercio');
  }
};

// Editar tipo de comercio
exports.editar = async (req, res) => {
  try {
    const { tipoId } = req.params;
    const { nombre, descripcion } = req.body;

    const updateData = { nombre, descripcion };

    if (req.file) {
      updateData.icono = `/uploads/${req.file.filename}`;
    }

    await TipoComercio.findByIdAndUpdate(tipoId, updateData);

    req.flash('success', 'Tipo de comercio actualizado exitosamente');
    res.redirect('/admin/tipos-comercio');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al editar tipo de comercio');
    res.redirect(`/admin/tipos-comercio/editar/${req.params.tipoId}`);
  }
};

// Mostrar confirmación de eliminar
exports.mostrarEliminar = async (req, res) => {
  try {
    const { tipoId } = req.params;
    const tipoComercio = await TipoComercio.findById(tipoId);

    if (!tipoComercio) {
      req.flash('error', 'Tipo de comercio no encontrado');
      return res.redirect('/admin/tipos-comercio');
    }

    // Contar comercios asociados
    const cantidadComercios = await Usuario.countDocuments({
      rol: 'comercio',
      tipoComercio: tipoId
    });

    res.render('admin/tipos-comercio/eliminar', {
      layout: 'layouts/admin',
      tipoComercio,
      cantidadComercios
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar tipo de comercio');
    res.redirect('/admin/tipos-comercio');
  }
};

// Eliminar tipo de comercio y todos los comercios asociados
exports.eliminar = async (req, res) => {
  try {
    const { tipoId } = req.params;

    // Eliminar todos los comercios asociados a este tipo
    await Usuario.deleteMany({
      rol: 'comercio',
      tipoComercio: tipoId
    });

    // Eliminar el tipo de comercio
    await TipoComercio.findByIdAndDelete(tipoId);

    req.flash('success', 'Tipo de comercio y comercios asociados eliminados exitosamente');
    res.redirect('/admin/tipos-comercio');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar tipo de comercio');
    res.redirect('/admin/tipos-comercio');
  }
};