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
  const { radius } = getWheelDimensions();
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

  // ─── A) Helper: getSession (same as coinflip.js) ────────────────
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
  
  getSession();

  // ─── Main: canvas ───────────────────────────────
  const canvas = document.getElementById('casesCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to match its display size
function resizeCanvas() {
  // Get the CSS display size
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  
  // Set canvas dimensions to match display size
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  
  // Calculate responsive history dimensions
  calculateHistoryDimensions();
  
  // Redraw wheel after resize
  drawWheel();
}

// Call resize on load and window resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Calculate wheel dimensions based on canvas size
function getWheelDimensions() {
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
  
  // Use the smaller dimension to ensure wheel fits in canvas
  const radius = Math.min(canvas.width, canvas.height) * 0.4;
  
  return { centerX, centerY, radius };
}

// Default wheel config (will be updated by dropdown selections)
let segments = 10;
let risk = 'easy';
let isSpinning = false;
let currentRotation = 0;
let targetRotation = 0;
let spinStartTime = 0;
let spinDuration = 300; // 3 seconds
let currentSpinResult = null; // Store the current spin result

// Get references to the dropdown elements and play button
const segmentsDropdown = document.getElementById('segments');
const riskDropdown = document.getElementById('risk');
const playBtn = document.getElementById('playBtn');
const betAmountInput = document.getElementById('betAmount');
const currencySelect = document.getElementById('currency');

// Add event listeners to update wheel when dropdowns change
segmentsDropdown.addEventListener('change', function() {
  segments = parseInt(this.value);
  drawWheel();
});

riskDropdown.addEventListener('change', function() {
  risk = this.value;
  drawWheel();
});

// Define minimum bet amounts for each currency
const MIN_BET = {
  USD: 0.10,
  LBP: 1000
};

// Function to update bet amount input based on selected currency
function updateBetAmountInput(currency, isInitialLoad = false) {
  // Set min attribute based on currency
  betAmountInput.min = MIN_BET[currency];
  
  // Set step attribute - smaller for USD, larger for LBP
  betAmountInput.step = currency === 'USD' ? 0.10 : 1000;
  
  // Only set to minimum when switching currencies (not on initial load)
  if (!isInitialLoad) {
    betAmountInput.value = MIN_BET[currency];
  } else {
    // On initial load, just validate that the current value is not below minimum
    const currentValue = parseFloat(betAmountInput.value);
    if (isNaN(currentValue) || currentValue < MIN_BET[currency]) {
      betAmountInput.value = MIN_BET[currency];
    }
  }
}

// Add event listener to currency select to update navbar and bet input
currencySelect.addEventListener('change', function() {
  // Get the selected currency
  const selectedCurrency = this.value;
  
  // Update the navbar currency if the function exists
  if (window.setNavbarCurrency) {
    window.setNavbarCurrency(selectedCurrency);
  }
  
  // Update bet amount input constraints (not initial load)
  updateBetAmountInput(selectedCurrency, false);
});

// Initialize bet amount input with default currency
window.addEventListener('DOMContentLoaded', () => {
  updateBetAmountInput(currencySelect.value, true);
});

// Add event listeners to validate bet amount when user finishes input
betAmountInput.addEventListener('change', function() {
  validateBetAmount();
});

betAmountInput.addEventListener('blur', function() {
  validateBetAmount();
});

// Function to validate and adjust bet amount
function validateBetAmount() {
  const currency = currencySelect.value;
  const betAmount = parseFloat(betAmountInput.value);
  
  if (isNaN(betAmount) || betAmount < MIN_BET[currency]) {
    betAmountInput.value = MIN_BET[currency];
  } else if (currency === 'LBP') {
    // For LBP, remove any decimals by using Math.floor
    betAmountInput.value = Math.floor(betAmount);
  }
}

// Add event listener for play button
playBtn.addEventListener('click', spinWheel);

// Sync the game's currency selector with the navbar currency
function syncCurrencyWithNavbar() {
  const navbarCurrency = window.getNavbarCurrency ? window.getNavbarCurrency() : 'USD';
  
  // If currency has changed, update it and set to minimum bet amount
  if (currencySelect.value !== navbarCurrency) {
    currencySelect.value = navbarCurrency;
    
    // Update bet amount to minimum for the new currency
    updateBetAmountInput(navbarCurrency, false);
  }
}

// Initial sync
window.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for navbar.js to initialize
  setTimeout(syncCurrencyWithNavbar, 500);
});

