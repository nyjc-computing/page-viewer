/* ============================================================
   CSS PANEL — per-rule toggles, matched rules
   ============================================================ */

/* ============================================================
   CSS PANEL — parse each stylesheet with the browser's own CSS
   parser, list rules with toggles, show matching rules for the
   selected element (most specific first)
   ============================================================ */
let RULE_SEQ = 0;
function parseCss(cssText){
  const d = document.implementation.createHTMLDocument('parse');
  const st = d.createElement('style');
  st.textContent = cssText;
  d.head.appendChild(st);
  return st.sheet ? [...st.sheet.cssRules] : [];
}
function modelize(rules){
  function walk(list){
    return list.map(r=>{
      const n = {enabled:true, children:null, order:RULE_SEQ++};
      if(typeof CSSStyleRule!=='undefined' && r instanceof CSSStyleRule){
        n.kind='style'; n.sel=r.selectorText;
        n.decls=[...r.style].map(p=>({p, v:r.style.getPropertyValue(p),
                                      imp:r.style.getPropertyPriority(p)}));
        n.spec = specOf(n.sel||'');
        n.collapsed = false;                  /* expanded by default; collapse-all or click to fold */
      }else if(typeof CSSMediaRule!=='undefined' && r instanceof CSSMediaRule){
        n.kind='media'; n.label=r.conditionText||''; n.children=walk([...r.cssRules]);
      }else if(typeof CSSSupportsRule!=='undefined' && r instanceof CSSSupportsRule){
        n.kind='supports'; n.label=r.conditionText||''; n.children=walk([...r.cssRules]);
      }else if(typeof CSSKeyframesRule!=='undefined' && r instanceof CSSKeyframesRule){
        n.kind='keyframes'; n.label=r.name||'keyframes'; n.rawCss=r.cssText;
      }else if(typeof CSSImportRule!=='undefined' && r instanceof CSSImportRule){
        n.kind='import'; n.label=r.href||''; n.rawCss=r.cssText;
      }else{
        n.kind='other'; n.label=(r.cssText||'').slice(0,48); n.rawCss=r.cssText;
      }
      return n;
    });
  }
  return walk(rules);
}

