/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Controlador de Interfaz y Autenticación (Login)
 * Conectado a la Base de Datos MySQL / MariaDB (refrigeracion_rufo -> tabla usuarios)
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

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const eyeOpenIcon = document.getElementById('eyeOpenIcon');
  const eyeClosedIcon = document.getElementById('eyeClosedIcon');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const feedbackAlert = document.getElementById('feedbackAlert');
  const feedbackMessage = document.getElementById('feedbackMessage');

  // Modal de Seguridad (Cambio de Contraseña restringido al Administrador)
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const securityModalBackdrop = document.getElementById('securityModalBackdrop');
  const closeSecurityModalBtn = document.getElementById('closeSecurityModalBtn');

  function getFallbackUsuariosList() {
    const defaultUsuarios = [
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
    ];

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.usuarios) && saved.usuarios.length > 0) {
        return saved.usuarios;
      }
    } catch (e) {
      // Usar lista por defecto si no existe en localStorage
    }
    return defaultUsuarios;
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeOpenIcon.style.display = isPassword ? 'none' : 'block';
    eyeClosedIcon.style.display = isPassword ? 'block' : 'none';
    togglePasswordBtn.setAttribute(
      'aria-label',
      isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
    );
  });

  function showFeedback(type, message) {
    feedbackAlert.className = `feedback-alert show ${type}`;
    feedbackMessage.innerHTML = message;
  }

  function hideFeedback() {
    feedbackAlert.className = 'feedback-alert';
    usernameInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
  }

  usernameInput.addEventListener('input', hideFeedback);
  passwordInput.addEventListener('input', hideFeedback);

  function saveActiveSession(account) {
    const sessionUser = {
      id_usuario: account.id_usuario,
      nombre_completo: account.nombre_completo,
      usuario: account.usuario,
      rol: account.rol
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  }

  /**
   * Manejo del envío del formulario de Login validando contra la base de datos MySQL (usuarios)
   */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!username) {
      usernameInput.classList.add('input-error');
      usernameInput.focus();
      showFeedback('error', 'Por favor, ingrese su nombre de usuario.');
      return;
    }

    if (!password) {
      passwordInput.classList.add('input-error');
      passwordInput.focus();
      showFeedback('error', 'Por favor, ingrese su contraseña.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtnText.textContent = 'Verificando en BD...';

    try {
      const response = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          usuario: username,
          contrasena: password
        })
      });

      const data = await response.json();

      if (response.ok && data.ok && data.usuario) {
        saveActiveSession(data.usuario);
        showFeedback(
          'success',
          `<strong>Bienvenido, ${data.usuario.nombre_completo}:</strong> Accediendo con rol <em>${data.usuario.rol}</em>...`
        );
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 450);
        return;
      }

      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtnText.textContent = 'Ingresar al Sistema';
      passwordInput.classList.add('input-error');
      showFeedback('error', data.mensaje || 'Usuario o contraseña incorrectos.');
    } catch (networkErr) {
      // Fallback local si el servidor Apache/XAMPP no está accesible
      const usuarios = getFallbackUsuariosList();
      const account = usuarios.find(
        (u) => u.usuario.toLowerCase() === username && u.contrasena === password
      );

      if (account) {
        saveActiveSession(account);
        showFeedback(
          'success',
          `<strong>Bienvenido, ${account.nombre_completo}:</strong> Accediendo en modo local (<em>${account.rol}</em>)...`
        );
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 450);
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtnText.textContent = 'Ingresar al Sistema';
        passwordInput.classList.add('input-error');
        showFeedback('error', 'Usuario o contraseña incorrectos.');
      }
    }
  });

  /**
   * Modal de Política de Seguridad
   */
  function openSecurityModal() {
    securityModalBackdrop.classList.add('open');
    securityModalBackdrop.setAttribute('aria-hidden', 'false');
    closeSecurityModalBtn.focus();
  }

  function closeSecurityModal() {
    securityModalBackdrop.classList.remove('open');
    securityModalBackdrop.setAttribute('aria-hidden', 'true');
    forgotPasswordBtn.focus();
  }

  forgotPasswordBtn.addEventListener('click', openSecurityModal);
  closeSecurityModalBtn.addEventListener('click', closeSecurityModal);

  securityModalBackdrop.addEventListener('click', (e) => {
    if (e.target === securityModalBackdrop) {
      closeSecurityModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && securityModalBackdrop.classList.contains('open')) {
      closeSecurityModal();
    }
  });
});
