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

// ─── B) Canvas Setup ────────────────
const canvas = document.getElementById('diceCanvas');
const ctx = canvas.getContext('2d');

// Handle high DPI displays
function resizeCanvas() {
    const scale = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Set the canvas size for high DPI
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;

    // Scale the context for high DPI
    ctx.scale(scale, scale);

    drawGame();
}


//////// CONST MULTIPLIERS ////////////////////////
const multipliers = {
    rollUnder: {
      "2": "49.5000",
      "3": "33.0000",
      "4": "24.7500",
      "5": "19.8000",
      "6": "16.5000",
      "7": "14.1429",
      "8": "12.3750",
      "9": "11.0000",
      "10": "9.9000",
      "11": "9.0000",
      "12": "8.2500",
      "13": "7.6154",
      "14": "7.0714",
      "15": "6.6000",
      "16": "6.1875",
      "17": "5.8235",
      "18": "5.5000",
      "19": "5.2105",
      "20": "4.9500",
      "21": "4.7143",
      "22": "4.5000",
      "23": "4.3043",
      "24": "4.1250",
      "25": "3.9600",
      "26": "3.8077",
      "27": "3.6667",
      "28": "3.5357",
      "29": "3.4138",
      "30": "3.3000",
      "31": "3.1935",
      "32": "3.0938",
      "33": "3.0000",
      "34": "2.9118",
      "35": "2.8286",
      "36": "2.7500",
      "37": "2.6757",
      "38": "2.6053",
      "39": "2.5385",
      "40": "2.4750",
      "41": "2.4146",
      "42": "2.3571",
      "43": "2.3023",
      "44": "2.2500",
      "45": "2.2000",
      "46": "2.1522",
      "47": "2.1064",
      "48": "2.0625",
      "49": "2.0204",
      "50": "1.9800",
      "51": "1.9412",
      "52": "1.9038",
      "53": "1.8679",
      "54": "1.8333",
      "55": "1.8000",
      "56": "1.7679",
      "57": "1.7368",
      "58": "1.7069",
      "59": "1.6780",
      "60": "1.6500",
      "61": "1.6230",
      "62": "1.5968",
      "63": "1.5714",
      "64": "1.5469",
      "65": "1.5231",
      "66": "1.5000",
      "67": "1.4776",
      "68": "1.4559",
      "69": "1.4348",
      "70": "1.4143",
      "71": "1.3944",
      "72": "1.3750",
      "73": "1.3562",
      "74": "1.3378",
      "75": "1.3200",
      "76": "1.3026",
      "77": "1.2857",
      "78": "1.2692",
      "79": "1.2532",
      "80": "1.2375",
      "81": "1.2222",
      "82": "1.2073",
      "83": "1.1928",
      "84": "1.1786",
      "85": "1.1647",
      "86": "1.1512",
      "87": "1.1379",
      "88": "1.1250",
      "89": "1.1124",
      "90": "1.1000",
      "91": "1.0879",
      "92": "1.0761",
      "93": "1.0645",
      "94": "1.0532",
      "95": "1.0421",
      "96": "1.0312",
      "97": "1.0206",
      "98": "1.0102"
    },
    rollOver: {
      "2": "1.0102",
      "3": "1.0206",
      "4": "1.0312",
      "5": "1.0421",
      "6": "1.0532",
      "7": "1.0645",
      "8": "1.0761",
      "9": "1.0879",
      "10": "1.1000",
      "11": "1.1124",
      "12": "1.1250",
      "13": "1.1379",
      "14": "1.1512",
      "15": "1.1647",
      "16": "1.1786",
      "17": "1.1928",
      "18": "1.2073",
      "19": "1.2222",
      "20": "1.2375",
      "21": "1.2532",
      "22": "1.2692",
      "23": "1.2857",
      "24": "1.3026",
      "25": "1.3200",
      "26": "1.3378",
      "27": "1.3562",
      "28": "1.3750",
      "29": "1.3944",
      "30": "1.4143",
      "31": "1.4348",
      "32": "1.4559",
      "33": "1.4776",
      "34": "1.5000",
      "35": "1.5231",
      "36": "1.5469",
      "37": "1.5714",
      "38": "1.5968",
      "39": "1.6230",
      "40": "1.6500",
      "41": "1.6780",
      "42": "1.7069",
      "43": "1.7368",
      "44": "1.7679",
      "45": "1.8000",
      "46": "1.8333",
      "47": "1.8679",
      "48": "1.9038",
      "49": "1.9412",
      "50": "1.9800",
      "51": "2.0204",
      "52": "2.0625",
      "53": "2.1064",
      "54": "2.1522",
      "55": "2.2000",
      "56": "2.2500",
      "57": "2.3023",
      "58": "2.3571",
      "59": "2.4146",
      "60": "2.4750",
      "61": "2.5385",
      "62": "2.6053",
      "63": "2.6757",
      "64": "2.7500",
      "65": "2.8286",
      "66": "2.9118",
      "67": "3.0000",
      "68": "3.0938",
      "69": "3.1935",
      "70": "3.3000",
      "71": "3.4138",
      "72": "3.5357",
      "73": "3.6667",
      "74": "3.8077",
      "75": "3.9600",
      "76": "4.1250",
      "77": "4.3043",
      "78": "4.5000",
      "79": "4.7143",
      "80": "4.9500",
      "81": "5.2105",
      "82": "5.5000",
      "83": "5.8235",
      "84": "6.1875",
      "85": "6.6000",
      "86": "7.0714",
      "87": "7.6154",
      "88": "8.2500",
      "89": "9.0000",
      "90": "9.9000",
      "91": "11.0000",
      "92": "12.3750",
      "93": "14.1429",
      "94": "16.5000",
      "95": "19.8000",
      "96": "24.7500",
      "97": "33.0000",
      "98": "49.5000"
    }
  };
  


