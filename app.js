/* Pack Twitch Studio — génère des packs Twitch complets (PNG) dans plusieurs styles */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const INK = '#2a1a22', PINK = '#ff8fa8', MOUTH = '#7a2335', BLUE = '#7ed4ff';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const L = (w = 3.5) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

const EMOTES = [
  { expr: 'happy', name: 'Hype' }, { expr: 'rage', name: 'Rage' }, { expr: 'cry', name: 'Snif' },
  { expr: 'love', name: 'Love' }, { expr: 'shock', name: 'Quoi' }, { expr: 'sus', name: 'Sus' },
  { expr: 'miam', name: 'Miam' }, { expr: 'gg', name: 'GG' }, { expr: 'dodo', name: 'Dodo' },
  { expr: 'hi', name: 'Hello' }
];
const PANELS = [
  { title: 'À propos', expr: 'happy' }, { title: 'Planning', expr: 'hi' }, { title: 'Mon setup', expr: 'gg' },
  { title: 'Règles du chat', expr: 'sus' }, { title: 'Soutenir', expr: 'love' }
];
const TIERS = ['1 mois', '3 mois', '6 mois', '1 an', '2 ans', '3 ans'];

let uploadedImg = null;

/* ---------- Couleurs ---------- */
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
const toHex = ([r, g, b]) => '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return toHex(A.map((v, i) => Math.round(v + (B[i] - v) * t))); }
function shade(hex, amt) { return mix(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt)); }
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const textOn = hex => lum(hex) > 0.4 ? '#1a1420' : '#ffffff';
const bright = (hex, fallback) => lum(hex) < 0.12 ? fallback : hex;
const rnd = i => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

/* ---------- Dessins SVG de base ---------- */
const heart = (x, y, s, fill) => `<path d="M${x} ${y + s * .9} C${x - s * 1.6} ${y - s * .2} ${x - s * .6} ${y - s * 1.3} ${x} ${y - s * .4} C${x + s * .6} ${y - s * 1.3} ${x + s * 1.6} ${y - s * .2} ${x} ${y + s * .9}Z" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
const star = (x, y, r, fill = '#fff') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>`;
const FONT_SVG = `font-family="Arial Black, Arial, sans-serif" font-weight="900"`;

function headParts(P) {
  return `<ellipse cx="60" cy="68" rx="46" ry="42" fill="${P.fur}" ${S}/><ellipse cx="60" cy="90" rx="30" ry="17" fill="${P.belly}"/><ellipse cx="60" cy="78" rx="18" ry="12" fill="${P.belly}"/>`;
}

const ANIMALS = {
  hamster: P => ({
    back: `<circle cx="28" cy="34" r="14" fill="${P.fur}" ${S}/><circle cx="28" cy="34" r="7" fill="${PINK}"/><circle cx="92" cy="34" r="14" fill="${P.fur}" ${S}/><circle cx="92" cy="34" r="7" fill="${PINK}"/>`,
    tuft: `<path d="M50 30 Q50 14 59 22 Q63 8 70 23 Q77 16 73 31" fill="${P.fur}" ${S}/>`,
    nose: `<ellipse cx="60" cy="72" rx="5" ry="3.5" fill="${PINK}" stroke="${INK}" stroke-width="2"/>`
  }),
  chat: P => ({
    back: `<path d="M20 50 L22 6 L54 30Z" fill="${P.fur}" ${S}/><path d="M27 40 L28 17 L45 31Z" fill="${PINK}"/><path d="M100 50 L98 6 L66 30Z" fill="${P.fur}" ${S}/><path d="M93 40 L92 17 L75 31Z" fill="${PINK}"/>`,
    tuft: `<path d="M53 31 v8 M60 29 v10 M67 31 v8" stroke="${P.furD}" stroke-width="3.5" stroke-linecap="round"/>`,
    nose: `<path d="M55 69 h10 l-5 6z" fill="${PINK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
    top: `<path d="M30 74 h-20 M30 80 l-19 6 M90 74 h20 M90 80 l19 6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
  }),
  chien: P => ({
    front: `<ellipse cx="17" cy="58" rx="12" ry="26" transform="rotate(16 17 58)" fill="${P.furD}" ${S}/><ellipse cx="103" cy="58" rx="12" ry="26" transform="rotate(-16 103 58)" fill="${P.furD}" ${S}/>`,
    tuft: `<path d="M52 30 Q54 18 61 25 Q66 16 70 30" fill="${P.fur}" ${S}/>`,
    nose: `<ellipse cx="60" cy="71" rx="7" ry="5" fill="${INK}"/><ellipse cx="58" cy="69.5" rx="2" ry="1.2" fill="#fff"/>`
  }),
  renard: P => ({
    back: `<path d="M14 50 L18 0 L52 28Z" fill="${P.fur}" ${S}/><path d="M22 38 L22 14 L42 30Z" fill="${P.belly}"/><path d="M106 50 L102 0 L68 28Z" fill="${P.fur}" ${S}/><path d="M98 38 L98 14 L78 30Z" fill="${P.belly}"/>`,
    mask: `<path d="M16 70 Q36 64 60 80 Q84 64 104 70 Q98 104 60 108 Q22 104 16 70Z" fill="${P.belly}"/>`,
    tuft: '',
    nose: `<ellipse cx="60" cy="72" rx="5.5" ry="4" fill="${INK}"/>`
  })
};

