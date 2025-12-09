/**
 * carrito.js
 * Gestión del carrito de compras en el catálogo de productos
 * AppCenar - Sistema de pedidos delivery
 */

class CarritoCompras {
  constructor() {
    this.carrito = [];
    this.elementos = {
      productosCarrito: document.getElementById('productos-carrito'),
      subtotalSpan: document.getElementById('subtotal-carrito'),
      resumenDiv: document.getElementById('carrito-resumen'),
      btnContinuar: document.getElementById('btn-continuar'),
      productosIdsInput: document.getElementById('productosIds-input'),
      formContinuar: document.getElementById('form-continuar')
    };
    
    this.init();
  }

  /**
   * Inicializa el carrito y sus event listeners
   */
  init() {
    // Verificar que todos los elementos existen
    if (!this.verificarElementos()) {
      console.error('Error: No se encontraron todos los elementos necesarios del carrito');
      return;
    }

    // Agregar event listeners a todos los botones de agregar producto
    this.attachEventListeners();

    // Inicializar estado del carrito
    this.actualizarCarrito();
  }

  /**
   * Verifica que todos los elementos DOM necesarios existen
   */
  verificarElementos() {
    return Object.values(this.elementos).every(el => el !== null);
  }

  /**
   * Agrega event listeners a los botones de agregar producto
   */
  attachEventListeners() {
    const botonesAgregar = document.querySelectorAll('.agregar-producto');
    
    botonesAgregar.forEach(btn => {
      btn.addEventListener('click', (e) => this.agregarProducto(e));
    });
  }

  /**
   * Agrega un producto al carrito
   * @param {Event} event - Evento del click
   */
  agregarProducto(event) {
    const boton = event.currentTarget;
    const card = boton.closest('.producto-card');
    
    if (!card) {
      console.error('No se encontró la tarjeta del producto');
      return;
    }

    const producto = {
      id: card.dataset.id,
      nombre: card.dataset.nombre,
      precio: parseFloat(card.dataset.precio)
    };

    // Validar que el producto tiene todos los datos necesarios
    if (!producto.id || !producto.nombre || isNaN(producto.precio)) {
      console.error('Datos del producto incompletos', producto);
      this.mostrarAlerta('Error al agregar el producto', 'danger');
      return;
    }

    // Verificar si el producto ya está en el carrito
    if (this.productoEnCarrito(producto.id)) {
      this.mostrarAlerta('Este producto ya está en tu pedido', 'warning');
      return;
    }

    // Agregar producto al carrito
    this.carrito.push(producto);
    
    // Actualizar UI del botón
    this.deshabilitarBoton(boton);
    
    // Actualizar vista del carrito
    this.actualizarCarrito();
    
    // Mostrar mensaje de éxito
    this.mostrarAlerta(`${producto.nombre} agregado al pedido`, 'success');
  }

  /**
   * Verifica si un producto está en el carrito
   * @param {string} id - ID del producto
   * @returns {boolean}
   */
  productoEnCarrito(id) {
    return this.carrito.some(p => p.id === id);
  }

  /**
   * Deshabilita el botón de agregar producto
   * @param {HTMLElement} boton - Botón a deshabilitar
   */
  deshabilitarBoton(boton) {
    boton.disabled = true;
    boton.innerHTML = '<i class="bi bi-check-circle"></i> Agregado';
    boton.classList.remove('btn-success');
    boton.classList.add('btn-secondary');
  }

  /**
   * Habilita el botón de agregar producto
   * @param {string} productoId - ID del producto
   */
  habilitarBoton(productoId) {
    const card = document.querySelector(`.producto-card[data-id="${productoId}"]`);
    if (!card) return;

    const boton = card.querySelector('.agregar-producto');
    if (!boton) return;

    boton.disabled = false;
    boton.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar';
    boton.classList.remove('btn-secondary');
    boton.classList.add('btn-success');
  }

  /**
   * Elimina un producto del carrito
   * @param {string} id - ID del producto a eliminar
   */
  eliminarProducto(id) {
    const index = this.carrito.findIndex(p => p.id === id);
    
    if (index === -1) {
      console.error('Producto no encontrado en el carrito');
      return;
    }

    const productoEliminado = this.carrito[index];
    
    // Eliminar del array
    this.carrito.splice(index, 1);
    
    // Re-habilitar botón de agregar
    this.habilitarBoton(id);
    
    // Actualizar vista del carrito
    this.actualizarCarrito();
    
    // Mostrar mensaje
    this.mostrarAlerta(`${productoEliminado.nombre} eliminado del pedido`, 'info');
  }

