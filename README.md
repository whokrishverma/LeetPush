# 🚀 LeetPush

> A Chrome Extension that automatically syncs your accepted LeetCode solutions to a GitHub repository with organized folders, solution files, and beautifully generated README files.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![GitHub API](https://img.shields.io/badge/GitHub-Contents_API-black)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)

---
# LeetPush — LeetCode → GitHub Auto-Sync (Chrome Extension)

Automatically pushes your **Accepted** LeetCode submissions to a GitHub repo,
each with a `solution.<ext>` file and a `README.md` containing the problem
statement, difficulty, tags, runtime, and memory stats.

## How it works

1. A content script injects a small script into the LeetCode page that hooks
   `window.fetch` to watch for:
   - the `submit/` request (captures your code + language)
   - the `submissions/detail/<id>/check/` polling request (tells us when the
     judge returns `Accepted`)
2. Once accepted, the content script fetches the problem's title, difficulty,
   tags, and description via LeetCode's public GraphQL API.
3. Everything is sent to the background service worker, which uses the
   [GitHub Contents API](https://docs.github.com/en/rest/repos/contents) to
   create or update the files in your repo.

No LeetCode credentials ever leave your browser — we only read data already
loaded into the page you're looking at.

## Setup

### 1. Load the extension
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder

### 2. Create a GitHub repo
Create an empty repo (e.g. `leetcode-solutions`) on GitHub — public or
private, either works.

### 3. Create a Personal Access Token
Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new):
- **Classic token:** scope = `repo`
- **Fine-grained token:** grant it access to your solutions repo with
  **Contents: Read and write** permission

### 4. Configure the extension
Click the extension icon → **Open Settings**, then fill in:
- GitHub token
- Repo owner (your username or org)
- Repo name
- Branch (defaults to `main`)
- Optionally: group solutions into `Easy/ Medium/ Hard` folders

Click **Test Connection** to confirm the token works, then **Save Settings**.

### 5. Solve a problem
Go solve any LeetCode problem. The moment your submission comes back
**Accepted**, you'll see a small toast notification and the solution will
appear in your GitHub repo within a couple seconds.

## Repo structure produced

```
two-sum/
  solution.py
  README.md
```

or, with "group by difficulty" enabled:

```
Easy/
  two-sum/
    solution.py
    README.md
```

## Notes & limitations

- Works on `leetcode.com` (not currently tested against regional mirrors
  like `leetcode.cn`).
- Only the **most recently accepted** submission for a problem is kept —
  re-solving a problem overwrites the previous solution file.
- The Contents API does one commit per file, so an accepted submission
  produces two commits (solution + README). This could be batched into a
  single commit via the Git Data API (trees/commits) later if you want a
  cleaner history.
- Supported language → file extension mapping lives in `src/background.js`
  (`LANG_EXT`) — add more languages there if needed.

## Possible next steps

- Batch the two file writes into a single commit using the Git Trees API
- Add a manual "sync this page now" button in the popup for saving
  work-in-progress (not just Accepted) solutions
- Track a running streak / stats dashboard in the popup
- Publish to the Chrome Web Store (would need an OAuth flow + small backend
  instead of a pasted PAT, for non-technical users)

---

## Contributing

Contributions, issues, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

## License

This project is licensed under the MIT License.

---

## 👨 Author

**Krish Verma**

If you found this project useful, consider giving it a ⭐ on GitHub!