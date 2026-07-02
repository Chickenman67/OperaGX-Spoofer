// ============================================================
// Opera GX Spoofer — Popup Script
// ============================================================

const STORAGE_KEY = 'whitelist';
const DOMAIN_LIST_EL = document.getElementById('domainList');
const DOMAIN_INPUT = document.getElementById('domainInput');
const ADD_BTN = document.getElementById('addDomainBtn');
const CURRENT_DOMAIN_EL = document.getElementById('currentDomain');
const TOGGLE_CURRENT_BTN = document.getElementById('toggleCurrentBtn');
const STATUS_ICON = document.getElementById('statusIcon');
const STATUS_TEXT = document.getElementById('statusText');

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
async function getWhitelist() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function setWhitelist(domains) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
  renderList();
}

// -----------------------------------------------------------
// Render the whitelisted domain list
// -----------------------------------------------------------
async function renderList() {
  const domains = await getWhitelist();

  if (domains.length === 0) {
    DOMAIN_LIST_EL.innerHTML = '<li class="empty-msg">No domains added yet.</li>';
    return;
  }

  DOMAIN_LIST_EL.innerHTML = domains
    .map(
      (domain) => `
        <li class="domain-item">
          <span class="domain-name">${escapeHtml(domain)}</span>
          <button class="btn btn-sm btn-remove" data-domain="${escapeHtml(domain)}">Remove</button>
        </li>`
    )
    .join('');

  // Attach remove handlers
  document.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      const domains = await getWhitelist();
      await setWhitelist(domains.filter((d) => d !== domain));
    });
  });
}

// -----------------------------------------------------------
// Simple HTML escaping
// -----------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// -----------------------------------------------------------
// Extract a clean domain from a URL
// -----------------------------------------------------------
function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// Initialise the current-tab section
// -----------------------------------------------------------
async function initCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url) {
    CURRENT_DOMAIN_EL.textContent = '—';
    TOGGLE_CURRENT_BTN.disabled = true;
    return;
  }

  const domain = extractDomain(tab.url);
  if (!domain) {
    CURRENT_DOMAIN_EL.textContent = '—';
    TOGGLE_CURRENT_BTN.disabled = true;
    return;
  }

  CURRENT_DOMAIN_EL.textContent = domain;

  const domains = await getWhitelist();
  const isInList = domains.includes(domain);

  // Update header status
  if (isInList) {
    STATUS_ICON.textContent = '🟢';
    STATUS_TEXT.textContent = 'Active — Spoofing as Opera GX 132 on Windows 10';
  } else {
    STATUS_ICON.textContent = '🔴';
    STATUS_TEXT.textContent = 'Inactive — Click "Add to list" to enable spoofing on this site';
  }

  if (isInList) {
    TOGGLE_CURRENT_BTN.textContent = 'Remove from list';
    TOGGLE_CURRENT_BTN.classList.remove('btn-primary');
    TOGGLE_CURRENT_BTN.classList.add('btn-remove');
  } else {
    TOGGLE_CURRENT_BTN.textContent = 'Add to list';
    TOGGLE_CURRENT_BTN.classList.remove('btn-remove');
    TOGGLE_CURRENT_BTN.classList.add('btn-primary');
  }
  TOGGLE_CURRENT_BTN.disabled = false;

  TOGGLE_CURRENT_BTN.onclick = async () => {
    const current = await getWhitelist();
    if (current.includes(domain)) {
      await setWhitelist(current.filter((d) => d !== domain));
    } else {
      await setWhitelist([...current, domain]);
    }
    initCurrentTab(); // Refresh state
  };
}

// -----------------------------------------------------------
// Add domain from input field
// -----------------------------------------------------------
ADD_BTN.addEventListener('click', async () => {
  let raw = DOMAIN_INPUT.value.trim().toLowerCase();

  // Strip protocol and path if user pastes a full URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const parsed = extractDomain(raw);
    if (parsed) raw = parsed;
  }

  // Strip leading www.
  raw = raw.replace(/^www\./, '');

  // Basic validation
  if (!raw || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(raw)) {
    DOMAIN_INPUT.style.borderColor = '#e74c3c';
    setTimeout(() => (DOMAIN_INPUT.style.borderColor = ''), 1500);
    return;
  }

  const domains = await getWhitelist();
  if (!domains.includes(raw)) {
    await setWhitelist([...domains, raw]);
  }
  DOMAIN_INPUT.value = '';
});

DOMAIN_INPUT.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ADD_BTN.click();
});

// -----------------------------------------------------------
// Init
// -----------------------------------------------------------
renderList();
initCurrentTab();
