# 🚀 LeetPush

> A Chrome Extension that automatically syncs your accepted LeetCode solutions to a GitHub repository with organized folders, solution files, and beautifully generated README files.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![GitHub API](https://img.shields.io/badge/GitHub-Contents_API-black)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)

---

## Overview

Keeping LeetCode solutions organized on GitHub is a great way to build a coding portfolio, but manually creating folders, copying code, writing README files, and committing every accepted solution quickly becomes repetitive.

**LeetPush** automates the entire workflow.

Simply solve a LeetCode problem, receive an **Accepted** verdict, and the extension automatically uploads your solution to GitHub with:

- ✅ Solution source code
- ✅ Auto-generated problem README
- ✅ Problem statement
- ✅ Difficulty
- ✅ Tags
- ✅ Runtime & memory statistics
- ✅ Optional difficulty-based folder organization

---

## Features

- 🚀 Automatically detects accepted LeetCode submissions
- 📤 Instantly uploads solutions to GitHub
- 📄 Generates a README for every problem
- 📝 Stores problem description, difficulty, and tags
- ⚡ Captures runtime and memory statistics
- 📂 Optional organization by Easy / Medium / Hard folders
- 🔐 Uses GitHub Personal Access Tokens securely on-device
- 🔄 Updates existing solutions when you re-submit
- 🧩 Built using Chrome Extension Manifest V3

---

## Architecture

```
LeetCode Website
        │
        ▼
Injected Script
(Hooks window.fetch)
        │
        ▼
Content Script
        │
        ▼
LeetCode GraphQL API
        │
        ▼
Background Service Worker
        │
        ▼
GitHub Contents API
        │
        ▼
GitHub Repository
```

---

## Tech Stack

### Extension

- Chrome Extension (Manifest V3)
- JavaScript
- HTML
- CSS

### APIs

- GitHub Contents API
- LeetCode GraphQL API

### Browser APIs

- Chrome Storage API
- Chrome Tabs API
- Chrome Runtime Messaging
- Content Scripts
- Service Workers

---

## Project Structure

```
leetpush-extension/
│
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── ...
│
├── src/
│   ├── background.js
│   ├── content-script.js
│   ├── inject.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   └── options.js
│
├── manifest.json
├── .gitignore
└── README.md
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/leetpush-extension.git

cd leetpush-extension
```

---

### 2. Create a GitHub Personal Access Token

Generate a Personal Access Token from GitHub.

Required permission:

```
Contents: Read and Write
```

Classic tokens can also be used with the **repo** scope.

---

### 3. Load the Extension

Open Chrome

Go to

```
chrome://extensions
```

Enable **Developer Mode**

Click **Load unpacked**

Select the project folder.

---

## Configuration

Open the extension settings and provide:

- GitHub Personal Access Token
- Repository Owner
- Repository Name
- Branch Name
- Optional difficulty-based folder organization

Click **Test Connection**, then **Save Settings**.

---

## Demo

### Solve a LeetCode Problem

> Submit any LeetCode problem.

↓

LeetCode returns **Accepted**.

↓

LeetPush detects the successful submission.

↓

Fetches the problem details.

↓

Generates the solution files.

↓

Uploads everything directly to your GitHub repository.

---

## Future Improvements

- Support for LeetCode CN
- Single-commit uploads using the Git Data API
- Manual sync button for in-progress solutions
- Built-in submission statistics dashboard
- Automatic GitHub README badges
- Chrome Web Store release

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