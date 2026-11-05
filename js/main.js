/* ============================================================
   BOOT — wiring and startup
   ============================================================ */
quest.init();
mdn.reset();

$('#btn-load').addEventListener('click', ()=>loadUrl($('#url').value));
$('#url').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); loadUrl(e.target.value); }
});
$('#btn-reload').addEventListener('click', ()=>{
  if(state.lastLoader) state.lastLoader();
  else setStatus('Nothing to reload yet — load a page first.');
});
/* collapse every rule to its single-line form */
$('#btn-css-collapse-all').addEventListener('click', ()=>{
  const walk = list => list.forEach(n=>{
    if(n.kind==='style') n.collapsed = true;
    if(n.children) walk(n.children);
  });
  cssp.sheets.forEach(sh=>{ if(!sh.unmanaged) walk(sh.rules); });
  cssp.render();
});

/* CSS subpane collapse (collapsed by default) */
const topRow = $('#top-row');
const btnCssToggle = $('#btn-css-toggle');
function setCssOpen(open){
  topRow.classList.toggle('css-open', open);
  btnCssToggle.textContent = open ? '– CSS' : '＋ CSS';
  btnCssToggle.setAttribute('aria-pressed', String(open));
  btnCssToggle.title = open ? 'Hide the CSS panel' : 'Show the CSS panel';
  try{ localStorage.setItem('pv.css.open', open ? '1' : '0'); }catch{}
}
btnCssToggle.addEventListener('click', ()=>setCssOpen(!topRow.classList.contains('css-open')));
try{ setCssOpen(localStorage.getItem('pv.css.open')==='1'); }catch{}

/* help dialog */
const helpDlg = $('#help-dlg');
$('#btn-help').addEventListener('click', ()=>helpDlg.showModal());
$('#btn-dlg-close').addEventListener('click', ()=>helpDlg.close());

window.addEventListener('error', e=>setStatus('Script error: '+e.message, 'err'));

/* draggable divider between preview and panels */
const ws = $('#workspace');
const splitter = $('#splitter');
let splitW = null;
function applySplit(px){
  const max = Math.max(360, ws.clientWidth - 270);   /* keep the preview usable */
  splitW = Math.round(Math.min(Math.max(px, 340), max));
  ws.style.gridTemplateColumns = 'minmax(240px,1fr) 6px ' + splitW + 'px';
}
splitter.addEventListener('pointerdown', e=>{
  e.preventDefault();
  splitter.classList.add('dragging');
  const rect = ws.getBoundingClientRect();
  const move = ev=>applySplit(rect.right - ev.clientX);
  const up = ()=>{
    splitter.classList.remove('dragging');
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    try{ localStorage.setItem('pv.split', String(splitW)); }catch{}
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
});
try{
  const saved = parseInt(localStorage.getItem('pv.split'), 10);
  if(saved >= 340 && saved <= 1600) ws.style.gridTemplateColumns = 'minmax(240px,1fr) 6px ' + saved + 'px';
}catch{}

loadSample();     /* the sample page is the starting point on load and refresh */
