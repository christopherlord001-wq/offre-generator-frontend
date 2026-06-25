(function () {
  let activeTaskType = 'team'; // 'team' or 'personal'
  let tasks = [];
  let teamMembers = [];
  let openTaskId = null;
  let isTyping = false;
  let typingTimeout = null;
  let eventSource = null;
  let sseConnected = false;
  let pollingInterval = null;

  const els = {
    taskDetailsModal: document.getElementById('taskDetailsModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    taskDetailTitleInput: document.getElementById('taskDetailTitleInput'),
    taskDetailCommentsList: document.getElementById('taskDetailCommentsList'),
    taskNewCommentInput: document.getElementById('taskNewCommentInput'),
    taskAddCommentBtn: document.getElementById('taskAddCommentBtn'),
    taskDetailPrioritySelect: document.getElementById('taskDetailPrioritySelect'),
    taskDetailStatusSelect: document.getElementById('taskDetailStatusSelect'),
    taskDetailAttachmentsList: document.getElementById('taskDetailAttachmentsList'),
    taskDetailAttachBtn: document.getElementById('taskDetailAttachBtn'),
    taskDetailFileInput: document.getElementById('taskDetailFileInput')
  };

  const priorityStyles = {
    'Lowest':  { label: 'Lowest',  color: '#718096', emoji: '⚪', bg: '#edf2f7' },
    'Lower':   { label: 'Lower',   color: '#3182ce', emoji: '🔵', bg: '#ebf8ff' },
    'Low':     { label: 'Low',     color: '#38a169', emoji: '🟢', bg: '#f0fff4' },
    'Neutral': { label: 'Neutre',  color: '#718096', emoji: '🔘', bg: '#edf2f7' },
    'High':    { label: 'High',    color: '#dd6b20', emoji: '🟠', bg: '#fffaf0' },
    'Higher':  { label: 'Higher',  color: '#e53e3e', emoji: '🔴', bg: '#fff5f5' },
    'Highest': { label: 'Highest', color: '#9b2c2c', emoji: '🔥', bg: '#fed7d7' },
    'Express': { label: 'Express', color: '#805ad5', emoji: '⚡', bg: '#faf5ff' }
  };

  // Helper to safely call API
  async function apiCall(url, options = {}) {
    if (window.ezAuth?.ready) await window.ezAuth.ready;
    const res = await window.ezAuth.fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  function getActiveView() {
    return activeTaskType === 'team' ? document.getElementById('viewTasksTeam') : document.getElementById('viewTasksPersonal');
  }

  // Load tasks from backend
  async function loadTasks(type) {
    activeTaskType = type || activeTaskType;
    const viewEl = getActiveView();
    if (!viewEl) return;

    try {
      const data = await apiCall(`/api/tasks?type=${activeTaskType}`);
      tasks = data.items || [];
      renderTasksTable();
      
      // Load team members list once for assignment dropdowns
      if (teamMembers.length === 0) {
        const memData = await apiCall('/api/tasks/team-members');
        teamMembers = memData.items || [];
        populatePriorityDropdown();
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  }

  function populatePriorityDropdown() {
    if (els.taskDetailPrioritySelect) {
      els.taskDetailPrioritySelect.innerHTML = Object.keys(priorityStyles).map(p => {
        const opt = priorityStyles[p];
        return `<option value="${p}">${opt.emoji} ${opt.label}</option>`;
      }).join('');
    }
  }

  // Sort and filter tasks, then render
  function renderTasksTable() {
    const viewEl = getActiveView();
    if (!viewEl) return;

    const statusFilter = viewEl.querySelector('.task-status-filter').value;
    const sortFilter = viewEl.querySelector('.task-sort-filter').value;
    const tbody = viewEl.querySelector('.tasks-tbody');

    // 1. Filter
    let filtered = tasks.slice();
    if (statusFilter === 'active') {
      filtered = filtered.filter(t => t.status !== 'Closed');
    } else if (statusFilter === 'all') {
      // Keep all
    } else {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // 2. Sort
    const priorityOrder = ['Lowest', 'Lower', 'Low', 'Neutral', 'High', 'Higher', 'Highest', 'Express'];
    if (sortFilter === 'date-asc') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortFilter === 'date-desc') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortFilter === 'priority') {
      filtered.sort((a, b) => priorityOrder.indexOf(b.priority) - priorityOrder.indexOf(a.priority));
    } else if (sortFilter === 'creator' && activeTaskType === 'team') {
      filtered.sort((a, b) => (a.creator_name || '').localeCompare(b.creator_name || ''));
    } else if (sortFilter === 'alphabetical') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    // 3. Render rows
    if (filtered.length === 0) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      const colsCount = activeTaskType === 'team' ? 6 : 5;
      tbody.innerHTML = `<tr><td colspan="${colsCount}" style="text-align:center;padding:30px;color:var(--ink-muted);font-style:italic;">${isFr ? 'Aucune tâche correspondante.' : 'No matching tasks.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const p = priorityStyles[t.priority] || priorityStyles['Neutral'];
      const dateStr = formatDate(t.created_at);
      
      const statusClass = t.status.toLowerCase().replace(' ', '-');
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      let statusLabel = t.status;
      if (isFr) {
        const translations = {
          'Not started': 'Non commencée',
          'In progress': 'En cours',
          'Pending': 'En attente',
          'Blocked': 'Bloquée',
          'Closed': 'Fermée'
        };
        statusLabel = translations[t.status] || t.status;
      }

      // Creator column (Team tasks only)
      const creatorCol = activeTaskType === 'team' ? `<td style="font-weight:500;">${escapeHTML(t.creator_name || 'Système')}</td>` : '';

      return `
        <tr class="task-row" data-task-id="${t.id}" style="cursor:pointer;">
          <td>
            <span class="task-priority-badge" style="background:${p.bg};color:${p.color};padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
              <span>${p.emoji}</span><span>${p.label}</span>
            </span>
          </td>
          <td class="task-row-title" style="font-weight:500;${t.status === 'Closed' ? 'text-decoration:line-through;color:var(--ink-muted);' : ''}">${escapeHTML(t.title)}</td>
          <td>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </td>
          ${creatorCol}
          <td style="color:var(--ink-muted);font-size:12px;">${dateStr}</td>
          <td class="task-actions-cell" style="position:relative;">
            <button type="button" class="task-actions-btn" style="background:none;border:none;color:var(--ink-muted);font-size:16px;cursor:pointer;padding:0 6px;">⋮</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row click (handling inline dropdowns vs details modal)
    tbody.querySelectorAll('.task-row').forEach(row => {
      const id = parseInt(row.dataset.taskId);
      
      // Inline Priority click
      const prioBadge = row.querySelector('.task-priority-badge');
      if (prioBadge) {
        prioBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          showInlinePriorityDropdown(prioBadge, id);
        });
      }

      // Inline Status click
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          showInlineStatusDropdown(statusBadge, id);
        });
      }

      // Title/row click (opens details modal)
      row.addEventListener('click', (e) => {
        if (
          e.target.closest('.task-priority-badge') || 
          e.target.closest('.status-badge') || 
          e.target.closest('.task-actions-btn') || 
          e.target.closest('.task-dropdown-menu')
        ) {
          return;
        }
        openTaskDetails(id);
      });
    });

    // Bind action menu button click
    tbody.querySelectorAll('.task-actions-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDropdownMenu(btn);
      });
    });
  }

  // Inline changes API update
  async function saveTaskChangesInline(taskId, fields) {
    try {
      await apiCall(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const t = tasks.find(item => item.id === taskId);
      if (t) {
        Object.assign(t, fields);
        renderTasksTable();
      }
    } catch (e) {
      console.error('Failed to update task inline:', e);
      alert(e.message);
    }
  }

  // Show inline priority selector dropdown (appended to body to prevent overflow cuts)
  function showInlinePriorityDropdown(btn, taskId) {
    closeAllDropdowns();
    const rect = btn.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'task-dropdown-menu';
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.background = 'var(--card-bg)';
    dropdown.style.border = '1px solid var(--brand-border)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    dropdown.style.zIndex = '1000';
    dropdown.style.minWidth = '130px';
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'column';
    dropdown.style.padding = '4px 0';

    Object.keys(priorityStyles).forEach(pKey => {
      const p = priorityStyles[pKey];
      const item = document.createElement('button');
      item.type = 'button';
      item.innerHTML = `<span>${p.emoji}</span> <span>${p.label}</span>`;
      item.style.padding = '8px 12px';
      item.style.background = 'none';
      item.style.border = 'none';
      item.style.textAlign = 'left';
      item.style.cursor = 'pointer';
      item.style.color = 'var(--ink)';
      item.style.fontSize = '12px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';
      item.style.width = '100%';

      item.addEventListener('click', async () => {
        dropdown.remove();
        await saveTaskChangesInline(taskId, { priority: pKey });
      });
      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    const clickOutside = (event) => {
      if (!dropdown.contains(event.target) && event.target !== btn) {
        dropdown.remove();
        document.removeEventListener('click', clickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 0);
  }

  // Show inline status selector dropdown (appended to body to prevent overflow cuts)
  function showInlineStatusDropdown(btn, taskId) {
    closeAllDropdowns();
    const rect = btn.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'task-dropdown-menu';
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.background = 'var(--card-bg)';
    dropdown.style.border = '1px solid var(--brand-border)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    dropdown.style.zIndex = '1000';
    dropdown.style.minWidth = '140px';
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'column';
    dropdown.style.padding = '4px 0';

    const isFr = (localStorage.getItem('ez_lang') !== 'en');
    const statuses = [
      { value: 'Not started', labelFr: 'Non commencée', labelEn: 'Not started', class: 'not-started' },
      { value: 'In progress', labelFr: 'En cours', labelEn: 'In progress', class: 'in-progress' },
      { value: 'Pending', labelFr: 'En attente', labelEn: 'Pending', class: 'pending' },
      { value: 'Blocked', labelFr: 'Bloquée', labelEn: 'Blocked', class: 'blocked' },
      { value: 'Closed', labelFr: 'Fermée', labelEn: 'Closed', class: 'closed' }
    ];

    statuses.forEach(st => {
      const item = document.createElement('button');
      item.type = 'button';
      const label = isFr ? st.labelFr : st.labelEn;
      item.innerHTML = `<span class="status-badge ${st.class}" style="font-size: 11px; padding: 2px 8px; width: 100%; text-align: center;">${label}</span>`;
      item.style.padding = '6px 10px';
      item.style.background = 'none';
      item.style.border = 'none';
      item.style.cursor = 'pointer';
      item.style.display = 'block';
      item.style.width = '100%';

      item.addEventListener('click', async () => {
        dropdown.remove();
        await saveTaskChangesInline(taskId, { status: st.value });
      });
      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    const clickOutside = (event) => {
      if (!dropdown.contains(event.target) && event.target !== btn) {
        dropdown.remove();
        document.removeEventListener('click', clickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 0);
  }

  // Display absolute actions menu next to click target (appended to body to avoid overflow clipping)
  function showDropdownMenu(btn) {
    closeAllDropdowns();
    const row = btn.closest('.task-row');
    const taskId = parseInt(row.dataset.taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const rect = btn.getBoundingClientRect();
    const isFr = (localStorage.getItem('ez_lang') !== 'en');
    const dropdown = document.createElement('div');
    dropdown.className = 'task-dropdown-menu';
    dropdown.style.position = 'absolute';
    dropdown.style.left = `${rect.left + window.scrollX + rect.width - 150}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.background = 'var(--card-bg)';
    dropdown.style.border = '1px solid var(--brand-border)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    dropdown.style.zIndex = '1000';
    dropdown.style.minWidth = '150px';
    dropdown.style.display = 'flex';
    dropdown.style.flexDirection = 'column';
    dropdown.style.padding = '4px 0';

    // Delete item
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = isFr ? '❌ Supprimer' : '❌ Delete';
    deleteBtn.style.padding = '8px 12px';
    deleteBtn.style.background = 'none';
    deleteBtn.style.border = 'none';
    deleteBtn.style.textAlign = 'left';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = 'var(--brand-primary)';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.style.width = '100%';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(isFr ? 'Voulez-vous supprimer cette tâche ?' : 'Do you want to delete this task?')) {
        try {
          await apiCall(`/api/tasks/${taskId}`, { method: 'DELETE' });
          dropdown.remove();
          await loadTasks();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    dropdown.appendChild(deleteBtn);

    // Assign submenu (only for team tasks)
    if (task.type === 'team') {
      const assignLabel = document.createElement('div');
      assignLabel.textContent = isFr ? '👤 Assigner à :' : '👤 Assign to:';
      assignLabel.style.padding = '6px 12px 2px 12px';
      assignLabel.style.fontSize = '11px';
      assignLabel.style.fontWeight = '600';
      assignLabel.style.color = 'var(--ink-muted)';
      assignLabel.style.borderTop = '1px solid var(--brand-border)';
      dropdown.appendChild(assignLabel);

      teamMembers.forEach(m => {
        const item = document.createElement('button');
        item.textContent = m.name;
        item.style.padding = '6px 12px';
        item.style.background = 'none';
        item.style.border = 'none';
        item.style.textAlign = 'left';
        item.style.cursor = 'pointer';
        item.style.color = 'var(--ink)';
        item.style.fontSize = '12px';
        item.style.width = '100%';
        item.addEventListener('click', async () => {
          try {
            await apiCall(`/api/tasks/${taskId}/assign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: m.id })
            });
            dropdown.remove();
            alert(isFr ? `Tâche assignée (copie créée) pour ${m.name}` : `Task assigned (copy created) for ${m.name}`);
          } catch (err) {
            alert(err.message);
          }
        });
        dropdown.appendChild(item);
      });
    }

    document.body.appendChild(dropdown);

    const clickOutside = (event) => {
      if (!dropdown.contains(event.target) && event.target !== btn) {
        dropdown.remove();
        document.removeEventListener('click', clickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 0);
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.task-dropdown-menu').forEach(el => el.remove());
  }

  // Details Modal handler
  async function openTaskDetails(taskId) {
    openTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Set values
    els.taskDetailTitleInput.value = task.title;
    els.taskDetailPrioritySelect.value = task.priority;
    els.taskDetailStatusSelect.value = task.status;
    
    if (els.taskNewCommentInput) els.taskNewCommentInput.value = '';

    // Show modal
    els.taskDetailsModal.classList.add('open');
    els.taskDetailsModal.setAttribute('aria-hidden', 'false');

    // Load attachments and comments
    await loadAttachmentsList();
    await loadCommentsList();
  }

  async function loadAttachmentsList() {
    if (!openTaskId) return;
    try {
      const data = await apiCall(`/api/tasks/${openTaskId}/attachments`);
      renderTaskAttachmentsList(data.items || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCommentsList() {
    if (!openTaskId) return;
    try {
      const data = await apiCall(`/api/tasks/${openTaskId}/comments`);
      renderTaskCommentsList(data.items || []);
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  }

  function renderTaskCommentsList(items) {
    if (!els.taskDetailCommentsList) return;
    
    if (items.length === 0) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.taskDetailCommentsList.innerHTML = `<div style="text-align:center;padding:20px;color:var(--ink-muted);font-style:italic;font-size:12px;">${isFr ? 'Aucun commentaire encore. Soyez le premier à commenter !' : 'No comments yet. Be the first to comment!'}</div>`;
      return;
    }
    
    els.taskDetailCommentsList.innerHTML = items.map(c => {
      const initials = (c.user_name || '?').substring(0, 2).toUpperCase();
      const dateStr = formatDate(c.created_at);
      return `
        <div class="task-comment-item" style="display:flex; gap:10px; align-items:flex-start; background:var(--card-bg); border:1px solid var(--brand-border); border-radius:8px; padding:10px 12px; transition:border-color 0.2s;">
          <div class="task-comment-avatar" style="width:28px; height:28px; border-radius:50%; background:var(--brand-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0;">
            ${initials}
          </div>
          <div class="task-comment-content" style="flex:1;">
            <div class="task-comment-meta" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:11px; color:var(--ink-muted); gap:8px;">
              <span class="task-comment-author" style="font-weight:600; color:var(--ink);">${escapeHTML(c.user_name)}</span>
              <span class="task-comment-date" style="font-size:10px;">${dateStr}</span>
            </div>
            <div class="task-comment-text" style="font-size:13px; line-height:1.4; white-space:pre-wrap; color:var(--ink);">${escapeHTML(c.comment_text)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    els.taskDetailCommentsList.scrollTop = els.taskDetailCommentsList.scrollHeight;
  }

  function renderTaskAttachmentsList(items) {
    if (!els.taskDetailAttachmentsList) return;
    if (items.length === 0) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.taskDetailAttachmentsList.innerHTML = `<span style="font-size:11px;color:var(--ink-muted);font-style:italic;">${isFr ? 'Aucun fichier.' : 'No files.'}</span>`;
      return;
    }

    els.taskDetailAttachmentsList.innerHTML = items.map(item => {
      return `
        <div class="task-att-item" data-att-id="${item.id}" style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); border:1px solid var(--brand-border); border-radius:6px; padding:4px 8px; font-size:11px; gap:6px;">
          <a href="/api/tasks/${openTaskId}/attachments/${item.id}/download" class="task-att-download-link" style="color:var(--ink); text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;" title="Télécharger">📎 ${escapeHTML(item.filename)}</a>
          <button type="button" class="task-att-delete-btn" style="background:none; border:none; color:var(--brand-primary); font-weight:bold; cursor:pointer; font-size:12px;">&times;</button>
        </div>
      `;
    }).join('');

    // Bind delete clicks
    els.taskDetailAttachmentsList.querySelectorAll('.task-att-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const attId = parseInt(btn.closest('.task-att-item').dataset.attId);
        try {
          await apiCall(`/api/tasks/${openTaskId}/attachments/${attId}`, { method: 'DELETE' });
          await loadAttachmentsList();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  // Update task changes to DB
  async function saveTaskChanges(fields) {
    if (!openTaskId) return;
    try {
      await apiCall(`/api/tasks/${openTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const t = tasks.find(item => item.id === openTaskId);
      if (t) {
        Object.assign(t, fields);
        renderTasksTable();
      }
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  }

  function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(() => {
      if (!sseConnected) {
        console.log('SSE not active, polling tasks...');
        loadTasks();
      }
    }, 12000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Real-time listener using SSE
  function setupSSE() {
    if (eventSource) eventSource.close();

    const IS_FILE = window.location.protocol === 'file:';
    const CONFIG_API_BASE = String(window.EZSIGN_CONFIG?.apiBaseUrl || '').trim().replace(/\/+$/, '');
    const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
    const API_BASE = IS_FILE ? 'http://127.0.0.1:5055' : (IS_GITHUB_PAGES ? CONFIG_API_BASE : '');

    eventSource = new EventSource(API_BASE + '/api/tasks/events', { withCredentials: true });

    eventSource.onmessage = async (e) => {
      sseConnected = true;
      stopPolling();
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'heartbeat' || event.type === 'connected') return;

        const activeBrand = window.ezAuth?.user?.activeBrand || 'ezsign';
        if (event.brand !== activeBrand) return;

        const payload = event.payload;

        if (event.type === 'task_created') {
          if (payload.type === activeTaskType) {
            await loadTasks();
          }
        } else if (event.type === 'task_deleted') {
          if (openTaskId === payload.id) {
            closeDetailsModal();
          }
          await loadTasks();
        } else if (event.type === 'task_updated') {
          if (openTaskId === payload.id) {
            if ('title' in payload.changes) els.taskDetailTitleInput.value = payload.changes.title;
            if ('priority' in payload.changes) els.taskDetailPrioritySelect.value = payload.changes.priority;
            if ('status' in payload.changes) els.taskDetailStatusSelect.value = payload.changes.status;
          }
          await loadTasks();
        } else if (event.type === 'task_comment_added') {
          if (openTaskId === payload.task_id) {
            await loadCommentsList();
          }
        } else if (event.type === 'personal_task_received') {
          const currentUserId = window.ezAuth?.user?.id;
          if (payload.user_id === currentUserId) {
            if (activeTaskType === 'personal') {
              await loadTasks('personal');
            }
          }
        } else if (event.type === 'task_attachment_added' || event.type === 'task_attachment_deleted') {
          if (openTaskId === payload.task_id) {
            loadAttachmentsList();
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    eventSource.onerror = () => {
      sseConnected = false;
      startPolling();
      console.warn('SSE disconnected, reconnecting in 5s...');
      eventSource.close();
      setTimeout(setupSSE, 5000);
    };
  }

  function closeDetailsModal() {
    openTaskId = null;
    els.taskDetailsModal.classList.remove('open');
    els.taskDetailsModal.setAttribute('aria-hidden', 'true');
  }

  // Setup UI event listeners
  function setupEvents() {
    // Modal Close
    els.taskDetailsModal.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', closeDetailsModal);
    });

    // Refresh buttons
    document.querySelectorAll('.refresh-tasks-btn').forEach(btn => {
      btn.addEventListener('click', () => loadTasks());
    });

    // Filter selectors
    document.querySelectorAll('.task-status-filter, .task-sort-filter').forEach(select => {
      select.addEventListener('change', renderTasksTable);
    });

    // Quick creation input enter key
    document.querySelectorAll('.task-quick-input').forEach(input => {
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const val = input.value.trim();
          if (!val) return;

          input.value = '';
          input.disabled = true;

          try {
            await apiCall('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: val, type: activeTaskType })
            });
            await loadTasks();
          } catch (err) {
            alert(err.message);
          } finally {
            input.disabled = false;
            input.focus();
          }
        }
      });
    });

    // Modal Edit Listeners: Title Input (debounce auto-save)
    let titleDebounce = null;
    els.taskDetailTitleInput.addEventListener('input', () => {
      clearTimeout(titleDebounce);
      const val = els.taskDetailTitleInput.value.trim();
      if (!val) return;
      titleDebounce = setTimeout(() => {
        saveTaskChanges({ title: val });
      }, 500);
    });

    // Modal Edit Listeners: Post task comment
    if (els.taskAddCommentBtn && els.taskNewCommentInput) {
      els.taskAddCommentBtn.addEventListener('click', async () => {
        const val = els.taskNewCommentInput.value.trim();
        if (!val) return;
        
        els.taskNewCommentInput.value = '';
        els.taskAddCommentBtn.disabled = true;
        
        try {
          await apiCall(`/api/tasks/${openTaskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: val })
          });
          await loadCommentsList();
        } catch (err) {
          alert(err.message);
        } finally {
          els.taskAddCommentBtn.disabled = false;
        }
      });
      
      els.taskNewCommentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          els.taskAddCommentBtn.click();
        }
      });
    }

    // Modal Edit Listeners: Priority dropdown change
    els.taskDetailPrioritySelect.addEventListener('change', () => {
      saveTaskChanges({ priority: els.taskDetailPrioritySelect.value });
    });

    // Modal Edit Listeners: Status dropdown change
    els.taskDetailStatusSelect.addEventListener('change', () => {
      saveTaskChanges({ status: els.taskDetailStatusSelect.value });
    });

    // Attachment uploading inside modal
    if (els.taskDetailAttachBtn && els.taskDetailFileInput) {
      els.taskDetailAttachBtn.addEventListener('click', () => {
        els.taskDetailFileInput.click();
      });

      els.taskDetailFileInput.addEventListener('change', async () => {
        if (!openTaskId) return;
        const files = els.taskDetailFileInput.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            if (window.ezAuth?.ready) await window.ezAuth.ready;
            const res = await window.ezAuth.fetch(`/api/tasks/${openTaskId}/attachments`, {
              method: 'POST',
              body: formData
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Upload failed');
            }
          } catch (err) {
            alert(`Upload failed for ${file.name}: ${err.message}`);
          }
        }

        els.taskDetailFileInput.value = '';
        await loadAttachmentsList();
      });
    }
  }

  // Format Helper
  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const isFr = (window.ezAuth?.user?.activeBrand === 'ezmax') || (localStorage.getItem('ez_lang') === 'fr');
      return date.toLocaleString(isFr ? 'fr-CA' : 'en-CA', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch (_) {
      return isoString;
    }
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Init auth event hook on DOMContentLoaded to ensure ezAuth.ready is populated
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    
    if (window.ezAuth && window.ezAuth.ready) {
      window.ezAuth.ready.then(() => {
        setupSSE();
        startPolling();
        
        const currentView = document.querySelector('.side-link.active')?.dataset.viewTarget;
        if (currentView === 'tasks-team') {
          loadTasks('team');
        } else if (currentView === 'tasks-personal') {
          loadTasks('personal');
        }
      });
    }
  });

  // Expose ezTasks globally
  window.ezTasks = {
    loadTasks: loadTasks
  };
})();
