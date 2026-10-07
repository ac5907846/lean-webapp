// Motion helpers: count-ups that carry from the previous value, a tour runner that pauses on any interaction,
// and a reduced-motion switch. No dependencies.
window.M = (function () {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const raf = window.requestAnimationFrame ? (f) => window.requestAnimationFrame(f) : (f) => setTimeout(() => f(performance.now()), 16);
  const fmt = (v, d, raw) => (raw ? String(Math.round(v)) : d ? v.toFixed(d) : Math.round(v).toLocaleString("en-US"));
  const current = new WeakMap();

  function countTo(el, value, { decimals = 0, suffix = "", ms = 700, raw = false } = {}) {
    const from = current.get(el) ?? 0;
    current.set(el, value);
    if (reduced || ms === 0 || from === value) { el.textContent = fmt(value, decimals, raw) + suffix; return; }
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const t = Math.min(1, (now - t0) / ms);
      el.textContent = fmt(from + (value - from) * ease(t), decimals, raw) + suffix;
      if (t < 1 && current.get(el) === value) raf(step);
    }
    raf(step);
  }

  // A tour: an ordered list of steps {ms, enter()}; autoplays once, pauses on any pointer, key, wheel or touch.
  function tour({ steps, button, progress, onPause, onPlay, loop = true }) {
    let i = -1, timer = null, playing = false, startedAt = 0, remaining = 0, bar = null;
    const setBtn = () => { if (button) button.textContent = playing ? "Pause" : "Play"; };
    function tick() {
      if (!playing || !progress) return;
      const el = steps[i] ? (performance.now() - startedAt) / steps[i].ms : 0;
      progress.style.width = Math.min(100, el * 100) + "%";
      bar = raf(tick);
    }
    function go(n) {
      i = n % steps.length;
      steps[i].enter();
      startedAt = performance.now();
      remaining = steps[i].ms;
      clearTimeout(timer);
      timer = setTimeout(() => { if (playing) { if (i + 1 < steps.length || loop) go(i + 1); else pause(); } }, reduced ? 0 : remaining);
      if (reduced && i + 1 >= steps.length) pause();
    }
    function play() { if (playing) return; playing = true; setBtn(); onPlay && onPlay(); if (i < 0) go(0); else resume(); tick(); }
    function resume() { startedAt = performance.now() - (steps[i].ms - remaining); clearTimeout(timer); timer = setTimeout(() => go(i + 1), remaining); }
    function pause() { if (!playing) return; playing = false; setBtn(); clearTimeout(timer); remaining = Math.max(0, steps[i].ms - (performance.now() - startedAt)); onPause && onPause(); }
    const stop = () => pause();
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => window.addEventListener(e, (ev) => { if (button && ev.target === button) return; stop(); }, { passive: true }));
    if (button) button.addEventListener("click", () => (playing ? pause() : play()));
    setBtn();
    return { play, pause, go, get playing() { return playing; }, get index() { return i; } };
  }

  return { countTo, tour, reduced, raf };
})();