function expressions(P) {
  const roundEyes = `<circle cx="42" cy="58" r="8" fill="${INK}"/><circle cx="45" cy="55" r="3" fill="#fff"/><circle cx="78" cy="58" r="8" fill="${INK}"/><circle cx="81" cy="55" r="3" fill="#fff"/>`;
  const teeth = `<rect x="56.5" y="80" width="7" height="6" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  const wMouth = `<path d="M52 79 Q56 84 60 79 Q64 84 68 79" ${L(3)}/>`;
  const happyEyes = `<path d="M34 60 Q42 50 50 60" ${L(4)}/><path d="M70 60 Q78 50 86 60" ${L(4)}/>`;
  const openSmile = `<path d="M49 79 Q60 97 71 79 Z" fill="${MOUTH}" ${S}/><path d="M54 88 Q60 84 66 88 Q60 93 54 88Z" fill="${PINK}"/>`;
  return {
    happy: { face: happyEyes + openSmile, fx: star(8, 20, 8) + star(112, 28, 6) },
    hi: { face: roundEyes + teeth + wMouth, fx: `<ellipse cx="108" cy="70" rx="11" ry="13" fill="${P.fur}" ${S}/><path d="M102 64 v8 M108 62 v9 M114 64 v8" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M116 50 q6 -4 8 2 M118 42 q8 -4 10 4" ${L(2.5)}/>` },
    rage: {
      cheeks: `<ellipse cx="30" cy="78" rx="11" ry="8" fill="#ff4d4d" opacity=".8"/><ellipse cx="90" cy="78" rx="11" ry="8" fill="#ff4d4d" opacity=".8"/>`,
      face: `<path d="M30 44 L52 53" ${L(5)}/><path d="M90 44 L68 53" ${L(5)}/><circle cx="43" cy="61" r="6" fill="#fff" ${S}/><circle cx="44" cy="62" r="2.5" fill="${INK}"/><circle cx="77" cy="61" r="6" fill="#fff" ${S}/><circle cx="76" cy="62" r="2.5" fill="${INK}"/><rect x="45" y="80" width="30" height="13" rx="4" fill="#fff" ${S}/><path d="M53 80v13M60 80v13M67 80v13M45 86.5h30" stroke="${INK}" stroke-width="2"/>`,
      fx: `<path d="M86 14 q6 5 12 0 M92 8 q-5 6 0 12" stroke="#ff3b3b" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="4" cy="44" r="6" fill="#fff" opacity=".9"/><circle cx="10" cy="34" r="4" fill="#fff" opacity=".9"/><circle cx="116" cy="44" r="6" fill="#fff" opacity=".9"/><circle cx="110" cy="34" r="4" fill="#fff" opacity=".9"/>`
    },
    cry: { face: `<path d="M34 46 L48 41" ${L(4)}/><path d="M86 46 L72 41" ${L(4)}/><path d="M34 56 Q42 64 50 56" ${L(4)}/><path d="M70 56 Q78 64 86 56" ${L(4)}/><rect x="38" y="60" width="8" height="36" rx="4" fill="${BLUE}" stroke="${INK}" stroke-width="2"/><rect x="74" y="60" width="8" height="36" rx="4" fill="${BLUE}" stroke="${INK}" stroke-width="2"/><path d="M48 88 Q54 79 60 87 Q66 79 72 88 Q60 98 48 88Z" fill="${MOUTH}" ${S}/>` },
    love: { face: heart(42, 58, 9, '#ff4f7b') + heart(78, 58, 9, '#ff4f7b') + openSmile, fx: heart(10, 26, 6, '#ff7a9c') + heart(110, 20, 7, '#ff7a9c') },
    shock: { face: `<path d="M31 40 Q42 33 53 40" ${L(4)}/><path d="M67 40 Q78 33 89 40" ${L(4)}/><circle cx="42" cy="58" r="11" fill="#fff" ${S}/><circle cx="42" cy="58" r="3" fill="${INK}"/><circle cx="78" cy="58" r="11" fill="#fff" ${S}/><circle cx="78" cy="58" r="3" fill="${INK}"/><ellipse cx="60" cy="88" rx="6" ry="8" fill="${MOUTH}" ${S}/>`, fx: `<path d="M104 32 Q111 44 104 49 Q97 44 104 32Z" fill="${BLUE}" stroke="${INK}" stroke-width="2.5"/>` },
    sus: { face: `<circle cx="42" cy="60" r="9" fill="#fff" ${S}/><circle cx="46" cy="61" r="4" fill="${INK}"/><path d="M33 60 A9 9 0 0 1 51 60Z" fill="${P.fur}" ${S}/><circle cx="78" cy="60" r="9" fill="#fff" ${S}/><circle cx="82" cy="61" r="4" fill="${INK}"/><path d="M69 60 A9 9 0 0 1 87 60Z" fill="${P.fur}" ${S}/><path d="M68 44 Q78 36 88 43" ${L(4)}/><path d="M52 84 Q62 85 69 79" ${L(3.5)}/>` },
    miam: {
      cheeks: `<ellipse cx="22" cy="80" rx="17" ry="14" fill="${P.fur}" ${S}/><ellipse cx="22" cy="82" rx="9" ry="6" fill="${PINK}" opacity=".85"/><ellipse cx="98" cy="80" rx="17" ry="14" fill="${P.fur}" ${S}/><ellipse cx="98" cy="82" rx="9" ry="6" fill="${PINK}" opacity=".85"/>`,
      face: happyEyes + `<path d="M56 81 Q60 85 64 81" ${L(3)}/>`,
      fx: `<path d="M70 104 l6 -2 l2 6 l-6 2z" fill="${P.furD}" stroke="${INK}" stroke-width="2"/><path d="M46 108 l5 -1 l1 5 l-5 1z" fill="${P.furD}" stroke="${INK}" stroke-width="2"/>`
    },
    gg: { face: `<path d="M27 50 h29 v5 q0 11 -14.5 11 q-14.5 0 -14.5 -11z" fill="${INK}"/><path d="M64 50 h29 v5 q0 11 -14.5 11 q-14.5 0 -14.5 -11z" fill="${INK}"/><path d="M54 52 h12" ${L(3)}/><path d="M33 55 l7 0 M70 55 l7 0" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M51 82 Q62 89 70 80" ${L(3.5)}/>`, fx: ggBadge() },
    dodo: { face: `<path d="M34 60 Q42 65 50 60" ${L(4)}/><path d="M70 60 Q78 65 86 60" ${L(4)}/><ellipse cx="60" cy="84" rx="4" ry="3" fill="${MOUTH}" stroke="${INK}" stroke-width="2"/><circle cx="74" cy="80" r="7" fill="#bfe9ff" fill-opacity=".85" stroke="${INK}" stroke-width="2"/>`, fx: zzz() }
  };
}
function ggBadge() { return `<circle cx="98" cy="98" r="18" fill="#ffb547" ${S}/><text x="98" y="104" text-anchor="middle" ${FONT_SVG} font-size="15" fill="${INK}">GG</text>`; }
function zzz() { return `<text x="92" y="30" ${FONT_SVG} font-size="17" fill="#5ee6c1" stroke="${INK}" stroke-width="1">Z</text><text x="104" y="16" ${FONT_SVG} font-size="12" fill="#5ee6c1" stroke="${INK}" stroke-width="1">z</text>`; }

function imageFx(expr) {
  return ({
    happy: star(6, 16, 9) + star(114, 26, 7) + star(108, 108, 7),
    hi: `<path d="M110 40 q8 -6 12 2 M112 30 q10 -6 14 4" ${L(3)}/>`,
    rage: `<path d="M88 4 q7 6 14 0 M95 -3 q-6 7 0 14" stroke="#ff3b3b" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="2" cy="40" r="7" fill="#fff" opacity=".9"/><circle cx="9" cy="28" r="5" fill="#fff" opacity=".9"/><circle cx="118" cy="40" r="7" fill="#fff" opacity=".9"/><circle cx="111" cy="28" r="5" fill="#fff" opacity=".9"/>`,
    cry: `<path d="M8 56 Q16 70 8 76 Q0 70 8 56Z" fill="${BLUE}" stroke="${INK}" stroke-width="2.5"/><path d="M112 66 Q120 80 112 86 Q104 80 112 66Z" fill="${BLUE}" stroke="${INK}" stroke-width="2.5"/>`,
    love: heart(10, 22, 8, '#ff4f7b') + heart(110, 16, 9, '#ff4f7b') + heart(108, 104, 6, '#ff7a9c'),
    shock: `<text x="96" y="30" ${FONT_SVG} font-size="30" fill="#ffb547" stroke="${INK}" stroke-width="2">!?</text><path d="M10 30 Q17 42 10 47 Q3 42 10 30Z" fill="${BLUE}" stroke="${INK}" stroke-width="2.5"/>`,
    sus: `<text x="98" y="32" ${FONT_SVG} font-size="34" fill="#5ee6c1" stroke="${INK}" stroke-width="2">?</text>`,
    miam: `<path d="M14 104 l7 -2 l2 7 l-7 2z" fill="#c47a3c" stroke="${INK}" stroke-width="2"/><path d="M100 108 l6 -1 l1 6 l-6 1z" fill="#c47a3c" stroke="${INK}" stroke-width="2"/>`,
    gg: ggBadge(),
    dodo: zzz()
  })[expr] || '';
}

