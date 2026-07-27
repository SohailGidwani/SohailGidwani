import fs from 'fs'
import { execFileSync } from 'child_process'

/**
 * Generates every card in the profile README as a self-contained SVG.
 *
 * GitHub controls the CSS of rendered markdown, so README text cannot take a
 * custom font. Matching the portfolio's typography across the whole page is
 * only possible by drawing the page as images.
 *
 * That costs three things, which shaped the layout:
 *  - Links inside an <img>-rendered SVG do not fire, so anything clickable is
 *    its own card wrapped in its own <a> in the README. That is why work and
 *    the link row are many small files rather than two big ones.
 *  - Text is not selectable or searchable, so every card carries full alt text.
 *  - Nothing external may be referenced, so both fonts are embedded as base64
 *    woff2, subset to only the glyphs each one actually draws.
 *
 * Syne 800 is used for the name only, matching .font-display on the portfolio
 * hero. Everything else is JetBrains Mono, matching the portfolio's mono.
 */

const THEMES = {
  light: { bg: '#f7f6f3', fg: '#111110', muted: '#73726d', border: '#dddbd4', dot: '#111110', term: '#edecea' },
  dark:  { bg: '#0f0f0e', fg: '#f0efe9', muted: '#8a8980', border: '#252420', dot: '#f0efe9', term: '#1a1918' },
}
const ACCENT = '#b85c0e'

const NAME = 'SOHAIL GIDWANI'

const HERO = {
  sub: 'AGENTIC AI/ML ENGINEER   ·   M.S. COMPUTER SCIENCE @ USC   ·   LOS ANGELES',
  rows: [
    ['NOW', [
      ['Research Assistant', ' · Keck School of Medicine of USC'],
      ['MEMOIR-VLM', ' · multimodal VLM for Alzheimer’s · in review'],
    ]],
    ['PROOF', [
      ['0.933', ' bal. acc. CN vs Dementia  ·  0.981 AUC  ·  2,363 ADNI subjects'],
      ['61.9%', ' strict green, 21 autonomous runs  ·  Portage agent'],
    ]],
    ['STACK', [
      ['', 'PyTorch · LangGraph · FastAPI · Postgres · pgvector · Docker · Next.js'],
    ]],
    ['OPEN TO', [
      ['', 'Full-time AI / ML / LLM roles  ·  graduating May 2027'],
    ]],
  ],
  footL: 'SOHAILGIDWANI.APP',
  footR: 'MCP  ·  LLMS.TXT  ·  RESUME.JSON',
}

const WORK = [
  { id: 'memoir', tag: 'RESEARCH · KECK USC', title: 'MEMOIR-VLM',
    body: ['Multimodal vision-language model for', 'Alzheimer’s classification and VQA.'],
    metric: ['0.933', ' bal. acc.  ·  2,363 subjects  ·  ~70M'] },
  { id: 'portage', tag: 'AGENTIC AI', title: 'Portage',
    body: ['Autonomous agent that migrates Flask to', 'FastAPI, proven by the repo’s own tests.'],
    metric: ['61.9%', ' strict green  ·  21 autonomous runs'] },
  { id: 'knowledge-hub', tag: 'APPLIED AI', title: 'Knowledge Hub',
    body: ['Local-first documents: OCR, hybrid', 'retrieval, RAG answers with citations.'],
    metric: ['1', ' Postgres store  ·  no vector DB to run'] },
  { id: 'cot', tag: 'AI RESEARCH', title: 'CoT Faithfulness',
    body: ['Does chain-of-thought drive the answer,', 'or rationalise it after the fact?'],
    metric: ['~15,000', ' queries  ·  4 controlled experiments'] },
]

