// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else if (currency === 'LBP') {
    // Format LBP with commas and £ symbol
    return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return amount.toString();
}

// History slots configuration
const MAX_HISTORY_ITEMS = 10;
let HISTORY_SLOT_WIDTH;
let HISTORY_SLOT_HEIGHT;
let HISTORY_SLOT_MARGIN;
let HISTORY_TOP_MARGIN;
let HISTORY_RIGHT_MARGIN;
let HISTORY_CORNER_RADIUS;

// Array to store history of spins
let spinHistory = [];
let isHistoryAnimating = false;
let historyAnimationProgress = 0;

// Function to calculate responsive history slot dimensions
function calculateHistoryDimensions() {
  // Make history slots responsive based on canvas size
  HISTORY_SLOT_WIDTH = Math.round(canvas.width * 0.1);
  HISTORY_SLOT_HEIGHT = Math.round(HISTORY_SLOT_WIDTH * 0.7);
  HISTORY_SLOT_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 0.2);
  HISTORY_TOP_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 0.4);
  // Adjust the right margin to ensure slots are clearly visible
  HISTORY_RIGHT_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 0.5); // Reduced to ensure visibility
  HISTORY_CORNER_RADIUS = Math.round(HISTORY_SLOT_WIDTH * 0.16);
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Get session info
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

// Load user session when page loads
getSession();

// Get references to UI elements
const canvas = document.getElementById('limboCanvas');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const betAmountInput = document.getElementById('betAmount');
const currencySelect = document.getElementById('currency');
const targetMultiplierInput = document.getElementById('targetMultiplier');
const profitOnWinDisplay = document.getElementById('profitOnWin');
const winChanceDisplay = document.getElementById('winChanceDisplay');

// Constants for multiplier limits
const MIN_MULTIPLIER = 1.01;
const MAX_MULTIPLIER = 1000;

// Constants for bet amount limits
const MIN_BET = {
  USD: 0.10,
  LBP: 10000
};

// Add validation for target multiplier input
function validateTargetMultiplier() {
  let value = parseFloat(targetMultiplierInput.value);
  
  // Handle empty or non-numeric input
  if (isNaN(value)) {
    value = 2.00; // Default value
  }
  
  // Enforce min/max constraints
  value = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, value));
  
  // Format to 2 decimal places
  value = parseFloat(value.toFixed(2));
  
  // Update input and recalculate
  targetMultiplierInput.value = value;
  updateGameValues();
}

// Add validation for bet amount input
function validateBetAmount() {
  let value = parseFloat(betAmountInput.value);
  const currency = currencySelect.value;
  const minBet = MIN_BET[currency];
  
  // Handle empty or non-numeric input
  if (isNaN(value) || value <= 0) {
    value = minBet; // Default to minimum bet
  }
  
  // Enforce minimum bet constraint
  value = Math.max(minBet, value);
  
  // Format appropriately based on currency
  if (currency === 'USD') {
    // Always format to 2 decimal places for USD
    betAmountInput.value = value.toFixed(2);
  } else {
    // Round to whole number for LBP
    betAmountInput.value = Math.round(value);
  }
  
  // Update game values
  updateGameValues();
}

// Add event listeners for target multiplier validation - only after user finishes input
targetMultiplierInput.addEventListener('blur', validateTargetMultiplier);
targetMultiplierInput.addEventListener('change', validateTargetMultiplier);

// Add event listeners for bet amount validation - only after user finishes input
betAmountInput.addEventListener('blur', validateBetAmount);
betAmountInput.addEventListener('change', validateBetAmount);

// Update bet amount validation when currency changes
currencySelect.addEventListener('change', function() {
  // Update min attribute on the input
  const newCurrency = this.value;
  betAmountInput.min = MIN_BET[newCurrency];
  
  // Always set to minimum bet amount for the new currency
  betAmountInput.value = newCurrency === 'USD' ? 
    MIN_BET.USD.toFixed(2) : 
    MIN_BET.LBP.toString();
  
  // Update game values with new currency and bet amount
  updateGameValues();
});

// Navbar elements
const balanceBox = document.getElementById('balance-box');
const selectedBalance = document.getElementById('selected-balance');
const dropdownItems = document.querySelectorAll('.dropdown-item');