// ─── C) Game State ────────────────
let isGameActive = false;
let currentRoll = null;
let rollAnimation = null;
let targetLine = 50;
let isRolling = false;
let sliderDimensions = null;
let rollResult = null;
let rollType = 'over';
let isDragging = false;
let dragStartX = null;
let dragStartValue = null;
let currentAnimatedValue = 50;
let lastPlayedValue = 50;
let gameResult = null;

// History state
const MAX_HISTORY_ITEMS = 10;
let rollHistory = [];
let historyAnimationProgress = 0;
let isHistoryAnimating = false;

// History slot dimensions
const HISTORY_SLOT_SIZE = 32;  // Height of the slot
const HISTORY_SLOT_WIDTH = HISTORY_SLOT_SIZE * 1.5;  // Make the slot wider than it is tall
const HISTORY_SLOT_MARGIN = 8;  // Space between slots
const HISTORY_TOP_MARGIN = 20;  // Distance from top of canvas
const HISTORY_RIGHT_MARGIN = 60;  // Distance from right edge
const HISTORY_CORNER_RADIUS = 6;  // Radius for rounded corners

// Create audio elements for slider sound and win/lose sounds
const sliderSound = new Audio('/games/dice/dice_slider_sound.mp3');
sliderSound.volume = 0.3; // Reduce volume to 30%
let canPlaySound = false;
let lastSoundTime = 0;
const SOUND_DELAY = 50; // Minimum milliseconds between sounds
const winSound = new Audio('/games/dice/win_sound.mp3');
const loseSound = new Audio('/games/dice/lose_sound.mp3');

function playSliderSound() {
  if (canPlaySound) {
    const now = Date.now();
    if (now - lastSoundTime >= SOUND_DELAY) {
      const sound = sliderSound.cloneNode();
      sound.play().catch(() => {});
      lastSoundTime = now;
    }
  }
}

// Enable sound on first interaction
document.addEventListener('click', () => {
  canPlaySound = true;
}, { once: true });

// Constants
const MIN_VALUE = 2;
const MAX_VALUE = 98;
const ANIMATION_SPEED = 0.3;

// Colors
const COLORS = {
    background: '#0f212d',
    sliderBg: '#1a2c38',
    sliderFill: '#2ecc71',
    sliderHandle: '#fff',
    text: '#fff',
    textDim: '#8fa3b0',
    gridLine: 'rgba(255, 255, 255, 0.1)',
    targetLine: '#1fff20',
    over: '#00e53d',  // Green
    under: '#ea183a'  // Red
};

// ─── D) UI Elements ────────────────
const playButton = document.getElementById('playBtn');
console.log('Play button found:', playButton); // Debug log