const PANELS = [
  { id: 'experience', title: 'EXPERIENCE', lines: [
    ['OCT 2025 - NOW', 'Research Assistant', 'Keck School of Medicine, USC'],
    ['MAY - JUL 2025', 'Senior Software Engineer I', 'Insaito, Inc.'],
    ['JUN 2023 - MAY 2025', 'Full Stack Developer', 'IIFL Finance Ltd'],
  ]},
  { id: 'credentials', title: 'EDUCATION  ·  WINS', lines: [
    ['2025 - 2027', 'M.S. Computer Science', 'USC · GPA 3.75 / 4.0'],
    ['2019 - 2023', 'B.E. Computer Engineering', 'Mumbai · CGPA 9.05 / 10'],
    ['AWARD', 'Certificate of Achievement', 'from the CTO, IIFL Finance'],
  ]},
]

/** Typed out on a loop in the terminal card. */
const TERM = [
  ['$ ', 'curl -s sohailgidwani.app/api/mcp \\'],
  ['  ', '-d \'{"method":"tools/list"}\''],
  ['', ''],
  ['', '{ "tools": [ {'],
  ['', '    "name": "search_projects",'],
  ['', '    "description": "Search portfolio'],
  ['', '     projects by keyword."'],
  ['', '} ] }'],
]

