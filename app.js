/* Pack Twitch Studio — génère un pack Twitch (PNG) à partir des infos du formulaire */

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
function shade(hex, amt) {
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const [r, g, b] = hexToRgb(hex).map(v => Math.round((t - v) * p + v));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const textOn = hex => lum(hex) > 0.4 ? '#1a1420' : '#ffffff';

/* ---------- Dessins SVG ---------- */
const heart = (x, y, s, fill) => `<path d="M${x} ${y + s * .9} C${x - s * 1.6} ${y - s * .2} ${x - s * .6} ${y - s * 1.3} ${x} ${y - s * .4} C${x + s * .6} ${y - s * 1.3} ${x + s * 1.6} ${y - s * .2} ${x} ${y + s * .9}Z" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
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

/* Effets autour de l'image du client (pas de vraies expressions possibles) */
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

function charSVG(expr, st, px = 240) {
  let inner;
  if (st.mode === 'image' && st.img) {
    inner = `<image href="${st.img}" x="6" y="6" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>${imageFx(expr)}`;
  } else {
    const P = { fur: st.fur, furD: shade(st.fur, -0.25), belly: st.belly };
    const A = ANIMALS[st.animal](P);
    const E = expressions(P)[expr];
    const cheeks = E.cheeks ?? `<ellipse cx="30" cy="78" rx="10" ry="7" fill="${PINK}" opacity=".75"/><ellipse cx="90" cy="78" rx="10" ry="7" fill="${PINK}" opacity=".75"/>`;
    inner = `${A.back || ''}${headParts(P)}${A.mask || ''}${cheeks}${A.front || ''}${A.tuft || ''}${A.nose}${E.face}${A.top || ''}${E.fx || ''}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 136 136" width="${px}" height="${px}">${inner}</svg>`;
}

function badgeSVG(i, st) {
  const fills = [st.sec, st.accent, st.accent, '#d7deea', '#ffc84a', '#ffc84a'];
  const f = fills[i];
  const dy = i === 5 ? 6 : 0;
  let g = '';
  if (i === 2 || i === 3) g += `<circle cx="36" cy="38" r="32" fill="none" stroke="${i === 2 ? st.sec : '#d7deea'}" stroke-width="4" stroke-dasharray="6 5"/>`;
  g += `<g transform="translate(0 ${dy})">
    <path d="M36 32 C48 32 57 44 55 52 C53 60 44 58 36 58 C28 58 19 60 17 52 C15 44 24 32 36 32Z" fill="${f}" ${S}/>
    <ellipse cx="17" cy="30" rx="6.5" ry="8.5" transform="rotate(-20 17 30)" fill="${f}" ${S}/>
    <ellipse cx="29" cy="19" rx="6.5" ry="8.5" transform="rotate(-6 29 19)" fill="${f}" ${S}/>
    <ellipse cx="43" cy="19" rx="6.5" ry="8.5" transform="rotate(6 43 19)" fill="${f}" ${S}/>
    <ellipse cx="55" cy="30" rx="6.5" ry="8.5" transform="rotate(20 55 30)" fill="${f}" ${S}/>
    <path d="M27 42 Q31 37 36 37" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  if (i === 5) g += `<path d="M22 14 L25 0 L36 9 L47 0 L50 14Z" fill="#ffc84a" ${S}/><circle cx="36" cy="9" r="2.5" fill="#ff7a9c"/>`;
  if (i >= 4) g += star(62, 14, 8) + star(9, 52, 5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -4 76 76" width="144" height="144">${g}</svg>`;
}

