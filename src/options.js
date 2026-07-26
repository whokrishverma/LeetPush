const els = {
  token: document.getElementById("token"),
  owner: document.getElementById("owner"),
  repo: document.getElementById("repo"),
  branch: document.getElementById("branch"),
  groupByDifficulty: document.getElementById("groupByDifficulty"),
  autoSyncEnabled: document.getElementById("autoSyncEnabled"),
  status: document.getElementById("status"),
  saveBtn: document.getElementById("save"),
};

async function load() {
  const defaults = {
    token: "",
    owner: "",
    repo: "",
    branch: "main",
    groupByDifficulty: false,
    autoSyncEnabled: true,
  };
  const stored = await chrome.storage.sync.get(defaults);
  els.token.value = stored.token;
  els.owner.value = stored.owner;
  els.repo.value = stored.repo;
  els.branch.value = stored.branch;
  els.groupByDifficulty.checked = stored.groupByDifficulty;
  els.autoSyncEnabled.checked = stored.autoSyncEnabled;
}

async function save({ silent = false } = {}) {
  await chrome.storage.sync.set({
    token: els.token.value.trim(),
    owner: els.owner.value.trim(),
    repo: els.repo.value.trim(),
    branch: els.branch.value.trim() || "main",
    groupByDifficulty: els.groupByDifficulty.checked,
    autoSyncEnabled: els.autoSyncEnabled.checked,
  });
  if (!silent) {
    setStatus("Settings saved", "ok");
    els.saveBtn.classList.add("saved");
    setTimeout(() => els.saveBtn.classList.remove("saved"), 1400);
  }
}

function setStatus(text, kind) {
  els.status.textContent = text;
  els.status.className = `show ${kind}`;
}

els.saveBtn.addEventListener("click", () => save());

document.getElementById("test").addEventListener("click", async () => {
  setStatus("Testing connection…", "pending");
  await save({ silent: true });
  chrome.runtime.sendMessage({ type: "MANUAL_SYNC_TEST" }, (res) => {
    if (res && res.ok) {
      setStatus(`Connected as ${res.username}`, "ok");
    } else {
      setStatus(res?.error || "Connection failed", "err");
    }
  });
});

load();