/* ---------- Canvas : outils ---------- */
function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rrect(x, X, Y, W, H, r) {
  x.beginPath();
  if (x.roundRect) { x.roundRect(X, Y, W, H, r); return; }
  x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath();
}
function fitFont(x, text, font, max, min, width) {
  let size = max;
  do { x.font = font(size); if (x.measureText(text).width <= width) break; size -= 2; } while (size > min);
  return size;
}
function wrap(x, text, width, maxLines) {
  const words = text.split(/\s+/).filter(Boolean), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (x.measureText(test).width > width && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += '…'; }
  return lines;
}
function dots(x, w, h, color, step, r) {
  x.fillStyle = color;
  for (let yy = step / 2; yy < h; yy += step) for (let xx = step / 2; xx < w; xx += step) { x.beginPath(); x.arc(xx, yy, r, 0, Math.PI * 2); x.fill(); }
}
function drips(x, W, top, color, count, maxLen, seed) {
  x.fillStyle = color;
  x.fillRect(0, 0, W, top);
  for (let i = 0; i < count; i++) {
    const cx = rnd(seed + i) * W, w = 8 + rnd(seed + i + 50) * 18, len = maxLen * (0.3 + rnd(seed + i + 99) * 0.7);
    x.beginPath(); x.moveTo(cx - w / 2, top - 2); x.lineTo(cx - w / 2, top + len - w / 2);
    x.arc(cx, top + len - w / 2, w / 2, Math.PI, 0, true); x.lineTo(cx + w / 2, top - 2); x.closePath(); x.fill();
  }
}

