# 🟢 Opera GX Spoofer

A Chromium browser extension that makes websites think you are using **Opera GX 132** on **Windows 10**.

👉 **Verify it works at [https://www.whatismybrowser.com/](https://www.whatismybrowser.com/)**

---

## What It Does

This extension overrides **HTTP request headers** and **JavaScript `navigator` properties** so that every website you whitelist sees your browser as Opera GX 132 running on Windows 10 64-bit — regardless of what browser you are actually using (Chrome, Edge, Brave, etc.).

### Spoofed Values

| Property / Header | Spoofed Value |
|---|---|
| **User-Agent** | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0` |
| **Sec-CH-UA** | `"Chromium";v="148", "Opera GX";v="132", "Not/A)Brand";v="99"` |
| **Sec-CH-UA-Full-Version** | `132.0.5905.110` |
| **Sec-CH-UA-Platform** | `"Windows"` |
| **Sec-CH-UA-Platform-Version** | `"10.0"` |
| **Sec-CH-UA-Arch** | `"x86"` |
| **Sec-CH-UA-Bitness** | `"64"` |
| **Sec-CH-UA-Mobile** | `?0` |
| **navigator.userAgent** | Same UA string |
| **navigator.userAgentData** | Full Client Hints object with `getHighEntropyValues()` returning Opera GX 132 data |

---

## How It Works

The extension uses a **dual-pronged approach**:

### 1. `declarativeNetRequest` (Background Service Worker)
Modifies actual HTTP request headers **at the network level** before they leave the browser. This is the only way to spoof the `User-Agent` header and Chromium-level `Sec-CH-UA` headers that the browser normally controls.

### 2. Content Script (`world: "MAIN"`)
Runs JavaScript in the page's **main execution context** at `document_start` (before any site scripts run). It overrides `navigator.userAgent`, `navigator.userAgentData`, and related properties that websites read at runtime — since HTTP header changes alone do _not_ update the JavaScript environment.

### 3. Per-Site Whitelist
The spoofer only activates on domains you explicitly add via the popup. All other websites remain completely untouched.

---

## Installation

### Chrome / Edge / Brave / Opera

1. Download or clone this repository
2. Open your browser and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `OperaGX Spoofer` folder
6. The extension icon will appear in your toolbar

### Firefox

This extension uses Manifest V3 with `world: "MAIN"` which is **Chromium-only**. Firefox support would require a separate Manifest V2 build.

---

## Usage

1. Click the **Opera GX Spoofer** icon in your browser toolbar
2. The popup shows your **current tab's domain** — click "Add to list" to whitelist it
3. Or type any domain manually (e.g. `whatsapp.com`, `spotify.com`) and click **Add**
4. **Reload the page** on whitelisted domains for the changes to take effect
5. Visit [https://www.whatismybrowser.com/](https://www.whatismybrowser.com/) to verify it shows Opera GX
6. To remove a domain, click the **Remove** button next to it in the popup

### Tips

- You can add root domains only — `example.com` covers `sub.example.com` automatically
- Remove domains you no longer want to spoof
- The extension stores your whitelist in `chrome.storage.sync` so it syncs across devices (if signed in)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| **Website still shows my real browser** | Clear cache & hard reload (`Ctrl+Shift+R` / `Cmd+Shift+R`). The browser may cache the old User-Agent. |
| **Extension not working on a site** | Verify the domain appears in your whitelist. Add it if missing. |
| **Popup doesn't open** | Check `chrome://extensions` — ensure the extension is enabled and no errors are listed under "Errors" |
| **Developer mode required** | Yes — Manifest V3 unpacked extensions require Developer mode. This is normal. |

---

## Technical Details

- **Manifest**: V3
- **Permissions**: `declarativeNetRequest`, `storage`, `activeTab`, `<all_urls>`
- **Content script injection**: `run_at: "document_start"` + `world: "MAIN"` (Chrome 111+)
- **Rule management**: Dynamic declarativeNetRequest rules updated via `chrome.declarativeNetRequest.updateDynamicRules()`
- **Storage**: `chrome.storage.sync` for cross-device whitelist sync

### Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest (permissions, icons, config) |
| `background.js` | Service worker — manages DNR rules, handles messages |
| `content-script.js` | Overrides `navigator.*` properties in MAIN world |
| `popup.html` | Popup UI for whitelist management |
| `popup.js` | Popup logic (add/remove/toggle domains) |
| `popup.css` | Dark-themed styling |
| `icons/` | 16×16, 48×48, 128×128 PNG icons |

---

## Why?

Some web applications and services behave differently based on browser detection. This extension lets you **test and experience** how sites treat Opera GX users without actually switching browsers.

---

## License

MIT
