// iOS Safari Keyboard Scroll Bug Fix
// When inputs lose focus, force the window to scroll back to top (0,0)
// to correct the layout shift caused by the virtual keyboard.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if (isIOS) {
  document.addEventListener('focusout', (e) => {
    if (e.target.tagName === 'INPUT') {
      window.scrollTo(0, 0);
    }
  });
}

// App State
// All money is handled as integer satang (1/100 baht) to avoid float drift.
const ratioGov = RATIO_GOV;
const ratioUser = RATIO_USER;

function loadJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Normalize stored logs: legacy entries held baht floats and only a time string.
// `id` was always Date.now(), so it doubles as the timestamp.
let logs = loadJSON('halfhalf_logs', []);
if (!Array.isArray(logs)) logs = [];
logs = logs.filter(l => l && typeof l.id === 'number').map(l => ({
  ...l,
  ts: l.ts || l.id,
  price: Number(l.price) || 0,
  govShare: Number(l.govShare) || 0,
  userShare: Number(l.userShare) || 0,
  note: typeof l.note === 'string' ? l.note : ''
}));

// Daily subsidy allowance in satang
let dailyCap = toSatang(localStorage.getItem('halfhalf_daily_cap') || '200');
let isCalculating = false;

// Elements
const priceInput = document.getElementById('original-price');
const valGov = document.getElementById('val-gov');
const valUser = document.getElementById('val-user');
const historyList = document.getElementById('history-list');
const searchInput = document.getElementById('search-input');
const historyActionsBar = document.getElementById('history-actions-bar');
const searchBarWrapper = document.getElementById('search-bar-wrapper');

// Drawer Elements
const historyDrawer = document.getElementById('history-drawer');
const drawerOpenBtn = document.getElementById('drawer-open-btn');
const drawerCloseBtn = document.getElementById('drawer-close-btn');

// Tracker elements
const remainingSubsidyInput = document.getElementById('remaining-subsidy-input');
const optimalLimitVal = document.getElementById('optimal-limit-val');
const capAlert = document.getElementById('cap-alert');

// Event Listeners
function onAmountInput(input, calc) {
  input.addEventListener('input', () => {
    const clean = sanitizeAmount(input.value);
    if (clean !== input.value) input.value = clean;
    if (isCalculating) return;
    isCalculating = true;
    calc();
    isCalculating = false;
  });
}

onAmountInput(priceInput, calculateFromPrice);
onAmountInput(valGov, calculateFromGov);
onAmountInput(valUser, calculateFromUser);

// Editing the remaining subsidy adjusts today's allowance. The new cap is only
// persisted on commit so half-typed values never get saved.
onAmountInput(remainingSubsidyInput, () => {
  dailyCap = toSatang(remainingSubsidyInput.value) + getUsedToday();
  calculateFromPrice();
  updateTrackers();
});

function commitSubsidy() {
  localStorage.setItem('halfhalf_daily_cap', fromSatang(dailyCap));
  updateTrackers();
}

remainingSubsidyInput.addEventListener('blur', commitSubsidy);
remainingSubsidyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') remainingSubsidyInput.blur();
});

// Drawer Event Listeners
function openDrawer() {
  historyDrawer.classList.add('open');
  historyDrawer.inert = false;
  drawerCloseBtn.focus({ preventScroll: true });
}

function closeDrawer() {
  const hadFocus = historyDrawer.contains(document.activeElement);
  historyDrawer.classList.remove('open');
  historyDrawer.inert = true;
  if (hadFocus) drawerOpenBtn.focus({ preventScroll: true });
}

drawerOpenBtn.addEventListener('click', openDrawer);
drawerCloseBtn.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && historyDrawer.classList.contains('open')) closeDrawer();
});

function getUsedToday() {
  const today = dayKey(Date.now());
  return logs
    .filter(item => dayKey(item.ts) === today)
    .reduce((sum, item) => sum + toSatang(item.govShare), 0);
}

function getRemainingSubsidy() {
  return Math.max(0, dailyCap - getUsedToday());
}

