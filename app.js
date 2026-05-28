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

      perFolder: {
        key: 'perFolder',
        name_fr: 'Entreprise par envois',
        name_en: 'Enterprise per-sent',
        base: 222.80,
        includesFiles: 0,
        includesUsers: 10,
        apiAvailable: false,
        filePricing: 'perSent',
        unlimitedUsers: true,
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

    // Enterprise per-sent tiers
    // [upperLimit, sendsIncludedAtTierStart, monthlyPriceAtTierStart, pricePerAdditionalSend]
    const FOLDER_TIERS = [
      [100, 0, 0.00, 2.00],
      [500, 100, 200.00, 1.85],
      [1000, 500, 940.00, 1.73],
      [2500, 1000, 1805.00, 1.63],
      [5000, 2500, 4250.00, 1.55],
      [10000, 5000, 8125.00, 1.50],
      [25000, 10000, 15625.00, 1.40],
      [50000, 25000, 36575.00, 1.28],
      [Infinity, 50000, 68575.00, 1.10],
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
        folderRow: (pb, c, r) => `Frais dossiers = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
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
        thApiFees: 'Frais envois/API',
        thTotal: 'Total',
        andUp: 'et plus',
        offerTop: 'Offre de service',
        offerTitle: 'Offre de service',
        companyName: 'Nom de la compagnie',
        companyPlaceholder: 'Ex, MRC de L’Érable',
        offerLanguage: 'Langue de l’offre',
        proposalCreator: 'Créée par',
        proposalCreatorOther: 'Autre',
        creatorName: 'Nom',
        creatorEmail: 'Courriel',
        simulation: 'Simulation',
        addSimulation: '+ Ajouter une simulation',
        maxSimulations: 'Maximum 3 simulations',
        removeSimulation: 'Retirer',
        accountByFolder: 'Entreprise par envois',
        folderCount: 'Nombre d’envois',
        apiCount: 'Nombre de dossiers API',
        generateOffer: 'Générer Word + PDF',
        generateWordOnly: 'Générer Word',
        generatePdfOnly: 'Générer PDF',
        generateWordPdf: 'Générer Word + PDF',
        generatingOffer: 'Génération en cours...',
        offerPreview: 'Aperçu, section SIMULATION',
        enterCompany: 'Entre le nom de la compagnie.',
        enterCreator: 'Entre le nom et le courriel de la personne qui prépare l’offre.',
        generationError: 'Erreur génération, ',
        generationServerError: 'Impossible de joindre le serveur Python. Vérifie que server.py est lancé sur 127.0.0.1:5055.',
        folderFees: 'Frais envois',
        unlimitedUsers: 'Utilisateurs illimités',
        sentRow: (pb, c, r) => `Frais d’envois = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
        featureButton: 'Comme discuté',
        featureTitle: 'Fonctionnalités discutées',
        featureIntro: 'Coche les fonctionnalités et rappels à inclure dans la section « Comme discuté » de cette simulation.',
        featureOther: 'Autre élément',
        featureOtherPlaceholder: 'Écris un élément à ajouter à la section « Comme discuté ».',
        featureApply: 'Appliquer',
        featureDefaults: 'Suggestions par défaut',
        outputWord: 'Document Word',
        outputPdf: 'PDF',
        chooseOutput: 'Choisis au moins un format à générer.',
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
        folderRow: (pb, c, r) => `Folder fees = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
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
        thApiFees: 'Send/API fees',
        thTotal: 'Total',
        andUp: 'and up',
        offerTop: 'Service offer',
        offerTitle: 'Service offer',
        companyName: 'Company name',
        companyPlaceholder: 'e.g., MRC de L’Érable',
        offerLanguage: 'Offer language',
        proposalCreator: 'Created by',
        proposalCreatorOther: 'Other',
        creatorName: 'Name',
        creatorEmail: 'Email',
        simulation: 'Simulation',
        addSimulation: '+ Add a simulation',
        maxSimulations: 'Maximum 3 simulations',
        removeSimulation: 'Remove',
        accountByFolder: 'Enterprise per-sent',
        folderCount: 'Number of sends',
        apiCount: 'Number of API folders',
        generateOffer: 'Generate Word + PDF',
        generateWordOnly: 'Generate Word',
        generatePdfOnly: 'Generate PDF',
        generateWordPdf: 'Generate Word + PDF',
        generatingOffer: 'Generating...',
        offerPreview: 'Preview, SIMULATION section',
        enterCompany: 'Enter the company name.',
        enterCreator: 'Enter the name and email of the person preparing the offer.',
        generationError: 'Generation error, ',
        generationServerError: 'Cannot reach the Python server. Make sure server.py is running on 127.0.0.1:5055.',
        folderFees: 'Send fees',
        unlimitedUsers: 'Unlimited users',
        sentRow: (pb, c, r) => `Send fees = ${fmtMoney(pb)} + ${c} × ${fmtMoney(r)} = ${fmtMoney(pb + c * r)}`,
        featureButton: 'As discussed',
        featureTitle: 'Discussed features',
        featureIntro: 'Select the features and reminders to include in the “As discussed” section for this simulation.',
        featureOther: 'Other item',
        featureOtherPlaceholder: 'Write an item to add to the “As discussed” section.',
        featureApply: 'Apply',
        featureDefaults: 'Default suggestions',
        outputWord: 'Word document',
        outputPdf: 'PDF',
        chooseOutput: 'Choose at least one format to generate.',
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

    function folderCostBreakdown(files) {
      files = Math.max(0, Math.floor(Number(files) || 0));
      if (files <= 0) {
        return { files, prevLimit: 0, prevBase: 0, inTierCount: 0, rate: 2.00, apiTotal: 0 };
      }

      for (const [limit, included, base, rate] of FOLDER_TIERS) {
        if (files <= limit) {
          const inTierCount = files - included;
          const apiTotal = base + inTierCount * rate;
          return { files, prevLimit: included, prevBase: base, inTierCount, rate, apiTotal };
        }
      }

      return { files, prevLimit: 0, prevBase: 0, inTierCount: 0, rate: 0, apiTotal: 0 };
    }

    function hasFilePricing(account) {
      return account.apiAvailable || account.filePricing === 'perSent';
    }

    function fileCostBreakdown(files, account) {
      if (account.filePricing === 'perSent') return folderCostBreakdown(files);
      return apiCostBreakdown(files, account);
    }

    function hasUserPricing(account) {
      return !account.unlimitedUsers;
    }

    function userCostBreakdown(users, account) {
      if (account.unlimitedUsers) {
        return { users: 0, prevLimit: 0, prevBase: 0, inTierCount: 0, rate: 0, userTotal: 0 };
      }

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

    function findFolderTierLimit(files) {
      for (const [limit] of FOLDER_TIERS) {
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
      const bF = fileCostBreakdown(files, acct);
      const bU = userCostBreakdown(users, acct);

      const paidFiles = Math.max(0, hasFilePricing(acct) ? (files - acct.includesFiles) : 0);
      const paidUsers = hasUserPricing(acct) ? Math.max(0, users - acct.includesUsers) : 0;

      const total = acct.base + bF.apiTotal + bU.userTotal;
      const monthlyAtPrevLimit = acct.base + bU.prevBase;

      const name = LANG === 'fr' ? acct.name_fr : acct.name_en;
      const parts = [];

      parts.push(`<b>${t[LANG].sim}</b>`);
      if (acct.unlimitedUsers) {
        parts.push(LANG === 'fr'
          ? `Le forfait <b>${name}</b> comprend des <b>utilisateurs illimités</b>. Les envois manuels et API sont facturés selon l’utilisation mensuelle.`
          : `The <b>${name}</b> plan includes <b>unlimited users</b>. Manual and API sends are billed according to monthly usage.`);
      } else {
        parts.push(t[LANG].line2(name, acct.base, acct.includesUsers, acct.includesFiles));
      }

      if (hasFilePricing(acct) && files > 0) {
        if (paidFiles === 0) parts.push(t[LANG].noneFiles(acct.includesFiles));
        else {
          parts.push(t[LANG].mustPayFiles(paidFiles, acct.includesFiles));
          const limit = acct.filePricing === 'perSent' ? findFolderTierLimit(files) : findApiTierLimit(files);
          parts.push(t[LANG].tierFiles(files, bF.prevBase, bF.inTierCount, bF.rate, bF.prevLimit, limit));
        }
      }

      if (hasUserPricing(acct) && paidUsers === 0) parts.push(t[LANG].usersNone(acct.includesUsers));
      else if (hasUserPricing(acct)) {
        parts.push(t[LANG].usersMust(paidUsers));
        parts.push(t[LANG].usersTier(users, monthlyAtPrevLimit, bU.inTierCount, bU.rate, bU.prevLimit, findUserTierLimit(users, acct)));
      }

      parts.push(`<b>${t[LANG].month}</b>`);
      if (acct.unlimitedUsers) {
        parts.push(LANG === 'fr'
          ? `Forfait ${name} = ${fmtMoney(acct.base)}/mois (utilisateurs illimités)`
          : `${name} plan = ${fmtMoney(acct.base)}/month (unlimited users)`);
      } else {
        parts.push(t[LANG].entRow(name, acct.base, acct.includesUsers, acct.includesFiles));
      }
      if (hasFilePricing(acct)) {
        parts.push((acct.filePricing === 'perSent' ? t[LANG].sentRow : t[LANG].apiRow)(bF.prevBase, bF.inTierCount, bF.rate));
      }
      if (hasUserPricing(acct)) parts.push(t[LANG].usersRow(monthlyAtPrevLimit, bU.inTierCount, bU.rate));
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
    const offerCompanyLabel = document.getElementById('offerCompanyLabel');
    const offerSigner = document.getElementById('offerSigner');
    const offerSignerLabel = document.getElementById('offerSignerLabel');
    const offerSignerOtherFields = document.getElementById('offerSignerOtherFields');
    const offerSignerName = document.getElementById('offerSignerName');
    const offerSignerNameLabel = document.getElementById('offerSignerNameLabel');
    const offerSignerEmail = document.getElementById('offerSignerEmail');
    const offerSignerEmailLabel = document.getElementById('offerSignerEmailLabel');
    const offerSimulations = document.getElementById('offerSimulations');
    const addSimulationBtn = document.getElementById('addSimulationBtn');
    const offerGenerateBtn = document.getElementById('offerGenerateBtn');
    const offerPreview = document.getElementById('offerPreview');
    const offerPreviewLabel = document.getElementById('offerPreviewLabel');
    const offerDatesNote = document.getElementById('offerDatesNote');
    const outputWordCheck = document.getElementById('outputWordCheck');
    const outputPdfCheck = document.getElementById('outputPdfCheck');
    const outputWordLabel = document.getElementById('outputWordLabel');
    const outputPdfLabel = document.getElementById('outputPdfLabel');
    const featureModal = document.getElementById('featureModal');
    const featureModalTitle = document.getElementById('featureModalTitle');
    const featureModalIntro = document.getElementById('featureModalIntro');
    const featureChecklist = document.getElementById('featureChecklist');
    const featureOtherCheck = document.getElementById('featureOtherCheck');
    const featureOtherText = document.getElementById('featureOtherText');
    const featureOtherLabel = document.getElementById('featureOtherLabel');
    const featureDefaultsBtn = document.getElementById('featureDefaultsBtn');
    const featureSaveBtn = document.getElementById('featureSaveBtn');

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
        <option value="pro"${sel === 'pro' ? ' selected' : ''}>Business Pro</option>
        <option value="perFolder"${sel === 'perFolder' ? ' selected' : ''}>${t[LANG].accountByFolder}</option>`;
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

            <div class="field" id="${laneId(i, 'usersField')}">
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
      sel('filesField').style.display = hasFilePricing(a) ? '' : 'none';
      const filesLabel = sel('filesField')?.querySelector('label');
      if (filesLabel) filesLabel.textContent = a.filePricing === 'perSent' ? t[LANG].folderCount : t[LANG].files;
      const usersField = sel('usersField');
      if (usersField) usersField.style.display = hasUserPricing(a) ? '' : 'none';
      sel('kpiBlockFiles').style.display = hasFilePricing(a) ? '' : 'none';
      sel('kpiBlockApi').style.display = hasFilePricing(a) ? '' : 'none';
      const apiLabel = sel('kpiBlockApi')?.querySelector('.label');
      if (apiLabel) apiLabel.textContent = a.filePricing === 'perSent' ? t[LANG].folderFees : t[LANG].k_api;
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

      const files = hasFilePricing(a) ? parseInt(sel('files').value || '0', 10) : 0;
      const users = hasUserPricing(a) ? parseInt(sel('users').value || String(a.includesUsers), 10) : 0;

      const kpis = document.getElementById(laneId(i, 'kpis'));
      const out = sel('output');

      if (hasUserPricing(a) && (isNaN(users) || users < 1)) {
        out.textContent = t[LANG].empty;
        kpis.style.display = 'none';
        return;
      }

      const res = buildSimulationHTML(files, users, a);
      out.innerHTML = res.html;
      kpis.style.display = 'block';

      if (hasFilePricing(a)) {
        document.getElementById(laneId(i, 'kpiFiles')).textContent = fmtNumber(files);
        document.getElementById(laneId(i, 'kpiApi')).textContent = fmtMoney(res.apiTotal);
      }
      document.getElementById(laneId(i, 'kpiUsers')).textContent = hasUserPricing(a) ? fmtNumber(users) : t[LANG].unlimitedUsers;
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

    function folderTableHTML() {
      const rows = FOLDER_TIERS.map(([limit, included, base, rate], index) => {
        const start = included + 1;
        const range = limit === Infinity
          ? `${fmtNumber(start)} ${t[LANG].andUp}`
          : `${fmtNumber(start)} – ${fmtNumber(limit)}`;

        return `
          <tr>
            <td>${range}</td>
            <td>${fmtNumber(included)}</td>
            <td>${fmtMoney(base)}</td>
            <td>${fmtMoney(rate)}</td>
          </tr>`;
      }).join('');

      return `
        <div class="section-title" style="margin:10px 0 6px;font-weight:700;color:var(--ink);">
          ${LANG === 'fr' ? 'Tarif Entreprise par envois' : 'Enterprise per-sent pricing'}
        </div>
        <p class="muted" style="margin:0 0 8px">
          ${LANG === 'fr'
            ? 'Pour accéder à ce type de compte, vous devez payer des frais fixes mensuels de 222,80 $, même si aucun envoi n’est complété. Les envois manuels et API sont ensuite facturés selon le tableau ci-dessous.'
            : 'To access this type of account, you must pay a fixed monthly fee of $222.80, even if no send is completed. Manual and API sends are then billed according to the chart below.'}
        </p>
        <table class="price-table">
          <thead>
            <tr>
              <th>${LANG === 'fr' ? 'Envois mensuels' : 'Monthly sends'}</th>
              <th>${LANG === 'fr' ? 'Nombre d’envois inclus' : 'Number of sends included'}</th>
              <th>${LANG === 'fr' ? 'Prix mensuel' : 'Monthly price'}</th>
              <th>${LANG === 'fr' ? 'Prix par envoi supplémentaire' : 'Price per additional send'}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    function renderPricingTables() {
      pricingTitle.textContent = t[LANG].infoTitle;

      const visible = getVisiblePlans();
      const order = ['basic', 'pro', 'enterprise', 'perFolder'];
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

      if (visible.includes('perFolder')) {
        html += folderTableHTML();
      }

      for (const key of order) {
        if (visible.includes(key) && key !== 'perFolder') html += userTableFor(ACCOUNTS[key]);
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

      for (const key of ['basic', 'pro', 'enterprise', 'perFolder']) {
        const p = ACCOUNTS[key];
        const F = hasFilePricing(p) ? files : 0;
        const U = users;
        const bF = fileCostBreakdown(F, p);
        const bU = userCostBreakdown(U, p);
        const total = p.base + bF.apiTotal + bU.userTotal;

        results.push({ key, total });

        rows.push(`
          <tr>
            <td>${LANG === 'fr' ? p.name_fr : p.name_en}</td>
            <td>${fmtMoney(p.base)}</td>
            <td>${fmtNumber(U)}</td>
            <td>${fmtMoney(bU.userTotal)}</td>
            <td>${hasFilePricing(p) ? fmtMoney(bF.apiTotal) : '—'}</td>
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

    function fmtNumberOfferPlain(n) {
      return new Intl.NumberFormat(OFFER_LANG === 'fr' ? 'fr-CA' : 'en-CA').format(n);
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

function buildOfferSimulationBlock(planKey, files, users, simulationNumber, totalSimulations) {
  const acct = ACCOUNTS[planKey];
  const planName = (OFFER_LANG === 'fr' ? acct.name_fr : acct.name_en);
  const isPerSentPlan = acct.filePricing === 'perSent';
  const moneyPlainLocal = n => moneyPlainOffer(n);
  const fmtNumberLocal = n => fmtNumberOfferPlain(n);

  const f = hasFilePricing(acct) ? Math.max(0, Math.floor(Number(files) || 0)) : 0;
  const u = hasUserPricing(acct) ? Math.max(1, Math.floor(Number(users) || acct.includesUsers)) : 0;
  const bF = fileCostBreakdown(f, acct);
  const bU = userCostBreakdown(u, acct);
  const totalMonthly = acct.base + bF.apiTotal + bU.userTotal;

  const lines = [];

  lines.push(OFFER_LANG === 'fr' ? `Pour le plan ${planName}` : `For the ${planName} plan`);
  lines.push('');

  if (acct.unlimitedUsers) {
    lines.push(OFFER_LANG === 'fr'
      ? 'Ce compte comprend des utilisateurs illimités. Les frais sont calculés selon les envois manuels et API.'
      : 'This account includes unlimited users. Fees are calculated based on manual and API sends.');
  } else {
    const includedAtTier = bU.prevLimit;
    const baseTierPrice = acct.base + bU.prevBase;
    const extraUsersAtTier = Math.max(0, u - includedAtTier);
    const userTierMin = (bU.prevLimit + 1);
    const userTierMax = findUserTierLimit(u, acct);
    const introRange = u <= acct.includesUsers
      ? (OFFER_LANG === 'fr'
          ? `1 à ${fmtNumberLocal(acct.includesUsers)} utilisateurs`
          : `1 to ${fmtNumberLocal(acct.includesUsers)} users`)
      : (OFFER_LANG === 'fr'
          ? `${fmtNumberLocal(userTierMin)} à ${String(userTierMax)} utilisateurs`
          : `${fmtNumberLocal(userTierMin)} to ${String(userTierMax)} users`);
    const displayedUserRate = u <= acct.includesUsers
      ? userCostBreakdown(acct.includesUsers + 1, acct).rate
      : bU.rate;

    lines.push(OFFER_LANG === 'fr'
      ? `Le prix mensuel pour ${u} utilisateur${u > 1 ? 's' : ''} se calcule de cette façon :`
      : `The monthly price for ${u} user${u > 1 ? 's' : ''} is calculated as follows:`);
    lines.push('');
    lines.push(OFFER_LANG === 'fr'
      ? `Si vous avez ${u} utilisateur${u > 1 ? 's' : ''}, vous êtes dans la fourchette des ${introRange}.`
      : `If you have ${u} user${u > 1 ? 's' : ''}, you are in the ${introRange} range.`);
    lines.push('');
    lines.push(OFFER_LANG === 'fr'
      ? `Le coût de base de ${moneyPlainLocal(baseTierPrice)} comprend ${fmtNumberLocal(includedAtTier)} utilisateur${includedAtTier > 1 ? 's' : ''}.`
      : `The base cost of ${moneyPlainLocal(baseTierPrice)} includes ${fmtNumberLocal(includedAtTier)} user${includedAtTier > 1 ? 's' : ''}.`);
    lines.push(OFFER_LANG === 'fr'
      ? `Les utilisateurs supplémentaires sont facturés au coût de ${moneyPlainLocal(displayedUserRate)} chacun.`
      : `Additional users are billed at ${moneyPlainLocal(displayedUserRate)} each.`);
    lines.push('');
    lines.push(OFFER_LANG === 'fr' ? 'Calcul détaillé du prix mensuel' : 'Detailed monthly price calculation');
    lines.push(extraUsersAtTier <= 0
      ? `= ${moneyPlainLocal(baseTierPrice)} = ${moneyPlainLocal(baseTierPrice)}`
      : `= ${moneyPlainLocal(baseTierPrice)} + ((${u} − ${includedAtTier}) × ${moneyPlainLocal(bU.rate)}) = ${moneyPlainLocal(baseTierPrice + (extraUsersAtTier * bU.rate))}`);
  }

  if (hasFilePricing(acct) && f > 0) {
    lines.push('');

    const tierMax = isPerSentPlan ? findFolderTierLimit(f) : findApiTierLimit(f);
    const tierMin = bF.prevLimit + 1;
    const tierUnit = isPerSentPlan
      ? (OFFER_LANG === 'fr' ? 'envois' : 'sends')
      : 'API';
    const fileRange = f <= acct.includesFiles && !isPerSentPlan
      ? (OFFER_LANG === 'fr'
          ? `1 à ${fmtNumberLocal(acct.includesFiles)} API`
          : `1 to ${fmtNumberLocal(acct.includesFiles)} API`)
      : (tierMax === '∞'
          ? `${fmtNumberLocal(tierMin)} ${t[OFFER_LANG].andUp}`
          : (OFFER_LANG === 'fr'
              ? `${fmtNumberLocal(tierMin)} à ${fmtNumberLocal(tierMax)} ${tierUnit}`
              : `${fmtNumberLocal(tierMin)} to ${fmtNumberLocal(tierMax)} ${tierUnit}`));

    lines.push(isPerSentPlan
      ? (OFFER_LANG === 'fr'
          ? `Si vous avez ${fmtNumberLocal(f)} envois par mois, vous êtes dans la fourchette des ${fileRange}.`
          : `If you have ${fmtNumberLocal(f)} sends per month, you are in the ${fileRange} range.`)
      : (OFFER_LANG === 'fr'
          ? `Si vous avez ${fmtNumberLocal(f)} API, vous êtes dans la fourchette des ${fileRange}.`
          : `If you have ${fmtNumberLocal(f)} API, you are in the ${fileRange} range.`));
    lines.push('');

    if (isPerSentPlan) {
      lines.push(bF.prevLimit <= 0
        ? (OFFER_LANG === 'fr'
            ? 'Aucun envoi n’est inclus dans ce palier.'
            : 'No sends are included in this tier.')
        : (OFFER_LANG === 'fr'
            ? `Les ${fmtNumberLocal(bF.prevLimit)} premiers envois sont inclus dans ce palier pour ${moneyPlainLocal(bF.prevBase)}.`
            : `The first ${fmtNumberLocal(bF.prevLimit)} sends are included in this tier for ${moneyPlainLocal(bF.prevBase)}.`));
    } else if (f <= acct.includesFiles) {
      lines.push(OFFER_LANG === 'fr'
        ? `Les ${fmtNumberLocal(acct.includesFiles)} premières API sont incluses dans le forfait.`
        : `The first ${fmtNumberLocal(acct.includesFiles)} API are included in the plan.`);
    } else {
      lines.push(OFFER_LANG === 'fr'
        ? `Les ${fmtNumberLocal(bF.prevLimit)} premiers envois API sont inclus dans le forfait pour ${moneyPlainLocal(bF.prevBase)}.`
        : `The first ${fmtNumberLocal(bF.prevLimit)} API sends are included in the plan for ${moneyPlainLocal(bF.prevBase)}.`);
    }

    if (f > acct.includesFiles || isPerSentPlan) {
      lines.push(isPerSentPlan
        ? (OFFER_LANG === 'fr'
            ? `Les envois supplémentaires sont facturés au coût de ${moneyPlainLocal(bF.rate)} chacun.`
            : `Additional sends are billed at ${moneyPlainLocal(bF.rate)} each.`)
        : (OFFER_LANG === 'fr'
            ? `Les API supplémentaires sont facturées au coût de ${moneyPlainLocal(bF.rate)} chacune.`
            : `Additional API are billed at ${moneyPlainLocal(bF.rate)} each.`));
      lines.push('');
      lines.push(isPerSentPlan
        ? (OFFER_LANG === 'fr' ? 'Calcul détaillé des frais d’envois' : 'Detailed send fee calculation')
        : (OFFER_LANG === 'fr' ? 'Calcul détaillé des frais API' : 'Detailed API fee calculation'));
      lines.push(`= ${moneyPlainLocal(bF.prevBase)} + (${fmtNumberLocal(bF.inTierCount)} × ${moneyPlainLocal(bF.rate)}) = ${moneyPlainLocal(bF.apiTotal)}`);
    } else {
      lines.push(OFFER_LANG === 'fr' ? 'Aucun frais d’API.' : 'No API fees.');
    }
  }

  lines.push('');
  lines.push(OFFER_LANG === 'fr' ? 'Sous-total mensuel' : 'Monthly subtotal');
  lines.push(moneyPlainLocal(totalMonthly));

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const FEATURE_GROUPS = [
  {
    key: 'basic',
    title: { fr: 'Affaires de Base', en: 'Business Basic' },
    itemIds: [
      'basic_users_included',
      'basic_monthly_billing',
      'basic_manual_documents',
      'basic_signatures',
      'basic_templates',
      'basic_signer_messages',
      'basic_two_factor',
      'basic_team_templates',
      'basic_signed_documents_email',
    ],
  },
  {
    key: 'pro',
    title: { fr: 'Affaires Pro', en: 'Business Pro' },
    itemIds: [
      'pro_email_branding',
      'pro_pdf_converter',
      'pro_billing_entities',
      'pro_signer_delegation',
      'pro_template_name_recognition',
      'pro_signer_groups',
      'pro_field_dependencies',
      'pro_delayed_sending',
      'pro_batch_deletion',
      'pro_content_templates',
      'pro_consultation_block',
      'pro_closed_file_types',
    ],
  },
  {
    key: 'enterprise',
    title: { fr: 'Entreprise', en: 'Enterprise' },
    itemIds: [
      'enterprise_api',
      'enterprise_bulk_sending',
      'enterprise_shared_links',
      'enterprise_sso',
      'enterprise_interface_branding',
      'enterprise_text_zone_recognition',
      'enterprise_role_assignment',
      'enterprise_auto_delete',
      'enterprise_pdfa',
      'enterprise_moneris',
    ],
  },
  {
    key: 'perSent',
    title: { fr: 'Entreprise par envois', en: 'Enterprise per-sent' },
    itemIds: [
      'per_sent_unlimited_users',
      'per_sent_manual_api_billing',
      'per_sent_fixed_fee',
    ],
  },
];

const FEATURE_ITEMS = {
  basic_users_included: {
    fr: 'Jusqu’à 10 utilisateurs inclus',
    en: 'Up to 10 users included',
  },
  basic_monthly_billing: {
    fr: 'Facturation mensuelle',
    en: 'Monthly billing',
  },
  basic_manual_documents: {
    fr: 'Nombre de documents manuels illimité',
    en: 'Unlimited number of manual documents',
  },
  basic_signatures: {
    fr: 'Nombre de signatures illimité',
    en: 'Unlimited number of signatures',
  },
  basic_templates: {
    fr: 'Modèles personnalisables et réutilisables illimités',
    en: 'Unlimited customizable and reusable templates',
  },
  basic_signer_messages: {
    fr: 'Messages personnalisés à l’intention des signataires',
    en: 'Personalized messages for signers',
  },
  basic_two_factor: {
    fr: 'Double authentification par messagerie texte, téléphone ou question secrète',
    en: 'Two-factor authentication by text message, phone, or secret question',
  },
  basic_team_templates: {
    fr: 'Créer des modèles d’équipe',
    en: 'Create team templates',
  },
  basic_signed_documents_email: {
    fr: 'Recevoir un courriel de suivi et des documents signés automatiquement',
    en: 'Automatically receive follow-up emails and signed documents',
  },
  pro_email_branding: {
    fr: 'Intégration de l’image de marque au courriel (logo)',
    en: 'Branding integration in email (logo)',
  },
  pro_pdf_converter: {
    fr: 'Convertisseur PDF pour documents Word, Excel, PPT',
    en: 'PDF converter for Word, Excel, and PPT documents',
  },
  pro_billing_entities: {
    fr: 'Entités de facturation multiples',
    en: 'Multiple billing entities',
  },
  pro_signer_delegation: {
    fr: 'Délégation et réassignation des signataires',
    en: 'Delegation and reassignment of signers',
  },
  pro_template_name_recognition: {
    fr: 'Reconnaissance de modèles par nom',
    en: 'Template recognition by name',
  },
  pro_signer_groups: {
    fr: 'Groupes de signataires',
    en: 'Signer groups',
  },
  pro_field_dependencies: {
    fr: 'Dépendances sur champs de signature et listes déroulantes',
    en: 'Signature field dependencies and drop-down lists',
  },
  pro_delayed_sending: {
    fr: 'Envois différés',
    en: 'Delayed sending',
  },
  pro_batch_deletion: {
    fr: 'Suppression de documents par lot',
    en: 'Batch document deletion',
  },
  pro_content_templates: {
    fr: 'Modèles de contenu',
    en: 'Content templates',
  },
  pro_consultation_block: {
    fr: 'Bloc de consultation',
    en: 'Consultation block',
  },
  pro_closed_file_types: {
    fr: 'Type de fichiers « fermés »',
    en: '“Closed” file types',
  },
  enterprise_api: {
    fr: 'Intégrations API',
    en: 'API integrations',
    proposal_fr: 'Accès aux intégrations API',
    proposal_en: 'Access to API integrations',
  },
  enterprise_bulk_sending: {
    fr: 'Envois groupés',
    en: 'Bulk sending',
  },
  enterprise_shared_links: {
    fr: 'Création de liens partagés',
    en: 'Shared link creation',
  },
  enterprise_sso: {
    fr: 'SSO',
    en: 'SSO',
    proposal_fr: 'Accès au SSO (authentification unique)',
    proposal_en: 'Access to SSO (Single Sign-On)',
  },
  enterprise_interface_branding: {
    fr: 'Image de marque dans l’interface',
    en: 'Branding in the interface',
  },
  enterprise_text_zone_recognition: {
    fr: 'Reconnaissance de modèles par zone de texte',
    en: 'Template recognition by text zone',
  },
  enterprise_role_assignment: {
    fr: 'Association de rôle dans les modèles',
    en: 'Role assignment in templates',
  },
  enterprise_auto_delete: {
    fr: 'Suppression automatique des fichiers',
    en: 'Automatic file deletion',
  },
  enterprise_pdfa: {
    fr: 'Validation et conversion PDF/A',
    en: 'PDF/A validation and conversion',
  },
  enterprise_moneris: {
    fr: 'Percevoir des paiements via Moneris',
    en: 'Collect payments through Moneris',
  },
  per_sent_unlimited_users: {
    fr: 'Utilisateurs illimités inclus',
    en: 'Unlimited users included',
  },
  per_sent_manual_api_billing: {
    fr: 'Envois manuels et API facturés selon l’utilisation mensuelle',
    en: 'Manual and API sends billed according to monthly usage',
  },
  per_sent_fixed_fee: {
    fr: 'Frais fixes mensuels de 222,80 $, même si aucun envoi n’est complété',
    en: 'Fixed monthly fee of $222.80, even if no send is completed',
  },
};

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function featureText(item) {
  if (!item) return '';
  if (typeof item === 'function') return item();
  return item[OFFER_LANG] || item.fr || item.en || '';
}

function featureProposalText(item) {
  if (!item) return '';
  const key = OFFER_LANG === 'en' ? 'proposal_en' : 'proposal_fr';
  return item[key] || featureText(item);
}

function includedFeatureGroups(planKey) {
  if (planKey === 'basic') return ['basic'];
  if (planKey === 'pro') return ['basic', 'pro'];
  if (planKey === 'perFolder') return ['basic', 'pro', 'enterprise', 'perSent'];
  return ['basic', 'pro', 'enterprise'];
}

function dynamicFeatureItems(sim) {
  const acct = ACCOUNTS[sim.planKey] || ACCOUNTS.enterprise;
  const users = Math.max(0, Math.floor(Number(sim.users) || 0));
  const files = Math.max(0, Math.floor(Number(sim.files) || 0));
  const items = [];

  if (hasUserPricing(acct) && users > acct.includesUsers) {
    items.push({
      id: 'dynamic_extra_users',
      groupKey: 'reminders',
      fr: `${fmtNumberOfferPlain(users)} utilisateurs au total; ${fmtNumberOfferPlain(acct.includesUsers)} utilisateurs inclus et les utilisateurs supplémentaires facturés selon le palier choisi`,
      en: `${fmtNumberOfferPlain(users)} total users; ${fmtNumberOfferPlain(acct.includesUsers)} users included and additional users billed according to the selected tier`,
    });
  }

  if (sim.planKey === 'enterprise' && files > 0) {
    items.push({
      id: 'dynamic_api_usage',
      groupKey: 'reminders',
      fr: 'Seuls les dossiers API complétés comptent dans l’utilisation mensuelle',
      en: 'Only completed API folders count toward monthly usage',
    });
  }

  return items;
}

function allFeatureItems(sim) {
  const staticItems = FEATURE_GROUPS.flatMap(group =>
    group.itemIds.map(id => ({ id, groupKey: group.key, ...FEATURE_ITEMS[id] }))
  );
  return staticItems.concat(dynamicFeatureItems(sim));
}

function defaultFeatureIds(sim) {
  const files = Math.max(0, Math.floor(Number(sim.files) || 0));
  const users = Math.max(0, Math.floor(Number(sim.users) || 0));
  const acct = ACCOUNTS[sim.planKey] || ACCOUNTS.enterprise;
  const ids = [];
  const add = id => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  if (hasUserPricing(acct) && users > acct.includesUsers) add('dynamic_extra_users');

  if (sim.planKey === 'basic') {
    if (users <= acct.includesUsers) add('basic_users_included');
    ['basic_manual_documents', 'basic_templates', 'basic_two_factor', 'basic_signed_documents_email'].forEach(add);
  } else if (sim.planKey === 'pro') {
    ['pro_email_branding', 'pro_pdf_converter', 'pro_template_name_recognition', 'pro_signer_delegation', 'pro_field_dependencies'].forEach(add);
  } else if (sim.planKey === 'perFolder') {
    ['per_sent_unlimited_users', 'per_sent_manual_api_billing', 'per_sent_fixed_fee', 'pro_billing_entities', 'pro_email_branding'].forEach(add);
  } else {
    if (files > 0) {
      add('enterprise_api');
      add('enterprise_shared_links');
      add('enterprise_bulk_sending');
      add('dynamic_api_usage');
    }
    ['enterprise_sso', 'enterprise_text_zone_recognition', 'pro_email_branding', 'pro_pdf_converter', 'pro_template_name_recognition'].forEach(add);
  }

  return ids.slice(0, 5);
}

function normalizeFeatureSelection(features) {
  if (!features || !Array.isArray(features.selectedIds)) return null;
  return {
    selectedIds: [...new Set(features.selectedIds.map(String))],
    customText: String(features.customText || '').trim(),
    customChecked: Boolean(features.customChecked),
  };
}

function selectedFeatureIds(sim) {
  const selection = normalizeFeatureSelection(sim.features);
  return selection ? selection.selectedIds : defaultFeatureIds(sim);
}

function selectedFeatureCount(sim) {
  const selection = normalizeFeatureSelection(sim.features);
  const customCount = selection?.customChecked && selection.customText ? 1 : 0;
  return selectedFeatureIds(sim).length + customCount;
}

function buildDiscussAsDiscussedBlock(planKey, apiFiles, users, featureSelection) {
  const sim = normalizeOfferSimulation({
    planKey,
    files: apiFiles,
    users,
    features: featureSelection,
  });
  const selected = new Set(selectedFeatureIds(sim));
  const lines = allFeatureItems(sim)
    .filter(item => selected.has(item.id))
    .map(item => `• ${featureProposalText(item)}`);

  const selection = normalizeFeatureSelection(sim.features);
  if (selection?.customChecked && selection.customText) {
    lines.push(`• ${selection.customText}`);
  }

  return lines.join('\n');
}

    const SIGNERS = [
      { value: 'christopher', name: 'Christopher Lord', email: 'christopher.lord@ezsign.ca' },
      { value: 'marie-eve', name: 'Marie-Ève Gauvin Rondeau', email: 'marie-eve.rondeau@ezsign.ca' },
      { value: 'meher', name: 'Meher Nalbandian', email: 'meher.nalbandian@ezsign.ca' },
      { value: 'other', name: '', email: '' },
    ];

    let offerSimulationState = [{ planKey: 'enterprise', files: 0, users: 10, features: null }];

    function normalizeOfferSimulation(sim) {
      const planKey = ACCOUNTS[sim?.planKey] ? sim.planKey : 'enterprise';
      const acct = ACCOUNTS[planKey];
      return {
        planKey,
        files: hasFilePricing(acct) ? Math.max(0, Math.floor(Number(sim?.files) || 0)) : 0,
        users: hasUserPricing(acct) ? Math.max(1, Math.floor(Number(sim?.users) || acct.includesUsers)) : 0,
        features: normalizeFeatureSelection(sim?.features),
      };
    }

    function readOfferSimulationsFromDOM() {
      if (!offerSimulations) return offerSimulationState.map(normalizeOfferSimulation);

      const rows = Array.from(offerSimulations.querySelectorAll('[data-simulation-index]'));
      if (!rows.length) return offerSimulationState.map(normalizeOfferSimulation);

      return rows.map(row => {
        const index = Number(row.dataset.simulationIndex || 0);
        const planKey = row.querySelector('[data-offer-plan]')?.value || 'enterprise';
        const acct = ACCOUNTS[planKey] || ACCOUNTS.enterprise;
        return normalizeOfferSimulation({
          planKey,
          files: hasFilePricing(acct) ? row.querySelector('[data-offer-files]')?.value : 0,
          users: hasUserPricing(acct) ? (row.querySelector('[data-offer-users]')?.value || acct.includesUsers) : 0,
          features: offerSimulationState[index]?.features || null,
        });
      });
    }

    function syncOfferSimulationStateFromDOM() {
      offerSimulationState = readOfferSimulationsFromDOM().slice(0, 3);
      if (!offerSimulationState.length) {
        offerSimulationState = [{ planKey: 'enterprise', files: 0, users: 10, features: null }];
      }
    }

    function offerPlanOptionsHTML(selected) {
      return `
        <option value="enterprise"${selected === 'enterprise' ? ' selected' : ''}>${LANG === 'fr' ? 'Entreprise' : 'Enterprise'}</option>
        <option value="basic"${selected === 'basic' ? ' selected' : ''}>Business Basic</option>
        <option value="pro"${selected === 'pro' ? ' selected' : ''}>Business Pro</option>
        <option value="perFolder"${selected === 'perFolder' ? ' selected' : ''}>${t[LANG].accountByFolder}</option>`;
    }

    function renderOfferSimulations() {
      if (!offerSimulations) return;

      offerSimulationState = offerSimulationState.map(normalizeOfferSimulation).slice(0, 3);
      offerSimulations.innerHTML = offerSimulationState.map((sim, index) => {
        const acct = ACCOUNTS[sim.planKey];
        const fileFieldVisible = hasFilePricing(acct);
        const fileLabel = acct.filePricing === 'perSent' ? t[LANG].folderCount : t[LANG].apiCount;
        const userFieldVisible = hasUserPricing(acct);
        const featureCount = selectedFeatureCount(sim);
        return `
          <section class="offer-simulation" data-simulation-index="${index}">
            <div class="offer-sim-head">
              <div class="offer-sim-title">
                <strong>${t[LANG].simulation} ${index + 1}</strong>
                <button type="button" class="chip btn-ghost feature-btn" data-open-features="${index}">${t[LANG].featureButton} (${featureCount})</button>
              </div>
              ${index > 0 ? `<button type="button" class="link-btn" data-remove-simulation="${index}">${t[LANG].removeSimulation}</button>` : ''}
            </div>
            <div class="controls offer-controls">
              <div class="field">
                <label>${t[LANG].acct}</label>
                <select data-offer-plan>${offerPlanOptionsHTML(sim.planKey)}</select>
              </div>

              <div class="field" data-offer-files-field style="${fileFieldVisible ? '' : 'display:none'}">
                <label>${fileLabel}</label>
                <input data-offer-files type="number" min="0" inputmode="numeric" placeholder="${LANG === 'fr' ? 'Ex, 350' : 'e.g., 350'}" value="${sim.files}" />
              </div>

              <div class="field" style="${userFieldVisible ? '' : 'display:none'}">
                <label>${t[LANG].users}</label>
                <input data-offer-users type="number" min="1" inputmode="numeric" placeholder="${LANG === 'fr' ? 'Ex, 11' : 'e.g., 11'}" value="${sim.users}" />
              </div>
              ${userFieldVisible ? '' : `<div class="note offer-unlimited-users">${t[LANG].unlimitedUsers}</div>`}
            </div>
          </section>`;
      }).join('');

      offerSimulations.querySelectorAll('[data-offer-plan]').forEach(select => {
        select.addEventListener('change', () => {
          const row = select.closest('[data-simulation-index]');
          const index = Number(row?.dataset.simulationIndex || 0);
          syncOfferSimulationStateFromDOM();
          if (offerSimulationState[index]) offerSimulationState[index].features = null;
          renderOfferSimulations();
          updateOfferPreview();
        });
      });

      offerSimulations.querySelectorAll('[data-offer-files], [data-offer-users]').forEach(input => {
        input.addEventListener('input', () => {
          syncOfferSimulationStateFromDOM();
          updateOfferPreview();
        });
      });

      offerSimulations.querySelectorAll('[data-remove-simulation]').forEach(button => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.removeSimulation);
          syncOfferSimulationStateFromDOM();
          offerSimulationState.splice(index, 1);
          renderOfferSimulations();
          updateOfferPreview();
        });
      });

      offerSimulations.querySelectorAll('[data-open-features]').forEach(button => {
        button.addEventListener('click', () => {
          openFeatureModal(Number(button.dataset.openFeatures || 0));
        });
      });

      if (addSimulationBtn) {
        addSimulationBtn.disabled = offerSimulationState.length >= 3;
        addSimulationBtn.textContent = offerSimulationState.length >= 3 ? t[LANG].maxSimulations : t[LANG].addSimulation;
      }
    }

    function updateOfferPreview() {
      if (!offerPreview) return;
      const simulations = readOfferSimulationsFromDOM();
      offerPreview.value = simulations.map((sim, index) =>
        buildOfferSimulationBlock(sim.planKey, sim.files, sim.users, index + 1, simulations.length)
      ).join('\n\n');
    }

    function offerGenerateLabel() {
      const word = outputWordCheck ? outputWordCheck.checked : true;
      const pdf = outputPdfCheck ? outputPdfCheck.checked : true;
      if (word && pdf) return t[LANG].generateWordPdf;
      if (word) return t[LANG].generateWordOnly;
      if (pdf) return t[LANG].generatePdfOnly;
      return t[LANG].generateOffer;
    }

    function refreshOfferGenerateButtonLabel() {
      if (!offerGenerateBtn || offerGenerateBtn.disabled) return;
      offerGenerateBtn.textContent = offerGenerateLabel();
    }

    let activeFeatureSimulationIndex = null;

    function renderFeatureChecklist(index) {
      if (!featureChecklist) return;
      const sim = normalizeOfferSimulation(offerSimulationState[index] || {});
      const selected = new Set(selectedFeatureIds(sim));
      const items = allFeatureItems(sim);
      const groups = FEATURE_GROUPS.map(group => ({
        key: group.key,
        title: group.title[OFFER_LANG] || group.title.fr,
        items: items.filter(item => item.groupKey === group.key),
      }));
      const dynamicItems = items.filter(item => item.groupKey === 'reminders');
      if (dynamicItems.length) {
        groups.push({
          key: 'reminders',
          title: OFFER_LANG === 'fr' ? 'Rappels selon la simulation' : 'Simulation reminders',
          items: dynamicItems,
        });
      }

      featureChecklist.innerHTML = groups
        .filter(group => group.items.length)
        .map(group => `
          <section class="feature-group">
            <h4 class="feature-group-title">${escapeHTML(group.title)}</h4>
            <div class="feature-options">
              ${group.items.map(item => `
                <label class="feature-option">
                  <input type="checkbox" data-feature-id="${escapeHTML(item.id)}"${selected.has(item.id) ? ' checked' : ''} />
                  <span>${escapeHTML(featureText(item))}</span>
                </label>
              `).join('')}
            </div>
          </section>
        `).join('');

      const selection = normalizeFeatureSelection(sim.features);
      if (featureOtherCheck) featureOtherCheck.checked = Boolean(selection?.customChecked && selection.customText);
      if (featureOtherText) featureOtherText.value = selection?.customText || '';
    }

    function openFeatureModal(index) {
      syncOfferSimulationStateFromDOM();
      activeFeatureSimulationIndex = Math.max(0, Math.min(index, offerSimulationState.length - 1));

      if (featureModalTitle) {
        featureModalTitle.textContent = `${t[LANG].featureTitle} - ${t[LANG].simulation} ${activeFeatureSimulationIndex + 1}`;
      }
      if (featureModalIntro) featureModalIntro.textContent = t[LANG].featureIntro;
      if (featureOtherLabel) featureOtherLabel.textContent = t[LANG].featureOther;
      if (featureOtherText) featureOtherText.placeholder = t[LANG].featureOtherPlaceholder;
      if (featureDefaultsBtn) featureDefaultsBtn.textContent = t[LANG].featureDefaults;
      if (featureSaveBtn) featureSaveBtn.textContent = t[LANG].featureApply;

      renderFeatureChecklist(activeFeatureSimulationIndex);
      if (featureModal) {
        featureModal.classList.add('open');
        featureModal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeFeatureModal() {
      if (!featureModal) return;
      featureModal.classList.remove('open');
      featureModal.setAttribute('aria-hidden', 'true');
      activeFeatureSimulationIndex = null;
    }

    function saveFeatureSelection() {
      if (activeFeatureSimulationIndex === null || !offerSimulationState[activeFeatureSimulationIndex]) return;
      const selectedIds = Array.from(featureChecklist?.querySelectorAll('[data-feature-id]:checked') || [])
        .map(input => input.dataset.featureId);
      const customText = (featureOtherText?.value || '').trim();
      offerSimulationState[activeFeatureSimulationIndex].features = {
        selectedIds,
        customText,
        customChecked: Boolean(featureOtherCheck?.checked && customText),
      };
      renderOfferSimulations();
      updateOfferPreview();
      closeFeatureModal();
    }

    function refreshSignerUI() {
      if (!offerSigner || !offerSignerOtherFields) return;
      const isOther = offerSigner.value === 'other';
      offerSignerOtherFields.style.display = isOther ? '' : 'none';
    }

    function getSignerInfo() {
      const value = offerSigner?.value || 'christopher';
      if (value === 'other') {
        return {
          name: (offerSignerName?.value || '').trim(),
          email: (offerSignerEmail?.value || '').trim(),
        };
      }
      return SIGNERS.find(signer => signer.value === value) || SIGNERS[0];
    }

    function refreshOfferUI() {
      syncOfferSimulationStateFromDOM();
      if (offerTitle) offerTitle.textContent = t[LANG].offerTitle;
      if (offerBtn) offerBtn.textContent = t[LANG].offerTop;
      if (offerCompanyLabel) offerCompanyLabel.textContent = t[LANG].companyName;
      if (offerCompanyName) offerCompanyName.placeholder = t[LANG].companyPlaceholder;
      if (offerSignerLabel) offerSignerLabel.textContent = t[LANG].proposalCreator;
      if (offerSignerNameLabel) offerSignerNameLabel.textContent = t[LANG].creatorName;
      if (offerSignerEmailLabel) offerSignerEmailLabel.textContent = t[LANG].creatorEmail;
      if (offerPreviewLabel) offerPreviewLabel.textContent = t[LANG].offerPreview;
      if (outputWordLabel) outputWordLabel.textContent = t[LANG].outputWord;
      if (outputPdfLabel) outputPdfLabel.textContent = t[LANG].outputPdf;
      refreshOfferGenerateButtonLabel();

      if (offerSigner) {
        offerSigner.querySelector('option[value="other"]').textContent = t[LANG].proposalCreatorOther;
      }

      renderOfferSimulations();
      refreshSignerUI();
      refreshOfferDatesNoteOnly();
      updateOfferPreview();
      if (featureModal?.classList.contains('open') && activeFeatureSimulationIndex !== null) {
        openFeatureModal(activeFeatureSimulationIndex);
      }
    }

function openOfferModal() {
  if (!offerModal) return;

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

  updateOfferPreview();
  refreshOfferDatesNoteOnly();
  if (featureModal?.classList.contains('open') && activeFeatureSimulationIndex !== null) {
    openFeatureModal(activeFeatureSimulationIndex);
  }
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

    function cubicPoint(t, p0, p1, p2, p3) {
      const u = 1 - t;
      return {
        x: (u ** 3 * p0.x) + (3 * u ** 2 * t * p1.x) + (3 * u * t ** 2 * p2.x) + (t ** 3 * p3.x),
        y: (u ** 3 * p0.y) + (3 * u ** 2 * t * p1.y) + (3 * u * t ** 2 * p2.y) + (t ** 3 * p3.y),
      };
    }

    function downloadFlightProfile(outputFormats) {
      const wantsWord = Boolean(outputFormats?.word);
      const wantsPdf = Boolean(outputFormats?.pdf);
      if (wantsWord && !wantsPdf) {
        return {
          key: 'word',
          fallbackMs: 3000,
          minMs: 2200,
          maxMs: 5200,
          finishMinMs: 1200,
          finishMaxMs: 2300,
          loopXFactor: 0.28,
          loopXMax: 420,
          loopYFactor: 0.17,
          loopYMin: 105,
          loopYMax: 165,
          elbowLift: 126,
        };
      }
      if (!wantsWord && wantsPdf) {
        return {
          key: 'pdf',
          fallbackMs: 10500,
          minMs: 7200,
          maxMs: 18000,
          finishMinMs: 900,
          finishMaxMs: 3600,
          loopXFactor: 0.5,
          loopXMax: 800,
          loopYFactor: 0.32,
          loopYMin: 190,
          loopYMax: 315,
          elbowLift: 170,
        };
      }
      return {
        key: 'word_pdf',
        fallbackMs: 11800,
        minMs: 8500,
        maxMs: 18000,
        finishMinMs: 900,
        finishMaxMs: 3800,
        loopXFactor: 0.48,
        loopXMax: 760,
        loopYFactor: 0.3,
        loopYMin: 185,
        loopYMax: 300,
        elbowLift: 165,
      };
    }

    function downloadFlightDuration(profile) {
      const saved = Number(localStorage.getItem(`ez_download_flight_ms_${profile.key}`) || 0);
      const estimate = Number.isFinite(saved) && saved > 0 ? saved : profile.fallbackMs;
      return Math.min(profile.maxMs, Math.max(profile.minMs, estimate));
    }

    function rememberDownloadFlightDuration(elapsedMs, profile) {
      if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
      const key = `ez_download_flight_ms_${profile.key}`;
      const previous = Number(localStorage.getItem(key) || profile.fallbackMs);
      const next = Math.round((previous * 0.55) + (elapsedMs * 0.45));
      localStorage.setItem(key, String(Math.min(profile.maxMs, Math.max(profile.minMs, next))));
    }

    function startDownloadFlight(button, outputFormats) {
      if (!button) {
        return { stop: async () => {} };
      }

      const rect = button.getBoundingClientRect();
      const layer = document.createElement('div');
      layer.className = 'ez-flight-layer';

      const token = document.createElement('div');
      token.className = 'ez-flight-token';
      token.textContent = 'EZ';
      layer.appendChild(token);
      document.body.appendChild(layer);

      const profile = downloadFlightProfile(outputFormats);
      const start = { x: rect.right + 20, y: rect.top + rect.height / 2 };
      const end = { x: Math.max(56, window.innerWidth - 178), y: 8 };
      const loop = {
        x: Math.max(80, rect.left - Math.min(profile.loopXMax, window.innerWidth * profile.loopXFactor)),
        y: Math.min(window.innerHeight - 42, rect.bottom + Math.min(profile.loopYMax, Math.max(profile.loopYMin, window.innerHeight * profile.loopYFactor))),
      };
      const elbow = {
        x: Math.min(window.innerWidth - 260, rect.right + (profile.key === 'word' ? 82 : 120)),
        y: Math.max(96, rect.top - profile.elbowLift),
      };
      const duration = downloadFlightDuration(profile);
      let raf = null;
      let startedAt = performance.now();
      let lastParticleAt = 0;
      let current = start;
      let currentRawProgress = 0;
      let stopped = false;

      const ease = value => 0.5 - Math.cos(value * Math.PI) / 2;
      const easeOutCubic = value => 1 - ((1 - value) ** 3);
      const easeInCubic = value => value ** 3;

      function moveTo(point) {
        current = point;
        token.style.left = `${point.x}px`;
        token.style.top = `${point.y}px`;
      }

      function flightPace(rawT) {
        const t = Math.min(1, Math.max(0, rawT));
        if (t < 0.16) return 0.28 * easeOutCubic(t / 0.16);
        if (t < 0.78) return 0.28 + (0.5 * ease((t - 0.16) / 0.62));
        return 0.78 + (0.22 * easeInCubic((t - 0.78) / 0.22));
      }

      function pointOnFlight(rawT) {
        const t = Math.min(1, Math.max(0, rawT));
        if (t < 0.55) {
          const s = ease(t / 0.55);
          return cubicPoint(
            s,
            start,
            { x: start.x + 150, y: start.y + 28 },
            { x: loop.x + 210, y: loop.y + 125 },
            loop
          );
        }
        if (t < 0.84) {
          const s = ease((t - 0.55) / 0.29);
          return cubicPoint(
            s,
            loop,
            { x: loop.x + 310, y: loop.y - 50 },
            { x: elbow.x - 230, y: elbow.y + 125 },
            elbow
          );
        }
        const s = ease((t - 0.84) / 0.16);
        return cubicPoint(
          s,
          elbow,
          { x: elbow.x + 175, y: elbow.y - 44 },
          { x: end.x - 24, y: end.y + 92 },
          end
        );
      }

      function spawnParticle(point) {
        const particle = document.createElement('span');
        particle.className = 'ez-flight-particle';
        const driftX = (Math.random() - 0.5) * 26;
        const driftY = (Math.random() - 0.5) * 20;
        particle.style.left = `${point.x + driftX}px`;
        particle.style.top = `${point.y + driftY}px`;
        particle.style.setProperty('--particle-x', `${-18 - Math.random() * 22}px`);
        particle.style.setProperty('--particle-y', `${8 + Math.random() * 16}px`);
        layer.appendChild(particle);
        window.setTimeout(() => particle.remove(), 980);
      }

      function spawnBurst(origin, count, distance = 96, extraClass = '') {
        for (let i = 0; i < count; i += 1) {
          const particle = document.createElement('span');
          particle.className = `ez-flight-particle is-burst${extraClass ? ` ${extraClass}` : ''}`;
          const angle = Math.random() * Math.PI * 2;
          const travel = distance * (0.45 + Math.random() * 0.75);
          const size = 4 + Math.random() * 7;
          particle.style.left = `${origin.x}px`;
          particle.style.top = `${origin.y}px`;
          particle.style.setProperty('--particle-size', `${size}px`);
          particle.style.setProperty('--particle-x', `${Math.cos(angle) * travel}px`);
          particle.style.setProperty('--particle-y', `${Math.sin(angle) * travel}px`);
          layer.appendChild(particle);
          window.setTimeout(() => particle.remove(), 1050);
        }
      }

      function explodeButton() {
        const freshRect = button.getBoundingClientRect();
        const origin = {
          x: freshRect.left + freshRect.width / 2,
          y: freshRect.top + freshRect.height / 2,
        };
        button.classList.add('is-exploding');
        window.setTimeout(() => button.classList.remove('is-exploding'), 520);

        const ring = document.createElement('span');
        ring.className = 'ez-button-burst-ring';
        ring.style.left = `${origin.x}px`;
        ring.style.top = `${origin.y}px`;
        ring.style.width = `${freshRect.width}px`;
        ring.style.height = `${freshRect.height}px`;
        layer.appendChild(ring);
        window.setTimeout(() => ring.remove(), 760);

        spawnBurst(origin, 58, 145, 'from-button');
      }

      function frame(now) {
        if (stopped) return;
        const elapsed = now - startedAt;
        const progress = Math.min(1, elapsed / duration);
        currentRawProgress = progress;
        const point = pointOnFlight(flightPace(progress));
        moveTo(point);

        if (progress < 1 && now - lastParticleAt > 58) {
          lastParticleAt = now;
          spawnParticle(point);
        }

        if (progress >= 1) {
          token.classList.add('is-waiting');
          return;
        }

        raf = requestAnimationFrame(frame);
      }

      function animateRemainingFlight(fromRawProgress, toRawProgress, animationMs) {
        return new Promise(resolve => {
          const startTime = performance.now();
          let finishRaf = null;

          function step(now) {
            const elapsed = now - startTime;
            const localT = Math.min(1, elapsed / animationMs);
            const rawProgress = fromRawProgress + ((toRawProgress - fromRawProgress) * ease(localT));
            currentRawProgress = rawProgress;
            moveTo(pointOnFlight(flightPace(rawProgress)));

            if (now - lastParticleAt > 58 && rawProgress < 1) {
              lastParticleAt = now;
              spawnParticle(current);
            }

            if (localT >= 1) {
              if (finishRaf) cancelAnimationFrame(finishRaf);
              resolve();
              return;
            }

            finishRaf = requestAnimationFrame(step);
          }

          finishRaf = requestAnimationFrame(step);
        });
      }

      moveTo(start);
      raf = requestAnimationFrame(frame);

      return {
        async stop({ explode = true } = {}) {
          if (stopped) return;
          stopped = true;
          if (raf) cancelAnimationFrame(raf);
          rememberDownloadFlightDuration(performance.now() - startedAt, profile);

          const progress = Math.min(1, Math.max(currentRawProgress, (performance.now() - startedAt) / duration));
          const finishDuration = progress >= 0.98
            ? 280
            : Math.min(profile.finishMaxMs, Math.max(profile.finishMinMs, (1 - progress) * duration * 0.55));
          token.classList.remove('is-waiting');
          token.classList.add('is-finishing');

          if (progress < 1) await animateRemainingFlight(progress, 1, finishDuration);

          moveTo(end);
          spawnBurst(end, 16, 54);
          if (explode) explodeButton();

          await token.animate(
            [
              { opacity: 1, transform: 'translate(-50%, -50%) scale(1.08)' },
              { opacity: 0, transform: 'translate(-50%, -50%) scale(.55)' },
            ],
            { duration: 520, easing: 'ease-out', fill: 'forwards' }
          ).finished;

          window.setTimeout(() => layer.remove(), 320);
        },
      };
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

    if (addSimulationBtn) {
      addSimulationBtn.addEventListener('click', () => {
        syncOfferSimulationStateFromDOM();
        if (offerSimulationState.length >= 3) return;
        offerSimulationState.push({ planKey: 'enterprise', files: 0, users: 10, features: null });
        renderOfferSimulations();
        updateOfferPreview();
      });
    }

    if (offerSigner) {
      offerSigner.addEventListener('change', refreshSignerUI);
    }
    if (offerSignerName) offerSignerName.addEventListener('input', updateOfferPreview);
    if (offerSignerEmail) offerSignerEmail.addEventListener('input', updateOfferPreview);
    if (featureSaveBtn) featureSaveBtn.addEventListener('click', saveFeatureSelection);
    if (featureDefaultsBtn) {
      featureDefaultsBtn.addEventListener('click', () => {
        if (activeFeatureSimulationIndex === null || !offerSimulationState[activeFeatureSimulationIndex]) return;
        offerSimulationState[activeFeatureSimulationIndex].features = null;
        renderFeatureChecklist(activeFeatureSimulationIndex);
        renderOfferSimulations();
        updateOfferPreview();
      });
    }
    if (featureOtherText && featureOtherCheck) {
      featureOtherText.addEventListener('input', () => {
        if (featureOtherText.value.trim()) featureOtherCheck.checked = true;
      });
    }
    [outputWordCheck, outputPdfCheck].forEach(input => {
      if (input) input.addEventListener('change', refreshOfferGenerateButtonLabel);
    });

    if (offerGenerateBtn) {
      offerGenerateBtn.addEventListener('click', async () => {
        const companyName = (offerCompanyName?.value || '').trim();
        if (!companyName) {
          alert(t[LANG].enterCompany);
          offerCompanyName?.focus();
          return;
        }
        const outputFormats = {
          word: outputWordCheck ? outputWordCheck.checked : true,
          pdf: outputPdfCheck ? outputPdfCheck.checked : true,
        };
        if (!outputFormats.word && !outputFormats.pdf) {
          alert(t[LANG].chooseOutput);
          outputWordCheck?.focus();
          return;
        }

        syncOfferSimulationStateFromDOM();
        const simulations = offerSimulationState.map(normalizeOfferSimulation);
        const simulationsForPayload = simulations.map(sim => ({
          ...sim,
          productKey: sim.planKey === 'perFolder' ? 'perSent' : sim.planKey,
        }));
        const signer = getSignerInfo();
        if (!signer.name || !signer.email) {
          alert(t[LANG].enterCreator);
          (offerSignerName || offerSigner)?.focus();
          return;
        }

        const today = new Date();
        const validUntil = addMonthsSafe(today, 3);

        const simulationBlocks = simulations.map((sim, index) =>
          buildOfferSimulationBlock(sim.planKey, sim.files, sim.users, index + 1, simulations.length)
        );

        const discussedBlocks = simulations.map(sim =>
          buildDiscussAsDiscussedBlock(sim.planKey, sim.files, sim.users, sim.features)
        );

const payload = {
  companyName,
  creatorName: signer.name,
  creatorEmail: signer.email,
  date: formatDateOffer(today),
  validUntil: formatDateOffer(validUntil),
  simulationBlock: simulationBlocks.join('\n\n'),
  simulationBlocks,
  simulations: simulationsForPayload,
  discussedBlock: '',
  discussedBlocks,
  outputFormats,
  offerLang: OFFER_LANG,
};


        offerGenerateBtn.disabled = true;
        offerGenerateBtn.textContent = t[LANG].generatingOffer;
        const downloadFlight = startDownloadFlight(offerGenerateBtn, outputFormats);
        let downloadReady = false;
        let downloadBlob = null;
        let downloadFilename = 'Offer.docx';

        try {
          const res = await fetch('https://micro-mobility-rank-kruger.trycloudflare.com/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

              if (!res.ok) {
              const txt = await res.text();
              alert(t[LANG].generationError + txt);
              return;
            }
            
            // ✅ Le serveur renvoie maintenant un fichier (docx/pdf), pas du JSON
            downloadBlob = await res.blob();
            
            // Nom de fichier depuis le header (si présent)
            const dispo = res.headers.get('content-disposition');
            if (dispo && dispo.includes('filename=')) {
              downloadFilename = dispo.split('filename=')[1].replace(/"/g, '').trim();
            }
            
            downloadReady = true;
                      

        } catch (e) {
          alert(t[LANG].generationServerError);
        } finally {
          await downloadFlight.stop({ explode: downloadReady });
          if (downloadReady && downloadBlob) {
            await downloadBlobAsFile(downloadBlob, downloadFilename);
          }
          offerGenerateBtn.disabled = false;
          refreshOfferGenerateButtonLabel();
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
      const order = ['basic', 'pro', 'enterprise', 'perFolder'];
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

      if (visible.includes('perFolder')) {
        html += folderTableHTML();
      }

      for (const key of order) {
        if (visible.includes(key) && key !== 'perFolder') html += userTableFor(ACCOUNTS[key]);
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




