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

    // Caso 2: Usuario SÍ autenticado (Previene ver login/registro y redirige a su dashboard)
    const redirectPaths = {
        cliente: "/cliente/home",
        comercio: "/comercio/home",
        delivery: "/delivery/home",
        administrador: "/admin/dashboard"
    };

    const destino = redirectPaths[user.rol] || "/";
    const rutaActual = req.originalUrl.split("?")[0];

    // Si el usuario ya está en su dashboard, le permitimos el paso para evitar
    // que el middleware lo redirija nuevamente a la misma página (bucle).
    if (rutaActual.startsWith(destino)) {
        return next();
    }
    
    // Si el usuario está logueado pero intenta acceder a una ruta de autenticación,
    // lo redirigimos a su dashboard.
    return res.redirect(destino);
};


module.exports = {
    isAuthenticated,
    isNotAuthenticated
};