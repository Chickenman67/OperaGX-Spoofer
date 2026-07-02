// ============================================================
// Opera GX Spoofer — Background Service Worker
// ============================================================
// Dynamically manages declarativeNetRequest rules based on
// the user's domain whitelist stored in chrome.storage.
// Also updates the toolbar badge (green ON / gray OFF).
// ============================================================

const RULE_ID_OFFSET = 1;
const STORAGE_KEY = 'whitelist';

// The set of headers to modify for each whitelisted domain
const HEADER_RULES = [
  {
    header: 'User-Agent',
    operation: 'set',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0',
  },
  {
    header: 'Sec-CH-UA',
    operation: 'set',
    value: '"Chromium";v="148", "Opera GX";v="132", "Not/A)Brand";v="99"',
  },
  {
    header: 'Sec-CH-UA-Full-Version',
    operation: 'set',
    value: '132.0.5905.110',
  },
  {
    header: 'Sec-CH-UA-Platform',
    operation: 'set',
    value: '"Windows"',
  },
  {
    header: 'Sec-CH-UA-Platform-Version',
    operation: 'set',
    value: '"10.0"',
  },
  {
    header: 'Sec-CH-UA-Arch',
    operation: 'set',
    value: '"x86"',
  },
  {
    header: 'Sec-CH-UA-Bitness',
    operation: 'set',
    value: '"64"',
  },
  {
    header: 'Sec-CH-UA-Mobile',
    operation: 'set',
    value: '?0',
  },
  {
    header: 'Sec-CH-UA-Model',
    operation: 'set',
    value: '',
  },
];

// -----------------------------------------------------------
// Build a declarativeNetRequest rule for a given domain
// -----------------------------------------------------------
function buildRule(domain, ruleId) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: HEADER_RULES.map((h) => ({
        header: h.header,
        operation: h.operation,
        value: h.value,
      })),
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: [
        'main_frame',
        'sub_frame',
        'stylesheet',
        'script',
        'image',
        'font',
        'object',
        'xmlhttprequest',
        'ping',
        'csp_report',
        'media',
        'websocket',
        'webtransport',
        'webbundle',
        'other',
      ],
    },
  };
}

// -----------------------------------------------------------
// Get the whitelist from storage
// -----------------------------------------------------------
async function getWhitelist() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

// -----------------------------------------------------------
// Sync the dynamic DNR rules to match the current whitelist
// -----------------------------------------------------------
async function syncRules() {
  const domains = await getWhitelist();

  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((r) => r.id);

  // Build new rules for each whitelisted domain
  const newRules = domains.map((domain, index) =>
    buildRule(domain, RULE_ID_OFFSET + index)
  );

  // Update: remove old, add new
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules,
  });
}

// -----------------------------------------------------------
// Update the toolbar badge for a specific tab
// -----------------------------------------------------------
async function updateBadge(tabId, url) {
  if (!tabId || !url) return;

  try {
    const hostname = new URL(url).hostname;
    const domains = await getWhitelist();
    const isActive = domains.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );

    if (isActive) {
      chrome.action.setBadgeText({ tabId, text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#2ecc71' });
      chrome.action.setBadgeTextColor({ tabId, color: '#000' });
    } else {
      chrome.action.setBadgeText({ tabId, text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#666666' });
      chrome.action.setBadgeTextColor({ tabId, color: '#fff' });
    }
  } catch {
    // Invalid URL or no tab — clear badge
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// -----------------------------------------------------------
// Update badge for the active tab
// -----------------------------------------------------------
async function updateActiveTabBadge() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      updateBadge(tabs[0].id, tabs[0].url);
    }
  } catch {
    // Ignore
  }
}

// -----------------------------------------------------------
// Message handler: content script checks if domain is whitelisted
// -----------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_DOMAIN') {
    getWhitelist().then((domains) => {
      const isWhitelisted = domains.some(
        (d) => message.domain === d || message.domain.endsWith('.' + d)
      );
      sendResponse({ isWhitelisted });
    });
    return true; // Keep channel open for async response
  }
});

// -----------------------------------------------------------
// Listen for whitelist changes from the popup
// -----------------------------------------------------------
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE_KEY]) {
    syncRules();
    updateActiveTabBadge();
  }
});

// -----------------------------------------------------------
// On install / startup, sync rules immediately
// -----------------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
  syncRules();
  updateActiveTabBadge();
});

// -----------------------------------------------------------
// Tab events — update badge when tab changes or loads
// -----------------------------------------------------------
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateBadge(tab.id, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId, tab.url);
  }
});
