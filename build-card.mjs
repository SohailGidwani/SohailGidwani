import fs from 'fs'

/**
 * Builds the profile card SVG in both themes from one source of truth.
 *
 * Constraints that shape every decision here:
 *  - GitHub renders this through an <img>, so NOTHING external can be
 *    referenced. No webfonts, no images, no scripts. Fonts come from local()
 *    with a fallback chain and size-adjust so metrics stay put across OSes.
 *  - CSS animation inside the SVG does survive that <img>, which is what lets
 *    the card replay the portfolio's assembly choreography.
 *  - The file is committed to the repo, so no third-party service can pause
 *    and take it down.
 */

const THEMES = {
  light: { bg: '#f7f6f3', fg: '#111110', muted: '#73726d', border: '#dddbd4', card: '#edecea', dot: '#111110' },
  dark:  { bg: '#0f0f0e', fg: '#f0efe9', muted: '#8a8980', border: '#252420', card: '#1a1918', dot: '#f0efe9' },
}
const ACCENT = '#b85c0e'

const W = 880
const PAD = 34
/** Height is derived from the rows below, never hardcoded: a fixed value let
 *  the footer collide with the last row the moment a line was added. */
const ROW_H = 26
const GROUP_GAP = 18
const FIRST_ROW_Y = 182
const FOOTER_GAP = 44

/** label, then one or more value lines */
const ROWS = [
  ['NOW', [
    ['Research Assistant', ' · Keck School of Medicine of USC'],
    ['MEMOIR-VLM', ' · multimodal VLM for Alzheimer’s · manuscript in review'],
  ]],
  ['PROOF', [
    ['0.933', ' balanced accuracy CN vs Dementia   ·   2,363 ADNI subjects   ·   ~70M params'],
    ['61.9%', ' strict green, 21 autonomous runs   ·   Portage migration agent'],
  ]],
  ['STACK', [
    ['', 'PyTorch · LangGraph · FastAPI · Postgres · pgvector · Qdrant · Docker · Next.js'],
  ]],
  ['OPEN TO', [
    ['', 'Full-time AI / ML / LLM engineering roles   ·   graduating May 2027   ·   Los Angeles'],
  ]],
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function build(themeName) {
  const t = THEMES[themeName]

  // Every animated element gets a beat, so the card assembles the way the
  // portfolio portrait does rather than appearing all at once.
  let beat = 0
  const next = () => (beat += 0.08).toFixed(2)

  const lines = []
  let y = FIRST_ROW_Y

  for (const [label, values] of ROWS) {
    lines.push(
      `<text class="lbl a" style="animation-delay:${next()}s" x="${PAD}" y="${y}">${esc(label)}</text>`
    )
    for (const [lead, rest] of values) {
      const leadPart = lead ? `<tspan class="lead">${esc(lead)}</tspan>` : ''
      lines.push(
        `<text class="val a" style="animation-delay:${next()}s" x="${PAD + 118}" y="${y}">${leadPart}<tspan class="rest">${esc(rest)}</tspan></text>`
      )
      y += ROW_H
    }
    y += GROUP_GAP
  }

  const footerY = y - GROUP_GAP + FOOTER_GAP
  const H = footerY + 26

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sohail Gidwani, Agentic AI/ML Engineer">
<style>
@font-face{font-family:'JBMono';src:local('JetBrains Mono'),local('JetBrainsMono-Regular'),local('SFMono-Regular'),local('Menlo'),local('Consolas');font-display:swap;size-adjust:104%}
.s{font-family:'JBMono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
text{white-space:pre}
.name{font-size:38px;font-weight:700;letter-spacing:-1.2px;fill:${t.fg}}
.sub{font-size:12.5px;letter-spacing:2.6px;fill:${t.muted}}
.lbl{font-size:11px;letter-spacing:2.4px;fill:${ACCENT}}
.val{font-size:13.5px;fill:${t.muted}}
.lead{fill:${t.fg};font-weight:700}
.rest{fill:${t.muted}}
.foot{font-size:11px;letter-spacing:2.2px;fill:${t.muted}}
.dotgrid{fill:${t.dot};opacity:.05}

/* Assembly: each element rises a few pixels as it fades up. Reduced motion
   collapses the whole thing to the finished card, which is why every rule
   below is duplicated under the media query rather than merely shortened. */
.a{opacity:0;animation:rise .5s cubic-bezier(.25,1,.5,1) both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.rule{transform-origin:${PAD}px 118px;animation:draw .55s cubic-bezier(.32,.72,0,1) .1s both}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cursor{animation:blink 1.1s steps(1) .95s infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .a{opacity:1;animation:none}
  .rule{animation:none}
  .cursor{animation:none;opacity:1}
}
</style>
<rect width="${W}" height="${H}" rx="6" fill="${t.bg}"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="6" fill="none" stroke="${t.border}" stroke-width="1.5"/>
<defs><pattern id="dg" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1.1" class="dotgrid"/></pattern></defs>
<rect width="${W}" height="${H}" rx="6" fill="url(#dg)"/>

<g class="s">
  <text class="name a" style="animation-delay:0s" x="${PAD}" y="86">SOHAIL GIDWANI</text>
  <rect class="rule" x="${PAD}" y="110" width="${W - PAD * 2}" height="2.5" fill="${ACCENT}"/>
  <text class="sub a" style="animation-delay:.16s" x="${PAD}" y="140">AGENTIC AI/ML ENGINEER   ·   M.S. COMPUTER SCIENCE @ USC</text>

${lines.map((l) => '  ' + l).join('\n')}

  <line class="rule2 a" style="animation-delay:${next()}s" x1="${PAD}" y1="${footerY - 22}" x2="${W - PAD}" y2="${footerY - 22}" stroke="${t.border}" stroke-width="1"/>
  <text class="foot a" style="animation-delay:${next()}s" x="${PAD}" y="${footerY}">SOHAILGIDWANI.APP<tspan class="cursor" fill="${ACCENT}"> █</tspan></text>
  <text class="foot a" style="animation-delay:${next()}s" x="${W - PAD}" y="${footerY}" text-anchor="end">MCP  ·  LLMS.TXT  ·  RESUME.JSON</text>
</g>
</svg>
`
}

for (const name of Object.keys(THEMES)) {
  const out = `${name}_mode.svg`
  fs.writeFileSync(out, build(name))
  console.log(`${out}  ${fs.statSync(out).size}B`)
}