const cashoutButton = document.getElementById('cashoutBtn');
const betAmountInput = document.getElementById('betAmount');
const currencySelect = document.getElementById('currency');
const targetNumberInput = document.getElementById('targetNumber');
const rollTypeSelect = document.getElementById('rollType');
const winAmountSpan = document.getElementById('winAmount');
const winCurrencySpan = document.getElementById('winCurrency');
const winMultiplierSpan = document.getElementById('winMultiplier');
const profitOnWin = document.getElementById('profitOnWin');

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
      // Update profit calculation
      updateProfitOnWin();
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
    
    // Update profit calculation
    updateProfitOnWin();
  });
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
});

// ─── E) Helper Functions ────────────────
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
    } else if (currency === 'LBP') {
        return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}




// ─── DRAWING FUNCTIONS ─────────────────────────────

function drawSlider(ctx, width, height) {
    const RAIL_HEIGHT = 8;
    const RAIL_RADIUS = RAIL_HEIGHT / 2;
    const PADDING = 40;
    const SLIDER_WIDTH = width - PADDING * 2;
    const SLIDER_X = PADDING;
    const SLIDER_Y = height / 2 - RAIL_HEIGHT / 2;
    const HANDLE_SIZE = 36;

    // Background dimensions
    const BG_PADDING = 25;
    const BG_HEIGHT = 60;
    const BG_RADIUS = 35;
    
    // Shared constants
    const numbers = [0, 25, 50, 75, 100];
    
    // Outer background dimensions
    const OUTER_BG_X = SLIDER_X - BG_PADDING;
    const OUTER_BG_Y = SLIDER_Y - (BG_HEIGHT - RAIL_HEIGHT) / 2;
    const OUTER_BG_WIDTH = SLIDER_WIDTH + (BG_PADDING * 2);
    
    // Inner background dimensions (slightly smaller)
    const INNER_PADDING = 15;  // Reduced from 2 to 1 for a tighter look
    const INNER_BG_X = OUTER_BG_X + INNER_PADDING;
    const INNER_BG_Y = OUTER_BG_Y + INNER_PADDING;
    const INNER_BG_WIDTH = OUTER_BG_WIDTH - (INNER_PADDING * 2);
    const INNER_BG_HEIGHT = BG_HEIGHT - (INNER_PADDING * 2);
  
    // Calculate handle position (constrained to 2-98%)
    const pct = (currentAnimatedValue - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    
    // Position handle between 2-98% of width
    const handleX = SLIDER_X + (SLIDER_WIDTH * 0.02) + (SLIDER_WIDTH * 0.82 * pct);
    const handleY = SLIDER_Y + RAIL_HEIGHT / 2 - HANDLE_SIZE / 2;
    
    // Draw outer background
    ctx.fillStyle = '#2f4552';
    roundRect(ctx, OUTER_BG_X, OUTER_BG_Y, OUTER_BG_WIDTH, BG_HEIGHT, BG_RADIUS);
    ctx.fill();

    // Draw triangular arrows for each number position
    ctx.fillStyle = '#2f4552';
    const arrowHeight = 5;  // Height of the triangle
    const arrowWidth = 12;  // Width of the triangle base
    const spacingFactor = 0.98; // Reduces the spacing (1 = full width, smaller = more compact)
    const arrowOffset  = 2;

    numbers.forEach(num => {
        // Calculate position with adjusted spacing
        const pct = num / 100;
        const adjustedPct = 0.5 + (pct - 0.5) * spacingFactor; // Center-based scaling
        const x = SLIDER_X + (SLIDER_WIDTH * adjustedPct);
        
        // Draw triangle pointing upward
        ctx.beginPath();
        ctx.moveTo(x, OUTER_BG_Y - arrowHeight );  // Top point
        ctx.lineTo(x - arrowWidth/2, OUTER_BG_Y + arrowOffset);  // Bottom left
        ctx.lineTo(x + arrowWidth/2, OUTER_BG_Y + arrowOffset);  // Bottom right
        ctx.closePath();
        ctx.fill();
    });

    // Draw inner background
    ctx.fillStyle = '#0f212d';
    roundRect(ctx, INNER_BG_X, INNER_BG_Y, INNER_BG_WIDTH, INNER_BG_HEIGHT, BG_RADIUS - INNER_PADDING);
    ctx.fill();
  
    // Draw rail background
    ctx.fillStyle = COLORS.sliderBg;
    roundRect(ctx, SLIDER_X, SLIDER_Y, SLIDER_WIDTH, RAIL_HEIGHT, RAIL_RADIUS);
    ctx.fill();
  
    // Draw colored portions based on roll type
    if (rollType === 'over') {
        // Left side (red)
        ctx.fillStyle = COLORS.under;
        roundRect(ctx, SLIDER_X, SLIDER_Y, handleX - SLIDER_X, RAIL_HEIGHT, RAIL_RADIUS, {
            topLeft: true, bottomLeft: true, topRight: false, bottomRight: false
        });
        ctx.fill();
        
        // Right side (green)
        ctx.fillStyle = COLORS.over;
        roundRect(ctx, handleX, SLIDER_Y, SLIDER_WIDTH - (handleX - SLIDER_X), RAIL_HEIGHT, RAIL_RADIUS, {
            topLeft: false, bottomLeft: false, topRight: true, bottomRight: true
        });
        ctx.fill();
    } else {
        // Left side (green)
        ctx.fillStyle = COLORS.over;
        roundRect(ctx, SLIDER_X, SLIDER_Y, handleX - SLIDER_X, RAIL_HEIGHT, RAIL_RADIUS, {
            topLeft: true, bottomLeft: true, topRight: false, bottomRight: false
        });
        ctx.fill();
        
        // Right side (red)
        ctx.fillStyle = COLORS.under;
        roundRect(ctx, handleX, SLIDER_Y, SLIDER_WIDTH - (handleX - SLIDER_X), RAIL_HEIGHT, RAIL_RADIUS, {
            topLeft: false, bottomLeft: false, topRight: true, bottomRight: true
        });
        ctx.fill();
    }
  
    // Draw handle
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#4293e3';
    roundRect(ctx, handleX, handleY, HANDLE_SIZE, HANDLE_SIZE, 6);
    ctx.fill();
    
    // Draw three vertical lines in the middle of the handle
    ctx.fillStyle = '#3074d2';
    const lineHeight = HANDLE_SIZE * 0.4;
    const lineWidth = 1;
    const lineSpacing = 4;
    const firstLineX = handleX + (HANDLE_SIZE - (lineWidth * 3 + lineSpacing * 2)) / 2;
    const linesStartY = handleY + (HANDLE_SIZE - lineHeight) / 2;
    
    // Draw each vertical line
    for (let i = 0; i < 3; i++) {
        const lineX = firstLineX + (lineWidth + lineSpacing) * i;
        roundRect(ctx, lineX, linesStartY, lineWidth, lineHeight, 0);
        ctx.fill();
    }
    
    ctx.restore();

    // Draw the numbers
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Draw each number at its corresponding position
    const numberY = 128;
    numbers.forEach(num => {
        // Use same spacing calculation as arrows
        const pct = num / 100;
        const adjustedPct = 0.5 + (pct - 0.5) * spacingFactor;
        const x = SLIDER_X + (SLIDER_WIDTH * adjustedPct);
        ctx.fillText(num.toString(), x, numberY);
    });

    return {
        x: SLIDER_X,
        y: SLIDER_Y,
        width: SLIDER_WIDTH,
        height: RAIL_HEIGHT,
        handleX: handleX,
        handleY: handleY,
        handleSize: HANDLE_SIZE
    };
}

function updateProfitOnWin() {
  const betAmount = parseFloat(betAmountInput.value);
  const multiplierTable = rollType === 'over' ? multipliers.rollOver : multipliers.rollUnder;
  const multiplierValue = parseFloat(multiplierTable[targetLine.toString()]);
  const profit = betAmount * multiplierValue;
  
  const currency = currencySelect.value;
  if (currency === 'USD') {
    profitOnWin.textContent = `$${profit.toFixed(2)}`;
  } else {
    profitOnWin.textContent = `£${Math.round(profit).toLocaleString('en-US')}`;
  }
}

function updateStatsContainer() {
  // Update Roll Over/Under value
  const rollOverElement = document.querySelector('.stat-container .stat-item:nth-child(2) .stat-value-box');
  rollOverElement.innerHTML = `${targetLine.toFixed(2)} <i class="fas fa-sync-alt" style="color: #b1bad2; margin-left: 4px;"></i>`;

  // Update Win Chance
  const winChanceElement = document.querySelector('.stat-container .stat-item:nth-child(3) .stat-value-box');
  if (rollType === 'over') {
    winChanceElement.innerHTML = `${(100 - targetLine).toFixed(2)} <i class="fas fa-percentage" style="color: #b1bad2; margin-left: 4px;"></i>`;
  } else {
    winChanceElement.innerHTML = `${targetLine.toFixed(2)} <i class="fas fa-percentage" style="color: #b1bad2; margin-left: 4px;"></i>`;
  }

  // Update Multiplier
  const multiplierElement = document.querySelector('.stat-container .stat-item:nth-child(1) .stat-value-box');
  const multiplierTable = rollType === 'over' ? multipliers.rollOver : multipliers.rollUnder;
  const multiplierValue = multiplierTable[targetLine.toString()];
  multiplierElement.innerHTML = `${multiplierValue} <i class="fas fa-times" style="color: #b1bad2; margin-left: 4px;"></i>`;

  // Update roll type title
  const rollTypeTitle = document.getElementById('rollTypeTitle');
  rollTypeTitle.textContent = rollType === 'over' ? 'Roll Over' : 'Roll Under';

  // Update profit on win
  updateProfitOnWin();
}

function updateTargetLine(newValue, updateInput = true, animate = true) {
    const clampedValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, Math.round(newValue)));
    
    // Play sound if value changed
    if (clampedValue !== lastPlayedValue) {
      playSliderSound();
      lastPlayedValue = clampedValue;
    }
  
    if (!animate) {
      currentAnimatedValue = clampedValue;
      targetLine = clampedValue;
      if (updateInput) targetNumberInput.value = clampedValue;
      updateStatsContainer();
      drawGame();
      return;
    }
  
    const startValue = currentAnimatedValue;
    const delta = clampedValue - startValue;
    const startTime = performance.now();
    const duration = 150;
  
    function animateStep(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      currentAnimatedValue = startValue + delta * ease;
      targetLine = Math.round(currentAnimatedValue);
      
      // Play sound if value changed during animation
      if (targetLine !== lastPlayedValue) {
        playSliderSound();
        lastPlayedValue = targetLine;
      }
      
      if (updateInput) targetNumberInput.value = targetLine;
      updateStatsContainer();
      drawGame();
      if (t < 1) requestAnimationFrame(animateStep);
    }
    requestAnimationFrame(animateStep);
}
  
 // ─── Determine slider value from a mouse/touch event ─────────────────────