const LINKS = [
  { id: 'projects', label: 'ALL PROJECTS', primary: true },
  { id: 'email', label: 'EMAIL' },
  { id: 'linkedin', label: 'LINKEDIN' },
  { id: 'mcp', label: 'MCP' },
  { id: 'llms', label: 'LLMS.TXT' },
  { id: 'resume', label: 'RESUME.JSON' },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** Attribute values additionally need quotes escaped: an alt string containing
 *  JSON silently produced invalid XML and a broken card. */
const escAttr = (s) => esc(s).replace(/"/g, '&quot;')

// ── fonts: subset each to only the glyphs it draws ──────────────────────────
function subset(src, chars, out) {
  execFileSync('pyftsubset', [src, `--text=${chars}`, '--flavor=woff2',
    `--output-file=${out}`, '--layout-features=', '--no-hinting', '--desubroutinize'])
  const b64 = fs.readFileSync(out).toString('base64')
  console.log(`  ${out}  ${(fs.statSync(out).size / 1024).toFixed(1)}KB  (${[...new Set(chars)].length} glyphs)`)
  return b64
}

const monoChars = (() => {
  const s = new Set(' →█')
  const eat = (x) => [...String(x)].forEach((c) => s.add(c))
  eat(HERO.sub); eat(HERO.footL); eat(HERO.footR)
  HERO.rows.forEach(([l, vs]) => { eat(l); vs.forEach(([a, b]) => { eat(a); eat(b) }) })
  WORK.forEach((w) => { eat(w.tag); eat(w.title); w.body.forEach(eat); eat(w.metric[0]); eat(w.metric[1]) })
  PANELS.forEach((p) => { eat(p.title); p.lines.forEach((l) => l.forEach(eat)) })
  TERM.forEach(([a, b]) => { eat(a); eat(b) })
  LINKS.forEach((l) => eat(l.label))
  return [...s].sort().join('')
})()

const MONO = { 400: subset('jbm-400.woff2', monoChars, 'sub-mono-400.woff2'),
               700: subset('jbm-700.woff2', monoChars, 'sub-mono-700.woff2') }
const SYNE = subset('syne-800.woff2', NAME, 'sub-syne-800.woff2')
const linkChars = [...new Set(LINKS.map((l) => l.label).join(''))].sort().join('')
const LINKFONT = subset('jbm-700.woff2', linkChars, 'sub-link-700.woff2')

const fontCss = (withSyne = false) => `
@font-face{font-family:'JBM';font-weight:400;font-display:block;src:url(data:font/woff2;base64,${MONO[400]}) format('woff2')}
@font-face{font-family:'JBM';font-weight:700;font-display:block;src:url(data:font/woff2;base64,${MONO[700]}) format('woff2')}${withSyne ? `
@font-face{font-family:'Syne';font-weight:800;font-display:block;src:url(data:font/woff2;base64,${SYNE}) format('woff2')}` : ''}
.s{font-family:'JBM',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
text{white-space:pre}`

const motionCss = `
.a{opacity:0;animation:rise .5s cubic-bezier(.25,1,.5,1) both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.rule{animation:draw .55s cubic-bezier(.32,.72,0,1) .1s both}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cursor{animation:blink 1.1s steps(1) .95s infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .a{opacity:1;animation:none}.rule{animation:none}.cursor{animation:none;opacity:1}
  .tl{animation:none;clip-path:none;opacity:1}
}`

const shell = (w, h, t, label, body, css = '', syne = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escAttr(label)}">
<style>${fontCss(syne)}
.dotgrid{fill:${t.dot};opacity:.05}${css}${motionCss}
</style>
<defs><pattern id="dg" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1.1" class="dotgrid"/></pattern></defs>
<rect width="${w}" height="${h}" rx="6" fill="${t.bg}"/>
<rect width="${w}" height="${h}" rx="6" fill="url(#dg)"/>
<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="6" fill="none" stroke="${t.border}" stroke-width="1.5"/>
<g class="s">
${body}
</g>
</svg>
`

// ── hero ────────────────────────────────────────────────────────────────────
function hero(themeName) {
  const t = THEMES[themeName]
  const W = 880, PAD = 34, ROW_H = 26, GAP = 18, MID = W / 2
  let beat = 0
  const next = () => (beat += 0.08).toFixed(2)
  const out = []
  let y = 214

  for (const [label, values] of HERO.rows) {
    out.push(`  <text class="lbl a" style="animation-delay:${next()}s" x="${PAD}" y="${y}">${esc(label)}</text>`)
    for (const [lead, rest] of values) {
      const leadPart = lead ? `<tspan class="lead">${esc(lead)}</tspan>` : ''
      out.push(`  <text class="val a" style="animation-delay:${next()}s" x="${PAD + 118}" y="${y}">${leadPart}<tspan class="rest">${esc(rest)}</tspan></text>`)
      y += ROW_H
    }
    y += GAP
  }
  const footY = y - GAP + 44
  const H = footY + 26

  const body = `  <text class="name a" style="animation-delay:0s" x="${MID}" y="92" text-anchor="middle">${esc(NAME)}</text>
  <rect class="rule" style="transform-origin:${MID}px 122px" x="${PAD}" y="122" width="${W - PAD * 2}" height="2.5" fill="${ACCENT}"/>
  <text class="sub a" style="animation-delay:.16s" x="${MID}" y="154" text-anchor="middle">${esc(HERO.sub)}</text>
${out.join('\n')}
  <line class="a" style="animation-delay:${next()}s" x1="${PAD}" y1="${footY - 22}" x2="${W - PAD}" y2="${footY - 22}" stroke="${t.border}" stroke-width="1"/>
  <text class="foot a" style="animation-delay:${next()}s" x="${PAD}" y="${footY}">${esc(HERO.footL)}<tspan class="cursor" fill="${ACCENT}"> █</tspan></text>
  <text class="foot a" style="animation-delay:${next()}s" x="${W - PAD}" y="${footY}" text-anchor="end">${esc(HERO.footR)}</text>`

  const css = `
.name{font-family:'Syne',ui-sans-serif,system-ui,sans-serif;font-size:52px;font-weight:800;letter-spacing:-1.5px;fill:${t.fg}}
.sub{font-size:12px;letter-spacing:2.4px;fill:${t.muted}}
.lbl{font-size:11px;letter-spacing:2.4px;fill:${ACCENT}}
.val{font-size:13.5px;fill:${t.muted}}
.lead{fill:${t.fg};font-weight:700}
.rest{fill:${t.muted}}
.foot{font-size:11px;letter-spacing:2.2px;fill:${t.muted}}`

  const alt = `${NAME}. ${HERO.sub}. ` + HERO.rows.map(([l, vs]) => `${l}: ` + vs.map(([a, b]) => (a + b).trim()).join('; ')).join('. ')
  return shell(W, H, t, alt, body, css, true)
}

// ── work card ───────────────────────────────────────────────────────────────
function work(spec, themeName) {
  const t = THEMES[themeName]
  const W = 428, H = 186, PAD = 24
  const body = `  <text class="tag a" style="animation-delay:.04s" x="${PAD}" y="38">${esc(spec.tag)}</text>
  <text class="ttl a" style="animation-delay:.12s" x="${PAD}" y="72">${esc(spec.title)}</text>
  <text class="bdy a" style="animation-delay:.2s" x="${PAD}" y="104">${esc(spec.body[0])}</text>
  <text class="bdy a" style="animation-delay:.26s" x="${PAD}" y="122">${esc(spec.body[1])}</text>
  <line class="a" style="animation-delay:.32s" x1="${PAD}" y1="142" x2="${W - PAD}" y2="142" stroke="${t.border}" stroke-width="1"/>
  <text class="met a" style="animation-delay:.38s" x="${PAD}" y="166"><tspan class="lead">${esc(spec.metric[0])}</tspan><tspan class="rest">${esc(spec.metric[1])}</tspan></text>
  <text class="arw a" style="animation-delay:.44s" x="${W - PAD}" y="166" text-anchor="end">→</text>`
  const css = `
.tag{font-size:10px;letter-spacing:2.2px;fill:${ACCENT}}
.ttl{font-size:23px;font-weight:700;letter-spacing:-.6px;fill:${t.fg}}
.bdy{font-size:12px;fill:${t.muted}}
.met{font-size:11.5px}
.lead{fill:${t.fg};font-weight:700}
.rest{fill:${t.muted}}
.arw{font-size:15px;fill:${ACCENT}}`
  const alt = `${spec.title}, ${spec.tag}. ${spec.body.join(' ')} ${spec.metric[0]}${spec.metric[1]}`
  return shell(W, H, t, alt, body, css)
}

// ── panel (experience / credentials) ────────────────────────────────────────
function panel(spec, themeName) {
  const t = THEMES[themeName]
  const W = 428, PAD = 24
  let y = 74
  const out = []
  spec.lines.forEach(([when, what, where], i) => {
    const d = (0.12 + i * 0.1).toFixed(2)
    out.push(`  <text class="when a" style="animation-delay:${d}s" x="${PAD}" y="${y}">${esc(when)}</text>`)
    out.push(`  <text class="what a" style="animation-delay:${(+d + 0.04).toFixed(2)}s" x="${PAD}" y="${y + 18}">${esc(what)}</text>`)
    out.push(`  <text class="where a" style="animation-delay:${(+d + 0.07).toFixed(2)}s" x="${PAD}" y="${y + 35}">${esc(where)}</text>`)
    y += 62
  })
  const H = y - 62 + 35 + 26

  const body = `  <text class="tag a" style="animation-delay:.04s" x="${PAD}" y="38">${esc(spec.title)}</text>
  <line class="a" style="animation-delay:.08s" x1="${PAD}" y1="52" x2="${W - PAD}" y2="52" stroke="${t.border}" stroke-width="1"/>
${out.join('\n')}`
  const css = `
.tag{font-size:10px;letter-spacing:2.2px;fill:${ACCENT}}
.when{font-size:10px;letter-spacing:1.6px;fill:${ACCENT}}
.what{font-size:14px;font-weight:700;fill:${t.fg}}
.where{font-size:11.5px;fill:${t.muted}}`
  const alt = `${spec.title}. ` + spec.lines.map(([a, b, c]) => `${a}: ${b}, ${c}`).join('. ')
  return shell(W, H, t, alt, body, css)
}

// ── terminal: types itself out, forever ─────────────────────────────────────
function terminal(themeName) {
  const t = THEMES[themeName]
  const W = 880, PAD = 30
  // Derived, not fixed: the prompt line sits one row past the payload, and a
  // hardcoded height clipped both the closing brace and the cursor.
  const lastBaseline = 92 + TERM.length * 20
  const H = lastBaseline + 18 + PAD
  const LOOP = 9
  const lines = TERM.map(([prefix, text], i) => {
    if (!text && !prefix) return null
    const y = 92 + i * 20
    const delay = (0.5 + i * 0.34).toFixed(2)
    const pre = prefix ? `<tspan class="pre">${esc(prefix)}</tspan>` : ''
    return `  <text class="tl ln" style="animation-delay:${delay}s" x="${PAD + 16}" y="${y}">${pre}<tspan class="tx">${esc(text)}</tspan></text>`
  }).filter(Boolean)

  const body = `  <rect x="${PAD}" y="${PAD}" width="${W - PAD * 2}" height="${H - PAD * 2}" rx="4" fill="${t.term}" stroke="${t.border}" stroke-width="1"/>
  <circle cx="${PAD + 18}" cy="${PAD + 18}" r="4.5" fill="${ACCENT}" opacity=".85"/>
  <circle cx="${PAD + 34}" cy="${PAD + 18}" r="4.5" fill="${t.muted}" opacity=".4"/>
  <circle cx="${PAD + 50}" cy="${PAD + 18}" r="4.5" fill="${t.muted}" opacity=".4"/>
  <text class="cap" x="${W - PAD - 16}" y="${PAD + 22}" text-anchor="end">AGENT-READABLE  ·  LIVE</text>
  <line x1="${PAD}" y1="${PAD + 36}" x2="${W - PAD}" y2="${PAD + 36}" stroke="${t.border}" stroke-width="1"/>
${lines.join('\n')}
  <text class="tl ln" style="animation-delay:${(0.5 + TERM.length * 0.34).toFixed(2)}s" x="${PAD + 16}" y="${92 + TERM.length * 20}"><tspan class="pre">$ </tspan><tspan class="cursor" fill="${ACCENT}">█</tspan></text>`

  const css = `
.cap{font-size:9.5px;letter-spacing:2px;fill:${t.muted}}
.ln{font-size:12.5px}
.pre{fill:${ACCENT};font-weight:700}
.tx{fill:${t.muted}}
/* One shared duration keeps the stagger stable across every repeat; the
   per-line delay is what makes it read as typing. */
.tl{clip-path:inset(0 100% 0 0);animation:type ${LOOP}s steps(48,end) infinite}
@keyframes type{
  0%{clip-path:inset(0 100% 0 0)}
  7%{clip-path:inset(0 0 0 0)}
  90%{clip-path:inset(0 0 0 0);opacity:1}
  96%{opacity:0}
  100%{clip-path:inset(0 100% 0 0);opacity:0}
}`
  const alt = 'Live terminal: curl -s sohailgidwani.app/api/mcp -d {"method":"tools/list"} returns the MCP tool list, including search_projects which searches portfolio projects by keyword.'
  return shell(W, H, t, alt, body, css)
}

// ── link chip ───────────────────────────────────────────────────────────────
function link(spec, themeName) {
  const t = THEMES[themeName]
  const W = 138, H = 46
  const fill = spec.primary ? ACCENT : t.bg
  const stroke = spec.primary ? ACCENT : t.border
  const label = spec.primary ? '#fff' : t.muted
  const body = `  <text x="${W / 2}" y="${H / 2 + 4}" text-anchor="middle" class="lk">${esc(spec.label)}</text>`
  const css = `
.lk{font-size:10px;letter-spacing:1.6px;font-weight:700;fill:${label}}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escAttr(spec.label)}">
<style>
@font-face{font-family:'JBM';font-weight:700;font-display:block;src:url(data:font/woff2;base64,${LINKFONT}) format('woff2')}
.s{font-family:'JBM',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
text{white-space:pre}${css}
</style>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
<g class="s">
${body}
</g>
</svg>
`
}

let total = 0
const write = (f, s) => { fs.writeFileSync(f, s); total += s.length }
for (const th of ['light', 'dark']) {
  write(`hero_${th}.svg`, hero(th))
  write(`terminal_${th}.svg`, terminal(th))
  for (const w of WORK) write(`work-${w.id}_${th}.svg`, work(w, th))
  for (const p of PANELS) write(`panel-${p.id}_${th}.svg`, panel(p, th))
  for (const l of LINKS) write(`link-${l.id}_${th}.svg`, link(l, th))
}
const n = fs.readdirSync('.').filter((f) => f.endsWith('.svg') && !f.startsWith('sub-')).length
console.log(`  ${n} SVGs, ${Math.round(total / 1024)}KB total (a viewer loads one theme, so about half)`)
