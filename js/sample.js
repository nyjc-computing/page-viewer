/* ============================================================
   BUILT-IN SAMPLE PAGE
   ============================================================ */

/* ---------- built-in sample page ---------- */
const flaskSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">'
 +'<rect width="400" height="260" fill="#eef5f8"/>'
 +'<path d="M170 38h60v12h-9v40l54 100a17 17 0 0 1-15 25H140a17 17 0 0 1-15-25l54-100V50h-9z" fill="#fff" stroke="#0b4f6c" stroke-width="4"/>'
 +'<path d="M146 172l32-60h44l32 60a13 13 0 0 1-12 20H158a13 13 0 0 1-12-20z" fill="#7cc4ff" opacity="0.9"/>'
 +'<circle cx="188" cy="152" r="7" fill="#dff1ff"/>'
 +'<circle cx="213" cy="168" r="5" fill="#dff1ff"/>'
 +'<circle cx="201" cy="132" r="4" fill="#dff1ff"/>'
 +'<text x="200" y="244" text-anchor="middle" font-family="Verdana" font-size="13" fill="#0b4f6c">alum solution, day 5</text>'
 +'</svg>';
const flaskUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(flaskSvg);
const EXTRA_CSS = '/* second stylesheet, linked with <link> so it appears as its own sheet */\n'
 + '.tagline{letter-spacing:.05em}\n'
 + '#join{border:2px dashed #0b4f6c;border-radius:8px;padding:4px 14px;margin-top:8px}\n'
 + 'th{font-family:Verdana,sans-serif}\n';
