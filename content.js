// The "face": a draggable buddy injected into every page (inside a shadow DOM so site CSS can't touch it).
(() => {
  if (window.top !== window) return;
  const W = 90, H = 110;
  let state = null, pos = { left: innerWidth - 120, top: innerHeight - 150 }, open = false, lastEvt = null, drag = null;

  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:system-ui,sans-serif;}
    #pet{width:${W}px;cursor:grab;user-select:none;touch-action:none;position:relative;text-align:center;}
    #pet:active{cursor:grabbing;}
    .bubble{position:absolute;top:-10px;right:-6px;font-size:24px;}
    .outfit{height:30px;font-size:30px;line-height:30px;}
    .body{width:${W}px;height:${W - 10}px;background:#ffd36e;border-radius:50% 50% 45% 45%;display:flex;align-items:center;justify-content:center;font-size:46px;transition:background .3s;}
    .meh .body{background:#e6e3d9}.sad .body{background:#bcd0ff}.upset .body{background:#ffb4a8}.dead .body{background:#c9c9c9;transform:rotate(90deg);filter:grayscale(1)}
    .happy .body{animation:b 1.2s ease-in-out infinite}@keyframes b{50%{transform:translateY(-5px)}}
    @media (prefers-reduced-motion:reduce){.happy .body{animation:none}}
    #time{font-weight:800;font-size:15px;color:#26244a;background:#fff;border-radius:8px;padding:1px 6px;display:inline-block;margin-top:3px;}
    #panel{position:absolute;width:250px;background:#fff;color:#26244a;border-radius:14px;padding:12px;box-shadow:0 4px 18px rgba(0,0,0,.25);font-size:13px;}
    #panel h4{margin:0 0 6px;font-size:14px}
    h5{margin:8px 0 4px;font-size:12px;color:#6b6890}
    input{width:100%;padding:7px;border:1px solid #ccc;border-radius:8px;font:inherit;margin-bottom:6px}
    button{font:inherit;border:0;border-radius:8px;padding:7px 10px;background:#6f5ef0;color:#fff;cursor:pointer}
    button.g{background:#e8e6fb;color:#26244a}button:disabled{opacity:.45;cursor:default}
    .row{display:flex;gap:6px;margin:6px 0}.row>*{flex:1}
    .shop{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
    .it{border:2px solid #e8e6fb;border-radius:9px;padding:4px;text-align:center;font-size:11px}.it.on{border-color:#6f5ef0}
    .it .e{font-size:20px}.it button{width:100%;padding:3px;font-size:11px;margin-top:3px}
    #speech{position:absolute;top:24px;width:max-content;max-width:190px;background:#fff;color:#26244a;border:2px solid #6f5ef0;border-radius:14px;padding:8px 12px;font-size:13px;font-weight:600;box-shadow:0 3px 12px rgba(0,0,0,.2);pointer-events:none;opacity:0;transition:opacity .25s}
    #speech.show{opacity:1}
    #banner{position:fixed;top:16px;left:50%;transform:translateX(-50%);max-width:420px;background:#e5484d;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.3);display:none;text-align:center}
    #banner.win{background:#2fa66a}
  </style>
  <div id="banner"></div>
  <div id="speech"></div>
  <div id="panel" hidden></div>
  <div id="pet"></div>`;
  document.documentElement.appendChild(host);
  const $ = id => root.getElementById(id), pet = $("pet"), panel = $("panel"), banner = $("banner"), speech = $("speech");
  const send = m => chrome.runtime.sendMessage(m);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };

  function place() {
    pos.left = clamp(pos.left, 0, innerWidth - W); pos.top = clamp(pos.top, 0, innerHeight - H);
    host.style.left = pos.left + "px"; host.style.top = pos.top + "px";
    panel.style.cssText = (pos.top > innerHeight / 2 ? "bottom:" + (H + 6) + "px;" : "top:" + (H + 6) + "px;") +
                          (pos.left > innerWidth / 2 ? "right:0;" : "left:0;");
    const right = pos.left > innerWidth / 2;   // speech bubble goes toward the middle of the screen
    speech.style.left = right ? "auto" : (W + 10) + "px"; speech.style.right = right ? (W + 10) + "px" : "auto";
  }

  function render() {
    if (!state) return;
    const m = MOODS[state.strikes], it = SHOP.find(i => i.id === state.equipped), an = ANIMALS.find(a => a.id === state.animal) || ANIMALS[0];
    pet.className = m.key;
    pet.innerHTML = `<div class="bubble">${m.emoji}</div><div class="outfit">${it ? it.emoji : ""}</div>
      <div class="body"><span>${an.emoji}</span></div><span id="time">${state.session ? fmt(state.session.endAt - Date.now()) : "⭐ " + state.points}</span>`;
    const dead = state.strikes >= MOODS.length - 1;
    panel.innerHTML = `<h4>⭐ ${state.points} &nbsp; 🔥 ${state.streak} <small>(best ${state.best})</small></h4>` +
      (state.session
        ? `<div>Focusing on: <b></b></div><div class="row"><button class="g" data-a="giveUp">Give up</button></div>`
        : dead
          ? `<div class="row"><button data-a="start">Revive buddy</button></div>`
          : `<input id="goal" placeholder="Study goal"><input id="mins" type="number" min="0.1" step="0.1" value="25">
             <div class="row"><button data-a="start">Start</button></div>`) +
      `<h5>Buddies</h5><div class="shop">${ANIMALS.map(a => {
        const owned = state.animals.includes(a.id), on = state.animal === a.id;
        return `<div class="it ${on ? "on" : ""}"><div class="e">${a.emoji}</div>${a.name}
          <button data-a="animal" data-id="${a.id}" ${!owned && state.points < a.cost ? "disabled" : ""}>${on ? "Active" : owned ? "Choose" : "⭐" + a.cost}</button></div>`;
      }).join("")}</div><h5>Accessories</h5><div class="shop">${SHOP.map(i => {
        const owned = state.owned.includes(i.id), on = state.equipped === i.id;
        return `<div class="it ${on ? "on" : ""}"><div class="e">${i.emoji}</div>${i.name}
          <button data-a="item" data-id="${i.id}" ${!owned && state.points < i.cost ? "disabled" : ""}>${on ? "Remove" : owned ? "Wear" : "⭐" + i.cost}</button></div>`;
      }).join("")}</div>
      <div class="row"><button class="g" data-a="share">Share streak</button></div>`;
    if (state.session) panel.querySelector("b").textContent = state.session.goal; // textContent = safe
  }

  panel.addEventListener("click", e => {
    const a = e.target.dataset.a; if (!a) return;
    if (a === "start") { const g = $("goal"), mn = $("mins"); send({ type: "start", goal: g ? g.value.trim() : "", mins: mn ? mn.value : 0 }); }
    else if (a === "giveUp") send({ type: "giveUp" });
    else if (a === "item") send({ type: "item", id: e.target.dataset.id });
    else if (a === "animal") send({ type: "animal", id: e.target.dataset.id });
    else if (a === "share") navigator.clipboard.writeText(`My Study Buddy is on a ${state.streak}-session streak 🔥 (best: ${state.best}). Can you beat it?`);
  });
  panel.addEventListener("keydown", e => e.stopPropagation()); // don't trigger site shortcuts while typing

  // Drag to move; a click without movement toggles the panel.
  pet.addEventListener("pointerdown", e => { drag = { dx: e.clientX - pos.left, dy: e.clientY - pos.top, sx: e.clientX, sy: e.clientY, moved: false }; pet.setPointerCapture(e.pointerId); });
  pet.addEventListener("pointermove", e => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
    if (drag.moved) { pos.left = e.clientX - drag.dx; pos.top = e.clientY - drag.dy; place(); }
  });
  pet.addEventListener("pointerup", () => {
    if (!drag) return;
    if (drag.moved) chrome.storage.local.set({ sbPos: pos }); else { open = !open; panel.hidden = !open; }
    drag = null;
  });
  addEventListener("resize", place);

  // Sound + warning banner
  let ctx;
  function beep(freqs) {
    try {
      ctx = ctx || new AudioContext(); ctx.resume();
      freqs.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = f; g.gain.value = 0.05;
        o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * .15); o.stop(ctx.currentTime + (i + 1) * .15); });
    } catch (e) {}
  }
  let speechTimer;
  function speak(text) {
    speech.textContent = text; speech.classList.add("show");
    clearTimeout(speechTimer); speechTimer = setTimeout(() => speech.classList.remove("show"), 5000);
  }
  function showEvent(ev) {
    if (ev.text) {   // big banner + sound only for warn / win / dead
      banner.textContent = ev.text; banner.className = ev.type === "win" ? "win" : "";
      banner.style.display = "block"; setTimeout(() => banner.style.display = "none", 6000);
      beep(ev.type === "win" ? [523, 659, 784] : [400, 300, 200]);
    }
    if (ev.type === "animal") { const a = ANIMALS.find(x => x.id === state.animal) || ANIMALS[0]; speak(`${a.sound}! Nice to meet you!`); return; }
    const p = PHRASES[ev.type];
    if (p) speak(ev.type === "warn" ? pick(p[Math.min(ev.strikes, p.length) - 1]) : pick(p));
  }

  chrome.storage.onChanged.addListener(ch => {
    if (ch.sbPos && !drag) { pos = ch.sbPos.newValue; place(); }
    if (ch.sb) {
      state = ch.sb.newValue; render();
      const ev = state.event;
      if (ev && ev.id !== lastEvt) { lastEvt = ev.id; if (!document.hidden) showEvent(ev); }
    }
  });
  setInterval(() => { if (state && state.session && !document.hidden && Math.random() < 0.5) speak(pick(PHRASES.idle)); }, 90000); // random cheer while studying
  setInterval(() => { const t = $("time"); if (t && state && state.session) t.textContent = fmt(state.session.endAt - Date.now()); }, 500);

  chrome.storage.local.get(["sb", "sbPos"]).then(r => {
    state = { points: 0, streak: 0, best: 0, owned: [], equipped: null, strikes: 0, session: null, event: null, animal: "retriever", animals: ["retriever"], ...r.sb };
    if (r.sbPos) pos = r.sbPos;
    lastEvt = state.event ? state.event.id : null;
    place(); render();
  });
})();
