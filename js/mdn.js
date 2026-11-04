/* ============================================================
   MDN REFERENCE PANEL — local blurbs + article from the content repo
   ============================================================ */

/* Typography for the MDN mini-frame (light theme) */
const MDN_CSS = `
body{font:15px/1.65 system-ui,"Segoe UI",sans-serif;color:#1b1b1f;background:#fff;
     margin:0;padding:18px 26px 60px;max-width:72ch;margin-inline:auto}
h1{font-size:1.6em;line-height:1.2;border-bottom:1px solid #e5e7eb;padding-bottom:.3em}
h1 code{font-size:.9em}
h2{font-size:1.25em;margin-top:1.6em;border-bottom:1px solid #eef0f2;padding-bottom:.2em}
code{font-family:ui-monospace,Consolas,monospace;font-size:.9em;background:#f2f4f7;
     border-radius:4px;padding:1px 5px}
pre{background:#f6f8fa;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;
    overflow:auto;line-height:1.5}
pre code{background:none;padding:0}
table{border-collapse:collapse;margin:12px 0}
th,td{border:1px solid #d8dde3;padding:6px 12px;text-align:left;font-size:.92em}
th{background:#f2f6fa}
a{color:#1852cc}
img{max-width:100%}
blockquote{margin:12px 0;padding:8px 16px;border-left:4px solid #cdd7e1;background:#f8fafc;color:#3c4652}
dl dt{font-weight:600;margin-top:.8em}
dl dd{margin:2px 0 0 22px}
hr{border:0;border-top:1px solid #e5e7eb;margin:20px 0}
.notecard,.note{border:1px solid #d3e2f5;border-left:4px solid #4d9fff;background:#f2f8ff;
   border-radius:4px;padding:10px 14px;margin:14px 0}
`;

/* Public CORS proxies (tried in order; the winner is remembered first next time) */
const PROXIES = [
  {name:'allorigins', make:u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u)},
  {name:'codetabs',   make:u=>'https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(u)},
  {name:'corsproxy.io', make:u=>'https://corsproxy.io/?url='+encodeURIComponent(u)},
];

/* ============================================================
   MDN REFERENCE PANEL — instant local summary, full MDN page
   fetched through the same proxy chain when the network allows
   ============================================================ */
const mdn = {
  cur:null, cache:new Map(), failed:new Map(),
  pill: $('#mdn-pill'), blurb: $('#mdn-blurb'),
  frameEl: $('#mdn-frame'), err: $('#mdn-err'), link: $('#mdn-link'),

  reset(){
    this.cur=null; this.setPill('—'); this.link.hidden=true;
    this.blurb.innerHTML='Click an element in the HTML tree or on the page to read about it.';
    this.frameEl.style.display='none'; this.frameEl.srcdoc='';
    this.err.style.display='none';
  },

  setPill(t){ this.pill.textContent=t; this.pill.classList.toggle('none', t==='—'); },

  showFor(key){
    this.cur=key;
    this.setPill('<'+key+'>');
    this.blurb.innerHTML = ELEMENT_INFO[key] || fallbackInfo(key);
    const url = mdnUrlFor(key);
    this.link.hidden=false; this.link.href=url;
    this.frameEl.style.display='none'; this.frameEl.srcdoc='';
    if(this.cache.has(key)){ this.render(this.cache.get(key)); return; }
    if(this.failed.has(key) && Date.now()-this.failed.get(key) < 90000){
      this.err.style.display='block';
      this.err.innerHTML='MDN was unavailable moments ago — <a href="'+esc(url)+'" target="_blank" rel="noopener">open MDN ↗</a> or come back shortly.';
      return;
    }
    this.err.style.display='block'; this.err.textContent='Loading the full MDN page…';
    this.loadMdn(key, url);
  },

  loadMdn(key, pageUrl){
    const done = html => { this.cache.set(key, html); if(this.cur===key) this.render(html); };
    const fail = e => {
      if(this.cur!==key) return;
      this.failed.set(key, Date.now());
      this.err.innerHTML = 'Full MDN page unavailable right now ('+esc(trunc(e.message,110))+'). '
        +'The summary above is built in — <a href="'+esc(pageUrl)+'" target="_blank" rel="noopener">open MDN ↗</a>';
    };
    const slug = mdnSlug(key);
    const sources = [];
    if(slug){
      sources.push([mdnLocalUrl(slug), true]);
      sources.push([mdnRawUrl(slug, 'https://cdn.jsdelivr.net/gh/mdn/content@main/files/en-us/'), true]);
      sources.push([mdnRawUrl(slug, 'https://raw.githubusercontent.com/mdn/content/main/files/en-us/'), true]);
    }
    sources.push([pageUrl, false]);
    let chain = Promise.reject(new Error('no sources'));
    for(const [u, direct] of sources){
      chain = chain.catch(() => fetchText(u, direct ? 10000 : 15000, direct ? 1 : 2, direct)
        .then(r => { const md = u.endsWith('.md'); return md ? mdToHtml(r.text, pageUrl) : extractMdn(r.text, pageUrl); })
        .then(html => done(html)));
    }
    chain.catch(fail);
  },

  showTextHint(){
    this.cur='__text';
    this.setPill('text');
    this.blurb.innerHTML='A <b>text node</b> — the content inside an element. Its meaning comes from the element that contains it: select the parent element to see its rules.';
    this.link.hidden=true;
    this.frameEl.style.display='none'; this.frameEl.srcdoc='';
    this.err.style.display='none';
  },

  render(html){
    this.err.style.display='none';
    this.frameEl.srcdoc=html;
    this.frameEl.style.display='block';
  },
};