  /**
   * Actualiza la vista del carrito
   */
  actualizarCarrito() {
    if (this.carrito.length === 0) {
      this.mostrarCarritoVacio();
      return;
    }

    this.mostrarProductosCarrito();
    this.actualizarResumen();
    this.habilitarContinuar();
  }

  /**
   * Muestra el estado de carrito vacío
   */
  mostrarCarritoVacio() {
    this.elementos.productosCarrito.innerHTML = `
      <p class="text-muted text-center py-4">
        <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
        No hay productos seleccionados
      </p>
    `;
    this.elementos.resumenDiv.style.display = 'none';
    this.elementos.btnContinuar.disabled = true;
    this.elementos.productosIdsInput.value = '[]';
  }

  /**
   * Muestra los productos en el carrito
   */
  mostrarProductosCarrito() {
    let html = '';

    this.carrito.forEach(producto => {
      html += `
        <div class="producto-carrito-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
          <div class="flex-grow-1">
            <small class="fw-bold d-block">${this.escaparHTML(producto.nombre)}</small>
            <small class="text-success">${this.formatearMoneda(producto.precio)}</small>
          </div>
          <button 
            type="button"
            class="btn btn-sm btn-outline-danger" 
            onclick="carritoInstance.eliminarProducto('${producto.id}')"
            title="Eliminar producto">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
    });

    this.elementos.productosCarrito.innerHTML = html;
  }

  /**
   * Actualiza el resumen del carrito (subtotal)
   */
  actualizarResumen() {
    const subtotal = this.calcularSubtotal();
    this.elementos.subtotalSpan.textContent = this.formatearMoneda(subtotal);
    this.elementos.resumenDiv.style.display = 'block';
  }

  /**
   * Habilita el botón de continuar y actualiza los IDs de productos
   */
  habilitarContinuar() {
    this.elementos.btnContinuar.disabled = false;
    const productosIds = this.carrito.map(p => p.id);
    this.elementos.productosIdsInput.value = JSON.stringify(productosIds);
  }

  /**
   * Calcula el subtotal del carrito
   * @returns {number}
   */
  calcularSubtotal() {
    return this.carrito.reduce((sum, producto) => sum + producto.precio, 0);
  }

  /**
   * Formatea un número como moneda dominicana
   * @param {number} amount - Cantidad a formatear
   * @returns {string}
   */
  formatearMoneda(amount) {
    if (isNaN(amount)) return 'RD$ 0.00';
    return 'RD$ ' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string}
   */
  escaparHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Muestra una alerta temporal
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo de alerta (success, danger, warning, info)
   */
  mostrarAlerta(mensaje, tipo = 'info') {
    // Verificar si ya existe un contenedor de alertas
    let alertContainer = document.getElementById('carrito-alertas');
    
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'carrito-alertas';
      alertContainer.style.position = 'fixed';
      alertContainer.style.top = '20px';
      alertContainer.style.right = '20px';
      alertContainer.style.zIndex = '9999';
      alertContainer.style.maxWidth = '300px';
      document.body.appendChild(alertContainer);
    }

    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = 'alert';
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alerta);

    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      alerta.classList.remove('show');
      setTimeout(() => alerta.remove(), 150);
    }, 3000);
  }

  /**
   * Obtiene el carrito actual
   * @returns {Array}
   */
  obtenerCarrito() {
    return [...this.carrito];
  }

  /**
   * Vacía el carrito
   */
  vaciarCarrito() {
    this.carrito.forEach(producto => {
      this.habilitarBoton(producto.id);
    });
    
    this.carrito = [];
    this.actualizarCarrito();
  }

  /**
   * Obtiene la cantidad de productos en el carrito
   * @returns {number}
   */
  cantidadProductos() {
    return this.carrito.length;
  }
}

// Inicializar el carrito cuando el DOM esté listo
let carritoInstance;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    carritoInstance = new CarritoCompras();
  });
} else {
  carritoInstance = new CarritoCompras();
}

// Exponer la instancia globalmente para uso en onclick
window.carritoInstance = carritoInstance;