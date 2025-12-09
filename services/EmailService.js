// services/EmailService.js (CÓDIGO MODIFICADO)

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  // ... (Tu lógica existente para enviar correo)
  try {
    const info = await transporter.sendMail({
      from: `"AppCenar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    console.log(`✅ Email enviado a ${to}`);
    return info;
  } catch (error) {
    console.error(' Error al enviar email:', error.message);
    throw error;
  }
};

// --- FUNCIONES EXPORTADAS QUE EL CONTROLADOR NECESITA ---

exports.enviarCorreoActivacion = async (correo, nombre, urlActivacion) => {
    const subject = 'Activa tu cuenta de AppCenar';
    const html = `
        <h1>Hola ${nombre},</h1>
        <p>Gracias por registrarte en AppCenar. Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
        <p><a href="${urlActivacion}">Activar Cuenta Ahora</a></p>
        <p>Si no solicitaste este registro, ignora este correo.</p>
    `;
    return sendEmail(correo, subject, html);
};

exports.enviarCorreoResetPassword = async (correo, nombre, urlReset) => {
    const subject = 'Restablecer Contraseña de AppCenar';
    const html = `
        <h1>Hola ${nombre},</h1>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <p><a href="${urlReset}">Restablecer Contraseña</a></p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
    `;
    return sendEmail(correo, subject, html);
};

// Exportamos todas las funciones específicas que necesite el controlador.
// No necesitamos "module.exports = { sendEmail }" anymore.