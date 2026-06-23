(() => {
  if (window.__EZSIGN_MEETING_AI_INIT__) return;
  window.__EZSIGN_MEETING_AI_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.location.protocol === 'file:'
  ? 'http://127.0.0.1:5055'
  : 'https://fought-dominant-cats-minimize.trycloudflare.com';
    const API_CREDENTIALS = API_BASE ? 'include' : 'same-origin';
    const $ = id => document.getElementById(id);
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
    fields.salesRep.value = normalizeSalesRep(localStorage.getItem('ez_meeting_sales_rep') || fields.salesRep.value || 'Marie-Eve');
    fields.salesRep.addEventListener('change', () => {
      fields.salesRep.value = normalizeSalesRep(fields.salesRep.value);
      localStorage.setItem('ez_meeting_sales_rep', fields.salesRep.value);
      renderMemory(latestMemory || {});
    });
    if (fields.meetingType && !fields.meetingType.value) fields.meetingType.value = 'Démo/discovery';

    function patchFormControls() {
      const referenceInput = $('meetingReference');
      const referenceField = referenceInput?.closest('.field');
      if (referenceField && !$('meetingProspectSource')) {
        referenceField.insertAdjacentHTML('afterend', `
          <div class="field">
            <label for="meetingProspectSource">Source prospect</label>
            <input id="meetingProspectSource" type="text" placeholder="Ex. DocuSign, Hopem, référence, web" autocomplete="off" />
          </div>
        `);
      }

      const repControl = $('meetingSalesRep');
      if (repControl && repControl.tagName.toLowerCase() !== 'select') {
        const select = document.createElement('select');
        select.id = repControl.id;
        select.name = repControl.name || repControl.id;
        select.className = repControl.className || '';
        select.innerHTML = REPS
          .map(rep => `<option value="${rep.value}">${rep.label}</option>`)
          .join('');
        select.value = normalizeSalesRep(repControl.value || localStorage.getItem('ez_meeting_sales_rep') || 'Marie-Eve');
        repControl.replaceWith(select);
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
      const text = String(value || '').trim().toLowerCase();
      if (text === 'meher') return 'Meher';
      if (text.includes('marie')) return 'Marie-Eve';
      return 'Marie-Eve';
    }

    function displayRep(value) {
      return normalizeSalesRep(value) === 'Marie-Eve' ? 'Marie' : 'Meher';
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

    function listHTML(items, empty = 'Non confirmé') {
      const clean = cleanItems(items);
      if (!clean.length) return `<p class="muted">${escapeHTML(empty)}</p>`;
      return `<ul>${clean.map(text => `<li>${escapeHTML(text)}</li>`).join('')}</ul>`;
    }

    function detailListHTML(items, primaryKey, secondaryKeys = []) {
      const clean = asArray(items).filter(Boolean);
      if (!clean.length) return '<p class="muted">Non confirmé</p>';
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
      if (total >= 85) return 'Excellent';
      if (total >= 75) return 'Très bon';
      if (total >= 55) return 'À renforcer';
      return 'À risque';
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
      analyzeBtn.textContent = isBusy ? 'Analyse en cours...' : 'Analyser la rencontre';
    }

    function renderStatus(data) {
      const ollama = data.ollama || {};
      const count = data.memory?.count || 0;
      const avg = data.memory?.average_score;
      if (ollama.ok && ollama.model_available) {
        statusEl.className = 'meeting-ai-status ok';
        statusEl.textContent = `Ollama prêt: ${ollama.model} | mémoire: ${count} rencontre${count > 1 ? 's' : ''}${avg ? ` | score moyen ${avg}/100` : ''}`;
        return;
      }
      if (ollama.ok) {
        statusEl.className = 'meeting-ai-status warn';
        statusEl.textContent = `Ollama répond, mais le modèle ${ollama.model} n'est pas disponible.`;
        return;
      }
      statusEl.className = 'meeting-ai-status warn';
      statusEl.textContent = `Ollama ne répond pas encore: ${ollama.error || 'service indisponible'}`;
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

      memoryEl.innerHTML = `
        <div class="meeting-memory-summary">
          <b>${count}</b> rencontre${count > 1 ? 's' : ''} en mémoire${avg ? `, score moyen <b>${avg}/100</b>` : ''}.
        </div>
        <div class="meeting-memory-group">
          <b>Objections fréquentes</b>
          ${renderCountList(latestMemory.frequent_objections, 'Aucune encore.')}
        </div>
        <div class="meeting-memory-group">
          <b>Intérêts fréquents</b>
          ${renderCountList(latestMemory.frequent_interests, 'Aucun encore.')}
        </div>
        <div class="meeting-memory-group">
          <b>Sources prospect fréquentes</b>
          ${renderCountList(latestMemory.frequent_sources, 'Aucune source encore.')}
        </div>
        <div class="meeting-memory-group">
          <b>Coaching ${displayRep(selectedRep)}</b>
          ${renderCountList(repMemory?.frequent_coaching, 'Pas encore assez de rencontres pour ce représentant.')}
        </div>
        <div class="meeting-score-chart-panel">
          <div class="meeting-chart-controls">
            <select id="meetingChartRep" aria-label="Représentant du graphique">
              <option value="Marie-Eve"${selectedRep === 'Marie-Eve' ? ' selected' : ''}>Marie</option>
              <option value="Meher"${selectedRep === 'Meher' ? ' selected' : ''}>Meher</option>
              <option value="all">All</option>
            </select>
            <select id="meetingChartRange" aria-label="Période du graphique">
              <option value="current">Mois courant</option>
              <option value="all">All</option>
            </select>
          </div>
          <div id="meetingScoreChart" class="meeting-score-chart"></div>
        </div>
        <div class="meeting-memory-reset">
          <button id="meetingResetMemoryBtn" class="chip btn-ghost" type="button">Réinitialiser mémoire</button>
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
        target.innerHTML = '<div class="meeting-chart-empty">Aucun score à afficher pour cette vue.</div>';
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
        ? `<line class="line-average" x1="${pad}" x2="${width - pad}" y1="${yFor(avg)}" y2="${yFor(avg)}" /><text class="avg-label" x="${width - pad}" y="${Math.max(12, yFor(avg) - 4)}">Moy. mois précédent ${avg}</text>`
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
          ${!allMode && avg != null ? '<span class="legend-average">Moyenne mois précédent</span>' : ''}
        </div>
      `;
    }

    function renderHistory(items = []) {
      latestHistory = items;
      if (!items.length) {
        historyEl.innerHTML = '<div class="meeting-history-empty">Aucune rencontre analysée encore.</div>';
        return;
      }
      historyEl.innerHTML = items.map(item => {
        const total = Number(item.score || 0);
        return `
          <button class="meeting-history-item ${scoreClass(total)}" type="button" data-meeting-id="${item.id}">
            <span>
              <b>${escapeHTML(item.client_name || 'Client non nommé')}</b>
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

    function renderScore(score, annualValue) {
      const total = Number(score?.total || 0);
      const breakdown = asArray(score?.breakdown);
      const valueDisplay = annualValue?.available ? annualValue.display : '---$';
      const valueDetail = annualValue?.available
        ? `${annualValue.account_type || ''}${annualValue.users_count ? ` | ${annualValue.users_count} utilisateurs` : ''}`
        : 'Données insuffisantes';
      return `
        <div class="meeting-score-wrap ${scoreClass(total)}">
          <div class="meeting-score-badge ${scoreClass(total)}">
            <strong>${total}</strong>
            <span>/100</span>
          </div>
          <div class="meeting-annual-value ${annualValue?.available ? scoreClass(total) : 'score-neutral'}">
            <span>Valeur annualisée</span>
            <strong>${escapeHTML(valueDisplay)}</strong>
            <small>${escapeHTML(valueDetail)}</small>
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
                    <span>${escapeHTML(row.criterion || 'Critère')}</span>
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

      metaEl.textContent = meta.model
        ? `Modèle ${meta.model}${meta.duration_ms ? ` | ${Math.round(meta.duration_ms / 1000)} s` : ''}`
        : '';

      resultEl.classList.remove('empty-state');
      resultEl.innerHTML = `
        <div class="meeting-note-header ${scoreClass(total)}">
          <div>
            <span>Note de rencontre</span>
            <h4>${escapeHTML(note.client || 'Client non confirmé')}</h4>
            <small>${escapeHTML(note.reference || '')}${meta.prospect_source ? ` | Source: ${escapeHTML(meta.prospect_source)}` : ''}</small>
          </div>
          <div class="meeting-note-actions">
            <strong class="${scoreClass(total)}">${total}/100</strong>
            <button id="meetingCopySummaryBtn" class="chip btn-ghost meeting-copy-btn" type="button">Copier le résumé</button>
            <button id="meetingTranscriptBtn" class="chip btn-ghost meeting-copy-btn" type="button">Voir transcript</button>
          </div>
        </div>

        <section class="meeting-result-section">
          <h5>Résumé exécutif</h5>
          <p>${escapeHTML(lastAnalysis.resume_executif || 'Non confirmé')}</p>
        </section>

        <section class="meeting-result-section meeting-improvements">
          <h5>Améliorations</h5>
          ${listHTML(lastAnalysis.ameliorations_salesman?.length ? lastAnalysis.ameliorations_salesman : lastAnalysis.recommandations_coaching, 'Aucune amélioration précise pour l’instant.')}
        </section>

        <section class="meeting-result-section">
          <h5>Score de rencontre</h5>
          ${renderScore(score, lastAnalysis.estimated_annual_value)}
        </section>

        <div class="meeting-result-grid">
          <section class="meeting-result-section">
            <h5>Contexte</h5>
            ${listHTML(note.contexte)}
          </section>
          <section class="meeting-result-section">
            <h5>Utilisation prévue</h5>
            ${listHTML(note.utilisation_prevue)}
          </section>
          <section class="meeting-result-section">
            <h5>Processus actuel</h5>
            ${listHTML(note.processus_actuel)}
          </section>
          <section class="meeting-result-section">
            <h5>Options envisagées</h5>
            ${listHTML(note.options_envisagees)}
          </section>
        </div>

        <section class="meeting-result-section">
          <h5>Prochaines étapes</h5>
          ${listHTML(note.prochaines_etapes)}
        </section>

        <div class="meeting-result-grid">
          <section class="meeting-result-section">
            <h5>Objections principales</h5>
            ${detailListHTML(lastAnalysis.objections_principales, 'objection', ['importance', 'reponse_recommandee'])}
          </section>
          <section class="meeting-result-section">
            <h5>Points intéressants pour le client</h5>
            ${detailListHTML(lastAnalysis.points_interet_client, 'point', ['signal', 'niveau'])}
          </section>
          <section class="meeting-result-section">
            <h5>Recommandations</h5>
            ${listHTML(lastAnalysis.recommandations_coaching)}
          </section>
          <section class="meeting-result-section">
            <h5>Risques</h5>
            ${listHTML(lastAnalysis.risques_red_flags)}
          </section>
        </div>

        <section class="meeting-result-section">
          <h5>Registre pour les prochaines rencontres</h5>
          ${renderRegistry(lastAnalysis.registre || {}, lastAnalysis.memoire_a_reutiliser || [])}
        </section>
      `;

      $('meetingCopySummaryBtn')?.addEventListener('click', copySummary);
      $('meetingTranscriptBtn')?.addEventListener('click', () => showTranscript(lastMeta.transcript || fields.transcript.value || ''));
    }

    function renderRegistry(registry, memory) {
      const keys = [
        ['client_profile', 'Profil client'],
        ['pain_points', 'Pain points'],
        ['decision_criteria', 'Critères de décision'],
        ['stakeholders', 'Parties prenantes'],
        ['usage_and_volume', 'Utilisation / volumes'],
        ['prospect_source', 'Source prospect'],
        ['follow_up_promises', 'Promesses de suivi'],
      ];
      return `
        <div class="meeting-registry">
          ${keys.map(([key, label]) => `
            <div>
              <b>${label}</b>
              ${listHTML(registry[key], 'Non confirmé')}
            </div>
          `).join('')}
          <div>
            <b>Mémoire à réutiliser</b>
            ${listHTML(memory, 'Aucun élément')}
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

      return [
        '📝 Note de rencontre',
        '',
        `Client : ${note.client || fields.clientName.value.trim() || 'Non confirmé'}`,
        `Date : ${note.date || fields.meetingDate.value || 'Non confirmé'}`,
        `Référence : ${note.reference || fields.reference.value.trim() || 'Non confirmé'}`,
        source ? `Source prospect : ${source}` : '',
        `Représentant : ${displayRep(meta.sales_rep || fields.salesRep.value)}`,
        '',
        sectionText('📌 Résumé exécutif', [analysis.resume_executif || 'Non confirmé']),
        '',
        sectionText('📌 Contexte', note.contexte),
        '',
        sectionText('👥 Utilisation prévue', note.utilisation_prevue),
        '',
        sectionText('🏢 Processus actuel', note.processus_actuel),
        '',
        sectionText('🔎 Options envisagées', note.options_envisagees),
        '',
        sectionText('⚠️ Objections principales', objections),
        '',
        sectionText('✅ Points intéressants pour le client', interests),
        '',
        sectionText('📌 Prochaines étapes', nextSteps),
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
        button.textContent = 'Résumé copié';
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
      };
    }

    async function analyzeMeeting() {
      const payload = payloadFromForm();
      if (payload.transcript.length < 50) {
        resultEl.classList.remove('empty-state');
        resultEl.innerHTML = '<div class="meeting-error">Colle un transcript plus complet avant de lancer l’analyse.</div>';
        fields.transcript.focus();
        return;
      }

      setBusy(true);
      const flight = startAnalyzeFlight(analyzeBtn);
      resultEl.classList.remove('empty-state');
      resultEl.innerHTML = '<div class="meeting-loading">Analyse locale en cours avec Ollama. Ça peut prendre quelques secondes.</div>';
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
      } catch (error) {
        flight.cancel();
        resultEl.innerHTML = `<div class="meeting-error">${escapeHTML(error.message)}</div>`;
      } finally {
        setBusy(false);
      }
    }

    async function resetMemory() {
      const code = window.prompt('Code requis pour réinitialiser la mémoire');
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
        resultEl.textContent = 'Mémoire réinitialisée. Colle un transcript et lance l’analyse.';
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
      resultEl.textContent = 'Colle un transcript et lance l’analyse.';
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

    openBtn.addEventListener('click', openModal);
    analyzeBtn.addEventListener('click', analyzeMeeting);
    clearBtn.addEventListener('click', clearForm);
    refreshBtn?.addEventListener('click', loadAll);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

    loadAll();
  });
})();
