/* ============================================================
   PAGE LOADING — fetch, sanitise, mount into the preview iframe
   ============================================================ */

/* ============================================================
   PAGE PREPARATION — parse, sanitise, inline stylesheets
   ============================================================ */
async function preparePage(htmlText, baseUrl){
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  if(!doc.querySelector('body') || doc.querySelectorAll('*').length < 4)
    throw new Error('response does not look like an HTML page');

  /* fetch external stylesheets so the CSS panel can manage them */
  const nodes = [...doc.querySelectorAll('style, link[rel~="stylesheet"]')];
  await Promise.all(nodes.map(n=>{
    if(n.tagName==='STYLE'){ n._pv = n.textContent; n._pvName='inline <style>'; return Promise.resolve(); }
    const href = n.getAttribute('href');
    if(!href) return Promise.resolve();
    if(href.startsWith('data:')){
      const css = decodeDataUrl(href);
      if(css){ n._pv = css; n._pvName = sheetName(href); }
      return Promise.resolve();
    }
    const abs = absUrl(href, baseUrl);
    return fetchText(abs, 15000)
      .then(r=>{ n._pv = r.text; n._pvName = sheetName(abs); })
      .catch(()=>{});                                        /* leave link for the browser */
  }));

  /* number the manageable sheets in document order */
  const sheets = [];
  for(const n of [...doc.querySelectorAll('style, link[rel~="stylesheet"]')]){
    if(n._pv == null) continue;
    const st = doc.createElement('style');
    st.setAttribute('data-pv-sheet', sheets.length);
    st.textContent = n._pv;
    n.replaceWith(st);
    sheets.push({name: sheets.some(s=>s.name===n._pvName && n._pvName==='inline <style>')
                             ? n._pvName+' ('+(sheets.length+1)+')' : n._pvName, css:n._pv});
  }

  /* sanitise */
  doc.querySelectorAll('script, noscript, object, embed, applet').forEach(n=>n.remove());
  doc.querySelectorAll('meta').forEach(m=>{
    const he = (m.getAttribute('http-equiv')||'').toLowerCase();
    if(he==='refresh' || he==='content-security-policy') m.remove();
  });
  doc.querySelectorAll('[integrity]').forEach(n=>n.removeAttribute('integrity'));
  doc.querySelectorAll('*').forEach(el=>{
    for(const a of [...el.attributes]) if(/^on/i.test(a.name)) el.removeAttribute(a.name);
  });

  /* our own base: relative URLs resolve against the real site, links stay inert */
  doc.querySelectorAll('base').forEach(b=>b.remove());
  const base = doc.createElement('base');
  base.setAttribute('href', baseUrl || location.href);
  base.setAttribute('target','_blank');
  base.setAttribute('data-pv-base','');
  (doc.head || doc.documentElement).prepend(base);

  const html = '<!doctype html>' + doc.documentElement.outerHTML;
  return {html, sheets, baseUrl, rawSource: htmlText};
}

/* ============================================================
   LOADING
   ============================================================ */
const state = { doc:null, baseUrl:'', via:'', sheets:[], sel:null, selRow:null, label:'', lastLoader:null };
const frame = $('#pv-frame');
const pending = {meta:null};

function resetWorkspaces(){
  state.doc=null; state.sel=null; state.selRow=null; state.baseUrl='';
  $('#tree').innerHTML='';
  $('#css-body').innerHTML='';
  $('#breadcrumb') && ($('#breadcrumb').textContent='');
  mdn.reset();
}

function banner(msg, url){
  const b = $('#load-banner');
  b.hidden = false;
  b.innerHTML = '<b>Could not load this page.</b> '+esc(msg)
    + '<br>Sites often block public proxies (the school website does), and proxies are sometimes down or rate-limited. You can still:'
    + '<div class="acts">'
    + '<button id="bn-sample" class="primary">Load the sample page</button>'
    + '<button id="bn-retry">Try again</button>'
    + (url ? '<a href="'+esc(url)+'" target="_blank" rel="noopener"><button>Open site directly ↗</button></a>' : '')
    + '</div>';
  $('#bn-sample').onclick = ()=>{ b.hidden=true; loadSample(); };
  $('#bn-retry').onclick  = ()=>{ b.hidden=true; state.lastLoader && state.lastLoader(); };
}

