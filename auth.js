(() => {
  if (window.__EZSIGN_AUTH_INIT__) return;
  window.__EZSIGN_AUTH_INIT__ = true;
  const CONFIG_API_BASE = String(window.EZSIGN_CONFIG?.apiBaseUrl || '').trim().replace(/\/+$/, '');
  const IS_FILE = window.location.protocol === 'file:';
  const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
  const AUTH_BASE = IS_FILE ? 'http://127.0.0.1:5055' : (IS_GITHUB_PAGES ? CONFIG_API_BASE : '');
  const AUTH_CREDENTIALS = AUTH_BASE ? 'include' : 'same-origin';
  const LOGIN_URL = IS_FILE ? `${AUTH_BASE}/login` : (IS_GITHUB_PAGES ? (AUTH_BASE ? `${AUTH_BASE}/login` : 'login.html') : '/login');

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
        window.location.href = LOGIN_URL;
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
    let res;
    try {
      res = await fetch(`${AUTH_BASE}/api/auth/me`, { credentials: AUTH_CREDENTIALS });
    } catch (error) {
      window.location.href = LOGIN_URL;
      throw error;
    }
    if (res.status === 401) {
      window.location.href = LOGIN_URL;
      throw new Error('Connexion requise.');
    }
    const data = await res.json();
    auth.user = data.user;
    if (auth.user) {
      auth.user.activeBrand = data.activeBrand || data.user.activeBrand || 'ezsign';
    }
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
      ${auth.user.is_admin ? `
        <section class="settings-section">
          <h4>Sécurité des données</h4>
          <div id="adminDataSettings"></div>
        </section>
        <section class="settings-section"><h4>Utilisateurs</h4><div id="adminUsers"></div></section>
        <section class="settings-section">
          <h4>Logs d'accès</h4>
          <div id="adminAccessLogs"></div>
        </section>
      ` : ''}
    `;
    document.getElementById('changePasswordForm').addEventListener('submit', changePassword);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    if (auth.user.is_admin) {
      await renderAdminDataSettings();
      await renderAdminUsers();
      await renderAdminAccessLogs();
    }
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
    window.location.href = LOGIN_URL;
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
            <select data-brand>
              <option value="ezsign"${user.brand === 'ezsign' ? ' selected' : ''}>eZsign</option>
              <option value="ezmax"${user.brand === 'ezmax' ? ' selected' : ''}>eZmax</option>
              <option value="both"${(user.brand || 'both') === 'both' ? ' selected' : ''}>Both</option>
            </select>
            <input data-password type="password" placeholder="Nouveau mot de passe" />
            <button class="chip btn-ghost" data-save-user type="button">Sauver</button>
            <button class="chip btn-ghost danger" data-delete-user type="button">Supprimer</button>
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
        <select id="addUserBrand">
          <option value="both">Both</option>
          <option value="ezsign">eZsign</option>
          <option value="ezmax">eZmax</option>
        </select>
        <button class="btn" type="submit">Ajouter</button>
      </form>
    `;
    box.querySelectorAll('[data-save-user]').forEach(button => button.addEventListener('click', saveUser));
    box.querySelectorAll('[data-delete-user]').forEach(button => button.addEventListener('click', deleteUser));
    document.getElementById('addUserForm').addEventListener('submit', addUser);
  }

  async function renderAdminDataSettings() {
    const box = document.getElementById('adminDataSettings');
    const res = await auth.fetch('/api/settings');
    const data = await res.json().catch(() => ({}));
    box.innerHTML = `
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-bottom: 8px;">
        <label class="settings-toggle" style="margin:0;">
          <input id="autoDeleteToggle" type="checkbox"${data.auto_delete_enabled ? ' checked' : ''} />
          <span>Suppression automatique après génération/analyse</span>
        </label>
        <button id="cleanDbBtn" class="chip btn-ghost danger" type="button" style="padding: 6px 12px; font-weight: 700;">Clean Database</button>
      </div>
      <p class="muted">Off par défaut. Si activé, les offres et analyses restent visibles immédiatement mais ne sont pas enregistrées dans les dashboards.</p>
    `;
    document.getElementById('autoDeleteToggle').addEventListener('change', updateAutoDelete);
    document.getElementById('cleanDbBtn').addEventListener('click', cleanDatabase);
  }

  async function cleanDatabase() {
    const code = window.prompt('Entrez le mot de passe admin (9293) pour nettoyer la base de données :');
    if (!code) return;
    if (code !== '9293') {
      window.alert('Code incorrect.');
      return;
    }
    if (!window.confirm('Êtes-vous ABSOLUMENT sûr de vouloir vider TOUTE la base de données (offres, réunions, support) ? Cette action est irréversible.')) return;
    try {
      const res = await auth.fetch('/api/settings/clean-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur lors du nettoyage.');
      window.alert('La base de données a été nettoyée avec succès.');
      if (window.refreshProposals) window.refreshProposals();
      if (window.refreshAnalysis) window.refreshAnalysis();
      if (window.refreshHomeStats) window.refreshHomeStats();
      if (window.refreshTickets) window.refreshTickets();
    } catch (error) {
      window.alert(error.message);
    }
  }


  async function saveUser(event) {
    const row = event.target.closest('[data-user-id]');
    const payload = {
      role: row.querySelector('[data-role]').value,
      brand: row.querySelector('[data-brand]').value,
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

  async function updateAutoDelete(event) {
    const code = window.prompt('Code requis pour modifier ce réglage');
    if (!code) {
      event.target.checked = !event.target.checked;
      return;
    }
    const res = await auth.fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        auto_delete_enabled: event.target.checked,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.error || 'Modification impossible.');
      event.target.checked = !event.target.checked;
    }
  }

  async function deleteUser(event) {
    const row = event.target.closest('[data-user-id]');
    const email = row.querySelector('b')?.textContent || 'cet utilisateur';
    if (!window.confirm(`Supprimer ${email}?`)) return;
    const res = await auth.fetch(`/api/users/${row.dataset.userId}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(data.error || 'Suppression impossible.');
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
        brand: document.getElementById('addUserBrand').value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(data.error || 'Ajout impossible.');
    else await renderAdminUsers();
  }

  async function renderAdminAccessLogs() {
    const box = document.getElementById('adminAccessLogs');
    if (!box) return;
    box.innerHTML = `<p class="muted">Chargement des logs...</p>`;
    try {
      const res = await auth.fetch('/api/admin/access-logs');
      const data = await res.json();
      const logs = data.items || [];

      if (!logs.length) {
        box.innerHTML = `<p class="muted">Aucun log d'accès enregistré.</p>`;
        return;
      }

      const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}m ${secs}s`;
        const hours = Math.floor(mins / 60);
        const rm = mins % 60;
        return `${hours}h ${rm}m`;
      };

      box.innerHTML = `
        <div style="overflow-x: auto; margin-top: 10px; border: 1px solid var(--brand-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background: var(--brand-soft); border-bottom: 1px solid var(--brand-border);">
                <th style="padding: 8px 10px;">Utilisateur</th>
                <th style="padding: 8px 10px;">Connexion</th>
                <th style="padding: 8px 10px;">Activité</th>
                <th style="padding: 8px 10px;">Durée</th>
                <th style="padding: 8px 10px;">Statut</th>
                <th style="padding: 8px 10px;">IP</th>
                <th style="padding: 8px 10px;">Agent</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => {
                const statusColor = log.is_connected ? 'var(--ok)' : 'var(--ink-muted)';
                const statusText = log.is_connected ? 'En ligne' : 'Déconnecté';
                const statusBg = log.is_connected ? 'rgba(22, 163, 74, 0.12)' : 'transparent';

                return `
                  <tr class="clickable-log-row" style="cursor: pointer; border-bottom: 1px solid var(--brand-border); background: ${log.is_connected ? 'rgba(22, 163, 74, 0.03)' : 'transparent'}" onclick="window.ezAuth.openLogActivitiesModal(${log.id}, '${escapeHTML(log.email)}')">
                    <td style="padding: 8px 10px; font-weight: bold;">${escapeHTML(log.email)}</td>
                    <td style="padding: 8px 10px; white-space: nowrap;">${escapeHTML(log.login_time.replace('T', ' '))}</td>
                    <td style="padding: 8px 10px; white-space: nowrap;">${escapeHTML(log.last_active.replace('T', ' '))}</td>
                    <td style="padding: 8px 10px; white-space: nowrap;">${formatDuration(log.duration_seconds)}</td>
                    <td style="padding: 8px 10px; white-space: nowrap;">
                      <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${log.is_connected ? 'rgba(22, 163, 74, 0.2)' : 'var(--brand-border)'}">
                        ${statusText}
                      </span>
                    </td>
                    <td style="padding: 8px 10px; white-space: nowrap;">${escapeHTML(log.ip_address)}</td>
                    <td style="padding: 8px 10px; font-size: 11px; color: var(--ink-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(log.user_agent)}">
                      ${escapeHTML(log.user_agent)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      box.innerHTML = `<p style="color: var(--brand-primary)">Erreur de chargement : ${escapeHTML(error.message)}</p>`;
    }
  }

  async function openLogActivitiesModal(logId, email) {
    ensureLogActivitiesModal();
    const modal = document.getElementById('logActivitiesModal');
    const title = document.getElementById('logActivitiesTitle');
    const body = document.getElementById('logActivitiesBody');

    title.textContent = `Journal d'activités - ${email}`;
    body.innerHTML = `<p class="muted">Chargement des activités...</p>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    await loadLogActivities(logId, body);
  }

  function ensureLogActivitiesModal() {
    if (document.getElementById('logActivitiesModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="logActivitiesModal" class="modal activity-modal" aria-hidden="true">
        <div class="backdrop" data-activity-close></div>
        <div class="dialog settings-dialog" role="dialog" aria-modal="true" style="max-width: 650px;">
          <div class="head">
            <h3 id="logActivitiesTitle">Journal d'activités</h3>
            <button class="close-x" data-activity-close>&times;</button>
          </div>
          <div class="body" id="logActivitiesBody" style="padding: 18px; max-height: 500px; overflow-y: auto;">
          </div>
        </div>
      </div>
    `);
    document.querySelectorAll('[data-activity-close]').forEach(el => el.addEventListener('click', () => {
      const modal = document.getElementById('logActivitiesModal');
      modal?.classList.remove('open');
      modal?.setAttribute('aria-hidden', 'true');
    }));
  }

  async function loadLogActivities(logId, body) {
    try {
      const res = await auth.fetch(`/api/admin/access-logs/${logId}/activities`);
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) {
        body.innerHTML = `<p class="muted">Aucune activité enregistrée pour cette session.</p>`;
        return;
      }
      body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding: 4px;">
          ${items.map(item => `
            <div style="display: flex; gap: 14px; border-bottom: 1px solid var(--brand-border); padding: 8px 0; font-size: 13px; align-items: center;">
              <span style="color: var(--ink-muted); min-width: 130px; white-space: nowrap;">${item.created_at.replace('T', ' ')}</span>
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: var(--brand-soft); border: 1px solid var(--brand-border); text-transform: uppercase; white-space: nowrap;">
                ${item.action_type}
              </span>
              <span style="color: var(--ink); flex: 1;">${escapeHTML(item.description)}</span>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      body.innerHTML = `<p style="color: var(--brand-primary)">Erreur : ${escapeHTML(error.message)}</p>`;
    }
  }

  auth.openLogActivitiesModal = openLogActivitiesModal;

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
