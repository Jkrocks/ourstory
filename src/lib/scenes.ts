// Painted placeholder "photographs" for the demo family, drawn as SVG.
// Every scene is deterministic from its name + seed, so the album looks the same on every visit.

type Rng = () => number;
const mk = (seed: number): Rng => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s % 10000) / 10000;
  };
};
const pick = <T,>(r: Rng, a: T[]) => a[Math.floor(r() * a.length)];

const SKIES: Record<string, [string, string, string]> = {
  morning: ['#bcd6e6', '#e9e1cf', '#f7d9b0'],
  day: ['#8fbfdc', '#bfdbe6', '#eee6d2'],
  golden: ['#f1b37a', '#f6cf93', '#fbe7c0'],
  dusk: ['#5d5a86', '#c9818a', '#f3b787'],
  night: ['#1c2140', '#33365a', '#5b4d63'],
  blue: ['#6d8bb0', '#a9bcd0', '#dfe4e6'],
};

const CLOTHES = ['#c95a4a', '#3f6f8f', '#e0a43c', '#6e8f5a', '#8e5a7e', '#2f4f5f', '#d9825b', '#f2efe6'];
const SKIN = ['#8a5a3c', '#a86e4a', '#6f4630', '#b98260'];

function sky(w: number, h: number, key: keyof typeof SKIES, id: string) {
  const [a, b, c] = SKIES[key];
  return `<defs><linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#s${id})"/>`;
}

function person(r: Rng, x: number, ground: number, height: number, dark = false) {
  const skin = pick(r, SKIN);
  const cloth = dark ? '#2b2530' : pick(r, CLOTHES);
  const head = height * 0.16;
  const bodyW = height * 0.32;
  const bodyH = height * 0.46;
  const legH = height * 0.36;
  const top = ground - height;
  const hair = dark ? '#1e1a22' : pick(r, ['#221a16', '#3a2a20', '#1b1512', '#5a4632']);
  return `<g opacity="${dark ? 0.92 : 1}">
    <rect x="${x - bodyW * 0.32}" y="${ground - legH}" width="${bodyW * 0.26}" height="${legH}" rx="${bodyW * 0.12}" fill="${dark ? cloth : '#2f3440'}"/>
    <rect x="${x + bodyW * 0.06}" y="${ground - legH}" width="${bodyW * 0.26}" height="${legH}" rx="${bodyW * 0.12}" fill="${dark ? cloth : '#2f3440'}"/>
    <rect x="${x - bodyW / 2}" y="${top + head * 2}" width="${bodyW}" height="${bodyH}" rx="${bodyW * 0.38}" fill="${cloth}"/>
    <circle cx="${x}" cy="${top + head}" r="${head}" fill="${dark ? cloth : skin}"/>
    <path d="M${x - head} ${top + head} a${head} ${head} 0 0 1 ${head * 2} 0 q-${head} -${head * 0.35} -${head * 2} 0z" fill="${hair}"/>
  </g>`;
}

function family(r: Rng, cx: number, ground: number, scale: number, dark = false, n = 4) {
  const hs = [1, 0.94, 0.62, 0.48, 0.3].slice(0, n);
  let x = cx - (n - 1) * scale * 0.2;
  return hs.map((f) => {
    const g = person(r, x, ground, scale * f, dark);
    x += scale * 0.4;
    return g;
  }).join('');
}

function sun(x: number, y: number, rad: number, color: string, glow = 0.35) {
  return `<circle cx="${x}" cy="${y}" r="${rad * 2.4}" fill="${color}" opacity="${glow * 0.35}"/><circle cx="${x}" cy="${y}" r="${rad * 1.5}" fill="${color}" opacity="${glow * 0.6}"/><circle cx="${x}" cy="${y}" r="${rad}" fill="${color}"/>`;
}

function hills(w: number, h: number, base: number, amp: number, color: string, r: Rng, op = 1) {
  const pts: string[] = [`M0 ${h}`, `L0 ${base}`];
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const x = (w / steps) * i;
    const y = base - amp * (0.3 + r() * 0.7);
    pts.push(`Q${x - w / steps / 2} ${y - amp * 0.4} ${x} ${base - amp * r() * 0.5}`);
    void y;
  }
  pts.push(`L${w} ${h}Z`);
  return `<path d="${pts.join(' ')}" fill="${color}" opacity="${op}"/>`;
}

