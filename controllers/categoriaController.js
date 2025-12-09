const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

// Listar categorías
exports.listar = async (req, res) => {
  try {
    const categorias = await Categoria.find({ comercio: req.session.user.id });

    // Obtener cantidad de productos por categoría
    const categoriasConProductos = await Promise.all(
      categorias.map(async (categoria) => {
        const cantidadProductos = await Producto.countDocuments({ categoria: categoria._id });
        return {
          ...categoria.toObject(),
          cantidadProductos
        };
      })
    );

    res.render('comercio/categorias/index', {
      layout: 'layouts/comercio',
      categorias: categoriasConProductos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar categorías');
    res.redirect('/comercio/home');
  }
};

// Mostrar formulario de crear categoría
exports.mostrarCrear = (req, res) => {
  res.render('comercio/categorias/crear', {
    layout: 'layouts/comercio'
  });
};

// Crear categoría
exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      comercio: req.session.user.id
    });

    await nuevaCategoria.save();
    req.flash('success', 'Categoría creada exitosamente');
    res.redirect('/comercio/categorias');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear categoría');
    res.redirect('/comercio/categorias/crear');
  }
};

// Mostrar formulario de editar categoría
exports.mostrarEditar = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const categoria = await Categoria.findOne({
      _id: categoriaId,
      comercio: req.session.user.id
    });

    if (!categoria) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/comercio/categorias');
    }

    res.render('comercio/categorias/editar', {
      layout: 'layouts/comercio',
      categoria
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar categoría');
    res.redirect('/comercio/categorias');
  }
};

// Editar categoría
exports.editar = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const { nombre, descripcion } = req.body;

    await Categoria.findOneAndUpdate(
      { _id: categoriaId, comercio: req.session.user.id },
      { nombre, descripcion }
    );

    req.flash('success', 'Categoría actualizada exitosamente');
    res.redirect('/comercio/categorias');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al editar categoría');
    res.redirect(`/comercio/categorias/editar/${req.params.categoriaId}`);
  }
};

// Mostrar confirmación de eliminar
exports.mostrarEliminar = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const categoria = await Categoria.findOne({
      _id: categoriaId,
      comercio: req.session.user.id
    });

    if (!categoria) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/comercio/categorias');
    }

    res.render('comercio/categorias/eliminar', {
      layout: 'layouts/comercio',
      categoria
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar categoría');
    res.redirect('/comercio/categorias');
  }
};

// Eliminar categoría
exports.eliminar = async (req, res) => {
  try {
    const { categoriaId } = req.params;

    await Categoria.findOneAndDelete({
      _id: categoriaId,
      comercio: req.session.user.id
    });

    req.flash('success', 'Categoría eliminada exitosamente');
    res.redirect('/comercio/categorias');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar categoría');
    res.redirect('/comercio/categorias');
  }
};