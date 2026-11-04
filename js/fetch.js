/* ============================================================
   FETCH — direct first, then CORS proxies
   ============================================================ */

/* ============================================================
   FETCH — direct first, then CORS proxies, two passes over the
   proxy list to ride out transient 5xx from the public services
   ============================================================ */
let PREF_PROXY = null;

async function fetchText(url, timeout=20000, passes=2, directOnly=false){
  const attempts = [];
  if(directOnly){
    attempts.push({name:'direct', u:url});
  }else{
    if(location.protocol !== 'file:') attempts.push({name:'direct', u:url});
    if(PREF_PROXY){ const p = PROXIES.find(x=>x.name===PREF_PROXY); if(p) attempts.push({name:p.name, u:p.make(url)}); }
    for(const p of PROXIES) if(!attempts.some(a=>a.name===p.name)) attempts.push({name:p.name, u:p.make(url)});
  }

  const errs=[];
  for(let pass=0; pass<2; pass++){
    for(const a of attempts){
      if(pass>0 && a.name==='direct') continue;               /* second pass: proxies only */
      if(pass>0 && a.name==='custom') continue;               /* custom was retried with proxies */
      try{
        const ctl = new AbortController();
        const t = setTimeout(()=>ctl.abort(), timeout);
        const res = await fetch(a.u, {signal:ctl.signal, redirect:'follow'});
        clearTimeout(t);
        if(!res.ok) throw new Error('HTTP '+res.status);
        const text = await res.text();
        if(!text || text.length<30) throw new Error('empty response');
        if(a.name!=='direct' && a.name!=='custom') PREF_PROXY = a.name;
        return {text, via:a.name};
      }catch(e){
        errs.push(a.name+': '+(e.name==='AbortError' ? 'timeout' : (e.message||'failed')));
      }
    }
    if(pass===0 && attempts.length>1) await new Promise(r=>setTimeout(r, 350));
  }
  throw new Error('all sources failed — '+errs.join(' · '));
}

function sheetName(url){
  if(url.startsWith('data:')) return 'linked stylesheet (embedded)';
  try{ const u = new URL(url); const f = u.pathname.split('/').filter(Boolean).pop() || '';
       return (f ? f + ' — ' : '') + u.host; }catch{ return url.slice(0,60); }
}

/* data: URLs cannot always be fetched — decode the payload directly */
function decodeDataUrl(url){
  const comma = url.indexOf(',');
  if(!url.startsWith('data:') || comma<0) return null;
  const meta = url.slice(5, comma);
  const payload = url.slice(comma+1);
  try{
    return /;base64$/i.test(meta) ? decodeURIComponent(escape(atob(payload)))
                                  : decodeURIComponent(payload);
  }catch{ return null; }
}
