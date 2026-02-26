/* =============================================================================
   eZsign Calculator, app.js (fixed init order)
   - Fixes: Cannot access 'offerTitle' before initialization
   - Keeps existing calculator, pricing, compare, theme, language, offer modal
   ============================================================================= */

(() => {
  if (window.__EZSIGN_APP_INIT__) return;
  window.__EZSIGN_APP_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {

    /* =============================================================================
       1) PRICING DATA
       ============================================================================= */
    const ACCOUNTS = {
      enterprise: {
        key: 'enterprise',
        name_fr: 'Entreprise',
        name_en: 'Enterprise',
        base: 222.80,
        includesFiles: 100,
        includesUsers: 10,
        apiAvailable: true,
        userSegments: [
          [20, 21.27],
          [50, 20.16],
          [100, 19.05],
          [250, 18.05],
          [500, 17.09],
          [1000, 16.21],
          [Infinity, 15.31],
        ],
      },

      basic: {
        key: 'basic',
        name_fr: 'Affaires de Base',
        name_en: 'Business Basic',
        base: 122.50,
        includesFiles: 0,
        includesUsers: 10,
        apiAvailable: false,
        userSegments: [
          [20, 11.70],
          [50, 11.04],
          [100, 10.47],
          [250, 9.92],
          [500, 9.41],
          [1000, 8.91],
          [Infinity, 8.46],
        ],
      },

      pro: {
        key: 'pro',
        name_fr: 'Affaires Pro',
        name_en: 'Business Pro',
        base: 167.10,
        includesFiles: 0,
        includesUsers: 10,
        apiAvailable: false,
        userSegments: [
          [20, 15.93],
          [50, 15.05],
          [100, 14.26],
          [250, 13.47],
          [500, 12.75],
          [1000, 12.10],
          [Infinity, 11.48],
        ],
      },
    };

    // API tiers (Enterprise)
    // [upperLimit, baseAtPrevLimit, pricePerAdditionalFile]
    const API_TIERS = [
      [100, 0.00, 0.00],
      [200, 180.00, 1.80],
      [350, 438.00, 1.72],
      [600, 810.50, 1.49],
      [1100, 1485.50, 1.35],
      [2600, 3300.50, 1.21],
      [5100, 6025.50, 1.09],
      [10100, 10925.50, 0.98],
      [25100, 24275.50, 0.89],
      [50100, 45525.50, 0.85],
      [Infinity, 45525.50, 0.80],
    ];

    /* =============================================================================
       2) I18N + FORMATTERS
       ============================================================================= */
    let LANG = localStorage.getItem('ez_lang') || 'fr';
    let THEME = localStorage.getItem('ez_theme') || 'light';
    let OFFER_LANG = localStorage.getItem('ez_offer_lang') || 'fr';


    let moneyFmt = new Intl.NumberFormat(LANG === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
    });
    let numFmt = new Intl.NumberFormat(LANG === 'fr' ? 'fr-CA' : 'en-CA');

    const fmtMoney = n => moneyFmt.format(n);
    const fmtNumber = n => numFmt.format(n);

    const t = {
      fr: {
        title: 'Calculateur eZsign',
        inlineCompare1: '+ Comparer (ajouter une colonne)',
        inlineCompare2: '+ Ajouter une troisième colonne',
        inlineCompare3: '↺ Revenir à une seule',
        choose: 'Choisissez le type de compte, puis entrez le nombre d’utilisateurs (et de dossiers API si le plan le permet).',
        params: 'Paramètres',
        quick: 'Résumé rapide',
        details: 'Détails de la simulation',
        acct: 'Type de compte',
        files: 'Nombre de dossiers (par mois)',
        users: 'Nombre d’utilisateurs',
        calc: 'Calculer',
        note_ent: 'Le plan <b>Entreprise</b> inclut <b>10 utilisateurs</b> et <b>100 dossiers API</b>.',
        note_np: 'Les plans <b>Affaires de Base</b> et <b>Affaires Pro</b> incluent <b>10 utilisateurs</b> et ne proposent pas l’API.',
        k_files: 'Dossiers envoyés',
        k_api: 'Frais API',
        k_users: 'Utilisateurs',
        k_userfees: 'Frais utilisateurs',
        k_total: 'Total mensuel',
        empty: 'Aucun calcul encore. Entrez les paramètres et cliquez « Calculer ».',
        sim: 'SIMULATION',
        line2: (n, b, iu, if_) => `Vous utilisez le forfait <b>${n}</b> à ${fmtMoney(b)}/mois, incluant ${iu} utilisateur${iu > 1 ? 's' : ''}${if_ > 0 ? ` et ${if_} dossiers API par mois` : ''}.`,
        noneFiles: inc => `Comme ${inc} dossiers sont inclus, aucun frais d’API.`,
        mustPayFiles: (x, inc) => `Comme ${inc} dossiers sont inclus, vous devez payer pour ${x} ${x === 1 ? 'dossier supplémentaire' : 'dossiers supplémentaires'}.`,
        tierFiles: (f, pb, c, r, pl, lim) => `Dossiers, palier ${pl + 1}–${lim}. Base palier, ${fmtMoney(pb)}, ${c} restants (${f}-${pl}) à ${fmtMoney(r)}/dossier, total, ${fmtMoney(pb + c * r)}.`,
        month: 'Calcul des frais mensuels',
        entRow: (n, b, iu, if_) => `Forfait ${n} = ${fmtMoney(b)}/mois (inclut ${iu} utilisateur${iu > 1 ? 's' : ''}${if_ > 0 ? ` et ${if_} dossiers` : ''})`,
        apiRow: (pb, c, r) => `Frais API = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
        usersNone: inc => `Comme ${inc} utilisateur${inc > 1 ? 's' : ''} sont inclus, aucun frais utilisateurs.`,
        usersMust: x => `Vous avez des frais pour ${x} ${x === 1 ? 'utilisateur supplémentaire' : 'utilisateurs supplémentaires'}.`,
        usersTier: (u, monthlyAtPrev, c, r, pl, lim) => `Utilisateurs, palier ${pl + 1}–${lim}. Base palier, ${fmtMoney(monthlyAtPrev)}, ${c} restants (${u}-${pl}) à ${fmtMoney(r)}/utilisateur, total, ${fmtMoney(monthlyAtPrev + c * r)}.`,
        usersRow: (baseTier, c, r) => `Frais utilisateurs = ${fmtMoney(baseTier)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(baseTier + c * r)}`,
        total: 'TOTAL MENSUEL = ',
        themeLight: 'Thème clair',
        themeDark: 'Thème sombre',
        infoTitle: 'Tarifs eZsign',
        compareTop: 'Comparer',
        compareTitle: 'Comparer les forfaits',
        thPlan: 'Forfait',
        thBase: 'Base',
        thUsers: 'Utilisateurs',
        thUserFees: 'Frais utilisateurs',
        thApiFees: 'Frais API',
        thTotal: 'Total',
        andUp: 'et plus',
      },

      en: {
        title: 'eZsign Calculator',
        inlineCompare1: '+ Compare (add column)',
        inlineCompare2: '+ Add third column',
        inlineCompare3: '↺ Back to single',
        choose: 'Choose the account type, then enter the number of users (and API files if the plan allows it).',
        params: 'Parameters',
        quick: 'Quick summary',
        details: 'Simulation details',
        acct: 'Account type',
        files: 'Number of files (per month)',
        users: 'Number of users',
        calc: 'Calculate',
        note_ent: 'The <b>Enterprise</b> plan includes <b>10 users</b> and <b>100 API files</b>.',
        note_np: 'The <b>Business Basic</b> and <b>Business Pro</b> plans include <b>10 users</b> and do not offer the API.',
        k_files: 'Files sent',
        k_api: 'API fees',
        k_users: 'Users',
        k_userfees: 'User fees',
        k_total: 'Monthly total',
        empty: 'No calculation yet. Enter parameters and click “Calculate”.',
        sim: 'SIMULATION',
        line2: (n, b, iu, if_) => `You’re using the <b>${n}</b> plan at ${fmtMoney(b)}/month, including ${iu} user${iu > 1 ? 's' : ''}${if_ > 0 ? ` and ${if_} API files per month` : ''}.`,
        noneFiles: inc => `Since ${inc} files are included, there are no API fees.`,
        mustPayFiles: (x, inc) => `Since ${inc} files are included, you need to pay for ${x} additional ${x === 1 ? 'file' : 'files'}.`,
        tierFiles: (f, pb, c, r, pl, lim) => `Files, tier ${pl + 1}–${lim}. Base tier, ${fmtMoney(pb)}, ${c} remaining (${f}-${pl}) at ${fmtMoney(r)}/file, total, ${fmtMoney(pb + c * r)}.`,
        month: 'Monthly fees calculation',
        entRow: (n, b, iu, if_) => `${n} plan = ${fmtMoney(b)}/month (includes ${iu} user${iu > 1 ? 's' : ''}${if_ > 0 ? ` and ${if_} files` : ''})`,
        apiRow: (pb, c, r) => `API fees = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
        usersNone: inc => `Since ${inc} user${inc > 1 ? 's' : ''} are included, there are no user fees.`,
        usersMust: x => `You have fees for ${x} additional ${x === 1 ? 'user' : 'users'}.`,
        usersTier: (u, monthlyAtPrev, c, r, pl, lim) => `Users, tier ${pl + 1}–${lim}. Base tier, ${fmtMoney(monthlyAtPrev)}, ${c} remaining (${u}-${pl}) at ${fmtMoney(r)}/user, total, ${fmtMoney(monthlyAtPrev + c * r)}.`,
        usersRow: (baseTier, c, r) => `User fees = ${fmtMoney(baseTier)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(baseTier + c * r)}`,
        total: 'MONTHLY TOTAL = ',
        themeLight: 'Light theme',
        themeDark: 'Dark theme',
        infoTitle: 'eZsign Pricing',
        compareTop: 'Compare',
        compareTitle: 'Compare plans',
        thPlan: 'Plan',
        thBase: 'Base',
        thUsers: 'Users',
        thUserFees: 'User fees',
        thApiFees: 'API fees',
        thTotal: 'Total',
        andUp: 'and up',
      },
    };

    /* =============================================================================
       3) COST HELPERS
       ============================================================================= */
    function apiCostBreakdown(files, account) {
      if (!account.apiAvailable) {
        return { files: 0, prevLimit: 0, prevBase: 0, inTierCount: 0, rate: 0, apiTotal: 0 };
      }

      files = Math.max(0, Math.floor(Number(files) || 0));
      if (files <= account.includesFiles) {
        return { files, prevLimit: account.includesFiles, prevBase: 0, inTierCount: 0, rate: 0, apiTotal: 0 };
      }

      for (let i = 1; i < API_TIERS.length; i++) {
        const [limit] = API_TIERS[i];
        if (files <= limit) {
          const prevLimit = API_TIERS[i - 1][0];
          const prevBase = API_TIERS[i - 1][1];
          const rate = API_TIERS[i][2];
          const inTierCount = files - prevLimit;
          const apiTotal = prevBase + inTierCount * rate;
          return { files, prevLimit, prevBase, inTierCount, rate, apiTotal };
        }
      }

      return { files, prevLimit: 0, prevBase: 0, inTierCount: 0, rate: 0, apiTotal: 0 };
    }

    function userCostBreakdown(users, account) {
      users = Math.max(0, Math.floor(Number(users) || 0));
      const inc = account.includesUsers;

      if (users <= inc) {
        return { users, prevLimit: inc, prevBase: 0, inTierCount: 0, rate: 0, userTotal: 0 };
      }

      let prevLimit = inc;
      let prevBase = 0;

      for (const [limit, rate] of account.userSegments) {
        if (users <= limit) {
          const inTierCount = users - prevLimit;
          const userTotal = prevBase + inTierCount * rate;
          return { users, prevLimit, prevBase, inTierCount, rate, userTotal };
        }
        prevBase += (limit - prevLimit) * rate;
        prevLimit = limit;
      }

      return { users, prevLimit: inc, prevBase: 0, inTierCount: 0, rate: 0, userTotal: 0 };
    }

    function findApiTierLimit(files) {
      for (const [limit] of API_TIERS) {
        if (files <= limit) return limit === Infinity ? '∞' : limit;
      }
      return '∞';
    }

    function findUserTierLimit(users, acct) {
      for (const [limit] of acct.userSegments) {
        if (users <= limit) return limit === Infinity ? '∞' : limit;
      }
      return '∞';
    }

    /* =============================================================================
       4) buildSimulationHTML
       ============================================================================= */
    function buildSimulationHTML(files, users, acct) {
      const bF = apiCostBreakdown(files, acct);
      const bU = userCostBreakdown(users, acct);

      const paidFiles = Math.max(0, acct.apiAvailable ? (files - acct.includesFiles) : 0);
      const paidUsers = Math.max(0, users - acct.includesUsers);

      const total = acct.base + bF.apiTotal + bU.userTotal;
      const monthlyAtPrevLimit = acct.base + bU.prevBase;

      const name = LANG === 'fr' ? acct.name_fr : acct.name_en;
      const parts = [];

      parts.push(`<b>${t[LANG].sim}</b>`);
      parts.push(t[LANG].line2(name, acct.base, acct.includesUsers, acct.includesFiles));

      if (acct.apiAvailable && files > 0) {
        if (paidFiles === 0) parts.push(t[LANG].noneFiles(acct.includesFiles));
        else {
          parts.push(t[LANG].mustPayFiles(paidFiles, acct.includesFiles));
          parts.push(t[LANG].tierFiles(files, bF.prevBase, bF.inTierCount, bF.rate, bF.prevLimit, findApiTierLimit(files)));
        }
      }

      if (paidUsers === 0) parts.push(t[LANG].usersNone(acct.includesUsers));
      else {
        parts.push(t[LANG].usersMust(paidUsers));
        parts.push(t[LANG].usersTier(users, monthlyAtPrevLimit, bU.inTierCount, bU.rate, bU.prevLimit, findUserTierLimit(users, acct)));
      }

      parts.push(`<b>${t[LANG].month}</b>`);
      parts.push(t[LANG].entRow(name, acct.base, acct.includesUsers, acct.includesFiles));
      if (acct.apiAvailable) parts.push(t[LANG].apiRow(bF.prevBase, bF.inTierCount, bF.rate));
      parts.push(t[LANG].usersRow(monthlyAtPrevLimit, bU.inTierCount, bU.rate));
      parts.push(`<b>${t[LANG].total}${fmtMoney(total)}</b>`);

      return {
        html: parts.join('<br><br>'),
        apiTotal: bF.apiTotal,
        userExtra: bU.userTotal,
        totalMonthly: total,
      };
    }

    /* =============================================================================
       5) DOM ELEMENTS (grab everything up front)
       ============================================================================= */
    const lanesEl = document.getElementById('lanes');
    const inlineBtn = document.getElementById('inlineCompareBtn');

    const titleEl = document.getElementById('title');
    const infoBtn = document.getElementById('infoBtn');
    const compareBtn = document.getElementById('compareBtn');
    const themeBtn = document.getElementById('themeBtn');
    const langBtn = document.getElementById('langBtn');

    // Modals
    const pricingModal = document.getElementById('pricingModal');
    const pricingTitle = document.getElementById('pricingTitle');
    const pricingBody = document.getElementById('pricingBody');

    const compareModal = document.getElementById('compareModal');
    const compareTitle = document.getElementById('compareTitle');
    const compareBody = document.getElementById('compareBody');
    

    // Offer elements (IMPORTANT: defined BEFORE setLang runs)
    const offerBtn = document.getElementById('offerBtn');
    const offerModal = document.getElementById('offerModal');
    const offerTitle = document.getElementById('offerTitle');
    const offerCompanyName = document.getElementById('offerCompanyName');
    const offerPlan = document.getElementById('offerPlan');
    const offerFilesField = document.getElementById('offerFilesField');
    const offerFiles = document.getElementById('offerFiles');
    const offerUsers = document.getElementById('offerUsers');
    const offerGenerateBtn = document.getElementById('offerGenerateBtn');
    const offerPreview = document.getElementById('offerPreview');
    const offerDatesNote = document.getElementById('offerDatesNote');

    /* =============================================================================
       6) INLINE LANES UI
       ============================================================================= */
    let lanesCount = 1;

    function inlineCompareLabel() {
      if (lanesCount === 1) return t[LANG].inlineCompare1;
      if (lanesCount === 2) return t[LANG].inlineCompare2;
      return t[LANG].inlineCompare3;
    }

    function laneId(i, s) { return `${s}-${i}`; }

    function accountOptionsHTML(sel) {
      return `
        <option value="enterprise"${sel === 'enterprise' ? ' selected' : ''}>${LANG === 'fr' ? 'Entreprise' : 'Enterprise'}</option>
        <option value="basic"${sel === 'basic' ? ' selected' : ''}>Business Basic</option>
        <option value="pro"${sel === 'pro' ? ' selected' : ''}>Business Pro</option>`;
    }

    function makeLane(i, defaults) {
      const plan = defaults.plan || 'enterprise';

      const paramsHTML = `
        <section class="card">
          <div class="lane-title">${t[LANG].params} , ${String.fromCharCode(65 + i)}</div>
          <div class="sub">${t[LANG].choose}</div>
          <div class="controls">
            <div class="field">
              <label for="${laneId(i, 'plan')}">${t[LANG].acct}</label>
              <select id="${laneId(i, 'plan')}">${accountOptionsHTML(plan)}</select>
            </div>

            <div class="field" id="${laneId(i, 'filesField')}">
              <label for="${laneId(i, 'files')}">${t[LANG].files}</label>
              <input type="number" id="${laneId(i, 'files')}" placeholder="${LANG === 'fr' ? 'Ex, 350' : 'e.g., 350'}" min="0" inputmode="numeric" value="${defaults.files ?? ''}">
            </div>

            <div class="field">
              <label for="${laneId(i, 'users')}">${t[LANG].users}</label>
              <input type="number" id="${laneId(i, 'users')}" placeholder="${LANG === 'fr' ? 'Ex, 75' : 'e.g., 75'}" min="1" inputmode="numeric" value="${defaults.users ?? 10}">
            </div>

            <button id="${laneId(i, 'calc')}" class="btn">${t[LANG].calc}</button>
          </div>

          <div class="note">${t[LANG].note_ent} ${t[LANG].note_np}</div>
        </section>`;

      const kpiHTML = `
        <section class="card" id="${laneId(i, 'kpis')}" style="display:none">
          <h2>${t[LANG].quick}</h2>
          <div class="kpi-row">
            <div class="kpi" id="${laneId(i, 'kpiBlockFiles')}">
              <div class="label">${t[LANG].k_files}</div>
              <div class="value" id="${laneId(i, 'kpiFiles')}">—</div>
            </div>
            <div class="kpi" id="${laneId(i, 'kpiBlockApi')}">
              <div class="label">${t[LANG].k_api}</div>
              <div class="value" id="${laneId(i, 'kpiApi')}">—</div>
            </div>
            <div class="kpi">
              <div class="label">${t[LANG].k_users}</div>
              <div class="value" id="${laneId(i, 'kpiUsers')}">—</div>
            </div>
            <div class="kpi">
              <div class="label">${t[LANG].k_userfees}</div>
              <div class="value" id="${laneId(i, 'kpiUserFees')}">—</div>
            </div>
            <div class="kpi">
              <div class="label">${t[LANG].k_total}</div>
              <div class="value" id="${laneId(i, 'kpiTotal')}">—</div>
            </div>
          </div>
          <div class="total" id="${laneId(i, 'totalBanner')}">${t[LANG].total}—</div>
        </section>`;

      const outHTML = `
        <section class="card">
          <h2>${t[LANG].details}</h2>
          <div id="${laneId(i, 'output')}" class="output">${t[LANG].empty}</div>
        </section>`;

      const wrap = document.createElement('div');
      wrap.className = 'lane';
      wrap.innerHTML = paramsHTML + kpiHTML + outHTML;
      return wrap;
    }

    function updatePlanUI(i) {
      const sel = id => document.getElementById(laneId(i, id));
      const a = ACCOUNTS[sel('plan').value];
      sel('filesField').style.display = a.apiAvailable ? '' : 'none';
      sel('kpiBlockFiles').style.display = a.apiAvailable ? '' : 'none';
      sel('kpiBlockApi').style.display = a.apiAvailable ? '' : 'none';
    }

    function updatePlanUIAll() {
      for (let i = 0; i < lanesCount; i++) updatePlanUI(i);
    }

    function wireLane(i) {
      const sel = id => document.getElementById(laneId(i, id));
      const run = () => runSimulation(i);

      sel('calc').addEventListener('click', run);
      sel('plan').addEventListener('change', () => { updatePlanUI(i); run(); });
      sel('files')?.addEventListener('input', run);
      sel('users').addEventListener('input', run);
    }

    function ensureLanes(n) {
      lanesCount = Math.max(1, Math.min(3, n));
      lanesEl.classList.toggle('cols-2', lanesCount === 2);
      lanesEl.classList.toggle('cols-3', lanesCount === 3);

      const prev = [];
      lanesEl.querySelectorAll('.lane').forEach((lane, idx) => {
        prev.push({
          plan: (lane.querySelector(`#${laneId(idx, 'plan')}`) || {}).value || 'enterprise',
          files: (lane.querySelector(`#${laneId(idx, 'files')}`) || {}).value,
          users: (lane.querySelector(`#${laneId(idx, 'users')}`) || {}).value,
        });
      });

      lanesEl.innerHTML = '';
      for (let i = 0; i < lanesCount; i++) {
        lanesEl.appendChild(makeLane(i, prev[i] || { plan: 'enterprise', files: '', users: 10 }));
      }
      for (let i = 0; i < lanesCount; i++) wireLane(i);

      inlineBtn.textContent = inlineCompareLabel();
      updatePlanUIAll();
    }

    function runSimulation(i) {
      const sel = id => document.getElementById(laneId(i, id));
      const a = ACCOUNTS[sel('plan').value];

      const files = a.apiAvailable ? parseInt(sel('files').value || '0', 10) : 0;
      const users = parseInt(sel('users').value || String(a.includesUsers), 10);

      const kpis = document.getElementById(laneId(i, 'kpis'));
      const out = sel('output');

      if (isNaN(users) || users < 1) {
        out.textContent = t[LANG].empty;
        kpis.style.display = 'none';
        return;
      }

      const res = buildSimulationHTML(files, users, a);
      out.innerHTML = res.html;
      kpis.style.display = 'block';

      if (a.apiAvailable) {
        document.getElementById(laneId(i, 'kpiFiles')).textContent = fmtNumber(files);
        document.getElementById(laneId(i, 'kpiApi')).textContent = fmtMoney(res.apiTotal);
      }
      document.getElementById(laneId(i, 'kpiUsers')).textContent = fmtNumber(users);
      document.getElementById(laneId(i, 'kpiUserFees')).textContent = fmtMoney(res.userExtra);
      document.getElementById(laneId(i, 'kpiTotal')).textContent = fmtMoney(res.totalMonthly);

      const banner = document.getElementById(laneId(i, 'totalBanner'));
      banner.textContent = t[LANG].total + fmtMoney(res.totalMonthly);
      banner.className = 'total' + ((res.apiTotal + res.userExtra) === 0 ? ' warn' : '');
    }

    /* =============================================================================
       7) PRICING MODAL
       ============================================================================= */
    function getVisiblePlans() {
      const seen = new Set();
      for (let i = 0; i < lanesCount; i++) {
        const el = document.getElementById(`plan-${i}`);
        if (el && el.value) seen.add(el.value);
      }
      if (seen.size === 0) seen.add('enterprise');
      return Array.from(seen);
    }

    function userTableFor(plan) {
      const title = (LANG === 'fr' ? plan.name_fr : plan.name_en);

      const includedLabel = LANG === 'fr'
        ? 'Les 10 premiers utilisateurs sont inclus'
        : 'The first 10 users are included';
      const includedInPlan = LANG === 'fr'
        ? `Inclus dans le forfait ${title}`
        : `Included in the ${title} plan`;

      let rows = `
        <tr>
          <td>${includedLabel}</td>
          <td>${fmtNumber(plan.includesUsers)}</td>
          <td>${includedInPlan}</td>
          <td>${fmtMoney(0)}</td>
        </tr>`;

      let prevIncluded = plan.includesUsers;
      let cumulativeExtras = 0;

      for (const [limit, rate] of plan.userSegments) {
        const range =
          limit === Infinity
            ? `${fmtNumber(prevIncluded + 1)} ${t[LANG].andUp}`
            : `${fmtNumber(prevIncluded + 1)} – ${fmtNumber(limit)}`;

        const monthlyAtTierStart = fmtMoney(plan.base + cumulativeExtras);

        rows += `
          <tr>
            <td>${range}</td>
            <td>${fmtNumber(prevIncluded)}</td>
            <td>${monthlyAtTierStart}</td>
            <td>${fmtMoney(rate)}</td>
          </tr>`;

        const segCount = (limit === Infinity ? 0 : (limit - prevIncluded));
        cumulativeExtras += segCount * rate;
        prevIncluded = limit;
      }

      return `
        <div class="section-title" style="margin:10px 0 6px;font-weight:700;color:var(--ink);">${title}</div>
        <table class="price-table">
          <thead>
            <tr>
              <th>${LANG === 'fr' ? 'Paliers d’utilisateurs' : 'User tiers'}</th>
              <th>${LANG === 'fr' ? 'n. d’utilisateurs inclus' : 'Number of users included'}</th>
              <th>${LANG === 'fr' ? 'Prix mensuel' : 'Monthly price'}</th>
              <th>${LANG === 'fr' ? 'Prix par utilisateur supplémentaire' : 'Price per additional user'}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    function renderPricingTables() {
      pricingTitle.textContent = t[LANG].infoTitle;

      const visible = getVisiblePlans();
      const order = ['basic', 'pro', 'enterprise'];
      let html = '';

      if (visible.includes('enterprise')) {
        let apiRows = `
          <tr>
            <td>1–100</td>
            <td>${fmtNumber(100)}</td>
            <td>${LANG === 'fr' ? 'Inclus dans le forfait Entreprise' : 'Included in the Enterprise plan'}</td>
            <td>${fmtMoney(0)}</td>
          </tr>`;

        for (let i = 1; i < API_TIERS.length; i++) {
          const limit = API_TIERS[i][0];
          const prev = API_TIERS[i - 1][0];
          const rate = API_TIERS[i][2];
          const base = API_TIERS[i - 1][1];

          const range = (limit === Infinity)
            ? `${fmtNumber(prev + 1)} ${t[LANG].andUp}`
            : `${fmtNumber(prev + 1)} – ${fmtNumber(limit)}`;

          apiRows += `
            <tr>
              <td>${range}</td>
              <td>${fmtNumber(prev)}</td>
              <td>${fmtMoney(base)}</td>
              <td>${fmtMoney(rate)}</td>
            </tr>`;
        }

        html += `
          <div class="section-title" style="margin:10px 0 6px;font-weight:700;color:var(--ink);">
            ${LANG === 'fr' ? 'API (dossiers)' : 'API (files)'}
          </div>
          <table class="price-table">
            <thead>
              <tr>
                <th>${LANG === 'fr' ? 'Nombre de dossiers complétés par mois' : 'Number of completed folders per month'}</th>
                <th>${LANG === 'fr' ? 'Nombre de dossiers inclus' : 'Number of envelopes included'}</th>
                <th>${LANG === 'fr' ? 'Prix mensuel' : 'Monthly price'}</th>
                <th>${LANG === 'fr' ? 'Prix par dossier complété supplémentaire' : 'Price per additional completed folders'}</th>
              </tr>
            </thead>
            <tbody>${apiRows}</tbody>
          </table>`;
      }

      for (const key of order) {
        if (visible.includes(key)) html += userTableFor(ACCOUNTS[key]);
      }

      html += `
        <p class="muted" style="margin-top:10px">
          ${LANG === 'fr'
            ? 'Contenu ajusté selon les forfaits visibles à l’écran. La grille API apparaît seulement si le forfait Entreprise est présent.'
            : 'Content adapts to the plans visible on screen. The API grid appears only when Enterprise is present.'}
        </p>`;

      pricingBody.innerHTML = html;
    }

    /* =============================================================================
       8) COMPARE MODAL
       ============================================================================= */
    function renderCompareModal() {
      compareTitle.textContent = t[LANG].compareTitle;

      const files = parseInt((document.getElementById('files-0') || {}).value || '0', 10);
      const users = parseInt((document.getElementById('users-0') || {}).value || '10', 10);

      const rows = [];
      const results = [];

      for (const key of ['basic', 'pro', 'enterprise']) {
        const p = ACCOUNTS[key];
        const F = p.apiAvailable ? files : 0;
        const U = users;
        const bF = apiCostBreakdown(F, p);
        const bU = userCostBreakdown(U, p);
        const total = p.base + bF.apiTotal + bU.userTotal;

        results.push({ key, total });

        rows.push(`
          <tr>
            <td>${LANG === 'fr' ? p.name_fr : p.name_en}</td>
            <td>${fmtMoney(p.base)}</td>
            <td>${fmtNumber(U)}</td>
            <td>${fmtMoney(bU.userTotal)}</td>
            <td>${p.apiAvailable ? fmtMoney(bF.apiTotal) : '—'}</td>
            <td data-t="${total}">${fmtMoney(total)}</td>
          </tr>`);
      }

      const best = results.reduce((a, b) => a.total < b.total ? a : b);

      compareBody.innerHTML = `
        <table class="price-table">
          <thead>
            <tr>
              <th>${t[LANG].thPlan}</th>
              <th>${t[LANG].thBase}</th>
              <th>${t[LANG].thUsers}</th>
              <th>${t[LANG].thUserFees}</th>
              <th>${t[LANG].thApiFees}</th>
              <th>${t[LANG].thTotal}</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}</tbody>
        </table>
        <p class="muted" style="margin-top:8px">
          ${LANG === 'fr' ? 'Comparaison basée sur la colonne A.' : 'Comparison uses column A inputs.'}
          <span class="badge">${LANG === 'fr' ? 'Meilleur prix' : 'Best price'}</span> ,
          ${LANG === 'fr' ? ACCOUNTS[best.key].name_fr : ACCOUNTS[best.key].name_en}
        </p>`;

      compareBody.querySelectorAll('td[data-t]').forEach(td => {
        if (Number(td.dataset.t) === best.total) {
          td.innerHTML = `<span class="badge">${fmtMoney(best.total)}</span>`;
        }
      });
    }

    /* =============================================================================
       9) OFFER OF SERVICE
       ============================================================================= */
    function formatDateLocal(d) {
      return d.toLocaleDateString(LANG === 'fr' ? 'fr-CA' : 'en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    function formatDateOffer(d) {
  return d.toLocaleDateString(OFFER_LANG === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

    function moneyPlainOffer(n) {
  const s = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  return (OFFER_LANG === 'fr' ? s.replace('.', ',') : s) + ' $';
}


    function addMonthsSafe(date, months) {
      const d = new Date(date);
      const day = d.getDate();
      d.setMonth(d.getMonth() + months);
      if (d.getDate() < day) d.setDate(0);
      return d;
    }

    function refreshOfferDatesNoteOnly(){
  const today = new Date();
  const validUntil = addMonthsSafe(today, 3);

  if (!offerDatesNote) return;

  // Labels follow website language (LANG)
  // Date format follows offer language (OFFER_LANG)
  offerDatesNote.innerHTML = LANG === 'fr'
    ? `Date , <b>${formatDateOffer(today)}</b><br>Offre valide jusqu’au , <b>${formatDateOffer(validUntil)}</b>`
    : `Date, <b>${formatDateOffer(today)}</b><br>Valid until, <b>${formatDateOffer(validUntil)}</b>`;
}

    function moneyPlain(n) {
      const s = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
      return (LANG === 'fr' ? s.replace('.', ',') : s) + ' $';
    }

function buildOfferSimulationBlock(planKey, files, users) {
  const acct = ACCOUNTS[planKey];
const planName = (OFFER_LANG === 'fr' ? acct.name_fr : acct.name_en);

  const f = acct.apiAvailable ? Math.max(0, Math.floor(Number(files) || 0)) : 0;
  const u = Math.max(1, Math.floor(Number(users) || acct.includesUsers));

  const bF = apiCostBreakdown(f, acct);
  const bU = userCostBreakdown(u, acct);

  // ✅ Correct tier base + included users for the ACTIVE tier
  const includedAtTier = bU.prevLimit;                 // ex: 20 for 21–50
  const baseTierPrice = acct.base + bU.prevBase;       // ex: 326.40 for 21–50

  const extraUsersAtTier = Math.max(0, u - includedAtTier);

  const totalMonthly = acct.base + bF.apiTotal + bU.userTotal;

  const userTierMin = (bU.prevLimit + 1);
  const userTierMax = findUserTierLimit(u, acct);

  const introRange =
    u <= acct.includesUsers
      ? (OFFER_LANG === 'fr'

          ? `1 à ${fmtNumber(acct.includesUsers)} utilisateurs`
          : `1 to ${fmtNumber(acct.includesUsers)} users`)
      : (OFFER_LANG === 'fr'

          ? `${fmtNumber(userTierMin)} à ${String(userTierMax)} utilisateurs`
          : `${fmtNumber(userTierMin)} to ${String(userTierMax)} users`);

const moneyPlainLocal = n => moneyPlainOffer(n);

  const lines = [];

  // Header

  lines.push('');
  lines.push(OFFER_LANG === 'fr' ? `Pour le plan ${planName}` : `For the ${planName} plan`);
  lines.push('');
  lines.push(
    OFFER_LANG === 'fr'
      ? `Le prix mensuel pour ${u} utilisateur${u > 1 ? 's' : ''} se calcule de cette façon :`
      : `The monthly price for ${u} user${u > 1 ? 's' : ''} is calculated as follows:`
  );
  lines.push('');

  // User tier explanation
  lines.push(
    OFFER_LANG === 'fr'
      ? `Si vous avez ${u} utilisateur${u > 1 ? 's' : ''}, vous êtes dans la fourchette des ${introRange}.`
      : `If you have ${u} user${u > 1 ? 's' : ''}, you are in the ${introRange} range.`
  );
  lines.push('');

  // ✅ Use tier base price + tier included users (not plan base + 10)
  lines.push(
    OFFER_LANG === 'fr'

      ? `Le coût de base de ${moneyPlainLocal(baseTierPrice)} comprend ${fmtNumber(includedAtTier)} utilisateur${includedAtTier > 1 ? 's' : ''}.`
      : `The base cost of ${moneyPlainLocal(baseTierPrice)} includes ${fmtNumber(includedAtTier)} user${includedAtTier > 1 ? 's' : ''}.`
  );

const displayedUserRate = (u < acct.includesUsers) ? 0 : userCostBreakdown(acct.includesUsers + 1, acct).rate;

  lines.push(
    OFFER_LANG === 'fr'

      ? `Les utilisateurs supplémentaires sont facturés au coût de ${moneyPlainLocal(displayedUserRate)} chacun.`
      : `Additional users are billed at ${moneyPlainLocal(displayedUserRate)} each.`
  );

  // Detailed user calc
  lines.push('');
  lines.push(OFFER_LANG === 'fr' ? 'Calcul détaillé du prix mensuel' : 'Detailed monthly price calculation');

  if (extraUsersAtTier <= 0) {
    // ✅ If no extra users in this tier, show clean equality
    lines.push(`= ${moneyPlainLocal(baseTierPrice)} = ${moneyPlainLocal(baseTierPrice)}`);
  } else {
    // ✅ Correct formula uses tier base and tier included users
    lines.push(
      `= ${moneyPlainLocal(baseTierPrice)} + ((${u} − ${includedAtTier}) × ${moneyPlainLocal(bU.rate)}) = ${moneyPlainLocal(baseTierPrice + (extraUsersAtTier * bU.rate))}`
    );
  }

  // API block (only if Enterprise)
  if (acct.apiAvailable && files > 0 ) {

    lines.push('');

    const apiTierMax = findApiTierLimit(f);
    const apiTierMin = (bF.prevLimit + 1);

    const apiRange =
      f <= acct.includesFiles
        ? (OFFER_LANG === 'fr'
            ? `1 à ${fmtNumber(acct.includesFiles)} API`
            : `1 to ${fmtNumber(acct.includesFiles)} API`)
        : (apiTierMax === '∞'
            ? `${fmtNumber(apiTierMin)} ${t[OFFER_LANG].andUp}`
            : `${fmtNumber(apiTierMin)} à ${fmtNumber(apiTierMax)} API`);

    lines.push(
      OFFER_LANG === 'fr'
        ? `Si vous avez ${fmtNumber(f)} API, vous êtes dans la fourchette des ${apiRange}.`
        : `If you have ${fmtNumber(f)} API, you are in the ${apiRange} range.`
    );
    lines.push('');
    // ✅ Included/base line should match the ACTIVE API tier (prevLimit + prevBase)
    // If you're still within the plan-included 1–100, we keep the classic message.
    if (f <= acct.includesFiles) {
      lines.push(
        OFFER_LANG === 'fr'
          ? `Les ${fmtNumber(acct.includesFiles)} premières API sont incluses dans le forfait.`
          : `The first ${fmtNumber(acct.includesFiles)} API are included in the plan.`
      );
    } else {
      // Example for 2,500 API:
      // prevLimit = 1100 (tier base included), prevBase = 1485.50 (tier base price), rate = 1.21
      lines.push(
        OFFER_LANG === 'fr'
          ? `Les ${fmtNumber(bF.prevLimit)} premiers envois API sont inclus dans le forfait pour ${moneyPlainLocal(bF.prevBase)}.`
          : `The first ${fmtNumber(bF.prevLimit)} API sends are included in the plan for ${moneyPlainLocal(bF.prevBase)}.`
      );
    }

    if (f > acct.includesFiles) {
      lines.push(
        OFFER_LANG === 'fr'
          ? `Les API supplémentaires sont facturées au coût de ${moneyPlainLocal(bF.rate)} chacune.`
          : `Additional API are billed at ${moneyPlainLocal(bF.rate)} each.`
      );
      lines.push('');
      lines.push(OFFER_LANG === 'fr' ? 'Calcul détaillé des frais API' : 'Detailed API fee calculation');
      lines.push(
        `= ${moneyPlainLocal(bF.prevBase)} + (${fmtNumber(bF.inTierCount)} × ${moneyPlainLocal(bF.rate)}) = ${moneyPlainLocal(bF.apiTotal)}`
      );
    } else {
      lines.push(
        OFFER_LANG === 'fr'
          ? `Aucun frais d’API.`
          : `No API fees.`
      );
    }
  }

  // Total
  lines.push('');
  lines.push(
    OFFER_LANG === 'fr'
      ? `Sous-total mensuel`
      : `Monthly subtotal`
  );
  lines.push(moneyPlainLocal(totalMonthly));

  return lines.join('\n');
}

function buildDiscussAsDiscussedBlock(planKey, apiFiles) {
  const isEN = (OFFER_LANG === 'en');
  const hasAPI = (planKey === 'enterprise' && Number(apiFiles || 0) > 0);

  if (isEN) {
    if (planKey === 'basic') {
      return [
        '• Unlimited documents and signings',
        '• eZsign e-signatures are legal and secure',
        '• Training sessions are included at no extra cost.',
        '• All data is securely hosted in Canada, ensuring compliance with Canadian regulations.',
      ].join('\n');
    }

    if (planKey === 'pro') {
      return [
        '• Unlimited documents and signings',
        '• eZsign e-signatures are legal and secure',
        '• Personalized branding',
        '• Training sessions are included at no extra cost.',
        '• All data is securely hosted in Canada, ensuring compliance with Canadian regulations.',
      ].join('\n');
    }

    // enterprise
    if (hasAPI) {
      return [
        '• Unlimited manual document sending and signings via the eZsign platform',
        '• Only completed API folders count toward your monthly usage',
        '• Personalized branding included (custom colors, logos, and email appearance)',
        '• Multiple billing entities and different logos can be configured per account',
      ].join('\n');
    }

    // enterprise without API
    return [
      '• Unlimited documents and signings',
      '• eZsign e-signatures are legal and secure',
      '• Personalized branding',
      '• Training sessions are included at no extra cost.',
      '• All data is securely hosted in Canada, ensuring compliance with Canadian regulations.',
    ].join('\n');
  }

  // FR
  if (planKey === 'basic') {
    return [
      '• Documents et signatures illimités',
      '• Les signatures électroniques eZsign sont légales et sécurisées',
      '• Les formations sont incluses sans frais supplémentaires.',
      '• Toutes les données sont hébergées de façon sécurisée au Canada, assurant la conformité aux réglementations canadiennes.',
    ].join('\n');
  }

  if (planKey === 'pro') {
    return [
      '• Documents et signatures illimités',
      '• Les signatures électroniques eZsign sont légales et sécurisées',
      '• Image de marque incluse (couleurs, logos et apparence des courriels)',
      '• Les formations sont incluses sans frais supplémentaires.',
      '• Toutes les données sont hébergées de façon sécurisée au Canada, assurant la conformité aux réglementations canadiennes.',
    ].join('\n');
  }

  // enterprise
  if (hasAPI) {
    return [
      '• Envois et signatures manuels illimités via la plateforme eZsign',
      '• Seuls les dossiers API complétés comptent dans votre utilisation mensuelle',
      '• Personnalisation de la marque incluse (couleurs, logos et apparence des courriels)',
      '• Plusieurs entités de facturation et différents logos peuvent être configurés par compte',
    ].join('\n');
  }

  // enterprise without API
  return [
    '• Documents et signatures illimités',
    '• Les signatures électroniques eZsign sont légales et sécurisées',
    '• Image de marque incluse (couleurs, logos et apparence des courriels)',
    '• Les formations sont incluses sans frais supplémentaires.',
    '• Toutes les données sont hébergées de façon sécurisée au Canada, assurant la conformité aux réglementations canadiennes.',
  ].join('\n');
}


    function updateOfferPreview() {
      if (!offerPreview || !offerPlan || !offerUsers) return;

      const planKey = offerPlan.value || 'enterprise';
      const acct = ACCOUNTS[planKey];
      const files = acct.apiAvailable && offerFiles ? offerFiles.value : 0;
      const users = offerUsers.value;

      offerPreview.value = buildOfferSimulationBlock(planKey, files, users);
    }

    function refreshOfferUI() {
      if (!offerTitle || !offerPlan) return;

      offerTitle.textContent = LANG === 'fr' ? 'Offre de service' : 'Service offer';

      const planKey = offerPlan.value || 'enterprise';
      const acct = ACCOUNTS[planKey];

      if (offerFilesField) offerFilesField.style.display = acct.apiAvailable ? '' : 'none';

      refreshOfferDatesNoteOnly();
    }

function openOfferModal() {
  if (!offerModal) return;

  // Sync toggle UI to current offer language
  setOfferLang(OFFER_LANG);

  refreshOfferUI();
  offerModal.classList.add('open');
  offerModal.setAttribute('aria-hidden', 'false');
  if (offerCompanyName) offerCompanyName.focus();
}


function setOfferLang(lang){
  OFFER_LANG = (lang === 'en') ? 'en' : 'fr';
  localStorage.setItem('ez_offer_lang', OFFER_LANG);

  const btns = document.querySelectorAll('[data-offer-lang]');
  btns.forEach(b => {
    const active = b.dataset.offerLang === OFFER_LANG;
    b.classList.toggle('isActive', active);
    b.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  // ✅ Refresh only the offer preview + offer dates in the modal
  updateOfferPreview();
  refreshOfferDatesNoteOnly();
}




    async function downloadBlobAsFile(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    /* =============================================================================
       10) THEME, LANG, EVENTS, BOOTSTRAP
       ============================================================================= */
    function setTheme(theme) {
      THEME = theme;
      localStorage.setItem('ez_theme', THEME);
      document.documentElement.setAttribute('data-theme', THEME);
      if (themeBtn) themeBtn.textContent = THEME === 'dark' ? t[LANG].themeDark : t[LANG].themeLight;
    }
    // Offer language buttons (FR/EN next to company name)
document.querySelectorAll('[data-offer-lang]').forEach(btn => {
  btn.addEventListener('click', () => setOfferLang(btn.dataset.offerLang));
});


    function setLang(lang) {
      LANG = lang;
      localStorage.setItem('ez_lang', LANG);

      moneyFmt = new Intl.NumberFormat(LANG === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' });
      numFmt = new Intl.NumberFormat(LANG === 'fr' ? 'fr-CA' : 'en-CA');

      if (titleEl) titleEl.textContent = t[LANG].title;
      if (compareBtn) compareBtn.textContent = t[LANG].compareTop;
      if (themeBtn) themeBtn.textContent = THEME === 'dark' ? t[LANG].themeDark : t[LANG].themeLight;
      if (langBtn) langBtn.textContent = LANG === 'fr' ? 'EN' : 'FR';
      if (inlineBtn) inlineBtn.textContent = inlineCompareLabel();

      ensureLanes(lanesCount);

      if (pricingModal && pricingModal.classList.contains('open')) renderPricingTables();
      if (compareModal && compareModal.classList.contains('open')) renderCompareModal();



      refreshOfferUI();
    }

    // Top bar
    if (langBtn) langBtn.onclick = () => setLang(LANG === 'fr' ? 'en' : 'fr');
    if (themeBtn) themeBtn.onclick = () => setTheme(THEME === 'light' ? 'dark' : 'light');

    if (infoBtn) {
      infoBtn.onclick = () => {
        renderPricingTables();
        if (pricingModal) {
          pricingModal.classList.add('open');
          pricingModal.setAttribute('aria-hidden', 'false');
        }
      };
    }

    if (compareBtn) {
      compareBtn.onclick = () => {
        renderCompareModal();
        if (compareModal) {
          compareModal.classList.add('open');
          compareModal.setAttribute('aria-hidden', 'false');
        }
      };
    }

    // Offer open
    if (offerBtn) offerBtn.addEventListener('click', openOfferModal);

    if (offerPlan) offerPlan.addEventListener('change', refreshOfferUI);
    if (offerFiles) offerFiles.addEventListener('input', updateOfferPreview);
    if (offerUsers) offerUsers.addEventListener('input', updateOfferPreview);

    if (offerGenerateBtn) {
      offerGenerateBtn.addEventListener('click', async () => {
        const companyName = (offerCompanyName?.value || '').trim();
        if (!companyName) {
          alert(LANG === 'fr' ? 'Entre le nom de la compagnie.' : 'Enter the company name.');
          offerCompanyName?.focus();
          return;
        }

        const planKey = offerPlan?.value || 'enterprise';
        const acct = ACCOUNTS[planKey];

        const users = Math.max(1, Math.floor(Number(offerUsers?.value) || acct.includesUsers));
        const files = acct.apiAvailable ? Math.max(0, Math.floor(Number(offerFiles?.value) || 0)) : 0;

        const today = new Date();
        const validUntil = addMonthsSafe(today, 3);

        const simulationBlock = buildOfferSimulationBlock(planKey, files, users);

// ✅ NEW: "Tel que discuté" block (depends on plan + API + offer language)
const discussedBlock = buildDiscussAsDiscussedBlock(planKey, files);

const payload = {
  companyName,
  date: formatDateOffer(today),
  validUntil: formatDateOffer(validUntil),
  simulationBlock,
  discussedBlock,      // ✅ NEW: sent to Python
  offerLang: OFFER_LANG,
};


        offerGenerateBtn.disabled = true;
        offerGenerateBtn.textContent = LANG === 'fr' ? 'Génération en cours...' : 'Generating...';

        try {
          const res = await fetch('https://nine-legend-suspected-dicke.trycloudflare.com/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

              if (!res.ok) {
              const txt = await res.text();
              alert((LANG === 'fr' ? 'Erreur génération, ' : 'Generation error, ') + txt);
              return;
            }
            
            // ✅ Le serveur renvoie maintenant un fichier (docx/pdf), pas du JSON
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Nom de fichier depuis le header (si présent)
            let filename = 'Offer.docx';
            const dispo = res.headers.get('content-disposition');
            if (dispo && dispo.includes('filename=')) {
              filename = dispo.split('filename=')[1].replace(/"/g, '').trim();
            }
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            window.URL.revokeObjectURL(url);
                      

        } catch (e) {
          alert(LANG === 'fr'
            ? 'Impossible de joindre le serveur Python. Vérifie que server.py est lancé sur 127.0.0.1:5055.'
            : 'Cannot reach the Python server. Make sure server.py is running on 127.0.0.1:5055.'
          );
        } finally {
          offerGenerateBtn.disabled = false;
          offerGenerateBtn.textContent = LANG === 'fr' ? 'Générer Word + PDF' : 'Generate Word + PDF';
        }
      });
    }

    // Inline compare
    if (inlineBtn) {
      inlineBtn.onclick = () => {
        const next = (lanesCount === 1) ? 2 : (lanesCount === 2) ? 3 : 1;
        ensureLanes(next);
      };
    }

    // Generic modal close
    document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => {
      const m = el.closest('.modal');
      if (!m) return;
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    }));
    document.querySelectorAll('.modal .backdrop').forEach(el => el.addEventListener('click', () => {
      const m = el.closest('.modal');
      if (!m) return;
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    }));

    /* =============================================================================
       11) INITIAL BOOT
       ============================================================================= */
    setTheme(THEME);
    setLang(LANG);
    ensureLanes(1);

    /* =============================================================================
       12) PRICING RENDER (needs functions defined after setLang call)
       ============================================================================= */
    function renderPricingTables() {
      if (!pricingBody || !pricingTitle) return;

      pricingTitle.textContent = t[LANG].infoTitle;

      const visible = getVisiblePlans();
      const order = ['basic', 'pro', 'enterprise'];
      let html = '';

      if (visible.includes('enterprise')) {
        let apiRows = `
          <tr>
            <td>1–100</td>
            <td>${fmtNumber(100)}</td>
            <td>${LANG === 'fr' ? 'Inclus dans le forfait Entreprise' : 'Included in the Enterprise plan'}</td>
            <td>${fmtMoney(0)}</td>
          </tr>`;

        for (let i = 1; i < API_TIERS.length; i++) {
          const limit = API_TIERS[i][0];
          const prev = API_TIERS[i - 1][0];
          const rate = API_TIERS[i][2];
          const base = API_TIERS[i - 1][1];

          const range = (limit === Infinity)
            ? `${fmtNumber(prev + 1)} ${t[LANG].andUp}`
            : `${fmtNumber(prev + 1)} – ${fmtNumber(limit)}`;

          apiRows += `
            <tr>
              <td>${range}</td>
              <td>${fmtNumber(prev)}</td>
              <td>${fmtMoney(base)}</td>
              <td>${fmtMoney(rate)}</td>
            </tr>`;
        }

        html += `
          <div class="section-title" style="margin:10px 0 6px;font-weight:700;color:var(--ink);">
            ${LANG === 'fr' ? 'API (dossiers)' : 'API (files)'}
          </div>
          <table class="price-table">
            <thead>
              <tr>
                <th>${LANG === 'fr' ? 'Nombre de dossiers complétés par mois' : 'Number of completed folders per month'}</th>
                <th>${LANG === 'fr' ? 'Nombre de dossiers inclus' : 'Number of envelopes included'}</th>
                <th>${LANG === 'fr' ? 'Prix mensuel' : 'Monthly price'}</th>
                <th>${LANG === 'fr' ? 'Prix par dossier complété supplémentaire' : 'Price per additional completed folders'}</th>
              </tr>
            </thead>
            <tbody>${apiRows}</tbody>
          </table>`;
      }

      for (const key of order) {
        if (visible.includes(key)) html += userTableFor(ACCOUNTS[key]);
      }

      html += `
        <p class="muted" style="margin-top:10px">
          ${LANG === 'fr'
            ? 'Contenu ajusté selon les forfaits visibles à l’écran. La grille API apparaît seulement si le forfait Entreprise est présent.'
            : 'Content adapts to the plans visible on screen. The API grid appears only when Enterprise is present.'}
        </p>`;

      pricingBody.innerHTML = html;
    }
  });
})();