// Listen for navbar currency changes
document.addEventListener('click', (e) => {
  // If clicking on a dropdown item in the navbar
  if (e.target.closest('.dropdown-item')) {
    // Wait a bit for navbar.js to update
    setTimeout(syncCurrencyWithNavbar, 100);
  }
});

// Function to spin the wheel
async function spinWheel() {
  if (isSpinning) return; // Prevent multiple spins

  // Validate and adjust bet amount if needed
  validateBetAmount();
  
  const betAmount = parseFloat(betAmountInput.value);
  const currency = currencySelect.value;

  try {
    // Disable controls during spin
    isSpinning = true;
    playBtn.disabled = true;
    segmentsDropdown.disabled = true;
    riskDropdown.disabled = true;
    betAmountInput.disabled = true;
    currencySelect.disabled = true;

    // Get current session data to get balances
    const sessionData = await getSession();
    if (!sessionData) return;

    // Simulate immediate balance update in UI
    if (currency === 'USD') {
      const newBalance = sessionData.balanceUSD - betAmount;
      // Use the global function from navbar.js
      window.updateNavbarBalance('USD', newBalance);
    } else {
      const newBalance = sessionData.balanceLBP - betAmount;
      // Use the global function from navbar.js
      window.updateNavbarBalance('LBP', newBalance);
    }

    // Call the spin API
    const response = await fetch('/games/wheel/spin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: betAmount,
        currency,
        segments,
        risk
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to spin');
    }

    const result = await response.json();

    // Store the result for use in animation completion
    currentSpinResult = result;

    // Rotation logic
    const segmentAngle = (2 * Math.PI) / segments;
    const winningIndex = result.index;
    const winningMultiplier = result.multiplier;

    console.log(`Backend result: Index ${winningIndex}, Multiplier ${winningMultiplier}x`);

    currentRotation = 0;

    // ✅ Fixed rotation calculation
    const fullRotations = 4;
    const rotationToAlign = winningIndex * segmentAngle + segmentAngle / 2;
    targetRotation = (fullRotations * 2 * Math.PI) - rotationToAlign;


    // Start the spin animation
    spinStartTime = performance.now();
    requestAnimationFrame(animateSpin);

    // Update navbar after spin completes
    setTimeout(() => {
      // Update the navbar balances with the new values from the result
      window.updateNavbarBalance('USD', result.newBalanceUSD);
      window.updateNavbarBalance('LBP', result.newBalanceLBP);

      // Re-enable controls
      playBtn.disabled = false;
      segmentsDropdown.disabled = false;
      riskDropdown.disabled = false;
      betAmountInput.disabled = false;
      currencySelect.disabled = false;
      isSpinning = false;
    }, spinDuration + 100);

  } catch (error) {
    console.error('Spin error:', error);
    playBtn.disabled = false;
    segmentsDropdown.disabled = false;
    riskDropdown.disabled = false;
    betAmountInput.disabled = false;
    currencySelect.disabled = false;
    isSpinning = false;
  }
}


// Animate the wheel spin
function animateSpin(timestamp) {
  const elapsed = timestamp - spinStartTime;
  const progress = Math.min(elapsed / spinDuration, 1);

  // Easing
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Apply easing to rotation
  currentRotation = currentRotation + (targetRotation - currentRotation) * easeOut(progress);
  drawWheel(currentRotation);

  if (progress < 1) {
    requestAnimationFrame(animateSpin);
  } else {
    // Animation complete - add to history
    if (currentSpinResult) {
      // Start history animation
      isHistoryAnimating = true;
      historyAnimationProgress = 0;
      
      // Add new item to history with the multiplier from the result
      const newHistoryItem = {
        multiplier: currentSpinResult.multiplier,
        color: getSegmentColor(currentSpinResult.multiplier),
      };
      
      // Make sure history is initialized even for the first spin
      if (!spinHistory) {
        spinHistory = [];
      }
      
      // Add to beginning of array and maintain max length
      spinHistory.unshift(newHistoryItem);
      if (spinHistory.length > MAX_HISTORY_ITEMS) {
        spinHistory.pop();
      }
      
      // Force a redraw to ensure the history slots appear immediately
      drawWheel(currentRotation);
      
      // Animate history slots
      const historyAnimDuration = 300; // 300ms animation
      const historyStartTime = performance.now();
      
      function animateHistory() {
        const now = performance.now();
        const historyProgress = Math.min((now - historyStartTime) / historyAnimDuration, 1);
        
        // Update animation progress
        historyAnimationProgress = historyProgress === 1 ? 1 : 1 - Math.pow(2, -10 * historyProgress);
        
        // Force redraw during animation to ensure slots are visible
        drawWheel(currentRotation);
        
        if (historyProgress < 1) {
          requestAnimationFrame(animateHistory);
        } else {
          isHistoryAnimating = false;
          // Final redraw to ensure everything is displayed correctly
          drawWheel(currentRotation);
        }
      }
      
      // Start history animation
      requestAnimationFrame(animateHistory);
    }
 
    currentSpinResult = null;
  }
}

