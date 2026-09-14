/* cards.js — 1080×1920 のカードを Canvas に描く。3デザイン。 */
(function (global) {
  const W = 1080, H = 1920;
  const SAFE_T = 280, SAFE_B = 1640; // Storiesの上下UIを避ける
  const FONT_SERIF = '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", serif';
  const FONT_SANS = '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
  const FONT_MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

  const L = {
    ja: { takeaway: '今日の学び', goal: '目標', day: 'DAY', week: '今週', total: '累計', today: '今日', days: '日', place: '場所', log: '学習ログ', start: 'START' },
    en: { takeaway: "TODAY'S TAKEAWAY", goal: 'GOAL', day: 'DAY', week: 'THIS WEEK', total: 'TOTAL', today: 'TODAY', days: 'days', place: 'PLACE', log: 'TRAINING LOG', start: 'START' }
  };

  function pad(n, w) { return String(n).padStart(w, '0'); }
  function fmtHM(min, lang) {
    const h = Math.floor(min / 60), m = min % 60;
    if (lang === 'ja') return h ? `${h}時間${m ? m + '分' : ''}` : `${m}分`;
    return h ? `${h}h ${pad(m, 2)}m` : `${m}m`;
  }
  function fmtHMBig(min) { const h = Math.floor(min / 60), m = min % 60; return { h, m }; }
  function fmtDate(iso, lang) {
    const [y, mo, d] = iso.split('-').map(Number);
    const dt = new Date(y, mo - 1, d);
    if (lang === 'ja') return `${y}.${pad(mo, 2)}.${pad(d, 2)}`;
    const mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][dt.getMonth()];
    return `${mon} ${pad(d, 2)}, ${y}`;
  }
  function fmtHours(min) { const h = min / 60; return (h >= 100 ? Math.round(h) : Math.round(h * 10) / 10) + 'h'; }

  // ---- text helpers ----
  function isCJK(ch) { return /[　-鿿豈-﫿＀-￯]/.test(ch); }
  function wrap(ctx, text, maxW) {
    const lines = [];
    for (const para of String(text || '').split('\n')) {
      let line = '';
      let i = 0;
      while (i < para.length) {
        const ch = para[i];
        const test = line + ch;
        if (ctx.measureText(test).width <= maxW || line === '') {
          line = test; i++;
        } else {
          // Latin word: break at last space if the tail is latin
          const lastSpace = line.lastIndexOf(' ');
          if (!isCJK(ch) && lastSpace > 0 && !isCJK(line[line.length - 1])) {
            lines.push(line.slice(0, lastSpace));
            line = line.slice(lastSpace + 1);
          } else {
            lines.push(line); line = '';
          }
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function drawText(ctx, text, x, y, opt) {
    const { font, color, maxW, lineH, maxLines = 99, align = 'left', ellipsis = true } = opt;
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    let lines = maxW ? wrap(ctx, text, maxW) : [String(text)];
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      if (ellipsis) {
        let last = lines[maxLines - 1];
        while (last.length && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
        lines[maxLines - 1] = last + '…';
      }
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
    return y + lines.length * lineH;
  }
  function cover(ctx, img, x, y, w, h) {
    const ir = img.width / img.height, r = w / h;
    let sw, sh, sx, sy;
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function pin(ctx, x, y, s, color) {
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(x, y - s * 0.55, s * 0.42, Math.PI, 0);
    ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x, y - s * 0.55, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function rule(ctx, x1, y, x2, color, w = 2) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }

  // data: {lang, name, date, category, minutes, note, place, goal, day, weekMin, totalMin, totalDays, history:[{date,minutes}], photo, show:{time,day,goal,name,place,tagline}}
  const TAG = 'Learning is training.';

  // ============ EDITORIAL ============
  function editorial(ctx, d) {
    const paper = '#EEECE4', ink = '#1D2320', ink2 = '#5A6159', sand = '#8F7A4E', green = '#1F5A45';
    ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
    const t = L[d.lang];
    const PH = 1000;
    if (d.photo) {
      cover(ctx, d.photo, 0, 0, W, PH);
      const g = ctx.createLinearGradient(0, PH - 420, 0, PH);
      g.addColorStop(0, 'rgba(238,236,228,0)'); g.addColorStop(1, paper);
      ctx.fillStyle = g; ctx.fillRect(0, PH - 420, W, 420);
      const gt = ctx.createLinearGradient(0, 0, 0, 360);
      gt.addColorStop(0, 'rgba(0,0,0,0.35)'); gt.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gt; ctx.fillRect(0, 0, W, 360);
    } else {
      // notebook-like ruled field
      ctx.strokeStyle = 'rgba(29,35,32,0.10)'; ctx.lineWidth = 2;
      for (let y = 120; y < PH - 200; y += 56) { ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(W - 90, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(31,90,69,0.10)';
      ctx.beginPath(); ctx.arc(W - 240, 420, 250, 0, Math.PI * 2); ctx.fill();
      ctx.font = `700 320px ${FONT_SERIF}`; ctx.fillStyle = 'rgba(29,35,32,0.08)'; ctx.textAlign = 'left';
      ctx.fillText('“', 80, 640);
    }
    // header within safe zone
    const hc = d.photo ? '#FFFFFF' : ink2;
    ctx.font = `500 30px ${FONT_MONO}`; ctx.fillStyle = hc; ctx.textAlign = 'left';
    ctx.fillText(fmtDate(d.date, d.lang), 90, SAFE_T + 20);
    if (d.show.day) { ctx.textAlign = 'right'; ctx.fillText(`${t.day} ${pad(d.day, 3)}`, W - 90, SAFE_T + 20); }
    if (d.show.name && d.name) { ctx.textAlign = 'left'; ctx.font = `500 26px ${FONT_MONO}`; ctx.fillText(d.name.toUpperCase(), 90, SAFE_T + 66); }

    // category chip
    let y = PH - 20;
    if (!d.photo) y = 780;
    ctx.font = `700 30px ${FONT_SANS}`;
    const cw = ctx.measureText(d.category).width + 44;
    ctx.fillStyle = green; ctx.beginPath(); ctx.roundRect(90, y - 44, cw, 56, 8); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'left'; ctx.fillText(d.category, 112, y - 4);
    if (d.show.time) {
      ctx.font = `500 30px ${FONT_MONO}`; ctx.fillStyle = ink2;
      ctx.fillText(fmtHM(d.minutes, d.lang), 90 + cw + 24, y - 6);
    }
    y += 90;
    ctx.font = `500 26px ${FONT_MONO}`; ctx.fillStyle = sand; ctx.fillText(t.takeaway, 90, y);
    y += 30;
    const note = d.note && d.note.trim() ? d.note.trim() : (d.lang === 'ja' ? `${d.category}を${fmtHM(d.minutes, 'ja')}。` : `${fmtHM(d.minutes, 'en')} of ${d.category}.`);
    const big = note.length <= 40;
    y = drawText(ctx, note, 90, y + (big ? 74 : 62), { font: `700 ${big ? 66 : 52}px ${FONT_SERIF}`, color: ink, maxW: W - 180, lineH: big ? 92 : 76, maxLines: big ? 4 : 5 });
    y += 30;
    rule(ctx, 90, y, W - 90, 'rgba(29,35,32,0.18)');
    y += 54;
    if (d.show.place && d.place) { pin(ctx, 104, y + 4, 34, sand); ctx.font = `500 28px ${FONT_SANS}`; ctx.fillStyle = ink2; ctx.textAlign = 'left'; ctx.fillText(d.place, 130, y); y += 46; }
    if (d.show.goal && d.goal) { ctx.font = `500 26px ${FONT_MONO}`; ctx.fillStyle = ink2; ctx.textAlign = 'left'; ctx.fillText(`${t.goal} → ${d.goal}`, 90, Math.min(y, SAFE_B - 60)); }
    if (d.show.tagline) { ctx.font = `500 26px ${FONT_SERIF}`; ctx.fillStyle = green; ctx.textAlign = 'right'; ctx.fillText(TAG, W - 90, SAFE_B); }
  }

  // ============ PERFORMANCE ============
  function performance(ctx, d) {
    const bg = '#0F1519', ink = '#F2F4F1', dim = '#8A949B', line = '#26313A', blue = '#5B8CFF';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (d.photo) { ctx.globalAlpha = 0.22; cover(ctx, d.photo, 0, 0, W, H); ctx.globalAlpha = 1; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(15,21,25,0.2)'); g.addColorStop(0.5, 'rgba(15,21,25,0.85)'); g.addColorStop(1, bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const t = L[d.lang];
    ctx.textAlign = 'left';
    ctx.font = `600 28px ${FONT_MONO}`; ctx.fillStyle = blue; ctx.fillText(t.log, 90, SAFE_T + 10);
    ctx.fillStyle = dim; ctx.textAlign = 'right'; ctx.fillText(fmtDate(d.date, d.lang), W - 90, SAFE_T + 10);
    if (d.show.name && d.name) { ctx.textAlign = 'left'; ctx.font = `500 26px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.fillText(d.name.toUpperCase(), 90, SAFE_T + 56); }

    // category
    drawText(ctx, d.category, 90, SAFE_T + 190, { font: `700 68px ${FONT_SANS}`, color: ink, maxW: W - 180, lineH: 84, maxLines: 2 });
    // big time
    const { h, m } = fmtHMBig(d.minutes);
    let y = 860;
    ctx.textBaseline = 'alphabetic';
    if (d.show.time) {
      ctx.textAlign = 'left';
      ctx.font = `600 300px ${FONT_MONO}`; ctx.fillStyle = ink;
      const hs = h ? String(h) : String(m);
      ctx.fillText(hs, 80, y);
      const w1 = ctx.measureText(hs).width;
      ctx.font = `500 90px ${FONT_MONO}`; ctx.fillStyle = blue;
      ctx.fillText(h ? 'h' : 'm', 80 + w1 + 8, y);
      if (h) { const w2 = ctx.measureText('h').width; ctx.font = `500 120px ${FONT_MONO}`; ctx.fillStyle = ink; ctx.fillText(pad(m, 2), 80 + w1 + w2 + 40, y); const w3 = ctx.measureText(pad(m, 2)).width; ctx.font = `500 70px ${FONT_MONO}`; ctx.fillStyle = blue; ctx.fillText('m', 80 + w1 + w2 + 40 + w3 + 6, y); }
    } else {
      ctx.font = `600 200px ${FONT_MONO}`; ctx.fillStyle = ink; ctx.fillText(`${t.day} ${pad(d.day, 3)}`.replace(/^DAY /, ''), 80, y);
      ctx.font = `500 60px ${FONT_MONO}`; ctx.fillStyle = blue; ctx.fillText(t.day, 84, y - 220);
    }
    // lap table
    y = 960;
    const rows = [];
    if (d.show.day) rows.push([t.day, pad(d.day, 3)]);
    rows.push([t.week, fmtHM(d.weekMin, 'en')]);
    rows.push([t.total, `${fmtHours(d.totalMin)} / ${d.totalDays} ${t.days}`]);
    if (d.show.place && d.place) rows.push([t.place, d.place]);
    rows.forEach(([k, v]) => {
      rule(ctx, 90, y, W - 90, line, 2);
      ctx.font = `500 28px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.textAlign = 'left'; ctx.fillText(k, 90, y + 60);
      ctx.font = `500 40px ${FONT_MONO}`; ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText(v, W - 90, y + 62);
      y += 96;
    });
    rule(ctx, 90, y, W - 90, line, 2);
    y += 80;
    if (d.note && d.note.trim()) {
      y = drawText(ctx, d.note.trim(), 90, y + 40, { font: `500 40px ${FONT_SANS}`, color: ink, maxW: W - 180, lineH: 60, maxLines: 3 });
    }
    if (d.show.goal && d.goal) { ctx.font = `600 30px ${FONT_MONO}`; ctx.fillStyle = blue; ctx.textAlign = 'left'; ctx.fillText(`→ ${d.goal}`, 90, SAFE_B); }
    if (d.show.tagline) { ctx.font = `500 26px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.textAlign = 'right'; ctx.fillText(TAG, W - 90, SAFE_B); }
  }

  // ============ JOURNEY ============
  function journey(ctx, d) {
    const bg = '#14322A', ink = '#F1EEE4', dim = 'rgba(241,238,228,0.62)', sand = '#D3BE8B', grid = 'rgba(241,238,228,0.10)';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (d.photo) { ctx.globalAlpha = 0.28; cover(ctx, d.photo, 0, 0, W, H); ctx.globalAlpha = 1; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(20,50,42,0.55)'); g.addColorStop(0.45, 'rgba(20,50,42,0.92)'); g.addColorStop(1, bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const t = L[d.lang];
    ctx.textAlign = 'left';
    ctx.font = `500 28px ${FONT_MONO}`; ctx.fillStyle = sand; ctx.fillText(fmtDate(d.date, d.lang), 90, SAFE_T + 10);
    if (d.show.name && d.name) { ctx.textAlign = 'right'; ctx.fillStyle = dim; ctx.fillText(d.name.toUpperCase(), W - 90, SAFE_T + 10); }

    let y = SAFE_T + 100;
    if (d.show.goal && d.goal) {
      ctx.font = `500 26px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.textAlign = 'left'; ctx.fillText(t.goal, 90, y);
      y = drawText(ctx, d.goal, 90, y + 90, { font: `700 84px ${FONT_SERIF}`, color: ink, maxW: W - 180, lineH: 100, maxLines: 2 });
    } else {
      y = drawText(ctx, d.category, 90, y + 90, { font: `700 84px ${FONT_SERIF}`, color: ink, maxW: W - 180, lineH: 100, maxLines: 2 });
    }

    // trajectory: last 30 recorded days
    const top = Math.max(y + 40, 720), bottom = top + 440, left = 90, right = W - 90;
    const hist = (d.history || []).slice(-30);
    const maxMin = Math.max(120, ...hist.map(e => e.minutes));
    for (let i = 0; i <= 4; i++) rule(ctx, left, top + (bottom - top) * i / 4, right, grid, 2);
    const n = hist.length;
    const px = (i) => n === 1 ? (left + right) / 2 : left + (right - left) * i / (n - 1);
    const py = (mn) => bottom - 40 - (bottom - top - 80) * Math.min(1, mn / maxMin);
    if (n > 1) {
      ctx.strokeStyle = 'rgba(211,190,139,0.35)'; ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); hist.forEach((e, i) => i ? ctx.lineTo(px(i), py(e.minutes)) : ctx.moveTo(px(i), py(e.minutes))); ctx.stroke();
      ctx.strokeStyle = sand; ctx.lineWidth = 7; ctx.beginPath(); hist.forEach((e, i) => i ? ctx.lineTo(px(i), py(e.minutes)) : ctx.moveTo(px(i), py(e.minutes))); ctx.stroke();
    }
    hist.forEach((e, i) => { ctx.fillStyle = i === n - 1 ? ink : sand; ctx.beginPath(); ctx.arc(px(i), py(e.minutes), i === n - 1 ? 16 : 8, 0, Math.PI * 2); ctx.fill(); });
    if (n) { const lx = px(n - 1), ly = py(hist[n - 1].minutes); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(lx, ly, 30, 0, Math.PI * 2); ctx.stroke(); }
    ctx.font = `500 24px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.textAlign = 'left';
    const firstDay = Math.max(1, d.day - n + 1);
    ctx.fillText(n > 1 ? `${t.day} ${pad(firstDay, 3)}` : t.start, left, bottom + 40);
    ctx.textAlign = 'right'; ctx.fillStyle = sand; ctx.font = `600 24px ${FONT_MONO}`;
    if (d.show.day) ctx.fillText(`${t.day} ${pad(d.day, 3)}`, right, bottom + 40);
    ctx.textAlign = 'right'; ctx.fillStyle = dim; ctx.font = `500 22px ${FONT_MONO}`; ctx.fillText(fmtHM(maxMin, 'en'), right, top - 12);

    // stats
    y = bottom + 130;
    const cols = [[t.total, fmtHours(d.totalMin)], [t.day + 'S', String(d.totalDays)], [t.today, d.show.time ? fmtHM(d.minutes, 'en') : d.category]];
    cols.forEach(([k, v], i) => {
      const x = 90 + i * 300;
      ctx.textAlign = 'left'; ctx.font = `500 24px ${FONT_MONO}`; ctx.fillStyle = dim; ctx.fillText(k, x, y);
      ctx.font = `600 ${i === 2 && !d.show.time ? 40 : 60}px ${FONT_MONO}`; ctx.fillStyle = ink; ctx.fillText(v, x, y + 70);
    });
    y += 150;
    // category + note
    ctx.font = `700 30px ${FONT_SANS}`; ctx.fillStyle = sand; ctx.textAlign = 'left'; ctx.fillText(d.category, 90, y);
    if (d.show.place && d.place) { const cw = ctx.measureText(d.category).width; pin(ctx, 90 + cw + 40, y + 4, 30, dim); ctx.font = `500 28px ${FONT_SANS}`; ctx.fillStyle = dim; ctx.fillText(d.place, 90 + cw + 62, y); }
    if (d.note && d.note.trim()) drawText(ctx, d.note.trim(), 90, y + 66, { font: `500 40px ${FONT_SERIF}`, color: ink, maxW: W - 180, lineH: 60, maxLines: 3 });
    if (d.show.tagline) { ctx.font = `500 26px ${FONT_SERIF}`; ctx.fillStyle = sand; ctx.textAlign = 'right'; ctx.fillText(TAG, W - 90, SAFE_B); }
  }

  const RENDER = { editorial, performance, journey };

  async function ensureFonts() {
    if (!document.fonts) return;
    const list = [
      `700 60px ${FONT_SERIF}`, `500 30px ${FONT_SERIF}`,
      `700 60px ${FONT_SANS}`, `500 30px ${FONT_SANS}`, `400 30px ${FONT_SANS}`,
      `600 60px ${FONT_MONO}`, `500 30px ${FONT_MONO}`
    ];
    try { await Promise.all(list.map(f => document.fonts.load(f, '学びLearning 037'))); await document.fonts.ready; } catch (e) { /* fall back silently */ }
  }

  async function render(canvas, design, data) {
    await ensureFonts();
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    (RENDER[design] || editorial)(ctx, data);
  }

  global.Cards = { render, W, H };
})(window);