const cssp = {
  sheets: [], styleEls: [], selEl: null,

  reset(){ this.sheets=[]; this.styleEls=[]; this.selEl=null; },

  load(sheetDefs, doc){
    this.reset();
    this.styleEls = [...doc.querySelectorAll('style[data-pv-sheet]')];
    this.sheets = sheetDefs.map(d=>({name:d.name, enabled:true, dirty:false, expanded:false,
                                     origCss:d.css, rules:modelize(parseCss(d.css))}));
    this.render();
  },

  styleElFor(i){ return this.styleEls.find(el=>el.getAttribute('data-pv-sheet')==String(i)); },

  serializeNode(n){
    if(!n.enabled) return '';
    if(n.kind==='media' || n.kind==='supports'){
      const inner = n.children.map(c=>this.serializeNode(c)).join('\n');
      return inner ? '@'+n.kind+' '+n.label+' {'+inner+'}' : '';
    }
    if(n.kind==='style'){
      const decls = n.decls.map(d=>d.p+': '+d.v+(d.imp?' !important':'')).join('; ');
      return n.sel+' { '+decls+'; }';
    }
    return n.rawCss || '';           /* keyframes/import/other keep browser text */
  },

  apply(){
    const isOff = n => !n.enabled || !!(n.children && n.children.some(isOff));
    this.sheets.forEach((sh,i)=>{
      const el = this.styleElFor(i);
      if(!el) return;
      if(!sh.enabled){ el.textContent=''; return; }
      if(sh.rules.some(isOff) || sh.dirty){
        el.textContent = sh.rules.map(r=>this.serializeNode(r)).join('\n');
        sh.dirty = true;
      }else{
        el.textContent = sh.origCss;      /* untouched sheets keep their raw source */
      }
    });
    this.render();
    const total = this.countRules(), off = total - this.countRules(true);
    setStatus(off ? off+' of '+total+' rules disabled — compare the preview.' : total+' rules across '+this.sheets.length+' stylesheets.');
  },
  countRules(onlyEnabled){
    let c=0;
    const walk = list => list.forEach(n=>{
      if(n.kind==='style'){ if(!onlyEnabled || n.enabled) c++; }
      else if(n.children) walk(n.children);
      else c++;
    });
    this.sheets.forEach(sh=>{ if(!onlyEnabled || sh.enabled) walk(sh.rules); });
    return c;
  },

  nodeByPath(path){
    const sh = this.sheets[path[0]];
    if(!sh) return null;
    let list = sh.rules, node = null;
    for(let k=1; k<path.length; k++){
      node = list[path[k]];
      if(!node) return null;
      if(k<path.length-1) list = node.children || [];
    }
    return node;
  },

  setEnabledByPath(path, on){
    if(path.length===1){ const sh=this.sheets[path[0]]; if(sh) sh.enabled = on; }
    else{ const n=this.nodeByPath(path); if(n) n.enabled = on; }
    this.apply();
    this.render();
  },

  /* ---------- rendering ---------- */
  render(){
    const box = $('#css-body');
    const out = [];
    if(this.selEl) out.push('<div class="pv-matches-h">Rules matching '+esc(elLabel(this.selEl))+'</div>');
    if(this.selEl) out.push('<div class="pv-matches">');
    if(this.selEl) this.matchedHtml(out);
    if(!this.sheets.length){
      out.push('<div class="pv-empty">No manageable stylesheet on this page.</div>');
    }
    this.sheets.forEach((sh,si)=>{
      const nr = this.countSheetRules(sh);
      out.push('<div class="pv-sheet">');
      out.push('<div class="pv-sheet-h'+(sh.unmanaged?' unmanaged':'')+'" data-sheet="'+si+'">'
        +(sh.unmanaged?'':'<span class="pv-twist">'+(sh.expanded?'▾':'▸')+'</span>')
        +'<input type="checkbox" data-sheet="'+si+'" '+(sh.enabled?'checked':'')+' title="Enable / disable this whole stylesheet">'
        +'<span class="nm">'+esc(sh.name)+'</span>'
        +'<span class="ct">'+(sh.unmanaged?'loaded by browser — no toggles':nr+' rules')+'</span></div>');
      if(!sh.unmanaged && sh.expanded) this.rulesHtml(sh.rules, si, out, 0);
      out.push('</div>');
    });
    box.innerHTML = out.join('');
  },
  countSheetRules(sh){
    let c=0;
    const walk = list => list.forEach(n=>{ if(n.children) walk(n.children); else c++; });
    walk(sh.rules); return c;
  },

  rulesHtml(rules, si, out, depth){
    rules.forEach((n,ri)=>{
      if(n.kind==='media' || n.kind==='supports'){
        out.push('<div class="pv-rule pv-group">'
          +'<input type="checkbox" data-path="'+si+':'+ri+'" '+(n.enabled?'checked':'')+'>'
          +'<span class="pv-media">@'+n.kind+' '+esc(n.label)+'</span></div>'
          +'<div class="pv-sub">');
        n.children.forEach((c,ci)=>this.ruleHtml(c, si+':'+ri+':'+ci, out));
        out.push('</div>');
      }else this.ruleHtml(n, si+':'+ri, out);
    });
  },
  ruleHtml(n, path, out){
    if(n.kind==='style'){
      const collapsed = n.collapsed ? ' collapsed' : '';
      const decls = n.decls.map(d=>'<div class="pv-decl-line">'+declHtml(d)+'</div>').join('');
      out.push('<div class="pv-rule'+collapsed+(n.enabled?'':' pv-rule-off')+'" data-path="'+path+'">'
        +'<input type="checkbox" data-path="'+path+'" '+(n.enabled?'checked':'')+'>'
        +'<div class="pv-rule-body">'
        +'<div class="pv-sel-line">'+esc(n.sel)+' {</div>'
        +'<div class="pv-decls">'+decls+'</div>'
        +'<div class="pv-brace">}</div>'
        +'</div></div>');
    }else{
      const label = n.kind==='keyframes' ? '@keyframes '+n.label
                  : n.kind==='import' ? '@import '+n.label
                  : n.kind==='other' ? esc(n.label) : '@'+n.kind;
      out.push('<div class="pv-rule'+(n.enabled?'':' pv-rule-off')+'" data-path="'+path+'">'
        +'<input type="checkbox" data-path="'+path+'" '+(n.enabled?'checked':'')+'>'
        +'<span class="pv-media">'+esc(label)+'</span></div>');
    }
  },

  matchedHtml(out){
    const el = this.selEl;
    const hits = this.matchedRules(el);
    if(!hits.length) out.push('<div class="hint">No stylesheet rule selects this element — everything you see comes from the browser defaults.</div>');
    hits.forEach(h=>{
      const collapsed = h.node.collapsed ? ' collapsed' : '';
      const decls = h.node.decls.map(d=>'<div class="pv-decl-line">'+declHtml(d)+'</div>').join('');
      out.push('<div class="pv-rule'+collapsed+(h.node.enabled?'':' pv-rule-off')+'" data-path="'+h.path.join(':')+'">'
        +'<input type="checkbox" data-path="'+h.path.join(':')+'" '+(h.node.enabled?'checked':'')+'>'
        +'<div class="pv-rule-body">'
        +'<div class="pv-sel-line">'+esc(h.node.sel)+' {</div>'
        +(h.media?'<div class="pv-media-line">in @media '+esc(h.media)+'</div>':'')
        +'<div class="pv-decls">'+decls+'</div>'
        +'<div class="pv-brace">}</div>'
        +'</div></div>');
    });
    out.push('<div class="hint">Top rules win: later rules and higher specificity (id → class → element) override the rest. Click a rule to collapse or expand it; blue names are in the RefG §6 list.</div></div>');
  },

  matchedRules(el){
    const hits=[];
    this.sheets.forEach((sh,si)=>{
      if(sh.unmanaged || !sh.enabled) return;
      const walk = (list, prefix, media)=>{
        list.forEach((n,i)=>{
          const path = prefix.concat(i);
          if(n.kind==='style'){
            try{ if(el.matches(n.sel)) hits.push({node:n, path, media}); }catch{}
          }else if(n.children){
            walk(n.children, path, n.kind==='media' ? n.label : media);
          }
        });
      };
      walk(sh.rules, [si], null);     /* sheet index first — data paths must identify the sheet */
    });
    hits.sort((a,b)=> -specCmp(a.node.spec,b.node.spec) || b.node.order-a.node.order);
    return hits;
  },

  showMatches(el){
    this.selEl = el;
    this.render();
  },
};