/* ---------- Styles ---------- */
const GLOW = id => `<defs><filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
const DRIP_SVG = `<path d="M40 103 q3 12 0 17 q-4 -5 0 -17Z M72 105 q3 9 0 13 q-4 -4 0 -13Z" fill="#8a0b0b" stroke="#120808" stroke-width="1.5"/>`;

const STYLES = {
  classique: {
    label: 'Classique', folder: 'classique',
    P: st => ({ fur: st.fur, belly: st.belly }),
    T: () => ({ ink: INK, pink: PINK, mouth: MOUTH, white: '#fff' }),
    font: s => `400 ${s}px "Bagel Fat One", "Arial Black", sans-serif`,
    body: s => `700 ${s}px Nunito, Arial, sans-serif`,
    bgColor: st => st.bg,
    bg(x, W, H, st) {
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, st.bg); g.addColorStop(1, shade(st.bg, -0.4));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      dots(x, W, H, rgba(st.accent, 0.1), W / 33, W / 400);
      x.save(); x.translate(W * 0.72, H * 0.98); x.rotate(-0.32);
      x.fillStyle = st.sec; x.fillRect(-W * 0.6, -H * 0.17, W * 1.4, H * 0.13);
      x.fillStyle = st.accent; x.fillRect(-W * 0.6, -H * 0.012, W * 1.4, H * 0.025);
      x.restore();
    },
    title(x, t, X, Y, size, st) { x.lineJoin = 'round'; x.lineWidth = Math.max(6, size / 12); x.strokeStyle = '#1a1420'; x.strokeText(t, X, Y); x.fillStyle = st.accent; x.fillText(t, X, Y); },
    text: st => textOn(st.bg), eyebrow: st => st.sec,
    chip(x, X, Y, w, h, t, st) { rrect(x, X, Y, w, h, h / 2); x.fillStyle = st.sec; x.fill(); x.fillStyle = textOn(st.sec); x.fillText(t, X + h * 0.36, Y + h * 0.68); },
    panel(x, W, H, i, st) {
      const bg = i % 2 ? st.sec : st.accent;
      rrect(x, 0, 0, W, H, 14); x.fillStyle = bg; x.fill();
      x.save(); rrect(x, 0, 0, W, H, 14); x.clip();
      x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 6; x.setLineDash([2, 10]); x.lineCap = 'round';
      x.beginPath(); x.arc(W - 10, 10, 40, 0, Math.PI * 2); x.stroke(); x.restore(); x.setLineDash([]);
      return textOn(bg);
    },
    dot: st => st.accent
  },

  kawaii: {
    label: 'Kawaii pastel', folder: 'kawaii-pastel',
    P: st => ({ fur: mix(st.fur, '#ffffff', 0.45), belly: '#fffaf4' }),
    T: () => ({ ink: '#6a4a72', pink: '#ffb3cc', mouth: '#c4557e', white: '#fff' }),
    under: `<path d="M22 76 l3 -6 M28 77 l3 -6 M34 78 l3 -6 M84 78 l3 -6 M90 77 l3 -6 M96 76 l3 -6" stroke="#ff7aa8" stroke-width="2" stroke-linecap="round"/>`,
    over: star(4, 96, 6, '#fff3a8') + star(116, 100, 5, '#c9f2ff'),
    font: s => `700 ${s}px Fredoka, "Arial Rounded MT Bold", sans-serif`,
    body: s => `600 ${s}px Fredoka, Nunito, Arial, sans-serif`,
    bgColor: st => mix(st.accent, '#ffffff', 0.82),
    bg(x, W, H, st) {
      const base = mix(st.accent, '#ffffff', 0.82);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, base); g.addColorStop(1, mix(st.sec, '#ffffff', 0.7));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,.85)';
      [[0.08, 0.2], [0.55, 0.12], [0.86, 0.3], [0.3, 0.85]].forEach(([a, b], i) => {
        const cx = a * W, cy = b * H, r = W * 0.035 * (1 + rnd(i) * 0.6);
        [[0, 0, 1], [-1.1, 0.3, 0.75], [1.1, 0.3, 0.8], [0.4, -0.5, 0.8]].forEach(([dx, dy, k]) => { x.beginPath(); x.arc(cx + dx * r, cy + dy * r, r * k, 0, Math.PI * 2); x.fill(); });
      });
      for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? rgba('#ffffff', 0.9) : rgba(mix(st.accent, '#ff7aa8', 0.5), 0.5); x.beginPath(); x.arc(rnd(i + 7) * W, rnd(i + 31) * H, W * 0.004 + rnd(i) * W * 0.004, 0, Math.PI * 2); x.fill(); }
    },
    title(x, t, X, Y, size, st) {
      x.lineJoin = 'round'; x.lineWidth = Math.max(8, size / 6); x.strokeStyle = '#ffffff'; x.strokeText(t, X, Y);
      x.fillStyle = mix(st.accent, '#c4557e', 0.35); x.fillText(t, X, Y);
    },
    text: () => '#6a4a72', eyebrow: () => '#c4557e',
    chip(x, X, Y, w, h, t, st) { rrect(x, X, Y, w, h, h / 2); x.fillStyle = mix(st.sec, '#ffffff', 0.35); x.fill(); x.lineWidth = 3; x.strokeStyle = '#ffffff'; x.stroke(); x.fillStyle = '#6a4a72'; x.fillText(t, X + h * 0.36, Y + h * 0.68); },
    panel(x, W, H, i, st) {
      const bg = mix(i % 2 ? st.sec : st.accent, '#ffffff', 0.5);
      rrect(x, 0, 0, W, H, 22); x.fillStyle = bg; x.fill();
      rrect(x, 6, 6, W - 12, H - 12, 17); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.setLineDash([8, 6]); x.stroke(); x.setLineDash([]);
      return '#6a4a72';
    },
    dot: st => mix(st.accent, '#c4557e', 0.35)
  },

  neon: {
    label: 'Néon gaming', folder: 'neon-gaming',
    P: () => ({ fur: '#140a24', belly: '#1f1238' }),
    T: st => ({ ink: bright(st.sec, '#3df5ff'), pink: bright(st.accent, '#ff3df2'), mouth: '#2a0f3d', white: '#ffffff' }),
    wrap: inner => `${GLOW('glow')}<g filter="url(#glow)">${inner}</g>`,
    font: s => `900 ${s}px Orbitron, "Arial Black", sans-serif`,
    body: s => `700 ${s}px Orbitron, Arial, sans-serif`,
    bgColor: () => '#07040d',
    bg(x, W, H, st) {
      const A = bright(st.sec, '#3df5ff'), B = bright(st.accent, '#ff3df2');
      x.fillStyle = '#07040d'; x.fillRect(0, 0, W, H);
      const g = x.createRadialGradient(W * 0.75, H * 0.6, 10, W * 0.75, H * 0.6, W * 0.6); g.addColorStop(0, rgba(B, 0.28)); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const hz = H * 0.66, vx = W * 0.6;
      x.strokeStyle = rgba(A, 0.45); x.lineWidth = Math.max(1, W / 800);
      for (let i = -14; i <= 14; i++) { x.beginPath(); x.moveTo(vx, hz); x.lineTo(vx + i * W * 0.09, H); x.stroke(); }
      for (let k = 1; k < 9; k++) { const yy = hz + (H - hz) * Math.pow(k / 8, 1.8); x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
      x.save(); x.shadowColor = A; x.shadowBlur = W / 60; x.strokeStyle = A; x.lineWidth = Math.max(2, W / 400);
      x.beginPath(); x.moveTo(0, hz); x.lineTo(W, hz); x.stroke(); x.restore();
    },
    title(x, t, X, Y, size, st) {
      const B = bright(st.accent, '#ff3df2');
      x.save(); x.shadowColor = B; x.shadowBlur = size / 3; x.lineWidth = Math.max(3, size / 22); x.strokeStyle = B; x.strokeText(t, X, Y);
      x.fillStyle = '#ffffff'; x.fillText(t, X, Y); x.restore();
    },
    text: () => '#e8e0ff', eyebrow: st => bright(st.sec, '#3df5ff'),
    chip(x, X, Y, w, h, t, st) {
      const A = bright(st.sec, '#3df5ff');
      x.save(); x.shadowColor = A; x.shadowBlur = h / 3; rrect(x, X, Y, w, h, 8); x.lineWidth = 3; x.strokeStyle = A; x.stroke(); x.restore();
      x.fillStyle = A; x.fillText(t, X + h * 0.36, Y + h * 0.68);
    },
    panel(x, W, H, i, st) {
      const C = i % 2 ? bright(st.accent, '#ff3df2') : bright(st.sec, '#3df5ff');
      rrect(x, 4, 4, W - 8, H - 8, 10); x.fillStyle = '#0d0718'; x.fill();
      x.save(); x.shadowColor = C; x.shadowBlur = 14; x.lineWidth = 3; x.strokeStyle = C; rrect(x, 4, 4, W - 8, H - 8, 10); x.stroke(); x.restore();
      return C;
    },
    dot: st => bright(st.sec, '#3df5ff')
  },

  pixel: {
    label: 'Pixel art', folder: 'pixel-art', pixel: true,
    P: st => ({ fur: st.fur, belly: st.belly }),
    T: () => ({ ink: '#141018', pink: PINK, mouth: MOUTH, white: '#fff', swMul: 1.6 }),
    font: s => `400 ${s}px "Press Start 2P", monospace`,
    body: s => `400 ${s * 1.35}px VT323, "Courier New", monospace`,
    bgColor: st => st.bg,
    bg(x, W, H, st) {
      x.fillStyle = st.bg; x.fillRect(0, 0, W, H);
      const b = Math.round(W / 40);
      for (let yy = 0; yy < H; yy += b) for (let xx = 0; xx < W; xx += b) if (((xx + yy) / b) % 2 === 0) { x.fillStyle = rgba(shade(st.bg, 0.12), 1); x.fillRect(xx, yy, b, b); }
      const gy = H - b * 3;
      for (let xx = 0; xx < W; xx += b * 2) { x.fillStyle = st.sec; x.fillRect(xx, gy, b * 2, b * 3); x.fillStyle = shade(st.sec, -0.35); x.fillRect(xx, gy, b * 2, b * 0.5); x.fillRect(xx + b * 2 - b * 0.4, gy, b * 0.4, b * 3); }
      for (let i = 0; i < 6; i++) { const cx = (0.08 + rnd(i) * 0.5) * W, cy = (0.08 + rnd(i + 9) * 0.25) * H; x.fillStyle = st.accent; x.fillRect(cx, cy, b * 0.5, b * 0.5); }
    },
    title(x, t, X, Y, size, st) { const o = Math.max(3, Math.round(size / 9)); x.fillStyle = '#000000'; x.fillText(t, X + o, Y + o); x.fillStyle = st.accent; x.fillText(t, X, Y); },
    text: st => textOn(st.bg), eyebrow: st => st.sec,
    chip(x, X, Y, w, h, t, st) { x.fillStyle = '#000000'; x.fillRect(X, Y, w, h); x.fillStyle = st.sec; x.fillRect(X + 4, Y + 4, w - 8, h - 8); x.fillStyle = textOn(st.sec); x.fillText(t, X + h * 0.36, Y + h * 0.7); },
    panel(x, W, H, i, st) {
      const bg = i % 2 ? st.sec : st.accent;
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H); x.fillStyle = bg; x.fillRect(4, 4, W - 8, H - 8);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(4, 4, W - 8, 6); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(4, H - 10, W - 8, 6);
      return textOn(bg);
    },
    dot: st => st.accent
  },

  horreur: {
    label: 'Horreur', folder: 'horreur',
    P: st => ({ fur: mix(st.fur, '#7d8a6a', 0.6), belly: '#cfc8b0' }),
    T: () => ({ ink: '#0e0808', pink: '#5b2d4a', mouth: '#3a0606', white: '#e8e0a8' }),
    under: `<ellipse cx="42" cy="67" rx="11" ry="4" fill="#3a2436" opacity=".55"/><ellipse cx="78" cy="67" rx="11" ry="4" fill="#3a2436" opacity=".55"/>`,
    over: `<path d="M72 33 L94 45" stroke="#0e0808" stroke-width="2.5" stroke-linecap="round"/><path d="M76 31 l-3 6 M82 34 l-3 6 M88 37 l-3 6 M94 41 l-3 6" stroke="#0e0808" stroke-width="2" stroke-linecap="round"/>` + DRIP_SVG,
    imgWrap: inner => `<defs><filter id="dk"><feColorMatrix type="saturate" values="0.3"/></filter></defs><g filter="url(#dk)">${inner}</g>${DRIP_SVG}`,
    font: s => `400 ${s}px Creepster, Impact, sans-serif`,
    body: s => `700 ${s}px Nunito, Arial, sans-serif`,
    bgColor: () => '#0c0405',
    bg(x, W, H, st) {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1c080b'); g.addColorStop(1, '#050203');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { const cx = rnd(i + 3) * W, cy = (0.5 + rnd(i + 8) * 0.5) * H, r = W * (0.2 + rnd(i) * 0.2); const f = x.createRadialGradient(cx, cy, 0, cx, cy, r); f.addColorStop(0, 'rgba(220,210,200,.07)'); f.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = f; x.fillRect(0, 0, W, H); }
      drips(x, W, H * 0.03, '#6e070c', Math.round(W / 70), H * 0.18, 11);
    },
    title(x, t, X, Y, size, st) { x.save(); x.shadowColor = '#b00010'; x.shadowBlur = size / 5; x.fillStyle = bright(st.accent, '#c8f04a'); x.fillText(t, X, Y); x.restore(); },
    text: () => '#e6dccb', eyebrow: () => '#d63a3a',
    chip(x, X, Y, w, h, t, st) { rrect(x, X, Y, w, h, 6); x.fillStyle = '#2a1215'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#8a0b0b'; x.stroke(); x.fillStyle = '#e6dccb'; x.fillText(t, X + h * 0.36, Y + h * 0.68); },
    panel(x, W, H, i, st) {
      rrect(x, 0, 0, W, H, 8); x.fillStyle = '#170a0c'; x.fill();
      x.save(); rrect(x, 0, 0, W, H, 8); x.clip(); drips(x, W, 5, '#6e070c', 7, 26, 20 + i * 7); x.restore();
      return bright(st.accent, '#c8f04a');
    },
    dot: () => '#8a0b0b'
  }
};
const STYLE_KEYS = Object.keys(STYLES);

/* ---------- Construction des SVG ---------- */
function recolor(s, T) {
  let out = s.replaceAll(INK, T.ink).replaceAll(PINK, T.pink).replaceAll(MOUTH, T.mouth).replaceAll('fill="#fff"', `fill="${T.white}"`);
  if (T.swMul) out = out.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${(parseFloat(v) * T.swMul).toFixed(1)}"`);
  return out;
}

