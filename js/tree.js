/* ============================================================
   DOM TREE — tokenised rows, hover/click sync, find, breadcrumb
   ============================================================ */

/* ============================================================
   PAGE ↔ TREE HOVER (shared controller; injectPageUi fills it in)
   ============================================================ */
let hoverApi = null;

/* ============================================================
   DOM TREE
   ============================================================ */
/* Syntax-lint tokens: every piece of markup is a labelled span so hovering
   (native tooltip) shows what kind of HTML syntax it is. innerHtml must be
   pre-escaped by the caller. */
const TOK_TITLES = {
  tag:'Tag name', an:'Attribute name', av:'Attribute value', eq:'Equals sign',
  lt:'Angle bracket', cm:'HTML comment', tx:'Text content',
};
function tokHtml(kind, innerHtml, extraTitle){
  const title = TOK_TITLES[kind] + (extraTitle ? ' — '+extraTitle : '');
  return '<span class="tok tok-'+kind+'" title="'+esc(title)+'">'+innerHtml+'</span>';
}

/* the element's raw markup, fully tokenised — nothing summarised away */
function attrsRaw(el){
  let h='';
  for(const a of el.attributes){
    if(a.name.startsWith('data-pv')) continue;
    const bool = a.value === '';
    h += ' ' + tokHtml('an', esc(a.name), bool ? 'boolean attribute — has no value' : '');
    if(!bool){
      const v = a.value;
      const shown = v.length>110 ? esc(v.slice(0,110))+'…' : esc(v);
      const extra = v.length>110 ? 'truncated — full value: '+trunc(v,300) : '';
      h += tokHtml('eq','=') + tokHtml('av', '"'+shown+'"', extra);
    }
  }
  return h;
}

const tree = {
  container: $('#tree'),
  el2row: null,
  root: null,

  reset(){ this.container.innerHTML=''; this.el2row = new WeakMap(); this.root=null; findMatches=[]; findIdx=-1; },
  rowFor(el){ return this.el2row ? this.el2row.get(el) : null; },

  build(doc){
    this.reset();
    this._budget = 4000;                       /* rows to auto-expand on huge pages */
    if(doc.doctype) this.container.appendChild(this.makeSpecialRow(
      tokHtml('dt','&lt;!','DOCTYPE declaration — the first line of every HTML document')
        + tokHtml('tag','!doctype') + tokHtml('dt',' html&gt;'),
      'DOCTYPE declaration — the first line of every HTML document',
      'pv-doctype','doctype',doc.doctype));
    this.root = this.makeRow(doc.documentElement);
    this.container.appendChild(this.root.holder);
    this.expandAll(this.root);                 /* fully expanded — nothing hidden from new users */
  },

  expandAll(o){
    if(!o || o.node.nodeType!==1 || this._budget<=0) return;
    this.expand(o); this._budget--;
    if(o.kids) for(const h of o.kids.children){
      const c = h._pv;
      if(c && c.node.nodeType===1) this.expandAll(c);
    }
  },

  makeSpecialRow(innerHtml, title, cls, mdnKey, node){
    const o = {node:node||null, key:mdnKey, built:true, open:false, kids:null, special:true};
    o.holder = document.createElement('div'); o.holder._pv = o;
    o.row = document.createElement('div'); o.row.className='pv-row '+cls;
    o.row.title = title;
    o.row.innerHTML = '<span class="pv-twist"></span><span>'+innerHtml+'</span>';
    o.row._pv = o;
    o.holder.appendChild(o.row);
    return o.holder;
  },

  makeRow(node){
    const o = {node, built:false, open:false, kids:null};
    o.holder = document.createElement('div'); o.holder._pv = o;
    o.row = document.createElement('div'); o.row.className='pv-row'; o.row._pv = o;
    if(node.nodeType===1){
      const tag = esc(node.tagName.toLowerCase());
      o.row.innerHTML = '<span class="pv-twist">'+(twistable(node)?'▸':'')+'</span>'
        + tokHtml('lt','&lt;') + tokHtml('tag', tag) + attrsRaw(node) + tokHtml('lt','&gt;');
      this.el2row.set(node, o);
    }else if(node.nodeType===3){
      o.row.classList.add('pv-text');
      o.row.innerHTML = '<span class="pv-twist"></span>'
        + tokHtml('tx', esc(trunc(node.textContent,120)));
    }else if(node.nodeType===8){
      o.row.classList.add('pv-comment');
      o.row.innerHTML = '<span class="pv-twist"></span>'
        + tokHtml('cm', '&lt;!--'+esc(trunc(node.textContent,86))+'--&gt;');
    }
    o.holder.appendChild(o.row);
    return o;
  },

  buildChildren(o){
    o.kids = document.createElement('div'); o.kids.className='pv-kids';
    for(const n of o.node.childNodes){
      if(n.nodeType===1 && (n.id==='pv-chip' || n.id==='pv-ui-style' || n.id==='pv-hover-overlay'
         || (n.hasAttribute && n.hasAttribute('data-pv-base')))) continue;   /* our own UI */
      if(n.nodeType===1 || n.nodeType===8 || (n.nodeType===3 && n.textContent.trim()))
        o.kids.appendChild(this.makeRow(n).holder);
    }
    o.holder.appendChild(o.kids);
    o.built = true;
  },

  expand(o){ if(!o.built) this.buildChildren(o); o.kids.style.display=''; o.open=true; this.twist(o,'▾'); },
  collapse(o){ if(o.kids) o.kids.style.display='none'; o.open=false; this.twist(o,'▸'); },
  toggle(o){ o.open ? this.collapse(o) : this.expand(o); },
  twist(o,ch){ const t=o.row.querySelector('.pv-twist'); if(t) t.textContent=ch; },

  scrollToRow(o){
    const c = this.container, top = o.row.offsetTop;
    if(top < c.scrollTop+6 || top > c.scrollTop + c.clientHeight - 24)
      c.scrollTop = Math.max(0, top - c.clientHeight/2 + 12);
  },

  ensureVisible(node){
    /* top-down: expanding each ancestor builds the next level's rows,
       so the target's row may only come into existence mid-walk */
    const chain=[];
    for(let n = node.nodeType===1 ? node : node.parentElement; n && n.nodeType===1; n = n.parentElement)
      chain.unshift(n);
    if(this.root && !this.root.open) this.expand(this.root);
    for(const el of chain){
      const r = this.rowFor(el);
      if(r && !r.open) this.expand(r);
    }
    const row = this.rowFor(node);
    if(row) this.scrollToRow(row);
    return row;
  },
};