// Fill every field except the one being typed in, so "5." isn't rewritten to "5.00"
function applySplit({ price, gov, user, rawGov }, source) {
  const set = (input, value) => {
    if (input !== source) input.value = price > 0 ? fromSatang(value) : '';
  };
  set(priceInput, price);
  set(valGov, gov);
  set(valUser, user);
  updateCapAlert(price, rawGov, getRemainingSubsidy());
}

function updateCapAlert(price, rawGovShare, remainingPool) {
  if (price > 0 && (rawGovShare > remainingPool || (rawGovShare === remainingPool && remainingPool > 0))) {
    const extraPay = rawGovShare - remainingPool;
    capAlert.textContent = extraPay >= 1
      ? `* Government cap reached! You pay an extra ${formatCurrency(extraPay)} on top.`
      : `* Government cap reached! You pay the rest on top.`;
    capAlert.style.display = 'block';
  } else {
    capAlert.style.display = 'none';
  }
}

function calculateFromPrice() {
  applySplit(splitFromPrice(toSatang(priceInput.value), getRemainingSubsidy()), priceInput);
}

function calculateFromGov() {
  const remaining = getRemainingSubsidy();
  if (toSatang(valGov.value) > remaining) valGov.value = fromSatang(remaining);
  applySplit(splitFromGov(toSatang(valGov.value), remaining), valGov);
}

function calculateFromUser() {
  applySplit(splitFromUser(toSatang(valUser.value), getRemainingSubsidy()), valUser);
}

function updateTrackers() {
  const remaining = getRemainingSubsidy();
  if (document.activeElement !== remainingSubsidyInput) {
    remainingSubsidyInput.value = fromSatang(remaining);
  }

  optimalLimitVal.innerText = formatCurrency(Math.round(remaining * 100 / ratioGov));
}

