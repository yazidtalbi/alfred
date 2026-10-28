/* Alfred Pitch Studio · pure client-side presentation engine. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlfredPitchCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function text(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 1200); }
  function html(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function publicUrl(value) {
    try {
      var url = new URL(String(value || ''));
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
      var h = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
      if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h === '::1' || h === '0.0.0.0' || h === '169.254.169.254') return '';
      if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
        var n = h.split('.').map(Number);
        if (n.some(function (v) { return v > 255; }) || n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 || (n[0] === 169 && n[1] === 254) || (n[0] === 192 && n[1] === 168) || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127)) return '';
      }
      if (h.indexOf(':') >= 0) return '';
      if (!h.includes('.')) return '';
      return url.href;
    } catch (_) { return ''; }
  }
  var goals = {
    inquiries: ['turn more visitors into qualified conversations','transformer davantage de visiteurs en contacts qualifiés'],
    bookings: ['make the booking journey effortless','simplifier le parcours de réservation'],
    trust: ['build confidence from the first impression','inspirer confiance dès la première impression'],
    sales: ['make choosing and buying easier','faciliter le choix et l’achat']
  };
  function normalize(raw) {
    raw = raw || {};
    var lang = raw.language === 'fr' ? 'fr' : 'en';
    var goal = Object.prototype.hasOwnProperty.call(goals, raw.goal) ? raw.goal : 'inquiries';
    return {
      id: text(raw.id, 90), prospectId: text(raw.prospectId, 90), name: text(raw.name, 100),
      contact: text(raw.contact, 100), website: publicUrl(raw.website),
      audience: text(raw.audience, 200), problem: text(raw.problem, 650),
      solution: text(raw.solution, 650), scope: text(raw.scope, 600),
      concept: text(raw.concept, 300), industry: text(raw.industry, 80) || 'other',
      goal: goal, language: lang, price: text(raw.price, 90),
      timeline: text(raw.timeline, 120), creator: text(raw.creator, 100) || 'Arlibera',
      nextStep: text(raw.nextStep, 250), heroImage: publicUrl(raw.heroImage),
      audit: raw.audit && raw.audit.url === publicUrl(raw.website) ? {
        url: publicUrl(raw.website),
        checkedAt: Number(raw.audit.checkedAt) || 0,
        scores: Object.fromEntries(Object.entries(raw.audit.scores || {}).filter(function (e) { return /^[\w -]{1,60}$/.test(e[0]) && Number.isFinite(Number(e[1])); }).slice(0, 4).map(function (e) { return [e[0], Math.min(100, Math.max(0, Math.round(Number(e[1]))))]; })),
        findings: (Array.isArray(raw.audit.findings) ? raw.audit.findings : []).slice(0, 5).map(function (x) { return text(x, 160); }).filter(Boolean)
      } : null
    };
  }
  function validate(raw) {
    var p = normalize(raw), errors = [];
    if (!p.name) errors.push('Enter a prospect or business name.');
    if (!p.audience) errors.push('Describe the audience.');
    if (!p.solution) errors.push('Describe the proposed direction.');
    if (raw && raw.website && !p.website) errors.push('Enter a public HTTP(S) website address, or clear the field.');
    if (raw && raw.heroImage && !p.heroImage) errors.push('Use a public HTTP(S) image URL, or clear the field.');
    return {value: p, errors: errors};
  }
  function deck(raw) {
    var p = normalize(raw), fr = p.language === 'fr', outcome = goals[p.goal][fr ? 1 : 0];
    var problem = p.problem || (fr ? 'Une occasion à explorer ensemble, à confirmer lors de la découverte.' : 'An opportunity to explore together, to be confirmed during discovery.');
    var scope = p.scope ? p.scope.split(/\n|[,;]+/).map(function (v) { return v.trim(); }).filter(Boolean).slice(0, 6) : [];
    if (!scope.length) scope = fr ? ['Direction créative et parcours utilisateur', 'Prototype interactif', 'Design UI adaptatif'] : ['Creative direction & customer journey', 'Interactive prototype', 'Responsive interface design'];
    var slides = [
      {eyebrow: fr ? 'Une proposition pour' : 'A proposal for', title: p.name, subtitle: p.concept || (fr ? 'Une expérience digitale qui marque les esprits.' : 'A digital experience worth remembering.'), bullets: [p.industry === 'other' ? (fr ? 'Expérience digitale' : 'Digital experience') : p.industry, p.creator]},
      {eyebrow: fr ? 'Contexte & opportunité' : 'Context & opportunity', title: fr ? 'Le bon problème.' : 'The right problem.', subtitle: problem, bullets: [fr ? 'Public cible : ' + p.audience : 'Audience: ' + p.audience, fr ? 'À valider avec votre équipe' : 'To validate with your team']},
      {eyebrow: fr ? 'Notre ambition' : 'The ambition', title: fr ? 'Du beau, mais surtout de l’utile.' : 'Beauty with a purpose.', subtitle: fr ? 'Notre objectif : ' + outcome + '.' : 'Our goal: ' + outcome + '.', bullets: [p.solution]},
      {eyebrow: fr ? 'La direction créative' : 'Creative direction', title: p.concept || (fr ? 'Un univers distinctif.' : 'A distinctive experience.'), subtitle: p.solution, bullets: [fr ? 'Concept proposé — à affiner ensemble' : 'Proposed concept — refined together', p.website ? (fr ? 'Site actuel : ' : 'Existing site: ') + p.website : (fr ? 'Nouvelle présence digitale' : 'New digital presence')]},
      {eyebrow: fr ? 'Le périmètre' : 'What we will make', title: fr ? 'De l’idée à l’expérience.' : 'From idea to experience.', subtitle: p.timeline ? (fr ? 'Calendrier indicatif : ' : 'Indicative timeline: ') + p.timeline : (fr ? 'Un périmètre sur mesure, à confirmer.' : 'A tailored scope, subject to agreement.'), bullets: scope},
      {eyebrow: fr ? 'La suite' : 'Next steps', title: fr ? 'Créons quelque chose qui compte.' : 'Let’s create something meaningful.', subtitle: p.nextStep || (fr ? 'Un court échange pour confirmer les besoins, puis un plan d’action concret.' : 'A short discovery call to validate the needs, then a clear plan of action.'), bullets: [p.price ? (fr ? 'Budget indicatif : ' : 'Indicative investment: ') + p.price : (fr ? 'Budget à définir ensemble' : 'Investment to be scoped together'), p.creator]}
    ];
    return slides;
  }
  function storyboard(raw) {
    var p = normalize(raw), slides = deck(p), fr = p.language === 'fr';
    var intervals = [[0,7],[7,15],[15,23],[23,32],[32,40],[40,48]];
    return slides.map(function (s,i) {
      var direction = [
        fr ? 'Plan d’ouverture cinématique, identité et nom.' : 'Cinematic opening, brand name and visual identity.',
        fr ? 'Montage sobre du problème et du parcours actuel.' : 'Understated montage of the current journey and challenge.',
        fr ? 'Transformation vers la nouvelle direction.' : 'Reveal the proposed experience and key benefit.',
        fr ? 'Transition immersive, mouvements et détails typographiques.' : 'Immersive motion, interface details and typography.',
        fr ? 'Séquence de livrables et étapes de projet.' : 'Show deliverables and project milestones.',
        fr ? 'Plan final avec appel à l’action.' : 'Closing brand frame and invitation to talk.'
      ][i];
      return {start: intervals[i][0], end: intervals[i][1], visual: direction, narration: s.title + ' ' + s.subtitle};
    });
  }
  function videoPrompt(raw) {
    var p = normalize(raw);
    return [
      'Create a 48-second cinematic concept pitch for ' + p.name + '.',
      'Sector: ' + p.industry + '. Creative idea: ' + (p.concept || 'understated, confident and editorial') + '.',
      'Audience: ' + p.audience + '. Proposed experience: ' + p.solution + '.',
      'Visual treatment: premium typography, realistic camera movement, restrained cinematic lighting, elegant transitions, clear hierarchy, dark charcoal and subtle periwinkle accents.',
      'Storyboard:',
      storyboard(p).map(function (s) { return s.start + '–' + s.end + 's: ' + s.visual + ' Voiceover: ' + s.narration; }).join('\n'),
      'Generate concept visuals and motion only. Do not fabricate real building imagery, product footage, testimonials, client logos, performance outcomes or measurable results. Use approved assets for actual client work.',
      'Deliver video with editable titles, captions, a soundtrack licensed for use, and a separate narration track. This is a creative brief, not an automatically rendered video.'
    ].join('\n\n');
  }
  function exportHtml(raw) {
    var p = normalize(raw), slides = deck(p);
    var content = slides.map(function (s,i) {
      return '<section class="slide"><div class="inner"><div class="index">' + String(i+1).padStart(2,'0') + ' / 06 · ' + html(s.eyebrow) + '</div>' +
        '<h1>' + html(s.title) + '</h1><p class="desc">' + html(s.subtitle) + '</p><div class="pills">' +
        s.bullets.map(function (b) { return '<span>' + html(b) + '</span>'; }).join('') + '</div></div></section>';
    }).join('\n');
    var hero = p.heroImage ? '<img class="hero" alt="User-supplied concept visual" src="' + html(p.heroImage) + '">' : '';
    return '<!doctype html><html lang="' + p.language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + html(p.name) + ' · ' + html(p.creator) + ' Pitch</title>' +
      '<style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0c0c12;color:#f2f0fa;font-family:Inter,Arial,sans-serif}.slide{min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:8vw;border-bottom:1px solid #292932;background:radial-gradient(ellipse at 80% 20%,#28223e,transparent 50%),#101016}.slide:nth-child(even){background:radial-gradient(ellipse at 15% 90%,#20263b,transparent 50%),#0d0e14}.inner{max-width:960px;width:100%}.index{color:#ada5cb;font-size:12px;letter-spacing:.2em;text-transform:uppercase}h1{font-size:clamp(44px,8vw,100px);line-height:1;letter-spacing:-.07em;max-width:13ch;margin:35px 0}.desc{font-size:clamp(19px,2.5vw,32px);line-height:1.4;color:#d1cadf;max-width:740px}.pills{display:flex;flex-wrap:wrap;gap:9px;margin-top:45px}.pills span{border:1px solid #474154;background:#ffffff09;border-radius:100px;padding:10px 15px;font-size:14px}.hero{position:fixed;right:0;top:0;height:100vh;width:35%;object-fit:cover;opacity:.1;pointer-events:none}@media print{.slide{min-height:0;height:185mm;page-break-after:always;break-after:page;padding:20mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}.hero{display:none}h1{font-size:56px}}@media(max-width:600px){.slide{padding:28px}h1{margin:20px 0}}</style></head><body>' + hero + content + '</body></html>';
  }
  function storyboardText(raw) {
    var p = normalize(raw);
    return p.name + ' — ' + p.creator + ' | 48-second concept\n\n' + storyboard(p).map(function (s) {
      return '[' + s.start + '–' + s.end + 's] ' + s.visual + '\nVOICEOVER: ' + s.narration;
    }).join('\n\n') + '\n\nNOTE: Storyboard only; video, footage, and narration audio require separate production.';
  }
  return {text:text, html:html, publicUrl:publicUrl, normalize:normalize, validate:validate, deck:deck, storyboard:storyboard, storyboardText:storyboardText, videoPrompt:videoPrompt, exportHtml:exportHtml};
});