// ============================================================
// Opera GX Spoofer — Content Script (MAIN world)
// ============================================================
// Runs at document_start in the page's MAIN world via
// manifest.json "world": "MAIN".  Reads the whitelist
// directly from chrome.storage.sync and overrides
// navigator.* properties on Navigator.prototype.
// ============================================================

(async () => {
  // ----------------------------------------------------------
  // Step 1: Check if this domain is whitelisted.
  // chrome.storage.sync.get works in MAIN world.
  // chrome.runtime.sendMessage does NOT — so we read
  // storage directly.
  // ----------------------------------------------------------
  const domain = window.location.hostname;

  let isWhitelisted = false;
  try {
    const result = await chrome.storage.sync.get('whitelist');
    const domains = result.whitelist || [];
    isWhitelisted = domains.some(
      (d) => domain === d || domain.endsWith('.' + d)
    );
  } catch {
    // Storage unavailable — skip spoofing.
  }

  if (!isWhitelisted) return;

  // ----------------------------------------------------------
  // Step 2: Override navigator properties on the prototype.
  // Since we run in world: MAIN at document_start, this
  // code has full access to the page's JS context.
  // ----------------------------------------------------------
  const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0';

  const USER_AGENT_DATA = {
    brands: [
      { brand: 'Chromium', version: '148' },
      { brand: 'Opera GX', version: '132' },
      { brand: 'Not/A)Brand', version: '99' },
    ],
    mobile: false,
    platform: 'Windows',
    platformVersion: '10.0',
    architecture: 'x86',
    bitness: '64',
    model: '',
    uaFullVersion: '132.0.5905.110',
    fullVersionList: [
      { brand: 'Chromium', version: '148' },
      { brand: 'Opera GX', version: '132' },
      { brand: 'Not/A)Brand', version: '99' },
    ],
    getHighEntropyValues: function (hints) {
      const map = {
        architecture: 'x86',
        bitness: '64',
        model: '',
        platform: 'Windows',
        platformVersion: '10.0',
        uaFullVersion: '132.0.5905.110',
        fullVersionList: [
          { brand: 'Chromium', version: '148' },
          { brand: 'Opera GX', version: '132' },
          { brand: 'Not/A)Brand', version: '99' },
        ],
        wow64: false,
        formFactor: '',
      };
      const result = {};
      for (const hint of hints) {
        if (hint in map) result[hint] = map[hint];
      }
      return Promise.resolve(result);
    },
    toJSON: function () {
      return {
        brands: this.brands,
        mobile: this.mobile,
        platform: this.platform,
      };
    },
  };

  try {
    // --- navigator.userAgent ---
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      get: () => USER_AGENT,
      configurable: true,
      enumerable: true,
    });

    // --- navigator.appVersion ---
    Object.defineProperty(Navigator.prototype, 'appVersion', {
      get: () => USER_AGENT,
      configurable: true,
      enumerable: true,
    });

    // --- navigator.appCodeName ---
    Object.defineProperty(Navigator.prototype, 'appCodeName', {
      get: () => 'Mozilla',
      configurable: true,
      enumerable: true,
    });

    // --- navigator.platform ---
    Object.defineProperty(Navigator.prototype, 'platform', {
      get: () => 'Win64',
      configurable: true,
      enumerable: true,
    });

    // --- navigator.vendor ---
    Object.defineProperty(Navigator.prototype, 'vendor', {
      get: () => 'Google Inc.',
      configurable: true,
      enumerable: true,
    });

    // --- navigator.oscpu (Firefox compat) ---
    Object.defineProperty(Navigator.prototype, 'oscpu', {
      get: () => 'Windows NT 10.0; Win64; x64',
      configurable: true,
      enumerable: true,
    });

    // --- navigator.userAgentData ---
    // userAgentData is a frozen object in Chrome. We define
    // the getter on the prototype so it shadows the default.
    Object.defineProperty(Navigator.prototype, 'userAgentData', {
      get: () => USER_AGENT_DATA,
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    console.warn('[Opera GX Spoofer] Failed to override navigator properties:', e);
  }
})();
