// MV3 service worker. Receives accepted-submission payloads from the
// content script and pushes them to GitHub via the Contents API.

const LANG_EXT = {
  python: "py",
  python3: "py",
  java: "java",
  "c++": "cpp",
  c: "c",
  "c#": "cs",
  javascript: "js",
  typescript: "ts",
  php: "php",
  swift: "swift",
  kotlin: "kt",
  dart: "dart",
  golang: "go",
  ruby: "rb",
  scala: "scala",
  rust: "rs",
  racket: "rkt",
  erlang: "erl",
  elixir: "ex",
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_SOLUTION") {
    console.log("[LeetPush] background received SYNC_SOLUTION", message.payload);
    handleSync(message.payload)
      .then(() => {
        console.log("[LeetPush] sync succeeded for", message.payload.title);
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error("[LeetPush] sync failed", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // keep the message channel open for the async response
  }
  if (message.type === "MANUAL_SYNC_TEST") {
    testConnection()
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

async function handleSync(payload) {
  const settings = await getSettings();
  if (!settings.autoSyncEnabled) {
    console.warn("[LeetPush] auto-sync is turned OFF in settings — skipping.");
    return;
  }
  if (!settings.token || !settings.owner || !settings.repo) {
    console.warn("[LeetPush] GitHub not configured yet — open the extension options.");
    return;
  }

  const ext = LANG_EXT[payload.lang?.toLowerCase()] || "txt";
  const folder = `${settings.groupByDifficulty ? payload.difficulty + "/" : ""}${payload.titleSlug}`;
  const solutionPath = `${folder}/solution.${ext}`;
  const readmePath = `${folder}/README.md`;

  const readmeBody = buildReadme(payload);

  await putFile(settings, solutionPath, payload.code, `LeetPush: add solution for ${payload.title}`);
  await putFile(settings, readmePath, readmeBody, `LeetPush: add problem statement for ${payload.title}`);

  await recordStat(payload);
  notifySynced(payload);
}

function notifySynced(payload) {
  // Native notification — rendered by the OS/browser chrome, not the page,
  // so it can't be blocked by the host page's CSS or CSP (unlike an
  // in-page toast, which some sites' Content-Security-Policy prevents from
  // being styled/shown at all).
  chrome.notifications.create(`leetpush-${payload.submissionId}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "LeetPush",
    message: `Synced "${payload.title}" to GitHub`,
    priority: 1,
  });

  // Also flash a quick checkmark on the toolbar icon as a secondary cue.
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#2ea043" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 4000);
}

function buildReadme(payload) {
  const plainText = htmlToText(payload.contentHtml || "");
  return [
    `# ${payload.title}`,
    "",
    `**Difficulty:** ${payload.difficulty}`,
    payload.tags?.length ? `**Tags:** ${payload.tags.join(", ")}` : "",
    payload.runtime ? `**Runtime:** ${payload.runtime}` : "",
    payload.memory ? `**Memory:** ${payload.memory}` : "",
    "",
    "## Problem",
    "",
    plainText,
    "",
    `[View on LeetCode](https://leetcode.com/problems/${payload.titleSlug}/)`,
  ]
    .filter(Boolean)
    .join("\n");
}

function htmlToText(html) {
  // Service workers have no DOM, so strip tags manually.
  return html
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function putFile(settings, path, content, message) {
  const apiUrl = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${encodeURI(
    path
  )}`;
  const headers = {
    Authorization: `Bearer ${settings.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Look up existing sha (needed to update rather than create).
  let sha;
  const getRes = await fetch(`${apiUrl}?ref=${settings.branch || "main"}`, { headers });
  if (getRes.status === 200) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = {
    message,
    content: b64EncodeUnicode(content),
    branch: settings.branch || "main",
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API error (${putRes.status}) for ${path}: ${errText}`);
  }
}

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function recordStat(payload) {
  const { syncHistory = [] } = await chrome.storage.local.get("syncHistory");
  syncHistory.unshift({
    title: payload.title,
    slug: payload.titleSlug,
    difficulty: payload.difficulty,
    lang: payload.lang,
    timestamp: Date.now(),
  });
  await chrome.storage.local.set({
    syncHistory: syncHistory.slice(0, 50),
    lastSynced: { title: payload.title, timestamp: Date.now() },
  });
}

async function getSettings() {
  const defaults = {
    token: "",
    owner: "",
    repo: "",
    autoSyncEnabled: true,
    branch: "main",
    groupByDifficulty: false,
  };
  const stored = await chrome.storage.sync.get(defaults);
  return stored;
}

async function testConnection() {
  const settings = await getSettings();
  if (!settings.token) return { ok: false, error: "No token saved yet." };
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${settings.token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return { ok: false, error: `GitHub responded with ${res.status}` };
  const user = await res.json();
  return { ok: true, username: user.login };
}