function getSliderValueFromEvent(e, sliderDims) {
    const rect = canvas.getBoundingClientRect();

    // Get the raw X position (in CSS pixels) relative to canvas
    const mouseX = e.type.startsWith('touch')
        ? (e.touches[0]?.pageX  - rect.left)
        : (e.clientX - rect.left);

    // These are already CSS pixels; do NOT divide by window.devicePixelRatio
    const sliderX     = sliderDims.x;
    const sliderWidth = sliderDims.width;

    const relX = mouseX - sliderX;
    const pct  = relX / sliderWidth;
    let rawVal = MIN_VALUE + pct * (MAX_VALUE - MIN_VALUE);

    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, Math.round(rawVal)));
}

  
  function roundRect(ctx, x, y, w, h, r, corners) {
    // Default: all corners rounded
    const c = Object.assign(
        { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true },
        corners || {}
    );

    ctx.beginPath();
    if (c.topLeft) ctx.moveTo(x + r, y);
    else ctx.moveTo(x, y);
    if (c.topRight) ctx.lineTo(x + w - r, y);
    else ctx.lineTo(x + w, y);
    if (c.topRight) ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    if (c.bottomRight) ctx.lineTo(x + w, y + h - r);
    else ctx.lineTo(x + w, y + h);
    if (c.bottomRight) ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    if (c.bottomLeft) ctx.lineTo(x + r, y + h);
    else ctx.lineTo(x, y + h);
    if (c.bottomLeft) ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    if (c.topLeft) ctx.lineTo(x, y + r);
    else ctx.lineTo(x, y);
    if (c.topLeft) ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  
  function drawHistorySlots(ctx, width) {    
    // Draw each history slot from right to left
    rollHistory.forEach((item, index) => {
        // For new slot (index 0), start from just outside the canvas right edge
        let startX = width - HISTORY_RIGHT_MARGIN;
        if (index > 0) {
            // For existing slots, start from their current position
            startX = width - HISTORY_RIGHT_MARGIN - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * (index - 1);
        }
        
        // Calculate target position
        const targetX = width - HISTORY_RIGHT_MARGIN - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * index;
        
        // If animating, interpolate between start and target positions
        let x = startX;
        if (isHistoryAnimating) {
            x = startX + (targetX - startX) * historyAnimationProgress;
        } else {
            x = targetX;
        }

        // Draw slot background with shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        
        // Draw rounded rectangle background
        ctx.fillStyle = item.won ? '#00e53d' : '#ea183a';
        roundRect(ctx, x, HISTORY_TOP_MARGIN, HISTORY_SLOT_WIDTH, HISTORY_SLOT_SIZE, HISTORY_CORNER_RADIUS);
        ctx.fill();
        ctx.restore();

        // Draw result text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.result.toString(), x + HISTORY_SLOT_WIDTH/2, HISTORY_TOP_MARGIN + HISTORY_SLOT_SIZE/2);
    });
}

function drawGame(animationPosition = null) {
    const scale = window.devicePixelRatio || 1;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    // Clear canvas and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw history slots first
    drawHistorySlots(ctx, width);

    // Store sliderDimensions globally
    sliderDimensions = drawSlider(ctx, width, height);

    // Draw rollResult marker, if any:
    if (rollResult !== null) {
        // Use animationPosition for the marker position if provided, otherwise use rollResult
        const markerPosition = animationPosition !== null ? animationPosition : rollResult;
        const resultPct = markerPosition / 100;
        const resultX = sliderDimensions.x + sliderDimensions.width * resultPct;

        // Draw the triangle pointer
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(resultX, sliderDimensions.y - 30);
        ctx.lineTo(resultX - 10, sliderDimensions.y - 40);
        ctx.lineTo(resultX + 10, sliderDimensions.y - 40);
        ctx.closePath();
        ctx.fill();

        // Prepare text for measurement
        ctx.font = 'bold 24px Arial';
        const resultText = rollResult.toString();
        const textMetrics = ctx.measureText(resultText);
        
        // Calculate background dimensions
        const padding = 12;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 36;
        const bgX = resultX - bgWidth / 2;
        const bgY = sliderDimensions.y - 85;
        const borderRadius = 6;
        
        // Draw background with rounded corners
        ctx.fillStyle = '#213742';
        roundRect(ctx, bgX, bgY, bgWidth, bgHeight, borderRadius);
        ctx.fill();
        
        // Draw border based on win/lose state
        ctx.strokeStyle = gameResult && gameResult.won ? '#00e53d' : '#ea183a';
        ctx.lineWidth = 2;
        roundRect(ctx, bgX, bgY, bgWidth, bgHeight, borderRadius);
        ctx.stroke();

        // Draw the result text
        ctx.fillStyle = gameResult && gameResult.won ? '#00e53d' : '#ea183a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(resultText, resultX, bgY + bgHeight / 2);
    }

    return sliderDimensions;
}
  
  // ─── MOUSE EVENTS FOR DRAGGING ──────────────────────────
  
  // ─── Hit‐test: are we over the handle? ───────────────────────────────────
function isOverHandle(e, sliderDims) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.type.startsWith('touch')) {
        if (!e.touches[0]) return false;
        // Use clientX/Y instead of pageX/Y to handle scroll position correctly
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }

    const handleX = sliderDims.handleX;
    const handleY = sliderDims.handleY;
    const handleSize = sliderDims.handleSize;

    return (
        x >= handleX &&
        x <= handleX + handleSize &&
        y >= handleY &&
        y <= handleY + handleSize
    );
}