function twistable(el){
  if(el.children.length>0) return true;
  return [...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim());
}

/* tree events (delegated) */
tree.container.addEventListener('click', e=>{
  const rowEl = e.target.closest('.pv-row'); if(!rowEl || !rowEl._pv) return;
  const o = rowEl._pv;
  if(e.target.classList.contains('pv-twist') && o.node && o.node.nodeType===1 && twistable(o.node)){
    tree.toggle(o); return;
  }
  if(o.special){                                  /* the doctype row */
    clearSelection(); state.selRow=o; o.row.classList.add('pv-sel');
    mdn.showFor('doctype'); checklist.tickKey('doctype'); cssp.showMatches(null);
    return;
  }
  if(o.node.nodeType===1) selectElement(o.node, 'tree');
  else selectTextNode(o);
});
tree.container.addEventListener('mouseover', e=>{
  const rowEl = e.target.closest('.pv-row'); if(!rowEl || !rowEl._pv || !state.doc) return;
  const n = rowEl._pv.node;
  if(n.nodeType===1 && hoverApi) hoverApi.set(n);
});
tree.container.addEventListener('mouseleave', ()=>{ if(hoverApi) hoverApi.set(null); });

/* find-as-you-type (Enter cycles through matches) */
let findMatches=[], findIdx=-1;
$('#tree-find').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); findNext(); }
  else if(e.key==='Escape'){ e.target.value=''; }
});
function findNext(){
  const q = $('#tree-find').value.trim().toLowerCase();
  if(!q || !state.doc){ setStatus('Load a page, then search for a tag, id or class.', q?'err':undefined); return; }
  const bare = q.replace(/^#/,'');
  if(!findMatches.length || findMatches._q!==q){
    findMatches = [...state.doc.querySelectorAll('*')].filter(el=>
      el.tagName.toLowerCase().includes(bare)
    );
    findMatches._q = q; findIdx = -1;
  }
  if(!findMatches.length){ setStatus('Nothing matches “'+q+'”.', 'err'); return; }
  findIdx = (findIdx+1) % findMatches.length;
  setStatus('find: '+(findIdx+1)+' of '+findMatches.length+' — '+elLabel(findMatches[findIdx]));
  selectElement(findMatches[findIdx], 'find');
}

/* ============================================================
   SELECTION — breadcrumb, cross-highlighting, panels
   ============================================================ */
function clearSelection(){
  if(state.sel){ state.sel.classList.remove('pv-selected'); state.sel=null; }
  if(state.selRow){ state.selRow.row.classList.remove('pv-sel'); state.selRow=null; }
}

function selectElement(el, src){
  clearSelection();
  state.sel = el;
  el.classList.add('pv-selected');
  tree.ensureVisible(el);
  const r = tree.rowFor(el);
  if(r){ state.selRow=r; r.row.classList.add('pv-sel'); }
  renderBreadcrumb(el);
  mdn.showFor(el.tagName.toLowerCase());
  checklist.tickForElement(el);
  cssp.showMatches(el);
  if(src!=='page') scrollPreviewTo(el);
}

/* scroll only the preview's window — scrollIntoView would also scroll the app page */
function scrollPreviewTo(el){
  try{
    const win = el.ownerDocument.defaultView;
    const r = el.getBoundingClientRect();
    const top = r.top + win.scrollY - win.innerHeight/2 + Math.min(r.height, win.innerHeight)/2;
    const left = r.left + win.scrollX - Math.max(0, (win.innerWidth - r.width)/2);
    win.scrollTo({left: Math.max(0,left), top: Math.max(0,top)});
  }catch{}
}

function selectTextNode(o){
  clearSelection();
  state.selRow = o;
  tree.ensureVisible(o.node);
  o.row.classList.add('pv-sel');
  tree.scrollToRow(o);
  const p = o.node.parentElement;
  renderBreadcrumb(p);
  mdn.showTextHint();
  checklist.tickForText(o.node.textContent);
  cssp.showMatches(p);
}

function renderBreadcrumb(el){
  const bc = $('#breadcrumb');
  if(!el){ bc.innerHTML='&nbsp;'; return; }
  const chain=[];
  for(let n=el; n && n.nodeType===1; n=n.parentElement) chain.unshift(n);
  bc.innerHTML = chain.map(n=>
    '<span class="crumb">&lt;'+n.tagName.toLowerCase()+'&gt;</span>'
  ).join('<span class="sep">›</span>');
  /* wire clicks */
  const crumbs = bc.querySelectorAll('.crumb');
  crumbs.forEach((c,i)=>{ c.onclick = ()=>selectElement(chain[i], 'crumb'); });
}
