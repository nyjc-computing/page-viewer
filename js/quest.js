'use strict';

/* ============================================================
   QUEST TRACKER — gamified RefG §4 element hunt.
   Objectives tick when the student selects the element on the
   page or in the tree. Progress and minimized state persist.
   ============================================================ */
const quest = {
  checked: new Set(),
  items: [],                /* {key, entity, row} */
  counts: new Map(),

  init(){
    try{ const s=localStorage.getItem('pv.ck.v1'); if(s) this.checked=new Set(JSON.parse(s)); }catch{}
    const frag = document.createDocumentFragment();

    const sub = document.createElement('div');
    sub.className = 'q-sub';
    sub.textContent = 'Click elements on the page (or in the tree) to find them.';
    frag.append(sub);

    /* flat list — no chapter headers (user request) */
    CHECKLIST.forEach(g=>{
      g.items.forEach(([key, desc])=>{
        const row = document.createElement('div');
        row.className='q-item'; row.dataset.key=key;
        row.title='View only — select the element on the page to tick it off';
        row.innerHTML = '<span class="q-mark"></span><code>'
          + esc(key==='doctype' ? '<!doctype html>' : key)
          + '</code><span class="n" hidden></span>';
        frag.append(row);
        this.items.push({key, entity:!!g.entity, row});
      });
    });
    this.container = $('#quest-items');
    this.container.append(frag);

    $('#quest-min').addEventListener('click', e=>{
      e.stopPropagation();
      this.setMin(!$('#quest').classList.contains('min'));
    });
    $('#quest').addEventListener('click', ()=>{
      if($('#quest').classList.contains('min')) this.setMin(false);
    });
    $('#btn-quest-reset').addEventListener('click', ()=>{
      this.checked.clear(); this.save(); this.updateAll();
      setStatus('Quest progress reset.');
    });
    try{ if(localStorage.getItem('pv.quest.min')==='1') this.setMin(true); }catch{}

    this.updateAll();
  },

  setMin(min){
    $('#quest').classList.toggle('min', min);
    this.refreshNext();
    try{ localStorage.setItem('pv.quest.min', min ? '1' : '0'); }catch{}
  },
  /* collapsed view: only the next three unfound objectives */
  refreshNext(){
    let shown=0;
    for(const it of this.items){
      const next = !this.checked.has(it.key) && shown<3;
      it.row.classList.toggle('q-next', next);
      if(next) shown++;
    }
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
      it.row.classList.add('q-found');
      setTimeout(()=>it.row.classList.remove('q-found'), 900);
      this.scrollTo(it.row);
      this.refreshNext();
    }
    if(this.items.every(i=>this.checked.has(i.key))) {
      $('#quest').classList.add('complete');
      $('#quest-title').textContent = '⚔ Quest complete!';
      setStatus('Quest complete — every RefG §4 element found. 🎉');
    }
  },

  updateRow(row){
    const key=row.dataset.key;
    const n=this.counts.get(key)||0;
    const done=this.checked.has(key);
    row.classList.toggle('found', done);
    row.querySelector('.q-mark').textContent = done ? '✓' : '◇';
    const nEl=row.querySelector('.n');
    nEl.hidden = !n; nEl.textContent='×'+n;
    row.title='View only — select the element on the page to tick it off';
  },
  updateAll(){
    this.items.forEach(it=>this.updateRow(it.row));
    this.progress();
    this.refreshNext();
    const complete = this.items.length && this.items.every(i=>this.checked.has(i.key));
    $('#quest').classList.toggle('complete', complete);
    if(complete) $('#quest-title').textContent = '⚔ Quest complete!';
    else if($('#quest-title').textContent.startsWith('⚔ Quest complete')) $('#quest-title').textContent = '⚔ Quest: find the HTML elements';
    $('#quest-done-line').hidden = !(complete && $('#quest').classList.contains('min'));
  },
  progress(){
    const done=this.items.filter(i=>this.checked.has(i.key)).length;
    $('#quest-progress').textContent = done+' / '+this.items.length;
    $('#quest-fill').style.width = (100*done/this.items.length)+'%';
  },
  scrollTo(row){
    const c=this.container, top=row.offsetTop;
    if(top < c.scrollTop+4 || top > c.scrollTop + c.clientHeight - 28) c.scrollTop = Math.max(0, top - c.clientHeight/2 + 14);
  },
};

function countOccurrences(s, sub){ return sub ? s.split(sub).length-1 : 0; }
