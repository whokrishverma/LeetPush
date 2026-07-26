// Isolated-world content script. Injects inject.js into the page context,
// listens for the messages it posts, enriches them with problem metadata
// (fetched from LeetCode's GraphQL API), and forwards everything to the
// background service worker for the actual GitHub sync.

(function () {
  console.log("[LeetPush] content script loaded on", location.href);

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/inject.js");
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg.source !== "leetpush-inject") return;

    if (msg.type === "ACCEPTED_SUBMISSION") {
      console.log("[LeetPush] content-script received ACCEPTED_SUBMISSION", msg.payload);
      try {
        const meta = await fetchProblemMetadata(msg.payload.slug);
        console.log("[LeetPush] fetched problem metadata", meta);
        chrome.runtime.sendMessage(
          { type: "SYNC_SOLUTION", payload: { ...msg.payload, ...meta } },
          (res) => {
            if (chrome.runtime.lastError) {
              console.error("[LeetPush] sendMessage error", chrome.runtime.lastError.message);
              return;
            }
            console.log("[LeetPush] background responded", res);
            if (res && res.ok) {
              showToast(`Synced "${meta.title}" to GitHub`);
            } else {
              showToast(`Sync failed — check the extension console`, "err");
            }
          }
        );
      } catch (err) {
        console.error("[LeetPush] failed to gather metadata", err);
        showToast(`LeetPush error: ${err.message}`, "err");
      }
    }
  });

  async function fetchProblemMetadata(slug) {
    const query = {
      query: `
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            titleSlug
            difficulty
            content
            topicTags { name }
          }
        }
      `,
      variables: { titleSlug: slug },
    };

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    const json = await res.json();
    const q = json.data.question;
    return {
      title: q.title,
      titleSlug: q.titleSlug,
      difficulty: q.difficulty,
      contentHtml: q.content,
      tags: q.topicTags.map((t) => t.name),
    };
  }

  function showToast(message, kind = "ok") {
    const el = document.createElement("div");
    const accent = kind === "ok" ? "#2ea043" : "#f85149";
    el.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${accent};margin-right:9px;"></span>${message}`;

    const s = el.style;
    s.setProperty("position", "fixed", "important");
    s.setProperty("top", "16px", "important");
    s.setProperty("right", "16px", "important");
    s.setProperty("z-index", "2147483647", "important");
    s.setProperty("display", "flex", "important");
    s.setProperty("align-items", "center", "important");
    s.setProperty("background", "#161b22", "important");
    s.setProperty("border", "1px solid #30363d", "important");
    s.setProperty("color", "#e6edf3", "important");
    s.setProperty("padding", "10px 16px", "important");
    s.setProperty("border-radius", "10px", "important");
    s.setProperty(
      "font",
      '13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "important"
    );
    s.setProperty("box-shadow", "0 8px 24px rgba(0,0,0,.4)", "important");
    s.setProperty("opacity", "0", "important");
    s.setProperty("transform", "translateY(-8px)", "important");
    s.setProperty("transition", "opacity .25s ease, transform .25s ease", "important");
    s.setProperty("pointer-events", "none", "important");

    // Attach to <html> rather than <body> — some sites apply a CSS transform
    // to <body> (common scroll-lock trick for modals), which breaks
    // position:fixed for any children of that element.
    document.documentElement.appendChild(el);
    requestAnimationFrame(() => {
      s.setProperty("opacity", "1", "important");
      s.setProperty("transform", "translateY(0)", "important");
    });
    setTimeout(() => {
      s.setProperty("opacity", "0", "important");
      s.setProperty("transform", "translateY(-8px)", "important");
      setTimeout(() => el.remove(), 300);
    }, 3500);
    console.log("[LeetPush] toast shown:", message);
  }
})();
