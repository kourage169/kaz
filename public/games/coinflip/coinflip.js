const MAX_HISTORY = 10;
let resultsHistory = [];
let isFlipping = false;

// ─── A) Helper: getSession ────────────────
async function getSession() {
  try {
    const res = await fetch('/auth/session');
    if (!res.ok) {
      // If not logged in, redirect to login
      window.location.href = '/login.html';
      return null;
    }
    const data = await res.json();
    // data should have { balanceUSD, balanceLBP, …other fields }
    
    // With the new navbar implementation, we don't need to update balance display here
    // as it's handled by navbar.js

    // Store session data globally for other scripts to access
    window.sessionData = data;
    
    return data;
  } catch (err) {
    console.error('getSession error:', err);
    window.location.href = '/login.html';
    return null;
  }
}

// Initialize session
getSession();

// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 100 },
  LBP: { min: 10000, max: 10000000 }
};

// Utility to enable/disable bet buttons
function setBetButtonsEnabled(enabled) {
  const headsBtn = document.getElementById('heads-button');
  const tailsBtn = document.getElementById('tails-button');
  headsBtn.disabled = !enabled;
  tailsBtn.disabled = !enabled;
  headsBtn.style.opacity = enabled ? '1' : '0.5';
  tailsBtn.style.opacity = enabled ? '1' : '0.5';
}

async function placeBet(choice, currency) {
  if (isFlipping) return;
  isFlipping = true;

  const amount = parseFloat(document.getElementById('bet-amount').value);
  if (isNaN(amount) || amount <= 0) {
    isFlipping = false;
    return alert('Enter a valid bet amount');
  }

  setBetButtonsEnabled(false);

  const coin = document.getElementById('coin');
  coin.classList.add('flipping');

  const flipDuration = 500; // slower flip for realism
  const totalSpins = 2;       // fewer, controlled flips
  let rotation = 0;

  // Start coin flip animation
  const start = performance.now();
  let animationFinished = false;
  let resultData = null;

  const animate = (now) => {
    const progress = now - start;
    rotation = (progress / flipDuration) * 360 * totalSpins;
    coin.style.transform = `rotateY(${rotation}deg) scale(1.25)`;

    if (progress < flipDuration) {
      requestAnimationFrame(animate);
    } else {
      animationFinished = true;
      maybeFinalize();
    }
  };

  requestAnimationFrame(animate);

  // Fetch result from server
  try {
    const res = await fetch('/games/coinflip/flip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet: amount, choice, currency }),  // Include currency in the request
    });

    resultData = await res.json();
  } catch (err) {
    alert('Error communicating with server.');
    coin.classList.remove('flipping');
    coin.style.transform = 'scale(1)';
    setBetButtonsEnabled(true);
    isFlipping = false;
    return;
  }

  maybeFinalize();

  function maybeFinalize() {
    if (!animationFinished || !resultData) return;

    const finalRotation = resultData.result === 'heads' ? 0 : 180;
    coin.style.transform = `rotateY(${finalRotation}deg) scale(1)`;
    coin.classList.remove('flipping');
    setTimeout(() => {
      setBetButtonsEnabled(true);
      isFlipping = false;
    }, 200);

    // Remove result message update
    // document.getElementById('result-message').textContent =
    //   `Result: ${resultData.result.toUpperCase()}. You ${resultData.win ? 'won' : 'lost'}!`;

    // Update both USD and LBP balances
    updateNavbarBalances(resultData.newBalanceUSD, resultData.newBalanceLBP, currency);

    // Update results history row
    if (resultData.result === 'heads' || resultData.result === 'tails') {
      resultsHistory.push(resultData.result);
      if (resultsHistory.length > MAX_HISTORY) resultsHistory.shift();
      renderResultsHistory();
    }
  }
}

function renderResultsHistory() {
  const rowInner = document.getElementById('results-history-row-inner');
  rowInner.innerHTML = '';
  resultsHistory.forEach((result, idx) => {
    const img = document.createElement('img');
    img.src = result === 'heads' ? '/images/heads.png' : '/images/tails.png';
    img.alt = result;
    img.className = 'results-history-coin';
    if (idx === resultsHistory.length - 1) {
      img.classList.add('animate-in');
    }
    rowInner.appendChild(img);
  });
}

