(() => {
  if (window.__EZSIGN_SHELL_INIT__) return;
  window.__EZSIGN_SHELL_INIT__ = true;

  const CONFIG_API_BASE = String(window.EZSIGN_CONFIG?.apiBaseUrl || '').trim().replace(/\/+$/, '');
  const IS_FILE = window.location.protocol === 'file:';
  const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
  const API_BASE = IS_FILE ? 'http://127.0.0.1:5055' : (IS_GITHUB_PAGES ? CONFIG_API_BASE : '');

  const $ = id => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  let currentViewStart = Date.now();
  let currentViewName = 'home';

  const copy = {
    fr: {
      navHome: 'Accueil',
      navTasks: 'Tâches',
      navTasksTeam: 'Équipe',
      navTasksPersonal: 'Mes Tâches',
      navProposals: 'Offres de service',
      navAnalysis: 'Analyse IA',
      navAnalysisDashboard: 'Dashboard',
      navAnalysisNew: 'Analyse',
      navCalculator: 'Calculatrice',
      navAdmin: 'Administration',
      themeLight: 'Mode clair',
      themeDark: 'Mode sombre',
      homeSubtitle: 'Choisis ce que tu veux faire.',
      homeQuickTitle: 'Que veux-tu accomplir?',
      homeCreateProposal: 'Créer une offre de service',
      homeCreateProposalSub: 'Génère Word, PDF ou les deux et garde le tout dans le dashboard.',
      homeAnalyzeMeeting: 'Analyser une rencontre',
      homeAnalyzeMeetingSub: 'Colle un transcript et obtiens résumé, score, objections et coaching.',
      homeNotifications: 'Informations',
      proposalDashboardTitle: 'Dashboard des offres',
      proposalDashboardSub: 'Recherche, filtre et télécharge les offres générées.',
      newProposal: 'Nouvelle offre',
      proposalNewTitle: 'Nouvelle offre de service',
      proposalNewSub: 'Genere Word, PDF ou les deux, puis sauvegarde le resultat dans le dashboard.',
      backToDashboard: 'Retour dashboard',
      analysisDashboardTitle: 'Dashboard des analyses IA',
      analysisDashboardSub: 'Suis les scores, objections, intérêts et prochaines étapes.',
      newAnalysis: 'Nouvelle analyse',
      analysisWorkspaceTitle: 'Analyse IA des rencontres',
      analysisWorkspaceSub: 'Utilise l’espace complet avec mémoire, graphique, transcript et historique.',
      analysisWorkspaceCardTitle: 'Espace d’analyse',
      analysisWorkspaceCardText: 'Ouvre l’espace pour coller un transcript, lancer Ollama localement, copier la note et consulter la mémoire.',
      openAnalysisWorkspace: 'Ouvrir l’espace',
      calculatorTitle: 'Calculatrice',
      calculatorSub: 'Compare les forfaits et prépare les simulations.',
      compare: 'Comparer',
      adminTitle: 'Administration',
      adminSub: 'Gère ton compte, les utilisateurs, les marques et la sécurité.',
      adminCardTitle: 'Settings',
      adminCardText: 'Ouvre settings pour changer ton mot de passe. Les admins gèrent aussi les utilisateurs, marques et réglages.',
      searchCompany: 'Rechercher une compagnie...',
      searchClient: 'Rechercher un client...',
      allLanguages: 'Toutes les langues',
      allReps: 'Tous les reps',
      refresh: 'Rafraîchir',
      download: 'Télécharger',
      delete: 'Supprimer',
      noProposals: 'Aucune offre générée encore.',
      noAnalyses: 'Aucune analyse enregistrée encore.',
      supportSubject: 'Sujet',
      supportMessage: 'Message détaillé',
      supportCategory: 'Catégorie',
      supportScreenshot: 'Capture d’écran',
      supportSubmit: 'Créer le ticket',
      supportTitle: 'Support Centre',
      bug: 'Bug',
      feature: 'Demande de fonctionnalité',
      question: 'Question',
      tasksTeamTitle: "Tâches d'équipe",
      tasksTeamSub: "Gère, organise et distribue les tâches au sein de l'équipe.",
      tasksPersonalTitle: "Mes Tâches",
      tasksPersonalSub: "Vos tâches personnelles privées et les tâches d'équipe qui vous ont été assignées.",
      filterStatus: "Statut :",
      filterSort: "Trier par :",
      statusActive: "Tâches actives (non fermées)",
      statusAll: "Toutes",
      statusNotStarted: "Non commencées (Not started)",
      statusInProgress: "En cours (In progress)",
      statusPending: "En attente (Pending)",
      statusBlocked: "Bloquées (Blocked)",
      statusClosed: "Fermées (Closed)",
      sortDateAsc: "Date (plus anciennes en haut)",
      sortDateDesc: "Date (plus récentes en haut)",
      sortPriority: "Priorité",
      sortCreator: "Créateur",
      sortAlphabetical: "Ordre alphabétique",
      placeholderTeamTask: "Ajouter une tâche d'équipe... (Saisissez le nom et appuyez sur Entrée)",
      placeholderPersonalTask: "Ajouter une tâche personnelle... (Saisissez le nom et appuyez sur Entrée)",
      thPriority: "Priorité",
      thTaskName: "Nom de la tâche",
      thStatus: "Statut",
      thCreatedBy: "Créé par",
      thDate: "Date",
    },
    en: {
      navHome: 'Home',
      navTasks: 'Tasks',
      navTasksTeam: 'Team',
      navTasksPersonal: 'My Tasks',
      navProposals: 'Proposals',
      navAnalysis: 'AI analysis',
      navAnalysisDashboard: 'Dashboard',
      navAnalysisNew: 'Analysis',
      navCalculator: 'Calculator',
      navAdmin: 'Administration',
      themeLight: 'Light mode',
      themeDark: 'Dark mode',
      homeSubtitle: 'Choose what you want to work on.',
      homeQuickTitle: 'What would you like to accomplish?',
      homeCreateProposal: 'Create a proposal',
      homeCreateProposalSub: 'Generate Word, PDF, or both and keep it in the dashboard.',
      homeAnalyzeMeeting: 'Analyze a meeting',
      homeAnalyzeMeetingSub: 'Paste a transcript and get a summary, score, objections, and coaching.',
      homeNotifications: 'Information',
      proposalDashboardTitle: 'Proposal dashboard',
      proposalDashboardSub: 'Search, filter, and download generated proposals.',
      newProposal: 'New proposal',
      proposalNewTitle: 'New proposal',
      proposalNewSub: 'Generate Word, PDF, or both, then save the result in the dashboard.',
      backToDashboard: 'Back to dashboard',
      analysisDashboardTitle: 'Meeting analysis dashboard',
      analysisDashboardSub: 'Track scores, objections, interests, and next steps.',
      newAnalysis: 'New analysis',
      analysisWorkspaceTitle: 'Meeting analysis',
      analysisWorkspaceSub: 'Use the complete workspace with memory, chart, transcript, and history.',
      analysisWorkspaceCardTitle: 'Analysis workspace',
      analysisWorkspaceCardText: 'Open the workspace to paste a transcript, run local Ollama, copy the note, and review memory.',
      openAnalysisWorkspace: 'Open workspace',
      calculatorTitle: 'Calculator',
      calculatorSub: 'Compare plans and prepare simulations.',
      compare: 'Compare',
      adminTitle: 'Administration',
      adminSub: 'Manage your account, users, brands, and security.',
      adminCardTitle: 'Settings',
      adminCardText: 'Open settings to change your password. Admins also manage users, brands, and security settings.',
      searchCompany: 'Search company...',
      searchClient: 'Search client...',
      allLanguages: 'All languages',
      allReps: 'All reps',
      refresh: 'Refresh',
      download: 'Download',
      delete: 'Delete',
      noProposals: 'No generated proposals yet.',
      noAnalyses: 'No saved analyses yet.',
      supportSubject: 'Subject',
      supportMessage: 'Detailed message',
      supportCategory: 'Category',
      supportScreenshot: 'Screenshot',
      supportSubmit: 'Create ticket',
      supportTitle: 'Support Centre',
      bug: 'Bug',
      feature: 'Feature request',
      question: 'Question',
      tasksTeamTitle: "Team Tasks",
      tasksTeamSub: "Manage, organize, and distribute tasks within the team.",
      tasksPersonalTitle: "My Tasks",
      tasksPersonalSub: "Your private personal tasks and team tasks assigned to you.",
      filterStatus: "Status:",
      filterSort: "Sort by:",
      statusActive: "Active tasks (not closed)",
      statusAll: "All",
      statusNotStarted: "Not started",
      statusInProgress: "In progress",
      statusPending: "Pending",
      statusBlocked: "Blocked",
      statusClosed: "Closed",
      sortDateAsc: "Date (oldest first)",
      sortDateDesc: "Date (newest first)",
      sortPriority: "Priority",
      sortCreator: "Creator",
      sortAlphabetical: "Alphabetical",
      placeholderTeamTask: "Add a team task... (Type name and press Enter)",
      placeholderPersonalTask: "Add a personal task... (Type name and press Enter)",
      thPriority: "Priority",
      thTaskName: "Task name",
      thStatus: "Status",
      thCreatedBy: "Created by",
      thDate: "Date",
    },
  };

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('ezsign:proposal-generated', refreshProposals);
  window.addEventListener('ezsign:analysis-generated', () => {
    refreshAnalysis();
    refreshAnalysisInsights('analysisDashboardInsights');
    refreshAnalysisInsights('analysisWorkspaceInsights');
    refreshHomeStats();
  });

  async function init() {
    if (window.ezAuth?.ready) {
      try { await window.ezAuth.ready; } catch (_) {}
    }
    wireShell();
    setLogo();
    applyLanguage(platformLang());
    showView('home');
    refreshHomeStats();
    refreshProposals();
    refreshAnalysis();
    if (window.ezAuth?.user) {
      qs('#adminSupportHome')?.removeAttribute('hidden');
      refreshTickets();
      if (window.ezAuth.user.is_admin) {
        qs('#adminSecurityAlertsHome')?.removeAttribute('hidden');
        refreshSecurityAlerts();
      }
    }
    syncThemeLabels();
  }

  function wireShell() {
    qsa('[data-view-target]').forEach(el => el.addEventListener('click', () => showView(el.dataset.viewTarget)));
    qsa('[data-action="new-proposal"]').forEach(el => el.addEventListener('click', openProposalBuilder));
    qsa('[data-action="new-analysis"]').forEach(el => el.addEventListener('click', openAnalysisBuilder));
    $('sidebarToggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
    $('platformLogo')?.addEventListener('click', toggleBrand);
    $('topSettingsBtn')?.addEventListener('click', () => showView('admin'));
    $('topInfoBtn')?.addEventListener('click', () => $('infoBtn')?.click());
    $('calculatorInfoBtn')?.addEventListener('click', () => $('infoBtn')?.click());
    $('topCompareBtn')?.addEventListener('click', () => $('compareBtn')?.click());
    $('calculatorCompareBtn')?.addEventListener('click', () => $('compareBtn')?.click());
    $('topSupportBtn')?.addEventListener('click', openSupportModal);
    $('refreshTicketsBtn')?.addEventListener('click', refreshTickets);
    $('refreshAlertsBtn')?.addEventListener('click', refreshSecurityAlerts);
    $('refreshProposalsBtn')?.addEventListener('click', refreshProposals);
    $('refreshAnalysisBtn')?.addEventListener('click', refreshAnalysis);
    $('proposalSearch')?.addEventListener('input', refreshProposals);
    $('proposalLangFilter')?.addEventListener('change', refreshProposals);
    $('analysisSearch')?.addEventListener('input', refreshAnalysis);
    $('analysisRepFilter')?.addEventListener('change', refreshAnalysis);
    $('analysisDateFrom')?.addEventListener('change', refreshAnalysis);
    $('analysisDateTo')?.addEventListener('change', refreshAnalysis);
    $('quickMenuBtn')?.addEventListener('click', event => {
      event.stopPropagation();
      qs('#quickMenuPanel')?.classList.toggle('open');
    });
    qs('#quickMenuPanel')?.addEventListener('click', event => {
      event.stopPropagation();
      if (event.target.closest('button')) qs('#quickMenuPanel')?.classList.remove('open');
    });
    document.addEventListener('click', () => qs('#quickMenuPanel')?.classList.remove('open'));
    $('topLangBtn')?.addEventListener('click', toggleLanguage);
    $('topThemeBtn')?.addEventListener('click', toggleTheme);
    $('sideThemeBtn')?.addEventListener('click', toggleTheme);
    $('topUserAvatar')?.addEventListener('click', () => showView('admin'));
  }

  function platformLang() {
    return localStorage.getItem('ez_lang') || 'fr';
  }

  function t(key) {
    return copy[platformLang()]?.[key] || copy.fr[key] || key;
  }

  function applyLanguage(lang) {
    qsa('[data-i18n]').forEach(el => { el.textContent = copy[lang]?.[el.dataset.i18n] || el.textContent; });
    
    const active = window.ezAuth?.user?.activeBrand || 'ezsign';
    if (active === 'ezmax') {
      if ($('title')) $('title').textContent = lang === 'fr' ? 'Générateur de proposition eZmax' : 'eZmax Proposal Generator';
      
      const calcTitleEl = qs('[data-i18n="calculatorTitle"]');
      if (calcTitleEl) calcTitleEl.textContent = lang === 'fr' ? 'Calculateur eZmax' : 'eZmax Calculator';
      const calcSubEl = qs('[data-i18n="calculatorSub"]');
      if (calcSubEl) calcSubEl.textContent = lang === 'fr' ? "Calculateur et générateur d'offre" : 'Calculator and offer builder';
      
      const propNewTitleEl = qs('[data-i18n="proposalNewTitle"]');
      if (propNewTitleEl) propNewTitleEl.textContent = lang === 'fr' ? 'Générateur de proposition eZmax' : 'eZmax Proposal Generator';
      const propNewSubEl = qs('[data-i18n="proposalNewSub"]');
      if (propNewSubEl) propNewSubEl.textContent = lang === 'fr' ? "Calculateur et générateur d'offre" : 'Calculator and offer builder';
    } else {
      if ($('title')) $('title').textContent = lang === 'fr' ? 'Calculateur eZsign' : 'eZsign Calculator';
    }

    $('topLangBtn').textContent = lang === 'fr' ? 'EN' : 'FR';
    $('proposalSearch')?.setAttribute('placeholder', copy[lang].searchCompany);
    $('analysisSearch')?.setAttribute('placeholder', copy[lang].searchClient);
    $('teamTaskQuickInput')?.setAttribute('placeholder', copy[lang].placeholderTeamTask);
    $('personalTaskQuickInput')?.setAttribute('placeholder', copy[lang].placeholderPersonalTask);
    const proposalLangFilter = $('proposalLangFilter');
    if (proposalLangFilter) proposalLangFilter.options[0].textContent = copy[lang].allLanguages;
    const analysisRepFilter = $('analysisRepFilter');
    if (analysisRepFilter) analysisRepFilter.options[0].textContent = copy[lang].allReps;
    ['refreshProposalsBtn', 'refreshAnalysisBtn', 'refreshTicketsBtn'].forEach(id => {
      if ($(id)) $(id).textContent = copy[lang].refresh;
    });
    syncThemeLabels();
    translateMeetingWorkspace(lang);
    window.dispatchEvent(new CustomEvent('ezsign:lang-changed', { detail: { lang } }));
    if (window.ezAuth?.user) {
      const first = window.ezAuth.user.email.split('@')[0].split(/[._-]/)[0];
      $('homeWelcome').textContent = lang === 'fr' ? `Bienvenue ${capitalize(first)}` : `Welcome ${capitalize(first)}`;
      const initials = displayUserName(window.ezAuth.user.email).split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      if ($('topUserAvatar')) $('topUserAvatar').textContent = initials || 'EZ';
    }
  }

  function translateMeetingWorkspace(lang) {
    const map = lang === 'fr'
      ? {
          meetingClientName: ['Client', 'Ex. Coopérative d’habitation'],
          meetingReference: ['Référence', 'Ex. Référé par Hopem'],
          meetingProspectSource: ['Source prospect', 'Ex. DocuSign, Hopem, référé'],
          meetingTranscript: ['Transcript', 'Colle le transcript complet de la rencontre ici...'],
          meetingAnalyzeBtn: 'Analyser la rencontre',
          meetingClearBtn: 'Effacer',
        }
      : {
          meetingClientName: ['Client', 'Ex. Housing cooperative'],
          meetingReference: ['Reference', 'Ex. Referred by Hopem'],
          meetingProspectSource: ['Prospect source', 'Ex. DocuSign, Hopem, referral'],
          meetingTranscript: ['Transcript', 'Paste the full meeting transcript here...'],
          meetingAnalyzeBtn: 'Analyze meeting',
          meetingClearBtn: 'Clear',
        };
    Object.entries(map).forEach(([id, value]) => {
      const el = $(id);
      if (!el) return;
      if (Array.isArray(value)) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) label.textContent = value[0];
        el.placeholder = value[1];
      } else {
        el.textContent = value;
      }
    });
  }

  function toggleLanguage() {
    $('langBtn')?.click();
    setTimeout(() => applyLanguage(platformLang()), 0);
  }

  function toggleTheme() {
    $('themeBtn')?.click();
    setTimeout(syncThemeLabels, 0);
  }

  function syncThemeLabels() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const label = dark ? t('themeDark') : t('themeLight');
    const side = $('sideThemeBtn');
    if (side) {
      qs('b', side).textContent = label;
      qs('span', side).textContent = dark ? '☾' : '☀';
    }
  }

  function showView(view) {
    if (view === 'analysis') view = 'analysis-dashboard';

    // Log time spent on the previous page
    if (currentViewName && currentViewName !== view) {
      const duration = Math.round((Date.now() - currentViewStart) / 1000);
      if (duration > 0) {
        api('/api/logs/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'page_view',
            description: `Visité la page '${currentViewName}' pendant ${duration} secondes`
          })
        }).catch(() => {});
      }
    }
    currentViewStart = Date.now();
    currentViewName = view;

    qsa('.app-view').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    qsa('.side-link').forEach(el => el.classList.toggle('active', el.dataset.viewTarget === view || (view.startsWith('analysis') && el.dataset.viewTarget === 'analysis-dashboard') || (view.startsWith('tasks') && el.dataset.viewTarget === 'tasks-team')));
    qsa('.side-submenu button').forEach(el => el.classList.toggle('active', el.dataset.viewTarget === view));
    localStorage.setItem('ez_platform_view', view);
    if (view === 'calculator') {
      const activeBrand = window.ezAuth?.user?.activeBrand || 'ezsign';
      const ezsignCalc = $('ezsignCalculator');
      const ezmaxCalc = $('ezmaxCalculator');
      if (activeBrand === 'ezmax') {
        if (ezsignCalc) ezsignCalc.style.display = 'none';
        if (ezmaxCalc) ezmaxCalc.style.display = 'block';
      } else {
        if (ezsignCalc) ezsignCalc.style.display = 'block';
        if (ezmaxCalc) ezmaxCalc.style.display = 'none';
      }
    }
    if (view === 'home') {
      refreshHomeStats();
      refreshTickets();
      if (window.ezAuth?.user?.is_admin) {
        refreshSecurityAlerts();
      }
    }
    if (view === 'proposals') refreshProposals();
    if (view === 'tasks-team') {
      if (window.ezTasks && typeof window.ezTasks.loadTasks === 'function') {
        window.ezTasks.loadTasks('team');
      }
    }
    if (view === 'tasks-personal') {
      if (window.ezTasks && typeof window.ezTasks.loadTasks === 'function') {
        window.ezTasks.loadTasks('personal');
      }
    }
    if (view === 'proposal-new') dockProposalBuilder();
    if (view === 'analysis-new') {
      refreshAnalysisInsights('analysisWorkspaceInsights');
      if (window.ezMeetingAi && typeof window.ezMeetingAi.clearForm === 'function') {
        window.ezMeetingAi.clearForm();
      }
      dockAnalysisBuilder();
    }
    if (view === 'analysis-dashboard') {
      refreshAnalysisInsights('analysisDashboardInsights');
      refreshAnalysis();
    }
    if (view === 'admin') dockSettings();
  }

  function openProposalBuilder() {
    showView('proposal-new');
  }

  function openAnalysisBuilder() {
    showView('analysis-new');
  }

  function dockProposalBuilder() {
    const mount = $('proposalBuilderMount');
    if (!mount) return;
    
    // Clear mount first
    mount.innerHTML = '';
    
    const activeBrand = window.ezAuth?.user?.activeBrand || 'ezsign';
    if (activeBrand === 'ezmax') {
      const modal = $('ezmaxOfferModal');
      if (!modal) return;
      mount.appendChild(modal);
      modal.classList.add('open', 'docked-modal');
      modal.setAttribute('aria-hidden', 'false');
    } else {
      const modal = $('offerModal');
      if (!modal) return;
      mount.appendChild(modal);
      modal.classList.add('open', 'docked-modal');
      modal.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => $('offerBtn')?.click(), 0);
    }
  }

  function dockAnalysisBuilder() {
    const modal = $('meetingAiModal');
    const mount = $('analysisBuilderMount');
    if (!modal || !mount) return;
    if (modal.parentElement !== mount) mount.appendChild(modal);
    modal.classList.add('open', 'docked-modal');
    modal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => $('meetingAiBtn')?.click(), 0);
  }

  async function dockSettings() {
    const mount = $('adminSettingsMount');
    if (!mount) return;
    if (!window.ezAuth?.openSettingsInline) {
      $('settingsBtn')?.click();
      await new Promise(resolve => setTimeout(resolve, 80));
    } else {
      await window.ezAuth.openSettingsInline();
    }
    const modal = $('settingsModal');
    if (!modal) return;
    if (modal.parentElement !== mount) mount.appendChild(modal);
    modal.classList.add('open', 'docked-modal');
    modal.setAttribute('aria-hidden', 'false');
  }

  async function refreshHomeStats() {
    try {
      const stats = await api('/api/me/dashboard');
      const proposals = { items: Array.from({ length: stats.proposals_count || 0 }) };
      const memory = { count: stats.analyses_count || 0, average_score: stats.average_score ?? '-' };
      $('homeStats').innerHTML = `
        <div><b>${(proposals.items || []).length}</b><span>${platformLang() === 'fr' ? 'Offres générées' : 'Generated proposals'}</span></div>
        <div><b>${memory.count || 0}</b><span>${platformLang() === 'fr' ? 'Analyses enregistrées' : 'Saved analyses'}</span></div>
        <div><b>${memory.average_score ?? '-'}</b><span>${platformLang() === 'fr' ? 'Score moyen' : 'Average score'}</span></div>
      `;
    } catch (_) {}
  }

  async function refreshProposals() {
    const target = $('proposalsDashboard');
    if (!target || !window.ezAuth?.user) return;
    try {
      const data = await api('/proposals');
      const search = ($('proposalSearch')?.value || '').trim().toLowerCase();
      const lang = $('proposalLangFilter')?.value || '';
      const rows = (data.items || []).filter(item => {
        const hay = `${item.company_name || ''} ${item.creator_name || ''} ${item.created_by_email || ''} ${item.filename || ''}`.toLowerCase();
        return (!search || hay.includes(search)) && (!lang || item.offer_lang === lang);
      });
      target.innerHTML = rows.length ? dashboardTable([
        platformLang() === 'fr' ? 'Compagnie' : 'Company',
        platformLang() === 'fr' ? 'Cree par' : 'Created by',
        platformLang() === 'fr' ? 'Créée le' : 'Created',
        platformLang() === 'fr' ? 'Langue' : 'Language',
        platformLang() === 'fr' ? 'Formats' : 'Formats',
        '',
      ], rows.map(item => [
        `<b>${escapeHTML(item.company_name || '-')}</b><small>${escapeHTML(item.creator_name || '')}</small>`,
        `<b>${escapeHTML(displayUserName(item.created_by_email))}</b><small>${escapeHTML(displayUserEmail(item.created_by_email))}</small>`,
        escapeHTML(formatDateTime(item.created_at)),
        escapeHTML(String(item.offer_lang || '').toUpperCase()),
        escapeHTML(formatFormats(item.formats)),
        `<button class="platform-pill" data-download-proposal="${item.id}">${t('download')}</button>${window.ezAuth.user.is_admin ? ` <button class="platform-pill danger" data-delete-proposal="${item.id}">${t('delete')}</button>` : ''}`,
      ])) : `<div class="empty-dashboard">${t('noProposals')}</div>`;
      qsa('[data-download-proposal]', target).forEach(btn => btn.addEventListener('click', () => downloadProposal(btn.dataset.downloadProposal)));
      qsa('[data-delete-proposal]', target).forEach(btn => btn.addEventListener('click', () => deleteProposal(btn.dataset.deleteProposal)));
      refreshHomeStats();
    } catch (error) {
      target.innerHTML = `<div class="empty-dashboard">${escapeHTML(error.message)}</div>`;
    }
  }

  async function refreshAnalysis() {
    const target = $('analysisDashboard');
    if (!target || !window.ezAuth?.user) return;
    try {
      const data = await api('/meetings/analyses');
      const search = ($('analysisSearch')?.value || '').trim().toLowerCase();
      const rep = $('analysisRepFilter')?.value || '';
      const dateFrom = $('analysisDateFrom')?.value || '';
      const dateTo = $('analysisDateTo')?.value || '';
      const rows = (data.items || []).filter(item => {
        const hay = `${item.client_name || ''} ${item.summary || ''} ${item.prospect_source || ''}`.toLowerCase();
        const itemDate = String(item.meeting_date || item.created_at || '').slice(0, 10);
        return (!search || hay.includes(search))
          && (!rep || item.sales_rep === rep)
          && (!dateFrom || itemDate >= dateFrom)
          && (!dateTo || itemDate <= dateTo);
      });
      target.innerHTML = rows.length ? dashboardTable([
        platformLang() === 'fr' ? 'Client' : 'Client',
        'Score',
        platformLang() === 'fr' ? 'Rep' : 'Rep',
        platformLang() === 'fr' ? 'Date' : 'Date',
        platformLang() === 'fr' ? 'Résumé' : 'Summary',
        ''
      ], rows.map(item => [
        `<button class="analysis-client-link" data-analysis-detail="${item.id}" type="button">${escapeHTML(item.client_name || '-')}</button><small>${escapeHTML(item.prospect_source || '')}</small>`,
        `<span class="score-pill ${scoreClass(item.score)}">${escapeHTML(item.score ?? '-')}/100</span>`,
        escapeHTML(displayRep(item.sales_rep)),
        escapeHTML(item.meeting_date || item.created_at || ''),
        escapeHTML(item.summary || ''),
        `<button class="chip danger" data-delete-analysis="${item.id}" type="button" style="padding: 4px 8px; font-weight: 800;">X</button>`,
      ])) : `<div class="empty-dashboard">${t('noAnalyses')}</div>`;
      qsa('[data-analysis-detail]', target).forEach(btn => btn.addEventListener('click', () => openAnalysisDetail(btn.dataset.analysisDetail)));
      qsa('[data-delete-analysis]', target).forEach(btn => btn.addEventListener('click', () => deleteAnalysis(btn.dataset.deleteAnalysis)));
      refreshHomeStats();
    } catch (error) {
      target.innerHTML = `<div class="empty-dashboard">${escapeHTML(error.message)}</div>`;
    }
  }

  async function refreshAnalysisInsights(targetId = 'analysisDashboardInsights') {
    const target = $(targetId);
    if (!target || !window.ezAuth?.user) return;
    try {
      const [memory, stats] = await Promise.all([
        api('/meetings/memory').catch(() => ({})),
        api('/meetings/stats').catch(() => ({})),
      ]);
      target.innerHTML = `
        <section class="insight-card">
          <h3>${platformLang() === 'fr' ? 'Scores' : 'Scores'}</h3>
          ${scoreMiniChart(stats)}
        </section>
        ${insightList(platformLang() === 'fr' ? 'Interets recurrents' : 'Recurring interests', memory.frequent_interests)}
        ${insightList(platformLang() === 'fr' ? 'Objections recurrentes' : 'Recurring objections', memory.frequent_objections)}
        ${insightList(platformLang() === 'fr' ? 'Sources / concurrents' : 'Sources / competitors', memory.frequent_sources)}
      `;
    } catch (error) {
      target.innerHTML = `<section class="insight-card">${escapeHTML(error.message)}</section>`;
    }
  }

  function insightList(title, values = []) {
    const items = (values || []).slice(0, 5);
    return `
      <section class="insight-card">
        <h3>${escapeHTML(title)}</h3>
        ${items.length ? `<ul>${items.map(([text, count]) => `<li>${escapeHTML(text)} <b>${escapeHTML(count)}x</b></li>`).join('')}</ul>` : `<p class="muted">${platformLang() === 'fr' ? 'Aucun signal encore.' : 'No signal yet.'}</p>`}
      </section>
    `;
  }

  function scoreMiniChart(stats = {}) {
    const series = [
      ...((stats.current_month_points?.Meher || []).map(p => ({ ...p, rep: 'Meher' }))),
      ...((stats.current_month_points?.['Marie-Eve'] || []).map(p => ({ ...p, rep: 'Marie' }))),
    ].slice(-12);
    if (!series.length) return `<p class="muted">${platformLang() === 'fr' ? 'Aucun score ce mois-ci.' : 'No score this month.'}</p>`;
    const width = 260;
    const height = 110;
    const step = series.length > 1 ? width / (series.length - 1) : width;
    const points = series.map((p, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - (Number(p.score || 0) / 100) * height);
      return `${x},${y}`;
    }).join(' ');
    return `
      <svg class="mini-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Score trend">
        <polyline points="${points}" fill="none" stroke="#e63946" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${series.map((p, index) => {
          const x = Math.round(index * step);
          const y = Math.round(height - (Number(p.score || 0) / 100) * height);
          return `<circle cx="${x}" cy="${y}" r="4" class="${scoreClass(p.score)}"><title>${escapeHTML(p.rep)} ${escapeHTML(p.score)}/100</title></circle>`;
        }).join('')}
      </svg>
    `;
  }

  async function openAnalysisDetail(id) {
    showView('analysis-new');
    if (window.ezMeetingAi && typeof window.ezMeetingAi.loadAnalysis === 'function') {
      window.ezMeetingAi.loadAnalysis(id);
    }
    // Log click activity
    try {
      const data = await api(`/meetings/analyses/${id}`);
      api('/api/logs/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'click',
          description: `Consulte l'analyse du client '${data.client_name || '-'}'`
        })
      }).catch(() => {});
    } catch (_) {}
  }

  function renderFullAnalysisDetail(data, analysis = {}) {
    const note = analysis.meeting_note || {};
    const score = analysis.score || { total: data.score || 0, breakdown: [] };
    const total = Number(score.total ?? data.score ?? 0);
    return `
      <div class="meeting-note-header ${scoreClass(total)}">
        <div>
          <span>${platformLang() === 'fr' ? 'Note de rencontre' : 'Meeting note'}</span>
          <h4>${escapeHTML(note.client || data.client_name || '-')}</h4>
          <small>${escapeHTML(data.meeting_date || data.created_at || '')} | ${escapeHTML(displayRep(data.sales_rep))} | ${escapeHTML(displayUserEmail(data.created_by_email))}</small>
        </div>
        <div class="meeting-note-actions">
          <strong class="${scoreClass(total)}">${total}/100</strong>
        </div>
      </div>

      <section class="meeting-result-section">
        <h5>${platformLang() === 'fr' ? 'Resume copiable' : 'Copyable summary'}</h5>
        <pre>${escapeHTML(analysis.resume_copiable || analysis.resume_executif || data.summary || '')}</pre>
      </section>

      <section class="meeting-result-section">
        <h5>${platformLang() === 'fr' ? 'Resume executif' : 'Executive summary'}</h5>
        <p>${escapeHTML(analysis.resume_executif || 'Non confirme')}</p>
      </section>

      <section class="meeting-result-section meeting-improvements">
        <h5>${platformLang() === 'fr' ? 'Ameliorations' : 'Improvements'}</h5>
        ${detailListItems(analysis.ameliorations_salesman?.length ? analysis.ameliorations_salesman : analysis.recommandations_coaching, 'Aucune amelioration precise.')}
      </section>

      <section class="meeting-result-section">
        <h5>${platformLang() === 'fr' ? 'Score de rencontre' : 'Meeting score'}</h5>
        ${renderDetailScore(score, analysis.estimated_annual_value, analysis)}
      </section>

      <div class="meeting-result-grid">
        <section class="meeting-result-section"><h5>Contexte</h5>${detailListItems(note.contexte)}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Utilisation prevue' : 'Planned usage'}</h5>${detailListItems(note.utilisation_prevue)}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Processus actuel' : 'Current process'}</h5>${detailListItems(note.processus_actuel)}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Options envisagees' : 'Options considered'}</h5>${detailListItems(note.options_envisagees)}</section>
      </div>

      <section class="meeting-result-section">
        <h5>${platformLang() === 'fr' ? 'Prochaines etapes' : 'Next steps'}</h5>
        ${detailListItems(note.prochaines_etapes)}
      </section>

      <div class="meeting-result-grid">
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Objections principales' : 'Main objections'}</h5>${detailObjectList(analysis.objections_principales, 'objection')}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Points interessants pour le client' : 'Client interests'}</h5>${detailObjectList(analysis.points_interet_client, 'point')}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Recommandations' : 'Recommendations'}</h5>${detailListItems(analysis.recommandations_coaching)}</section>
        <section class="meeting-result-section"><h5>${platformLang() === 'fr' ? 'Risques' : 'Risks'}</h5>${detailListItems(analysis.risques_red_flags)}</section>
      </div>

      <section class="meeting-result-section">
        <h5>${platformLang() === 'fr' ? 'Registre pour les prochaines rencontres' : 'Registry for next meetings'}</h5>
        ${renderDetailRegistry(analysis.registre || {}, analysis.memoire_a_reutiliser || [])}
      </section>

      <section class="meeting-result-section">
        <h5>Transcript</h5>
        <pre>${escapeHTML(data.transcript || '')}</pre>
      </section>
    `;
  }

  function renderDetailScore(score, annualValue, analysis = {}) {
    const total = Number(score?.total || 0);
    const breakdown = asArray(score?.breakdown);
    const valueDisplay = annualValue?.available ? annualValue.display : '---$';
    const valueDetail = annualValue?.available
      ? `${annualValue.account_type || ''}${annualValue.users_count ? ` | ${annualValue.users_count} utilisateurs` : ''}`
      : 'Donnees insuffisantes';

    const dealHotness = analysis.deal_hotness || { score: 0, evidence: '' };
    const dhScore = Number(dealHotness.score || 0);
    const dhEvidence = dealHotness.evidence || '';
    const dhColor = dhScore >= 8 ? '#22c55e' : (dhScore >= 5 ? '#d97706' : '#ef4444');

    const closeWon = analysis.close_won_probability || { percentage: 68, evidence: '' };
    const cwPct = Number(closeWon.percentage || 68);
    const cwEvidence = closeWon.evidence || '';
    const cwColor = cwPct >= 75 ? '#22c55e' : (cwPct >= 50 ? '#d97706' : '#ef4444');

    return `
      <div class="meeting-score-wrap ${scoreClass(total)}">
        <div class="meeting-score-left-panel" style="display: flex; flex-direction: column; gap: 14px; grid-column: 1 / span 2;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div class="meeting-score-badge ${scoreClass(total)}"><strong>${total}</strong><span>/100</span></div>
            <div class="meeting-annual-value ${annualValue?.available ? scoreClass(total) : 'score-neutral'}" style="flex: 1; min-height: 112px;">
              <span>Valeur annualisee</span>
              <strong>${escapeHTML(valueDisplay)}</strong>
              <small>${escapeHTML(valueDetail)}</small>
            </div>
          </div>
          
          <div class="meeting-score-row" style="margin-top: 6px; padding: 10px; border: 1px solid var(--brand-border); border-radius: 10px; background: var(--output-bg);">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
              <span>Deal Hotness (Pret a s'engager)</span>
              <b style="color: var(--brand-primary);">${dhScore}/10</b>
            </div>
            <div style="height: 6px; background: var(--brand-soft); border-radius: 3px; margin: 6px 0; overflow: hidden; border: 1px solid var(--brand-border);">
              <div style="height: 100%; width: ${dhScore * 10}%; background: ${dhColor}; border-radius: 3px;"></div>
            </div>
            ${dhEvidence ? `<small style="display: block; color: var(--ink-muted); font-size: 11px; margin-top: 4px; line-height: 1.3;">${escapeHTML(dhEvidence)}</small>` : ''}
          </div>

          <div class="meeting-score-row" style="padding: 10px; border: 1px solid var(--brand-border); border-radius: 10px; background: var(--output-bg);">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
              <span>Probabilite de Close Won (Win Rate)</span>
              <b style="color: var(--brand-primary);">${cwPct}%</b>
            </div>
            <div style="height: 6px; background: var(--brand-soft); border-radius: 3px; margin: 6px 0; overflow: hidden; border: 1px solid var(--brand-border);">
              <div style="height: 100%; width: ${cwPct}%; background: ${cwColor}; border-radius: 3px;"></div>
            </div>
            ${cwEvidence ? `<small style="display: block; color: var(--ink-muted); font-size: 11px; margin-top: 4px; line-height: 1.3;">${escapeHTML(cwEvidence)}</small>` : ''}
          </div>
        </div>

        <div class="meeting-score-copy">
          <h5>${escapeHTML(score?.label || '')}</h5>
          <div class="meeting-score-bars">
            ${breakdown.map(row => {
              const value = Number(row.score || 0);
              const max = Number(row.max || 1);
              const width = Math.max(0, Math.min(100, (value / max) * 100));
              return `
                <div class="meeting-score-row ${scoreClass(width)}">
                  <span>${escapeHTML(row.criterion || 'Critere')}</span>
                  <b>${value}/${max}</b>
                  <i><em style="width:${width}%"></em></i>
                  ${row.evidence ? `<small>${escapeHTML(row.evidence)}</small>` : ''}
                  ${row.recommendation ? `<small class="meeting-reco">${escapeHTML(row.recommendation)}</small>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function detailListItems(values = [], empty = 'Non confirme') {
    const items = asArray(values).map(itemText).filter(Boolean);
    return items.length ? `<ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : `<p class="muted">${escapeHTML(empty)}</p>`;
  }

  function detailObjectList(values = [], mainKey) {
    const items = asArray(values).filter(Boolean);
    if (!items.length) return '<p class="muted">Non confirme</p>';
    return `<ul>${items.map(item => {
      if (typeof item !== 'object') return `<li>${escapeHTML(itemText(item))}</li>`;
      const title = item[mainKey] || itemText(item);
      const details = Object.entries(item)
        .filter(([key, value]) => key !== mainKey && value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      return `<li><b>${escapeHTML(title)}</b>${details ? `<small>${escapeHTML(details)}</small>` : ''}</li>`;
    }).join('')}</ul>`;
  }

  function renderDetailRegistry(registry, memory) {
    const keys = [
      ['client_profile', 'Profil client'],
      ['pain_points', 'Pain points'],
      ['decision_criteria', 'Criteres de decision'],
      ['stakeholders', 'Parties prenantes'],
      ['usage_and_volume', 'Utilisation / volumes'],
      ['prospect_source', 'Source prospect'],
      ['follow_up_promises', 'Promesses de suivi'],
    ];
    return `
      <div class="meeting-registry">
        ${keys.map(([key, label]) => `<div><b>${escapeHTML(label)}</b>${detailListItems(registry[key])}</div>`).join('')}
        <div><b>Memoire a reutiliser</b>${detailListItems(memory, 'Aucun element')}</div>
      </div>
    `;
  }

  function detailList(title, values = []) {
    const items = (values || []).map(itemText).filter(Boolean);
    return `
      <section class="detail-section">
        <h3>${escapeHTML(title)}</h3>
        ${items.length ? `<ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : `<p class="muted">-</p>`}
      </section>
    `;
  }

  function ensureAnalysisDetailModal() {
    if ($('analysisDetailModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="analysisDetailModal" class="modal analysis-detail-modal" aria-hidden="true">
        <div class="backdrop" data-analysis-detail-close></div>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="head">
            <h3>${platformLang() === 'fr' ? 'Detail de l analyse' : 'Analysis detail'}</h3>
            <button class="close-x" data-analysis-detail-close>&times;</button>
          </div>
          <div id="analysisDetailBody" class="body analysis-detail-body"></div>
        </div>
      </div>
    `);
    qsa('[data-analysis-detail-close]').forEach(el => el.addEventListener('click', closeAnalysisDetail));
  }

  function closeAnalysisDetail() {
    $('analysisDetailModal')?.classList.remove('open');
    $('analysisDetailModal')?.setAttribute('aria-hidden', 'true');
  }

  async function refreshTickets() {
    const target = $('supportTicketsList');
    if (!target || !window.ezAuth?.user) return;
    try {
      const data = await api('/support/tickets');
      const rows = data.items || [];
      target.innerHTML = rows.length ? rows.map(ticket => `
        <article class="ticket-item" style="border: 1px solid var(--brand-border); border-radius: 10px; padding: 14px; margin-bottom: 12px; background: var(--card-bg); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
              <b style="font-size: 16px; color: var(--brand-primary);">${escapeHTML(ticket.subject)}</b>
              <small style="display: block; color: var(--ink-muted); margin-top: 2px;">
                ${escapeHTML(ticket.email || '')} | ${escapeHTML(ticket.category || '')} | <span style="font-weight:700;">${escapeHTML(ticket.status || '')}</span> | ${escapeHTML(ticket.created_at || '')}
              </small>
            </div>
            <div style="display: flex; gap: 6px;">
              ${ticket.has_screenshot ? `<button class="chip btn-ghost" onclick="const s = document.getElementById('screenshot-${ticket.id}'); s.style.display = s.style.display === 'none' ? 'block' : 'none';" type="button">Screenshot</button>` : ''}
              <button class="chip btn-ghost" data-toggle-replies="${ticket.id}" type="button">Replies</button>
              ${window.ezAuth?.user?.is_admin ? `<button class="chip danger" data-delete-ticket="${ticket.id}" type="button">Delete</button>` : ''}
            </div>
          </div>
          <p style="margin: 6px 0; white-space: pre-wrap;">${escapeHTML(ticket.message)}</p>
          ${ticket.has_screenshot ? `
            <div id="screenshot-${ticket.id}" style="display: none; margin-top: 10px;">
              <img src="${API_BASE}/support/tickets/${ticket.id}/screenshot" style="max-width: 100%; max-height: 350px; border: 1px solid var(--brand-border); border-radius: 8px;" />
            </div>
          ` : ''}
          <div id="replies-block-${ticket.id}" style="display: none; border-top: 1px solid var(--brand-border); margin-top: 10px; padding-top: 10px;">
            <div id="replies-list-${ticket.id}" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; padding: 4px;">
              <!-- Loaded dynamically -->
            </div>
            <form id="reply-form-${ticket.id}" style="display: flex; gap: 8px;">
              <input type="text" id="reply-input-${ticket.id}" placeholder="${platformLang() === 'fr' ? 'Votre réponse...' : 'Your reply...'}" required style="flex: 1; border: 1px solid var(--brand-border); border-radius: 6px; padding: 6px 10px; font-size: 14px; background: var(--brand-bg); color: var(--ink);" />
              <button class="btn" type="submit" style="padding: 6px 12px; font-size: 14px; border-radius: 6px;">Send</button>
            </form>
          </div>
        </article>
      `).join('') : '<div class="empty-dashboard">No tickets.</div>';
      qsa('[data-delete-ticket]', target).forEach(btn => btn.addEventListener('click', () => deleteTicket(btn.dataset.deleteTicket)));
      qsa('[data-toggle-replies]', target).forEach(btn => btn.addEventListener('click', () => toggleReplies(btn.dataset.toggleReplies)));
      rows.forEach(ticket => {
        const form = $('reply-form-' + ticket.id);
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReply(ticket.id);
          });
        }
      });
    } catch (error) {
      target.innerHTML = `<div class="empty-dashboard">${escapeHTML(error.message)}</div>`;
    }
  }

  async function toggleReplies(ticketId) {
    const block = $('replies-block-' + ticketId);
    if (!block) return;
    const isHidden = block.style.display === 'none' || block.style.display === '';
    if (isHidden) {
      block.style.display = 'block';
      await loadReplies(ticketId);
    } else {
      block.style.display = 'none';
    }
  }

  async function loadReplies(ticketId) {
    const list = $('replies-list-' + ticketId);
    if (!list) return;
    list.innerHTML = '<div style="color:var(--ink-muted);font-size:12px;">Loading replies...</div>';
    try {
      const data = await api(`/support/tickets/${ticketId}/replies`);
      const items = data.items || [];
      list.innerHTML = items.length ? items.map(reply => `
        <div style="background:var(--brand-soft); border:1px solid var(--brand-border); border-radius:8px; padding:8px 10px; align-self:${reply.created_by_user_id === window.ezAuth?.user?.id ? 'flex-end' : 'flex-start'}; max-width:85%;">
          <div style="font-size:11px; font-weight:700; color:var(--brand-primary); display:flex; justify-content:space-between; gap:10px; margin-bottom:2px;">
            <span>${escapeHTML(reply.email)}</span>
            <span style="font-weight:400; color:var(--ink-muted);">${escapeHTML(reply.created_at)}</span>
          </div>
          <div style="font-size:13px; white-space:pre-wrap;">${escapeHTML(reply.message)}</div>
        </div>
      `).join('') : `<div style="color:var(--ink-muted);font-size:12px;text-align:center;padding:10px;">${platformLang() === 'fr' ? 'Aucune réponse pour le moment.' : 'No replies yet.'}</div>`;
      list.scrollTop = list.scrollHeight;
    } catch (error) {
      list.innerHTML = `<div style="color:var(--brand-primary);font-size:12px;">${escapeHTML(error.message)}</div>`;
    }
  }

  async function submitReply(ticketId) {
    const input = $('reply-input-' + ticketId);
    if (!input || !input.value.trim()) return;
    const message = input.value.trim();
    input.value = '';
    try {
      await api(`/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      await loadReplies(ticketId);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function deleteTicket(id) {
    if (!confirm(platformLang() === 'fr' ? 'Supprimer ce ticket ?' : 'Delete this support ticket?')) return;
    try {
      await api(`/support/tickets/${id}`, { method: 'DELETE' });
      refreshTickets();
    } catch (error) {
      window.alert(error.message);
    }
  }

  function openSupportModal() {
    ensureSupportModal();
    $('supportModal').classList.add('open');
    $('supportModal').setAttribute('aria-hidden', 'false');
  }

  function ensureSupportModal() {
    if ($('supportModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="supportModal" class="modal support-modal" aria-hidden="true">
        <div class="backdrop" data-support-close></div>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="head">
            <h3>${t('supportTitle')}</h3>
            <button class="close-x" data-support-close>&times;</button>
          </div>
          <div class="body">
            <form id="supportForm" class="support-form">
              <label>${t('supportCategory')}<select id="supportCategory"><option value="bug">${t('bug')}</option><option value="feature">${t('feature')}</option><option value="question">${t('question')}</option></select></label>
              <label>${t('supportSubject')}<input id="supportSubject" required /></label>
              <label>${t('supportMessage')}<textarea id="supportMessage" rows="8" required></textarea></label>
              <label>${t('supportScreenshot')}<input id="supportScreenshot" type="file" accept="image/png,image/jpeg,image/webp" /></label>
              <button class="primary-action" type="submit">${t('supportSubmit')}</button>
              <p id="supportMessageStatus" class="muted"></p>
            </form>
          </div>
        </div>
      </div>
    `);
    qsa('[data-support-close]').forEach(el => el.addEventListener('click', closeSupportModal));
    $('supportForm').addEventListener('submit', submitSupportTicket);
  }

  function closeSupportModal() {
    $('supportModal')?.classList.remove('open');
    $('supportModal')?.setAttribute('aria-hidden', 'true');
  }

  async function submitSupportTicket(event) {
    event.preventDefault();
    const file = $('supportScreenshot')?.files?.[0];
    const screenshotData = file ? await readFileDataUrl(file) : '';
    const payload = {
      category: $('supportCategory').value,
      subject: $('supportSubject').value,
      message: $('supportMessage').value,
      screenshotName: file?.name || '',
      screenshotData,
    };
    const res = await api('/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    $('supportMessageStatus').textContent = res.ok ? 'Ticket sent.' : '';
    event.target.reset();
    closeSupportModal();
    refreshTickets();
  }

  async function downloadProposal(id) {
    const res = await window.ezAuth.fetch(`/proposals/${id}/download`);
    if (!res.ok) throw new Error('Download failed');
    // Log download activity
    api('/api/logs/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: 'download',
        description: `Téléchargé l'offre de simulation (ID: ${id})`
      })
    }).catch(() => {});
    const blob = await res.blob();
    const dispo = res.headers.get('content-disposition') || '';
    const filename = parseFilename(dispo) || 'proposal.zip';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteProposal(id) {
    if (!confirm('Delete this proposal from the dashboard?')) return;
    await api(`/proposals/${id}`, { method: 'DELETE' });
    refreshProposals();
  }

  async function deleteAnalysis(id) {
    if (!confirm(platformLang() === 'fr' ? 'Supprimer cette analyse de réunion ?' : 'Delete this meeting analysis?')) return;
    await api(`/meetings/analyses/${id}`, { method: 'DELETE' });
    refreshAnalysis();
    refreshAnalysisInsights('analysisDashboardInsights');
    refreshAnalysisInsights('analysisWorkspaceInsights');
  }

  async function api(path, options = {}) {
    if (window.ezAuth?.ready) await window.ezAuth.ready;
    const res = await window.ezAuth.fetch(path, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
    return data;
  }

  function dashboardTable(headers, rows) {
    return `
      <table>
        <thead><tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
  }

  function setLogo() {
    const logo = $('platformLogo');
    if (!logo) return;
    const active = window.ezAuth?.user?.activeBrand || 'ezsign';
    logo.src = `${API_BASE}/logo-${active}-topbar.png`;
    logo.alt = active === 'ezmax' ? 'eZmax' : 'eZsign';
    
    const canSwitch = window.ezAuth?.user?.brand === 'both' || window.ezAuth?.user?.is_admin;
    if (canSwitch) {
      logo.style.cursor = 'pointer';
      logo.title = active === 'ezsign' ? 'Switch to eZmax' : 'Switch to eZsign';
    } else {
      logo.style.cursor = 'default';
      logo.title = active === 'ezmax' ? 'eZmax' : 'eZsign';
    }
  }

  async function toggleBrand() {
    const user = window.ezAuth?.user;
    if (!user) return;
    if (user.brand !== 'both' && !user.is_admin) return;
    
    const current = user.activeBrand || 'ezsign';
    const target = current === 'ezsign' ? 'ezmax' : 'ezsign';
    
    try {
      const res = await window.ezAuth.fetch('/api/auth/switch-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: target })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('Failed to switch brand:', data.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function formatFormats(formats = {}) {
    const out = [];
    if (formats.word) out.push('Word');
    if (formats.pdf) out.push('PDF');
    return out.join(' + ') || '-';
  }

  function formatDateTime(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(platformLang() === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    } catch (_) {
      return value;
    }
  }

  function displayRep(rep) {
    return rep === 'Marie-Eve' ? 'Marie' : (rep || '-');
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
      ? cleaned.split(/\s+/).map(part => capitalize(part)).join(' ')
      : (platformLang() === 'fr' ? 'Non assigne' : 'Unassigned');
  }

  function displayUserEmail(email) {
    return email || (platformLang() === 'fr' ? 'Non assigne' : 'Unassigned');
  }

  function itemText(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item;
    if (typeof item !== 'object') return String(item);
    return item.point
      || item.objection
      || item.interet
      || item.interest
      || item.recommandation
      || item.recommendation
      || item.action
      || item.step
      || item.titre
      || item.title
      || Object.values(item).find(value => typeof value === 'string')
      || '';
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    return value == null || value === '' ? [] : [value];
  }

  function scoreClass(score) {
    const n = Number(score || 0);
    if (n >= 80) return 'score-good';
    if (n >= 60) return 'score-warn';
    return 'score-risk';
  }

  function parseFilename(dispo) {
    const match = /filename="?([^"]+)"?/i.exec(dispo || '');
    return match ? match[1].trim() : '';
  }

  function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function capitalize(value) {
    return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
  }

  async function refreshSecurityAlerts() {
    const target = $('securityAlertsList');
    if (!target || !window.ezAuth?.user?.is_admin) return;
    try {
      const data = await api('/api/admin/security-alerts');
      const rows = data.items || [];
      target.innerHTML = rows.length ? rows.map(alert => {
        let severityColor = '#e63946'; // High
        if (alert.severity === 'medium') severityColor = '#d97706'; // Medium
        else if (alert.severity === 'low') severityColor = '#2563eb'; // Low

        return `
          <article class="ticket-item" style="border: 1px solid ${severityColor}; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: var(--card-bg); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <b style="font-size: 15px; color: ${severityColor}; text-transform: uppercase;">[${alert.severity}] ${escapeHTML(alert.alert_type)}</b>
                <small style="display: block; color: var(--ink-muted); margin-top: 2px;">
                  ${escapeHTML(alert.created_at.replace('T', ' '))} | ${escapeHTML(alert.email || 'Système')}
                </small>
              </div>
              <button class="chip" data-resolve-alert="${alert.id}" type="button" style="background: var(--ok); color: #fff; border: 0; padding: 4px 10px;">Résoudre</button>
            </div>
            <p style="margin: 4px 0; font-size: 13px; color: var(--ink);">${escapeHTML(alert.message)}</p>
          </article>
        `;
      }).join('') : `<div class="empty-dashboard" style="color: var(--ok); font-weight: bold; padding: 10px 0;">✅ Aucun incident de sécurité non résolu.</div>`;

      qsa('[data-resolve-alert]', target).forEach(btn => btn.addEventListener('click', () => resolveAlert(btn.dataset.resolveAlert)));
    } catch (error) {
      target.innerHTML = `<div class="empty-dashboard">${escapeHTML(error.message)}</div>`;
    }
  }

  async function resolveAlert(id) {
    try {
      await api(`/api/admin/security-alerts/${id}/resolve`, { method: 'POST' });
      refreshSecurityAlerts();
    } catch (error) {
      window.alert(error.message);
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
})();
