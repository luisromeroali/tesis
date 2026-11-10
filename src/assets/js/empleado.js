/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Controlador del Panel de Empleado (Acceso Limitado y Supervisado)
 * Funcionalidad: Registro Diario de Ventas e Inmutabilidad de Registros Históricos
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

  // ==========================================================================
  // 1. Verificación de Autenticación y Control de Roles
  // ==========================================================================
  function checkSession() {
    let activeUser = null;
    try {
      const stored =
        sessionStorage.getItem('rufo_active_user') ||
        localStorage.getItem('rufo_active_user') ||
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SESSION_KEY);
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {
      console.error('Error al leer sesión activa:', e);
    }

    if (!activeUser) {
      window.location.href = 'index.html';
      return null;
    }

    // Actualizar datos del usuario en la interfaz
    const empFullName = document.getElementById('empFullName');
    const empAvatar = document.getElementById('empAvatar');
    const kpiOperatorName = document.getElementById('kpiOperatorName');

    if (empFullName && activeUser.nombre_completo) {
      empFullName.textContent = activeUser.nombre_completo;
    }

    if (kpiOperatorName && activeUser.nombre_completo) {
      kpiOperatorName.textContent = activeUser.nombre_completo;
    }

    if (empAvatar && activeUser.nombre_completo) {
      const parts = activeUser.nombre_completo.trim().split(/\s+/);
      empAvatar.textContent = parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }

    // Si un administrador visita la interfaz, habilitar botón de retorno
    if (activeUser.rol === 'administrador') {
      const supervisorBtn = document.getElementById('adminSupervisorAction');
      if (supervisorBtn) supervisorBtn.style.display = 'block';
    }

    return activeUser;
  }

  const currentUser = checkSession();
  if (!currentUser) return;

  // ==========================================================================
  // 2. Base de Datos Relacional (Compartida con el Panel Administrador)
  // ==========================================================================
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
    ]
  };

  let db = loadDb();

  function loadDb() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error al leer base de datos:', err);
    }
    const clone = JSON.parse(JSON.stringify(INITIAL_DB));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
    return clone;
  }

  function saveDb() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function updateConnectionBadge(connected) {
    isDbConnected = connected;
    const badge = document.getElementById('dbStatusBadge');
    if (!badge) return;
    badge.style.display = 'none';
  }

  async function apiRequest(action, payload = {}) {
    const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.mensaje || 'Error al procesar la operación en la base de datos.');
    }
    if (data.db) {
      db = data.db;
      saveDb();
    }
    updateConnectionBadge(true);
    return data;
  }

  async function syncWithDatabase() {
    try {
      const response = await fetch(`${API_URL}?action=init`);
      const data = await response.json();
      if (response.ok && data.ok && data.db) {
        db = data.db;
        saveDb();
        updateConnectionBadge(true);
        renderDailySales();
        renderCatalog();
      } else {
        updateConnectionBadge(false);
      }
    } catch (err) {
      updateConnectionBadge(false);
    }
  }

  function getProductoById(id_producto) {
    return db.productos.find((p) => Number(p.id_producto) === Number(id_producto));
  }

  function formatMoney(amount) {
    return `$${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getLocalDateTimeMinutes() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  // ==========================================================================
  // 3. Notificación Toast Flotante
  // ==========================================================================
  const toastNotification = document.getElementById('toastNotification');
  let toastTimer = null;

  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3500);
  }

  // ==========================================================================
  // 4. Navegación entre Vistas (Registro Diario / Consulta de Inventario)
  // ==========================================================================
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
  const moduleViews = document.querySelectorAll('.module-view');
  const topbarTitle = document.getElementById('empTopbarTitle');
  const topbarSubtitle = document.getElementById('empTopbarSubtitle');

  // Inicializar fecha formateada en barra superior
  const empTopbarDateText = document.getElementById('empTopbarDateText');
  if (empTopbarDateText) {
    const now = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' };
    const dateFormatted = now.toLocaleDateString('es-ES', options);
    empTopbarDateText.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
  }

  const VIEW_TITLES = {
    diario: {
      title: '¡Bienvenida!',
      subtitle: ''
    },
    'inventario-consulta': {
      title: 'Consulta de Inventario',
      subtitle: ''
    }
  };

  function switchView(viewKey) {
    navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewKey);
    });

    moduleViews.forEach((view) => {
      view.classList.toggle('active', view.id === `view-${viewKey}`);
    });

    if (VIEW_TITLES[viewKey]) {
      if (topbarTitle) topbarTitle.textContent = VIEW_TITLES[viewKey].title;
      if (topbarSubtitle) {
        topbarSubtitle.textContent = VIEW_TITLES[viewKey].subtitle;
        topbarSubtitle.style.display = VIEW_TITLES[viewKey].subtitle ? 'block' : 'none';
      }
    }

    // Cerrar sidebar en dispositivos móviles
    document.getElementById('sidebar')?.classList.remove('open');
  }

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.view) switchView(btn.dataset.view);
    });
  });

  // Menú móvil
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // ==========================================================================
  // 5. Cierre de Sesión Seguro
  // ==========================================================================
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Registro en Bitácora de Auditoría
      if (window.RufoAudit) {
        window.RufoAudit.logEvent({
          modulo: 'Autenticación',
          accion: 'CIERRE_SESION',
          detalles: `Cierre de sesión de operador (${currentUser.nombre_completo})`,
          user: currentUser
        });
      }

      localStorage.removeItem('rufo_active_user');
      sessionStorage.removeItem('rufo_active_user');
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
    });
  });

  // ==========================================================================
  // 6. Lógica de Registro Diario y KPIs de la Jornada
  // ==========================================================================
  const todaySalesTableBody = document.getElementById('todaySalesTableBody');
  const searchTodaySalesInput = document.getElementById('searchTodaySalesInput');
  const navTodaySalesBadge = document.getElementById('navTodaySalesBadge');

  const kpiTodayRevenue = document.getElementById('kpiTodayRevenue');
  const kpiTodayUnits = document.getElementById('kpiTodayUnits');
  const kpiTodayCount = document.getElementById('kpiTodayCount');
  const kpiTodayDate = document.getElementById('kpiTodayDate');

  const salesTableTitle = document.getElementById('salesTableTitle');
  const salesTableSubtitle = document.getElementById('salesTableSubtitle');
  const modeTodayBtn = document.getElementById('modeTodayBtn');
  const modeHistoryBtn = document.getElementById('modeHistoryBtn');

  let currentSalesMode = 'today'; // 'today' | 'history'

  modeTodayBtn?.addEventListener('click', () => {
    currentSalesMode = 'today';
    modeTodayBtn.className = 'filter-pill-btn active';
    modeHistoryBtn.className = 'filter-pill-btn';
    if (salesTableTitle) salesTableTitle.textContent = 'Operaciones y Ventas del Día';
    if (salesTableSubtitle) {
      salesTableSubtitle.textContent = '';
      salesTableSubtitle.style.display = 'none';
    }
    renderDailySales();
  });

  modeHistoryBtn?.addEventListener('click', () => {
    currentSalesMode = 'history';
    modeTodayBtn.className = 'filter-pill-btn';
    modeHistoryBtn.className = 'filter-pill-btn active';
    if (salesTableTitle) salesTableTitle.textContent = 'Historial de Ventas Pasadas';
    if (salesTableSubtitle) {
      salesTableSubtitle.textContent = '';
      salesTableSubtitle.style.display = 'none';
    }
    renderDailySales();
  });

  function renderDailySales() {
    const todayStr = getTodayDateString();
    kpiTodayDate.textContent = `Fecha: ${todayStr}`;

    // Filtrar ventas realizadas en la fecha actual para los KPIs de la jornada
    const allSales = [...db.ventas];
    const todaySales = allSales.filter((v) => v.fecha && v.fecha.startsWith(todayStr));

    const totalRevenue = todaySales.reduce((sum, v) => sum + Number(v.monto || 0), 0);
    const totalUnits = todaySales.reduce((sum, v) => sum + Number(v.cantidad_producto || 0), 0);
    const totalCount = todaySales.length;

    kpiTodayRevenue.textContent = formatMoney(totalRevenue);
    kpiTodayUnits.textContent = totalUnits;
    kpiTodayCount.textContent = totalCount;
    navTodaySalesBadge.textContent = totalCount;

    // Determinar conjunto de datos según el modo activo
    const baseList = currentSalesMode === 'today' ? todaySales : allSales;

    // Aplicar filtro de búsqueda
    const query = (searchTodaySalesInput.value || '').trim().toLowerCase();
    const filteredSales = baseList.filter((v) => {
      const prod = getProductoById(v.id_producto);
      const prodName = prod ? prod.nombre.toLowerCase() : '';
      const prodCode = prod ? prod.codigo.toLowerCase() : '';
      const desc = (v.descripcion || '').toLowerCase();
      const dateText = (v.fecha || '').toLowerCase();
      return prodName.includes(query) || prodCode.includes(query) || desc.includes(query) || dateText.includes(query);
    });

    if (filteredSales.length === 0) {
      if (baseList.length === 0) {
        todaySalesTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding: 36px 20px; color: var(--text-muted);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; display: block; opacity: 0.5;">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <strong style="display: block; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-secondary);">
                Aún no se han registrado operaciones de venta el día de hoy (${todayStr}).
              </strong>
              <span>Haga clic en el botón <strong>"+ Registrar Venta del Día"</strong> para ingresar la primera operación de mostrador.</span>
            </td>
          </tr>
        `;
      } else {
        todaySalesTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">
              No se encontraron operaciones que coincidan con "<strong>${query}</strong>".
            </td>
          </tr>
        `;
      }
      return;
    }

    todaySalesTableBody.innerHTML = filteredSales
      .map((v) => {
        const prod = getProductoById(v.id_producto);
        const prodName = prod ? prod.nombre : 'Producto no identificado';
        const prodCode = prod ? prod.codigo : 'N/A';
        const dateDisplay = currentSalesMode === 'today' ? (v.fecha.split(' ')[1] || v.fecha) : v.fecha;
        const badgeLabel = currentSalesMode === 'today' ? 'Inmutable' : 'Histórico Protegido';

        return `
          <tr>
            <td class="mono"><strong>#${v.id_venta}</strong></td>
            <td class="mono" style="font-weight: 500;">${dateDisplay}</td>
            <td>
              <div style="font-weight: 600; color: var(--text-primary);">${prodName}</div>
              <div class="mono" style="font-size: 0.78rem; color: var(--text-muted);">Cód: ${prodCode}</div>
            </td>
            <td class="mono"><strong>${v.cantidad_producto}</strong> unid.</td>
            <td class="mono" style="font-weight: 700; color: var(--blue-900);">${formatMoney(v.monto)}</td>
            <td style="color: var(--text-secondary); font-size: 0.85rem;">${v.descripcion || 'Venta al detal'}</td>
            <td>
              <span class="badge-immutable" title="Registro certificado e inmutable. No admite modificaciones ni eliminación.">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                ${badgeLabel}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  searchTodaySalesInput?.addEventListener('input', renderDailySales);

  // ==========================================================================
  // 7. Lógica del Catálogo de Inventario (Solo Lectura)
  // ==========================================================================
  const catalogTableBody = document.getElementById('catalogTableBody');
  const searchInventoryInput = document.getElementById('searchInventoryInput');

  function renderCatalog() {
    const query = (searchInventoryInput.value || '').trim().toLowerCase();

    const filteredProds = db.productos.filter((p) => {
      const code = (p.codigo || '').toLowerCase();
      const name = (p.nombre || '').toLowerCase();
      const cat = (p.categoria || '').toLowerCase();
      return code.includes(query) || name.includes(query) || cat.includes(query);
    });

    if (filteredProds.length === 0) {
      catalogTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">
            No se encontraron repuestos que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    catalogTableBody.innerHTML = filteredProds
      .map((p) => {
        let stockBadge = '';
        if (Number(p.cantidad) <= 0) {
          stockBadge = '<span class="status-chip chip-danger"><span class="chip-dot"></span>Agotado</span>';
        } else if (Number(p.cantidad) <= Number(p.stock_minimo)) {
          stockBadge = '<span class="status-chip chip-amber"><span class="chip-dot"></span>Stock Mínimo</span>';
        } else {
          stockBadge = '<span class="status-chip chip-ok"><span class="chip-dot"></span>Disponible</span>';
        }

        return `
          <tr>
            <td class="mono"><strong>${p.codigo}</strong></td>
            <td><strong>${p.nombre}</strong></td>
            <td><span class="category-tag">${p.categoria}</span></td>
            <td class="mono" style="font-weight: 700; color: var(--blue-900);">${formatMoney(p.precio)}</td>
            <td class="mono">
              <strong>${p.cantidad}</strong> unidades
              <div style="font-size: 0.75rem; color: var(--text-muted);">Mínimo: ${p.stock_minimo}</div>
            </td>
            <td>${stockBadge}</td>
          </tr>
        `;
      })
      .join('');
  }

  searchInventoryInput?.addEventListener('input', renderCatalog);

  // ==========================================================================
  // 8. Modal: Registrar Operación / Venta del Día
  // ==========================================================================
  const dailySaleModal = document.getElementById('dailySaleModal');
  const openNewSaleBtn = document.getElementById('openNewSaleBtn');
  const closeDailySaleX = document.getElementById('closeDailySaleX');
  const cancelSaleBtn = document.getElementById('cancelSaleBtn');
  const dailySaleForm = document.getElementById('dailySaleForm');

  const saleProductSelect = document.getElementById('saleProductSelect');
  const saleQuantityInput = document.getElementById('saleQuantityInput');
  const saleUnitPriceInput = document.getElementById('saleUnitPriceInput');
  const saleTotalAmountDisplay = document.getElementById('saleTotalAmountDisplay');
  const saleDescriptionInput = document.getElementById('saleDescriptionInput');
  const saleDateLocked = document.getElementById('saleDateLocked');
  const stockUnitsDisplay = document.getElementById('stockUnitsDisplay');
  const confirmSaleBtn = document.getElementById('confirmSaleBtn');

  function openSaleModal() {
    // Rellenar selector de productos con existencias
    saleProductSelect.innerHTML = '<option value="">-- Seleccione un repuesto --</option>' +
      db.productos
        .map((p) => {
          const isOut = Number(p.cantidad) <= 0;
          const statusText = isOut ? ' (AGOTADO)' : ` (Disponibles: ${p.cantidad})`;
          return `<option value="${p.id_producto}" data-price="${p.precio}" data-stock="${p.cantidad}">
            ${p.codigo} - ${p.nombre} ${statusText}
          </option>`;
        })
        .join('');

    // Restablecer campos
    saleProductSelect.value = '';
    saleQuantityInput.value = 1;
    saleUnitPriceInput.value = '0.00';
    saleTotalAmountDisplay.textContent = '$0.00';
    saleDescriptionInput.value = 'Venta al detal en mostrador';
    stockUnitsDisplay.textContent = 'Seleccione un repuesto';
    stockUnitsDisplay.className = 'stock-ok';

    // Fecha bloqueada con fecha y hora actual (local)
    const formattedDate = getLocalDateTimeMinutes();
    saleDateLocked.value = `${formattedDate} (Hoy)`;

    dailySaleModal.classList.add('open');
    dailySaleModal.setAttribute('aria-hidden', 'false');
    saleProductSelect.focus();
  }

  function closeSaleModal() {
    dailySaleModal.classList.remove('open');
    dailySaleModal.setAttribute('aria-hidden', 'true');
  }

  openNewSaleBtn?.addEventListener('click', openSaleModal);
  closeDailySaleX?.addEventListener('click', closeSaleModal);
  cancelSaleBtn?.addEventListener('click', closeSaleModal);

  dailySaleModal?.addEventListener('click', (e) => {
    if (e.target === dailySaleModal) closeSaleModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dailySaleModal.classList.contains('open')) {
      closeSaleModal();
    }
  });

  // Cálculo en tiempo real de disponibilidad y total
  function recalculateSale() {
    const selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
      saleUnitPriceInput.value = '0.00';
      saleTotalAmountDisplay.textContent = '$0.00';
      stockUnitsDisplay.textContent = 'Seleccione un repuesto';
      stockUnitsDisplay.className = 'stock-ok';
      confirmSaleBtn.disabled = false;
      return;
    }

    const price = Number(selectedOption.dataset.price || 0);
    const stock = Number(selectedOption.dataset.stock || 0);
    const qty = parseInt(saleQuantityInput.value, 10) || 0;

    saleUnitPriceInput.value = price.toFixed(2);

    if (stock <= 0) {
      stockUnitsDisplay.textContent = 'AGOTADO (0 unidades)';
      stockUnitsDisplay.className = 'stock-empty';
      confirmSaleBtn.disabled = true;
    } else if (qty > stock) {
      stockUnitsDisplay.textContent = `¡Insuficiente! Solo hay ${stock} en almacén`;
      stockUnitsDisplay.className = 'stock-empty';
      confirmSaleBtn.disabled = true;
    } else {
      stockUnitsDisplay.textContent = `${stock} unidades disponibles`;
      stockUnitsDisplay.className = 'stock-ok';
      confirmSaleBtn.disabled = false;
    }

    const total = price * Math.max(0, qty);
    saleTotalAmountDisplay.textContent = formatMoney(total);
  }

  saleProductSelect?.addEventListener('change', recalculateSale);
  saleQuantityInput?.addEventListener('input', recalculateSale);

  // Envío del Formulario de Venta
  dailySaleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = parseInt(saleProductSelect.value, 10);
    const qty = parseInt(saleQuantityInput.value, 10);
    const desc = saleDescriptionInput.value.trim() || 'Venta al detal en mostrador';

    if (!productId) {
      alert('Por favor seleccione un repuesto.');
      saleProductSelect.focus();
      return;
    }

    if (!qty || qty <= 0) {
      alert('La cantidad a vender debe ser mayor a cero.');
      saleQuantityInput.focus();
      return;
    }

    const prod = getProductoById(productId);
    if (!prod) {
      alert('Producto no encontrado en inventario.');
      return;
    }

    if (qty > Number(prod.cantidad)) {
      alert(`No es posible registrar la venta. La cantidad solicitada (${qty}) supera las existencias en almacén (${prod.cantidad} unidades).`);
      saleQuantityInput.focus();
      return;
    }

    const saleAmount = Number((Number(prod.precio) * qty).toFixed(2));
    let registeredSaleId = null;

    try {
      const res = await apiRequest('registrar_venta', {
        id_producto: productId,
        cantidad_producto: qty,
        descripcion: desc,
        id_usuario: Number(currentUser.id_usuario || 2)
      });
      registeredSaleId = res.id_venta;
    } catch (err) {
      if (!isDbConnected) {
        // Fallback local si el servidor no responde
        prod.cantidad = Math.max(0, Number(prod.cantidad) - qty);
        const maxId = db.ventas.reduce((m, v) => Math.max(m, Number(v.id_venta)), 0);
        registeredSaleId = maxId + 1;
        db.ventas.unshift({
          id_venta: registeredSaleId,
          fecha: getLocalDateTimeMinutes(),
          id_producto: productId,
          cantidad_producto: qty,
          monto: saleAmount,
          descripcion: desc,
          id_usuario: Number(currentUser.id_usuario || 2)
        });
        saveDb();
      } else {
        showToast(err.message);
        return;
      }
    }

    // Registro silencioso en Bitácora de Auditoría (Trazabilidad)
    if (window.RufoAudit) {
      window.RufoAudit.logEvent({
        modulo: 'Ventas',
        accion: 'REGISTRO_VENTA',
        detalles: `Venta #${registeredSaleId} registrada: ${qty}x ${prod.nombre} (Cód: ${prod.codigo}) por ${formatMoney(saleAmount)}`,
        user: currentUser
      });
    }

    // Actualizar vistas y mostrar confirmación
    closeSaleModal();
    renderDailySales();
    renderCatalog();
    showToast(`Venta #${registeredSaleId} registrada con éxito. Stock actualizado.`);
  });

  // ==========================================================================
  // 9. Bloqueo de Alteración de Registros Históricos y Configuraciones
  // ==========================================================================
  // En caso de que se intente invocar modificaciones de ventas o configuraciones
  window.addEventListener('securityViolation', () => {
    showToast('Restricción de seguridad: Los registros históricos están protegidos.');
  });

  // Render inicial y sincronización con MySQL / MariaDB
  renderDailySales();
  renderCatalog();
  syncWithDatabase();
});