function formatCurrencyAmount(amount, currency) {
  if (currency === 'USD') {
    return `$${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  } else if (currency === 'LBP') {
    return `£${Number(amount).toLocaleString('en-US', {maximumFractionDigits: 0})}`;
  }
  return amount;
}

function updateNavbarBalances(newBalanceUSD, newBalanceLBP, currency) {
  const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
  const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
  if (usdDropdownItem) {
    usdDropdownItem.innerHTML = `
      <span class="amount-label">${formatCurrencyAmount(newBalanceUSD, 'USD')}</span>
      <span class="currency-label">USD</span>
    `;
  }
  if (lbpDropdownItem) {
    lbpDropdownItem.innerHTML = `
      <span class="amount-label">${formatCurrencyAmount(newBalanceLBP, 'LBP')}</span>
      <span class="currency-label">LBP</span>
    `;
  }
  // Also update the selected balance if it matches the current currency
  const selectedBalance = document.getElementById('selected-balance');
  if (selectedBalance) {
    if (currency === 'USD') {
      selectedBalance.textContent = formatCurrencyAmount(newBalanceUSD, 'USD');
    } else if (currency === 'LBP') {
      selectedBalance.textContent = formatCurrencyAmount(newBalanceLBP, 'LBP');
    }
  }
}

// --- Currency Sync between Navbar and Controls ---
function syncCurrencySelections() {
  const currencySelect = document.getElementById('currency');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const selectedBalance = document.getElementById('selected-balance');
  const balanceDropdown = document.getElementById('balance-dropdown');

  // Navbar dropdown -> controls
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      if (currencySelect) currencySelect.value = currency;
    });
  });

  // Controls -> navbar
  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      const currency = currencySelect.value;
      // Find the corresponding navbar dropdown item
      const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
      if (matchingItem) {
        // Optionally update selected balance display
        const amountSpan = matchingItem.querySelector('.amount-label');
        if (amountSpan && selectedBalance) {
          selectedBalance.textContent = amountSpan.textContent;
        }
        // Hide dropdown after selection
        if (balanceDropdown) balanceDropdown.style.display = 'none';
      }
    });
  }
}

function formatBetAmountInput() {
  const betAmountInput = document.getElementById('bet-amount');
  const currencySelect = document.getElementById('currency');
  if (!betAmountInput || !currencySelect) return;
  const currency = currencySelect.value;
  let value = parseFloat(betAmountInput.value);
  if (isNaN(value)) return;
  if (currency === 'USD') {
    betAmountInput.value = value.toFixed(2);
  } else {
    betAmountInput.value = Math.round(value);
  }
}

function setupBetAmountAutoAdjust() {
  const betAmountInput = document.getElementById('bet-amount');
  const currencySelect = document.getElementById('currency');
  if (!betAmountInput || !currencySelect) return;

  betAmountInput.addEventListener('blur', () => {
    const currency = currencySelect.value;
    const limits = BET_LIMITS[currency];
    let value = parseFloat(betAmountInput.value);
    if (isNaN(value)) return;
    if (value < limits.min) {
      betAmountInput.value = limits.min;
    } else if (value > limits.max) {
      betAmountInput.value = limits.max;
    }
    formatBetAmountInput();
  });

  function setToMinForCurrency() {
    const currency = currencySelect.value;
    const min = BET_LIMITS[currency].min;
    betAmountInput.value = min;
    formatBetAmountInput();
  }

  currencySelect.addEventListener('change', () => {
    setToMinForCurrency();
  });

  // Also update when navbar dropdown changes currency
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      setTimeout(setToMinForCurrency, 0); // Wait for value to update
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
  setupBetAmountAutoAdjust();
  // Set default value for USD with 2 decimals
  const betAmountInput = document.getElementById('bet-amount');
  const currencySelect = document.getElementById('currency');
  if (betAmountInput && currencySelect && currencySelect.value === 'USD') {
    betAmountInput.value = Number(betAmountInput.value).toFixed(2);
  }
});

// Example usage of placing a bet with either USD or LBP as currency
document.getElementById('heads-button').addEventListener('click', () => {
  const currency = document.getElementById('currency').value;
  placeBet('heads', currency);
});
document.getElementById('tails-button').addEventListener('click', () => {
  const currency = document.getElementById('currency').value;
  placeBet('tails', currency);
});

renderResultsHistory();