function charSVG(expr, st, sty, px = 240) {
  const T = sty.T(st);
  let inner;
  if (st.mode === 'image' && st.img) {
    inner = `<image href="${st.img}" x="6" y="6" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>`;
    if (sty.imgWrap) inner = sty.imgWrap(inner);
    inner += imageFx(expr);
  } else {
    const P = sty.P(st); P.furD = shade(P.fur, -0.25);
    const A = ANIMALS[st.animal](P);
    const E = expressions(P)[expr];
    const cheeks = E.cheeks ?? `<ellipse cx="30" cy="78" rx="10" ry="7" fill="${PINK}" opacity=".75"/><ellipse cx="90" cy="78" rx="10" ry="7" fill="${PINK}" opacity=".75"/>`;
    inner = `${A.back || ''}${headParts(P)}${A.mask || ''}${sty.under || ''}${cheeks}${A.front || ''}${A.tuft || ''}${A.nose}${E.face}${A.top || ''}${sty.over || ''}${E.fx || ''}`;
  }
  inner = recolor(inner, T);
  if (sty.wrap) inner = sty.wrap(inner);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 136 136" width="${px}" height="${px}">${inner}</svg>`;
}

function badgeSVG(i, st, sty) {
  const base = [st.sec, st.accent, st.accent, '#d7deea', '#ffc84a', '#ffc84a'][i];
  let T = sty.T(st), f = base, ring = i === 2 ? st.sec : '#d7deea';
  if (sty === STYLES.kawaii) { f = mix(base, '#ffffff', 0.4); ring = mix(ring, '#ffffff', 0.3); }
  if (sty === STYLES.horreur) { f = mix(base, '#4a4a3c', 0.45); ring = '#8a0b0b'; }
  if (sty === STYLES.neon) { T = { ...T, ink: bright(base, '#3df5ff') }; f = '#140a24'; ring = bright(base, '#3df5ff'); }
  const dy = i === 5 ? 6 : 0;
  let g = '';
  if (i === 2 || i === 3) g += `<circle cx="36" cy="38" r="32" fill="none" stroke="${ring}" stroke-width="4" stroke-dasharray="6 5"/>`;
  g += `<g transform="translate(0 ${dy})">
    <path d="M36 32 C48 32 57 44 55 52 C53 60 44 58 36 58 C28 58 19 60 17 52 C15 44 24 32 36 32Z" fill="${f}" ${S}/>
    <ellipse cx="17" cy="30" rx="6.5" ry="8.5" transform="rotate(-20 17 30)" fill="${f}" ${S}/>
    <ellipse cx="29" cy="19" rx="6.5" ry="8.5" transform="rotate(-6 29 19)" fill="${f}" ${S}/>
    <ellipse cx="43" cy="19" rx="6.5" ry="8.5" transform="rotate(6 43 19)" fill="${f}" ${S}/>
    <ellipse cx="55" cy="30" rx="6.5" ry="8.5" transform="rotate(20 55 30)" fill="${f}" ${S}/>
    <path d="M27 42 Q31 37 36 37" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  if (i === 5) g += `<path d="M22 14 L25 0 L36 9 L47 0 L50 14Z" fill="${sty === STYLES.neon ? '#140a24' : '#ffc84a'}" ${S}/><circle cx="36" cy="9" r="2.5" fill="#ff7a9c"/>`;
  if (i >= 4) g += star(62, 14, 8) + star(9, 52, 5);
  if (sty === STYLES.horreur) g += `<path d="M30 60 q3 9 0 13 q-4 -4 0 -13Z M44 59 q2 6 0 9 q-3 -3 0 -9Z" fill="#8a0b0b"/>`;
  g = recolor(g, T);
  if (sty.wrap) g = sty.wrap(g);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -6 80 80" width="160" height="160">${g}</svg>`;
}

/* ---------- Rendu image ---------- */
function loadSVG(svg) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Image SVG illisible'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function drawScaled(src, size, smooth = true) {
  const c = newCanvas(size, size), x = c.getContext('2d');
  x.imageSmoothingEnabled = smooth; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, size, size);
  return c;
}
/* Pixel art : rendu en tout petit, alpha tranché net, puis agrandi sans lissage */
function pixelBase(img, low) {
  const c = drawScaled(img, low), x = c.getContext('2d');
  const d = x.getImageData(0, 0, low, low);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
  x.putImageData(d, 0, 0);
  return c;
}
async function charArt(expr, st, sty, size, low) {
  const img = await loadSVG(charSVG(expr, st, sty, Math.max(size, 240)));
  return sty.pixel ? pixelBase(img, low) : img;
}
function drawArt(x, art, X, Y, size, sty) { x.imageSmoothingEnabled = !sty.pixel; x.drawImage(art, X, Y, size, size); x.imageSmoothingEnabled = true; }

function drawBanner(st, sty, art) {
  const W = 1200, H = 480, c = newCanvas(W, H), x = c.getContext('2d');
  sty.bg(x, W, H, st);
  drawArt(x, art, 770, 40, 430, sty);
  const left = 64, maxW = 660, titleY = 220;
  x.textBaseline = 'alphabetic';
  const size = fitFont(x, st.pseudo, sty.font, sty.pixel ? 70 : 130, 24, maxW);
  sty.title(x, st.pseudo, left, titleY, size, st);
  x.font = sty.body(28); x.fillStyle = sty.text(st);
  wrap(x, st.slogan, maxW, 2).forEach((ln, i) => x.fillText(ln, left, titleY + 54 + i * 38));
  let cx = left; const cy = titleY + 140;
  x.font = sty.pixel ? sty.font(16) : sty.body(22);
  [...st.days, st.heure].filter(Boolean).forEach(t => {
    const w = x.measureText(t).width + 32;
    sty.chip(x, cx, cy, w, 44, t, st);
    cx += w + 10;
  });
  return c;
}

function drawPanel(st, sty, title, art, i) {
  const W = 320, H = 100, c = newCanvas(W, H), x = c.getContext('2d');
  const color = sty.panel(x, W, H, i, st);
  drawArt(x, art, 6, 4, 92, sty);
  x.textBaseline = 'middle';
  fitFont(x, title, sty.font, sty.pixel ? 18 : 34, 10, W - 120);
  if (sty === STYLES.neon) { x.shadowColor = color; x.shadowBlur = 10; }
  x.fillStyle = color; x.fillText(title, 108, H / 2 + 2);
  return c;
}

