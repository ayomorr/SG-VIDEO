// Scroll Detect Web Tracker — background service worker (Manifest V3)
//
// Tracks active time per site by reacting to tab activation changes and
// window focus changes. Time is stored in chrome.storage.local as:
//   todaySessions: Array<{ domain, startAt, endAt }>
//   today:         "YYYY-MM-DD" (so we can reset at midnight)

const SOCIAL_DOMAINS = {
  "twitter.com": { app: "X (Web)", category: "news", pull: 0.95 },
  "x.com": { app: "X (Web)", category: "news", pull: 0.95 },
  "instagram.com": { app: "Instagram (Web)", category: "social", pull: 0.9 },
  "tiktok.com": { app: "TikTok (Web)", category: "shorts", pull: 1 },
  "youtube.com": { app: "YouTube (Web)", category: "video", pull: 0.85 },
  "reddit.com": { app: "Reddit (Web)", category: "social", pull: 0.8 },
  "facebook.com": { app: "Facebook (Web)", category: "social", pull: 0.6 },
  "threads.net": { app: "Threads (Web)", category: "social", pull: 0.85 },
};

let activeInfo = null; // { tabId, domain, since }
let lastToday = dateKey();
let lastWrite = 0;

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function shortDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [base, meta] of Object.entries(SOCIAL_DOMAINS)) {
      if (host === base || host.endsWith("." + base)) return meta;
    }
  } catch (_) {}
  return null;
}

async function readToday() {
  const today = dateKey();
  if (lastToday !== today) {
    lastToday = today;
    await chrome.storage.local.set({ trackerToday: today, todaySessions: [] });
  }
  const { trackerToday, todaySessions } = await chrome.storage.local.get([
    "trackerToday",
    "todaySessions",
  ]);
  return {
    today: trackerToday || today,
    sessions: Array.isArray(todaySessions) ? todaySessions : [],
  };
}

async function closeActive(now) {
  if (!activeInfo) return;
  const delta = now - activeInfo.since;
  if (delta < 3000) {
    // Too short (tab switch, window refocus). Ignore as noise.
    activeInfo = null;
    return;
  }
  const { today, sessions } = await readToday();
  sessions.push({
    domain: activeInfo.domain,
    app: activeInfo.meta.app,
    category: activeInfo.meta.category,
    startAt: activeInfo.since,
    endAt: now,
    source: "auto",
  });
  await chrome.storage.local.set({ todaySessions: sessions, trackerToday: today });
  activeInfo = null;
  lastWrite = now;
}

async function beginForTab(tabId) {
  const now = Date.now();
  await closeActive(now);
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab || !tab.url) return;
  const meta = shortDomain(tab.url);
  if (!meta) return;
  activeInfo = { tabId, meta, since: now };
}

async function checkWindowsFocused() {
  if (typeof chrome.windows === "undefined") return;
  const win = await chrome.windows.getLastFocused({ populate: false }).catch(() => null);
  if (win && win.focused) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
    if (tab?.id) await beginForTab(tab.id);
  } else {
    await closeActive(Date.now());
  }
}

chrome.tabs.onActivated.addListener((info) => beginForTab(info.tabId));
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (activeInfo && tabId === activeInfo.tabId && changeInfo.url) {
    await beginForTab(tabId);
  }
});
chrome.tabs.onRemoved.addListener((_id) => closeActive(Date.now()));
chrome.windows?.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) closeActive(Date.now());
  else checkWindowsFocused();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ trackerToday: dateKey(), todaySessions: [] });
});

// Response to "getSummary" from the popup.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "getSummary") {
    readToday().then(({ today, sessions }) => {
      const totals = {};
      for (const s of sessions) {
        totals[s.app] = (totals[s.app] || 0) + (s.endAt - s.startAt);
      }
      sendResponse({ today, sessions, totals });
    });
    return true;
  }
  return false;
});