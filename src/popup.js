async function render() {
  const settings = await chrome.storage.sync.get({
    token: "",
    owner: "",
    repo: "",
    branch: "main",
    autoSyncEnabled: true,
  });
  const { syncHistory = [] } = await chrome.storage.local.get("syncHistory");

  const dot = document.getElementById("statusDot");
  const repoLine = document.getElementById("repoLine");
  const historyEl = document.getElementById("history");

  const configured = settings.token && settings.owner && settings.repo;
  const active = configured && settings.autoSyncEnabled;
  dot.className = "status-dot " + (active ? "on" : "off");

  if (configured) {
    repoLine.className = "repo-line";
    repoLine.innerHTML = `<span class="arrow">→</span> ${settings.owner}/${settings.repo}@${settings.branch}`;
  } else {
    repoLine.className = "repo-line unconfigured";
    repoLine.textContent = "Not configured — open settings below";
  }

  if (syncHistory.length === 0) {
    historyEl.innerHTML = `<div class="empty">No solutions synced yet.<br/>Solve something on LeetCode.</div>`;
    return;
  }

  historyEl.innerHTML = syncHistory
    .slice(0, 8)
    .map(
      (item, i) => `
      <div class="history-item" style="animation-delay: ${i * 35}ms">
        <span class="title">${escapeHtml(item.title)}</span>
        <span class="diff ${item.difficulty}">${item.difficulty}</span>
      </div>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

render();
