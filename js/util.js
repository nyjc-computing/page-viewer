/* ============================================================
   SHARED HELPERS
   ============================================================ */

/* ============================================================
   HELPERS
   ============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function esc(s){ return String(s).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function absUrl(href, base){ try{ return new URL(href, base||undefined).href; }catch{ return href||''; } }
function trunc(s, n){ s = s.replace(/\s+/g,' ').trim(); return s.length>n ? s.slice(0,n-1)+'…' : s; }

/* Specificity (a,b,c) — ids, classes/attrs/pseudo-classes, element names */
function specOf(sel){
  let a=0,b=0,c=0, s=sel;
  s = s.replace(/::[a-zA-Z-]+(\([^)]*\))?/g, ()=>{ c++; return ''; });
  s = s.replace(/:not\(([^()]*)\)/g,'$1').replace(/:is\(([^()]*)\)/g,'$1').replace(/:where\(([^()]*)\)/g,'');
  s = s.replace(/:[:\w-]+(\([^)]*\))?/g, ()=>{ b++; return ''; });
  a = (s.match(/#[\w-]+/g)||[]).length; s = s.replace(/#[\w-]+/g,'');
  b += (s.match(/\.[\w-]+/g)||[]).length; s = s.replace(/\.[\w-]+/g,'');
  b += (s.match(/\[[^\]]*\]/g)||[]).length; s = s.replace(/\[[^\]]*\]/g,'');
  c += (s.replace(/[>+~,\s]+/g,' ').match(/[a-zA-Z][\w-]*/g)||[]).filter(w=>w!=='*').length;
  return [a,b,c];
}
function specCmp(x,y){ for(let i=0;i<3;i++){ if(x[i]!==y[i]) return x[i]-y[i]; } return 0; }

/* ============================================================
   STATUS BAR
   ============================================================ */
let statusTimer=null;
function setStatus(msg, cls){
  const el = $('#st-msg');
  el.textContent = msg; el.className = cls||'';
  if(cls==='err'){ clearTimeout(statusTimer); statusTimer=setTimeout(()=>{ if(el.className==='err'){ el.textContent='Ready.'; el.className=''; } }, 9000); }
}
