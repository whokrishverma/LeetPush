// Runs in the PAGE's own JS context (not the isolated content-script world).
// This is required because we need to hook the same network calls that
// LeetCode's React app itself makes — whether it uses fetch() or XHR.

(function () {
  const DEBUG = true;
  const log = (...args) => DEBUG && console.log("[LeetPush]", ...args);

  const CHECK_URL_RE = /\/submissions\/detail\/(\d+)\/(?:v2\/)?check\/?(?:\?|$)/;

  const pendingSubmissions = new Map(); // submissionId -> { lang, typed_code, question_id, slug }

  function diagLog(source, url, method) {
    if (/submission|check|graphql/i.test(url)) {
      log(`[diag:${source}]`, method || "", url);
    }
  }

  function handleSubmitCapture(url, bodyStr) {
    const submitMatch = url.match(/\/problems\/([^/]+)\/submit\/?$/);
    if (!submitMatch) return null;
    try {
      const body = JSON.parse(bodyStr);
      log("captured submit request for", submitMatch[1], body);
      return { slug: submitMatch[1], body };
    } catch (e) {
      log("failed to parse submit body", e);
      return null;
    }
  }

  function handleSubmitResponse(captured, responseJson) {
    if (!captured || !responseJson || !responseJson.submission_id) return;
    pendingSubmissions.set(String(responseJson.submission_id), {
      ...captured.body,
      slug: captured.slug,
    });
    log("cached pending submission", responseJson.submission_id, captured.slug);
  }

  function handleCheckResponse(url, data) {
    const checkMatch = url.match(CHECK_URL_RE);
    if (!checkMatch) return;
    const submissionId = checkMatch[1];
    if (!data) return;

    // Old-style responses report {state: "PENDING" | "STARTED"} while running,
    // then {state: "SUCCESS", status_msg: "..."} when done.
    // Newer /v2/check/ responses skip "state" entirely once finished and
    // instead include status_code / run_success directly.
    const stillRunning = data.state === "PENDING" || data.state === "STARTED";
    if (stillRunning) return;

    const isFinished =
      data.state === "SUCCESS" || data.run_success !== undefined || data.status_code !== undefined;
    if (!isFinished) return;

    const accepted = data.status_msg === "Accepted" || data.status_code === 10;
    log("check resolved", submissionId, "accepted:", accepted, data.status_msg ?? data.status_code);

    const submitInfo = pendingSubmissions.get(submissionId);

    if (accepted) {
      if (!submitInfo) {
        log("⚠️ Accepted but no cached submit info for", submissionId, "- was the submit call captured?");
      } else {
        log("✅ dispatching ACCEPTED_SUBMISSION", submitInfo.slug);
        window.postMessage(
          {
            source: "leetpush-inject",
            type: "ACCEPTED_SUBMISSION",
            payload: {
              slug: submitInfo.slug,
              lang: submitInfo.lang,
              code: submitInfo.typed_code,
              runtime: data.status_runtime || data.display_runtime,
              memory: data.memory,
              submissionId,
            },
          },
          "*"
        );
      }
    }
    pendingSubmissions.delete(submissionId);
  }

  // ---- Patch fetch ----
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [resource, config] = args;
    const url = typeof resource === "string" ? resource : resource.url;
    diagLog("fetch", url, config && config.method);

    const captured =
      config && config.method === "POST" ? handleSubmitCapture(url, config.body) : null;

    const response = await originalFetch.apply(this, args);

    if (captured) {
      response
        .clone()
        .json()
        .then((data) => handleSubmitResponse(captured, data))
        .catch(() => {});
    }

    if (CHECK_URL_RE.test(url)) {
      response
        .clone()
        .json()
        .then((data) => handleCheckResponse(url, data))
        .catch(() => {});
    }

    return response;
  };

  // ---- Patch XMLHttpRequest (LeetCode uses this for some requests) ----
  const OriginalXHR = window.XMLHttpRequest;
  function PatchedXHR() {
    const xhr = new OriginalXHR();
    let _url = "";
    let _method = "";
    let _captured = null;

    const originalOpen = xhr.open;
    xhr.open = function (method, url, ...rest) {
      _url = url;
      _method = method;
      return originalOpen.call(xhr, method, url, ...rest);
    };

    const originalSend = xhr.send;
    xhr.send = function (body) {
      diagLog("xhr", _url, _method);
      if (_method === "POST" && typeof body === "string") {
        _captured = handleSubmitCapture(_url, body);
      }

      xhr.addEventListener("load", function () {
        try {
          const data = JSON.parse(xhr.responseText);
          if (_captured) handleSubmitResponse(_captured, data);
          if (CHECK_URL_RE.test(_url)) {
            handleCheckResponse(_url, data);
          }
        } catch (e) {
          /* not JSON, ignore */
        }
      });

      return originalSend.call(xhr, body);
    };

    return xhr;
  }
  window.XMLHttpRequest = PatchedXHR;

  log("hooks installed (fetch + XHR)");
})();