function drawPause(st, sty, art) {
  const W = 1920, H = 1080, c = newCanvas(W, H), x = c.getContext('2d');
  sty.bg(x, W, H, st);
  drawArt(x, art, 1080, 240, 800, sty);
  const left = 120;
  x.textBaseline = 'alphabetic';
  x.font = sty.pixel ? sty.font(26) : sty.body(38); x.fillStyle = sty.eyebrow(st);
  x.fillText(st.pseudo.toUpperCase() + ' · LE STREAM REPREND BIENTÔT', left, 360);
  const size = fitFont(x, 'PAUSE', sty.font, sty.pixel ? 180 : 300, 80, 900);
  sty.title(x, 'PAUSE', left, 640, size, st);
  x.font = sty.body(54); x.fillStyle = sty.text(st);
  wrap(x, st.pauseText, 900, 2).forEach((ln, i) => x.fillText(ln, left, 750 + i * 70));
  [0.35, 0.55, 0.75, 0.9, 1].forEach((a, i) => {
    x.fillStyle = rgba(sty.dot(st), a);
    if (sty.pixel) x.fillRect(left + i * 70, 880, 36, 36); else { x.beginPath(); x.arc(left + 20 + i * 70, 900, 20, 0, Math.PI * 2); x.fill(); }
  });
  return c;
}

/* ---------- Logos ---------- */
function logoColors(st, sty) {
  if (sty === STYLES.kawaii) return { main: mix(st.accent, '#c4557e', 0.35), second: mix(st.sec, '#ffffff', 0.35), dark: '#6a4a72', light: '#ffffff' };
  if (sty === STYLES.neon) return { main: bright(st.accent, '#ff3df2'), second: bright(st.sec, '#3df5ff'), dark: '#0d0718', light: '#ffffff', glow: true };
  if (sty === STYLES.horreur) return { main: bright(st.accent, '#c8f04a'), second: '#8a0b0b', dark: '#0e0808', light: '#e6dccb' };
  if (sty === STYLES.pixel) return { main: st.accent, second: st.sec, dark: '#000000', light: '#ffffff' };
  return { main: st.accent, second: st.sec, dark: '#1a1420', light: '#ffffff' };
}
function glowOn(x, K, color, blur) { if (K.glow) { x.shadowColor = color; x.shadowBlur = blur; } }
function glowOff(x) { x.shadowBlur = 0; x.shadowColor = 'transparent'; }
/* Contour épais autour du personnage (effet autocollant) */
function outlined(art, size, color, r, sty) {
  const c = newCanvas(size + r * 2, size + r * 2), x = c.getContext('2d');
  x.imageSmoothingEnabled = !sty.pixel;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) x.drawImage(art, r + Math.cos(a) * r, r + Math.sin(a) * r, size, size);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over'; x.drawImage(art, r, r, size, size);
  return c;
}
function strokeFill(x, t, X, Y, K, fill, sw) {
  x.lineJoin = 'round'; x.lineWidth = sw; x.strokeStyle = K.dark;
  glowOn(x, K, fill, sw * 1.5); x.strokeText(t, X, Y); glowOff(x);
  x.fillStyle = fill; x.fillText(t, X, Y);
}
function arcText(x, text, cx, cy, r, top, color) {
  const chars = [...text], gap = 4;
  const widths = chars.map(ch => x.measureText(ch).width + gap);
  const total = widths.reduce((a, b) => a + b, 0);
  let acc = 0;
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const mid = (acc + widths[i] / 2 - total / 2) / r;
    const a = top ? -Math.PI / 2 + mid : Math.PI / 2 - mid;
    x.save(); x.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); x.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    x.fillText(ch, 0, 0); x.restore();
    acc += widths[i];
  });
  x.textAlign = 'start'; x.textBaseline = 'alphabetic';
}
function initial(st) { const m = st.pseudo.match(/[A-Za-z0-9]/); return m ? m[0].toUpperCase() : 'T'; }

function drawLogos(st, sty, art) {
  const K = logoColors(st, sty), out = [];
  const mk = (w, h) => { const c = newCanvas(w, h); return [c, c.getContext('2d')]; };

  // 1. Bouclier
  {
    const [c, x] = mk(1000, 1000);
    const shield = () => { x.beginPath(); x.moveTo(500, 60); x.lineTo(880, 160); x.lineTo(860, 560); x.quadraticCurveTo(820, 820, 500, 950); x.quadraticCurveTo(180, 820, 140, 560); x.lineTo(120, 160); x.closePath(); };
    shield(); x.fillStyle = K.dark; x.fill();
    glowOn(x, K, K.main, 30); x.lineWidth = 30; x.strokeStyle = K.main; x.lineJoin = 'round'; x.stroke(); glowOff(x);
    x.save(); x.translate(500, 505); x.scale(0.88, 0.88); x.translate(-500, -505); shield(); x.lineWidth = 12; x.strokeStyle = K.second; x.stroke(); x.restore();
    drawArt(x, art, 265, 150, 470, sty);
    x.beginPath(); x.moveTo(40, 650); x.lineTo(960, 650); x.lineTo(920, 715); x.lineTo(960, 780); x.lineTo(40, 780); x.lineTo(80, 715); x.closePath();
    x.fillStyle = K.main; glowOn(x, K, K.main, 25); x.fill(); glowOff(x); x.lineWidth = 10; x.strokeStyle = K.dark; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    fitFont(x, st.pseudo.toUpperCase(), sty.font, 96, 30, 760);
    x.fillStyle = textOn(K.main); x.fillText(st.pseudo.toUpperCase(), 500, 718);
    x.textAlign = 'start'; x.textBaseline = 'alphabetic';
    out.push({ name: 'bouclier', canvas: c });
  }
  // 2. Cercle
  {
    const [c, x] = mk(1000, 1000);
    x.beginPath(); x.arc(500, 500, 460, 0, Math.PI * 2); x.fillStyle = K.dark; x.fill();
    glowOn(x, K, K.main, 30); x.lineWidth = 26; x.strokeStyle = K.main; x.stroke(); glowOff(x);
    x.beginPath(); x.arc(500, 500, 310, 0, Math.PI * 2); x.fillStyle = K.second; x.fill(); x.lineWidth = 14; x.strokeStyle = K.dark; x.stroke();
    drawArt(x, art, 230, 220, 540, sty);
    fitFont(x, st.pseudo.toUpperCase(), sty.font, 80, 30, 900);
    arcText(x, st.pseudo.toUpperCase(), 500, 500, 385, true, K.main);
    x.font = sty.pixel ? sty.font(34) : sty.body(52);
    arcText(x, 'STREAMER TWITCH', 500, 500, 385, false, K.light);
    [[150, 500], [850, 500]].forEach(([sx, sy]) => { x.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, a = -Math.PI / 2 + k * Math.PI / 5; x.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a)); } x.closePath(); x.fillStyle = K.second; x.fill(); });
    out.push({ name: 'cercle', canvas: c });
  }
  // 3. Esport (hexagone + texte incliné)
  {
    const [c, x] = mk(1000, 1000);
    const hex = (r) => { x.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; x.lineTo(500 + r * Math.cos(a), 380 + r * Math.sin(a)); } x.closePath(); };
    hex(330); x.fillStyle = K.second; x.fill(); glowOn(x, K, K.second, 30); x.lineWidth = 24; x.strokeStyle = K.dark; x.stroke(); glowOff(x);
    hex(290); x.lineWidth = 8; x.strokeStyle = K.light; x.globalAlpha = 0.6; x.stroke(); x.globalAlpha = 1;
    drawArt(x, art, 250, 120, 500, sty);
    x.save(); x.translate(500, 860); x.transform(1, 0, -0.22, 1, 0, 0);
    x.fillStyle = K.main; x.fillRect(-420, 36, 840, 26);
    x.textAlign = 'center';
    fitFont(x, st.pseudo.toUpperCase(), sty.font, 150, 40, 860);
    strokeFill(x, st.pseudo.toUpperCase(), 0, 0, K, K.main, 22);
    x.restore();
    out.push({ name: 'esport', canvas: c });
  }
  // 4. Horizontal (mascotte + nom)
  {
    const [c, x] = mk(1600, 700);
    x.drawImage(outlined(art, 560, K.light, 16, sty), 30, 50);
    fitFont(x, st.pseudo, sty.font, 180, 40, 880);
    strokeFill(x, st.pseudo, 640, 390, K, K.main, 20);
    x.font = sty.pixel ? sty.font(28) : sty.body(44);
    const tag = 'LIVE SUR TWITCH', tw = x.measureText(tag).width + 60;
    rrect(x, 650, 450, tw, 80, sty.pixel ? 0 : 40); x.fillStyle = K.second; glowOn(x, K, K.second, 20); x.fill(); glowOff(x);
    x.fillStyle = textOn(K.second); x.textBaseline = 'middle'; x.fillText(tag, 680, 492); x.textBaseline = 'alphabetic';
    out.push({ name: 'horizontal', canvas: c });
  }
  // 5. Monogramme
  {
    const [c, x] = mk(1000, 1000);
    rrect(x, 80, 80, 840, 840, sty.pixel ? 0 : 160); x.fillStyle = K.dark; x.fill();
    glowOn(x, K, K.second, 30); x.lineWidth = 24; x.strokeStyle = K.second; x.stroke(); glowOff(x);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = sty.font(sty.pixel ? 520 : 720);
    strokeFill(x, initial(st), 470, 520, K, K.main, 28);
    x.textAlign = 'start'; x.textBaseline = 'alphabetic';
    x.drawImage(outlined(art, 440, K.dark, 14, sty), 520, 500);
    out.push({ name: 'monogramme', canvas: c });
  }
  // 6. Autocollant
  {
    const [c, x] = mk(1000, 1000);
    const o = outlined(art, 720, K.light, 26, sty);
    x.drawImage(outlined(o, o.width, K.dark, 8, { pixel: false }), 104, 20);
    x.save(); x.translate(500, 850); x.rotate(-0.07);
    x.font = sty.font(10);
    const size = fitFont(x, st.pseudo, sty.font, 110, 30, 760);
    const w = x.measureText(st.pseudo).width + 90, h = size + 70;
    rrect(x, -w / 2, -h / 2, w, h, sty.pixel ? 0 : 30); x.fillStyle = K.main; glowOn(x, K, K.main, 25); x.fill(); glowOff(x);
    x.lineWidth = 12; x.strokeStyle = K.dark; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = textOn(K.main); x.fillText(st.pseudo, 0, 6);
    x.restore();
    out.push({ name: 'autocollant', canvas: c });
  }
  return out;
}