// amount is in satang
function formatCurrency(amount) {
  return '฿' + (amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resetCalculator() {
  priceInput.value = '';
  valGov.value = '';
  valUser.value = '';
  capAlert.style.display = 'none';
  priceInput.focus();
}

function saveCalculation() {
  const price = toSatang(priceInput.value);
  if (price <= 0) return;

  const govShare = toSatang(valGov.value);
  const now = Date.now();

  // Money fields are stored as baht numbers (2dp) for CSV/back-compat.
  logs.unshift({
    id: now,
    ts: now,
    price: price / 100,
    govShare: govShare / 100,
    userShare: (price - govShare) / 100,
    ratioGov: ratioGov,
    ratioUser: ratioUser,
    note: 'Expense Split',
    date: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  persistLogs();
  resetCalculator();
  renderHistory();
  updateTrackers();

  // Auto open history drawer
  openDrawer();
}

function persistLogs() {
  try {
    localStorage.setItem('halfhalf_logs', JSON.stringify(logs));
  } catch (e) {
    console.warn('Could not save logs:', e);
  }
}

// Numpad Logic
let activeInput = priceInput;

const numericInputs = [
  { input: priceInput, wrapper: document.querySelector('.price-input-wrapper') },
  { input: remainingSubsidyInput, wrapper: remainingSubsidyInput },
  { input: valGov, wrapper: document.getElementById('gov-val-wrapper') },
  { input: valUser, wrapper: document.getElementById('user-val-wrapper') }
];

numericInputs.forEach(item => {
  // Focus tracking
  item.input.addEventListener('focus', () => {
    activeInput = item.input;
    numericInputs.forEach(x => x.wrapper.classList.remove('active-field'));
    item.wrapper.classList.add('active-field');
  });
  item.input.addEventListener('click', () => {
    activeInput = item.input;
    numericInputs.forEach(x => x.wrapper.classList.remove('active-field'));
    item.wrapper.classList.add('active-field');
  });
});

// Numpad key interactions
function pressKey(val) {
  if (!activeInput) return;
  const currentVal = activeInput.value;

  if (val === 'backspace') {
    activeInput.value = currentVal.slice(0, -1);
  } else if (val === '.') {
    if (!currentVal.includes('.')) {
      activeInput.value = currentVal === '' ? '0.' : currentVal + '.';
    }
  } else {
    activeInput.value = currentVal === '0' ? val : currentVal + val;
  }

  activeInput.dispatchEvent(new Event('input'));
}

document.querySelectorAll('.numpad-btn').forEach(btn => {
  // Pointer press keeps the input focused (and avoids the 300ms click delay)
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    pressKey(btn.dataset.val);
  });
  // Keyboard activation (Enter/Space) fires click with detail 0
  btn.addEventListener('click', (e) => {
    if (e.detail === 0) pressKey(btn.dataset.val);
  });
});

// Set active field outline on load
priceInput.focus();
document.querySelector('.price-input-wrapper').classList.add('active-field');

// Initialize trackers
updateTrackers();
renderHistory();

function deleteLog(id) {
  logs = logs.filter(log => log.id !== id);
  persistLogs();
  renderHistory();
  updateTrackers();
  
  isCalculating = true;
  calculateFromPrice();
  isCalculating = false;
}

function clearAllLogs() {
  if (confirm('Clear all history?')) {
    logs = [];
    persistLogs();
    renderHistory();
    updateTrackers();
    resetCalculator();
  }
}

function renderHistory() {
  const query = searchInput.value.toLowerCase();
  const filtered = logs.filter(log => 
    log.note.toLowerCase().includes(query) || 
    fmtLogDate(log.ts).toLowerCase().includes(query) ||
    log.price.toString().includes(query)
  );

  if (logs.length > 0) {
    historyActionsBar.style.display = 'flex';
    searchBarWrapper.style.display = 'block';
  } else {
    historyActionsBar.style.display = 'none';
    searchBarWrapper.style.display = 'none';
  }

  if (filtered.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        ${logs.length > 0 ? 'No matching records.' : 'No records yet. Enter a value and save it.'}
      </div>
    `;
    return;
  }

  historyList.innerHTML = filtered.map(log => `
    <div class="log-item">
      <div class="log-left">
        <span class="log-orig-price">${formatCurrency(toSatang(log.price))}</span>
        <div class="log-splits">
          <span>Gov (${log.ratioGov}%): ${formatCurrency(toSatang(log.govShare))}</span>
          <span>You (${log.ratioUser}%): ${formatCurrency(toSatang(log.userShare))}</span>
        </div>
        ${log.note ? `<div class="log-note">${escapeHTML(log.note)}</div>` : ''}
      </div>
      <div class="log-right">
        <span class="log-date">${fmtLogDate(log.ts)}</span>
        <button class="log-delete" type="button" onclick="deleteLog(${log.id})" title="Delete" aria-label="Delete record">
          <svg class="icon" style="width: 14px; height: 14px;" aria-hidden="true"><use href="#i-x-circle"/></svg>
        </button>
      </div>
    </div>
  `).join('');

}

function fmtLogDate(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dayKey(ts) === dayKey(Date.now())
    ? time
    : `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function exportToCSV() {
  if (logs.length === 0) return;
  let csvContent = "data:text/csv;charset=utf-8,Timestamp,Original Price,Government Share,User Share,Gov Ratio,User Ratio,Label/Note\n";
  logs.forEach(log => {
    const escapedNote = log.note.replace(/"/g, '""');
    const stamp = new Date(log.ts).toISOString();
    csvContent += `"${stamp}",${log.price.toFixed(2)},${log.govShare.toFixed(2)},${log.userShare.toFixed(2)},${log.ratioGov},${log.ratioUser},"${escapedNote}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `halfhalf_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Theme toggle interaction
const themeToggleBtn = document.getElementById('theme-toggle-btn');

function initThemeColor() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const color = isDark ? '#0b0f19' : '#f5f5f7';
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', color);
  });
}

initThemeColor();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('halfhalf_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('halfhalf_theme', 'dark');
    }
    initThemeColor();
  });
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
