import * as vscode from 'vscode';

const VOICES: Array<[string, string]> = [
  ['en-US-JennyNeural', 'Jenny · US'],
  ['en-US-AriaNeural', 'Aria · US'],
  ['en-US-AvaNeural', 'Ava · US'],
  ['en-US-EmmaNeural', 'Emma · US'],
  ['en-US-GuyNeural', 'Guy · US'],
  ['en-US-AndrewNeural', 'Andrew · US'],
  ['en-US-BrianNeural', 'Brian · US'],
  ['en-GB-SoniaNeural', 'Sonia · UK'],
  ['en-GB-RyanNeural', 'Ryan · UK'],
  ['en-IN-NeerjaNeural', 'Neerja · India'],
  ['en-IN-PrabhatNeural', 'Prabhat · India'],
  ['en-AU-NatashaNeural', 'Natasha · Australia'],
  ['en-AU-WilliamNeural', 'William · Australia'],
];

function nonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

export function getPlayerHtml(webview: vscode.Webview): string {
  const n = nonce();
  const voiceOptions = VOICES.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; media-src data: blob:; style-src 'nonce-${n}'; script-src 'nonce-${n}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AudioWizard</title>
<style nonce="${n}">
  :root {
    --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
    --fg: var(--vscode-foreground);
    --fg-2: var(--vscode-descriptionForeground);
    --accent: #007AFF;
    --accent-soft: rgba(0, 122, 255, 0.12);
    --on-accent: #FFFFFF;
    --surface: rgba(0, 0, 0, 0.035);
    --surface-hover: rgba(0, 0, 0, 0.06);
    --surface-active: rgba(0, 0, 0, 0.1);
    --hairline: rgba(0, 0, 0, 0.08);
    --track: rgba(0, 0, 0, 0.1);
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 14px rgba(0, 0, 0, 0.06);
    --ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  }
  body.vscode-dark {
    --accent: #0A84FF;
    --accent-soft: rgba(10, 132, 255, 0.2);
    --surface: rgba(255, 255, 255, 0.05);
    --surface-hover: rgba(255, 255, 255, 0.08);
    --surface-active: rgba(255, 255, 255, 0.12);
    --hairline: rgba(255, 255, 255, 0.08);
    --track: rgba(255, 255, 255, 0.14);
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 6px 18px rgba(0, 0, 0, 0.25);
  }
  body.vscode-high-contrast, body.vscode-high-contrast-light {
    --accent: var(--vscode-focusBorder);
    --accent-soft: transparent;
    --on-accent: var(--vscode-editor-background);
    --hairline: var(--vscode-contrastBorder);
    --surface: transparent;
  }

  * { box-sizing: border-box; }
  html, body { height: 100%; overflow-x: hidden; }
  body {
    margin: 0;
    padding: 0;
    background: transparent;
    color: var(--fg);
    font: 13px/18px var(--font);
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    user-select: none;
  }
  button, select { font: inherit; color: inherit; }
  button { cursor: pointer; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  [hidden] { display: none !important; }

  .app { display: flex; flex-direction: column; height: 100%; padding: 12px 14px 0; gap: 10px; }

  /* Now playing header */
  .now { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .art {
    flex: none; width: 44px; height: 44px; border-radius: 10px;
    background: linear-gradient(140deg, #5E5CE6 0%, #0A84FF 55%, #64D2FF 100%);
    box-shadow: var(--shadow);
    display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 11px;
  }
  .art i { display: block; width: 3px; height: 8px; border-radius: 2px; background: rgba(255,255,255,0.92); transform-origin: bottom; transition: height 200ms var(--ease); }
  .art i:nth-child(2) { height: 16px; } .art i:nth-child(3) { height: 11px; } .art i:nth-child(4) { height: 18px; } .art i:nth-child(5) { height: 9px; }
  body[data-state="playing"] .art i { animation: eq 900ms var(--ease) infinite alternate; }
  .art i:nth-child(2) { animation-delay: -300ms !important; } .art i:nth-child(3) { animation-delay: -600ms !important; }
  .art i:nth-child(4) { animation-delay: -150ms !important; } .art i:nth-child(5) { animation-delay: -450ms !important; }
  @keyframes eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }

  .meta { flex: 1; min-width: 0; }
  .title { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 11px; line-height: 14px; color: var(--fg-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

  .segmented { flex: none; display: inline-flex; padding: 2px; border-radius: 7px; background: var(--surface); border: 0.5px solid var(--hairline); }
  .segmented button {
    border: 0; background: transparent; padding: 3px 10px; border-radius: 5px; font-size: 11px; font-weight: 500;
    color: var(--fg-2); transition: background 150ms var(--ease), color 150ms var(--ease);
  }
  .segmented button:hover:not(:disabled) { color: var(--fg); }
  .segmented button[aria-pressed="true"] { background: var(--vscode-editor-background); color: var(--fg); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
  .segmented button:disabled { cursor: default; opacity: 0.55; }
  .pill { font-size: 9px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; padding: 0 4px; margin-left: 3px; border-radius: 3px; background: var(--accent-soft); color: var(--accent); vertical-align: 1px; }

  /* Transport */
  .bar { display: flex; align-items: center; gap: 12px; }
  .transport { display: flex; align-items: center; gap: 4px; flex: none; }
  .icon-btn {
    width: 28px; height: 28px; border: 0; border-radius: 6px; background: transparent; display: grid; place-items: center;
    color: var(--fg); opacity: 0.85; transition: background 150ms var(--ease), opacity 150ms var(--ease), transform 100ms var(--ease);
  }
  .icon-btn:hover { background: var(--surface-hover); opacity: 1; }
  .icon-btn:active { transform: scale(0.92); background: var(--surface-active); }
  .icon-btn svg { width: 14px; height: 14px; fill: currentColor; }
  .play {
    width: 36px; height: 36px; border: 0; border-radius: 50%; display: grid; place-items: center; margin: 0 2px;
    background: var(--accent); color: var(--on-accent); box-shadow: var(--shadow);
    transition: transform 120ms var(--ease), filter 150ms var(--ease);
  }
  .play:hover { filter: brightness(1.08); transform: scale(1.04); }
  .play:active { transform: scale(0.95); }
  .play svg { width: 15px; height: 15px; fill: currentColor; }
  .play .spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); border-top-color: var(--on-accent); animation: spin 700ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .scrub { flex: 1; min-width: 80px; display: flex; flex-direction: column; gap: 4px; }
  .track { position: relative; height: 4px; border-radius: 2px; background: var(--track); cursor: pointer; }
  .track::before { content: ""; position: absolute; inset: -6px 0; }
  .fill { position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 2px; background: var(--accent); transition: width 250ms linear; }
  .knob {
    position: absolute; top: 50%; left: 0; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.3);
    opacity: 0; transition: opacity 150ms var(--ease), left 250ms linear;
  }
  .track:hover .knob { opacity: 1; }
  .times { display: flex; justify-content: space-between; font-size: 10px; line-height: 12px; color: var(--fg-2); font-variant-numeric: tabular-nums; }

  .tools { display: flex; align-items: center; gap: 6px; flex: none; }
  .chip {
    height: 24px; padding: 0 9px; border-radius: 6px; border: 0.5px solid var(--hairline); background: var(--surface);
    font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; transition: background 150ms var(--ease);
  }
  .chip:hover { background: var(--surface-hover); }
  select.chip { font-weight: 500; padding-right: 4px; max-width: 150px; color: var(--fg); }
  select.chip option { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); }

  /* Transcript */
  .transcript {
    flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px 18px; margin: 0 -14px;
    border-top: 0.5px solid var(--hairline); user-select: text; scroll-behavior: smooth;
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 10px, #000 calc(100% - 16px), transparent 100%);
  }
  .transcript p { margin: 0 0 10px; max-width: 72ch; font-size: 13px; line-height: 20px; }
  .transcript span { border-radius: 4px; padding: 1px 2px; margin: 0 -2px; cursor: pointer; transition: background 200ms var(--ease), color 200ms var(--ease); }
  .transcript span:hover { background: var(--surface-hover); }
  .transcript span.done { color: var(--fg-2); }
  .transcript span.now { background: var(--accent-soft); color: var(--fg); }
  body.vscode-high-contrast .transcript span.now, body.vscode-high-contrast-light .transcript span.now { outline: 1px solid var(--accent); }

  /* Empty state */
  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding-bottom: 14px; }
  .empty h1 { margin: 0; font-size: 13px; font-weight: 600; }
  .empty p { margin: 0; font-size: 12px; color: var(--fg-2); max-width: 340px; }
  .keys { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; margin-top: 2px; font-size: 11px; color: var(--fg-2); }
  kbd {
    font: 600 10px/1 var(--font); padding: 3px 5px; margin-right: 4px; border-radius: 4px; color: var(--fg);
    background: var(--surface); border: 0.5px solid var(--hairline); box-shadow: 0 1px 0 var(--hairline);
  }

  .toast {
    position: fixed; left: 50%; bottom: 14px; transform: translate(-50%, 8px); opacity: 0; pointer-events: none;
    padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 500; color: var(--fg);
    background: var(--vscode-editorWidget-background); border: 0.5px solid var(--hairline); box-shadow: var(--shadow);
    transition: opacity 200ms var(--ease), transform 200ms var(--ease);
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }

  @media (max-width: 520px) {
    .bar { flex-wrap: wrap; }
    .scrub { order: 3; flex-basis: 100%; }
    .tools { margin-left: auto; }
    .now { flex-wrap: wrap; }
    .now .segmented { order: 3; flex-basis: 100%; }
    .now .segmented button { flex: 1 1 auto; padding: 3px 6px; }
    .transport { gap: 0; }
    select.chip { max-width: 112px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  }
</style>
</head>
<body data-state="idle">
<div class="app">
  <div class="now">
    <div class="art" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="meta">
      <div class="title" id="title">AudioWizard</div>
      <div class="sub" id="sub">Nothing playing</div>
    </div>
    <div class="segmented" role="group" aria-label="Reading mode">
      <button id="modeFull" aria-pressed="true" title="Read everything">Full</button>
      <button id="modeSkim" aria-pressed="false" title="Headings and the first sentence of each section">Skim</button>
      <button disabled title="A short spoken summary using your own AI key. Coming soon in AudioWizard Pro.">Overview<span class="pill">Pro · Soon</span></button>
    </div>
  </div>

  <div class="bar" id="bar">
    <div class="transport">
      <button class="icon-btn" id="prev" title="Previous sentence (←)" aria-label="Previous sentence">
        <svg viewBox="0 0 16 16"><path d="M3 3h1.6v10H3zM14 3.6v8.8a.6.6 0 0 1-.92.5L6.4 8.5a.6.6 0 0 1 0-1l6.68-4.4a.6.6 0 0 1 .92.5z"/></svg>
      </button>
      <button class="play" id="play" title="Play / Pause (Space)" aria-label="Play">
        <svg id="icoPlay" viewBox="0 0 16 16"><path d="M4.5 2.6v10.8a.7.7 0 0 0 1.06.6l8.6-5.4a.7.7 0 0 0 0-1.2l-8.6-5.4a.7.7 0 0 0-1.06.6z"/></svg>
        <svg id="icoPause" viewBox="0 0 16 16" hidden><rect x="3.5" y="2.5" width="3.2" height="11" rx="1"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1"/></svg>
        <span id="icoLoad" class="spinner" hidden></span>
      </button>
      <button class="icon-btn" id="next" title="Next sentence (→)" aria-label="Next sentence">
        <svg viewBox="0 0 16 16"><path d="M13 3h-1.6v10H13zM2 3.6v8.8a.6.6 0 0 0 .92.5L9.6 8.5a.6.6 0 0 0 0-1L2.92 3.1a.6.6 0 0 0-.92.5z"/></svg>
      </button>
      <button class="icon-btn" id="stop" title="Stop (Esc)" aria-label="Stop">
        <svg viewBox="0 0 16 16"><rect x="3.5" y="3.5" width="9" height="9" rx="1.6"/></svg>
      </button>
    </div>
    <div class="scrub">
      <div class="track" id="track" role="slider" aria-label="Position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
        <div class="fill" id="fill"></div><div class="knob" id="knob"></div>
      </div>
      <div class="times"><span id="pos">–</span><span id="left"></span></div>
    </div>
    <div class="tools">
      <button class="chip" id="speed" title="Playback speed">1×</button>
      <select class="chip" id="voice" title="Voice">${voiceOptions}</select>
    </div>
  </div>

  <div class="empty" id="empty">
    <h1>Nothing playing</h1>
    <p>Select text in a file, or copy an agent's reply, and press the shortcut. Long files start speaking in about a second.</p>
    <div class="keys">
      <span><kbd data-k="R"></kbd>Read file</span>
      <span><kbd data-k="C"></kbd>Read selection or clipboard</span>
      <span><kbd data-k="Space" data-mac="P"></kbd>Play / pause</span>
      <span><kbd data-k="X"></kbd>Stop</span>
    </div>
  </div>
  <div class="transcript" id="transcript" hidden></div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script nonce="${n}">
(function () {
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  const audio = new Audio();
  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5];
  const CHARS_PER_SECOND = 15;
  const isMac = /Mac/.test(navigator.userAgent);

  const S = {
    session: 0, chunks: [], index: 0, state: 'idle', finished: false, active: false,
    waitingFor: null, utterance: null, mode: 'full',
    voice: 'en-US-JennyNeural', speed: 1, engine: 'neural', origin: '', title: '',
  };
  let spans = [];
  let userScrolledAt = 0;

  document.querySelectorAll('kbd[data-k]').forEach((k) => {
    k.textContent = isMac ? '⌘⌥' + (k.dataset.mac || k.dataset.k) : 'Ctrl+Alt+' + k.dataset.k;
  });

  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function setState(state) {
    S.state = state;
    document.body.dataset.state = state;
    $('icoPlay').hidden = state === 'playing' || state === 'loading';
    $('icoPause').hidden = state !== 'playing';
    $('icoLoad').hidden = state !== 'loading';
    $('play').setAttribute('aria-label', state === 'playing' ? 'Pause' : 'Play');
    vscode.postMessage({ type: 'state', state: state });
    renderMeta();
  }

  // Output control. Every path that starts sound goes through stopOutput first,
  // so nothing can keep speaking in the background.
  function stopOutput() {
    S.waitingFor = null;
    S.utterance = null;
    audio.pause();
    audio.removeAttribute('src');
    try { speechSynthesis.cancel(); } catch (e) {}
  }

  function playIndex(i) {
    if (!S.chunks.length) return;
    stopOutput();
    S.finished = false;
    S.active = true;
    S.index = Math.max(0, Math.min(i, S.chunks.length - 1));
    renderHighlight();
    if (S.engine === 'system') {
      speakSystem(S.index);
    } else {
      S.waitingFor = S.index;
      setState('loading');
      vscode.postMessage({ type: 'need', session: S.session, index: S.index });
    }
  }

  function speakSystem(i) {
    if (!('speechSynthesis' in window)) { finish(); return; }
    const u = new SpeechSynthesisUtterance(S.chunks[i].text);
    u.rate = S.speed;
    u.onend = () => { if (S.utterance === u) next(); };
    u.onerror = () => { if (S.utterance === u) next(); };
    S.utterance = u;
    speechSynthesis.speak(u);
    setState('playing');
  }

  function next() {
    if (S.index + 1 < S.chunks.length) playIndex(S.index + 1);
    else finish();
  }

  function finish() {
    stopOutput();
    S.finished = true;
    S.active = false;
    S.index = S.chunks.length - 1;
    renderHighlight(true);
    setState('idle');
  }

  function pause() {
    if (S.utterance) speechSynthesis.pause(); else audio.pause();
    setState('paused');
  }

  function resume() {
    if (S.utterance) { speechSynthesis.resume(); setState('playing'); }
    else if (audio.src) { audio.play().catch(() => playIndex(S.index)); }
    else playIndex(S.index);
  }

  function toggle() {
    if (!S.chunks.length) return;
    if (S.state === 'playing') pause();
    else if (S.state === 'paused') resume();
    else if (S.state === 'loading') stop();
    else playIndex(S.finished ? 0 : S.index);
  }

  function stop() {
    stopOutput();
    S.index = 0;
    S.finished = false;
    S.active = false;
    renderHighlight();
    setState('idle');
    vscode.postMessage({ type: 'stop' });
  }

  audio.addEventListener('playing', () => setState('playing'));
  audio.addEventListener('ended', () => next());
  audio.addEventListener('timeupdate', renderProgress);
  audio.addEventListener('error', () => {
    if (audio.getAttribute('src') && S.waitingFor === null && S.state !== 'idle') speakSystem(S.index);
  });

  // Rendering
  function renderMeta() {
    if (!S.chunks.length) { $('sub').textContent = 'Nothing playing'; return; }
    const origin = { document: 'File', selection: 'Selection', clipboard: 'Clipboard' }[S.origin] || '';
    const voice = S.engine === 'system' ? 'System voice' : ($('voice').selectedOptions[0] || {}).textContent || S.voice;
    const status = S.state === 'loading' ? 'Preparing…' : S.state === 'paused' ? 'Paused' : S.finished ? 'Finished' : '';
    $('sub').textContent = [status, origin, S.mode === 'skim' ? 'Skim' : '', voice].filter(Boolean).join(' · ');
  }

  function renderTranscript() {
    const box = $('transcript');
    box.textContent = '';
    spans = [];
    let p = null, para = -1;
    S.chunks.forEach((c, i) => {
      if (c.paragraph !== para) { p = document.createElement('p'); box.appendChild(p); para = c.paragraph; }
      const s = document.createElement('span');
      s.textContent = c.text;
      s.dataset.i = String(i);
      p.appendChild(s);
      p.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    box.scrollTop = 0;
  }

  function renderHighlight(allDone) {
    spans.forEach((s, i) => {
      s.classList.toggle('done', allDone ? true : i < S.index);
      s.classList.toggle('now', !allDone && S.active && i === S.index);
    });
    const cur = spans[S.index];
    if (cur && !allDone && Date.now() - userScrolledAt > 4000) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
    renderProgress();
  }

  function remainingSeconds() {
    let chars = 0;
    for (let i = S.index; i < S.chunks.length; i++) chars += S.chunks[i].text.length;
    const frac = audio.duration ? audio.currentTime / audio.duration : 0;
    chars -= (S.chunks[S.index] ? S.chunks[S.index].text.length : 0) * frac;
    return S.finished ? 0 : chars / (CHARS_PER_SECOND * S.speed);
  }

  function fmtLeft(sec) {
    if (sec < 60) return Math.max(1, Math.round(sec)) + ' sec left';
    return 'about ' + Math.round(sec / 60) + ' min left';
  }

  function renderProgress() {
    const n = S.chunks.length;
    if (!n) { $('fill').style.width = '0'; $('knob').style.left = '0'; $('pos').textContent = '–'; $('left').textContent = ''; return; }
    const frac = audio.duration && S.waitingFor === null ? audio.currentTime / audio.duration : 0;
    const pct = S.finished ? 100 : ((S.index + frac) / n) * 100;
    $('fill').style.width = pct + '%';
    $('knob').style.left = pct + '%';
    $('track').setAttribute('aria-valuenow', String(Math.round(pct)));
    $('pos').textContent = 'Sentence ' + Math.min(S.index + 1, n) + ' of ' + n;
    $('left').textContent = S.finished ? 'Done' : fmtLeft(remainingSeconds());
  }

  function renderSettings() {
    $('speed').textContent = (Math.round(S.speed * 100) / 100) + '×';
    const sel = $('voice');
    if (![...sel.options].some((o) => o.value === S.voice)) sel.add(new Option(S.voice, S.voice));
    sel.value = S.voice;
    sel.hidden = S.engine === 'system';
    audio.playbackRate = S.speed;
    renderMeta();
  }

  function renderMode() {
    $('modeFull').setAttribute('aria-pressed', String(S.mode === 'full'));
    $('modeSkim').setAttribute('aria-pressed', String(S.mode === 'skim'));
  }

  // Controls
  $('play').addEventListener('click', toggle);
  $('stop').addEventListener('click', stop);
  $('prev').addEventListener('click', () => S.chunks.length && playIndex(S.index - 1));
  $('next').addEventListener('click', () => S.chunks.length && playIndex(S.index + 1));
  $('track').addEventListener('click', (e) => {
    if (!S.chunks.length) return;
    const r = $('track').getBoundingClientRect();
    playIndex(Math.floor(((e.clientX - r.left) / r.width) * S.chunks.length));
  });
  $('transcript').addEventListener('click', (e) => {
    const i = e.target && e.target.dataset ? e.target.dataset.i : undefined;
    if (i !== undefined && !String(window.getSelection())) playIndex(Number(i));
  });
  $('transcript').addEventListener('wheel', () => { userScrolledAt = Date.now(); }, { passive: true });
  $('speed').addEventListener('click', () => {
    const at = SPEEDS.indexOf(S.speed);
    S.speed = SPEEDS[(at + 1) % SPEEDS.length] || 1;
    renderSettings();
    if (S.utterance) playIndex(S.index);
    vscode.postMessage({ type: 'setSpeed', speed: S.speed });
    toast('Speed ' + S.speed + '×');
  });
  $('voice').addEventListener('change', () => {
    S.voice = $('voice').value;
    const resumeAt = S.state === 'playing' || S.state === 'loading' ? S.index : null;
    stopOutput();
    if (resumeAt === null && S.state !== 'idle') setState('paused');
    vscode.postMessage({ type: 'setVoice', voice: S.voice, index: resumeAt });
    toast('Voice: ' + $('voice').selectedOptions[0].textContent);
  });
  ['Full', 'Skim'].forEach((m) => $('mode' + m).addEventListener('click', () => {
    const mode = m.toLowerCase();
    if (mode === S.mode && S.chunks.length) return;
    S.mode = mode;
    renderMode();
    if (S.chunks.length) { stopOutput(); vscode.postMessage({ type: 'setMode', mode: mode }); toast(m === 'Skim' ? 'Skimming headings' : 'Reading everything'); }
  }));

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'SELECT') return;
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft' && S.chunks.length) { e.preventDefault(); playIndex(S.index - 1); }
    else if (e.key === 'ArrowRight' && S.chunks.length) { e.preventDefault(); playIndex(S.index + 1); }
    else if (e.key === 'Escape') { stop(); }
  });

  // Extension messages
  window.addEventListener('message', (event) => {
    const m = event.data || {};
    switch (m.command) {
      case 'load':
        stopOutput();
        Object.assign(S, { session: m.session, chunks: m.chunks, mode: m.mode, origin: m.origin, title: m.title, finished: false });
        Object.assign(S, { voice: m.voice, speed: m.speed, engine: m.engine });
        $('title').textContent = m.title || 'AudioWizard';
        $('empty').hidden = true;
        $('transcript').hidden = false;
        userScrolledAt = 0;
        renderTranscript();
        renderMode();
        renderSettings();
        playIndex(m.startIndex || 0);
        break;
      case 'audio':
        if (m.session !== S.session || m.index !== S.waitingFor) return;
        S.waitingFor = null;
        audio.src = m.src;
        audio.playbackRate = S.speed;
        audio.play().catch(() => speakSystem(S.index));
        break;
      case 'audioFailed':
        if (m.session !== S.session || m.index !== S.waitingFor) return;
        S.waitingFor = null;
        speakSystem(S.index);
        break;
      case 'settings':
        Object.assign(S, { voice: m.voice, speed: m.speed, engine: m.engine });
        renderSettings();
        break;
      case 'toggle':
        toggle();
        break;
      case 'stop':
        stop();
        break;
    }
  });

  setState('idle');
  vscode.postMessage({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
