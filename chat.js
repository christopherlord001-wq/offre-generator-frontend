(function () {
  let activeConversationId = null;
  let conversations = [];

  const els = {
    chatNewBtn: document.getElementById('chatNewBtn'),
    chatConversationsList: document.getElementById('chatConversationsList'),
    chatActiveHeader: document.getElementById('chatActiveHeader'),
    chatActiveTitle: document.getElementById('chatActiveTitle'),
    chatRenameBtn: document.getElementById('chatRenameBtn'),
    chatDeleteBtn: document.getElementById('chatDeleteBtn'),
    chatMessagesArea: document.getElementById('chatMessagesArea'),
    chatInputText: document.getElementById('chatInputText'),
    chatSendBtn: document.getElementById('chatSendBtn'),
    sidebarLink: document.querySelector('[data-view-target="chat"]'),
    // Added for attachments and context
    chatAttachBtn: document.getElementById('chatAttachBtn'),
    chatFileInput: document.getElementById('chatFileInput'),
    chatAttachmentsPreview: document.getElementById('chatAttachmentsPreview'),
    chatContextToggleBtn: document.getElementById('chatContextToggleBtn'),
    chatContextDrawer: document.getElementById('chatContextDrawer'),
    chatContextText: document.getElementById('chatContextText'),
    chatSaveContextBtn: document.getElementById('chatSaveContextBtn')
  };

  // Helper to safely call API using ezAuth
  async function apiCall(url, options = {}) {
    if (window.ezAuth?.ready) await window.ezAuth.ready;
    const res = await window.ezAuth.fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  function displayUserName(email) {
    const raw = String(email || '').split('@')[0] || '';
    const known = {
      'christopher.lord': 'Christopher Lord',
      'marie-eve.rondeau': 'Marie-Eve Rondeau',
      'meher.nalbandian': 'Meher Nalbandian',
    };
    if (known[raw]) return known[raw];
    const cleaned = raw.replace(/[._-]+/g, ' ').trim();
    return cleaned
      ? cleaned.split(/\s+/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
      : 'Non assigné';
  }

  function formatDateTime(isoString) {
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

  function scrollToBottom() {
    if (els.chatMessagesArea) {
      els.chatMessagesArea.scrollTop = els.chatMessagesArea.scrollHeight;
    }
  }

  // Load and render conversations
  async function loadConversations(selectId = null) {
    if (!window.ezAuth?.user) return;
    try {
      const data = await apiCall('/api/chat/conversations');
      conversations = data.items || [];
      renderConversationsList();

      if (selectId) {
        await selectConversation(selectId);
      } else if (activeConversationId) {
        // Keep active conversation selected if it still exists
        const exists = conversations.some(c => c.id === activeConversationId);
        if (exists) {
          await selectConversation(activeConversationId);
        } else {
          deselectConversation();
        }
      } else {
        deselectConversation();
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }

  function renderConversationsList() {
    if (!els.chatConversationsList) return;
    if (conversations.length === 0) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.chatConversationsList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--ink-muted);font-size:13px;">${isFr ? 'Aucune conversation.' : 'No conversations.'}</div>`;
      return;
    }

    els.chatConversationsList.innerHTML = conversations.map(c => {
      const activeClass = c.id === activeConversationId ? 'active' : '';
      return `
        <div class="chat-conv-item ${activeClass}" data-conv-id="${c.id}">
          <div class="chat-conv-item-title">${escapeHTML(c.title)}</div>
          <div class="chat-conv-item-date">${formatDateTime(c.updated_at || c.created_at)}</div>
        </div>
      `;
    }).join('');

    // Bind clicks
    els.chatConversationsList.querySelectorAll('.chat-conv-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.convId);
        selectConversation(id);
      });
    });
  }

  function deselectConversation() {
    activeConversationId = null;
    if (els.chatActiveHeader) els.chatActiveHeader.style.display = 'none';
    if (els.chatInputText) {
      els.chatInputText.value = '';
      els.chatInputText.disabled = true;
    }
    if (els.chatSendBtn) els.chatSendBtn.disabled = true;
    if (els.chatAttachBtn) els.chatAttachBtn.disabled = true;
    if (els.chatFileInput) els.chatFileInput.value = '';
    
    if (els.chatAttachmentsPreview) {
      els.chatAttachmentsPreview.style.display = 'none';
      els.chatAttachmentsPreview.innerHTML = '';
    }
    if (els.chatContextText) els.chatContextText.value = '';
    if (els.chatContextDrawer) els.chatContextDrawer.style.display = 'none';
    
    if (els.chatMessagesArea) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.chatMessagesArea.innerHTML = `
        <div class="chat-empty-state">
          <div class="chat-empty-state-icon">🤖</div>
          <p>${isFr ? "Commencez à clavarder avec l'IA interne. Vos conversations restent enregistrées et isolées." : "Start chatting with the internal AI. Your conversations remain saved and isolated."}</p>
        </div>
      `;
    }
  }

  async function selectConversation(id) {
    activeConversationId = id;
    const conv = conversations.find(c => c.id === id);
    if (!conv) {
      deselectConversation();
      return;
    }

    // Update active UI state
    els.chatActiveTitle.textContent = conv.title;
    els.chatActiveHeader.style.display = '';
    els.chatInputText.disabled = false;
    els.chatSendBtn.disabled = false;
    if (els.chatAttachBtn) els.chatAttachBtn.disabled = false;

    // Load active conversation's context
    if (els.chatContextText) {
      els.chatContextText.value = conv.context || '';
    }

    // Toggle active list class
    if (els.chatConversationsList) {
      els.chatConversationsList.querySelectorAll('.chat-conv-item').forEach(el => {
        const itemInt = parseInt(el.dataset.convId);
        el.classList.toggle('active', itemInt === id);
      });
    }

    // Load messages
    if (els.chatMessagesArea) {
      els.chatMessagesArea.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:var(--ink-muted);">Chargement des messages...</div>`;
    }

    try {
      const data = await apiCall(`/api/chat/conversations/${id}/messages`);
      renderMessages(data.items || []);
      scrollToBottom();
      
      // Load attachments
      await loadAttachments();
      
      els.chatInputText.focus();
    } catch (e) {
      console.error('Failed to load chat messages:', e);
      if (els.chatMessagesArea) {
        els.chatMessagesArea.innerHTML = `<div style="color:var(--brand-primary);padding:20px;text-align:center;">Erreur: ${escapeHTML(e.message)}</div>`;
      }
    }
  }

  function renderMessages(messages) {
    if (!els.chatMessagesArea) return;
    if (messages.length === 0) {
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.chatMessagesArea.innerHTML = `
        <div class="chat-empty-state">
          <div class="chat-empty-state-icon">💬</div>
          <p>${isFr ? "Envoyez un premier message pour débuter la discussion." : "Send a first message to start the discussion."}</p>
        </div>
      `;
      return;
    }

    els.chatMessagesArea.innerHTML = messages.map(m => {
      const bubbleClass = m.sender === 'user' ? 'user' : 'assistant';
      return `
        <div class="chat-bubble ${bubbleClass}">
          ${m.message.split('\n').map(line => escapeHTML(line)).join('<br>')}
        </div>
      `;
    }).join('');
  }

  async function loadAttachments() {
    if (!activeConversationId) {
      if (els.chatAttachmentsPreview) els.chatAttachmentsPreview.style.display = 'none';
      return;
    }
    try {
      const data = await apiCall(`/api/chat/conversations/${activeConversationId}/attachments`);
      renderAttachments(data.items || []);
    } catch (e) {
      console.error('Failed to load attachments:', e);
    }
  }

  function renderAttachments(items) {
    if (!els.chatAttachmentsPreview) return;
    if (items.length === 0) {
      els.chatAttachmentsPreview.style.display = 'none';
      els.chatAttachmentsPreview.innerHTML = '';
      return;
    }
    
    els.chatAttachmentsPreview.style.display = 'flex';
    els.chatAttachmentsPreview.innerHTML = items.map(item => {
      const ext = item.filename.split('.').pop().toLowerCase();
      let icon = '📎';
      if (['pdf'].includes(ext)) icon = '📕';
      else if (['doc', 'docx'].includes(ext)) icon = '📘';
      else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) icon = '🖼️';
      
      return `
        <div class="chat-attachment-pill" data-att-id="${item.id}">
          <span>${icon}</span>
          <span class="chat-attachment-pill-name" title="${escapeHTML(item.filename)}">${escapeHTML(item.filename)}</span>
          <span class="chat-attachment-pill-remove" title="Supprimer">&times;</span>
        </div>
      `;
    }).join('');
    
    // Bind deletes
    els.chatAttachmentsPreview.querySelectorAll('.chat-attachment-pill-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pill = btn.closest('.chat-attachment-pill');
        const attId = parseInt(pill.dataset.attId);
        try {
          await apiCall(`/api/chat/conversations/${activeConversationId}/attachments/${attId}`, {
            method: 'DELETE'
          });
          await loadAttachments();
        } catch (err) {
          alert(`Erreur de suppression : ${err.message}`);
        }
      });
    });
  }

  async function createNewConversation() {
    const isFr = (localStorage.getItem('ez_lang') !== 'en');
    const defaultTitle = isFr ? 'Nouvelle discussion' : 'New conversation';
    try {
      // Cleanup empty conversations first!
      await apiCall('/api/chat/conversations/cleanup', { method: 'POST' }).catch(() => {});
      
      const conv = await apiCall('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: defaultTitle })
      });
      await loadConversations(conv.id);
    } catch (e) {
      alert(`Erreur de création : ${e.message}`);
    }
  }

  async function renameConversation() {
    if (!activeConversationId) return;
    const conv = conversations.find(c => c.id === activeConversationId);
    if (!conv) return;

    const isFr = (localStorage.getItem('ez_lang') !== 'en');
    const newTitle = prompt(
      isFr ? 'Entrez le nouveau titre de la conversation :' : 'Enter the new conversation title:',
      conv.title
    );

    if (newTitle === null) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    try {
      await apiCall(`/api/chat/conversations/${activeConversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });
      
      // Update local cache and header
      conv.title = trimmed;
      els.chatActiveTitle.textContent = trimmed;
      
      // Refresh list
      renderConversationsList();
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    }
  }

  async function deleteConversation() {
    if (!activeConversationId) return;
    const isFr = (localStorage.getItem('ez_lang') !== 'en');
    if (!confirm(isFr ? 'Voulez-vous supprimer cette conversation et tous ses messages ?' : 'Do you want to delete this conversation and all its messages?')) {
      return;
    }

    try {
      await apiCall(`/api/chat/conversations/${activeConversationId}`, {
        method: 'DELETE'
      });
      activeConversationId = null;
      await loadConversations();
    } catch (e) {
      alert(`Erreur de suppression : ${e.message}`);
    }
  }

  async function sendChatMessage() {
    if (!activeConversationId) return;
    const text = els.chatInputText.value.trim();
    if (!text) return;

    // Clear input
    els.chatInputText.value = '';
    els.chatInputText.disabled = true;
    els.chatSendBtn.disabled = true;
    if (els.chatAttachBtn) els.chatAttachBtn.disabled = true;

    const isFr = (localStorage.getItem('ez_lang') !== 'en');

    // Append user message immediately
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerHTML = text.split('\n').map(line => escapeHTML(line)).join('<br>');
    
    // Remove empty state if present
    const emptyState = els.chatMessagesArea.querySelector('.chat-empty-state');
    if (emptyState) {
      els.chatMessagesArea.innerHTML = '';
    }
    
    els.chatMessagesArea.appendChild(userBubble);
    scrollToBottom();

    // Append a temporary assistant thinking bubble
    const thinkingBubble = document.createElement('div');
    thinkingBubble.className = 'chat-bubble assistant thinking';
    thinkingBubble.textContent = isFr ? "L'IA réfléchit..." : "AI is thinking...";
    els.chatMessagesArea.appendChild(thinkingBubble);
    scrollToBottom();

    const isFirstMessage = els.chatMessagesArea.children.length === 2; // (userBubble + thinkingBubble)

    try {
      const data = await apiCall(`/api/chat/conversations/${activeConversationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      // Remove thinking bubble
      thinkingBubble.remove();

      // Append assistant message
      const assistantBubble = document.createElement('div');
      assistantBubble.className = 'chat-bubble assistant';
      assistantBubble.innerHTML = data.message.split('\n').map(line => escapeHTML(line)).join('<br>');
      els.chatMessagesArea.appendChild(assistantBubble);
      scrollToBottom();

      // If it was the first message, refresh conversation list to update auto-generated title
      if (isFirstMessage) {
        await loadConversations(activeConversationId);
      } else {
        // Just refresh dates and order in list
        await loadConversations(activeConversationId);
      }
    } catch (e) {
      thinkingBubble.textContent = `Erreur : ${e.message}`;
      console.error(e);
    } finally {
      els.chatInputText.disabled = false;
      els.chatSendBtn.disabled = false;
      if (els.chatAttachBtn) els.chatAttachBtn.disabled = false;
      els.chatInputText.focus();
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

  // Setup Event Listeners
  if (els.chatNewBtn) els.chatNewBtn.addEventListener('click', createNewConversation);
  if (els.chatRenameBtn) els.chatRenameBtn.addEventListener('click', renameConversation);
  if (els.chatDeleteBtn) els.chatDeleteBtn.addEventListener('click', deleteConversation);
  if (els.chatSendBtn) els.chatSendBtn.addEventListener('click', sendChatMessage);

  if (els.chatInputText) {
    els.chatInputText.addEventListener('keydown', (e) => {
      // Send on Enter without shift key
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  if (els.sidebarLink) {
    els.sidebarLink.addEventListener('click', () => {
      createNewConversation();
    });
  }

  // Attachments handlers
  if (els.chatAttachBtn && els.chatFileInput) {
    els.chatAttachBtn.addEventListener('click', () => {
      els.chatFileInput.click();
    });
  }

  if (els.chatFileInput) {
    els.chatFileInput.addEventListener('change', async () => {
      if (!activeConversationId) return;
      const files = els.chatFileInput.files;
      if (!files || files.length === 0) return;

      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          if (window.ezAuth?.ready) await window.ezAuth.ready;
          const res = await window.ezAuth.fetch(`/api/chat/conversations/${activeConversationId}/attachments`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
          }
        } catch (e) {
          alert(isFr ? `Erreur d'envoi du fichier ${file.name} : ${e.message}` : `Error uploading file ${file.name}: ${e.message}`);
        }
      }
      
      els.chatFileInput.value = '';
      await loadAttachments();
    });
  }

  // Context drawer toggle and save handlers
  if (els.chatContextToggleBtn && els.chatContextDrawer) {
    els.chatContextToggleBtn.addEventListener('click', () => {
      const isHidden = els.chatContextDrawer.style.display === 'none';
      els.chatContextDrawer.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && els.chatContextText) {
        els.chatContextText.focus();
      }
    });
  }

  if (els.chatSaveContextBtn && els.chatContextText) {
    els.chatSaveContextBtn.addEventListener('click', async () => {
      if (!activeConversationId) return;
      const contextVal = els.chatContextText.value.trim();
      
      const oldText = els.chatSaveContextBtn.textContent;
      const isFr = (localStorage.getItem('ez_lang') !== 'en');
      els.chatSaveContextBtn.textContent = isFr ? 'Enregistrement...' : 'Saving...';
      els.chatSaveContextBtn.disabled = true;
      
      try {
        await apiCall(`/api/chat/conversations/${activeConversationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: contextVal })
        });
        
        const conv = conversations.find(c => c.id === activeConversationId);
        if (conv) conv.context = contextVal;
        
        els.chatSaveContextBtn.textContent = isFr ? 'Enregistré !' : 'Saved!';
        setTimeout(() => {
          els.chatSaveContextBtn.textContent = oldText;
          els.chatSaveContextBtn.disabled = false;
        }, 1500);
      } catch (err) {
        alert(isFr ? `Erreur d'enregistrement : ${err.message}` : `Error saving context: ${err.message}`);
        els.chatSaveContextBtn.textContent = oldText;
        els.chatSaveContextBtn.disabled = false;
      }
    });
  }

  // Cleanup when navigating away from chat view
  document.addEventListener('click', (e) => {
    const targetEl = e.target.closest('[data-view-target], [data-action]');
    if (targetEl) {
      const activeLink = document.querySelector('.side-link.active');
      const currentView = activeLink ? activeLink.dataset.viewTarget : null;
      if (currentView === 'chat') {
        const targetView = targetEl.dataset.viewTarget;
        if (targetView !== 'chat') {
          apiCall('/api/chat/conversations/cleanup', { method: 'POST' }).catch(() => {});
        }
      }
    }
  });

  // Hook into auth switches
  if (window.ezAuth && window.ezAuth.ready) {
    window.ezAuth.ready.then(async () => {
      // Load initially if view matches target
      const currentView = document.querySelector('.side-link.active')?.dataset.viewTarget;
      if (currentView === 'chat') {
        await loadConversations();
      }
    });
  }
})();