const extraUri = 'data:text/css;base64,' + btoa(EXTRA_CSS);

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Nanyang Science Club — Crystal Growing</title>
<link rel="stylesheet" href="${extraUri}">
<style>
/* element selector — lowest specificity */
body{font-family:Georgia,'Times New Roman',serif;margin:0 auto;max-width:720px;
     padding:0 16px;color:#1d2733;background:#fdfdf8;line-height:1.6}
.sample-note{background:#fff8e1;border:1px solid #e6c34c;border-radius:6px;
             padding:10px 14px;margin:14px 0 0;font-family:Verdana,sans-serif;font-size:.88em}
h1,h2,h3{font-family:Verdana,sans-serif;color:#0b4f6c;line-height:1.25}
a{color:#0a66c2}
a:hover{color:#d0342c}            /* pseudo-class */
p{margin:.6em 0}
p.compact{line-height:1.25}       /* class beats element */
#top{border-bottom:4px double #0b4f6c;padding-bottom:8px}
#footer a{color:#7d8fa1}          /* id beats element selector */
nav ul{list-style:none;display:flex;gap:12px;padding:0}
nav a.link-btn{color:#fff;background:#0a66c2;padding:4px 14px;border-radius:4px;text-decoration:none}
main{display:grid;grid-template-columns:2fr 1fr;gap:20px}
aside.tips{background:#eef4f7;border-left:4px solid #0b4f6c;padding:8px 12px;font-size:.95em}
figure{margin:12px 0}
figcaption{font-size:.85em;color:#5a6b7b}
img{max-width:100%;height:auto;border:1px solid #d5dde3}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #b9c4cd;padding:6px 10px;text-align:left}
thead th{background:#0b4f6c;color:#fff}
tbody tr:nth-child(even){background:#eef2f6}   /* pseudo-class on rows */
caption{caption-side:bottom;font-size:.85em;color:#5a6b7b;padding-top:6px}
blockquote{margin:1em 0;padding:8px 14px;border-left:4px solid #d0342c;background:#fdf0ee;font-style:italic}
pre{background:#f2f4f6;padding:10px;overflow:auto;border-radius:4px}
code{font-family:'Courier New',monospace}
mark{background:#ffe58a}
label{display:inline-block;min-width:84px}
button{font:inherit;background:#0a66c2;color:#fff;border:0;border-radius:4px;padding:6px 16px}
@media (max-width:640px){         /* narrow preview pane triggers this */
  main{grid-template-columns:1fr}
  nav ul{flex-direction:column;gap:4px}
}
</style>
</head>
<body>

<div class="sample-note">
  <strong>This is a sample page</strong> built to demonstrate the basic HTML elements on
  your checklist — explore it with the panels beside it. To inspect any other page, type
  its address in the URL bar above and click <b>Load page from URL</b>.
</div>

<!-- Site header: appears on every page -->
<header id="top">
  <h1>Nanyang Science Club</h1>
  <p class="tagline">Experiment of the month: <strong>crystal growing</strong></p>
  <nav>
    <ul>
      <li><a href="#results">Results</a></li>
      <li><a class="link-btn" href="#join">Join us</a></li>
    </ul>
  </nav>
</header>

<main>
  <article class="intro">
    <h2>This month's experiment</h2>
    <p>We are growing <i>alum</i> crystals from a saturated solution. Alum is safe
       to handle, and its crystals grow into regular octahedra you can see
       <b>without a microscope</b>.</p>
    <figure>
      <img src="${flaskUri}" alt="A conical flask half filled with pale blue solution" width="400" height="260">
      <figcaption>Fig 1 — our saturated alum solution on day 5.</figcaption>
    </figure>
    <h3>Steps</h3>
    <ol>
      <li>Dissolve alum in warm water until no more will dissolve.</li>
      <li>Filter the solution into a clean beaker.</li>
      <li>Wait <time datetime="P7D">one week</time> without disturbing it.</li>
    </ol>
    <blockquote>"Patience is a reagent." — <cite>Lab notice, Term 3</cite></blockquote>
    <p>In HTML you write &lt;b&gt;bold&lt;/b&gt; as tags, and use &amp;amp; whenever
       you mean a plain ampersand, as in R&amp;D.</p>
    <p class="compact">This paragraph has a tighter line-height — compare it with the
       paragraph above to see the effect of the <code>p.compact</code> rule.</p>
    <hr>
  </article>

  <aside class="tips">
    <h3>Lab tips</h3>
    <ul>
      <li>Use <mark>distilled water</mark> — dissolved minerals compete with your crystal.</li>
      <li>Label every beaker.</li>
    </ul>
    <pre><code>mass = volume &times; concentration</code></pre>
  </aside>

  <section id="results">
    <h2>Results so far</h2>
    <table>
      <caption>Crystal sizes after 7 days</caption>
      <thead>
        <tr><th>Beaker</th><th>Solution</th><th>Size (mm)</th></tr>
      </thead>
      <tbody>
        <tr><td>A</td><td>alum</td><td>12</td></tr>
        <tr><td>B</td><td>copper sulfate</td><td>9</td></tr>
        <tr><td>C</td><td>table salt</td><td>3</td></tr>
      </tbody>
    </table>
    <p>Measurements taken with the club's <span class="room">digital calipers</span>.</p>
  </section>

  <section id="join">
    <h2>Join the club</h2>
    <form action="#" method="post" enctype="application/x-www-form-urlencoded">
      <fieldset>
        <legend>Member details</legend>
        <p><label for="name">Name</label>
           <input id="name" name="name" type="text" value="" placeholder="Full name"></p>
        <p><label for="cls">Class</label>
           <select id="cls" name="cls">
             <option value="24S1">24S1</option>
             <option value="24S2">24S2</option>
             <option value="24S3">24S3</option>
           </select></p>
        <p><label for="why">Why join?</label><br>
           <textarea id="why" name="why" rows="3" cols="28"></textarea></p>
        <p><input id="weekly" name="weekly" type="checkbox" value="yes" checked>
           <label for="weekly">Email me weekly</label></p>
        <p><input type="submit" value="Sign up"></p>
      </fieldset>
    </form>
  </section>
</main>

<footer id="footer">
  <p><small>&copy; 2026 Nanyang Science Club &middot;
     <a href="mailto:sci-club@nyjc.edu.sg" title="say &quot;hi&quot;">Email us</a></small></p>
  <p>We meet in <span class="room">B4-05</span> on Thursdays, 3 pm.</p>
</footer>

</body>
</html>`;