/* ---------- Lecture du formulaire ---------- */
function cleanName(v, fallback) { const s = (v || '').replace(/[^A-Za-z0-9]/g, ''); return s || fallback; }
function getState() {
  return {
    mode: $('input[name=mode]:checked').value,
    animal: $('input[name=animal]:checked').value,
    fur: $('#fur').value, belly: $('#belly').value,
    img: uploadedImg,
    pseudo: $('#pseudo').value.trim() || 'TonPseudo',
    slogan: $('#slogan').value.trim(),
    days: $$('input[name=day]:checked').map(i => i.value),
    heure: $('#heure').value.trim(),
    pauseText: $('#pauseText').value.trim(),
    bg: $('#bg').value, accent: $('#accent').value, sec: $('#sec').value,
    emoteNames: $$('.emote-name').map((i, k) => cleanName(i.value, EMOTES[k].name)),
    panelTitles: $$('.panel-title').map((i, k) => i.value.trim() || PANELS[k].title),
    zipStyles: $$('input[name=zipStyle]:checked').map(i => i.value),
    pvStyle: ($('input[name=pvStyle]:checked') || {}).value || 'classique'
  };
}

/* ---------- Génération d'un pack complet dans un style ---------- */
let fontsReady = null;
function loadFonts() {
  if (!fontsReady) fontsReady = Promise.all([
    '400 80px "Bagel Fat One"', '700 30px Nunito', '700 60px Fredoka', '600 30px Fredoka',
    '900 60px Orbitron', '700 30px Orbitron', '400 40px "Press Start 2P"', '400 40px VT323', '400 60px Creepster'
  ].map(f => document.fonts.load(f))).catch(() => {});
  return fontsReady;
}

async function buildPack(st, key) {
  await loadFonts();
  const sty = STYLES[key];
  const emotes = [];
  for (const [k, e] of EMOTES.entries()) {
    const img = await loadSVG(charSVG(e.expr, st, sty, 448));
    if (sty.pixel) {
      const base = pixelBase(img, 28);
      emotes.push({ name: st.emoteNames[k], sizes: { 112: drawScaled(base, 112, false), 56: drawScaled(base, 56, false), 28: base } });
    } else {
      emotes.push({ name: st.emoteNames[k], sizes: { 112: drawScaled(img, 112), 56: drawScaled(img, 56), 28: drawScaled(img, 28) } });
    }
  }
  const badges = [];
  for (const [i, label] of TIERS.entries()) {
    const img = await loadSVG(badgeSVG(i, st, sty));
    if (sty.pixel) {
      const base = pixelBase(img, 18);
      badges.push({ label, sizes: { 72: drawScaled(base, 72, false), 36: drawScaled(base, 36, false), 18: base } });
    } else {
      badges.push({ label, sizes: { 72: drawScaled(img, 72), 36: drawScaled(img, 36), 18: drawScaled(img, 18) } });
    }
  }
  const banner = drawBanner(st, sty, await charArt('happy', st, sty, 860, 64));
  const panels = [];
  for (const [i, p] of PANELS.entries()) panels.push({ title: st.panelTitles[i], canvas: drawPanel(st, sty, st.panelTitles[i], await charArt(p.expr, st, sty, 240, 23), i) });
  const pause = drawPause(st, sty, await charArt('dodo', st, sty, 900, 80));
  const logos = drawLogos(st, sty, await charArt('happy', st, sty, 900, 56));
  return { emotes, badges, banner, panels, pause, logos };
}