function declHtml(d){
  const cls = REF_G_CSS.has(d.p) ? ' class="rp" title="Property listed in the H2 Computing Reference Guide (§6)"' : '';
  return '<span'+cls+'>'+esc(d.p)+': '+esc(d.v)+(d.imp?' !important':'')+'</span>';
}

/* rule checkbox + expand-on-click (delegated) */
$('#css-body').addEventListener('change', e=>{
  const cb = e.target;
  if(cb.type!=='checkbox') return;
  if(cb.dataset.sheet!=null){                     /* whole-stylesheet toggle */
    const sh = cssp.sheets[+cb.dataset.sheet];
    if(sh){ sh.enabled = cb.checked; cssp.apply(); cssp.render(); }
    return;
  }
  if(cb.dataset.path) cssp.setEnabledByPath(cb.dataset.path.split(':').map(Number), cb.checked);
});
$('#css-body').addEventListener('click', e=>{
  if(e.target.type==='checkbox') return;
  const sheetH = e.target.closest('.pv-sheet-h');   /* expand / collapse a stylesheet section */
  if(sheetH && sheetH.dataset.sheet!=null){
    const sh = cssp.sheets[+sheetH.dataset.sheet];
    if(sh && !sh.unmanaged){ sh.expanded = !sh.expanded; cssp.render(); }
    return;
  }
  const rule = e.target.closest('.pv-rule');
  if(rule && rule.dataset.path){                    /* collapse / expand a rule */
    const node = cssp.nodeByPath(rule.dataset.path.split(':').map(Number));
    if(node && node.kind==='style'){
      node.collapsed = !node.collapsed;
      rule.classList.toggle('collapsed', node.collapsed);
    }
  }
});
