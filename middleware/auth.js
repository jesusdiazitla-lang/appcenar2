// middleware/auth.js

const isAuthenticated = (req, res, next) => {
    // Si hay un usuario en la sesión, continuar
    if (req.session?.user) {
        return next();
    }
    // Si NO hay usuario, redirigir a login
    return res.redirect("/auth/login");
};

const isNotAuthenticated = (req, res, next) => {
    const user = req.session?.user;

    // Caso 1: Usuario NO autenticado (Permite ver login, registro, etc.)
    if (!user) {
        return next();
    }

    // Caso 2: Usuario SÍ autenticado (Redirige a su dashboard)
    const redirectPaths = {
        cliente: "/cliente/home",
        comercio: "/comercio/home",
        delivery: "/delivery/home",
        administrador: "/admin/dashboard"
    };

    const destino = redirectPaths[user.rol] || "/";
    
    // ✅ CORRECCIÓN: Ya no verificamos si está en su dashboard
    // Simplemente redirigimos si está autenticado intentando acceder a rutas públicas
    return res.redirect(destino);
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated
};