/* ---------- Aperçu ---------- */
function cell(bigCanvas, minis, label) {
  const d = document.createElement('div'); d.className = 'cell';
  const b = document.createElement('div'); b.className = 'big check'; b.append(bigCanvas);
  const m = document.createElement('div'); m.className = 'minis'; m.append(...minis);
  const t = document.createElement('b'); t.textContent = label;
  d.append(b, m, t); return d;
}
let renderId = 0;
async function render() {
  const id = ++renderId;
  const st = getState();
  $('#pvLoading').hidden = false;
  try {
    const A = await buildPack(st, st.pvStyle);
    if (id !== renderId) return;
    $('#pvBanner').replaceChildren(A.banner);
    $('#pvEmotes').replaceChildren(...A.emotes.map(e => cell(e.sizes[112], [e.sizes[56], e.sizes[28]], e.name)));
    $('#pvBadges').replaceChildren(...A.badges.map(b => cell(b.sizes[72], [b.sizes[36], b.sizes[18]], b.label)));
    $('#pvPanels').replaceChildren(...A.panels.map(p => p.canvas));
    $('#pvPause').replaceChildren(A.pause);
    $('#pvLogos').replaceChildren(...A.logos.map(l => { const d = document.createElement('div'); d.className = 'logo-cell check' + (l.name === 'horizontal' ? ' wide' : ''); d.append(l.canvas); const t = document.createElement('b'); t.textContent = l.name; d.append(t); return d; }));
    $$('.name-row canvas').forEach((cv, k) => { const x = cv.getContext('2d'); x.clearRect(0, 0, 28, 28); x.drawImage(A.emotes[k].sizes[28], 0, 0); });
    $('#status').textContent = '';
  } catch (err) {
    console.error(err);
    $('#status').textContent = 'Erreur d\'aperçu : ' + err.message;
  } finally {
    if (id === renderId) $('#pvLoading').hidden = true;
  }
}
let timer;
const scheduleRender = () => { clearTimeout(timer); timer = setTimeout(render, 250); };

/* ---------- ZIP avec tous les styles ---------- */
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'fichier';
const toBlob = c => new Promise(r => c.toBlob(r, 'image/png'));

function readme(st, keys) {
  return `PACKS TWITCH — ${st.pseudo}

Ce ZIP contient le pack complet dans ${keys.length} style(s) :
${keys.map(k => `- ${STYLES[k].folder}/  (${STYLES[k].label})`).join('\n')}

Le client choisit son style préféré et n'installe QUE le dossier de ce style.

DANS CHAQUE DOSSIER
- banniere.png ......... bannière de profil (1200 x 480)
- panneaux/ ............ panneaux de la page « À propos » (320 x 100)
- emotes/112px, 56px, 28px ... emotes aux 3 tailles Twitch
- badges/ .............. badges d'abonné (72, 36, 18 px)
- ecran-pause.png ...... écran pause pour OBS (1920 x 1080)
- logos/ ............... 6 logos de chaîne (PNG transparent) : photo de profil, réseaux, overlays

INSTALLATION
1. Bannière : Tableau de bord des créateurs > Paramètres > Chaîne > Image de marque > Bannière de profil.
2. Panneaux : ta chaîne > onglet « À propos » > activer « Modifier les panneaux » > + > Ajouter une image.
3. Emotes : Tableau de bord des créateurs > Récompenses des spectateurs > Emotes. Envoie le fichier 112 px
   (Twitch crée les autres tailles) ou les 3 tailles.
4. Badges : Tableau de bord des créateurs > Récompenses des spectateurs > Badges > Badges d'abonné.
5. Écran pause : OBS Studio > nouvelle scène « Pause » > Sources > + > Image > ecran-pause.png.

Les noms de menus Twitch peuvent changer. Les emplacements d'emotes et les badges d'abonné
dépendent du statut de la chaîne (Affilié, Partenaire).
`;
}

async function downloadZip() {
  const btn = $('#dl');
  if (typeof JSZip === 'undefined') { $('#status').textContent = 'La bibliothèque ZIP ne s\'est pas chargée. Vérifie ta connexion et recharge la page.'; return; }
  const st = getState();
  if (!st.zipStyles.length) { $('#status').textContent = 'Coche au moins un style à mettre dans le ZIP.'; return; }
  btn.disabled = true;
  try {
    const zip = new JSZip();
    for (const [n, key] of st.zipStyles.entries()) {
      $('#status').textContent = `Création du style ${n + 1}/${st.zipStyles.length} : ${STYLES[key].label}…`;
      const A = await buildPack(st, key);
      const dir = zip.folder(STYLES[key].folder);
      for (const e of A.emotes) for (const s of [112, 56, 28]) dir.file(`emotes/${s}px/${e.name}.png`, await toBlob(e.sizes[s]));
      for (const [i, b] of A.badges.entries()) for (const s of [72, 36, 18]) dir.file(`badges/${i + 1}-${slug(b.label)}_${s}px.png`, await toBlob(b.sizes[s]));
      dir.file('banniere.png', await toBlob(A.banner));
      for (const [i, p] of A.panels.entries()) dir.file(`panneaux/${i + 1}-${slug(p.title)}.png`, await toBlob(p.canvas));
      dir.file('ecran-pause.png', await toBlob(A.pause));
      for (const [i, l] of A.logos.entries()) dir.file(`logos/${i + 1}-${l.name}.png`, await toBlob(l.canvas));
    }
    zip.file('LISEZMOI.txt', readme(st, st.zipStyles));
    $('#status').textContent = 'Compression du ZIP…';
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `packs-twitch-${slug(st.pseudo)}.zip`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    $('#status').textContent = `Packs téléchargés : ${a.download} (${st.zipStyles.length} styles)`;
  } catch (err) {
    console.error(err);
    $('#status').textContent = 'Erreur pendant la création du ZIP : ' + err.message;
  } finally { btn.disabled = false; }
}

/* ---------- Image du client ---------- */
function handleUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 600, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = newCanvas(Math.round(img.width * k), Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      uploadedImg = c.toDataURL('image/png');
      $('#uploadInfo').textContent = file.type === 'image/jpeg'
        ? 'Image chargée. Attention : un JPG n\'a pas de fond transparent.'
        : `Image chargée (${img.width} × ${img.height}).`;
      scheduleRender();
    };
    img.onerror = () => { $('#uploadInfo').textContent = 'Impossible de lire cette image.'; };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- Démarrage ---------- */
function init() {
  $('#emoteNames').innerHTML = EMOTES.map((e, k) =>
    `<div class="name-row"><canvas width="28" height="28" aria-hidden="true"></canvas><input type="text" class="emote-name" id="em${k}" value="${e.name}" maxlength="20" aria-label="Nom de l'emote ${k + 1}"></div>`).join('');
  $('#panelNames').innerHTML = PANELS.map((p, k) =>
    `<input type="text" class="panel-title" id="pn${k}" value="${p.title}" maxlength="22" aria-label="Titre du panneau ${k + 1}">`).join('');
  $('#zipStyles').innerHTML = STYLE_KEYS.map(k =>
    `<label><input type="checkbox" name="zipStyle" value="${k}" checked><span>${STYLES[k].label}</span></label>`).join('');
  $('#pvTabs').innerHTML = STYLE_KEYS.map((k, i) =>
    `<label><input type="radio" name="pvStyle" value="${k}"${i === 0 ? ' checked' : ''}><span>${STYLES[k].label}</span></label>`).join('');

  const syncMode = () => {
    const img = $('input[name=mode]:checked').value === 'image';
    $('#animalFields').hidden = img; $('#imageFields').hidden = !img;
    const n = $$('input[name=zipStyle]:checked').length;
    $('#dl').textContent = n > 1 ? `Télécharger les ${n} packs (ZIP)` : 'Télécharger le pack (ZIP)';
  };
  const onChange = e => { syncMode(); if (e && e.target && e.target.name === 'zipStyle') return; scheduleRender(); };
  $('#form').addEventListener('input', onChange);
  $('#form').addEventListener('change', onChange);
  $('#pvTabs').addEventListener('change', () => render());
  $('#upload').addEventListener('change', e => handleUpload(e.target.files[0]));
  $('#dl').addEventListener('click', downloadZip);
  syncMode();
  render();
}
init();