// ─── Sync currency selection between navbar and game controls ────────────────
function syncCurrencySelections() {
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      
      // Always set to minimum bet amount for the selected currency
      betAmountInput.value = currency === 'USD' ? 
        MIN_BET.USD.toFixed(2) : 
        MIN_BET.LBP.toString();
      
      // Update profit calculation
      updateGameValues();
    });
  });

  // Set up event listener for game control currency dropdown
  currencySelect.addEventListener('change', () => {
    const currency = currencySelect.value;
    
    // Find the corresponding navbar dropdown item
    const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    
    if (matchingItem) {
      // Update selected balance display
      const amountSpan = matchingItem.querySelector('.amount-label');
      if (amountSpan) {
        selectedBalance.textContent = amountSpan.textContent;
      }
      
      // Hide dropdown after selection
      const dropdown = document.getElementById('balance-dropdown');
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    }
    
    // Note: We don't need to set the bet amount to minimum here
    // as it's already handled by the currencySelect change event listener
    // that we defined separately
  });
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
  
  // Set initial min attribute on bet amount input
  betAmountInput.min = MIN_BET[currencySelect.value];
  
  // Validate initial values
  validateBetAmount();
  validateTargetMultiplier();
});

// Animation state
let currentValue = 1.00; // Start at 1.00
let targetValue = 0;
let isWin = false;
let animating = false;
let animationStartTime = null;
let displayColor = 'white';