function getEventX(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.type.startsWith('touch')) {
        // Use clientX instead of pageX to handle scroll position correctly
        return e.touches[0] ? e.touches[0].clientX - rect.left : null;
    }
    return e.clientX - rect.left;
}

function handleStart(e) {
    if (!sliderDimensions) return;
    
    // Always prevent default on touch events
    if (e.type.startsWith('touch')) {
        e.preventDefault();
    }
    
    if (isOverHandle(e, sliderDimensions)) {
        isDragging = true;
        dragStartX = getEventX(e);
        dragStartValue = currentAnimatedValue;
        canvas.style.cursor = 'grabbing';
    }
}

function handleMove(e) {
    if (!sliderDimensions || !isDragging || dragStartX === null) return;
    
    // Always prevent default on touch events
    if (e.type.startsWith('touch')) {
        e.preventDefault();
    }
    
    const currentX = getEventX(e);
    if (currentX === null) return;
    
    // Calculate movement in screen pixels
    const deltaX = currentX - dragStartX;
    
    // Add smoothing factor to make dragging less sensitive
    const smoothingFactor = 1.2; // Adjust this value to change sensitivity (lower = smoother)
    const smoothedDelta = deltaX * smoothingFactor;
    
    // Convert to value change
    const sliderWidth = sliderDimensions.width;
    const pixelsPerValue = sliderWidth / (MAX_VALUE - MIN_VALUE);
    const valueChange = smoothedDelta / pixelsPerValue;
    const newValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, dragStartValue + valueChange));
    
    updateTargetLine(newValue, true, false);
}

