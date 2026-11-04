/* ============================================================
   DATA — syllabus checklist, element blurbs, proxies
   ============================================================ */

/* ============================================================
   DATA — syllabus checklist, element blurbs, sample page, proxies
   ============================================================ */
'use strict';

const REF_G_PDF = 'https://isomer-user-content.by.gov.sg/334/fbf2f4ef-108a-4331-8597-a8c71427cc8d/9569_y27_sp_2_RefG.pdf';

/* Properties listed in RefG §6 (marked in the CSS panel) */
const REF_G_CSS = new Set(['display','background','color','height','width','border',
  'border-bottom','border-left','border-right','border-top',
  'margin','margin-bottom','margin-left','margin-right','margin-top',
  'padding','padding-bottom','padding-left','padding-right','padding-top',
  'font-family','font-size','font-style','font-weight','text-align','text-decoration']);

/* Checklist = exactly the elements of RefG §4 "HTML Elements, Attributes and
   Character References" (H2 Computing 9569, for use from 2027). */
const CHECKLIST = [
  {group:'Required — every document', items:[
    ['doctype','The <code>&lt;!doctype html&gt;</code> declaration — the first line of every HTML document.'],
    ['html','Root element that wraps the entire document.'],
    ['head','Contains information about the page (title, linked stylesheets).'],
    ['title','Text shown on the browser tab; lives inside <code>&lt;head&gt;</code>.'],
    ['body','Contains everything visible on the page.'],
  ]},
  {group:'Metadata', items:[
    ['link','Links an external resource — usually a CSS stylesheet (<code>rel</code>, <code>href</code>).'],
  ]},
  {group:'Structure', items:[
    ['h1','Largest heading — the page title; use one per page.'],
    ['h2','Second-level heading for major sections.'],
    ['h3','Third-level heading for sub-sections.'],
    ['p','A paragraph of text.'],
    ['div','Generic block-level container for grouping content.'],
    ['span','Generic inline container for part of a text.'],
    ['hr','Horizontal rule — a visual break between sections.'],
  ]},
  {group:'Text and media', items:[
    ['b','Bold text, drawing attention without extra importance.'],
    ['i','Italic text — a different voice or mood, e.g. technical terms.'],
    ['a','A hyperlink (<code>href</code> attribute).'],
    ['img','An embedded image (<code>src</code>, <code>alt</code>).'],
  ]},
  {group:'Table', items:[
    ['table','Wraps tabular data in rows and cells.'],
    ['tr','A row of cells in a table.'],
    ['th','A header cell — bold and centred by default.'],
    ['td','A data cell in a table row.'],
  ]},
  {group:'Form', items:[
    ['form','A section that collects user input (<code>action</code>, <code>method</code>, <code>enctype</code>).'],
    ['input','An input control — text, checkbox, radio… (<code>type</code>, <code>name</code>, <code>value</code>).'],
    ['textarea','A multi-line text input (<code>name</code>).'],
  ]},
  {group:'Character references (RefG §4)', entity:true, items:[
    ['&amp;','Escape for <code>&amp;</code> — every character reference starts with an ampersand.'],
    ['&lt;','Escape for <code>&lt;</code> so the browser does not read it as a tag.'],
    ['&gt;','Escape for <code>&gt;</code> so the browser does not end a tag early.'],
    ['&quot;','Escape for <code>"</code> inside attribute values.'],
  ]},
];
const ENT_DEC = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"'};

/* Short descriptions shown instantly in the Reference panel (MDN full text
   loads below when the network allows). */