async function loadUrl(url){
  url = (url||'').trim();
  if(!url) url = $('#url').placeholder;          /* the placeholder is the default target */
  if(url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
  if(!/^https?:/i.test(url)){ setStatus('Enter a http(s) URL.', 'err'); return; }
  state.lastLoader = ()=>loadUrl(url);
  setStatus('Loading '+url+' …');
  $('#load-banner').hidden = true;
  try{
    const r = await fetchText(url, 25000);
    const meta = await preparePage(r.text, url);
    meta.via = r.via; meta.label = url;
    mountPage(meta);
  }catch(e){
    resetWorkspaces();
    banner(e.message, url);
    setStatus('Load failed: '+e.message, 'err');
  }
}

function loadSample(){
  state.lastLoader = loadSample;
  $('#load-banner').hidden = true;
  setStatus('Preparing sample page …');
  preparePage(SAMPLE_HTML, '')
    .then(meta=>{
      meta.via='built-in sample'; meta.label='sample page';
      mountPage(meta);
    })
    .catch(e=>{ banner(e.message); setStatus('Sample failed: '+e.message, 'err'); });
}

function mountPage(meta){
  resetWorkspaces();
  pending.meta = meta;
  frame.srcdoc = meta.html;
}

frame.addEventListener('load', ()=>{
  const meta = pending.meta; pending.meta = null;
  const doc = frame.contentDocument;
  if(!meta || !doc || !doc.body) return;
  state.doc = doc;
  state.baseUrl = meta.baseUrl;
  state.via = meta.via;
  state.label = meta.label;
  state.sheets = meta.sheets;
  injectPageUi(doc);
  tree.build(doc);
  cssp.load(meta.sheets, doc);
  quest.scan(meta);
  setStatus('Loaded '+meta.label+' — '+doc.querySelectorAll('*').length+' elements · '+
            meta.sheets.length+' stylesheet'+(meta.sheets.length===1?'':'s')+' · via '+meta.via);
});

/* Styles injected into the inspected page: outlines, hover chip */
const PAGE_UI_CSS = `
#pv-chip{position:absolute;top:0;left:0;z-index:2147483647;font:600 11px/1.3 ui-monospace,Consolas,monospace;
  background:#ff5fa2;color:#1c0410;padding:4px 9px;border-radius:5px 5px 5px 0;pointer-events:none;
  box-shadow:0 2px 10px rgba(0,0,0,.4);display:none;white-space:nowrap;max-width:90vw;overflow:hidden}
#pv-hover-overlay{position:absolute;z-index:2147483646;pointer-events:none;box-sizing:border-box;
  background:rgba(255,95,162,.25);outline:1px solid #ff5fa2;display:none}
.pv-selected{outline:2px solid #58a6ff !important;outline-offset:-1px;
  background-color:rgba(88,166,255,.10) !important}
`;

function injectPageUi(doc){
  const st = doc.createElement('style');
  st.id = 'pv-ui-style';
  st.textContent = PAGE_UI_CSS;
  doc.head.appendChild(st);
  const chip = doc.createElement('div');
  chip.id = 'pv-chip';
  doc.body.appendChild(chip);
  const overlay = doc.createElement('div');
  overlay.id = 'pv-hover-overlay';
  doc.body.appendChild(overlay);

  let liveEl=null;
  function setLive(el){
    if(el===liveEl) return;
    if(liveEl){ liveEl.classList.remove('pv-hover'); const r=tree.rowFor(liveEl); if(r) r.row.classList.remove('pv-live'); }
    liveEl = el;
    if(el){
      el.classList.add('pv-hover');
      chip.textContent = '<'+el.tagName.toLowerCase()+'> ('+(el.offsetWidth||0)+'×'+(el.offsetHeight||0)+')';
      chip.style.display='block';
      /* DevTools-style translucent overlay + label pinned to the element's corner */
      const win = doc.defaultView;
      const r = el.getBoundingClientRect();
      chip.style.left = (r.left + win.scrollX) + 'px';
      chip.style.top = Math.max(2, r.top + win.scrollY) + 'px';
      if(r.width>1 && r.height>1){
        overlay.style.left = (r.left + win.scrollX) + 'px';
        overlay.style.top = (r.top + win.scrollY) + 'px';
        overlay.style.width = r.width + 'px';
        overlay.style.height = r.height + 'px';
        overlay.style.display = 'block';
      }else overlay.style.display='none';
      const r2 = tree.rowFor(el);
      if(r2){ r2.row.classList.add('pv-live'); tree.scrollToRow(r2); }
    }else{
      chip.style.display='none';
      overlay.style.display='none';
    }
  }
  hoverApi = {set:setLive};
  doc.addEventListener('mouseover', e=>{
    const el = e.target.nodeType===1 ? e.target : e.target.parentElement;
    if(!el || el.id==='pv-chip' || el.id==='pv-ui-style') return;
    if(el.closest && !doc.body.contains(el)) return;
    setLive(el);
  });
  doc.documentElement.addEventListener('mouseleave', ()=>setLive(null));

  doc.addEventListener('click', e=>{
    /* links and buttons are fully inert — clicking only selects */
    const el = e.target.nodeType===1 ? e.target : e.target.parentElement;
    if(el && el.closest && el.closest('a, button, input[type=submit], input[type=button], input[type=image]')){
      e.preventDefault();
      if(el.closest('a')) setStatus('Links are disabled in the preview — clicking selects the element.');
    }
    if(el && el.id!=='pv-chip' && el.id!=='pv-hover-overlay') selectElement(el, 'page');
  });
}

function elLabel(el){
  let s = '<'+el.tagName.toLowerCase()+'>';
  if(el.id) s += ' #'+el.id;
  else if(typeof el.className==='string'){
    const cls = el.className.trim().split(/\s+/).filter(c=>c && !c.startsWith('pv-'));
    if(cls.length) s += ' .'+cls.slice(0,2).join('.');
  }
  return s;
}
function pageClasses(el){
  return typeof el.className==='string'
    ? el.className.trim().split(/\s+/).filter(c=>c && !c.startsWith('pv-')) : [];
}