function handleEnd(e) {
    isDragging = false;
    dragStartX = null;
    dragStartValue = null;
    canvas.style.cursor = 'default';
}

// Prevent all default touch actions on the canvas
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTapHighlightColor = 'transparent';
canvas.style.position = 'relative';
canvas.style.zIndex = '1';

// Prevent scrolling when touching the canvas
canvas.addEventListener('touchstart', function(e) {
    if (isOverHandle(e, sliderDimensions)) {
        e.preventDefault();
        // Prevent any parent elements from scrolling
        e.stopPropagation();
        return false;
    }
}, { passive: false });

// Also prevent scrolling during touch move if we're dragging
canvas.addEventListener('touchmove', function(e) {
    if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, { passive: false });

// Make sure the canvas stays in a fixed position relative to viewport
canvas.style.position = 'relative';
canvas.style.zIndex = '1';

// Add event listeners with proper options
const touchOptions = { passive: false, capture: true };

// Mouse events
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

// Touch events
canvas.addEventListener('touchstart', handleStart, touchOptions);
canvas.addEventListener('touchmove', handleMove, touchOptions);
canvas.addEventListener('touchend', handleEnd, touchOptions);
canvas.addEventListener('touchcancel', handleEnd, touchOptions);

// Separate handler for hover cursor
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging && sliderDimensions) {
        canvas.style.cursor = isOverHandle(e, sliderDimensions) ? 'grab' : 'default';
    }
});

