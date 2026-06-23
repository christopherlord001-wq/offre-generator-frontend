(() => {
  if (window.__EZSIGN_AUTH_INIT__) return;
  window.__EZSIGN_AUTH_INIT__ = true;
  const AUTH_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5055' : '';
  const AUTH_CREDENTIALS = AUTH_BASE ? 'include' : 'same-origin';

  const auth = {
    user: null,
    csrfToken: '',
    ready: null,
    async fetch(path, options = {}) {
      await auth.ready;
      const method = String(options.method || 'GET').toUpperCase();
      const headers = { ...(options.headers || {}) };
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers['X-CSRF-Token'] = auth.csrfToken;
      }
      const res = await fetch(`${AUTH_BASE}${path}`, {
        credentials: AUTH_CREDENTIALS,
        ...options,
        headers,
      });
      if (res.status === 401) {
        window.location.href = `${AUTH_BASE}/login`;
        throw new Error('Connexion requise.');
      }
      return res;
    },
  };
  window.ezAuth = auth;

  document.addEventListener('DOMContentLoaded', () => {
    auth.ready = loadMe();
    wireSettings();
  });

  async function loadMe() {
    const res = await fetch(`${AUTH_BASE}/api/auth/me`, { credentials: AUTH_CREDENTIALS });
    if (res.status === 401) {
      window.location.href = `${AUTH_BASE}/login`;
      throw new Error('Connexion requise.');
    }
    const data = await res.json();
    auth.user = data.user;
    auth.csrfToken = data.csrfToken;
    renderUserBadge();
    return data;
  }

  function renderUserBadge() {
    const button = document.getElementById('settingsBtn');
    if (!button || !auth.user) return;
    button.textContent = auth.user.is_admin ? 'Settings admin' : 'Settings';
    button.title = auth.user.email;
  }

  function wireSettings() {
    const button = document.getElementById('settingsBtn');
    if (!button) return;
    button.addEventListener('click', openSettings);
  }

  async function openSettings() {
    await auth.ready;
    ensureSettingsModal();
    document.getElementById('settingsModal').classList.add('open');
    document.getElementById('settingsModal').setAttribute('aria-hidden', 'false');
    renderSettings();
  }

  function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
  }

  function ensureSettingsModal() {
    if (document.getElementById('settingsModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="settingsModal" class="modal settings-modal" aria-hidden="true">
        <div class="backdrop" data-settings-close></div>
        <div class="dialog settings-dialog" role="dialog" aria-modal="true">
          <div class="head">
            <h3>Settings</h3>
            <button class="close-x" data-settings-close>&times;</button>
          </div>
          <div class="body settings-body">
            <div id="settingsContent"></div>
          </div>
        </div>
      </div>
    `);
    document.querySelectorAll('[data-settings-close]').forEach(el => el.addEventListener('click', closeSettings));
  }

  async function renderSettings() {
    const content = document.getElementById('settingsContent');
    content.innerHTML = `
      <section class="settings-section">
        <h4>Compte</h4>
        <p class="muted">${escapeHTML(auth.user.email)}${auth.user.is_admin ? ' | Admin' : ''}</p>
        <form id="changePasswordForm" class="settings-form">
          <input id="currentPassword" type="password" placeholder="Mot de passe actuel" autocomplete="current-password" required />
          <input id="newPassword" type="password" placeholder="Nouveau mot de passe" autocomplete="new-password" required />
          <button class="btn" type="submit">Changer mon mot de passe</button>
        </form>
        <button id="logoutBtn" class="chip btn-ghost" type="button">Déconnexion</button>
        <p id="settingsMessage" class="settings-message"></p>
      </section>
      ${auth.user.is_admin ? '<section class="settings-section"><h4>Utilisateurs</h4><div id="adminUsers"></div></section>' : ''}
    `;
    document.getElementById('changePasswordForm').addEventListener('submit', changePassword);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    if (auth.user.is_admin) await renderAdminUsers();
  }

  async function changePassword(event) {
    event.preventDefault();
    const message = document.getElementById('settingsMessage');
    message.textContent = '';
    try {
      const res = await auth.fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: document.getElementById('newPassword').value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Modification impossible.');
      message.textContent = 'Mot de passe changé.';
      event.target.reset();
    } catch (error) {
      message.textContent = error.message;
    }
  }

  async function logout() {
    await auth.fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = `${AUTH_BASE}/login`;
  }

  async function renderAdminUsers() {
    const box = document.getElementById('adminUsers');
    const res = await auth.fetch('/api/users');
    const data = await res.json();
    box.innerHTML = `
      <div class="admin-user-list">
        ${(data.items || []).map(user => `
          <div class="admin-user-row" data-user-id="${user.id}">
            <div>
              <b>${escapeHTML(user.email)}</b>
              <small>${escapeHTML(user.role)}${user.is_active ? '' : ' | inactif'}</small>
            </div>
            <select data-role>
              <option value="user"${user.role === 'user' ? ' selected' : ''}>user</option>
              <option value="admin"${user.role === 'admin' ? ' selected' : ''}>admin</option>
            </select>
            <input data-password type="password" placeholder="Nouveau mot de passe" />
            <button class="chip btn-ghost" data-save-user type="button">Sauver</button>
          </div>
        `).join('')}
      </div>
      <form id="addUserForm" class="settings-form add-user-form">
        <input id="addUserEmail" type="email" placeholder="nouvel utilisateur@ezsign.ca" required />
        <input id="addUserPassword" type="password" placeholder="Mot de passe" required />
        <select id="addUserRole">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button class="btn" type="submit">Ajouter</button>
      </form>
    `;
    box.querySelectorAll('[data-save-user]').forEach(button => button.addEventListener('click', saveUser));
    document.getElementById('addUserForm').addEventListener('submit', addUser);
  }

  async function saveUser(event) {
    const row = event.target.closest('[data-user-id]');
    const payload = {
      role: row.querySelector('[data-role]').value,
    };
    const password = row.querySelector('[data-password]').value;
    if (password) payload.password = password;
    const res = await auth.fetch(`/api/users/${row.dataset.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(data.error || 'Modification impossible.');
    else await renderAdminUsers();
  }

  async function addUser(event) {
    event.preventDefault();
    const res = await auth.fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('addUserEmail').value,
        password: document.getElementById('addUserPassword').value,
        role: document.getElementById('addUserRole').value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(data.error || 'Ajout impossible.');
    else await renderAdminUsers();
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
