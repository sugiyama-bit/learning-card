/* app.js — 入力・保存・共有 */
(function () {
  const $ = (s) => document.querySelector(s);
  const KEY = 'learning-card.v1';

  const CATS = [
    { ja: '英語', en: 'English' }, { ja: '資格', en: 'Certification' }, { ja: '読書', en: 'Reading' },
    { ja: 'プログラミング', en: 'Coding' }, { ja: 'ビジネス', en: 'Business' }, { ja: 'サウナ', en: 'Sauna' }
  ];
  const MINS = [15, 30, 45, 60, 90, 120, 180];

  // ---- state ----
  let store = load();
  let photo = null; // HTMLImageElement, memory only
  let design = store.ui.design || 'editorial';
  let lastBlob = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.entries) return Object.assign({ profile: {}, ui: {}, entries: [] }, s);
    } catch (e) { /* ignore */ }
    return { profile: { name: '', goal: '', dayFix: null }, ui: { lang: 'en', design: 'editorial', show: {} }, entries: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* quota / private mode */ } }

  function todayISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function sortedEntries() { return store.entries.slice().sort((a, b) => a.date < b.date ? -1 : 1); }
  function dayNumberFor(dateISO) {
    const es = sortedEntries();
    const idx = es.findIndex(e => e.date === dateISO);
    const count = idx >= 0 ? idx + 1 : es.filter(e => e.date < dateISO).length + 1;
    const fix = store.profile.dayFix;
    if (fix && Number(fix) > 0) {
      // fix applies to today's number; shift others accordingly
      const todayCount = (() => { const i = es.findIndex(e => e.date === todayISO()); return i >= 0 ? i + 1 : es.filter(e => e.date < todayISO()).length + 1; })();
      return Math.max(1, count + (Number(fix) - todayCount));
    }
    return count;
  }
  function stats(dateISO) {
    const es = sortedEntries().filter(e => e.date <= dateISO);
    const total = es.reduce((a, e) => a + e.minutes, 0);
    const d = new Date(dateISO); d.setDate(d.getDate() - 6);
    const wk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const week = es.filter(e => e.date >= wk).reduce((a, e) => a + e.minutes, 0);
    return { totalMin: total, totalDays: es.length, weekMin: week, history: es.map(e => ({ date: e.date, minutes: e.minutes })) };
  }

  // ---- chips ----
  function buildChips() {
    const cc = $('#cat-chips'); cc.innerHTML = '';
    CATS.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c.ja; b.dataset.ja = c.ja; b.dataset.en = c.en; b.onclick = () => { $('#f-cat').value = currentLang() === 'ja' ? c.ja : c.en; markChips(); }; cc.appendChild(b); });
    const mc = $('#min-chips'); mc.innerHTML = '';
    MINS.forEach(m => { const b = document.createElement('button'); b.type = 'button'; b.textContent = m >= 60 ? `${m / 60}h${m % 60 ? m % 60 : ''}` : `${m}分`; b.dataset.min = m; b.onclick = () => { $('#f-min').value = m; markChips(); }; mc.appendChild(b); });
  }
  function markChips() {
    const v = $('#f-cat').value.trim();
    document.querySelectorAll('#cat-chips button').forEach(b => b.classList.toggle('on', v === b.dataset.ja || v === b.dataset.en));
    const m = Number($('#f-min').value);
    document.querySelectorAll('#min-chips button').forEach(b => b.classList.toggle('on', Number(b.dataset.min) === m));
  }
  function currentLang() { return $('#lang-ja').checked ? 'ja' : 'en'; }

  // ---- form <-> entry ----
  function readForm() {
    return {
      date: $('#f-date').value || todayISO(),
      category: $('#f-cat').value.trim() || (currentLang() === 'ja' ? '学習' : 'Study'),
      minutes: Math.max(1, Math.min(720, Number($('#f-min').value) || 0)),
      note: $('#f-note').value.trim(),
      place: $('#f-place').value.trim()
    };
  }
  function fillForm(e) {
    $('#f-date').value = e.date; $('#f-cat').value = e.category; $('#f-min').value = e.minutes; $('#f-note').value = e.note || ''; $('#f-place').value = e.place || '';
    $('#note-count').textContent = ($('#f-note').value).length; markChips();
  }
  function upsert(e) {
    const i = store.entries.findIndex(x => x.date === e.date);
    if (i >= 0) store.entries[i] = e; else store.entries.push(e);
    save();
  }

  // ---- render ----
  const canvas = $('#card');
  let rendering = false, again = false;
  async function render() {
    if (rendering) { again = true; return; }
    rendering = true;
    try {
      const e = readForm();
      const s = stats(e.date);
      // include unsaved current entry in history for preview
      if (!s.history.some(h => h.date === e.date)) { s.history.push({ date: e.date, minutes: e.minutes }); s.history.sort((a, b) => a.date < b.date ? -1 : 1); s.totalMin += e.minutes; s.totalDays += 1; s.weekMin += e.minutes; }
      else { const h = s.history.find(h => h.date === e.date); if (h.minutes !== e.minutes) { s.totalMin += e.minutes - h.minutes; s.weekMin += e.minutes - h.minutes; h.minutes = e.minutes; } }
      const data = Object.assign({}, e, s, {
        lang: currentLang(), name: store.profile.name || '', goal: store.profile.goal || '',
        day: dayNumberFor(e.date), photo,
        show: { time: $('#t-time').checked, day: $('#t-day').checked, goal: $('#t-goal').checked, name: $('#t-name').checked, place: $('#t-place').checked, tagline: $('#t-tagline').checked }
      });
      await Cards.render(canvas, design, data);
      $('.stage').classList.add('ready');
      lastBlob = null;
    } finally { rendering = false; if (again) { again = false; render(); } }
  }
  const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(render, 220); }; })();

  function toBlob() { return new Promise((res) => { if (lastBlob) return res(lastBlob); canvas.toBlob(b => { lastBlob = b; res(b); }, 'image/png'); }); }
  function fileName() { return `learning-card-${$('#f-date').value || todayISO()}.png`; }

  async function share() {
    if (!$('.stage').classList.contains('ready')) await make();
    const b = await toBlob(); if (!b) return;
    const f = new File([b], fileName(), { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f] }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
    }
    openModal(b);
  }
  async function saveImg() {
    if (!$('.stage').classList.contains('ready')) await make();
    const b = await toBlob(); if (b) openModal(b);
  }
  function openModal(b) {
    const url = URL.createObjectURL(b);
    $('#modal-img').src = url; $('#modal-dl').href = url; $('#modal-dl').download = fileName();
    $('#modal').hidden = false;
  }

  async function make() {
    const e = readForm();
    if (!e.minutes) { $('#f-min').focus(); $('#f-min').reportValidity && $('#f-min').reportValidity(); }
    upsert(e); renderHist(); await render();
    $('#panel-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- history ----
  function renderHist() {
    const ul = $('#hist'); ul.innerHTML = '';
    const es = sortedEntries().reverse();
    $('#hist-count').textContent = es.length;
    es.forEach(e => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="d">${e.date}</span><span>${escapeHtml(e.category)}${e.note ? ' · ' + escapeHtml(e.note.slice(0, 18)) + (e.note.length > 18 ? '…' : '') : ''}</span><span class="m">${e.minutes}分</span>`;
      const ed = document.createElement('button'); ed.textContent = '開く'; ed.onclick = () => { fillForm(e); render(); $('#panel-input').scrollIntoView({ behavior: 'smooth' }); };
      const del = document.createElement('button'); del.textContent = '削除'; del.className = 'del'; del.onclick = () => { if (confirm(`${e.date} の記録を削除しますか？`)) { store.entries = store.entries.filter(x => x.date !== e.date); save(); renderHist(); render(); } };
      li.appendChild(ed); li.appendChild(del); ul.appendChild(li);
    });
    const s = stats('9999-12-31');
    $('#stats').innerHTML = `<div class="stat"><b>${s.totalDays}</b><span>記録日数</span></div><div class="stat"><b>${(s.totalMin / 60).toFixed(1)}h</b><span>累計</span></div><div class="stat"><b>${(s.weekMin / 60).toFixed(1)}h</b><span>直近7日</span></div>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---- init ----
  function init() {
    buildChips();
    $('#f-date').value = todayISO();
    const today = store.entries.find(e => e.date === todayISO());
    if (today) fillForm(today); else { const last = sortedEntries().pop(); if (last) { $('#f-cat').value = last.category; $('#f-place').value = last.place || ''; } }
    $('#p-name').value = store.profile.name || ''; $('#p-goal').value = store.profile.goal || ''; $('#p-dayfix').value = store.profile.dayFix || '';
    ($('#lang-' + (store.ui.lang || 'en')) || $('#lang-en')).checked = true;
    const sh = store.ui.show || {}; ['time', 'day', 'goal', 'name', 'place', 'tagline'].forEach(k => { if (k in sh) $('#t-' + k).checked = !!sh[k]; });
    document.querySelectorAll('#design-tabs button').forEach(b => b.classList.toggle('on', b.dataset.design === design));
    markChips(); renderHist();

    // events
    $('#btn-make').onclick = make;
    $('#btn-share').onclick = share;
    $('#btn-save').onclick = saveImg;
    $('#modal-close').onclick = () => { $('#modal').hidden = true; };
    $('#modal').addEventListener('click', (ev) => { if (ev.target === $('#modal')) $('#modal').hidden = true; });
    ['#f-cat', '#f-min', '#f-note', '#f-place', '#f-date'].forEach(s => $(s).addEventListener('input', () => { markChips(); $('#note-count').textContent = $('#f-note').value.length; if ($('.stage').classList.contains('ready')) debounced(); }));
    document.querySelectorAll('#design-tabs button').forEach(b => b.onclick = () => { design = b.dataset.design; store.ui.design = design; save(); document.querySelectorAll('#design-tabs button').forEach(x => x.classList.toggle('on', x === b)); render(); });
    document.querySelectorAll('.toggles input').forEach(i => i.addEventListener('change', () => { store.ui.lang = currentLang(); store.ui.show = { time: $('#t-time').checked, day: $('#t-day').checked, goal: $('#t-goal').checked, name: $('#t-name').checked, place: $('#t-place').checked, tagline: $('#t-tagline').checked }; save(); markChips(); render(); }));
    $('#p-name').addEventListener('input', () => { store.profile.name = $('#p-name').value.trim(); save(); debounced(); });
    $('#p-goal').addEventListener('input', () => { store.profile.goal = $('#p-goal').value.trim(); save(); debounced(); });
    $('#p-dayfix').addEventListener('input', () => { store.profile.dayFix = Number($('#p-dayfix').value) || null; save(); debounced(); });
    $('#p-dayfix-clear').onclick = () => { $('#p-dayfix').value = ''; store.profile.dayFix = null; save(); render(); };
    $('#f-photo').addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f); const img = new Image();
      img.onload = () => { photo = img; $('#photo-clear').hidden = false; render(); };
      img.src = url;
    });
    $('#photo-clear').onclick = () => { photo = null; $('#f-photo').value = ''; $('#photo-clear').hidden = true; render(); };
    $('#btn-export').onclick = () => { const b = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `learning-card-backup-${todayISO()}.json`; a.click(); };
    $('#f-import').addEventListener('change', (ev) => { const f = ev.target.files[0]; if (!f) return; f.text().then(t => { try { const s = JSON.parse(t); if (!s.entries) throw 0; store = Object.assign({ profile: {}, ui: {}, entries: [] }, s); save(); location.reload(); } catch (e) { alert('読み込めませんでした。書き出したJSONを選んでください。'); } }); });

    // draw a preview right away if we have anything to show
    if ($('#f-min').value) render();
  }
  init();
})();