// ─── INITIAL DRAW ────────────────────────────────────
drawGame();

// ─── G) Game Logic ────────────────

function resetGameState() {
    isGameActive = false;
    rollResult = null;
    isRolling = false;
    hideWinModal();
    drawGame();
}

// Update input constraints
targetNumberInput.min = MIN_VALUE;
targetNumberInput.max = MAX_VALUE;

// Add event listener for target number input
targetNumberInput.addEventListener('input', () => {
  const newValue = parseInt(targetNumberInput.value);
  if (!isNaN(newValue) && newValue >= MIN_VALUE && newValue <= MAX_VALUE) {
    updateTargetLine(newValue, false);
  }
});

// Add validation for target number input
targetNumberInput.addEventListener('blur', validateTargetNumber);
targetNumberInput.addEventListener('change', validateTargetNumber);

// Function to validate target number
function validateTargetNumber() {
  let value = parseInt(targetNumberInput.value);
  
  // Handle empty or non-numeric input
  if (isNaN(value)) {
    value = 50; // Default to middle value
  }
  
  // Enforce min/max constraints
  value = Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
  
  // Update input and slider
  targetNumberInput.value = value;
  updateTargetLine(value, false);
}

// Force integer values by removing decimals
targetNumberInput.addEventListener('keydown', (e) => {
  // Allow: backspace, delete, tab, escape, enter, arrows
  if ([46, 8, 9, 27, 13, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end
      (e.keyCode >= 35 && e.keyCode <= 39)) {
    // Let it happen
    return;
  }
  
  // Block non-numeric keys
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
      (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});

rollTypeSelect.addEventListener('change', () => {
    rollType = rollTypeSelect.value;
    updateStatsContainer();
    drawGame();
});

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Initial resize
resizeCanvas();

// Initial update of stats container
updateStatsContainer();
// Play button click handler
playButton.addEventListener('click', async () => {
    console.log('Play button clicked');
    if (isRolling) {
        console.log('Already rolling, returning');
        return;
    }
    
    // Set rolling state and disable button
    isRolling = true;
    playButton.disabled = true;
    playButton.style.opacity = '0.7';
    playButton.style.cursor = 'not-allowed';
    playButton.textContent = 'Rolling...';
    
    const amount = parseFloat(betAmountInput.value);
    const currency = currencySelect.value;
    const target = parseInt(targetNumberInput.value);
    const rollType = rollTypeSelect.value === 'over' ? 'rollOver' : 'rollUnder';

    console.log('Sending request with:', { amount, currency, target, rollType });

    try {
        const response = await fetch('/games/dice/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency,
                target,
                rollType
            })
        });

        console.log('Response received:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            if (data.success) {
                const previousResult = rollResult || 50;
                
                rollResult = data.result;
                gameResult = {
                    won: data.won,
                    payout: data.payout
                };

                // Add new result to history
                const newHistoryItem = {
                    result: data.result,
                    won: data.won
                };

                // Start history animation
                isHistoryAnimating = true;
                historyAnimationProgress = 0;
                
                // Add new item and maintain max length
                rollHistory.unshift(newHistoryItem);
                if (rollHistory.length > MAX_HISTORY_ITEMS) {
                    rollHistory.pop();
                }

                // Animate both the roll result and history
                const startTime = performance.now();
                const duration = 300; // 300ms animation
                const startValue = previousResult;
                const targetValue = data.result;

                function animate() {
                    const now = performance.now();
                    const progress = Math.min((now - startTime) / duration, 1);
                    
                    // Update both animations
                    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    const animationPosition = startValue + (targetValue - startValue) * ease;
                    historyAnimationProgress = ease;
                    
                    // Draw with the animation position but keep rollResult at final value
                    drawGame(animationPosition);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        isHistoryAnimating = false;
                        if (gameResult.won) {
                            winSound.play().catch(() => {});
                        } else {
                            loseSound.play().catch(() => {});
                        }
                        
                        // Re-enable the play button after animation completes
                        isRolling = false;
                        playButton.disabled = false;
                        playButton.style.opacity = '1';
                        playButton.style.cursor = 'pointer';
                        playButton.textContent = 'Roll Dice';
                    }
                }

                // Start animation
                requestAnimationFrame(animate);
                
                // Update balance display with new navbar structure
                const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
                const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
                
                if (usdDropdownItem) {
                    usdDropdownItem.innerHTML = `
                        <span class="amount-label">${formatCurrencyAmount(data.newBalanceUSD, 'USD')}</span>
                        <span class="currency-label">USD</span>
                    `;
                }
                
                if (lbpDropdownItem) {
                    lbpDropdownItem.innerHTML = `
                        <span class="amount-label">${formatCurrencyAmount(data.newBalanceLBP, 'LBP')}</span>
                        <span class="currency-label">LBP</span>
                    `;
                }
                
                // Also update the selected balance if it matches the current currency
                const selectedBalance = document.getElementById('selected-balance');
                if (selectedBalance) {
                    if (currency === 'USD') {
                        selectedBalance.textContent = formatCurrencyAmount(data.newBalanceUSD, 'USD');
                    } else if (currency === 'LBP') {
                        selectedBalance.textContent = formatCurrencyAmount(data.newBalanceLBP, 'LBP');
                    }
                }
            }
        } else {
            const error = await response.json();
            console.error('Server error:', error);
            alert(error.error || 'Failed to roll');
            
            // Re-enable the play button on error
            isRolling = false;
            playButton.disabled = false;
            playButton.style.opacity = '1';
            playButton.style.cursor = 'pointer';
            playButton.textContent = 'Roll Dice';
        }
    } catch (error) {
        console.error('Error rolling dice:', error);
        alert('Error rolling dice');
        
        // Re-enable the play button on error
        isRolling = false;
        playButton.disabled = false;
        playButton.style.opacity = '1';
        playButton.style.cursor = 'pointer';
        playButton.textContent = 'Roll Dice';
    }
});

// Add click handler for roll type toggle
const rollTypeToggle = document.getElementById('rollTypeToggle');
rollTypeToggle.addEventListener('click', () => {
  // Toggle roll type
  rollType = rollType === 'over' ? 'under' : 'over';
  
  // Update dropdown to match
  rollTypeSelect.value = rollType;
  
  // Update UI
  updateStatsContainer();
  drawGame();
});

// Add event listeners for bet amount and currency changes
betAmountInput.addEventListener('input', updateProfitOnWin);
// Remove the currency select event listener since it's now handled in syncCurrencySelections
// currencySelect.addEventListener('change', updateProfitOnWin);

// ... rest of the existing code ...