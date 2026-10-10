// The "brain": owns all game state and watches which tab you're on.
importScripts("shared.js");

const DEFAULT = { points: 0, streak: 0, best: 0, owned: [], equipped: null, strikes: 0, session: null, event: null, animal: "retriever", animals: ["retriever"] };
const load = async () => ({ ...DEFAULT, ...(await chrome.storage.local.get("sb")).sb });
const save = s => chrome.storage.local.set({ sb: s });
const evt = (s, type, text) => { s.event = { id: Date.now(), type, text, strikes: s.strikes }; };

function die(s) {
  const lost = Math.round(s.points * CFG.DEATH_PENALTY);
  s.points -= lost; s.streak = 0; s.session = null;
  chrome.alarms.clear("end");
  evt(s, "dead", `Your buddy died 💀 Streak lost and −${lost} points. Outfits are safe. Click the buddy to revive it.`);
}

async function handle(msg) {
  const s = await load();
  if (msg.type === "start" && !s.session) {
    const mins = Number(msg.mins);
    if (s.strikes >= MOODS.length - 1) { s.strikes = 0; evt(s, "revive", ""); }   // revive
    else if (mins > 0) {
      s.strikes = 0;
      s.session = { goal: msg.goal || "Study session", mins, endAt: Date.now() + mins * 60000, onFlagged: false };
      chrome.alarms.create("end", { when: s.session.endAt });
      evt(s, "start", "");
    }
  } else if (msg.type === "giveUp" && s.session) {
    s.session = null; s.streak = 0; chrome.alarms.clear("end"); evt(s, "giveUp", "");
  } else if (msg.type === "item") {
    const it = SHOP.find(i => i.id === msg.id);
    if (it && !s.owned.includes(it.id) && s.points >= it.cost) { s.points -= it.cost; s.owned.push(it.id); s.equipped = it.id; evt(s, "item", ""); }
    else if (it && s.owned.includes(it.id)) { s.equipped = s.equipped === it.id ? null : it.id; if (s.equipped) evt(s, "item", ""); }
  } else if (msg.type === "animal") {
    const a = ANIMALS.find(x => x.id === msg.id);
    if (a && !s.animals.includes(a.id) && s.points >= a.cost) { s.points -= a.cost; s.animals.push(a.id); s.animal = a.id; evt(s, "animal", ""); }
    else if (a && s.animals.includes(a.id) && s.animal !== a.id) { s.animal = a.id; evt(s, "animal", ""); }
  }
  await save(s);
}
chrome.runtime.onMessage.addListener(msg => { handle(msg); });

chrome.alarms.onAlarm.addListener(async a => {
  const s = await load();
  if (a.name !== "end" || !s.session) return;
  const earned = Math.round(s.session.mins * CFG.POINTS_PER_MINUTE);
  s.points += earned; s.streak++; s.best = Math.max(s.best, s.streak); s.session = null;
  evt(s, "win", `Goal complete! +${earned} points. Streak: ${s.streak} 🔥`);
  await save(s);
});

// Penalize once each time you ENTER a flagged site (not every second you stay).
async function check(tab) {
  const s = await load();
  if (!s.session || !tab || !tab.url) return;
  let host = "";
  try { host = new URL(tab.url).hostname; } catch { return; }
  const flagged = FLAGGED.some(d => host === d || host.endsWith("." + d));
  if (!flagged) { if (s.session.onFlagged) { s.session.onFlagged = false; await save(s); } return; }
  if (s.session.onFlagged) return;
  s.session.onFlagged = true;
  s.strikes++; s.points = Math.max(0, s.points - CFG.PENALTY);
  if (s.strikes >= MOODS.length - 1) die(s);
  else evt(s, "warn", `${host} is on your distraction list! −${CFG.PENALTY} points. Buddy feels ${MOODS[s.strikes].key}.`);
  await save(s);
}
chrome.tabs.onActivated.addListener(async ({ tabId }) => check(await chrome.tabs.get(tabId)));
chrome.tabs.onUpdated.addListener((id, ch, tab) => { if (tab.active && (ch.url || ch.status === "complete")) check(tab); });
chrome.windows.onFocusChanged.addListener(async w => {
  if (w === chrome.windows.WINDOW_ID_NONE) return;
  const [t] = await chrome.tabs.query({ active: true, windowId: w });
  check(t);
});
