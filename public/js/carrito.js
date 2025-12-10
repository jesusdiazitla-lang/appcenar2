/**
 * carrito.js - Versión con cantidades
 * Gestión del carrito de compras con soporte para múltiples cantidades
 * AppCenar - Sistema de pedidos delivery
 */

class CarritoCompras {
  constructor() {
    this.carrito = []; // Array de {id, nombre, precio, cantidad}
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
    if (!this.verificarElementos()) {
      console.error('Error: No se encontraron todos los elementos necesarios del carrito');
      return;
    }

    this.attachEventListeners();
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
   * Agrega un producto al carrito o incrementa su cantidad
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

    if (!producto.id || !producto.nombre || isNaN(producto.precio)) {
      console.error('Datos del producto incompletos', producto);
      this.mostrarAlerta('Error al agregar el producto', 'danger');
      return;
    }

    // Buscar si el producto ya está en el carrito
    const itemExistente = this.carrito.find(item => item.id === producto.id);

    if (itemExistente) {
      // Incrementar cantidad
      itemExistente.cantidad++;
      this.mostrarAlerta(`${producto.nombre} (x${itemExistente.cantidad})`, 'success');
    } else {
      // Agregar nuevo producto con cantidad 1
      this.carrito.push({
        ...producto,
        cantidad: 1
      });
      this.mostrarAlerta(`${producto.nombre} agregado`, 'success');
    }

    // Actualizar vista del carrito
    this.actualizarCarrito();
  }

  /**
   * Incrementa la cantidad de un producto
   */
  incrementarCantidad(id) {
    const item = this.carrito.find(p => p.id === id);
    if (item) {
      item.cantidad++;
      this.actualizarCarrito();
    }
  }

  /**
   * Decrementa la cantidad de un producto
   */
  decrementarCantidad(id) {
    const item = this.carrito.find(p => p.id === id);
    if (item) {
      if (item.cantidad > 1) {
        item.cantidad--;
      } else {
        // Si cantidad es 1, eliminar el producto
        this.eliminarProducto(id);
        return;
      }
      this.actualizarCarrito();
    }
  }

  /**
   * Elimina un producto del carrito
   */
  eliminarProducto(id) {
    const index = this.carrito.findIndex(p => p.id === id);
    
    if (index === -1) {
      console.error('Producto no encontrado en el carrito');
      return;
    }

    const productoEliminado = this.carrito[index];
    this.carrito.splice(index, 1);
    
    this.actualizarCarrito();
    this.mostrarAlerta(`${productoEliminado.nombre} eliminado`, 'info');
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
   * Muestra los productos en el carrito con controles de cantidad
   */
  mostrarProductosCarrito() {
    let html = '';

    this.carrito.forEach(producto => {
      const subtotalItem = producto.precio * producto.cantidad;
      html += `
        <div class="producto-carrito-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
          <div class="flex-grow-1">
            <small class="fw-bold d-block">${this.escaparHTML(producto.nombre)}</small>
            <small class="text-success">${this.formatearMoneda(producto.precio)} c/u</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <!-- Controles de cantidad -->
            <div class="btn-group btn-group-sm" role="group">
              <button 
                type="button"
                class="btn btn-outline-secondary" 
                onclick="carritoInstance.decrementarCantidad('${producto.id}')"
                title="Disminuir cantidad">
                <i class="bi bi-dash"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" disabled>
                ${producto.cantidad}
              </button>
              <button 
                type="button"
                class="btn btn-outline-secondary" 
                onclick="carritoInstance.incrementarCantidad('${producto.id}')"
                title="Aumentar cantidad">
                <i class="bi bi-plus"></i>
              </button>
            </div>
            
            <!-- Subtotal del item -->
            <span class="text-success fw-bold" style="min-width: 80px; text-align: right;">
              ${this.formatearMoneda(subtotalItem)}
            </span>
            
            <!-- Botón eliminar -->
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger" 
              onclick="carritoInstance.eliminarProducto('${producto.id}')"
              title="Eliminar producto">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;
    });

    this.elementos.productosCarrito.innerHTML = html;
  }

  /**
   * Actualiza el resumen del carrito
   */
  actualizarResumen() {
    const subtotal = this.calcularSubtotal();
    this.elementos.subtotalSpan.textContent = this.formatearMoneda(subtotal);
    this.elementos.resumenDiv.style.display = 'block';
  }

  /**
   * Habilita el botón de continuar y actualiza los IDs
   */
  habilitarContinuar() {
    this.elementos.btnContinuar.disabled = false;
    
    // Crear array con IDs repetidos según cantidad
    const productosIds = [];
    this.carrito.forEach(item => {
      for (let i = 0; i < item.cantidad; i++) {
        productosIds.push(item.id);
      }
    });
    
    this.elementos.productosIdsInput.value = JSON.stringify(productosIds);
  }

  /**
   * Calcula el subtotal del carrito
   */
  calcularSubtotal() {
    return this.carrito.reduce((sum, item) => {
      return sum + (item.precio * item.cantidad);
    }, 0);
  }

  /**
   * Obtiene la cantidad total de productos
   */
  cantidadTotal() {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  /**
   * Formatea un número como moneda dominicana
   */
  formatearMoneda(amount) {
    if (isNaN(amount)) return 'RD$ 0.00';
    return 'RD$ ' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  /**
   * Escapa caracteres HTML
   */
  escaparHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Muestra una alerta temporal
   */
  mostrarAlerta(mensaje, tipo = 'info') {
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
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.appendChild(alerta);

    setTimeout(() => {
      alerta.classList.remove('show');
      setTimeout(() => alerta.remove(), 150);
    }, 2000);
  }

  /**
   * Vacía el carrito
   */
  vaciarCarrito() {
    this.carrito = [];
    this.actualizarCarrito();
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

window.carritoInstance = carritoInstance;