function extractMdn(htmlText, pageUrl){
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const art = doc.querySelector('main#content') || doc.querySelector('article')
           || doc.querySelector('main') || doc.body;
  if(!art) throw new Error('unexpected MDN page structure');
  art.querySelectorAll('script,style,link,nav,aside,form,button,input,select,textarea,iframe,object,embed,'
    +'.breadcrumbs,.content-feedback,.article-footer,[id="browser_compatibility"],[role="navigation"]')
    .forEach(n=>n.remove());
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<base href="'+pageUrl+'" target="_blank">'
    +'<style>'+MDN_CSS+'</style></head><body>'+art.innerHTML+'</body></html>';
}

/* MDN article sources, tried in order:
   1. bundled content/ file (same-origin — works offline and on filtered school networks)
   2. mdn/content repo via jsDelivr (CORS-open)
   3. mdn/content repo via raw.githubusercontent (CORS-open)
   4. the rendered MDN page through the proxy chain (last resort) */
function mdnSlug(key){
  if(key==='doctype') return 'glossary/doctype';
  if(key.charAt(0)==='&') return 'glossary/character_reference';
  if(/^h[1-6]$/i.test(key)) return 'web/html/reference/elements/heading_elements';
  if(/^[a-z0-9-]+$/i.test(key)) return 'web/html/reference/elements/'+key.toLowerCase();
  return null;
}
function mdnLocalUrl(slug){ return 'content/'+slug.split('/').join('--')+'.md'; }
function mdnRawUrl(slug, base){
  return base + slug + '/index.md';
}

/* Minimal Markdown renderer for MDN repo pages: front matter, macro calls,
   fenced code (skipping interactive examples), raw HTML blocks (MDN embeds
   its attribute tables verbatim), headings, lists, quotes, inline code,
   links and bold. */
function mdToHtml(md, pageUrl){
  let title='';
  const fm=/^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if(fm){ const t=/^title:\s*(.+)$/m.exec(fm[1]); if(t) title=t[1].trim().replace(/^["']+|["']+$/g,''); }
  md = md.replace(/^---\r?\n[\s\S]*?\r?\n---\s*\n/, '');
  md = md.replace(/\{\{InteractiveExample[^{}]*\}\}/g, '');   /* live demos need JS */
  md = md.replace(/\{\{[^{}]*\}\}/g, m=>{
    const q=/"([^"]*)"/.exec(m);
    return q ? '`'+q[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>')+'`' : '';
  });
  function inline(s){
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m2,t2,u2)=>{
      const href = u2.startsWith('/') ? 'https://developer.mozilla.org'+u2 : u2;
      return '<a href="'+href+'">'+t2+'</a>';
    });
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s;
  }
  const lines = md.split(/\r?\n/);
  const out=[];
  let i=0, para=[], listType=null, inCode=false, codeBuf=[];
  const flushPara=()=>{ if(para.length){ out.push('<p>'+inline(para.join(' '))+'</p>'); para=[]; } };
  const closeList=()=>{ if(listType){ out.push('</'+listType+'>'); listType=null; } };
  const openList=t=>{ if(listType!==t){ closeList(); listType=t; out.push('<'+t+'>'); } };
  while(i<lines.length){
    const line=lines[i];
    if(inCode){
      if(/^```/.test(line)){ out.push('<pre><code>'+esc(codeBuf.join('\n'))+'</code></pre>'); inCode=false; codeBuf=[]; }
      else codeBuf.push(line);
      i++; continue;
    }
    const fence=/^```\s*([\w-]*)/.exec(line);
    if(fence){
      flushPara(); closeList();
      if(/interactive-example/.test(line)){            /* live demo needs JS — skip the block */
        i++; while(i<lines.length && !/^```/.test(lines[i])) i++; i++; continue;
      }
      inCode=true; codeBuf=[]; i++; continue;
    }
    if(/^\s*$/.test(line)){ flushPara(); closeList(); i++; continue; }
    const h=/^(#{1,5})\s+(.*)$/.exec(line);
    if(h){ flushPara(); closeList(); const l=Math.min(h[1].length+1,5);
           out.push('<h'+l+'>'+inline(h[2])+'</h'+l+'>'); i++; continue; }
    if(/^(-{3,}|\*{3,})\s*$/.test(line)){ flushPara(); closeList(); out.push('<hr>'); i++; continue; }
    if(/^<[^>]/.test(line)){
      flushPara(); closeList();
      if(/^<\/?(table|dl|div|p|ol|ul|h[1-6]|blockquote|figure|pre|section|details|video|audio|iframe|main|nav|span)\b/i.test(line)){
        const buf=[];
        while(i<lines.length && !/^\s*$/.test(lines[i])){ buf.push(lines[i]); i++; }
        out.push(buf.join('\n')); continue;
      }
    }
    let li=/^[-*]\s+(.*)$/.exec(line);
    if(li){ flushPara(); openList('ul'); out.push('<li>'+inline(li[1])+'</li>'); i++; continue; }
    li=/^\d+[.)]\s+(.*)$/.exec(line);
    if(li){ flushPara(); openList('ol'); out.push('<li>'+inline(li[1])+'</li>'); i++; continue; }
    if(/^> ?/.test(line)){ flushPara(); closeList(); out.push('<blockquote>'+inline(line.replace(/^> ?/,''))+'</blockquote>'); i++; continue; }
    para.push(line.trim()); i++;
  }
  flushPara(); closeList();
  const h1 = title ? '<h1>'+inline(title)+'</h1>' : '';
  /* raw HTML blocks (attribute tables) carry repo-relative links */
  let bodyHtml = out.join('\n').replace(/href="\//g, 'href="https://developer.mozilla.org/');
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<base href="'+pageUrl+'" target="_blank">'
    +'<style>'+MDN_CSS+'</style></head><body>'+h1+bodyHtml+'</body></html>';
}
