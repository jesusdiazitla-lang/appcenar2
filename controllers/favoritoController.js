const Favorito = require('../models/Favorito');

// Agregar o quitar favorito (toggle)
exports.toggle = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const clienteId = req.session.user.id;

    // Buscar si ya existe el favorito
    const favoritoExistente = await Favorito.findOne({
      cliente: clienteId,
      comercio: comercioId
    });

    if (favoritoExistente) {
      // Si existe, eliminarlo
      await Favorito.findByIdAndDelete(favoritoExistente._id);
      req.flash('info', 'Comercio removido de favoritos');
    } else {
      // Si no existe, crearlo
      const nuevoFavorito = new Favorito({
        cliente: clienteId,
        comercio: comercioId
      });
      await nuevoFavorito.save();
      req.flash('success', 'Comercio agregado a favoritos');
    }

    // Redirigir de vuelta a la página anterior
    const referer = req.get('Referer') || '/cliente/home';
    res.redirect(referer);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al procesar favorito');
    res.redirect('/cliente/home');
  }
};