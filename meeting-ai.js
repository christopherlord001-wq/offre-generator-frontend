(() => {
  if (window.__EZSIGN_MEETING_AI_INIT__) return;
  window.__EZSIGN_MEETING_AI_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const CONFIG_API_BASE = String(window.EZSIGN_CONFIG?.apiBaseUrl || '').trim().replace(/\/+$/, '');
    const IS_FILE = window.location.protocol === 'file:';
    const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
    const API_BASE = IS_FILE ? 'http://127.0.0.1:5055' : (IS_GITHUB_PAGES ? CONFIG_API_BASE : '');
    const API_CREDENTIALS = API_BASE ? 'include' : 'same-origin';
    const $ = id => document.getElementById(id);
    const T = {
      fr: {
        meeting_note: "Note de rencontre",
        source: "Source",
        copy_summary: "Copier le résumé",
        summary_copied: "Résumé copié",
        view_transcript: "Voir transcript",
        exec_summary: "Résumé exécutif",
        improvements: "Améliorations",
        meeting_score: "Score de rencontre",
        context: "Contexte",
        intended_use: "Utilisation prévue",
        current_process: "Processus actuel",
        options_considered: "Options envisagées",
        next_steps: "Prochaines étapes",
        key_objections: "Objections principales",
        client_interests: "Points intéressants pour le client",
        recommendations: "Recommandations",
        risks: "Risques",
        next_meetings_registry: "Registre pour les prochaines rencontres",
        memory_to_reuse: "Mémoire à réutiliser",
        annualized_value: "Valeur annualisée",
        insufficient_data: "Données insuffisantes",
        deal_hotness: "Deal Hotness (Prêt à s'engager)",
        win_rate: "Probabilité de Close Won (Win Rate)",
        no_improvements: "Aucune amélioration précise pour l’instant.",
        unconfirmed: "Non confirmé",
        no_items: "Aucun élément",
        client_profile: "Profil client",
        pain_points: "Pain points",
        decision_criteria: "Critères de décision",
        stakeholders: "Parties prenantes",
        usage_and_volume: "Utilisation / volumes",
        prospect_source: "Source prospect",
        follow_up_promises: "Promesses de suivi",
        meetings_in_memory: "rencontre(s) en mémoire",
        average_score: "score moyen",
        frequent_objections: "Objections fréquentes",
        frequent_interests: "Intérêts fréquents",
        frequent_sources: "Sources prospect fréquentes",
        coaching_for: "Coaching",
        not_enough_meetings: "Pas encore assez de rencontres pour ce représentant.",
        none_yet: "Aucune encore.",
        none_yet_m: "Aucun encore.",
        no_sources_yet: "Aucune source encore.",
        reset_memory: "Réinitialiser mémoire",
        avg_prev_month: "Moy. mois précédent",
        average_prev_month: "Moyenne mois précédent",
        no_scores_chart: "Aucun score à afficher pour cette vue.",
        no_meetings_analyzed: "Aucune rencontre analysée encore.",
        paste_transcript_prompt: "Colle un transcript et lance l’analyse.",
        local_analysis_running: "Analyse locale en cours avec Ollama. Ça peut prendre quelques secondes.",
        paste_more_complete: "Colle un transcript plus complet avant de lancer l’analyse.",
        current_month: "Mois courant",
        all: "All",
        unconfirmed_reason: "Type de compte ou nombre d'utilisateurs non confirmé.",
        excellent: "Excellent",
        very_good: "Très bon",
        to_strengthen: "À renforcer",
        at_risk: "À risque",
        criteria_discovery: "Découverte des besoins",
        criteria_qualification: "Qualification de l'utilisation et des volumes",
        criteria_value: "Clarté de la proposition de valeur",
        criteria_objections: "Gestion des objections",
        criteria_engagement: "Engagement du prospect",
        criteria_next_step: "Prochaine étape claire",
        transcript_title: "Transcript",
        speaker: "Intervenant",
        no_transcript_available: "Aucun transcript disponible.",
        analyze_btn: "Analyser la rencontre",
        analyzing_btn: "Analyse en cours...",
        clear_btn: "Effacer",
        meeting_label: "Rencontre",
        coaching_section: "Coaching",
        representative: "Représentant",
        reset_code_prompt: "Code requis pour réinitialiser la mémoire",
        memory_reset_done: "Mémoire réinitialisée. Colle un transcript et lance l’analyse.",
        client: "Client",
        reference: "Référence",
        date: "Date"
      },
      en: {
        meeting_note: "Meeting Note",
        source: "Source",
        copy_summary: "Copy Summary",
        summary_copied: "Summary Copied",
        view_transcript: "View Transcript",
        exec_summary: "Executive Summary",
        improvements: "Improvements",
        meeting_score: "Meeting Score",
        context: "Context",
        intended_use: "Intended Use",
        current_process: "Current Process",
        options_considered: "Options Considered",
        next_steps: "Next Steps",
        key_objections: "Key Objections",
        client_interests: "Client Interests",
        recommendations: "Recommendations",
        risks: "Risks",
        next_meetings_registry: "Registry for Next Meetings",
        memory_to_reuse: "Memory to Reuse",
        annualized_value: "Annualized Value",
        insufficient_data: "Insufficient Data",
        deal_hotness: "Deal Hotness (Ready to commit)",
        win_rate: "Probability of Close Won (Win Rate)",
        no_improvements: "No specific improvements for now.",
        unconfirmed: "Unconfirmed",
        no_items: "No items",
        client_profile: "Client Profile",
        pain_points: "Pain Points",
        decision_criteria: "Decision Criteria",
        stakeholders: "Stakeholders",
        usage_and_volume: "Usage & Volumes",
        prospect_source: "Prospect Source",
        follow_up_promises: "Follow-up Promises",
        meetings_in_memory: "meeting(s) in memory",
        average_score: "average score",
        frequent_objections: "Frequent Objections",
        frequent_interests: "Frequent Interests",
        frequent_sources: "Frequent Prospect Sources",
        coaching_for: "Coaching",
        not_enough_meetings: "Not enough meetings for this representative yet.",
        none_yet: "None yet.",
        none_yet_m: "None yet.",
        no_sources_yet: "No sources yet.",
        reset_memory: "Reset Memory",
        avg_prev_month: "Avg. previous month",
        average_prev_month: "Average previous month",
        no_scores_chart: "No scores to display for this view.",
        no_meetings_analyzed: "No meetings analyzed yet.",
        paste_transcript_prompt: "Paste a transcript and start the analysis.",
        local_analysis_running: "Local analysis in progress with Ollama. This may take a few seconds.",
        paste_more_complete: "Paste a more complete transcript before starting the analysis.",
        current_month: "Current Month",
        all: "All",
        unconfirmed_reason: "Account type or users count unconfirmed.",
        excellent: "Excellent",
        very_good: "Very good",
        to_strengthen: "To strengthen",
        at_risk: "At risk",
        criteria_discovery: "Needs Discovery",
        criteria_qualification: "Qualification of usage and volumes",
        criteria_value: "Value proposition clarity",
        criteria_objections: "Objection handling",
        criteria_engagement: "Prospect engagement",
        criteria_next_step: "Clear next step",
        transcript_title: "Transcript",
        speaker: "Speaker",
        no_transcript_available: "No transcript available.",
        analyze_btn: "Analyze meeting",
        analyzing_btn: "Analyzing...",
        clear_btn: "Clear",
        meeting_label: "Meeting",
        coaching_section: "Coaching",
        representative: "Representative",
        reset_code_prompt: "Code required to reset memory",
        memory_reset_done: "Memory reset. Paste a transcript and start analysis.",
        client: "Client",
        reference: "Reference",
        date: "Date"
      }
    };
    function t(key) {
      const l = localStorage.getItem('ez_lang') || 'fr';
      return T[l]?.[key] || T.fr[key] || key;
    }
    const REPS = [
      { value: 'Marie-Eve', label: 'Marie' },
      { value: 'Meher', label: 'Meher' },
    ];

    const modal = $('meetingAiModal');
    const openBtn = $('meetingAiBtn');
    if (!modal || !openBtn) return;

    patchFormControls();

    const analyzeBtn = $('meetingAnalyzeBtn');
    const clearBtn = $('meetingClearBtn');
    const refreshBtn = $('meetingRefreshBtn');
    const statusEl = $('meetingAiStatus');
    const resultEl = $('meetingAiResult');
    const metaEl = $('meetingAiMeta');
    const memoryEl = $('meetingAiMemory');
    const historyEl = $('meetingAiHistory');

    const fields = {
      clientName: $('meetingClientName'),
      meetingDate: $('meetingDate'),
      reference: $('meetingReference'),
      prospectSource: $('meetingProspectSource'),
      salesRep: $('meetingSalesRep'),
      meetingType: $('meetingType'),
      transcript: $('meetingTranscript'),
    };

    let latestStats = null;
    let latestMemory = null;
    let latestHistory = [];
    let lastAnalysis = null;
    let lastMeta = null;
    let lastCopySummary = '';

    fields.meetingDate.value = fields.meetingDate.value || new Date().toISOString().slice(0, 10);
    // Initial value configuration and change listener will be handled in patchFormControls()
    if (fields.meetingType && !fields.meetingType.value) fields.meetingType.value = 'Démo/discovery';

    async function patchFormControls() {
      const referenceInput = $('meetingReference');
      const referenceField = referenceInput?.closest('.field');
      if (referenceField && !$('meetingProspectSource')) {
        const lang = localStorage.getItem('ez_lang') || 'fr';
        const labelText = lang === 'fr' ? 'Source prospect' : 'Prospect source';
        const placeHolder = lang === 'fr' ? 'Ex. DocuSign, Hopem, référence, web' : 'Ex. DocuSign, Hopem, referral, web';
        referenceField.insertAdjacentHTML('afterend', `
          <div class="field">
            <label for="meetingProspectSource">${labelText}</label>
            <input id="meetingProspectSource" type="text" placeholder="${placeHolder}" autocomplete="off" />
          </div>
        `);
      }

      const repControl = $('meetingSalesRep');
      if (repControl) {
        let items = [];
        try {
          const res = await api('/api/public/reps');
          if (res && res.items && res.items.length) {
            items = res.items;
          }
        } catch (e) {
          console.error('Failed to load reps from backend, using defaults:', e);
        }

        if (!items.length) {
          items = ['Marie-Eve', 'Meher'];
        }

        const select = document.createElement('select');
        select.id = repControl.id;
        select.name = repControl.name || repControl.id;
        select.className = repControl.className || '';
        select.innerHTML = items
          .map(email => `<option value="${email}">${displayRep(email)}</option>`)
          .join('');

        const loggedInUserEmail = window.ezAuth?.user?.email;
        let defaultRep = loggedInUserEmail;
        if (!defaultRep) {
          defaultRep = localStorage.getItem('ez_meeting_sales_rep');
        }
        if (!defaultRep && items.length) {
          defaultRep = items[0];
        }
        
        select.value = normalizeSalesRep(defaultRep);
        if (repControl.tagName.toLowerCase() !== 'select') {
          repControl.replaceWith(select);
        } else {
          repControl.innerHTML = select.innerHTML;
          repControl.value = select.value;
        }
        
        fields.salesRep = $('meetingSalesRep');
        fields.salesRep.addEventListener('change', () => {
          localStorage.setItem('ez_meeting_sales_rep', fields.salesRep.value);
          renderMemory(latestMemory || {});
        });
      }

      const typeControl = $('meetingType');
      if (typeControl) {
        const first = typeControl.options[0];
        if (first) {
          first.value = 'Démo/discovery';
          first.textContent = 'Démo/discovery';
        }
        if (![...typeControl.options].some(option => option.value === 'Démo/discovery')) {
          typeControl.insertAdjacentHTML('afterbegin', '<option value="Démo/discovery">Démo/discovery</option>');
        }
        typeControl.value = typeControl.value || 'Démo/discovery';
      }
    }

    function normalizeSalesRep(value) {
      return String(value || '').trim();
    }

    function displayRep(value) {
      const text = String(value || '').trim();
      if (!text) return '';
      if (text.includes('@')) {
        const part = text.split('@')[0]; // e.g. "christopher.lord"
        return part.split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      const textLower = text.toLowerCase();
      if (textLower === 'meher') return 'Meher';
      if (textLower.includes('marie')) return 'Marie';
      return text;
    }

    function escapeHTML(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function asArray(value) {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }

    function itemText(item) {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      const preferred = [
        'objection',
        'point',
        'signal',
        'risque',
        'risk',
        'recommendation',
        'recommandation',
        'action',
        'step',
        'question',
        'importance',
        'niveau',
      ];
      for (const key of preferred) {
        if (item[key]) return item[key];
      }
      return Object.values(item).filter(Boolean).join(' - ');
    }

    function cleanItems(items) {
      return asArray(items).map(itemText).map(text => text.trim()).filter(Boolean);
    }

    function listHTML(items, empty = t('unconfirmed')) {
      const clean = cleanItems(items);
      if (!clean.length) return `<p class="muted">${escapeHTML(empty)}</p>`;
      return `<ul>${clean.map(text => `<li>${escapeHTML(text)}</li>`).join('')}</ul>`;
    }

    function detailListHTML(items, primaryKey, secondaryKeys = []) {
      const clean = asArray(items).filter(Boolean);
      if (!clean.length) return `<p class="muted">${escapeHTML(t('unconfirmed'))}</p>`;
      return `<div class="meeting-detail-list">${clean.map(item => {
        if (typeof item === 'string') return `<div class="meeting-detail-item">${escapeHTML(item)}</div>`;
        const primary = item[primaryKey] || itemText(item);
        const details = secondaryKeys
          .map(key => item[key] ? `<span>${escapeHTML(item[key])}</span>` : '')
          .filter(Boolean)
          .join('');
        return `<div class="meeting-detail-item"><b>${escapeHTML(primary)}</b>${details ? `<div>${details}</div>` : ''}</div>`;
      }).join('')}</div>`;
    }

    function scoreClass(value) {
      const score = Number(value || 0);
      if (score >= 75) return 'score-green';
      if (score >= 55) return 'score-yellow';
      return 'score-red';
    }

    function scoreLabel(total) {
      if (total >= 85) return t('excellent');
      if (total >= 75) return t('very_good');
      if (total >= 55) return t('to_strengthen');
      return t('at_risk');
    }

    async function api(path, options = {}) {
      if (window.ezAuth?.ready) await window.ezAuth.ready;
      const method = String(options.method || 'GET').toUpperCase();
      const headers = { ...(options.headers || {}) };
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && window.ezAuth?.csrfToken) {
        headers['X-CSRF-Token'] = window.ezAuth.csrfToken;
      }
      const res = await fetch(`${API_BASE}${path}`, {
        credentials: API_CREDENTIALS,
        ...options,
        headers,
      });
      if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Connexion requise.');
      }
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Réponse invalide du serveur.' };
      }
      if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);
      return data;
    }

    function openModal() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      loadAll();
      window.setTimeout(() => fields.clientName.focus(), 60);
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    function setBusy(isBusy) {
      analyzeBtn.disabled = isBusy;
      analyzeBtn.textContent = isBusy ? t('analyzing_btn') : t('analyze_btn');
    }

    function renderStatus(data) {
      const ollama = data.ollama || {};
      const count = data.memory?.count || 0;
      const avg = data.memory?.average_score;
      const lang = localStorage.getItem('ez_lang') || 'fr';
      if (ollama.ok && ollama.model_available) {
        statusEl.className = 'meeting-ai-status ok';
        const readyText = lang === 'fr' 
          ? `Ollama prêt: ${ollama.model} | mémoire: ${count} rencontre${count > 1 ? 's' : ''}${avg ? ` | score moyen ${avg}/100` : ''}`
          : `Ollama ready: ${ollama.model} | memory: ${count} meeting${count > 1 ? 's' : ''}${avg ? ` | average score ${avg}/100` : ''}`;
        statusEl.textContent = readyText;
        return;
      }
      if (ollama.ok) {
        statusEl.className = 'meeting-ai-status warn';
        statusEl.textContent = lang === 'fr'
          ? `Ollama répond, mais le modèle ${ollama.model} n'est pas disponible.`
          : `Ollama responds, but model ${ollama.model} is not available.`;
        return;
      }
      statusEl.className = 'meeting-ai-status warn';
      statusEl.textContent = lang === 'fr'
        ? `Ollama ne répond pas encore: ${ollama.error || 'service indisponible'}`
        : `Ollama not responding yet: ${ollama.error || 'service unavailable'}`;
    }

    function renderCountList(items, empty) {
      const rows = asArray(items).slice(0, 5);
      if (!rows.length) return `<p>${escapeHTML(empty)}</p>`;
      return `<ul>${rows.map(row => {
        const text = Array.isArray(row) ? row[0] : itemText(row);
        const count = Array.isArray(row) ? row[1] : '';
        return `<li>${escapeHTML(text)}${count ? ` <span>${escapeHTML(count)}x</span>` : ''}</li>`;
      }).join('')}</ul>`;
    }

    function renderMemory(memory) {
      latestMemory = memory || {};
      const count = latestMemory.count || 0;
      const avg = latestMemory.average_score;
      const selectedRep = normalizeSalesRep(fields.salesRep.value);
      const repMemory = latestMemory.by_rep?.[selectedRep];
      const lang = localStorage.getItem('ez_lang') || 'fr';
      
      const mText = lang === 'fr' 
        ? `<b>${count}</b> rencontre${count > 1 ? 's' : ''} en mémoire${avg ? `, score moyen <b>${avg}/100</b>` : ''}.`
        : `<b>${count}</b> meeting${count > 1 ? 's' : ''} in memory${avg ? `, average score <b>${avg}/100</b>` : ''}.`;

      memoryEl.innerHTML = `
        <div class="meeting-memory-summary">
          ${mText}
        </div>
        <div class="meeting-memory-group">
          <b>${escapeHTML(t('frequent_objections'))}</b>
          ${renderCountList(latestMemory.frequent_objections, t('none_yet'))}
        </div>
        <div class="meeting-memory-group">
          <b>${escapeHTML(t('frequent_interests'))}</b>
          ${renderCountList(latestMemory.frequent_interests, t('none_yet_m'))}
        </div>
        <div class="meeting-memory-group">
          <b>${escapeHTML(t('frequent_sources'))}</b>
          ${renderCountList(latestMemory.frequent_sources, t('no_sources_yet'))}
        </div>
        <div class="meeting-memory-group">
          <b>${escapeHTML(t('coaching_for'))} ${displayRep(selectedRep)}</b>
          ${renderCountList(repMemory?.frequent_coaching, t('not_enough_meetings'))}
        </div>
        <div class="meeting-score-chart-panel">
          <div class="meeting-chart-controls">
            <select id="meetingChartRep" aria-label="Représentant du graphique">
              <option value="Marie-Eve"${selectedRep === 'Marie-Eve' ? ' selected' : ''}>Marie</option>
              <option value="Meher"${selectedRep === 'Meher' ? ' selected' : ''}>Meher</option>
              <option value="all">${escapeHTML(t('all'))}</option>
            </select>
            <select id="meetingChartRange" aria-label="Période du graphique">
              <option value="current">${escapeHTML(t('current_month'))}</option>
              <option value="all">${escapeHTML(t('all'))}</option>
            </select>
          </div>
          <div id="meetingScoreChart" class="meeting-score-chart"></div>
        </div>
        <div class="meeting-memory-reset">
          <button id="meetingResetMemoryBtn" class="chip btn-ghost" type="button">${escapeHTML(t('reset_memory'))}</button>
        </div>
      `;

      const chartRep = $('meetingChartRep');
      const chartRange = $('meetingChartRange');
      chartRep?.addEventListener('change', () => renderScoreChart(latestStats));
      chartRange?.addEventListener('change', () => renderScoreChart(latestStats));
      $('meetingResetMemoryBtn')?.addEventListener('click', resetMemory);
      renderScoreChart(latestStats);
    }

    function pointsForChart(stats, rep, range) {
      if (!stats) return {};
      const allMode = rep === 'all' || range === 'all';
      const source = allMode ? stats.all_points : stats.current_month_points;
      if (allMode) {
        return {
          'Marie': source?.['Marie-Eve'] || [],
          'Meher': source?.Meher || [],
        };
      }
      return { [displayRep(rep)]: source?.[rep] || [] };
    }

    function renderScoreChart(stats) {
      latestStats = stats || latestStats;
      const target = $('meetingScoreChart');
      if (!target) return;

      const chartRep = $('meetingChartRep')?.value || normalizeSalesRep(fields.salesRep.value);
      const chartRange = $('meetingChartRange')?.value || 'current';
      const series = pointsForChart(latestStats, chartRep, chartRange);
      const entries = Object.entries(series).map(([name, points]) => [
        name,
        asArray(points).map(point => ({
          date: point.date || '',
          score: Number(point.score || 0),
        })),
      ]);
      const pointCount = entries.reduce((sum, [, points]) => sum + points.length, 0);

      if (!pointCount) {
        target.innerHTML = `<div class="meeting-chart-empty">${escapeHTML(t('no_scores_chart'))}</div>`;
        return;
      }

      const width = 320;
      const height = 168;
      const pad = 24;
      const usableW = width - pad * 2;
      const usableH = height - pad * 2;
      const xFor = (index, length) => pad + (length <= 1 ? usableW / 2 : (index / (length - 1)) * usableW);
      const yFor = score => pad + (1 - Math.max(0, Math.min(100, score)) / 100) * usableH;
      const allMode = chartRep === 'all' || chartRange === 'all';
      const avg = latestStats?.previous_month_average?.[normalizeSalesRep(chartRep)];

      const lines = entries.map(([name, points]) => {
        const cls = name === 'Marie' ? 'line-marie' : 'line-meher';
        const poly = points.map((point, index) => `${xFor(index, points.length)},${yFor(point.score)}`).join(' ');
        const dots = points.map((point, index) => `
          <circle class="${scoreClass(point.score)}" cx="${xFor(index, points.length)}" cy="${yFor(point.score)}" r="4">
            <title>${escapeHTML(name)} ${escapeHTML(point.date)}: ${point.score}/100</title>
          </circle>
        `).join('');
        return `<polyline class="${cls}" points="${poly}" />${dots}`;
      }).join('');

      const avgLine = !allMode && avg != null
        ? `<line class="line-average" x1="${pad}" x2="${width - pad}" y1="${yFor(avg)}" y2="${yFor(avg)}" /><text class="avg-label" x="${width - pad}" y="${Math.max(12, yFor(avg) - 4)}">${escapeHTML(t('avg_prev_month'))} ${avg}</text>`
        : '';

      target.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Évolution des scores">
          <line class="chart-axis" x1="${pad}" x2="${pad}" y1="${pad}" y2="${height - pad}" />
          <line class="chart-axis" x1="${pad}" x2="${width - pad}" y1="${height - pad}" y2="${height - pad}" />
          <text class="axis-label" x="2" y="${yFor(100) + 4}">100</text>
          <text class="axis-label" x="7" y="${yFor(50) + 4}">50</text>
          <text class="axis-label" x="10" y="${yFor(0) + 4}">0</text>
          ${avgLine}
          ${lines}
        </svg>
        <div class="meeting-chart-legend">
          ${Object.keys(series).map(name => `<span class="${name === 'Marie' ? 'legend-marie' : 'legend-meher'}">${escapeHTML(name)}</span>`).join('')}
          ${!allMode && avg != null ? `<span class="legend-average">${escapeHTML(t('average_prev_month'))}</span>` : ''}
        </div>
      `;
    }

    function renderHistory(items = []) {
      latestHistory = items;
      if (!items.length) {
        historyEl.innerHTML = `<div class="meeting-history-empty">${escapeHTML(t('no_meetings_analyzed'))}</div>`;
        return;
      }
      historyEl.innerHTML = items.map(item => {
        const total = Number(item.score || 0);
        const nameText = item.client_name || (localStorage.getItem('ez_lang') === 'en' ? 'Unnamed client' : 'Client non nommé');
        return `
          <button class="meeting-history-item ${scoreClass(total)}" type="button" data-meeting-id="${item.id}">
            <span>
              <b>${escapeHTML(nameText)}</b>
              <small>${escapeHTML(item.meeting_date || item.created_at || '')}${item.sales_rep ? ` | ${escapeHTML(displayRep(item.sales_rep))}` : ''}</small>
              ${item.prospect_source ? `<em>${escapeHTML(item.prospect_source)}</em>` : ''}
            </span>
            <strong>${item.score ?? '-'}/100</strong>
          </button>
        `;
      }).join('');

      historyEl.querySelectorAll('[data-meeting-id]').forEach(button => {
        button.addEventListener('click', async () => {
          try {
            const data = await api(`/meetings/analyses/${button.dataset.meetingId}`);
            renderAnalysis(data.analysis, {
              id: data.id,
              model: data.model,
              duration_ms: data.duration_ms,
              created_at: data.created_at,
              sales_rep: data.sales_rep,
              prospect_source: data.prospect_source,
              transcript: data.transcript,
            });
          } catch (error) {
            resultEl.innerHTML = `<div class="meeting-error">${escapeHTML(error.message)}</div>`;
          }
        });
      });
    }

    function translateCriterion(c) {
      if (!c) return '';
      const cLower = c.toLowerCase();
      if (cLower.includes('découverte') || cLower.includes('needs')) return t('criteria_discovery');
      if (cLower.includes('qualification') || cLower.includes('volume')) return t('criteria_qualification');
      if (cLower.includes('proposition') || cLower.includes('value')) return t('criteria_value');
      if (cLower.includes('objection')) return t('criteria_objections');
      if (cLower.includes('engagement') || cLower.includes('prospect')) return t('criteria_engagement');
      if (cLower.includes('prochaine') || cLower.includes('next')) return t('criteria_next_step');
      return c;
    }

    function renderScore(score, annualValue) {
      const total = Number(score?.total || 0);
      const breakdown = asArray(score?.breakdown);
      const valueDisplay = annualValue?.available ? annualValue.display : '---$';
      
      const isEzmax = window.ezAuth?.user?.activeBrand === 'ezmax';
      const userWord = isEzmax 
        ? 'agents'
        : ((localStorage.getItem('ez_lang') || 'fr') === 'en' ? 'users' : 'utilisateurs');
      
      const valueDetail = annualValue?.available
        ? `${annualValue.account_type || ''}${annualValue.users_count ? ` | ${annualValue.users_count} ${userWord}` : ''}`
        : t('insufficient_data');

      const dealHotness = lastAnalysis?.deal_hotness || { score: 0, evidence: '' };
      const dhScore = Number(dealHotness.score || 0);
      const dhEvidence = dealHotness.evidence || '';
      const dhColor = dhScore >= 8 ? '#22c55e' : (dhScore >= 5 ? '#d97706' : '#ef4444');

      const closeWon = lastAnalysis?.close_won_probability || { percentage: 68, evidence: '' };
      const cwPct = Number(closeWon.percentage || 68);
      const cwEvidence = closeWon.evidence || '';
      const cwColor = cwPct >= 75 ? '#22c55e' : (cwPct >= 50 ? '#d97706' : '#ef4444');

      return `
        <div class="meeting-score-wrap ${scoreClass(total)}">
          <div class="meeting-score-left-panel" style="display: flex; flex-direction: column; gap: 14px; grid-column: 1 / span 2;">
            <div style="display: flex; gap: 14px; align-items: center;">
              <div class="meeting-score-badge ${scoreClass(total)}">
                <strong>${total}</strong>
                <span>/100</span>
              </div>
              <div class="meeting-annual-value ${annualValue?.available ? scoreClass(total) : 'score-neutral'}" style="flex: 1; min-height: 112px;">
                <span>${escapeHTML(t('annualized_value'))}</span>
                <strong>${escapeHTML(valueDisplay)}</strong>
                <small>${escapeHTML(valueDetail)}</small>
              </div>
            </div>
            
            <div class="meeting-score-row" style="margin-top: 6px; padding: 10px; border: 1px solid var(--brand-border); border-radius: 10px; background: var(--output-bg);">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
                <span>${escapeHTML(t('deal_hotness'))}</span>
                <b style="color: var(--brand-primary);">${dhScore}/10</b>
              </div>
              <div style="height: 6px; background: var(--brand-soft); border-radius: 3px; margin: 6px 0; overflow: hidden; border: 1px solid var(--brand-border);">
                <div style="height: 100%; width: ${dhScore * 10}%; background: ${dhColor}; border-radius: 3px;"></div>
              </div>
              ${dhEvidence ? `<small style="display: block; color: var(--ink-muted); font-size: 11px; margin-top: 4px; line-height: 1.3;">${escapeHTML(dhEvidence)}</small>` : ''}
            </div>

            <div class="meeting-score-row" style="padding: 10px; border: 1px solid var(--brand-border); border-radius: 10px; background: var(--output-bg);">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
                <span>${escapeHTML(t('win_rate'))}</span>
                <b style="color: var(--brand-primary);">${cwPct}%</b>
              </div>
              <div style="height: 6px; background: var(--brand-soft); border-radius: 3px; margin: 6px 0; overflow: hidden; border: 1px solid var(--brand-border);">
                <div style="height: 100%; width: ${cwPct}%; background: ${cwColor}; border-radius: 3px;"></div>
              </div>
              ${cwEvidence ? `<small style="display: block; color: var(--ink-muted); font-size: 11px; margin-top: 4px; line-height: 1.3;">${escapeHTML(cwEvidence)}</small>` : ''}
            </div>
          </div>

          <div class="meeting-score-copy">
            <h5>${escapeHTML(score?.label || scoreLabel(total))}</h5>
            <div class="meeting-score-bars">
              ${breakdown.map(row => {
                const value = Number(row.score || 0);
                const max = Number(row.max || 1);
                const width = Math.max(0, Math.min(100, (value / max) * 100));
                return `
                  <div class="meeting-score-row ${scoreClass(width)}">
                    <span>${escapeHTML(translateCriterion(row.criterion))}</span>
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

    function renderAnalysis(analysis, meta = {}) {
      lastAnalysis = analysis || {};
      lastMeta = meta || {};
      const note = lastAnalysis.meeting_note || {};
      const score = lastAnalysis.score || {};
      const total = Number(score.total || 0);
      lastCopySummary = buildCopySummary(lastAnalysis, lastMeta);
      const lang = localStorage.getItem('ez_lang') || 'fr';

      metaEl.textContent = meta.model
        ? (lang === 'fr' 
            ? `Modèle ${meta.model}${meta.duration_ms ? ` | ${Math.round(meta.duration_ms / 1000)} s` : ''}`
            : `Model ${meta.model}${meta.duration_ms ? ` | ${Math.round(meta.duration_ms / 1000)} s` : ''}`)
        : '';

      resultEl.classList.remove('empty-state');
      const clientText = note.client || (lang === 'fr' ? 'Client non confirmé' : 'Unconfirmed client');
      const sourceLabelText = lang === 'fr' ? 'Source' : 'Source';
      const sourceText = meta.prospect_source ? ` | ${sourceLabelText}: ${escapeHTML(meta.prospect_source)}` : '';
      
      resultEl.innerHTML = `
        <div class="meeting-note-header ${scoreClass(total)}">
          <div>
            <span>${escapeHTML(t('meeting_note'))}</span>
            <h4>${escapeHTML(clientText)}</h4>
            <small>${escapeHTML(note.reference || '')}${sourceText}</small>
          </div>
          <div class="meeting-note-actions">
            <strong class="${scoreClass(total)}">${total}/100</strong>
            <button id="meetingCopySummaryBtn" class="chip btn-ghost meeting-copy-btn" type="button">${escapeHTML(t('copy_summary'))}</button>
            <button id="meetingTranscriptBtn" class="chip btn-ghost meeting-copy-btn" type="button">${escapeHTML(t('view_transcript'))}</button>
          </div>
        </div>

        <section class="meeting-result-section">
          <h5>${escapeHTML(t('exec_summary'))}</h5>
          <p>${escapeHTML(lastAnalysis.resume_executif || t('unconfirmed'))}</p>
        </section>

        <section class="meeting-result-section meeting-improvements">
          <h5>${escapeHTML(t('improvements'))}</h5>
          ${listHTML(lastAnalysis.ameliorations_salesman?.length ? lastAnalysis.ameliorations_salesman : lastAnalysis.recommandations_coaching, t('no_improvements'))}
        </section>

        <section class="meeting-result-section">
          <h5>${escapeHTML(t('meeting_score'))}</h5>
          ${renderScore(score, lastAnalysis.estimated_annual_value)}
        </section>

        <div class="meeting-result-grid">
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('context'))}</h5>
            ${listHTML(note.contexte)}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('intended_use'))}</h5>
            ${listHTML(note.utilisation_prevue)}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('current_process'))}</h5>
            ${listHTML(note.processus_actuel)}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('options_considered'))}</h5>
            ${listHTML(note.options_envisagees)}
          </section>
        </div>

        <section class="meeting-result-section">
          <h5>${escapeHTML(t('next_steps'))}</h5>
          ${listHTML(note.prochaines_etapes)}
        </section>

        <div class="meeting-result-grid">
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('key_objections'))}</h5>
            ${detailListHTML(lastAnalysis.objections_principales, 'objection', ['importance', 'reponse_recommandee'])}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('client_interests'))}</h5>
            ${detailListHTML(lastAnalysis.points_interet_client, 'point', ['signal', 'niveau'])}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('recommendations'))}</h5>
            ${listHTML(lastAnalysis.recommandations_coaching)}
          </section>
          <section class="meeting-result-section">
            <h5>${escapeHTML(t('risks'))}</h5>
            ${listHTML(lastAnalysis.risques_red_flags)}
          </section>
        </div>

        <section class="meeting-result-section">
          <h5>${escapeHTML(t('next_meetings_registry'))}</h5>
          ${renderRegistry(lastAnalysis.registre || {}, lastAnalysis.memoire_a_reutiliser || [])}
        </section>
      `;

      $('meetingCopySummaryBtn')?.addEventListener('click', copySummary);
      $('meetingTranscriptBtn')?.addEventListener('click', () => showTranscript(lastMeta.transcript || fields.transcript.value || ''));
    }

    function renderRegistry(registry, memory) {
      const keys = [
        ['client_profile', t('client_profile')],
        ['pain_points', t('pain_points')],
        ['decision_criteria', t('decision_criteria')],
        ['stakeholders', t('stakeholders')],
        ['usage_and_volume', t('usage_and_volume')],
        ['prospect_source', t('prospect_source')],
        ['follow_up_promises', t('follow_up_promises')],
      ];
      return `
        <div class="meeting-registry">
          ${keys.map(([key, label]) => `
            <div>
              <b>${escapeHTML(label)}</b>
              ${listHTML(registry[key], t('unconfirmed'))}
            </div>
          `).join('')}
          <div>
            <b>${escapeHTML(t('memory_to_reuse'))}</b>
            ${listHTML(memory, t('no_items'))}
          </div>
        </div>
      `;
    }

    function sectionText(title, items) {
      const lines = cleanItems(items);
      return `${title}\n\n${lines.length ? lines.map(item => `- ${item}`).join('\n') : '- Non confirmé'}`;
    }

    function buildCopySummary(analysis, meta) {
      if (analysis.resume_copiable && String(analysis.resume_copiable).includes('Note de rencontre')) {
        return analysis.resume_copiable.trim();
      }
      const note = analysis.meeting_note || {};
      const objections = cleanItems(analysis.objections_principales);
      const interests = cleanItems(analysis.points_interet_client);
      const nextSteps = note.prochaines_etapes || [];
      const source = meta.prospect_source || fields.prospectSource.value.trim() || '';

      const usage = analysis.usage_profile || {};
      return [
        `📝 Note de rencontre – ${note.client || fields.clientName.value.trim() || 'Client non confirmé'}`,
        '',
        `Date : ${note.date || fields.meetingDate.value || 'Non confirmé'}`,
        `Contact : ${note.client || fields.clientName.value.trim() || 'Non confirmé'}`,
        `Référence : ${note.reference || fields.reference.value.trim() || 'Non confirmé'}`,
        source ? `Source prospect : ${source}` : '',
        `Représentant : ${displayRep(meta.sales_rep || fields.salesRep.value)}`,
        '',
        sectionText('🎯 Contexte et niveau de maturité', note.contexte),
        '',
        sectionText('🏢 Situation actuelle', note.processus_actuel),
        '',
        sectionText('🎯 Objectif', [
          analysis.resume_executif || 'Non confirmé',
          usage.users_count ? `${usage.users_count} utilisateur(s) identifié(s)` : '',
          usage.manual_sends_monthly ? `${usage.manual_sends_monthly} envoi(s) manuel(s) par mois` : '',
          usage.api_sends_monthly ? `${usage.api_sends_monthly} envoi(s) API par mois` : '',
        ]),
        '',
        sectionText('📌 Points validés durant la rencontre', [
          ...asArray(note.utilisation_prevue),
          ...asArray(note.options_envisagees),
          ...interests,
        ]),
        '',
        sectionText('💬 Impression générale', interests.length ? interests : ['Non confirmé']),
        '',
        sectionText('⚠️ Objections principales', objections),
        '',
        sectionText('🔜 Prochaines étapes', nextSteps),
        '',
        sectionText('⏳ Autres éléments à considérer', [
          source ? `Source / solution comparée : ${source}` : '',
          usage.evidence || '',
        ]),
      ].filter(line => line !== '').join('\n');
    }

    async function copySummary() {
      const button = $('meetingCopySummaryBtn');
      const text = lastCopySummary || buildCopySummary(lastAnalysis || {}, lastMeta || {});
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.focus();
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      if (button) {
        const old = button.textContent;
        button.textContent = t('summary_copied');
        window.setTimeout(() => { button.textContent = old; }, 1600);
      }
    }

    async function loadAll() {
      try {
        const [status, memory, history, stats] = await Promise.all([
          api('/meetings/status'),
          api('/meetings/memory'),
          api('/meetings/analyses'),
          api('/meetings/stats'),
        ]);
        latestStats = stats;
        renderStatus(status);
        renderMemory(memory);
        renderHistory(history.items || []);
      } catch (error) {
        statusEl.className = 'meeting-ai-status warn';
        statusEl.textContent = `Serveur local indisponible: ${error.message}`;
      }
    }

    function payloadFromForm() {
      return {
        clientName: fields.clientName.value.trim(),
        meetingDate: fields.meetingDate.value,
        reference: fields.reference.value.trim(),
        prospectSource: fields.prospectSource.value.trim(),
        salesRep: normalizeSalesRep(fields.salesRep.value),
        meetingType: fields.meetingType.value || 'Démo/discovery',
        transcript: fields.transcript.value.trim(),
        platformLang: localStorage.getItem('ez_lang') || 'fr',
      };
    }

    async function analyzeMeeting() {
      const payload = payloadFromForm();
      if (payload.transcript.length < 50) {
        resultEl.classList.remove('empty-state');
        resultEl.innerHTML = `<div class="meeting-error">${escapeHTML(t('paste_more_complete'))}</div>`;
        fields.transcript.focus();
        return;
      }

      setBusy(true);
      const flight = startAnalyzeFlight(analyzeBtn);
      resultEl.classList.remove('empty-state');
      resultEl.innerHTML = `<div class="meeting-loading">${escapeHTML(t('local_analysis_running'))}</div>`;
      metaEl.textContent = '';

      try {
        const data = await api('/meetings/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        renderAnalysis(data.analysis, {
          ...data,
          sales_rep: payload.salesRep,
          prospect_source: payload.prospectSource,
          transcript: payload.transcript,
        });
        flight.burst();
        const [memory, history, stats] = await Promise.all([
          api('/meetings/memory'),
          api('/meetings/analyses'),
          api('/meetings/stats'),
        ]);
        latestStats = stats;
        renderMemory(memory);
        renderHistory(history.items || []);
        window.dispatchEvent(new CustomEvent('ezsign:analysis-generated', {
          detail: { id: data.id, score: data.score, clientName: payload.clientName, notSaved: data.not_saved },
        }));
      } catch (error) {
        flight.cancel();
        resultEl.innerHTML = `<div class="meeting-error">${escapeHTML(error.message)}</div>`;
      } finally {
        setBusy(false);
      }
    }

    async function resetMemory() {
      const code = window.prompt(t('reset_code_prompt'));
      if (code === null) return;
      try {
        const data = await api('/meetings/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        latestStats = data.stats || null;
        renderMemory(data.memory || {});
        renderHistory([]);
        resultEl.classList.add('empty-state');
        resultEl.textContent = t('memory_reset_done');
        metaEl.textContent = '';
      } catch (error) {
        window.alert(error.message);
      }
    }

    function clearForm() {
      fields.clientName.value = '';
      fields.reference.value = '';
      fields.prospectSource.value = '';
      fields.transcript.value = '';
      fields.meetingDate.value = new Date().toISOString().slice(0, 10);
      fields.meetingType.value = 'Démo/discovery';
      resultEl.classList.add('empty-state');
      resultEl.textContent = t('paste_transcript_prompt');
      metaEl.textContent = '';
      fields.clientName.focus();
    }

    function startAnalyzeFlight(button) {
      document.querySelectorAll('.meeting-ez-orbit, .meeting-ez-orbit-token').forEach(el => el.remove());
      const rect = button.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const token = document.createElement('div');
      token.className = 'meeting-ez-orbit-token';
      token.textContent = 'ez';
      token.style.left = `${startX - 18}px`;
      token.style.top = `${startY - 18}px`;
      document.body.appendChild(token);

      let landed = false;
      let orbit = null;
      const animation = token.animate([
        { transform: 'translate(0, 0) scale(.35)', opacity: 0 },
        { transform: 'translate(0, -10px) scale(1.05)', opacity: 1, offset: .22 },
        { transform: `translate(${centerX - startX}px, ${centerY - startY}px) scale(1)`, opacity: 1 },
      ], {
        duration: 620,
        easing: 'cubic-bezier(.22,.75,.28,1)',
        fill: 'forwards',
      });

      animation.onfinish = () => {
        landed = true;
        animation.cancel();
        orbit = document.createElement('div');
        orbit.className = 'meeting-ez-orbit waiting';
        orbit.style.left = `${centerX - 48}px`;
        orbit.style.top = `${centerY - 48}px`;
        document.body.appendChild(orbit);
        token.removeAttribute('style');
        token.classList.add('in-orbit');
        orbit.appendChild(token);
      };

      return {
        burst() {
          if (!landed) {
            animation.cancel();
            token.style.left = `${centerX - 18}px`;
            token.style.top = `${centerY - 18}px`;
            token.style.transform = 'none';
          } else if (orbit) {
            orbit.classList.remove('waiting');
            document.body.appendChild(token);
            token.classList.remove('in-orbit');
            token.style.left = `${centerX - 18}px`;
            token.style.top = `${centerY - 18}px`;
            token.style.transform = 'none';
            orbit.remove();
          }
          token.style.left = `${centerX - 18}px`;
          token.style.top = `${centerY - 18}px`;
          token.style.transform = 'none';
          token.classList.add('burst');
          burstConfetti(centerX, centerY);
          window.setTimeout(() => token.remove(), 520);
        },
        cancel() {
          animation.cancel();
          orbit?.remove();
          token.remove();
        },
      };
    }

    function parseTranscript(raw) {
      const entries = [];
      let current = null;
      const pushCurrent = () => {
        if (current && (current.speaker || current.text.trim())) {
          current.text = current.text.trim();
          entries.push(current);
        }
      };
      String(raw || '').split(/\r?\n/).forEach(line => {
        const text = line.trim();
        if (!text) return;
        let match = text.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[—-]\s*(.+)$/);
        if (match) {
          pushCurrent();
          current = { time: match[1], speaker: match[2].trim(), text: '' };
          return;
        }
        match = text.match(/^(.+?)\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);
        if (match && match[1].length <= 60) {
          pushCurrent();
          current = { time: match[2], speaker: match[1].trim(), text: '' };
          return;
        }
        match = text.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
        if (match && match[2].length <= 60) {
          pushCurrent();
          current = { time: match[1], speaker: match[2].trim(), text: '' };
          return;
        }
        if (!current) current = { time: '', speaker: 'Transcript', text: '' };
        current.text += `${current.text ? '\n' : ''}${text}`;
      });
      pushCurrent();
      return entries;
    }

    function speakerInitials(name) {
      const clean = String(name || '').trim();
      if (!clean) return '?';
      return clean.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    }

    function showTranscript(raw) {
      const entries = parseTranscript(raw);
      let modal = $('meetingTranscriptModal');
      if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
          <div id="meetingTranscriptModal" class="modal transcript-modal" aria-hidden="true">
            <div class="backdrop" data-transcript-close></div>
            <div class="dialog transcript-dialog" role="dialog" aria-modal="true">
              <div class="head">
                <h3>Transcript</h3>
                <button class="close-x" data-transcript-close>&times;</button>
              </div>
              <div id="meetingTranscriptClean" class="body transcript-body"></div>
            </div>
          </div>
        `);
        modal = $('meetingTranscriptModal');
        modal.querySelectorAll('[data-transcript-close]').forEach(el => {
          el.addEventListener('click', () => {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
          });
        });
      }
      $('meetingTranscriptClean').innerHTML = entries.length
        ? entries.map(entry => `
          <div class="transcript-row">
            <div class="transcript-avatar">${escapeHTML(speakerInitials(entry.speaker))}</div>
            <div class="transcript-bubble">
              <div class="transcript-meta">
                <b>${escapeHTML(entry.speaker || 'Intervenant')}</b>
                <span>${escapeHTML(entry.time || '')}</span>
              </div>
              <p>${escapeHTML(entry.text || '').replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `).join('')
        : '<div class="meeting-history-empty">Aucun transcript disponible.</div>';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function burstConfetti(x, y) {
      const colors = ['#ef3340', '#16a34a', '#f59e0b', '#2563eb', '#111827'];
      for (let i = 0; i < 34; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'meeting-confetti-piece';
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--dx', `${Math.cos((i / 34) * Math.PI * 2) * (80 + Math.random() * 80)}px`);
        piece.style.setProperty('--dy', `${Math.sin((i / 34) * Math.PI * 2) * (60 + Math.random() * 100)}px`);
        piece.style.setProperty('--rot', `${Math.round(Math.random() * 420)}deg`);
        document.body.appendChild(piece);
        window.setTimeout(() => piece.remove(), 1050);
      }
    }

    async function loadAnalysis(id) {
      try {
        const data = await api(`/meetings/analyses/${id}`);
        if (fields.clientName) fields.clientName.value = data.client_name || '';
        if (fields.meetingDate) fields.meetingDate.value = (data.meeting_date || data.created_at || '').slice(0, 10);
        if (fields.reference) fields.reference.value = data.reference || '';
        if (fields.prospectSource) fields.prospectSource.value = data.prospect_source || '';
        if (fields.salesRep) fields.salesRep.value = normalizeSalesRep(data.sales_rep || 'Marie-Eve');
        if (fields.meetingType) fields.meetingType.value = data.meeting_type || 'standard';
        if (fields.transcript) fields.transcript.value = data.transcript || '';

        renderAnalysis(data.analysis, {
          id: data.id,
          model: data.model,
          duration_ms: data.duration_ms,
          created_at: data.created_at,
          sales_rep: data.sales_rep,
          prospect_source: data.prospect_source,
          transcript: data.transcript,
        });
      } catch (error) {
        if (resultEl) resultEl.innerHTML = `<div class="meeting-error">${escapeHTML(error.message)}</div>`;
      }
    }
    window.ezMeetingAi = { loadAnalysis, clearForm };

    openBtn.addEventListener('click', openModal);
    analyzeBtn.addEventListener('click', analyzeMeeting);
    clearBtn.addEventListener('click', clearForm);
    refreshBtn?.addEventListener('click', loadAll);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

    window.addEventListener('ezsign:lang-changed', () => {
      if (lastAnalysis) {
        renderAnalysis(lastAnalysis, lastMeta);
      }
      if (latestMemory) {
        renderMemory(latestMemory);
      }
      if (latestHistory) {
        renderHistory(latestHistory);
      }
    });

    loadAll();
  });
})();
