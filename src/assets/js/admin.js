/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Controlador Integral del Panel de Administrador
 * Conectado a la Base de Datos MySQL / MariaDB (refrigeracion_rufo)
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'rufo_db_relacional_v2';
  const SESSION_KEY = 'rufo_usuario_sesion';

  function getApiUrl() {
    const { protocol, hostname, port, pathname } = window.location;
    if (
      (protocol === 'http:' || protocol === 'https:') &&
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (port === '' || port === '80') &&
      pathname.toLowerCase().includes('/eunices')
    ) {
      return 'src/routes/api.php';
    }
    return 'http://localhost/Eunices/src/routes/api.php';
  }

  const API_URL = getApiUrl();
  let isDbConnected = false;

  // Control de Acceso y Sesión
  function checkSession() {
    let activeUser = null;
    try {
      const stored = sessionStorage.getItem('rufo_active_user') || localStorage.getItem('rufo_active_user');
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {}

    if (!activeUser) {
      window.location.href = 'index.html';
      return null;
    }

    if (activeUser.rol === 'empleado') {
      // Registrar intento de acceso indebido en auditoría
      if (window.RufoAudit) {
        window.RufoAudit.logEvent({
          modulo: 'Seguridad',
          accion: 'ACCESO_DENEGADO',
          detalles: 'Intento de acceso no autorizado a /admin.html bloqueado por control de acceso',
          user: activeUser
        });
      }
      window.location.href = 'empleado.html';
      return null;
    }

    // Actualizar nombre y avatar en interfaz
    const adminNameEl = document.querySelector('.admin-name');
    if (adminNameEl && activeUser.nombre_completo) {
      adminNameEl.textContent = activeUser.nombre_completo;
    }
    const adminAvatarEl = document.querySelector('.admin-avatar');
    if (adminAvatarEl && activeUser.nombre_completo) {
      const parts = activeUser.nombre_completo.trim().split(/\s+/);
      adminAvatarEl.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    return activeUser;
  }

  const currentUser = checkSession();
  if (!currentUser) return;

  // Manejo de Cierre de Sesión
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (window.RufoAudit) {
        window.RufoAudit.logEvent({
          modulo: 'Autenticación',
          accion: 'CIERRE_SESION',
          detalles: `Cierre de sesión de administrador (${currentUser.nombre_completo})`,
          user: currentUser
        });
      }

      localStorage.removeItem('rufo_active_user');
      sessionStorage.removeItem('rufo_active_user');
      window.location.href = 'index.html';
    });
  });

  const INITIAL_DB = {
    usuarios: [
      {
        id_usuario: 1,
        nombre_completo: 'Administrador General',
        usuario: 'admin',
        contrasena: 'rufo2026',
        rol: 'administrador'
      },
      {
        id_usuario: 2,
        nombre_completo: 'Operador de Ventas',
        usuario: 'empleado',
        contrasena: 'ventas2026',
        rol: 'empleado'
      }
    ],
    proveedores: [
      {
        id_proveedor: 1,
        rif: 'J-40128941-2',
        nombre: 'Distribuidora Frío Zulia, C.A.',
        ubicacion: 'Maracaibo, Edo. Zulia',
        telefono: '0414-6712390',
        correo: 'ventas@friozulia.com'
      },
      {
        id_proveedor: 2,
        rif: 'J-31894022-8',
        nombre: 'Importadora RefriPartes Maracaibo',
        ubicacion: 'San Francisco, Edo. Zulia',
        telefono: '0412-6558810',
        correo: 'contacto@refripartes.com'
      },
      {
        id_proveedor: 3,
        rif: 'J-40998120-5',
        nombre: 'Suministros Eléctricos COL, C.A.',
        ubicacion: 'Cabimas, Edo. Zulia',
        telefono: '0424-6194401',
        correo: 'suministroscol@gmail.com'
      }
    ],
    productos: [
      {
        id_producto: 1,
        codigo: 'REF-001',
        nombre: 'Compresor Embraco 1/4 HP R-134a',
        categoria: 'Compresores',
        cantidad: 14,
        stock_minimo: 4,
        precio: 95.00,
        fecha_ingreso: '2026-11-01',
        id_proveedor: 1
      },
      {
        id_producto: 2,
        codigo: 'REF-002',
        nombre: 'Cilindro Gas Refrigerante R-134a (13.6 Kg)',
        categoria: 'Gases Refrigerantes',
        cantidad: 8,
        stock_minimo: 3,
        precio: 135.00,
        fecha_ingreso: '2026-11-02',
        id_proveedor: 2
      },
      {
        id_producto: 3,
        codigo: 'REF-003',
        nombre: 'Capacitor de Marcha 35 uF 370V',
        categoria: 'Componentes Eléctricos',
        cantidad: 3,
        stock_minimo: 10,
        precio: 6.50,
        fecha_ingreso: '2026-11-03',
        id_proveedor: 3
      },
      {
        id_producto: 4,
        codigo: 'REF-004',
        nombre: 'Termostato Universal para Nevera Danfoss',
        categoria: 'Componentes Eléctricos',
        cantidad: 0,
        stock_minimo: 6,
        precio: 12.00,
        fecha_ingreso: '2026-11-03',
        id_proveedor: 3
      },
      {
        id_producto: 5,
        codigo: 'REF-005',
        nombre: 'Motor Ventilador Evaporador 110V',
        categoria: 'Motores y Ventilación',
        cantidad: 19,
        stock_minimo: 5,
        precio: 18.50,
        fecha_ingreso: '2026-11-04',
        id_proveedor: 1
      },
      {
        id_producto: 6,
        codigo: 'REF-006',
        nombre: 'Filtro Secador Soldable 1/4" Danfoss',
        categoria: 'Tuberías y Filtros',
        cantidad: 0,
        stock_minimo: 12,
        precio: 4.50,
        fecha_ingreso: '2026-11-05',
        id_proveedor: 2
      },
      {
        id_producto: 7,
        codigo: 'REF-007',
        nombre: 'Rollo Tubería de Cobre Flexible 1/4" (15m)',
        categoria: 'Tuberías y Filtros',
        cantidad: 4,
        stock_minimo: 5,
        precio: 48.00,
        fecha_ingreso: '2026-11-06',
        id_proveedor: 2
      },
      {
        id_producto: 8,
        codigo: 'REF-008',
        nombre: 'Protector Térmico y Relé PTC 1/3 HP',
        categoria: 'Componentes Eléctricos',
        cantidad: 28,
        stock_minimo: 8,
        precio: 5.00,
        fecha_ingreso: '2026-11-06',
        id_proveedor: 3
      }
    ],
    compras: [
      {
        id_compra: 1,
        fecha_compra: '2026-11-02',
        id_proveedor: 1,
        id_producto: 1,
        cantidad_mercancia: 15,
        monto_compra: 1050.00
      },
      {
        id_compra: 2,
        fecha_compra: '2026-11-04',
        id_proveedor: 2,
        id_producto: 2,
        cantidad_mercancia: 10,
        monto_compra: 980.00
      },
      {
        id_compra: 3,
        fecha_compra: '2026-11-05',
        id_proveedor: 3,
        id_producto: 8,
        cantidad_mercancia: 35,
        monto_compra: 105.00
      },
      {
        id_compra: 4,
        fecha_compra: '2026-11-06',
        id_proveedor: 1,
        id_producto: 5,
        cantidad_mercancia: 20,
        monto_compra: 240.00
      }
    ],
    ventas: [
      {
        id_venta: 1,
        fecha: '2026-11-08 09:15',
        id_producto: 3,
        cantidad_producto: 12,
        monto: 78.00,
        descripcion: 'Venta al detal en mostrador',
        id_usuario: 2
      },
      {
        id_venta: 2,
        fecha: '2026-11-08 10:05',
        id_producto: 8,
        cantidad_producto: 9,
        monto: 45.00,
        descripcion: 'Venta al detal en mostrador',
        id_usuario: 2
      },
      {
        id_venta: 3,
        fecha: '2026-11-08 10:42',
        id_producto: 1,
        cantidad_producto: 3,
        monto: 285.00,
        descripcion: 'Venta de compresor con garantía',
        id_usuario: 1
      },
      {
        id_venta: 4,
        fecha: '2026-11-08 11:20',
        id_producto: 5,
        cantidad_producto: 6,
        monto: 111.00,
        descripcion: 'Venta al detal en mostrador',
        id_usuario: 2
      },
      {
        id_venta: 5,
        fecha: '2026-11-08 11:55',
        id_producto: 2,
        cantidad_producto: 2,
        monto: 270.00,
        descripcion: 'Venta de cilindro refrigerante',
        id_usuario: 1
      }
    ],
    auditoria: (window.RufoAudit && window.RufoAudit.INITIAL_AUDIT_LOGS)
      ? JSON.parse(JSON.stringify(window.RufoAudit.INITIAL_AUDIT_LOGS))
      : []
  };

  let db = loadDb();
  let currentStockFilter = 'todos';

  function loadDb() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed.auditoria)) {
          parsed.auditoria = (window.RufoAudit && window.RufoAudit.INITIAL_AUDIT_LOGS)
            ? JSON.parse(JSON.stringify(window.RufoAudit.INITIAL_AUDIT_LOGS))
            : [];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error al leer almacenamiento local:', err);
    }
    const clone = JSON.parse(JSON.stringify(INITIAL_DB));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
    return clone;
  }

  function saveDb() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function getActiveSessionUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      // Ignorar errores de parseo
    }
    return {
      id_usuario: 1,
      nombre_completo: 'Administrador General',
      usuario: 'admin',
      rol: 'administrador'
    };
  }

  function applySessionProfile() {
    const activeUser = getActiveSessionUser();
    const nameEl = document.querySelector('.admin-name');
    const subEl = document.querySelector('.admin-sub');
    const avatarEl = document.querySelector('.admin-avatar');
    const roleChip = document.querySelector('.role-chip');

    if (nameEl) nameEl.textContent = activeUser.nombre_completo || 'Administrador General';
    if (subEl) {
      subEl.textContent =
        activeUser.rol === 'administrador' ? 'Control y Acceso Total' : 'Operaciones y Ventas';
    }
    if (avatarEl && activeUser.nombre_completo) {
      const initials = activeUser.nombre_completo
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      avatarEl.textContent = initials || 'US';
    }
    if (roleChip) {
      roleChip.textContent = activeUser.rol === 'administrador' ? 'Administrador' : 'Empleado';
    }
  }

  function updateConnectionBadge(connected) {
    isDbConnected = connected;
    const badge = document.getElementById('dbStatusBadge');
    if (!badge) return;
    if (connected) {
      badge.className = 'status-badge in-stock';
      badge.textContent = 'MySQL: refrigeracion_rufo';
      badge.title = 'Conectado en tiempo real a MariaDB / MySQL (refrigeracion_rufo)';
    } else {
      badge.className = 'status-badge low-stock';
      badge.textContent = 'Modo Local (Cache)';
      badge.title = 'Operando con respaldo en memoria local';
    }
  }

  /**
   * Petición centralizada hacia la API PHP + PDO (refrigeracion_rufo)
   */
  async function apiRequest(action, payload = {}) {
    const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.mensaje || 'Error al procesar la solicitud en la base de datos.');
    }
    if (data.db) {
      db = data.db;
      saveDb();
    }
    updateConnectionBadge(true);
    return data;
  }

  /**
   * Carga inicial desde la base de datos MySQL / MariaDB
   */
  async function syncWithDatabase() {
    try {
      const response = await fetch(`${API_URL}?action=init`);
      const data = await response.json();
      if (response.ok && data.ok && data.db) {
        db = data.db;
        saveDb();
        updateConnectionBadge(true);
        renderAll();
      } else {
        updateConnectionBadge(false);
      }
    } catch (err) {
      updateConnectionBadge(false);
    }
  }

  // Consultas de búsqueda interna
  function getProveedorById(id_proveedor) {
    return db.proveedores.find((p) => Number(p.id_proveedor) === Number(id_proveedor));
  }

  function getProductoById(id_producto) {
    return db.productos.find((p) => Number(p.id_producto) === Number(id_producto));
  }

  function getUsuarioById(id_usuario) {
    return db.usuarios.find((u) => Number(u.id_usuario) === Number(id_usuario));
  }

  function formatCurrency(val) {
    return `$${Number(val).toFixed(2)}`;
  }

  function getStockStatus(prod) {
    if (prod.cantidad <= 0) {
      return { key: 'agotado', label: 'Agotado', badgeClass: 'out-stock' };
    }
    if (prod.cantidad <= prod.stock_minimo) {
      return { key: 'bajo', label: 'Stock Bajo', badgeClass: 'low-stock' };
    }
    return { key: 'disponible', label: 'En Stock', badgeClass: 'in-stock' };
  }

  function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ==========================================================================
  // Navegación entre Vistas
  // ==========================================================================
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.module-view');
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarSubtitle = document.getElementById('topbarSubtitle');
  const sidebar = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  const VIEW_META = {
    dashboard: {
      title: 'Resumen General del Sistema',
      subtitle: 'Supervisión en tiempo real de inventario, ventas, proveedores y reportes.'
    },
    inventario: {
      title: 'Gestión de Inventario',
      subtitle: 'Control de existencias de productos, precios, ingreso y alertas de agotado.'
    },
    ventas: {
      title: 'Control de Ventas',
      subtitle: 'Seguimiento y registro de productos vendidos.'
    },
    proveedores: {
      title: 'Gestión de Proveedores',
      subtitle: 'Directorio de proveedores, compras realizadas y cantidad de mercancía recibida.'
    },
    reportes: {
      title: 'Generación de Reportes',
      subtitle: 'Informes de inventario, productos más vendidos y compras a proveedores.'
    },
    seguridad: {
      title: 'Usuarios y Contraseñas',
      subtitle: 'Administración de usuarios y cambio de contraseñas.'
    },
    auditoria: {
      title: 'Bitácora de Auditoría y Trazabilidad',
      subtitle: 'Supervisión jerárquica de operaciones, inicios de sesión y direcciones IP de origen.'
    }
  };

  function switchView(viewKey) {
    navItems.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === viewKey));
    views.forEach((sec) => sec.classList.toggle('active', sec.id === `view-${viewKey}`));
    if (VIEW_META[viewKey]) {
      topbarTitle.textContent = VIEW_META[viewKey].title;
      topbarSubtitle.textContent = VIEW_META[viewKey].subtitle;
    }
    sidebar.classList.remove('open');
    renderAll();
  }

  navItems.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto));
  });
  mobileMenuBtn?.addEventListener('click', () => sidebar.classList.toggle('open'));

  // ==========================================================================
  // Renderizado de Todas las Vistas
  // ==========================================================================
  function renderAll() {
    renderDashboard();
    renderProductos();
    renderVentas();
    renderProveedoresYCompras();
    renderReportes();
    renderUsuarios();
    renderAuditoria();
    populateSelects();
  }

  // 1. DASHBOARD
  function renderDashboard() {
    const totalCantidad = db.productos.reduce((acc, p) => acc + Number(p.cantidad), 0);
    const agotados = db.productos.filter((p) => p.cantidad <= 0);
    const bajos = db.productos.filter((p) => p.cantidad > 0 && p.cantidad <= p.stock_minimo);
    const alertas = [...agotados, ...bajos];

    const totalVentasUnidades = db.ventas.reduce((acc, v) => acc + Number(v.cantidad_producto), 0);
    const totalVentasMonto = db.ventas.reduce((acc, v) => acc + Number(v.monto), 0);
    const totalComprasMercancia = db.compras.reduce((acc, c) => acc + Number(c.cantidad_mercancia), 0);

    document.getElementById('kpiTotalUnits').textContent = totalCantidad;
    document.getElementById('kpiTotalSkus').textContent = `${db.productos.length} productos registrados`;
    document.getElementById('kpiAlertsCount').textContent = alertas.length;
    document.getElementById('kpiOutCount').textContent = `${agotados.length} agotados • ${bajos.length} en stock mínimo`;
    document.getElementById('kpiSalesUnits').textContent = `${totalVentasUnidades} unds.`;
    document.getElementById('kpiSalesRevenue').textContent = `${formatCurrency(totalVentasMonto)} en ventas registradas`;
    document.getElementById('kpiSuppliersCount').textContent = db.proveedores.length;
    document.getElementById('kpiPurchasesUnits').textContent = `${totalComprasMercancia} unidades de mercancía recibidas`;

    const navBadge = document.getElementById('navAlertBadge');
    navBadge.textContent = alertas.length;
    navBadge.style.display = alertas.length > 0 ? 'inline-block' : 'none';

    const banner = document.getElementById('dashboardAlertBanner');
    if (alertas.length > 0) {
      banner.style.display = 'flex';
      document.getElementById('alertBannerTitle').textContent =
        `Alerta de Stock: ${agotados.length} producto(s) agotado(s) y ${bajos.length} con stock bajo`;
      document.getElementById('alertBannerDesc').textContent =
        alertas.map((p) => `${p.codigo} (${p.nombre}: ${p.cantidad} unds.)`).join(' • ');
    } else {
      banner.style.display = 'none';
    }

    const alertsTbody = document.getElementById('dashboardAlertsTableBody');
    if (alertas.length === 0) {
      alertsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Sin alertas pendientes.</td></tr>`;
    } else {
      alertsTbody.innerHTML = alertas
        .map((p) => {
          const st = getStockStatus(p);
          return `
            <tr>
              <td><span class="sku-code">${p.codigo}</span></td>
              <td class="product-cell-main">${p.nombre}</td>
              <td class="mono">${p.cantidad} / mín. ${p.stock_minimo}</td>
              <td><span class="status-badge ${st.badgeClass}">${st.label}</span></td>
            </tr>
          `;
        })
        .join('');
    }

    const salesTbody = document.getElementById('dashboardSalesTableBody');
    salesTbody.innerHTML = db.ventas
      .slice(0, 5)
      .map((v) => {
        const prod = getProductoById(v.id_producto);
        return `
          <tr>
            <td>
              <div class="product-cell-main">${prod ? prod.nombre : 'Producto'}</div>
              <div class="product-cell-sub">${prod ? prod.codigo : ''}</div>
            </td>
            <td class="mono">${v.cantidad_producto} unds.</td>
            <td class="mono"><strong>${formatCurrency(v.monto)}</strong></td>
            <td class="product-cell-sub">${v.fecha}</td>
          </tr>
        `;
      })
      .join('');
  }

  // 2. PRODUCTOS (INVENTARIO)
  function renderProductos() {
    const searchVal = (document.getElementById('inventorySearchInput')?.value || '').trim().toLowerCase();
    const catVal = document.getElementById('inventoryCategoryFilter')?.value || 'todas';

    const filtered = db.productos.filter((p) => {
      const prov = getProveedorById(p.id_proveedor);
      const provName = prov ? prov.nombre.toLowerCase() : '';
      const matchesSearch =
        p.codigo.toLowerCase().includes(searchVal) ||
        p.nombre.toLowerCase().includes(searchVal) ||
        provName.includes(searchVal);

      const matchesCat = catVal === 'todas' || p.categoria === catVal;
      const st = getStockStatus(p).key;
      let matchesStock = true;
      if (currentStockFilter === 'disponibles') matchesStock = p.cantidad > 0;
      if (currentStockFilter === 'bajo') matchesStock = st === 'bajo';
      if (currentStockFilter === 'agotados') matchesStock = st === 'agotado';

      return matchesSearch && matchesCat && matchesStock;
    });

    const tbody = document.getElementById('inventoryTableBody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-muted);">No se encontraron productos.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((p) => {
        const st = getStockStatus(p);
        const prov = getProveedorById(p.id_proveedor);
        return `
          <tr>
            <td class="mono">#${p.id_producto}</td>
            <td><span class="sku-code">${p.codigo}</span></td>
            <td class="product-cell-main">${p.nombre}</td>
            <td>${p.categoria}</td>
            <td class="mono"><strong>${p.cantidad}</strong></td>
            <td class="mono">${p.stock_minimo}</td>
            <td class="mono">${formatCurrency(p.precio)}</td>
            <td class="mono">${p.fecha_ingreso}</td>
            <td>${prov ? prov.nombre : 'Sin asignar'}</td>
            <td><span class="status-badge ${st.badgeClass}">${st.label}</span></td>
            <td>
              <div class="actions-cell">
                <button type="button" class="icon-btn" data-edit-prod="${p.id_producto}" title="Editar producto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  </svg>
                </button>
                <button type="button" class="icon-btn danger" data-del-prod="${p.id_producto}" title="Eliminar producto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // 3. VENTAS
  function renderVentas() {
    const searchVal = (document.getElementById('salesSearchInput')?.value || '').trim().toLowerCase();

    const totalUnidades = db.ventas.reduce((acc, v) => acc + Number(v.cantidad_producto), 0);
    const totalMonto = db.ventas.reduce((acc, v) => acc + Number(v.monto), 0);

    document.getElementById('salesViewTotalUnits').textContent = `${totalUnidades} unds.`;
    document.getElementById('salesViewCount').textContent = db.ventas.length;
    document.getElementById('salesViewTotalAmount').textContent = formatCurrency(totalMonto);

    const filtered = db.ventas.filter((v) => {
      const prod = getProductoById(v.id_producto);
      const prodName = prod ? `${prod.codigo} ${prod.nombre}`.toLowerCase() : '';
      return (
        String(v.id_venta).includes(searchVal) ||
        (v.descripcion || '').toLowerCase().includes(searchVal) ||
        prodName.includes(searchVal)
      );
    });

    const tbody = document.getElementById('salesTableBody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No hay ventas registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((v) => {
        const prod = getProductoById(v.id_producto);
        const usr = getUsuarioById(v.id_usuario);
        return `
          <tr>
            <td class="mono"><strong>#${v.id_venta}</strong></td>
            <td class="mono">${v.fecha}</td>
            <td>
              <span class="sku-code">${prod ? prod.codigo : ''}</span>
              <strong style="margin-left:6px;">${prod ? prod.nombre : 'Producto'}</strong>
            </td>
            <td class="mono"><strong>${v.cantidad_producto}</strong> unds.</td>
            <td class="mono"><strong>${formatCurrency(v.monto)}</strong></td>
            <td>${v.descripcion || '-'}</td>
            <td>${usr ? usr.nombre_completo : '-'}</td>
          </tr>
        `;
      })
      .join('');
  }

  // 4. PROVEEDORES Y COMPRAS
  function renderProveedoresYCompras() {
    const supTbody = document.getElementById('suppliersTableBody');
    supTbody.innerHTML = db.proveedores
      .map(
        (s) => `
        <tr>
          <td class="mono"><strong>#${s.id_proveedor}</strong></td>
          <td class="mono">${s.rif}</td>
          <td class="product-cell-main">${s.nombre}</td>
          <td>${s.ubicacion}</td>
          <td class="mono">${s.telefono}</td>
          <td>${s.correo}</td>
          <td>
            <div class="actions-cell">
              <button type="button" class="icon-btn" data-edit-sup="${s.id_proveedor}" title="Editar proveedor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    const purTbody = document.getElementById('purchasesTableBody');
    purTbody.innerHTML = db.compras
      .map((c) => {
        const prov = getProveedorById(c.id_proveedor);
        const prod = getProductoById(c.id_producto);
        return `
          <tr>
            <td class="mono"><strong>#${c.id_compra}</strong></td>
            <td class="mono">${c.fecha_compra}</td>
            <td class="product-cell-main">${prov ? prov.nombre : '-'}</td>
            <td>${prod ? `${prod.codigo} - ${prod.nombre}` : '-'}</td>
            <td class="mono"><span class="status-badge in-stock">+${c.cantidad_mercancia} unds.</span></td>
            <td class="mono"><strong>${formatCurrency(c.monto_compra)}</strong></td>
          </tr>
        `;
      })
      .join('');
  }

  // 5. REPORTES
  function renderReportes() {
    const nowStr = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const printDateLabel = document.getElementById('printDateLabel');
    if (printDateLabel) printDateLabel.textContent = `Emitido: ${nowStr}`;

    // 5.1 Reporte de Inventario
    const disp = db.productos.filter((p) => p.cantidad > 0);
    const agot = db.productos.filter((p) => p.cantidad <= 0);
    const totalCant = db.productos.reduce((acc, p) => acc + Number(p.cantidad), 0);
    const totalValor = db.productos.reduce((acc, p) => acc + Number(p.cantidad) * Number(p.precio), 0);

    document.getElementById('repInvInStockCount').textContent = disp.length;
    document.getElementById('repInvOutStockCount').textContent = agot.length;
    document.getElementById('repInvTotalUnits').textContent = `${totalCant} unds.`;
    document.getElementById('repInvTotalValue').textContent = `Valorizado en ${formatCurrency(totalValor)}`;

    document.getElementById('repInventarioTableBody').innerHTML = db.productos
      .map((p) => {
        const st = getStockStatus(p);
        return `
          <tr>
            <td><span class="sku-code">${p.codigo}</span></td>
            <td class="product-cell-main">${p.nombre}</td>
            <td>${p.categoria}</td>
            <td class="mono">${p.fecha_ingreso}</td>
            <td class="mono"><strong>${p.cantidad}</strong></td>
            <td class="mono">${p.stock_minimo}</td>
            <td class="mono">${formatCurrency(p.precio)}</td>
            <td><span class="status-badge ${st.badgeClass}">${st.label}</span></td>
          </tr>
        `;
      })
      .join('');

    // 5.2 Reporte de Ventas (Más vendidos)
    const grouped = {};
    db.ventas.forEach((v) => {
      if (!grouped[v.id_producto]) {
        const prod = getProductoById(v.id_producto);
        grouped[v.id_producto] = {
          id_producto: v.id_producto,
          codigo: prod ? prod.codigo : '',
          nombre: prod ? prod.nombre : 'Producto',
          categoria: prod ? prod.categoria : '-',
          total_cantidad: 0,
          total_monto: 0
        };
      }
      grouped[v.id_producto].total_cantidad += Number(v.cantidad_producto);
      grouped[v.id_producto].total_monto += Number(v.monto);
    });

    const ranked = Object.values(grouped).sort((a, b) => b.total_cantidad - a.total_cantidad);
    const maxQty = ranked.length > 0 ? ranked[0].total_cantidad : 1;

    document.getElementById('topSellingRankingContainer').innerHTML = ranked
      .map((item, idx) => {
        const pct = Math.max(8, Math.round((item.total_cantidad / maxQty) * 100));
        return `
          <div class="ranking-item">
            <div class="ranking-item-header">
              <span class="ranking-item-title">
                <span class="rank-number">#${idx + 1}</span>
                <span>${item.nombre}</span>
                <span class="sku-code">${item.codigo}</span>
              </span>
              <span class="ranking-item-stats">${item.total_cantidad} unds. (${formatCurrency(item.total_monto)})</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      })
      .join('');

    document.getElementById('repVentasTableBody').innerHTML = ranked
      .map(
        (item, idx) => `
        <tr>
          <td class="mono"><strong>#${idx + 1}</strong></td>
          <td><span class="sku-code">${item.codigo}</span></td>
          <td class="product-cell-main">${item.nombre}</td>
          <td>${item.categoria}</td>
          <td class="mono"><strong>${item.total_cantidad} unidades</strong></td>
          <td class="mono"><strong>${formatCurrency(item.total_monto)}</strong></td>
        </tr>
      `
      )
      .join('');

    // 5.3 Reporte de Proveedores
    document.getElementById('repProveedoresTableBody').innerHTML = db.proveedores
      .map((s) => {
        const comprasProv = db.compras.filter((c) => Number(c.id_proveedor) === Number(s.id_proveedor));
        const totalMercancia = comprasProv.reduce((acc, c) => acc + Number(c.cantidad_mercancia), 0);
        const totalMonto = comprasProv.reduce((acc, c) => acc + Number(c.monto_compra), 0);

        return `
          <tr>
            <td class="mono">${s.rif}</td>
            <td class="product-cell-main">${s.nombre}</td>
            <td>${s.ubicacion}</td>
            <td class="mono">${s.telefono}</td>
            <td>${s.correo}</td>
            <td class="mono">${comprasProv.length} compra(s)</td>
            <td class="mono"><strong>${totalMercancia} unidades</strong></td>
            <td class="mono"><strong>${formatCurrency(totalMonto)}</strong></td>
          </tr>
        `;
      })
      .join('');
  }

  // 6. USUARIOS
  function renderUsuarios() {
    document.getElementById('securityUsersTableBody').innerHTML = db.usuarios
      .map(
        (u) => `
        <tr>
          <td class="mono"><strong>#${u.id_usuario}</strong></td>
          <td class="product-cell-main">${u.nombre_completo}</td>
          <td class="mono"><strong>${u.usuario}</strong></td>
          <td class="mono">${u.contrasena}</td>
          <td><span class="status-badge in-stock" style="text-transform:capitalize;">${u.rol}</span></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" data-edit-user="${u.id_usuario}">
              Editar / Cambiar Contraseña
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  // 7. BITÁCORA DE AUDITORÍA
  const searchAuditInput = document.getElementById('searchAuditInput');
  const filterAuditUserSelect = document.getElementById('filterAuditUserSelect');
  const filterAuditModuleSelect = document.getElementById('filterAuditModuleSelect');
  const exportAuditBtn = document.getElementById('exportAuditBtn');

  function renderAuditoria() {
    if (!Array.isArray(db.auditoria)) {
      db.auditoria = (window.RufoAudit && window.RufoAudit.INITIAL_AUDIT_LOGS)
        ? JSON.parse(JSON.stringify(window.RufoAudit.INITIAL_AUDIT_LOGS))
        : [];
    }

    const auditList = db.auditoria;

    // Actualizar KPIs
    const totalCount = auditList.length;
    const employeeCount = auditList.filter((a) => a.rol === 'empleado' || a.usuario === 'empleado').length;
    const adminCount = auditList.filter((a) => a.rol === 'administrador' || a.usuario === 'admin').length;
    const alertsCount = auditList.filter(
      (a) => a.modulo === 'Seguridad' || a.accion.includes('DENEGADO') || a.accion.includes('FALLIDO')
    ).length;

    const kpiAuditTotal = document.getElementById('kpiAuditTotal');
    const kpiAuditEmployee = document.getElementById('kpiAuditEmployee');
    const kpiAuditAdmin = document.getElementById('kpiAuditAdmin');
    const kpiAuditAlerts = document.getElementById('kpiAuditAlerts');
    const navAuditBadge = document.getElementById('navAuditBadge');

    if (kpiAuditTotal) kpiAuditTotal.textContent = totalCount;
    if (kpiAuditEmployee) kpiAuditEmployee.textContent = employeeCount;
    if (kpiAuditAdmin) kpiAuditAdmin.textContent = adminCount;
    if (kpiAuditAlerts) kpiAuditAlerts.textContent = alertsCount;
    if (navAuditBadge) navAuditBadge.textContent = totalCount;

    // Filtros de tabla
    const query = (searchAuditInput?.value || '').trim().toLowerCase();
    const userFilter = filterAuditUserSelect?.value || 'todos';
    const moduleFilter = filterAuditModuleSelect?.value || 'todos';

    const filtered = auditList.filter((a) => {
      // Filtro de usuario
      if (userFilter !== 'todos' && (a.usuario || '').toLowerCase() !== userFilter.toLowerCase()) {
        return false;
      }
      // Filtro de módulo
      if (moduleFilter !== 'todos' && (a.modulo || '').toLowerCase() !== moduleFilter.toLowerCase()) {
        return false;
      }
      // Filtro de búsqueda textual
      if (query) {
        const u = (a.usuario || '').toLowerCase();
        const r = (a.rol || '').toLowerCase();
        const m = (a.modulo || '').toLowerCase();
        const ac = (a.accion || '').toLowerCase();
        const d = (a.detalles || '').toLowerCase();
        const ip = (a.ip_origen || '').toLowerCase();
        const fh = (a.fecha_hora || '').toLowerCase();
        return u.includes(query) || r.includes(query) || m.includes(query) ||
               ac.includes(query) || d.includes(query) || ip.includes(query) || fh.includes(query);
      }
      return true;
    });

    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px 20px; color: var(--text-muted);">
            No se encontraron registros de auditoría que coincidan con los filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((a) => {
        let moduleClass = 'badge-module-sys';
        const mod = (a.modulo || '').toLowerCase();
        if (mod.includes('autent')) moduleClass = 'badge-module-auth';
        else if (mod.includes('venta')) moduleClass = 'badge-module-sales';
        else if (mod.includes('invent')) moduleClass = 'badge-module-inv';
        else if (mod.includes('prov') || mod.includes('compra')) moduleClass = 'badge-module-prov';
        else if (mod.includes('segur')) moduleClass = 'badge-module-sec';

        const roleBadge = a.rol === 'administrador'
          ? '<span class="status-badge in-stock" style="font-size: 0.72rem;">Admin</span>'
          : a.rol === 'empleado'
          ? '<span class="status-badge out-stock" style="background:#edf3ff; color:#04105a; border-color:#c7d9fd; font-size: 0.72rem;">Empleado</span>'
          : '<span class="status-badge out-stock" style="font-size: 0.72rem;">Sistema</span>';

        return `
          <tr>
            <td class="mono"><strong>#${a.id_auditoria}</strong></td>
            <td class="mono" style="font-size: 0.82rem; white-space: nowrap;">${a.fecha_hora}</td>
            <td>
              <div style="font-weight: 600; color: var(--text-primary);">${a.usuario}</div>
              ${roleBadge}
            </td>
            <td><span class="badge-module ${moduleClass}">${a.modulo}</span></td>
            <td><span class="action-tag">${a.accion}</span></td>
            <td style="color: var(--text-secondary); font-size: 0.86rem; max-width: 320px;">${a.detalles}</td>
            <td>
              <span class="ip-chip" title="Dirección IP de la estación de origen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
                  <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
                  <line x1="6" x2="6.01" y1="6" y2="6"/>
                  <line x1="6" x2="6.01" y1="18" y2="18"/>
                </svg>
                ${a.ip_origen}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  searchAuditInput?.addEventListener('input', renderAuditoria);
  filterAuditUserSelect?.addEventListener('change', renderAuditoria);
  filterAuditModuleSelect?.addEventListener('change', renderAuditoria);

  // Exportar Bitácora a CSV
  exportAuditBtn?.addEventListener('click', () => {
    if (!Array.isArray(db.auditoria) || db.auditoria.length === 0) {
      showToast('No hay registros de auditoría para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Modulo', 'Accion', 'Detalles', 'IP Origen'];
    const rows = db.auditoria.map((a) => [
      a.id_auditoria,
      `"${a.fecha_hora}"`,
      `"${a.usuario}"`,
      `"${a.rol}"`,
      `"${a.modulo}"`,
      `"${a.accion}"`,
      `"${(a.detalles || '').replace(/"/g, '""')}"`,
      `"${a.ip_origen}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitacora_auditoria_refrigeracion_rufo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Bitácora de auditoría exportada exitosamente.');
  });

  // ==========================================================================
  // Poblar Selectores en Modales
  // ==========================================================================
  function populateSelects() {
    const provOptions = db.proveedores
      .map((p) => `<option value="${p.id_proveedor}">${p.nombre} (${p.rif})</option>`)
      .join('');
    document.getElementById('prodIdProveedor').innerHTML = provOptions;
    document.getElementById('purIdProveedor').innerHTML = provOptions;

    const prodDisponibles = db.productos.filter((p) => p.cantidad > 0);
    const saleProdSelect = document.getElementById('saleIdProducto');
    if (prodDisponibles.length === 0) {
      saleProdSelect.innerHTML = `<option value="">Sin productos con stock disponible</option>`;
    } else {
      saleProdSelect.innerHTML = prodDisponibles
        .map(
          (p) =>
            `<option value="${p.id_producto}">${p.codigo} - ${p.nombre} (Stock: ${p.cantidad} | $${Number(p.precio).toFixed(2)})</option>`
        )
        .join('');
    }

    document.getElementById('purIdProducto').innerHTML = db.productos
      .map((p) => `<option value="${p.id_producto}">${p.codigo} - ${p.nombre} (Stock actual: ${p.cantidad})</option>`)
      .join('');

    const activeUser = getActiveSessionUser();
    document.getElementById('saleIdUsuario').innerHTML = db.usuarios
      .map(
        (u) =>
          `<option value="${u.id_usuario}" ${Number(u.id_usuario) === Number(activeUser.id_usuario) ? 'selected' : ''}>${u.nombre_completo}</option>`
      )
      .join('');

    updateSaleMontoPreview();
  }

  // ==========================================================================
  // Filtros y Pestañas de Reportes
  // ==========================================================================
  document.getElementById('inventorySearchInput')?.addEventListener('input', renderProductos);
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', renderProductos);
  document.querySelectorAll('[data-stock-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentStockFilter = btn.dataset.stockFilter;
      document.querySelectorAll('[data-stock-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderProductos();
    });
  });

  document.getElementById('salesSearchInput')?.addEventListener('input', renderVentas);

  document.querySelectorAll('[data-report]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.report;
      document.querySelectorAll('[data-report]').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.report-section').forEach((sec) => sec.classList.toggle('active', sec.id === target));
    });
  });

  document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());

  // ==========================================================================
  // Modales y Formularios
  // ==========================================================================
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add('open');
      m.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    }
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  function todayIso() {
    return new Date().toISOString().split('T')[0];
  }

  // --- Productos ---
  document.getElementById('openNewProductModalBtn')?.addEventListener('click', () => {
    document.getElementById('productForm').reset();
    document.getElementById('prodIdInput').value = '';
    document.getElementById('productModalTitle').textContent = 'Agregar Producto';
    const maxNum = db.productos.reduce((m, p) => {
      const match = String(p.codigo).match(/(\d+)$/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, db.productos.length);
    const nextCode = String(maxNum + 1).padStart(3, '0');
    document.getElementById('prodCodigo').value = `REF-${nextCode}`;
    document.getElementById('prodFechaIngreso').value = todayIso();
    openModal('productModal');
  });

  document.getElementById('inventoryTableBody')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-prod]');
    if (editBtn) {
      const p = getProductoById(editBtn.dataset.editProd);
      if (!p) return;
      document.getElementById('prodIdInput').value = p.id_producto;
      document.getElementById('productModalTitle').textContent = `Editar Producto (${p.codigo})`;
      document.getElementById('prodCodigo').value = p.codigo;
      document.getElementById('prodCategoria').value = p.categoria;
      document.getElementById('prodNombre').value = p.nombre;
      document.getElementById('prodCantidad').value = p.cantidad;
      document.getElementById('prodStockMinimo').value = p.stock_minimo;
      document.getElementById('prodPrecio').value = p.precio;
      document.getElementById('prodFechaIngreso').value = p.fecha_ingreso;
      document.getElementById('prodIdProveedor').value = p.id_proveedor;
      openModal('productModal');
      return;
    }

    const delBtn = e.target.closest('[data-del-prod]');
    if (delBtn) {
      const id = Number(delBtn.dataset.delProd);
      const prodToDelete = getProductoById(id);
      try {
        const res = await apiRequest('eliminar_producto', { id_producto: id });
        renderAll();
        showToast(res.mensaje || 'Producto eliminado del inventario.');
      } catch (err) {
        if (!isDbConnected) {
          db.productos = db.productos.filter((p) => Number(p.id_producto) !== id);
          saveDb();
          renderAll();
          showToast('Producto eliminado (Modo Local).');
        } else {
          showToast(err.message);
          return;
        }
      }

      if (window.RufoAudit) {
        window.RufoAudit.logEvent({
          modulo: 'Inventario',
          accion: 'ELIMINACION_PRODUCTO',
          detalles: `Repuesto eliminado del inventario: ID #${id} (${prodToDelete ? prodToDelete.nombre : 'Repuesto'})`,
          user: currentUser
        });
      }
    }
  });

  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('prodIdInput').value;
    const payload = {
      id_producto: editId ? Number(editId) : null,
      codigo: document.getElementById('prodCodigo').value.trim().toUpperCase(),
      nombre: document.getElementById('prodNombre').value.trim(),
      categoria: document.getElementById('prodCategoria').value,
      cantidad: parseInt(document.getElementById('prodCantidad').value, 10) || 0,
      stock_minimo: parseInt(document.getElementById('prodStockMinimo').value, 10) || 5,
      precio: parseFloat(document.getElementById('prodPrecio').value) || 0,
      fecha_ingreso: document.getElementById('prodFechaIngreso').value,
      id_proveedor: parseInt(document.getElementById('prodIdProveedor').value, 10)
    };

    try {
      const res = await apiRequest('guardar_producto', payload);
      closeModal('productModal');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      if (!isDbConnected) {
        const maxId = db.productos.reduce((m, p) => Math.max(m, Number(p.id_producto)), 0);
        const record = { ...payload, id_producto: editId ? Number(editId) : maxId + 1 };
        if (editId) {
          const idx = db.productos.findIndex((p) => Number(p.id_producto) === Number(editId));
          if (idx !== -1) db.productos[idx] = record;
        } else {
          db.productos.push(record);
        }
        saveDb();
        closeModal('productModal');
        renderAll();
        showToast('Producto guardado (Modo Local).');
      } else {
        showToast(err.message);
        return;
      }
    }

    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Inventario',
        accion: editId ? 'MODIFICACION_PRODUCTO' : 'CREACION_PRODUCTO',
        detalles: `${editId ? 'Repuesto modificado' : 'Nuevo repuesto ingresado'}: ${payload.nombre} (${payload.codigo}) con ${payload.cantidad} unidades`,
        user: currentUser
      });
    }
  });

  // --- Ventas ---
  function updateSaleMontoPreview() {
    const idProd = document.getElementById('saleIdProducto')?.value;
    const cant = parseInt(document.getElementById('saleCantidadProducto')?.value, 10) || 0;
    const prod = getProductoById(idProd);
    const montoInput = document.getElementById('saleMonto');
    if (prod && montoInput) {
      montoInput.value = (Number(prod.precio) * cant).toFixed(2);
      document.getElementById('saleCantidadProducto').max = prod.cantidad;
    } else if (montoInput) {
      montoInput.value = '0.00';
    }
  }

  document.getElementById('saleIdProducto')?.addEventListener('change', updateSaleMontoPreview);
  document.getElementById('saleCantidadProducto')?.addEventListener('input', updateSaleMontoPreview);

  document.getElementById('openNewSaleModalBtn')?.addEventListener('click', () => {
    populateSelects();
    document.getElementById('saleCantidadProducto').value = 1;
    document.getElementById('saleDescripcion').value = 'Venta al detal en mostrador';
    updateSaleMontoPreview();
    openModal('saleModal');
  });

  document.getElementById('saleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_producto = parseInt(document.getElementById('saleIdProducto').value, 10);
    const cantidad_producto = parseInt(document.getElementById('saleCantidadProducto').value, 10) || 0;
    const descripcion = document.getElementById('saleDescripcion').value.trim();
    const id_usuario = parseInt(document.getElementById('saleIdUsuario').value, 10);

    const prod = getProductoById(id_producto);
    if (!prod || cantidad_producto <= 0) return;

    if (cantidad_producto > prod.cantidad) {
      showToast(`Stock insuficiente: solo hay ${prod.cantidad} unidades disponibles.`);
      return;
    }

    try {
      const res = await apiRequest('registrar_venta', {
        id_producto,
        cantidad_producto,
        descripcion,
        id_usuario
      });
      closeModal('saleModal');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      if (!isDbConnected) {
        prod.cantidad -= cantidad_producto;
        const maxId = db.ventas.reduce((m, v) => Math.max(m, Number(v.id_venta)), 0);
        const now = new Date();
        const fecha = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
        db.ventas.unshift({
          id_venta: maxId + 1,
          fecha,
          id_producto,
          cantidad_producto,
          monto: Number((prod.precio * cantidad_producto).toFixed(2)),
          descripcion,
          id_usuario
        });
        saveDb();
        closeModal('saleModal');
        renderAll();
        showToast('Venta registrada (Modo Local).');
      } else {
        showToast(err.message);
        return;
      }
    }

    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Ventas',
        accion: 'REGISTRO_VENTA',
        detalles: `Venta registrada: ${cantidad_producto}x ${prod.nombre} (${formatCurrency(prod.precio * cantidad_producto)})`,
        user: currentUser
      });
    }
  });

  // --- Proveedores ---
  document.getElementById('openNewSupplierModalBtn')?.addEventListener('click', () => {
    document.getElementById('supplierForm').reset();
    document.getElementById('supIdInput').value = '';
    document.getElementById('supplierModalTitle').textContent = 'Registrar Proveedor';
    openModal('supplierModal');
  });

  document.getElementById('suppliersTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-sup]');
    if (!btn) return;
    const sup = getProveedorById(btn.dataset.editSup);
    if (!sup) return;

    document.getElementById('supIdInput').value = sup.id_proveedor;
    document.getElementById('supplierModalTitle').textContent = 'Editar Proveedor';
    document.getElementById('supRif').value = sup.rif;
    document.getElementById('supNombre').value = sup.nombre;
    document.getElementById('supUbicacion').value = sup.ubicacion;
    document.getElementById('supTelefono').value = sup.telefono;
    document.getElementById('supCorreo').value = sup.correo;
    openModal('supplierModal');
  });

  document.getElementById('supplierForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('supIdInput').value;
    const payload = {
      id_proveedor: editId ? Number(editId) : null,
      rif: document.getElementById('supRif').value.trim().toUpperCase(),
      nombre: document.getElementById('supNombre').value.trim(),
      ubicacion: document.getElementById('supUbicacion').value.trim(),
      telefono: document.getElementById('supTelefono').value.trim(),
      correo: document.getElementById('supCorreo').value.trim()
    };

    try {
      const res = await apiRequest('guardar_proveedor', payload);
      closeModal('supplierModal');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      if (!isDbConnected) {
        const maxId = db.proveedores.reduce((m, s) => Math.max(m, Number(s.id_proveedor)), 0);
        const record = { ...payload, id_proveedor: editId ? Number(editId) : maxId + 1 };
        if (editId) {
          const idx = db.proveedores.findIndex((s) => Number(s.id_proveedor) === Number(editId));
          if (idx !== -1) db.proveedores[idx] = record;
        } else {
          db.proveedores.push(record);
        }
        saveDb();
        closeModal('supplierModal');
        renderAll();
        showToast('Proveedor guardado (Modo Local).');
      } else {
        showToast(err.message);
        return;
      }
    }

    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Proveedores',
        accion: editId ? 'MODIFICACION_PROVEEDOR' : 'CREACION_PROVEEDOR',
        detalles: `Proveedor ${editId ? 'actualizado' : 'registrado'}: ${payload.nombre} (${payload.rif})`,
        user: currentUser
      });
    }
  });

  // --- Compras ---
  document.getElementById('openNewPurchaseModalBtn')?.addEventListener('click', () => {
    populateSelects();
    document.getElementById('purFechaCompra').value = todayIso();
    openModal('purchaseModal');
  });

  document.getElementById('purchaseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha_compra = document.getElementById('purFechaCompra').value;
    const id_proveedor = parseInt(document.getElementById('purIdProveedor').value, 10);
    const id_producto = parseInt(document.getElementById('purIdProducto').value, 10);
    const cantidad_mercancia = parseInt(document.getElementById('purCantidadMercancia').value, 10) || 0;
    const monto_compra = parseFloat(document.getElementById('purMontoCompra').value) || 0;

    const prod = getProductoById(id_producto);
    if (!prod || cantidad_mercancia <= 0) return;

    try {
      const res = await apiRequest('registrar_compra', {
        fecha_compra,
        id_proveedor,
        id_producto,
        cantidad_mercancia,
        monto_compra
      });
      closeModal('purchaseModal');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      if (!isDbConnected) {
        prod.cantidad += cantidad_mercancia;
        prod.fecha_ingreso = fecha_compra;
        const maxId = db.compras.reduce((m, c) => Math.max(m, Number(c.id_compra)), 0);
        db.compras.unshift({
          id_compra: maxId + 1,
          fecha_compra,
          id_proveedor,
          id_producto,
          cantidad_mercancia,
          monto_compra
        });
        saveDb();
        closeModal('purchaseModal');
        renderAll();
        showToast(`Compra registrada (Modo Local): +${cantidad_mercancia} unidades.`);
      } else {
        showToast(err.message);
        return;
      }
    }

    if (window.RufoAudit) {
      const prov = getProveedorById(id_proveedor);
      window.RufoAudit.logEvent({
        modulo: 'Compras',
        accion: 'REGISTRO_COMPRA',
        detalles: `Compra registrada a proveedor "${prov ? prov.nombre : 'ID ' + id_proveedor}": +${cantidad_mercancia} unds. de ${prod.nombre} (${formatCurrency(monto_compra)})`,
        user: currentUser
      });
    }
  });

  // --- Usuarios ---
  document.getElementById('openNewUserModalBtn')?.addEventListener('click', () => {
    const activeUser = getActiveSessionUser();
    if (activeUser.rol !== 'administrador') {
      showToast('Restricción de seguridad: solo el Administrador puede gestionar usuarios.');
      return;
    }
    document.getElementById('userForm').reset();
    document.getElementById('userIdInput').value = '';
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    openModal('userModal');
  });

  document.getElementById('securityUsersTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit-user]');
    if (!btn) return;
    const activeUser = getActiveSessionUser();
    if (activeUser.rol !== 'administrador') {
      showToast('Restricción de seguridad: solo el Administrador puede cambiar contraseñas.');
      return;
    }
    const usr = getUsuarioById(btn.dataset.editUser);
    if (!usr) return;

    document.getElementById('userIdInput').value = usr.id_usuario;
    document.getElementById('userModalTitle').textContent = `Editar Usuario (${usr.usuario})`;
    document.getElementById('userNombreCompleto').value = usr.nombre_completo;
    document.getElementById('userUsuario').value = usr.usuario;
    document.getElementById('userRol').value = usr.rol;
    document.getElementById('userContrasena').value = usr.contrasena;
    openModal('userModal');
  });

  document.getElementById('userForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('userIdInput').value;
    const payload = {
      id_usuario: editId ? Number(editId) : null,
      nombre_completo: document.getElementById('userNombreCompleto').value.trim(),
      usuario: document.getElementById('userUsuario').value.trim().toLowerCase(),
      contrasena: document.getElementById('userContrasena').value.trim(),
      rol: document.getElementById('userRol').value
    };

    try {
      const res = await apiRequest('guardar_usuario', payload);
      closeModal('userModal');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      if (!isDbConnected) {
        const maxId = db.usuarios.reduce((m, u) => Math.max(m, Number(u.id_usuario)), 0);
        const record = { ...payload, id_usuario: editId ? Number(editId) : maxId + 1 };
        if (editId) {
          const idx = db.usuarios.findIndex((u) => Number(u.id_usuario) === Number(editId));
          if (idx !== -1) db.usuarios[idx] = record;
        } else {
          db.usuarios.push(record);
        }
        saveDb();
        closeModal('userModal');
        renderAll();
        showToast('Usuario guardado (Modo Local).');
      } else {
        showToast(err.message);
        return;
      }
    }

    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Seguridad',
        accion: editId ? 'MODIFICACION_USUARIO' : 'CREACION_USUARIO',
        detalles: `Usuario ${editId ? 'modificado' : 'creado'}: "${payload.usuario}" (Rol: ${payload.rol})`,
        user: currentUser
      });
    }
  });

  // Restaurar Datos Iniciales en la Base de Datos MySQL o Local
  document.getElementById('resetDemoDataBtn')?.addEventListener('click', async () => {
    try {
      const res = await apiRequest('restaurar_datos');
      renderAll();
      showToast(res.mensaje);
    } catch (err) {
      db = JSON.parse(JSON.stringify(INITIAL_DB));
      saveDb();
      renderAll();
      showToast('Datos del sistema restaurados localmente.');
    }

    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Sistema',
        accion: 'RESTAURACION_DATOS',
        detalles: 'Base de datos restaurada a valores de fábrica por el Administrador',
        user: currentUser
      });
    }
  });

  applySessionProfile();
  renderAll();
  syncWithDatabase();
});