const ELEMENT_INFO = {
  doctype:'The DOCTYPE declaration tells the browser this is a modern HTML document. It must be the very first line.',
  html:'Root element of the document. Everything else lives inside it; <code>lang</code> declares the language.',
  head:'Holds metadata that is not displayed: the title, character set, and linked stylesheets.',
  title:'The document title — shown on the browser tab and in search results. Required inside &lt;head&gt;.',
  body:'Contains all content the user sees: text, images, tables, forms.',
  link:'In &lt;head&gt;, links an external stylesheet: <code>&lt;link rel="stylesheet" href="style.css"&gt;</code>.',
  h1:'A top-level heading. Pages should have exactly one, describing the page.',
  h2:'A second-level heading, for major sections under the h1.',
  h3:'A third-level heading, for sub-sections. Never skip levels just to make text bigger.',
  p:'A paragraph — the workhorse block of body text.',
  div:'A block-level box with no meaning of its own; used to group other elements for layout and styling.',
  span:'An inline container with no meaning of its own; used to style a run of text inside a line.',
  hr:'A thematic break between sections, drawn as a horizontal rule.',
  b:'Bold text — draws attention without implying importance. Prefer &lt;strong&gt; for real importance.',
  i:'Italic text — a different voice or mood, such as terms, ship names or foreign words.',
  a:'An anchor — the heart of the web. <code>href</code> gives the destination; the content is what you click.',
  img:'Embeds an image. <code>src</code> locates the file, <code>alt</code> describes it for screen readers and broken loads.',
  table:'Represents tabular data in rows and cells — never for layout.',
  tr:'A table row, containing th and/or td cells.',
  th:'A table header cell — bold and centred; screen readers use it to navigate tables.',
  td:'A table data cell, one square of the table.',
  form:'Wraps input controls and says where (<code>action</code>) and how (<code>method</code>, <code>enctype</code>) to send them.',
  input:'One-line input control; <code>type</code> picks text, checkbox, radio, submit…, <code>name</code> names the data.',
  textarea:'Multi-line free text input; <code>name</code> names the data, rows/cols set the visible size.',
  meta:'Document metadata: character set (<code>charset</code>), viewport, description.',
  style:'An embedded stylesheet — CSS rules written directly inside the page.',
  script:'Embeds or links program code. Not covered by this tool: the preview always disables scripts.',
  ul:'An unordered (bulleted) list; items go in &lt;li&gt;.',
  ol:'An ordered (numbered) list; items go in &lt;li&gt;.',
  li:'A list item inside &lt;ul&gt; or &lt;ol&gt;.',
  dl:'A description list of term/description pairs (&lt;dt&gt;, &lt;dd&gt;).',
  dt:'A term in a description list.',
  dd:'The description of a &lt;dt&gt; term.',
  nav:'A section with major navigation links.',
  header:'Introductory content for the page or a section: logo, title, nav.',
  footer:'Closing content: contact details, copyright, links.',
  main:'The dominant content of the page — only one per document.',
  section:'A thematic grouping of content, usually with a heading.',
  article:'A self-contained piece of content that would make sense on its own.',
  aside:'Content tangentially related to the main content: sidebars, tip boxes.',
  figure:'A self-contained figure (image, diagram, code) optionally with a &lt;figcaption&gt;.',
  figcaption:'A caption for its parent &lt;figure&gt;.',
  blockquote:'A extended quotation from another source.',
  pre:'Preformatted text — whitespace and line breaks are kept; ideal for code.',
  code:'A short run of computer code, normally monospaced.',
  strong:'Strong importance — rendered bold by default.',
  em:'Emphasis — rendered italic by default.',
  br:'A line break within text (e.g. an address). Use sparingly.',
  button:'A clickable button, usually to submit a form.',
  label:'A caption for a form control — click it to focus the control; connect via <code>for</code>/id.',
  select:'A dropdown list of &lt;option&gt; elements.',
  option:'One choice inside a &lt;select&gt;.',
  fieldset:'Groups related form controls with an optional &lt;legend&gt; outline.',
  legend:'A caption for its parent &lt;fieldset&gt;.',
  h4:'A fourth-level heading.', h5:'A fifth-level heading.', h6:'The smallest heading level.',
  small:'Fine print: side comments, copyright.',
  sup:'Superscript text (e.g. exponents, footnotes).',
  sub:'Subscript text (e.g. chemical formulas).',
  caption:'The caption of a table, describing its contents.',
  thead:'The header rows of a table.',
  tbody:'The body rows of a table.',
  abbr:'An abbreviation or acronym; the <code>title</code> attribute spells it out.',
  cite:'The title of a creative work (book, paper).',
  q:'A short inline quotation, quoted automatically.',
  mark:'Text highlighted for relevance (like a highlighter pen).',
  time:'A date or time; <code>datetime</code> gives the machine-readable value.',
};
function fallbackInfo(tag){ return 'The <'+tag+'> element. Open the full MDN page for details.'; }

const MDN_ELEMENTS = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/';
function mdnUrlFor(key){
  if(key==='doctype') return 'https://developer.mozilla.org/en-US/docs/Glossary/Doctype';
  if(key.charAt(0)==='&') return 'https://developer.mozilla.org/en-US/docs/Glossary/Character_reference';
  if(/^h[1-6]$/.test(key)) return MDN_ELEMENTS+'Heading_Elements';
  return MDN_ELEMENTS+key;
}
