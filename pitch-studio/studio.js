(() => {
  'use strict';
  const core = globalThis.AlfredPitchCore;
  if (!core) throw new Error('Pitch Studio engine is unavailable');
  const $ = (id) => document.getElementById(id);
  const editor = $('pitch-editor');
  const STORE = 'alfred-workspace-v1';
  let workspace;
  try {workspace = JSON.parse(localStorage.getItem(STORE));} catch (_) {}
  if (!workspace || typeof workspace !== 'object' || !Array.isArray(workspace.projects)) {
    workspace = {projects:[],tasks:[],prospects:[]};
  }
  if (!Array.isArray(workspace.prospects)) workspace.prospects = [];
  if (!Array.isArray(workspace.pitchStudio)) workspace.pitchStudio = [];
  const keys = ['name','industry','website','contact','language','goal','audience','problem','concept','solution','scope','price','timeline','creator','heroImage','nextStep'];
  let activeId = null, activeProspectId = '', slideIndex = 0, activeAudit = null, currentPackage = null, videoModified = false;
  function status(msg) {$('status').textContent=msg;}
  function persist() {
    try {localStorage.setItem(STORE, JSON.stringify(workspace));return true;}
    catch (_) {status('Unable to save. Browser storage may be full. Export your backup.');return false;}
  }
  function readForm() {
    const data = Object.fromEntries(keys.map(k => [k, editor.elements.namedItem(k)?.value || '']));
    data.id = activeId || '';
    data.prospectId = activeProspectId;
    if (activeAudit && activeAudit.url === core.publicUrl(data.website)) data.audit = activeAudit;
    return data;
  }
  function setForm(value) {
    const p = core.normalize(value);
    keys.forEach(k=>{const el=editor.elements.namedItem(k);if(el) el.value=p[k] || (k==='creator'?'Arlibera':'');});
    activeId = p.id || null;
    activeProspectId = p.prospectId || '';
    activeAudit = p.audit || null;
    currentPackage = null;videoModified=false;slideIndex=0;
    $('scores').innerHTML='';
    $('audit-status').textContent='';
    if (activeAudit) renderScores(activeAudit);
    $('outreach-area').value='';
    $('video-prompt').value='';
    renderSaved();
    renderPresentation(false);
  }
  function renderSaved() {
    $('count').textContent = '('+workspace.pitchStudio.length+')';
    $('saved-list').innerHTML=workspace.pitchStudio.length ? [...workspace.pitchStudio].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(p =>
      '<button type="button" class="pitch-item '+(p.id===activeId?'active':'')+'" data-id="'+core.html(p.id)+'"><strong>'+core.html(p.name || 'Untitled concept')+'</strong><small>'+core.html(p.concept || p.industry || 'Draft')+'</small></button>'
    ).join('') : '<div class="empty">Your next winning idea starts here.</div>';
  }
  function listProspects() {
    $('import-prospect').innerHTML='<option value="">Select from pipeline…</option>'+workspace.prospects.map(p=>'<option value="'+core.html(p.id)+'">'+core.html(p.name || 'Unnamed')+'</option>').join('');
  }
  function makeOutreach(p) {
    const fr = p.language === 'fr';
    const intro = fr ? 'Bonjour'+(p.contact?' '+p.contact:'')+',' : 'Hi'+(p.contact?' '+p.contact:'')+',';
    const verified = p.problem ? (fr?'En examinant votre activité, une piste mérite réflexion : ':'One opportunity worth exploring is: ')+p.problem : (fr?'J’aimerais mieux comprendre vos priorités digitales.':'I’d love to understand your digital priorities.');
    return intro+'\n\n'+(fr?'Je prépare une idée pour ':'I’ve been exploring a direction for ')+p.name+'. '+verified+'\n\n'+(fr?'Mon idée : ':'My thought: ')+p.solution+'\n\n'+(fr?'Seriez-vous disponible pour un échange de 15 minutes ?':'Would you be open to a 15-minute conversation?')+'\n\n'+p.creator;
  }
  function renderPresentation(generate) {
    const check = core.validate(readForm());
    if(check.errors.length && generate){status(check.errors.join(' ')); editor.reportValidity();return false;}
    if(check.errors.length){currentPackage=null;return false;}
    currentPackage=check.value;
    $('draft-state').textContent = generate?'Generated concept':'Draft concept';
    const slides=core.deck(currentPackage);
    slideIndex=Math.min(slideIndex,slides.length-1);
    const s=slides[slideIndex];
    $('slide').innerHTML='<div class="eyebrow">'+core.html(s.eyebrow)+'</div><div><h2>'+core.html(s.title)+'</h2><p>'+core.html(s.subtitle)+'</p><div class="pill-row">'+s.bullets.map(b=>'<span>'+core.html(b)+'</span>').join('')+'</div></div><div class="stage-footer"><span>'+core.html(currentPackage.creator.toUpperCase())+'</span><span>'+String(slideIndex+1).padStart(2,'0')+' / 06</span></div>';
    $('slide-dots').innerHTML=slides.map((_,i)=>'<button type="button" class="dot '+(i===slideIndex?'active':'')+'" data-index="'+i+'" aria-label="Slide '+(i+1)+'" aria-pressed="'+(i===slideIndex)+'"></button>').join('');
    $('scenes').innerHTML=core.storyboard(currentPackage).map(scene=>'<div class="story-scene"><time>'+scene.start+'–'+scene.end+'s</time><div><strong>'+core.html(scene.visual)+'</strong><p>'+core.html(scene.narration)+'</p></div></div>').join('');
    if(!videoModified) $('video-prompt').value=core.videoPrompt(currentPackage);
    if(generate){$('outreach-area').value=makeOutreach(currentPackage);status('Pitch package generated. Review the facts and tailor your story before presenting.');}
    return true;
  }
  function saveDraft() {
    const raw=readForm(),check=core.validate(raw);
    if (check.errors.length){status(check.errors.join(' '));return false;}
    if(!activeId) activeId='pitch-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
    const existing=workspace.pitchStudio.findIndex(x=>x.id===activeId);
    const previous=existing>=0?workspace.pitchStudio[existing]:null;
    const record={...check.value,id:activeId,prospectId:activeProspectId,audit:activeAudit && activeAudit.url===check.value.website?activeAudit:null,createdAt:previous?.createdAt||Date.now(),updatedAt:Date.now()};
    if(existing>=0)workspace.pitchStudio[existing]=record;else workspace.pitchStudio.push(record);
    if(persist()){status('Saved to Alfred on this device.');renderSaved();return true;}return false;
  }
  function download(name,content,type) {
    const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function filename(){return (currentPackage?.name || 'new-proposal').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'pitch';}
  function mustGenerate(){if(!renderPresentation(true))return false;saveDraft();return true;}
  function renderScores(audit) {
    $('scores').innerHTML=Object.entries(audit.scores||{}).map(([k,v])=>'<span class="score">'+core.html(k)+' · '+core.html(v)+'/100</span>').join('')+
    (audit.findings?.length?'<p class="hint" style="width:100%">Top automated findings: '+audit.findings.map(core.html).join(' · ')+'</p>':'');
  }
  editor.addEventListener('submit',e=>{e.preventDefault();mustGenerate();});
  $('save').addEventListener('click',()=>{if(saveDraft())renderPresentation(false)});
  $('new').addEventListener('click',()=>{setForm({creator:'Arlibera',industry:'real estate',language:'en'});status('New concept ready.');});
  $('delete').addEventListener('click',()=>{if(!activeId)return;if(!confirm('Delete this pitch draft? Your original prospect will stay intact.'))return;workspace.pitchStudio=workspace.pitchStudio.filter(p=>p.id!==activeId);persist();setForm({creator:'Arlibera'});status('Draft deleted.');});
  $('saved-list').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;const p=workspace.pitchStudio.find(p=>p.id===b.dataset.id);if(p){setForm(p);status('Loaded saved pitch.');}});
  $('import').addEventListener('click',()=>{
    const p=workspace.prospects.find(x=>x.id===$('import-prospect').value);if(!p){status('Choose a prospect.');return;}
    setForm({name:p.name,contact:p.contact,website:p.website,problem:p.problem,solution:p.offer||'',audience:p.audience||'',goal:p.goal||'inquiries',language:p.language||'en',creator:'Arlibera',prospectId:p.id,industry:'other'});
    status('Prospect imported. Your pipeline record remains unchanged.');
  });
  $('prev').addEventListener('click',()=>{slideIndex=(slideIndex+5)%6;renderPresentation(false);});
  $('next').addEventListener('click',()=>{slideIndex=(slideIndex+1)%6;renderPresentation(false);});
  $('slide-dots').addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b){slideIndex=Number(b.dataset.index);renderPresentation(false);}});
  $('tab-scenes').addEventListener('click',()=>{ $('scenes-panel').hidden=false;$('prompt-panel').hidden=true;$('tab-scenes').classList.add('active');$('tab-prompt').classList.remove('active');});
  $('tab-prompt').addEventListener('click',()=>{$('scenes-panel').hidden=true;$('prompt-panel').hidden=false;$('tab-prompt').classList.add('active');$('tab-scenes').classList.remove('active');});
  $('video-prompt').addEventListener('input',()=>videoModified=true);
  $('export-deck').addEventListener('click',()=>{if(mustGenerate())download(filename()+'-pitch.html',core.exportHtml(currentPackage),'text/html;charset=utf-8');});
  $('print-deck').addEventListener('click',()=>{if(!mustGenerate())return;const blob=new Blob([core.exportHtml(currentPackage)],{type:'text/html'}),url=URL.createObjectURL(blob),w=window.open(url,'_blank','noopener');if(!w){status('Allow popups to open the printable deck, or download the HTML version.');URL.revokeObjectURL(url);}else{status('Deck opened. Use your browser’s Print → Save as PDF.');setTimeout(()=>URL.revokeObjectURL(url),60000);}});
  $('download-story').addEventListener('click',()=>{if(mustGenerate())download(filename()+'-storyboard.txt',core.storyboardText(currentPackage));});
  $('copy-video').addEventListener('click',async()=>{if(!currentPackage&&!mustGenerate())return;try{await navigator.clipboard.writeText($('video-prompt').value||core.videoPrompt(currentPackage));status('Video generation brief copied.');}catch(_){$('tab-prompt').click();$('video-prompt').select();status('Select and copy the highlighted brief.');}});
  $('copy-outreach').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('outreach-area').value);status('Outreach copied.');}catch(_){$('outreach-area').select();status('Select and copy the highlighted outreach.');}});
  $('backup').addEventListener('click',()=>download('alfred-pitch-studio-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(workspace.pitchStudio,null,2),'application/json'));
  $('audit').addEventListener('click',async()=>{
    const url=core.publicUrl(editor.elements.namedItem('website').value);
    if(!url){$('audit-status').textContent='Enter a public website URL first.';return;}
    const btn=$('audit');btn.disabled=true;$('audit-status').textContent='Checking public mobile Lighthouse results…';activeAudit=null;$('scores').innerHTML='';
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000);
    try {
      const params=new URLSearchParams({url,strategy:'mobile'});
      const response=await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?'+params+'&category=performance&category=accessibility&category=seo&category=best-practices',{signal:ctl.signal});
      if(!response.ok)throw Error('Unavailable');
      const data=await response.json(),report=data.lighthouseResult;
      if(!report?.categories)throw Error('No report');
      if(core.publicUrl(editor.elements.namedItem('website').value)!==url){$('audit-status').textContent='Website changed. Run the check again.';return;}
      const scores=Object.fromEntries(Object.values(report.categories).filter(c=>typeof c.score==='number').map(c=>[String(c.title).slice(0,60),Math.round(c.score*100)]));
      const findings=Object.values(report.audits||{}).filter(a=>typeof a.score==='number'&&a.score<.9&&a.title&&!['manual','notApplicable','informative'].includes(a.scoreDisplayMode)).sort((a,b)=>a.score-b.score).slice(0,5).map(a=>String(a.title).slice(0,160));
      activeAudit={url,checkedAt:Date.now(),scores,findings};renderScores(activeAudit);
      $('audit-status').textContent='Mobile lab results received. Interpret findings cautiously.';
      saveDraft();
    }catch(_){
      $('audit-status').textContent='Automated check unavailable. You can continue with your own verified observation.';
      const link=document.createElement('a');link.href='https://pagespeed.web.dev/analysis?url='+encodeURIComponent(url);link.target='_blank';link.rel='noopener noreferrer';link.textContent=' Open PageSpeed manually ↗';$('audit-status').appendChild(link);
    }finally{clearTimeout(timer);btn.disabled=false;}
  });
  $('use-finding').addEventListener('click',()=>{if(!activeAudit?.findings?.length){status('Run a website check first, or write your own observation.');return;}editor.elements.namedItem('problem').value=activeAudit.findings[0];status('Added a Lighthouse observation. Verify its relevance before using it in a pitch.');});
  editor.elements.namedItem('website').addEventListener('input',()=>{const url=core.publicUrl(editor.elements.namedItem('website').value);if(activeAudit?.url!==url){activeAudit=null;$('scores').innerHTML='';}});
  window.addEventListener('storage',e=>{if(e.key===STORE)$('status').textContent='Alfred changed in another tab. Reload this studio before saving to avoid overwriting newer data.';});
  listProspects();renderSaved();setForm({creator:'Arlibera',industry:'real estate',language:'en'});
})();
