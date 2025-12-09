const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

// Listar productos
exports.listar = async (req, res) => {
  try {
    const productos = await Producto.find({ comercio: req.session.user.id })
      .populate('categoria');

    res.render('comercio/productos/index', {
      layout: 'layouts/comercio',
      productos
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar productos');
    res.redirect('/comercio/home');
  }
};

// Mostrar formulario de crear producto
exports.mostrarCrear = async (req, res) => {
  try {
    const categorias = await Categoria.find({ comercio: req.session.user.id });

    res.render('comercio/productos/crear', {
      layout: 'layouts/comercio',
      categorias
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar formulario');
    res.redirect('/comercio/productos');
  }
};

// Crear producto
exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria } = req.body;

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      categoria,
      comercio: req.session.user.id,
      imagen: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevoProducto.save();
    req.flash('success', 'Producto creado exitosamente');
    res.redirect('/comercio/productos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear producto');
    res.redirect('/comercio/productos/crear');
  }
};

// Mostrar formulario de editar producto
exports.mostrarEditar = async (req, res) => {
  try {
    const { productoId } = req.params;
    const producto = await Producto.findOne({
      _id: productoId,
      comercio: req.session.user.id
    });

    if (!producto) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/comercio/productos');
    }

    const categorias = await Categoria.find({ comercio: req.session.user.id });

    res.render('comercio/productos/editar', {
      layout: 'layouts/comercio',
      producto,
      categorias
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar producto');
    res.redirect('/comercio/productos');
  }
};

// Editar producto
exports.editar = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { nombre, descripcion, precio, categoria } = req.body;

    const updateData = { nombre, descripcion, precio, categoria };

    if (req.file) {
      updateData.imagen = `/uploads/${req.file.filename}`;
    }

    await Producto.findOneAndUpdate(
      { _id: productoId, comercio: req.session.user.id },
      updateData
    );

    req.flash('success', 'Producto actualizado exitosamente');
    res.redirect('/comercio/productos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al editar producto');
    res.redirect(`/comercio/productos/editar/${req.params.productoId}`);
  }
};

// Mostrar confirmación de eliminar
exports.mostrarEliminar = async (req, res) => {
  try {
    const { productoId } = req.params;
    const producto = await Producto.findOne({
      _id: productoId,
      comercio: req.session.user.id
    });

    if (!producto) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/comercio/productos');
    }

    res.render('comercio/productos/eliminar', {
      layout: 'layouts/comercio',
      producto
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar producto');
    res.redirect('/comercio/productos');
  }
};

// Eliminar producto
exports.eliminar = async (req, res) => {
  try {
    const { productoId } = req.params;

    await Producto.findOneAndDelete({
      _id: productoId,
      comercio: req.session.user.id
    });

    req.flash('success', 'Producto eliminado exitosamente');
    res.redirect('/comercio/productos');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar producto');
    res.redirect('/comercio/productos');
  }
};