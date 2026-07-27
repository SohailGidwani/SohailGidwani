import fs from 'fs'
import { execFileSync } from 'child_process'

/**
 * Generates every card in the profile README as a self-contained SVG.
 *
 * Why SVG for the whole thing: GitHub controls the CSS of rendered markdown, so
 * README text cannot take a custom font. Matching the card's typography across
 * the page is only possible by drawing the page as images.
 *
 * The cost is real and shaped the layout: text inside an <img> is not
 * selectable, not searchable, and links inside the SVG do not fire. So the work
 * section is four separate cards rather than one, each wrapped in its own <a>
 * in the README, which keeps every project one click away. The alt text on each
 * image carries the same information for screen readers, and a plain markdown
 * footer keeps the email copyable.
 *
 * JetBrains Mono is embedded as a base64 woff2, subset to only the glyphs these
 * cards use. local() was not enough: the font is absent on most machines, so
 * nearly every viewer was silently getting Menlo instead.
 */

const THEMES = {
  light: { bg: '#f7f6f3', fg: '#111110', muted: '#73726d', border: '#dddbd4', dot: '#111110' },
  dark:  { bg: '#0f0f0e', fg: '#f0efe9', muted: '#8a8980', border: '#252420', dot: '#f0efe9' },
}
const ACCENT = '#b85c0e'

const HERO = {
  name: 'SOHAIL GIDWANI',
  sub: 'AGENTIC AI/ML ENGINEER   ·   M.S. COMPUTER SCIENCE @ USC',
  rows: [
    ['NOW', [
      ['Research Assistant', ' · Keck School of Medicine of USC'],
      ['MEMOIR-VLM', ' · multimodal VLM for Alzheimer’s · in review'],
    ]],
    ['PROOF', [
      ['0.933', ' bal. acc. CN vs Dementia  ·  2,363 ADNI subjects  ·  ~70M params'],
      ['61.9%', ' strict green, 21 autonomous runs  ·  Portage agent'],
    ]],
    ['STACK', [
      ['', 'PyTorch · LangGraph · FastAPI · Postgres · pgvector · Docker · Next.js'],
    ]],
    ['OPEN TO', [
      ['', 'Full-time AI / ML / LLM roles  ·  graduating May 2027  ·  Los Angeles'],
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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── font: subset to the glyphs these cards actually draw ────────────────────
function embedFont() {
  const all = new Set(' ')
  const eat = (s) => [...String(s)].forEach((c) => all.add(c))
  eat(HERO.name); eat(HERO.sub); eat(HERO.footL); eat(HERO.footR)
  HERO.rows.forEach(([l, vs]) => { eat(l); vs.forEach(([a, b]) => { eat(a); eat(b) }) })
  WORK.forEach((w) => { eat(w.tag); eat(w.title); w.body.forEach(eat); eat(w.metric[0]); eat(w.metric[1]); eat('→') })

  const chars = [...all].sort().join('')
  const out = {}
  for (const w of [400, 700]) {
    execFileSync('pyftsubset', [
      `jbm-${w}.woff2`, `--text=${chars}`, '--flavor=woff2',
      `--output-file=sub-${w}.woff2`, '--layout-features=', '--no-hinting', '--desubroutinize',
    ])
    out[w] = fs.readFileSync(`sub-${w}.woff2`).toString('base64')
    console.log(`  subset ${w}: ${Math.round(fs.statSync(`sub-${w}.woff2`).size / 1024 * 10) / 10}KB (${chars.length} glyphs)`)
  }
  return out
}

const FONT = embedFont()

const fontCss = () => `
@font-face{font-family:'JBM';font-weight:400;font-display:block;src:url(data:font/woff2;base64,${FONT[400]}) format('woff2')}
@font-face{font-family:'JBM';font-weight:700;font-display:block;src:url(data:font/woff2;base64,${FONT[700]}) format('woff2')}
.s{font-family:'JBM',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
text{white-space:pre}`

const motionCss = (accent = ACCENT) => `
.a{opacity:0;animation:rise .5s cubic-bezier(.25,1,.5,1) both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.rule{animation:draw .55s cubic-bezier(.32,.72,0,1) .1s both}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cursor{animation:blink 1.1s steps(1) .95s infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.a{opacity:1;animation:none}.rule{animation:none}.cursor{animation:none;opacity:1}}`

const shell = (w, h, t, label, body, extraCss = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<style>${fontCss()}
.dotgrid{fill:${t.dot};opacity:.05}${extraCss}${motionCss()}
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
  const W = 880, PAD = 34, ROW_H = 26, GAP = 18
  let beat = 0
  const next = () => (beat += 0.08).toFixed(2)
  const out = []
  let y = 182

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

  const body = `  <text class="name a" style="animation-delay:0s" x="${PAD}" y="86">${esc(HERO.name)}</text>
  <rect class="rule" style="transform-origin:${PAD}px 110px" x="${PAD}" y="110" width="${W - PAD * 2}" height="2.5" fill="${ACCENT}"/>
  <text class="sub a" style="animation-delay:.16s" x="${PAD}" y="140">${esc(HERO.sub)}</text>
${out.join('\n')}
  <line class="a" style="animation-delay:${next()}s" x1="${PAD}" y1="${footY - 22}" x2="${W - PAD}" y2="${footY - 22}" stroke="${t.border}" stroke-width="1"/>
  <text class="foot a" style="animation-delay:${next()}s" x="${PAD}" y="${footY}">${esc(HERO.footL)}<tspan class="cursor" fill="${ACCENT}"> █</tspan></text>
  <text class="foot a" style="animation-delay:${next()}s" x="${W - PAD}" y="${footY}" text-anchor="end">${esc(HERO.footR)}</text>`

  const css = `
.name{font-size:38px;font-weight:700;letter-spacing:-1.2px;fill:${t.fg}}
.sub{font-size:12.5px;letter-spacing:2.6px;fill:${t.muted}}
.lbl{font-size:11px;letter-spacing:2.4px;fill:${ACCENT}}
.val{font-size:13.5px;fill:${t.muted}}
.lead{fill:${t.fg};font-weight:700}
.rest{fill:${t.muted}}
.foot{font-size:11px;letter-spacing:2.2px;fill:${t.muted}}`

  const alt = `${HERO.name}. ${HERO.sub}. ` + HERO.rows.map(([l, vs]) => `${l}: ` + vs.map(([a, b]) => (a + b).trim()).join('; ')).join('. ')
  return shell(W, H, t, alt, body, css)
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

let total = 0
const write = (f, s) => { fs.writeFileSync(f, s); total += s.length; console.log(`  ${f}  ${Math.round(s.length / 1024 * 10) / 10}KB`) }

for (const th of ['light', 'dark']) {
  write(`hero_${th}.svg`, hero(th))
  for (const w of WORK) write(`work-${w.id}_${th}.svg`, work(w, th))
}
console.log(`  total ${Math.round(total / 1024)}KB across ${(WORK.length + 1) * 2} files`)
