/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Helper Centralizado de Auditoría y Trazabilidad (Bitácora de Actividad)
 * Función: Registro en segundo plano (MySQL + respaldo local), invisible para el empleado.
 */

(function () {
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

  const INITIAL_AUDIT_LOGS = [
    {
      id_auditoria: 1,
      id_usuario: 1,
      usuario: 'admin',
      rol: 'administrador',
      modulo: 'Sistema',
      accion: 'INICIALIZACION_SISTEMA',
      detalles: 'Carga de estructura base de base de datos relacional y catálogo de repuestos',
      ip_origen: '192.168.1.10',
      fecha_hora: '2026-11-01 08:00:00'
    },
    {
      id_auditoria: 2,
      id_usuario: 1,
      usuario: 'admin',
      rol: 'administrador',
      modulo: 'Autenticación',
      accion: 'INICIO_SESION',
      detalles: 'Inicio de sesión exitoso en estación de gerencia',
      ip_origen: '192.168.1.10',
      fecha_hora: '2026-11-08 08:30:00'
    },
    {
      id_auditoria: 3,
      id_usuario: 2,
      usuario: 'empleado',
      rol: 'empleado',
      modulo: 'Autenticación',
      accion: 'INICIO_SESION',
      detalles: 'Inicio de sesión de operador en terminal de mostrador',
      ip_origen: '192.168.1.105',
      fecha_hora: '2026-11-08 09:00:00'
    },
    {
      id_auditoria: 4,
      id_usuario: 2,
      usuario: 'empleado',
      rol: 'empleado',
      modulo: 'Ventas',
      accion: 'REGISTRO_VENTA',
      detalles: 'Venta #1 registrada: 12x Capacitor de Marcha 35 uF ($78.00)',
      ip_origen: '192.168.1.105',
      fecha_hora: '2026-11-08 09:15:00'
    },
    {
      id_auditoria: 5,
      id_usuario: 2,
      usuario: 'empleado',
      rol: 'empleado',
      modulo: 'Ventas',
      accion: 'REGISTRO_VENTA',
      detalles: 'Venta #2 registrada: 9x Protector Térmico y Relé PTC 1/3 HP ($45.00)',
      ip_origen: '192.168.1.105',
      fecha_hora: '2026-11-08 10:05:00'
    },
    {
      id_auditoria: 6,
      id_usuario: 1,
      usuario: 'admin',
      rol: 'administrador',
      modulo: 'Ventas',
      accion: 'REGISTRO_VENTA',
      detalles: 'Venta #3 registrada: 3x Compresor Embraco 1/4 HP R-134a ($285.00)',
      ip_origen: '192.168.1.10',
      fecha_hora: '2026-11-08 10:42:00'
    },
    {
      id_auditoria: 7,
      id_usuario: 2,
      usuario: 'empleado',
      rol: 'empleado',
      modulo: 'Ventas',
      accion: 'REGISTRO_VENTA',
      detalles: 'Venta #4 registrada: 6x Motor Ventilador Evaporador 110V ($111.00)',
      ip_origen: '192.168.1.105',
      fecha_hora: '2026-11-08 11:20:00'
    },
    {
      id_auditoria: 8,
      id_usuario: 1,
      usuario: 'admin',
      rol: 'administrador',
      modulo: 'Ventas',
      accion: 'REGISTRO_VENTA',
      detalles: 'Venta #5 registrada: 2x Cilindro Gas Refrigerante R-134a ($270.00)',
      ip_origen: '192.168.1.10',
      fecha_hora: '2026-11-08 11:55:00'
    },
    {
      id_auditoria: 9,
      id_usuario: 2,
      usuario: 'empleado',
      rol: 'empleado',
      modulo: 'Seguridad',
      accion: 'ACCESO_DENEGADO',
      detalles: 'Intento de ingreso no autorizado a la ruta /admin.html bloqueado por directiva de seguridad',
      ip_origen: '192.168.1.105',
      fecha_hora: '2026-11-08 13:10:00'
    }
  ];

  function getStationIp(role) {
    const customIp = sessionStorage.getItem('rufo_station_ip') || localStorage.getItem('rufo_station_ip');
    if (customIp) return customIp;

    if (role === 'administrador') return '192.168.1.10';
    if (role === 'empleado') return '192.168.1.105';
    return '192.168.1.50';
  }

  function getActiveUser() {
    try {
      const stored =
        sessionStorage.getItem('rufo_active_user') ||
        localStorage.getItem('rufo_active_user') ||
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  }

  function getAuditDatabase() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (!Array.isArray(db.auditoria)) {
          db.auditoria = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        }
        return db;
      } else {
        const db = {
          usuarios: [],
          proveedores: [],
          productos: [],
          compras: [],
          ventas: [],
          auditoria: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        return db;
      }
    } catch (e) {
      console.error('Error al cargar base de datos para auditoría:', e);
    }
    return null;
  }

  /**
   * Envía el evento a la tabla `auditoria` en MySQL / MariaDB de forma asíncrona
   */
  async function persistAuditToServer(payload) {
    try {
      const response = await fetch(`${API_URL}?action=registrar_auditoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          action: 'registrar_auditoria',
          ...payload
        })
      });
      const data = await response.json();
      if (response.ok && data.ok && data.db) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.db));
        window.dispatchEvent(new CustomEvent('rufo:db-updated', { detail: data.db }));
      }
    } catch (err) {
      // Si el servidor no está disponible, se mantiene el registro en localStorage
    }
  }

  /**
   * Registra un evento en la bitácora de auditoría (MySQL + cache local).
   * Ejecución silenciosa y segura en segundo plano.
   */
  function logEvent({ modulo, accion, detalles, user = null, ip = null }) {
    try {
      const db = getAuditDatabase();
      if (!db) return null;

      const activeUser = user || getActiveUser() || {
        id_usuario: null,
        usuario: 'invitado',
        rol: 'desconocido'
      };

      const resolvedIp = ip || getStationIp(activeUser.rol);

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const maxId = db.auditoria.reduce((max, a) => Math.max(max, Number(a.id_auditoria) || 0), 0);

      const auditRecord = {
        id_auditoria: maxId + 1,
        id_usuario: activeUser.id_usuario ? Number(activeUser.id_usuario) : null,
        usuario: activeUser.usuario || 'desconocido',
        rol: activeUser.rol || 'desconocido',
        modulo: modulo || 'General',
        accion: accion || 'OPERACION',
        detalles: detalles || '',
        ip_origen: resolvedIp,
        fecha_hora: timestamp
      };

      // Guardar al inicio para orden cronológico descendente
      db.auditoria.unshift(auditRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

      // Sincronizar con la base de datos MySQL en segundo plano
      persistAuditToServer({
        id_usuario: auditRecord.id_usuario,
        usuario: auditRecord.usuario,
        rol: auditRecord.rol,
        modulo: auditRecord.modulo,
        accion: auditRecord.accion,
        detalles: auditRecord.detalles,
        ip_origen: auditRecord.ip_origen
      });

      return auditRecord;
    } catch (err) {
      console.error('Error al registrar auditoría:', err);
      return null;
    }
  }

  // Exponer API global de auditoría
  window.RufoAudit = {
    logEvent,
    getStationIp,
    INITIAL_AUDIT_LOGS
  };
})();