function tree(x: number, ground: number, s: number, c: string, trunk = '#5b4332') {
  return `<rect x="${x - s * 0.06}" y="${ground - s * 0.55}" width="${s * 0.12}" height="${s * 0.55}" fill="${trunk}"/><circle cx="${x}" cy="${ground - s * 0.72}" r="${s * 0.34}" fill="${c}"/><circle cx="${x - s * 0.22}" cy="${ground - s * 0.56}" r="${s * 0.24}" fill="${c}"/><circle cx="${x + s * 0.22}" cy="${ground - s * 0.58}" r="${s * 0.26}" fill="${c}"/>`;
}

function bokeh(r: Rng, w: number, h: number, n: number, colors: string[]) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const rad = 10 + r() * 46;
    s += `<circle cx="${r() * w}" cy="${r() * h * 0.7}" r="${rad}" fill="${pick(r, colors)}" opacity="${0.12 + r() * 0.3}"/>`;
  }
  return s;
}

type Painter = (r: Rng, w: number, h: number, id: string) => string;

const painters: Record<string, Painter> = {
  beach: (r, w, h, id) => {
    const horizon = h * 0.52;
    return sky(w, h, pick(r, ['golden', 'day', 'morning']) as 'golden', id) +
      sun(w * (0.25 + r() * 0.5), horizon - h * 0.14, h * 0.07, '#fff3d6', 0.5) +
      `<rect y="${horizon}" width="${w}" height="${h * 0.2}" fill="#5f9fb3"/>
       <rect y="${horizon + h * 0.03}" width="${w}" height="${h * 0.02}" fill="#8cc0cc" opacity=".6"/>
       <rect y="${horizon + h * 0.1}" width="${w}" height="${h * 0.015}" fill="#9fd0d6" opacity=".5"/>
       <path d="M0 ${horizon + h * 0.2} Q${w * 0.5} ${horizon + h * 0.14} ${w} ${horizon + h * 0.22} L${w} ${h} L0 ${h}Z" fill="#e8d2a6"/>
       <path d="M0 ${horizon + h * 0.2} Q${w * 0.5} ${horizon + h * 0.16} ${w} ${horizon + h * 0.22}" stroke="#fffaf0" stroke-width="${h * 0.012}" fill="none" opacity=".8"/>` +
      family(r, w * (0.3 + r() * 0.35), h * 0.9, h * 0.34, false, 3 + Math.floor(r() * 3));
  },
  mountains: (r, w, h, id) =>
    sky(w, h, pick(r, ['morning', 'blue', 'golden']) as 'morning', id) +
    sun(w * 0.72, h * 0.22, h * 0.05, '#fff5e0', 0.4) +
    hills(w, h, h * 0.45, h * 0.2, '#8d9bb5', r, 0.8) +
    hills(w, h, h * 0.58, h * 0.18, '#6f8a8a', r) +
    hills(w, h, h * 0.72, h * 0.14, '#557a5c', r) +
    tree(w * 0.12, h * 0.86, h * 0.26, '#3f6647') + tree(w * 0.88, h * 0.9, h * 0.3, '#3b5f43') +
    family(r, w * 0.5, h * 0.95, h * 0.3, false, 4),
  home: (r, w, h, id) => {
    const g = h * 0.8;
    const hx = w * 0.5 - w * 0.2;
    const lit = '#ffd98a';
    return sky(w, h, 'dusk', id) +
      `<rect y="${g}" width="${w}" height="${h - g}" fill="#4f5e4a"/>
       <rect x="${hx}" y="${g - h * 0.34}" width="${w * 0.4}" height="${h * 0.34}" fill="#e9dcc6"/>
       <path d="M${hx - w * 0.04} ${g - h * 0.33} L${w * 0.5} ${g - h * 0.56} L${hx + w * 0.44} ${g - h * 0.33}Z" fill="#8a4e3e"/>
       <rect x="${hx + w * 0.05}" y="${g - h * 0.26}" width="${w * 0.08}" height="${h * 0.1}" fill="${lit}"/>
       <rect x="${hx + w * 0.27}" y="${g - h * 0.26}" width="${w * 0.08}" height="${h * 0.1}" fill="${lit}"/>
       <rect x="${hx + w * 0.16}" y="${g - h * 0.18}" width="${w * 0.08}" height="${h * 0.18}" fill="#6a4535"/>
       <circle cx="${hx + w * 0.22}" cy="${g - h * 0.09}" r="${h * 0.006}" fill="${lit}"/>
       <path d="M${w * 0.5} ${h} L${w * 0.47} ${g} L${w * 0.53} ${g} Z" fill="#c9b99c" opacity=".6"/>` +
      tree(w * 0.1, g + 4, h * 0.44, '#34503a') + tree(w * 0.88, g + 4, h * 0.36, '#2e4a35') +
      family(r, w * 0.5, h * 0.98, h * 0.16, false, 4);
  },
  birthday: (r, w, h, id) => {
    const cx = w * 0.5;
    const base = h * 0.82;
    const cw = w * 0.36;
    let candles = '';
    const n = 1 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const x = cx - cw * 0.3 + (cw * 0.6 * (i + 0.5)) / n;
      candles += `<rect x="${x - 5}" y="${base - h * 0.44}" width="10" height="${h * 0.08}" rx="3" fill="${pick(r, ['#f4a3a8', '#9fc5e8', '#fbe29a', '#b6d7a8'])}"/>
        <circle cx="${x}" cy="${base - h * 0.46}" r="${h * 0.05}" fill="#ffcf6b" opacity=".25"/>
        <ellipse cx="${x}" cy="${base - h * 0.46}" rx="7" ry="13" fill="#ffd36e"/>`;
    }
    let flags = '';
    for (let i = 0; i < 9; i++) {
      const x = (w / 9) * i + w / 18;
      const y = h * 0.1 + Math.sin((i / 8) * Math.PI) * h * 0.08;
      flags += `<path d="M${x - 24} ${y} L${x + 24} ${y} L${x} ${y + 46}Z" fill="${pick(r, ['#f2b898', '#f0c865', '#9db59a', '#e6798a', '#9fb9d6'])}"/>`;
    }
    return `<rect width="${w}" height="${h}" fill="#3b2b2a"/>` + bokeh(r, w, h, 26, ['#ffcf8a', '#f6a57f', '#ffe4b0']) +
      `<path d="M0 ${h * 0.1} Q${w / 2} ${h * 0.26} ${w} ${h * 0.1}" stroke="#e8d7bf" stroke-width="2" fill="none"/>` + flags +
      `<rect y="${base}" width="${w}" height="${h - base}" fill="#6b4a3b"/>
       <ellipse cx="${cx}" cy="${base}" rx="${cw * 0.75}" ry="${h * 0.03}" fill="#efe6da"/>
       <rect x="${cx - cw / 2}" y="${base - h * 0.2}" width="${cw}" height="${h * 0.2}" rx="10" fill="#f7e6d4"/>
       <rect x="${cx - cw * 0.38}" y="${base - h * 0.36}" width="${cw * 0.76}" height="${h * 0.17}" rx="10" fill="#f4c9cf"/>
       <path d="M${cx - cw / 2} ${base - h * 0.16} q${cw * 0.125} ${h * 0.05} ${cw * 0.25} 0 t${cw * 0.25} 0 t${cw * 0.25} 0 t${cw * 0.25} 0" stroke="#e98b9b" stroke-width="10" fill="none"/>` + candles;
  },
  festival: (r, w, h, id) => {
    let diyas = '';
    const rows = 2;
    for (let j = 0; j < rows; j++) {
      const n = 6 + j * 2;
      for (let i = 0; i < n; i++) {
        const x = (w / n) * (i + 0.5);
        const y = h * (0.7 + j * 0.14);
        const s = h * (0.035 + j * 0.012);
        diyas += `<circle cx="${x}" cy="${y - s * 1.6}" r="${s * 3}" fill="#ffb347" opacity=".14"/>
          <path d="M${x - s * 1.6} ${y - s * 0.4} Q${x} ${y + s * 1.2} ${x + s * 1.6} ${y - s * 0.4}Z" fill="#b5532f"/>
          <path d="M${x} ${y - s * 2.4} q${s * 0.6} ${s * 1} 0 ${s * 1.8} q-${s * 0.6} -${s * 0.8} 0 -${s * 1.8}" fill="#ffd25e"/>`;
      }
    }
    let lights = '';
    for (let k = 0; k < 3; k++) {
      const y0 = h * (0.08 + k * 0.12);
      for (let i = 0; i < 16; i++) {
        const x = (w / 16) * (i + 0.5);
        const y = y0 + Math.sin((i / 15) * Math.PI) * h * 0.06;
        lights += `<circle cx="${x}" cy="${y}" r="${h * 0.012}" fill="${pick(r, ['#ffd98a', '#ffb4a2', '#fff1c1'])}"/><circle cx="${x}" cy="${y}" r="${h * 0.03}" fill="#ffd98a" opacity=".15"/>`;
      }
    }
    return sky(w, h, 'night', id) + bokeh(r, w, h, 14, ['#ffcf8a', '#ff9e7a']) + lights +
      `<rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="#3a2530"/>
       <circle cx="${w / 2}" cy="${h * 0.92}" r="${h * 0.2}" fill="none" stroke="#e7a13d" stroke-width="10" opacity=".5"/>
       <circle cx="${w / 2}" cy="${h * 0.92}" r="${h * 0.13}" fill="none" stroke="#d9546a" stroke-width="10" opacity=".5" stroke-dasharray="18 12"/>` + diyas;
  },
  wedding: (r, w, h, id) => {
    let strands = '';
    for (let i = 0; i < 14; i++) {
      const x = (w / 14) * (i + 0.5);
      const len = h * (0.25 + r() * 0.3);
      for (let y = 0; y < len; y += h * 0.028) {
        strands += `<circle cx="${x + Math.sin(y / 40) * 3}" cy="${y}" r="${h * 0.017}" fill="${y % 3 < 1.5 ? '#f29b2e' : '#f6c33b'}"/>`;
      }
    }
    return `<rect width="${w}" height="${h}" fill="#f3d9c4"/>` + bokeh(r, w, h, 18, ['#fff4dc', '#ffd1a8']) +
      `<path d="M${w * 0.2} ${h} L${w * 0.2} ${h * 0.45} Q${w * 0.5} ${h * 0.2} ${w * 0.8} ${h * 0.45} L${w * 0.8} ${h}" fill="none" stroke="#b33b4b" stroke-width="${w * 0.03}"/>
       <rect y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="#c9a27e"/>` + strands +
      person(r, w * 0.43, h * 0.93, h * 0.5) + person(r, w * 0.57, h * 0.93, h * 0.47);
  },
  nursery: (r, w, h, id) => {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      const x = w * (0.3 + i * 0.1);
      const y = h * (0.2 + (i % 2) * 0.08);
      stars += `<line x1="${x}" y1="${h * 0.08}" x2="${x}" y2="${y}" stroke="#b8a896" stroke-width="2"/><circle cx="${x}" cy="${y + 14}" r="16" fill="${pick(r, ['#f6d27a', '#f2b8a0', '#a9c7b2', '#b9c6e4'])}"/>`;
    }
    let bars = '';
    for (let i = 0; i < 12; i++) bars += `<rect x="${w * 0.12 + i * w * 0.066}" y="${h * 0.46}" width="${w * 0.018}" height="${h * 0.36}" rx="6" fill="#f5efe6"/>`;
    return sky(w, h, 'morning', id) +
      `<rect width="${w}" height="${h}" fill="#f4e6de" opacity=".7"/>
       <rect x="${w * 0.6}" y="${h * 0.1}" width="${w * 0.28}" height="${h * 0.3}" rx="8" fill="#fff8e8"/>
       <line x1="${w * 0.74}" y1="${h * 0.1}" x2="${w * 0.74}" y2="${h * 0.4}" stroke="#e6d6bf" stroke-width="6"/>
       <line x1="${w * 0.08}" y1="${h * 0.08}" x2="${w * 0.72}" y2="${h * 0.08}" stroke="#b8a896" stroke-width="3"/>` + stars +
      `<rect x="${w * 0.1}" y="${h * 0.44}" width="${w * 0.8}" height="${h * 0.04}" rx="8" fill="#efe4d6"/>` + bars +
      `<rect x="${w * 0.1}" y="${h * 0.8}" width="${w * 0.8}" height="${h * 0.05}" rx="8" fill="#efe4d6"/>
       <ellipse cx="${w * 0.5}" cy="${h * 0.78}" rx="${w * 0.3}" ry="${h * 0.05}" fill="#bcd3e0"/>
       <rect y="${h * 0.9}" width="${w}" height="${h * 0.1}" fill="#d9c3ad"/>`;
  },
  park: (r, w, h, id) => {
    const kx = w * (0.2 + r() * 0.5);
    return sky(w, h, 'day', id) +
      `<circle cx="${w * 0.2}" cy="${h * 0.2}" r="${h * 0.06}" fill="#fff" opacity=".7"/><circle cx="${w * 0.26}" cy="${h * 0.19}" r="${h * 0.08}" fill="#fff" opacity=".7"/>` +
      hills(w, h, h * 0.66, h * 0.08, '#9cc08a', r) + `<rect y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="#86b06f"/>` +
      tree(w * 0.1, h * 0.74, h * 0.4, '#5f8f55') + tree(w * 0.84, h * 0.74, h * 0.46, '#4f7f4a') +
      `<path d="M${kx} ${h * 0.14} l${h * 0.05} ${h * 0.07} l-${h * 0.05} ${h * 0.07} l-${h * 0.05} -${h * 0.07}z" fill="#e6798a"/>
       <path d="M${kx} ${h * 0.28} Q${kx + w * 0.05} ${h * 0.5} ${w * 0.5} ${h * 0.68}" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>` +
      family(r, w * 0.46, h * 0.94, h * 0.3, false, 3 + Math.floor(r() * 2));
  },
  school: (r, w, h, id) =>
    sky(w, h, 'morning', id) +
    `<rect y="${h * 0.68}" width="${w}" height="${h * 0.32}" fill="#8d8f8f"/>
     <rect y="${h * 0.8}" width="${w}" height="${h * 0.02}" fill="#f4efe0" opacity=".7"/>
     <rect x="${w * 0.08}" y="${h * 0.3}" width="${w * 0.5}" height="${h * 0.34}" rx="${h * 0.04}" fill="#f2b632"/>
     <rect x="${w * 0.08}" y="${h * 0.48}" width="${w * 0.5}" height="${h * 0.03}" fill="#2f2f2f"/>
     ${[0, 1, 2, 3].map((i) => `<rect x="${w * (0.12 + i * 0.1)}" y="${h * 0.35}" width="${w * 0.07}" height="${h * 0.1}" rx="6" fill="#cfe3ee"/>`).join('')}
     <circle cx="${w * 0.18}" cy="${h * 0.66}" r="${h * 0.05}" fill="#2f2f2f"/><circle cx="${w * 0.48}" cy="${h * 0.66}" r="${h * 0.05}" fill="#2f2f2f"/>` +
    tree(w * 0.86, h * 0.68, h * 0.4, '#6d9a5c') +
    person(r, w * 0.68, h * 0.92, h * 0.46) + person(r, w * 0.76, h * 0.92, h * 0.26) +
    `<rect x="${w * 0.735}" y="${h * 0.73}" width="${h * 0.06}" height="${h * 0.08}" rx="8" fill="#d95c4b"/>`,
  dinner: (r, w, h, id) => {
    let plates = '';
    const seats = 5 + Math.floor(r() * 3);
    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2;
      const x = w / 2 + Math.cos(a) * w * 0.28;
      const y = h / 2 + Math.sin(a) * h * 0.26;
      plates += `<circle cx="${x}" cy="${y}" r="${h * 0.08}" fill="#fbf7ef"/><circle cx="${x}" cy="${y}" r="${h * 0.055}" fill="${pick(r, ['#e0a060', '#c5623f', '#9cb46c', '#e8c76a'])}"/>`;
    }
    void id;
    return `<rect width="${w}" height="${h}" fill="#5a3c2e"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.42}" ry="${h * 0.4}" fill="#8a5c3f"/>` +
      `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.4}" ry="${h * 0.38}" fill="#ebe0cf"/>` + plates +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.1}" fill="#c77b3a"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.07}" fill="#e9b25c"/>` +
      bokeh(r, w, h * 1.3, 10, ['#ffd08a']);
  },
  city: (r, w, h, id) => {
    let towers = '';
    let x = 0;
    while (x < w) {
      const tw = w * (0.04 + r() * 0.06);
      const th = h * (0.18 + r() * 0.3);
      towers += `<rect x="${x}" y="${h * 0.72 - th}" width="${tw}" height="${th}" fill="#3f3a55" opacity="${0.75 + r() * 0.25}"/>`;
      for (let wy = h * 0.72 - th + 12; wy < h * 0.7; wy += 22) if (r() > 0.55) towers += `<rect x="${x + tw * 0.3}" y="${wy}" width="${tw * 0.4}" height="5" fill="#ffd98a" opacity=".7"/>`;
      x += tw + 4;
    }
    const sx = w * 0.62;
    return sky(w, h, 'dusk', id) + sun(w * 0.3, h * 0.46, h * 0.05, '#ffe0b0', 0.45) + towers +
      `<path d="M${sx - w * 0.04} ${h * 0.72} L${sx - w * 0.012} ${h * 0.2} L${sx} ${h * 0.02} L${sx + w * 0.012} ${h * 0.2} L${sx + w * 0.04} ${h * 0.72}Z" fill="#2f2b45"/>
       <path d="M0 ${h * 0.72} Q${w * 0.3} ${h * 0.66} ${w * 0.6} ${h * 0.74} T${w} ${h * 0.7} L${w} ${h} L0 ${h}Z" fill="#d9a066"/>
       <path d="M0 ${h * 0.82} Q${w * 0.4} ${h * 0.74} ${w} ${h * 0.84} L${w} ${h} L0 ${h}Z" fill="#c68a52"/>` +
      family(r, w * 0.3, h * 0.97, h * 0.26, true, 4);
  },
  lake: (r, w, h, id) => {
    const hz = h * 0.55;
    return sky(w, h, 'golden', id) + sun(w * 0.5, hz - h * 0.05, h * 0.07, '#fff0cf', 0.5) +
      hills(w, h, hz, h * 0.1, '#7b6a7a', r, 0.9) +
      `<rect y="${hz}" width="${w}" height="${h - hz}" fill="#d59c7e"/>
       ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${w * 0.5 - w * (0.04 + i * 0.02)}" y="${hz + h * (0.03 + i * 0.05)}" width="${w * (0.08 + i * 0.04)}" height="4" fill="#fff0cf" opacity="${0.8 - i * 0.1}"/>`).join('')}
       <rect x="${w * 0.1}" y="${h * 0.8}" width="${w * 0.5}" height="${h * 0.03}" fill="#5a4332"/>` +
      family(r, w * 0.3, h * 0.8, h * 0.22, true, 3);
  },
  snow: (r, w, h, id) => {
    let flakes = '';
    for (let i = 0; i < 70; i++) flakes += `<circle cx="${r() * w}" cy="${r() * h}" r="${1.5 + r() * 4}" fill="#fff" opacity="${0.5 + r() * 0.5}"/>`;
    let pines = '';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.05 + i * 0.18 + r() * 0.05);
      const s = h * (0.28 + r() * 0.2);
      pines += `<path d="M${x} ${h * 0.72 - s} L${x + s * 0.3} ${h * 0.72} L${x - s * 0.3} ${h * 0.72}Z" fill="#3d5a57"/>`;
    }
    return sky(w, h, 'blue', id) + hills(w, h, h * 0.5, h * 0.16, '#dfe6ee', r) + pines +
      `<rect y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="#f2f5f7"/>` + family(r, w * 0.5, h * 0.95, h * 0.3, false, 4) + flakes;
  },
  rain: (r, w, h, id) => {
    let drops = '';
    for (let i = 0; i < 60; i++) {
      const x = r() * w;
      const y = r() * h;
      drops += `<ellipse cx="${x}" cy="${y}" rx="${3 + r() * 5}" ry="${5 + r() * 8}" fill="#fff" opacity="${0.2 + r() * 0.3}"/>`;
    }
    return sky(w, h, 'night', id) + bokeh(r, w, h * 1.4, 30, ['#ffd08a', '#9fc5e8', '#f6a57f']) + drops +
      `<rect x="0" y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="#3b2d2a"/>
       <rect x="${w * 0.2}" y="${h * 0.74}" width="${w * 0.08}" height="${h * 0.12}" rx="6" fill="#efe6d8"/>
       <path d="M${w * 0.28} ${h * 0.77} q${w * 0.03} 0 ${w * 0.03} ${h * 0.03} q0 ${h * 0.03} -${w * 0.03} ${h * 0.03}" stroke="#efe6d8" stroke-width="6" fill="none"/>`;
  },
  garden: (r, w, h, id) =>
    sky(w, h, 'morning', id) +
    `<rect y="${h * 0.56}" width="${w}" height="${h * 0.44}" fill="#9fbf7f"/>
     <rect y="${h * 0.5}" width="${w}" height="${h * 0.08}" fill="#e6d7bf"/>` +
    [0.1, 0.3, 0.72, 0.9].map((f) => tree(w * f, h * 0.56, h * 0.28, pick(r, ['#6d9a5c', '#5f8f55', '#7aa565']))).join('') +
    person(r, w * 0.3, h * 0.92, h * 0.46) + person(r, w * 0.72, h * 0.92, h * 0.44) + person(r, w * 0.5, h * 0.92, h * 0.2) +
    [0, 1, 2, 3, 4, 5, 6, 7].map(() => `<circle cx="${r() * w}" cy="${h * (0.62 + r() * 0.3)}" r="${6 + r() * 6}" fill="${pick(r, ['#f6d27a', '#f2b8a0', '#fff'])}"/>`).join(''),
  kitchen: (r, w, h, id) =>
    sky(w, h, 'day', id) +
    `<rect width="${w}" height="${h}" fill="#efe2cf" opacity=".85"/>
     <rect x="${w * 0.12}" y="${h * 0.08}" width="${w * 0.46}" height="${h * 0.46}" rx="6" fill="#cfe2ea"/>
     <line x1="${w * 0.35}" y1="${h * 0.08}" x2="${w * 0.35}" y2="${h * 0.54}" stroke="#efe2cf" stroke-width="10"/>
     <line x1="${w * 0.12}" y1="${h * 0.31}" x2="${w * 0.58}" y2="${h * 0.31}" stroke="#efe2cf" stroke-width="10"/>
     <path d="M${w * 0.12} ${h * 0.54} L${w * 0.58} ${h * 0.08}" stroke="#fff" stroke-width="30" opacity=".25"/>
     <rect y="${h * 0.6}" width="${w}" height="${h * 0.4}" fill="#a77b58"/>
     <rect y="${h * 0.6}" width="${w}" height="${h * 0.04}" fill="#c29470"/>
     <rect x="${w * 0.66}" y="${h * 0.42}" width="${w * 0.1}" height="${h * 0.18}" rx="10" fill="#d9825b"/>
     <circle cx="${w * 0.71}" cy="${h * 0.34}" r="${h * 0.1}" fill="#6d9a5c"/><circle cx="${w * 0.66}" cy="${h * 0.3}" r="${h * 0.06}" fill="#7aa565"/>
     <rect x="${w * 0.2}" y="${h * 0.5}" width="${w * 0.08}" height="${h * 0.1}" rx="8" fill="#f3efe6"/>
     <path d="M${w * 0.24} ${h * 0.46} q10 -20 0 -40" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>` +
    person(r, w * 0.44, h * 0.98, h * 0.5) + person(r, w * 0.54, h * 0.98, h * 0.3),
};

export const SCENES = Object.keys(painters);

const cache = new Map<string, string>();

export function sceneUrl(src: string): string {
  const hit = cache.get(src);
  if (hit) return hit;
  const [, name, seedStr, ratioStr] = src.split(':');
  const seed = Number(seedStr) || 1;
  const ratio = Number(ratioStr) || 4 / 3;
  const w = 1200;
  const h = Math.round(w / ratio);
  const r = mk(seed);
  const id = `${name}${seed}`;
  const paint = painters[name] ?? painters.park;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="g${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 .5 0"/></filter>
      <radialGradient id="v${id}" cx=".5" cy=".5" r=".8"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1a10" stop-opacity=".14"/></radialGradient>
      <filter id="c${id}"><feColorMatrix type="saturate" values="1.55"/><feComponentTransfer><feFuncR type="linear" slope="1.06" intercept="-.02"/><feFuncG type="linear" slope="1.06" intercept="-.02"/><feFuncB type="linear" slope="1.06" intercept="-.02"/></feComponentTransfer></filter>
      <linearGradient id="w${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb070" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <g filter="url(#c${id})">${paint(r, w, h, id)}</g>
    <rect width="${w}" height="${h}" fill="url(#w${id})" opacity=".5"/>
    <rect width="${w}" height="${h}" filter="url(#g${id})" opacity=".12"/>
    <rect width="${w}" height="${h}" fill="url(#v${id})"/>
  </svg>`;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s+/g, ' '));
  cache.set(src, url);
  return url;
}