/* ---------- Rendu canvas ---------- */
function loadSVG(svg) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Image SVG illisible'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function drawScaled(img, size) {
  const c = newCanvas(size, size), x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, size, size);
  return c;
}
function rrect(x, X, Y, W, H, r) {
  x.beginPath();
  if (x.roundRect) { x.roundRect(X, Y, W, H, r); return; }
  x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r);
  x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath();
}
function fitFont(x, text, family, weight, max, min, width) {
  let size = max;
  do { x.font = `${weight} ${size}px ${family}`; if (x.measureText(text).width <= width) break; size -= 2; } while (size > min);
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
const DISPLAY = '"Bagel Fat One", "Arial Black", sans-serif';
const BODY = 'Nunito, Arial, sans-serif';

function drawBanner(st, charImg) {
  const W = 1200, H = 480, c = newCanvas(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, st.bg); g.addColorStop(1, shade(st.bg, -0.4));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  dots(x, W, H, rgba(st.accent, 0.1), 36, 3);
  x.save(); x.translate(860, 470); x.rotate(-0.32);
  x.fillStyle = st.sec; x.fillRect(-700, -80, 1600, 64);
  x.fillStyle = st.accent; x.fillRect(-700, -6, 1600, 12);
  x.restore();
  x.drawImage(charImg, 770, 40, 430, 430);

  const left = 64, maxW = 660;
  x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
  const size = fitFont(x, st.pseudo, DISPLAY, 400, 130, 44, maxW);
  x.lineWidth = Math.max(6, size / 12); x.strokeStyle = '#1a1420';
  const titleY = 220;
  x.strokeText(st.pseudo, left, titleY); x.fillStyle = st.accent; x.fillText(st.pseudo, left, titleY);

  x.font = `700 30px ${BODY}`; x.fillStyle = textOn(st.bg);
  wrap(x, st.slogan, maxW, 2).forEach((ln, i) => x.fillText(ln, left, titleY + 54 + i * 38));

  const chips = [...st.days, st.heure].filter(Boolean);
  let cx = left; const cy = titleY + 140;
  x.font = `800 24px ${BODY}`;
  chips.forEach(t => {
    const w = x.measureText(t).width + 32;
    rrect(x, cx, cy, w, 44, 22); x.fillStyle = st.sec; x.fill();
    x.fillStyle = textOn(st.sec); x.fillText(t, cx + 16, cy + 30);
    cx += w + 10;
  });
  return c;
}

function drawPanel(st, title, img, i) {
  const W = 320, H = 100, c = newCanvas(W, H), x = c.getContext('2d');
  const bg = i % 2 ? st.sec : st.accent;
  rrect(x, 0, 0, W, H, 14); x.fillStyle = bg; x.fill();
  x.save(); rrect(x, 0, 0, W, H, 14); x.clip();
  x.strokeStyle = rgba('#000000', 0.18); x.lineWidth = 6; x.setLineDash([2, 10]); x.lineCap = 'round';
  x.beginPath(); x.arc(W - 10, 10, 40, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
  x.restore();
  x.drawImage(img, 4, 2, 96, 96);
  x.fillStyle = textOn(bg); x.textBaseline = 'middle';
  fitFont(x, title, DISPLAY, 400, 34, 14, W - 118);
  x.fillText(title, 108, H / 2 + 2);
  return c;
}

function drawPause(st, charImg) {
  const W = 1920, H = 1080, c = newCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(1400, 760, 50, 1400, 760, 1300); g.addColorStop(0, shade(st.bg, 0.12)); g.addColorStop(1, shade(st.bg, -0.35));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  dots(x, W, H, rgba(st.accent, 0.12), 64, 5);
  x.drawImage(charImg, 1080, 260, 800, 800);

  const left = 120; x.lineJoin = 'round';
  x.font = `800 40px ${BODY}`; x.fillStyle = st.sec;
  x.fillText(st.pseudo.toUpperCase() + ' · LE STREAM REPREND BIENTÔT', left, 360);
  x.font = `400 300px ${DISPLAY}`;
  x.lineWidth = 22; x.strokeStyle = '#1a1420';
  x.strokeText('PAUSE', left, 640); x.fillStyle = st.accent; x.fillText('PAUSE', left, 640);
  x.font = `700 58px ${BODY}`; x.fillStyle = textOn(st.bg);
  wrap(x, st.pauseText, 900, 2).forEach((ln, i) => x.fillText(ln, left, 740 + i * 72));
  [0.35, 0.55, 0.75, 0.9, 1].forEach((a, i) => { x.beginPath(); x.arc(left + 24 + i * 70, 900, 20, 0, Math.PI * 2); x.fillStyle = rgba(st.accent, a); x.fill(); });
  return c;
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
    panelTitles: $$('.panel-title').map((i, k) => i.value.trim() || PANELS[k].title)
  };
}

/* ---------- Génération complète ---------- */
async function buildAll(st) {
  await Promise.all([
    document.fonts.load(`400 80px "Bagel Fat One"`),
    document.fonts.load(`700 30px Nunito`),
    document.fonts.load(`800 30px Nunito`)
  ]).catch(() => {});

  const emotes = [];
  for (const [k, e] of EMOTES.entries()) {
    const img = await loadSVG(charSVG(e.expr, st, 448));
    emotes.push({ name: st.emoteNames[k], sizes: { 112: drawScaled(img, 112), 56: drawScaled(img, 56), 28: drawScaled(img, 28) } });
  }
  const badges = [];
  for (const [i, label] of TIERS.entries()) {
    const img = await loadSVG(badgeSVG(i, st));
    badges.push({ label, sizes: { 72: drawScaled(img, 72), 36: drawScaled(img, 36), 18: drawScaled(img, 18) } });
  }
  const big = expr => loadSVG(charSVG(expr, st, 900));
  const banner = drawBanner(st, await big('happy'));
  const panels = [];
  for (const [i, p] of PANELS.entries()) panels.push({ title: st.panelTitles[i], canvas: drawPanel(st, st.panelTitles[i], await loadSVG(charSVG(p.expr, st, 240)), i) });
  const pause = drawPause(st, await big('dodo'));
  return { emotes, badges, banner, panels, pause };
}

/* ---------- Aperçu ---------- */
function show(container, canvas) { container.replaceChildren(canvas); }
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
  try {
    const A = await buildAll(st);
    if (id !== renderId) return;
    show($('#pvBanner'), A.banner);
    $('#pvEmotes').replaceChildren(...A.emotes.map(e => cell(e.sizes[112], [e.sizes[56], e.sizes[28]], e.name)));
    $('#pvBadges').replaceChildren(...A.badges.map(b => cell(b.sizes[72], [b.sizes[36], b.sizes[18]], b.label)));
    $('#pvPanels').replaceChildren(...A.panels.map(p => p.canvas));
    show($('#pvPause'), A.pause);
    $$('.name-row canvas').forEach((cv, k) => { const x = cv.getContext('2d'); x.clearRect(0, 0, 28, 28); x.drawImage(A.emotes[k].sizes[28], 0, 0); });
    $('#status').textContent = '';
  } catch (err) {
    console.error(err);
    $('#status').textContent = 'Erreur d\'aperçu : ' + err.message;
  }
}
let timer;
const scheduleRender = () => { clearTimeout(timer); timer = setTimeout(render, 250); };

