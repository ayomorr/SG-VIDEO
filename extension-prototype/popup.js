function fmtMs(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  return h + "h " + (m % 60) + "m";
}

function render(summary) {
  document.getElementById("dateLine").textContent = "Today · " + summary.today;
  const list = document.getElementById("list");
  const entries = Object.entries(summary.totals).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    list.innerHTML = '<li class="empty">No tracked social web use yet today.</li>';
    return;
  }
  list.innerHTML = entries
    .map(([app, ms]) => `<li><span>${app}</span><strong>${fmtMs(ms)}</strong></li>`)
    .join("");
}

chrome.runtime.sendMessage({ type: "getSummary" }, render);

document.getElementById("export").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "getSummary" }, (summary) => {
    // Shape matches lib/engine/types.ts `Session` so it can flow straight into
    // the existing detection → insights → predictions pipeline.
    const sessions = summary.sessions.map((s) => ({
      id: "ext-" + s.startAt + "-" + s.endAt,
      app: s.app,
      category: s.category,
      startAt: s.startAt,
      endAt: s.endAt,
      moodBefore: null,
      moodAfter: null,
      note: "Imported from browser extension",
      source: "auto",
    }));
    const out = document.getElementById("out");
    out.hidden = false;
    out.value = JSON.stringify(sessions, null, 2);
  });
});

// "Send to dashboard": opens the Scroll Detect /app route with today's
// sessions encoded in a ?import= query param. The dashboard imports them into
// its own localStorage pipeline on mount (lib/import-sessions.ts).
document.getElementById("send").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "getSummary" }, (summary) => {
    const sessions = summary.sessions.map((s) => ({
      id: "ext-" + s.startAt + "-" + s.endAt,
      app: s.app,
      category: s.category,
      startAt: s.startAt,
      endAt: s.endAt,
      moodBefore: null,
      moodAfter: null,
      note: "Imported from browser extension",
      source: "auto",
    }));
    if (sessions.length === 0) return;
    const json = JSON.stringify(sessions);
    const enc = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
    // Change this if your deployment is not scrolldictive.app
    const base = "https://scrolldictive.app/app";
    chrome.tabs.create({ url: base + "?import=" + encodeURIComponent(enc) });
  });
});

document.getElementById("clear").addEventListener("click", async () => {
  await chrome.storage.local.set({ todaySessions: [], trackerToday: new Date().toISOString().slice(0, 10) });
  chrome.runtime.sendMessage({ type: "getSummary" }, render);
});