// These must match your backend multipliers
const wheelMultipliers = {
    10: {
      easy:   [1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0],
      medium: [0,   1.9, 0,   1.5, 0,   2,   0,   1.5, 0,   3],
      hard:   [0,   0,   0,   0,   0,   0,   0,   0,   0,   9.9]
    },
    20: {
      easy:   [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
      medium: [1.5, 0,   2,   0,   2, 0,   2,   0,   1.5, 0, 3,   0,   1.8, 0,   2,  0,   2,   0,   2,   0],
      hard:   [0,   0,   0,   0,   0, 0,   0,   0,   0,   0, 0,   0,   0,   0,   0, 0,   0,   0,   0,   19.8]
    },
    30: {
      easy: [
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
      ],
      medium: [
        1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0,
        2,   0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
        2,   0, 1.7, 0, 4, 0, 1.5, 0, 2, 0
      ],
      hard: [
        ...Array(29).fill(0), 29.7
      ]
    },
    40: {
      easy: [
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
      ],
      medium: [
        2, 0, 3, 0, 2, 0, 1.5, 0, 3, 0,
        1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0,
        1.5, 0, 2, 0, 2, 0, 1.6, 0, 2, 0,
        1.5, 0, 3, 0, 1.5, 0, 2, 0, 1.5, 0
      ],
      hard: [
        ...Array(39).fill(0), 39.6
      ]
    },
    50: {
      easy: [
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0,
        1.5, 1.2, 1.2, 1.2, 0,   1.2, 1.2, 1.2, 1.2, 0
      ],
      medium: [
        1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0,
        2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
        2, 0, 1.7, 0, 4, 0, 1.5, 0, 2, 0,
        2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0,
        1.5, 0, 2.2, 0, 4.5, 0, 3, 0, 3.5, 0
      ],
      hard: [
        ...Array(49).fill(0), 49.5
      ]
    }
  };

  // Helper to get color for multiplier 
  function getSegmentColor(mult) {
    if (mult === 0) return '#406c81';       // gray for 0 multiplier
    if (mult <= 1.2) return '#d5e8f1';      // white for 1.2 and below
    if (mult <= 1.5) return '#00e23c';      // green for 1.5
    if (mult <= 2) return '#fde73e';        // yellow for 2
    if (mult <= 3) return '#804ff7';        // purple for 3
    if (mult > 3 && mult < 9.8) return '#fda23e'; // orange for >3 <10
    if (mult >= 9.9) return '#fd1942';      // red for 9.9 and above
    return '#888888';                       // fallback gray
  }

  function drawWheel(rotation = 0) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw history slots at the top
    drawHistorySlots();
    
    // Get dimensions based on current canvas size
    const { centerX, centerY, radius } = getWheelDimensions();
  
    const outerRadius = radius;
    const innerRadius = radius * 0.85; // Bigger inner circle
    // Size for the center base circle (easily adjustable)
    const centerBaseSize = radius * 0.34; // Adjust this value to change the size
  
    // Save the context state before rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
  
    // Draw outer circle (background ring) FIRST
    ctx.beginPath();
    ctx.fillStyle = '#263741';
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  
    // Segment angle size
    const anglePerSegment = (2 * Math.PI) / segments;
  
    // Get multipliers for this config
    const segmentMultipliers = wheelMultipliers[segments][risk];
  
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = '#000000';
  
    // Draw segments between outerRadius and innerRadius
    for (let i = 0; i < segments; i++) {
      // Define segment angles - CRITICAL for correct alignment
      // Start angle of segment i = i * anglePerSegment - Math.PI/2 - anglePerSegment/2
      const startAngle = i * anglePerSegment - Math.PI/2;

      const endAngle = startAngle + anglePerSegment;
      
   
      
      // Draw the segment
      ctx.beginPath();
      ctx.moveTo(centerX + innerRadius * Math.cos(startAngle), centerY + innerRadius * Math.sin(startAngle));
      ctx.lineTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.lineTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      
      // Fill with appropriate color
      ctx.fillStyle = getSegmentColor(segmentMultipliers[i]);
      ctx.fill();
      ctx.stroke();
      
   
    }
  
    // Draw inner circle ON TOP of segments (to cover inner segment edges)
    ctx.beginPath();
    ctx.fillStyle = '#14222e';
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  
    // Draw outer circle ON TOP of segments (to cover outer segment edges)
    // This makes segments appear as thin "rings" between the circles
    ctx.beginPath();
    ctx.fillStyle = '#263741';
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = 15; // thickness of outer ring visible on top
    ctx.strokeStyle = '#263741';
    ctx.stroke();
    
    // Draw center base circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerBaseSize, 0, Math.PI * 2);
    ctx.lineWidth = 2; // Thickness of the border line
    ctx.strokeStyle = '#253640';
    ctx.stroke();
    
    // Restore the context state (removes rotation for pointer)
    ctx.restore();
    
    // Draw pointer at the top of the wheel (not rotated with wheel)
    const pointerColor = '#fa5970';
    const pointerCircleRadius = radius * 0.05;
    const pointerHeight = radius * 0.08;
    const pointerWidth = radius * 0.11;
    const pointerOffset = 15; // how much to move the pointer downwards (in pixels)
    
    // Draw the triangular part of the pointer
    ctx.beginPath();
    ctx.moveTo(centerX - pointerWidth / 2, centerY - outerRadius - pointerCircleRadius * 2); // Left point
    ctx.lineTo(centerX + pointerWidth / 2, centerY - outerRadius - pointerCircleRadius * 2); // Right point
    ctx.lineTo(centerX, centerY - outerRadius + pointerOffset); // Bottom point
    ctx.closePath();
    ctx.fillStyle = pointerColor;
    ctx.fill();
    
    // Draw the circle part of the pointer
    ctx.beginPath();
    ctx.arc(centerX, centerY - outerRadius - pointerHeight, pointerCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = pointerColor;
    ctx.fill();
    
    // Add a visual indicator for the winning segment when the wheel stops
    if (currentSpinResult && !isSpinning) {
      // Get which segment is at the top
      const topSegment = getSegmentAtTop(currentRotation);
      
      // Draw a small text label showing the segment index
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Landing: ${topSegment}`, centerX, centerY - outerRadius - pointerHeight * 3);
    }
    
    // Draw multiplier values at the bottom of the canvas
    drawMultiplierDisplay(segmentMultipliers, centerX, canvas.height - radius * 0.06, radius);
  }
  
  // Function to draw multiplier display at the bottom
  function drawMultiplierDisplay(multipliers, centerX, bottomY, radius) {
    // Get one representative multiplier for each color
    const colorRepresentatives = {
      '0': 0,                 // gray - 0
      '1.2': 1.2,             // white - 1.2 and below
      '1.5': 1.5,             // green - 1.5
      '2': 2,                 // yellow - 2
      '3': 3,                 // purple - 3
      '4': 4,                 // orange - >3 to <9.8
      '9.9': 9.9              // red - 9.9 and above
    };
    
    // Create an array of representative multipliers that exist in our current wheel
    const displayMultipliers = [];
    for (const key in colorRepresentatives) {
      const value = colorRepresentatives[key];
      // Always include 0 multiplier
      if (value === 0) {
        displayMultipliers.push(value);
        continue;
      }
      
      // For others, check if we have this color in our wheel
      const hasColor = multipliers.some(m => {
        if (value === 1.2 && m <= 1.2 && m > 0) return true;
        if (value === 1.5 && m <= 1.5 && m > 1.2) return true;
        if (value === 2 && m <= 2 && m > 1.5) return true;
        if (value === 3 && m <= 3 && m > 2) return true;
        if (value === 4 && m > 3 && m < 9.8) return true;
        if (value === 9.9 && m >= 9.8) return true;
        return false;
      });
      
      if (hasColor) {
        displayMultipliers.push(value);
      }
    }
    
    // Sort from lowest to highest
    displayMultipliers.sort((a, b) => a - b);
    
    // Calculate dimensions - make responsive to both canvas width and height
    const minDimension = Math.min(canvas.width, canvas.height);
    const maxBoxWidth = minDimension * 0.15; // Cap maximum box size for very large screens
    
    // Calculate responsive dimensions based on canvas size
    const boxHeight = Math.min(radius * 0.25, maxBoxWidth * 0.75);
    const boxWidth = Math.min(radius * 0.4, maxBoxWidth);
    const boxMargin = Math.min(radius * 0.1, maxBoxWidth * 0.25);
    const borderRadius = boxHeight * 0.25;
    const colorLineHeight = boxHeight * 0.15;
    
    // Calculate total width needed
    const totalWidth = (boxWidth + boxMargin) * displayMultipliers.length - boxMargin;
    
    // If boxes would be too wide for the screen, scale them down
    const maxTotalWidth = canvas.width * 0.95;
    let scale = 1;
    if (totalWidth > maxTotalWidth) {
      scale = maxTotalWidth / totalWidth;
    }
    
    // Apply scaling if needed
    const scaledBoxWidth = boxWidth * scale;
    const scaledBoxMargin = boxMargin * scale;
    const scaledTotalWidth = totalWidth * scale;
    
    // Start position - centered horizontally
    let startX = centerX - scaledTotalWidth / 2;
    
    // Set text properties - scale font with box size
    const fontSize = Math.min(boxHeight * 0.36 * scale, 24); // Cap font size
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw each multiplier box
    displayMultipliers.forEach(multiplier => {
      // Background box
      ctx.beginPath();
      // Draw rounded rectangle
      ctx.moveTo(startX + borderRadius, bottomY - boxHeight);
      ctx.lineTo(startX + scaledBoxWidth - borderRadius, bottomY - boxHeight);
      ctx.arcTo(startX + scaledBoxWidth, bottomY - boxHeight, startX + scaledBoxWidth, bottomY - boxHeight + borderRadius, borderRadius);
      ctx.lineTo(startX + scaledBoxWidth, bottomY - colorLineHeight);
      ctx.lineTo(startX, bottomY - colorLineHeight);
      ctx.lineTo(startX, bottomY - boxHeight + borderRadius);
      ctx.arcTo(startX, bottomY - boxHeight, startX + borderRadius, bottomY - boxHeight, borderRadius);
      ctx.closePath();
      
      ctx.fillStyle = '#2f4552';
      ctx.fill();
      
      // Color line at the bottom
      ctx.beginPath();
      ctx.rect(startX, bottomY - colorLineHeight, scaledBoxWidth, colorLineHeight);
      ctx.fillStyle = getSegmentColor(multiplier);
      ctx.fill();
      
      // Multiplier text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(multiplier.toFixed(2) + 'x', startX + scaledBoxWidth / 2, bottomY - boxHeight / 2 - colorLineHeight / 2);
      
      // Move to next position
      startX += scaledBoxWidth + scaledBoxMargin;
    });
  }
  
  
  // Initial draw - removed as we now call drawWheel() from resizeCanvas()
  // drawWheel();
  
  // If you want to update segments or risk and redraw later:
  // segments = 20;
  // risk = 'medium';
  // drawWheel();
  
  // Helper function to determine which segment is at the top after rotation
  function getSegmentAtTop(rotation) {
    const segmentAngle = (2 * Math.PI) / segments;
  
    // Normalize rotation to [0, 2π)
    const normalizedRotation = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
    // Angle of the pointer
    const pointerAngle = -Math.PI / 2;
  
    // Relative angle in the wheel's rotated space
    const angleAtPointer = (normalizedRotation + pointerAngle + 2 * Math.PI) % (2 * Math.PI);
  
    // Shift by half a segment to center
    const segmentIndex = Math.floor((angleAtPointer + segmentAngle / 2) / segmentAngle) % segments;
  
    return segmentIndex;
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
      const fontSize = Math.max(10, Math.round(HISTORY_SLOT_WIDTH * 0.28));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.multiplier.toFixed(2) + 'x',
                   x + HISTORY_SLOT_WIDTH / 2,
                   HISTORY_TOP_MARGIN + HISTORY_SLOT_HEIGHT / 2);
    });
  }
  