// Resize canvas to fit parent or window
function resizeCanvas() {
  // Get the game container's dimensions
  const gameContainer = document.querySelector('.game-container');
  const containerWidth = gameContainer.clientWidth;
  
  // Set canvas size based on container width (keeping it square)
  canvas.width = containerWidth;
  canvas.height = containerWidth * 0.6;
  
  // Calculate responsive history dimensions
  calculateHistoryDimensions();
  
  // Redraw if we have a current value
  if (currentValue > 0) {
    drawNumber();
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Interpolate number over time
function animateNumber(timestamp) {
  if (!animationStartTime) animationStartTime = timestamp;
  const duration = 700; // 0.7 seconds
  const progress = Math.min((timestamp - animationStartTime) / duration, 1);
  
  // Start from 1.00 and animate to targetValue
  // Ensure multiplier never goes below 1.00
  const startValue = 1.00;
  currentValue = startValue + ((targetValue - startValue) * progress);
  currentValue = Math.max(1.00, currentValue); // Ensure minimum of 1.00
  
  drawNumber();

  if (progress < 1) {
    requestAnimationFrame(animateNumber);
  } else {
    displayColor = isWin ? 'limegreen' : 'crimson';
    drawNumber(); // Final draw with result color
    animating = false;
    
    // Re-enable controls after animation
    enableControls();
    
    // Add the result to history after animation completes
    addToHistory(targetValue, isWin);
  }
}

// Draw centered number
function drawNumber() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw history slots first (behind the number)
  drawHistorySlots();

  // Draw the number
  ctx.fillStyle = displayColor;
  ctx.font = `bold ${Math.floor(canvas.width / 7)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(currentValue.toFixed(2) + 'x', canvas.width / 2, canvas.height / 2);
}

// Disable controls during animation
function disableControls() {
  playBtn.disabled = true;
  betAmountInput.disabled = true;
  currencySelect.disabled = true;
  targetMultiplierInput.disabled = true;
}

// Enable controls after animation
function enableControls() {
  playBtn.disabled = false;
  betAmountInput.disabled = false;
  currencySelect.disabled = false;
  targetMultiplierInput.disabled = false;
}

// Calculate win chance based on target multiplier
function calculateWinChance(multiplier) {
  // House edge of 1%
  const houseEdge = 0.01;
  // Theoretical win chance formula: (1 - house edge) / multiplier * 100
  const winChance = ((1 - houseEdge) / multiplier) * 100;
  // Return with 8 decimal precision
  return winChance.toFixed(8);
}

// Update profit on win calculation and win chance
function updateGameValues() {
  const betAmount = parseFloat(betAmountInput.value);
  const targetMultiplier = parseFloat(targetMultiplierInput.value);
  const currency = currencySelect.value;
  
  // Update profit display
  if (!isNaN(betAmount) && !isNaN(targetMultiplier)) {
    const profit = betAmount * targetMultiplier - betAmount;
    profitOnWinDisplay.textContent = formatCurrencyAmount(profit, currency);
  } else {
    profitOnWinDisplay.textContent = formatCurrencyAmount(0, currency);
  }
  
  // Update win chance display
  if (!isNaN(targetMultiplier)) {
    const winChance = calculateWinChance(targetMultiplier);
    winChanceDisplay.textContent = winChance;
  } else {
    winChanceDisplay.textContent = "0.00000000";
  }
}

// Add event listeners for input changes
betAmountInput.addEventListener('input', updateGameValues);
targetMultiplierInput.addEventListener('input', updateGameValues);
// Remove the currency select event listener since it's now handled in syncCurrencySelections
// currencySelect.addEventListener('change', updateGameValues);

// Initial calculations
updateGameValues();

// Add a result to the history
function addToHistory(multiplier, isWin) {
  // Create new history item
  const historyItem = {
    multiplier: multiplier,
    color: isWin ? '#00e53d' : '#ea183a' // Green for win, red for loss
  };
  
  // Add to beginning of array
  spinHistory.unshift(historyItem);
  
  // Limit to max items
  if (spinHistory.length > MAX_HISTORY_ITEMS) {
    spinHistory.pop();
  }
  
  // Animate the history update
  isHistoryAnimating = true;
  historyAnimationProgress = 0;
  
  // Animate the history slots
  function animateHistory() {
    historyAnimationProgress += 0.1;
    if (historyAnimationProgress < 1) {
      requestAnimationFrame(animateHistory);
    } else {
      isHistoryAnimating = false;
    }
    drawNumber(); // Redraw to show animation
  }
  
  requestAnimationFrame(animateHistory);
}

// Draw history slots at the top of the canvas
function drawHistorySlots() {
  // Skip if no history
  if (!spinHistory || spinHistory.length === 0) {
    return;
  }
  
  // Calculate the fixed position for the first slot
  const firstSlotX = canvas.width - HISTORY_SLOT_WIDTH - 15;
  
  spinHistory.forEach((item, index) => {
    // For the first slot, use our fixed position
    // For subsequent slots, offset based on the first slot position
    const targetX = index === 0 
      ? firstSlotX
      : firstSlotX - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * index;

    // Compute off-screen start position only for the newest (index 0)
    let startX;
    if (index === 0) {
      // Place it just outside the right edge
      startX = canvas.width;
    } else {
      // Slide existing slots from where the previous index was sitting
      startX = index === 1
        ? firstSlotX  // First slot's position
        : firstSlotX - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * (index - 1);
    }

    // Interpolate between start and target if animating
    let x = isHistoryAnimating
          ? startX + (targetX - startX) * historyAnimationProgress
          : targetX;
    
    // Draw the slot at position x
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = Math.round(HISTORY_SLOT_WIDTH * 0.12);
    ctx.shadowOffsetY = Math.round(HISTORY_SLOT_WIDTH * 0.04);
    ctx.fillStyle = item.color;
    roundRect(ctx, x, HISTORY_TOP_MARGIN,
              HISTORY_SLOT_WIDTH, HISTORY_SLOT_HEIGHT,
              HISTORY_CORNER_RADIUS);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'black';
    const fontSize = Math.max(10, Math.round(HISTORY_SLOT_WIDTH * 0.32));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.multiplier.toFixed(2) + 'x',
                 x + HISTORY_SLOT_WIDTH / 2,
                 HISTORY_TOP_MARGIN + HISTORY_SLOT_HEIGHT / 2);
  });
}

// Trigger animation from backend result
function playLimbo(result) {
  currentValue = 1.00; // Start from 1.00
  animationStartTime = null;
  
  // Calculate stopAmount based on backend response
  // If stopAmount is directly provided, use it
  if (result.stopAmount !== undefined && !isNaN(parseFloat(result.stopAmount))) {
    targetValue = parseFloat(result.stopAmount);
  } 
  // If roll is provided (current backend format), convert it to a multiplier
  else if (result.roll !== undefined && !isNaN(parseFloat(result.roll))) {
    // Convert roll to multiplier (common formula for provably fair games)
    // Roll is typically a value between 0 and 100
    // Lower roll = higher multiplier
    // Typical formula: 100 / (roll + 1) or similar
    targetValue = parseFloat((100 / result.roll).toFixed(2));
    console.log('Calculated stopAmount from roll:', targetValue);
  }
  // Fallback if neither stopAmount nor roll is provided
  else {
    console.error('Missing stopAmount and roll in response', result);
    // Fallback calculation - should rarely be used
    targetValue = result.win ? 
      parseFloat(targetMultiplierInput.value) : 
      (parseFloat(targetMultiplierInput.value) * 0.8);
  }
  
  isWin = result.win;
  displayColor = 'white';
  animating = true;
  
  console.log('Animation target value (stopAmount):', targetValue);
  console.log('Win:', isWin, 'Target Multiplier:', parseFloat(targetMultiplierInput.value));
  
  // Start the animation
  requestAnimationFrame(animateNumber);
}

// Play button click handler - connect to backend
playBtn.addEventListener('click', async () => {
  if (animating) return; // Prevent multiple clicks during animation
  
  const betAmount = parseFloat(betAmountInput.value);
  const targetMultiplier = parseFloat(targetMultiplierInput.value);
  const currency = currencySelect.value;
  
  // Validate inputs
  if (isNaN(betAmount) || betAmount < MIN_BET[currency]) {
    alert(`Minimum bet amount for ${currency} is ${MIN_BET[currency]}`);
    validateBetAmount(); // Auto-correct the value
    return;
  }
  
  if (isNaN(targetMultiplier) || targetMultiplier < MIN_MULTIPLIER || targetMultiplier > MAX_MULTIPLIER) {
    alert(`Target multiplier must be between ${MIN_MULTIPLIER} and ${MAX_MULTIPLIER}`);
    validateTargetMultiplier(); // Auto-correct the value
    return;
  }
  
  // Disable controls during play
  disableControls();
  
  try {
    // Get current balance from the navbar dropdown
    const dropdownItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    let currentBalance = 0;
    
    if (dropdownItem) {
      const amountLabel = dropdownItem.querySelector('.amount-label');
      if (amountLabel) {
        // Extract number from the formatted amount
        if (currency === 'USD') {
          // Extract number from format like "$123.45"
          currentBalance = parseFloat(amountLabel.textContent.replace(/[^0-9.]/g, ''));
        } else {
          // Extract number from format like "£123,456"
          currentBalance = parseFloat(amountLabel.textContent.replace(/[^0-9]/g, ''));
        }
      }
    }
    
    // Calculate new balance (deducting bet amount)
    const newDisplayBalance = currentBalance - betAmount;
    
    // Update the dropdown item with new balance
    if (dropdownItem) {
      dropdownItem.innerHTML = `
        <span class="amount-label">${formatCurrencyAmount(newDisplayBalance, currency)}</span>
        <span class="currency-label">${currency}</span>
      `;
    }
    
    // Also update the selected balance if it matches the current currency
    const selectedBalance = document.getElementById('selected-balance');
    if (selectedBalance && selectedBalance.textContent.includes(currency === 'USD' ? '$' : '£')) {
      selectedBalance.textContent = formatCurrencyAmount(newDisplayBalance, currency);
    }
    
    // Call the backend API
    const response = await fetch('/games/limbo/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetMultiplier,
        betAmount,
        currency
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to play');
    }
    
    const result = await response.json();
    console.log('Game result:', result);
    
    // Store the backend balance update for later (after animation)
    const finalBalance = result.newBalance;
    
    // Modify playLimbo function to handle the delayed balance update
    const modifiedResult = { ...result };
    delete modifiedResult.newBalance; // Remove so it doesn't update balance during animation
    
    // Trigger animation with modified result
    playLimbo(modifiedResult);
    
    // After animation completes, update with actual balance from backend
    setTimeout(() => {
      // Update the dropdown item with final balance from server
      const dropdownItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
      if (dropdownItem) {
        dropdownItem.innerHTML = `
          <span class="amount-label">${formatCurrencyAmount(finalBalance, currency)}</span>
          <span class="currency-label">${currency}</span>
        `;
      }
      
      // Also update the selected balance if it matches the current currency
      const selectedBalance = document.getElementById('selected-balance');
      if (selectedBalance && selectedBalance.textContent.includes(currency === 'USD' ? '$' : '£')) {
        selectedBalance.textContent = formatCurrencyAmount(finalBalance, currency);
      }
    }, 800); // Slightly longer than animation duration (700ms)
    
  } catch (error) {
    console.error('Game error:', error);
    alert('Error: ' + error.message);
    enableControls();
  }
});

// Draw initial state
drawNumber();

// Format initial bet amount
validateBetAmount();
