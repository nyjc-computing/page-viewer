/* ============================================================
   CHECKLIST — RefG §4 element list
   ============================================================ */

/* ============================================================
   CHECKLIST — the H2 Computing Reference Guide §4 element list
   ============================================================ */
const checklist = {
  checked: new Set(),
  items: [],                /* {key, entity, row} */
  counts: new Map(),

  init(){
    try{ const s=localStorage.getItem('pv.ck.v1'); if(s) this.checked=new Set(JSON.parse(s)); }catch{}
    const frag = document.createDocumentFragment();
    CHECKLIST.forEach(g=>{
      frag.append(Object.assign(document.createElement('div'), {className:'ck-group', textContent:g.group}));
      g.items.forEach(([key])=>{
        const row = document.createElement('div');
        row.className='ck-item'; row.dataset.key=key;
        row.title='Find this element on the page (or in the tree) and click it — it ticks itself';
        row.innerHTML = '<input type="checkbox"><code>'
          + esc(key==='doctype' ? '<!doctype html>' : key)
          + '</code><span class="n" hidden></span>';
        frag.append(row);
        this.items.push({key, entity:!!g.entity, row});
      });
    });
    this.container = $('#ck-body');
    this.container.append(frag);

    /* checkboxes are indicators only — items tick themselves when the
       student selects the element on the page or in the tree */
    this.container.addEventListener('click', e=>{
      if(e.target.type==='checkbox'){
        e.preventDefault();
        ckToast('Items tick themselves: find and click the matching element on the page (or in the HTML tree).');
        return;
      }
      const row=e.target.closest('.ck-item'); if(!row) return;
      this.jumpTo(row.dataset.key);
    });
    $('#btn-ck-reset').addEventListener('click', ()=>{
      this.checked.clear(); this.save(); this.updateAll();
    });
    this.updateAll();
  },

  save(){ try{ localStorage.setItem('pv.ck.v1', JSON.stringify([...this.checked])); }catch{} },

  scan(meta){
    const doc = state.doc;
    this.counts = new Map();
    for(const it of this.items){
      if(it.entity){
        this.counts.set(it.key, countOccurrences(meta.rawSource||'', it.key));
      }else{
        let n=0;
        try{
          n = it.key==='doctype' ? (doc.doctype?1:0) : doc.querySelectorAll(it.key).length;
        }catch{}
        this.counts.set(it.key, n);
      }
    }
    this.updateAll();
  },

  tickForElement(el){
    this.tickKey(el.tagName.toLowerCase());
    this.tickForText(el.textContent || '');
  },
  tickForText(text){
    for(const it of this.items)
      if(it.entity && !this.checked.has(it.key) && text.includes(ENT_DEC[it.key])) this.tick(it.key);
  },
  tickKey(key){ if(this.items.some(i=>i.key===key)) this.tick(key); },
  tick(key){
    if(this.checked.has(key)) return;
    this.checked.add(key); this.save();
    const it=this.items.find(i=>i.key===key);
    if(it){
      this.updateRow(it.row); this.progress();
      it.row.classList.add('pv-flash');
      setTimeout(()=>it.row.classList.remove('pv-flash'), 1300);
      this.scrollTo(it.row);
    }
  },

  jumpTo(key){
    if(!state.doc){ setStatus('Load a page first — then click checklist entries to find them on it.', 'err'); return; }
    if(key==='doctype'){
      const root=state.doc.documentElement;
      if(this.checked.has(key)) setStatus('The doctype is already ticked — it is the first line of the source.');
      selectElement(root, 'checklist'); mdn.showFor('doctype');
      return;
    }
    let el=null;
    if(key.charAt(0)==='&'){
      const dec = ENT_DEC[key];
      const all = [...state.doc.querySelectorAll('body *')];
      el = all.find(e=>!e.children.length && (e.textContent||'').includes(dec))
        || all.find(e=>(e.textContent||'').includes(dec));
    }else{
      try{ el = state.doc.querySelector(key); }catch{}
    }
    if(el) selectElement(el, 'checklist');
    else setStatus('“'+key+'” is not on this page — try another page or the sample.', 'err');
  },

  updateRow(row){
    const key=row.dataset.key;
    const n=this.counts.get(key)||0;
    row.querySelector('input').checked = this.checked.has(key);
    row.classList.toggle('done', this.checked.has(key));
    const nEl=row.querySelector('.n');
    nEl.hidden = !n; nEl.textContent='×'+n;
  },
  updateAll(){ this.items.forEach(it=>this.updateRow(it.row)); this.progress(); },
  progress(){
    const done=this.items.filter(i=>this.checked.has(i.key)).length;
    $('#ck-progress').textContent = done+' / '+this.items.length;
  },
  scrollTo(row){
    const c=this.container, top=row.offsetTop;
    if(top < c.scrollTop+4 || top > c.scrollTop + c.clientHeight - 28)
      c.scrollTop = Math.max(0, top - c.clientHeight/2 + 14);
  },
};

function countOccurrences(s, sub){ return sub ? s.split(sub).length-1 : 0; }

/* toast in the checklist panel */
let ckToastTimer=null;
function ckToast(msg){
  const t=$('#ck-toast');
  t.textContent=msg;
  t.hidden=false;
  t.classList.remove('show');
  void t.offsetWidth;                        /* restart the animation */
  t.classList.add('show');
  clearTimeout(ckToastTimer);
  ckToastTimer=setTimeout(()=>{ t.hidden=true; t.classList.remove('show'); }, 2850);
}