/* ---------- ZIP ---------- */
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'fichier';
const toBlob = c => new Promise(r => c.toBlob(r, 'image/png'));

function readme(st) {
  return `PACK TWITCH — ${st.pseudo}

CONTENU
- banniere.png ......... bannière de profil (1200 x 480)
- panneaux/ ............ panneaux de la page « À propos » (320 x 100)
- emotes/112px, 56px, 28px ... emotes aux 3 tailles Twitch
- badges/ .............. badges d'abonné (72, 36, 18 px)
- ecran-pause.png ...... écran pause pour OBS (1920 x 1080)

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
  btn.disabled = true; $('#status').textContent = 'Création du pack…';
  try {
    const st = getState();
    const A = await buildAll(st);
    const zip = new JSZip();
    for (const e of A.emotes) for (const s of [112, 56, 28]) zip.file(`emotes/${s}px/${e.name}.png`, await toBlob(e.sizes[s]));
    for (const [i, b] of A.badges.entries()) for (const s of [72, 36, 18]) zip.file(`badges/${i + 1}-${slug(b.label)}_${s}px.png`, await toBlob(b.sizes[s]));
    zip.file('banniere.png', await toBlob(A.banner));
    for (const [i, p] of A.panels.entries()) zip.file(`panneaux/${i + 1}-${slug(p.title)}.png`, await toBlob(p.canvas));
    zip.file('ecran-pause.png', await toBlob(A.pause));
    zip.file('LISEZMOI.txt', readme(st));
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pack-twitch-${slug(st.pseudo)}.zip`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    $('#status').textContent = `Pack téléchargé : ${a.download}`;
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

  const syncMode = () => {
    const img = $('input[name=mode]:checked').value === 'image';
    $('#animalFields').hidden = img; $('#imageFields').hidden = !img;
  };
  $('#form').addEventListener('input', () => { syncMode(); scheduleRender(); });
  $('#form').addEventListener('change', () => { syncMode(); scheduleRender(); });
  $('#upload').addEventListener('change', e => handleUpload(e.target.files[0]));
  $('#dl').addEventListener('click', downloadZip);
  syncMode();
  render();
}
init();
