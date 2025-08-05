


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


// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Format Currency Helper
function formatCurrency(value, currency, forDisplay = false) {
  if (currency === 'USD') {
    return forDisplay ? `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : parseFloat(value.toFixed(2));
  } else if (currency === 'LBP') {
    return forDisplay ? `LBP ${Math.round(value).toLocaleString()}` : Math.round(value);
  }
  return value;
}

// ─── Sync currency selection between navbar and game controls ────────────────
function syncCurrencySelections() {
  const currencySelect = document.getElementById('currency');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const selectedBalance = document.getElementById('selected-balance');
  const betInput = document.getElementById('bet');
  
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      // Set bet amount to minimum for selected currency, formatted
      betInput.value = currency === 'USD' ? BET_LIMITS[currency].min.toFixed(2) : BET_LIMITS[currency].min;
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
    // Set bet amount to minimum for selected currency, formatted
    betInput.value = currency === 'USD' ? BET_LIMITS[currency].min.toFixed(2) : BET_LIMITS[currency].min;
  });
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
  setupBetLimits();
});


// Setup bet amount validation and auto-adjustment
function setupBetLimits() {
  const betInput = document.getElementById('bet');
  const currencySelect = document.getElementById('currency');
  
  // Function to validate and adjust bet amount
  function validateBetAmount() {
    const currency = currencySelect.value;
    const limits = BET_LIMITS[currency];
    let betAmount = parseFloat(betInput.value);
    
    if (isNaN(betAmount)) {
      // If input is not a valid number, set to minimum
      betInput.value = currency === 'USD' ? limits.min.toFixed(2) : limits.min;
      return;
    }
    
    // Adjust if outside limits
    if (betAmount < limits.min) {
      betInput.value = currency === 'USD' ? limits.min.toFixed(2) : limits.min;
    } else if (betAmount > limits.max) {
      betInput.value = currency === 'USD' ? limits.max.toFixed(2) : limits.max;
    } else if (currency === 'USD') {
      // Always format USD to 2 decimals
      betInput.value = betAmount.toFixed(2);
    }
  }
  
  // Add event listeners for when user finishes input
  betInput.addEventListener('blur', validateBetAmount);
  betInput.addEventListener('change', validateBetAmount);
  
  // Also validate when currency changes
  currencySelect.addEventListener('change', validateBetAmount);
  
  // Initial validation
  validateBetAmount();
}


const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d'); // createCircle, createRectangle, createTriangle, createLine

////// SOUND EFFECTS //////
const plinkoSinkSound = new Audio('/games/plinko/plinko_sink_sound.mp3'); // or .ogg


const LOGICAL_WIDTH = 600;
const LOGICAL_HEIGHT = 600;

canvas.width = LOGICAL_WIDTH;
canvas.height = LOGICAL_HEIGHT;


// Resize canvas to fit screen, preserving aspect ratio
function resizeCanvas() {
  const aspectRatio = LOGICAL_WIDTH / LOGICAL_HEIGHT;
  const windowRatio = window.innerWidth / window.innerHeight;

  if (windowRatio > aspectRatio) {
    // Window is wider than game
    canvas.style.height = '100vh';
    canvas.style.width = `${100 * aspectRatio}vh`;
  } else {
    // Window is taller than game
    canvas.style.width = '100vw';
    canvas.style.height = `${100 / aspectRatio}vw`;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const DECIMAL_MULTIPLIER = 10000;

const WIDTH = 600;
const HEIGHT = 600;
const ballRadius = 7;
const obstacleRadius = 4;
const gravity = pad(0.2);
const horizontalFriction = 0.4;
const verticalFriction = 0.8;
let balls = [];

const obstacles = [];
const sinks = [];
const pulseEffects = [];

// Add currentRiskLevel variable near the top with other state variables
let currentRiskLevel = 'low'; // default risk level

function pad(n) {
  return n * DECIMAL_MULTIPLIER;
}

function unpad(n) {
  return Math.floor(n / DECIMAL_MULTIPLIER);
}

//////////////////////////////////////////////////////// MULTIPLIERS ///////////////////////////////////////////////////////////
const multiplierTables = {
  8: {
    low:    [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3 , 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high:   [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  9: {
      low: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
      medium: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
      high: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
  },
  10: {
      low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
      medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
      high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
  },
  11: {
      low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
      medium: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
      high: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120]
  },
  12: {
      low: [10, 3, 1.6, 1.4,  1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
      medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  13: {
      low: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
      medium: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
      high: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
  },
  14: {
      low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
      medium: [58,  15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
      high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  },
  15: {
      low: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
      medium: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
      high: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2,  0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
  },
  16: {
      low: [16, 9, 3, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
      medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  },

}


// Populate the rows dropdown dynamically from 8 to 16
const rowsSelect = document.getElementById('rows');
for (let i = 8; i <= 16; i++) {
  const option = document.createElement('option');
  option.value = i;
  option.textContent = i;
  rowsSelect.appendChild(option);
}
rowsSelect.value = 16; // default

// After the rows dropdown population code
// Remove duplicate risk dropdown population code
const riskSelect = document.getElementById('risk');
riskSelect.value = currentRiskLevel;

/////////////DATA HOARDING////////////////////
// ① Track the current selected number of rows
let currentRowCount = parseInt(rowsSelect.value, 10);

// ② Map to store unique { rows, x, sink } entries
const resultMap = new Map();  // key = `${rows}_${x}_${sink}`
//////////////////////////////////////////////////////////////


function generateObstaclesAndSinks(rowCount) {
  obstacles.length = 0;
  sinks.length = 0;

  const maxGridWidth = WIDTH * 0.85;  // max grid width in canvas
  const maxScaleUp = 1.5;             // max scale up for spacing

  const currentRowCount = rowCount + 2;
  const currentMaxObstacles = currentRowCount + 1;  // widest row obstacles

  const baseSpacing = 32;
  const totalWidthForCurrent = baseSpacing * (currentMaxObstacles - 1);

  // Calculate scale factor (can be > 1 to scale UP)
  let scaleFactor = maxGridWidth / totalWidthForCurrent;

  // Clamp scale factor between 0.5 and maxScaleUp for safe scaling
  scaleFactor = Math.min(Math.max(scaleFactor, 0.5), maxScaleUp);

  const spacing = baseSpacing * scaleFactor;
  const verticalSpacing = 35 * scaleFactor;

  // Create pyramid obstacles
  for (let row = 2; row < currentRowCount; row++) {
    const numObstacles = row + 1;
    const y = row * verticalSpacing;
    const totalRowWidth = spacing * (numObstacles - 1);
    
    // Compute startX with scaled spacing and scaled WIDTH center
    const startX = (WIDTH / 2) - (totalRowWidth / 2);

    for (let col = 0; col < numObstacles; col++) {
      const x = startX + col * spacing;
      obstacles.push({ x: pad(x), y: pad(y), radius: obstacleRadius * scaleFactor });
    }
  }

  // Create sinks at bottom
  const numSinks = rowCount + 1;
  const sinkWidth = spacing;
  const totalSinkWidth = sinkWidth * numSinks;

  const startX = (WIDTH / 2) - (totalSinkWidth / 2);
  const lastRowY = (rowCount + 1) * verticalSpacing;
  const y = lastRowY + verticalSpacing;

  for (let i = 0; i < numSinks; i++) {
    const x = startX + i * sinkWidth + obstacleRadius * scaleFactor;
    sinks.push({
      x,
      y,
      width: sinkWidth,
      height: sinkWidth,
      yOffset: 0 // 👈 added for animation
    });
  }
}

// Generate initial grid
generateObstaclesAndSinks(16);


class Ball {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(unpad(this.x), unpad(this.y), this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
  
  update() {
    // change the velocity, change the positions
    this.vy = this.vy + gravity;
    this.x += this.vx; // x = x1 + v
    this.y += this.vy;

    // Collision with obstacles
    obstacles.forEach(obstacle => {
      const dist = Math.hypot(this.x - obstacle.x, this.y - obstacle.y);
      if (dist < pad(this.radius + obstacle.radius)) {
        // Calculate collision angle
        const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
        // Reflect velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = (Math.cos(angle) * speed * horizontalFriction);
        this.vy = Math.sin(angle) * speed * verticalFriction;

        // Adjust position to prevent sticking
        const overlap = this.radius + obstacle.radius - unpad(dist);
        this.x += pad(Math.cos(angle) * overlap);
        this.y += pad(Math.sin(angle) * overlap);

            // Inside obstacle collision block, right after adjusting position
            if (pulseEffects.length < 50) { // Cap at 50 pulses
              pulseEffects.push({
                x: obstacle.x,
                y: obstacle.y,
                radius: obstacle.radius,
                alpha: 0.5,
                maxRadius: obstacle.radius * 1.5,
                currentRadius: obstacle.radius * 0.8
              });
            }            
      }
    });

    // Collision with sinks
    sinks.forEach(sink => {
      if (
        unpad(this.x) > sink.x - sink.width / 2 &&
        unpad(this.x) < sink.x + sink.width / 2 &&
        unpad(this.y) + this.radius > sink.y - sink.height / 2
      ) {
        this.vx = 0;
        this.vy = 0;
      }
    });


  }
}


function drawObstacles() {
  ctx.fillStyle = 'white';
  obstacles.forEach(obstacle => {
    ctx.beginPath();
    ctx.arc(unpad(obstacle.x), unpad(obstacle.y), obstacle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

function darkenHexColor(hex, amount = 0.6) {
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);

  const newR = clamp(Math.floor(r * (1 - amount)));
  const newG = clamp(Math.floor(g * (1 - amount)));
  const newB = clamp(Math.floor(b * (1 - amount)));

  return `rgba(${newR}, ${newG}, ${newB}, 0.5)`; // 🔥 More opaque and darker
}

function drawSinks() {
  const multipliers = multiplierTables[currentRowCount][currentRiskLevel];

  const minRows = 8;
  const maxRows = 16;
  const minFont = 10;
  const maxFont = 16;
  const clampedRowCount = Math.max(minRows, Math.min(currentRowCount, maxRows));
  const fontSize = maxFont - ((clampedRowCount - minRows) / (maxRows - minRows)) * (maxFont - minFont);

  const gradientSteps = [
    '#ffbf31', // yellow - lowest
    '#ff8f28', // medium dark orange
    '#ff6027', // darker orange
    '#ff2a00', // dark orange-red
    '#ff0e3d'  // dark red - highest
  ];

  const sorted = [...multipliers].sort((a, b) => a - b);

  for (let i = 0; i < sinks.length; i++) {
    const sink = sinks[i];
    const value = multipliers[i];

    const rank = sorted.indexOf(value);
    let normalized = rank / (multipliers.length - 1);
    const biasedNormalized = Math.pow(normalized, 0.9);

    const stepCount = gradientSteps.length;
    let stepIndex = Math.floor(biasedNormalized * stepCount);
    stepIndex = Math.min(stepIndex, stepCount - 1);

    const fillColor = gradientSteps[stepIndex];
    const shadowColor = darkenHexColor(fillColor, 0.8); // 🔥 90% darker

    const x = sink.x;
    const y = sink.y - sink.height / 2 + (sink.yOffset || 0);
    const width = sink.width - obstacleRadius * 2;
    const height = sink.height;
    const radius = 5;

    // Draw main rounded rectangle
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();

    // Draw bottom shading overlay
    const shadowHeight = height * 0.15;
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(x + radius, y + height - shadowHeight);
    ctx.lineTo(x + width - radius, y + height - shadowHeight);
    ctx.arcTo(x + width, y + height - shadowHeight, x + width, y + height - shadowHeight + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + height - shadowHeight + radius);
    ctx.arcTo(x, y + height - shadowHeight, x + radius, y + height - shadowHeight, radius);
    ctx.closePath();
    ctx.fill();

    // Draw multiplier text
    ctx.fillStyle = '#331308';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';

    const multiplierText = value === 1000 ? '1k' : value + 'x';
    ctx.fillText(
      multiplierText,
      x + width / 2,
      sink.y + 4 + (sink.yOffset || 0)
    );
  }
}









/// ALL BALLS HAVE LANDED HELPER 
function checkIfAllBallsLanded() {
  if (balls.length === 0) {
    console.log('🎉 All balls have landed!');
    fetchBalances();

    // Now you can:
    // - Enable UI buttons
    // - Show final result summary
    // - Trigger celebration effects
    // - Reset game state
  }
}

// Create a new ball at the specified X position
function addBall(dropX, result) {
  const b = new Ball(pad(dropX), pad(30), ballRadius, 'red');
  b.initialX = dropX;
  b.rows = currentRowCount;
  b.resultData = result; // Attach result to ball for later
  balls.push(b);
}


function checkForSinkLanding(ball) {
  if (Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01) return;

  for (let i = 0; i < sinks.length; i++) {
    const sink = sinks[i];
    if (
      unpad(ball.x) > sink.x - sink.width / 2 &&
      unpad(ball.x) < sink.x + sink.width / 2 &&
      unpad(ball.y) + ball.radius > sink.y - sink.height / 2
    ) {
      const key = `${ball.rows}_${ball.initialX}_${i}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          rows: ball.rows,
          x:    ball.initialX,
          sink: i
        });
        console.log('Saved mapping:', resultMap.get(key));
      }

      // Animate sink bounce on landing (only if not already animating)
      if (sink.yOffset === 0 || sink.yOffset === undefined) {
        playSinkSound(); // play sink sound
        const originalOffset = 0;
        const dipAmount = 6;
        const duration = 150;

        sink.yOffset = dipAmount;

        setTimeout(() => {
          const step = () => {
            sink.yOffset -= 1;
            if (sink.yOffset > originalOffset) {
              requestAnimationFrame(step);
            } else {
              sink.yOffset = originalOffset;
            }
          };
          requestAnimationFrame(step);
        }, duration);
      }

      // ─── Minimal Fix: Use 'winAmount' instead of 'payout', and use 'resultData.currency' ───
      if (
        ball.resultData &&
        typeof ball.resultData.winAmount === 'number' &&
        ball.resultData.currency
      ) {
        // Update balance display with new navbar structure
        const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
        const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
        const selectedBalance = document.getElementById('selected-balance');
        
        // Get current balances from the dropdown items
        let currentUSD = 0;
        let currentLBP = 0;
        
        if (usdDropdownItem) {
          const amountLabel = usdDropdownItem.querySelector('.amount-label');
          if (amountLabel) {
            currentUSD = parseFloat(amountLabel.textContent.replace(/[^\d.-]/g, ''));
          }
        }
        
        if (lbpDropdownItem) {
          const amountLabel = lbpDropdownItem.querySelector('.amount-label');
          if (amountLabel) {
            currentLBP = parseFloat(amountLabel.textContent.replace(/[^\d.-]/g, ''));
          }
        }
        
        // Update the appropriate balance
        if (ball.resultData.currency === 'USD') {
          currentUSD += ball.resultData.winAmount;
          
          if (usdDropdownItem) {
            usdDropdownItem.innerHTML = `
              <span class="amount-label">$${currentUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span class="currency-label">USD</span>
            `;
          }
          
          if (selectedBalance && selectedBalance.textContent.includes('$')) {
            selectedBalance.textContent = `$${currentUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          }
        } else if (ball.resultData.currency === 'LBP') {
          currentLBP += ball.resultData.winAmount;
          
          if (lbpDropdownItem) {
            lbpDropdownItem.innerHTML = `
              <span class="amount-label">£${Math.round(currentLBP).toLocaleString()}</span>
              <span class="currency-label">LBP</span>
            `;
          }
          
          if (selectedBalance && selectedBalance.textContent.includes('£')) {
            selectedBalance.textContent = `£${Math.round(currentLBP).toLocaleString()}`;
          }
        }
      }

      balls.splice(balls.indexOf(ball), 1);
      checkIfAllBallsLanded(); // 👈 Add this
      return;
    }
  }
}


// Handle play click: make API request and drop ball
document.getElementById('playBtn').addEventListener('click', async () => {
  try {
    const betAmount = parseFloat(document.getElementById('bet').value);
    const currency = document.getElementById('currency').value;

    if (!betAmount || betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    // Get balance DOM elements with new navbar structure
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
    const selectedBalance = document.getElementById('selected-balance');
    
    // Cache and parse current visual balances
    let currentUSD = 0;
    let currentLBP = 0;
    
    // Get USD balance from the amount-label span
    if (usdDropdownItem) {
      const amountLabel = usdDropdownItem.querySelector('.amount-label');
      if (amountLabel) {
        currentUSD = parseFloat(amountLabel.textContent.replace(/[^\d.-]/g, ''));
      }
    }
    
    // Get LBP balance from the amount-label span
    if (lbpDropdownItem) {
      const amountLabel = lbpDropdownItem.querySelector('.amount-label');
      if (amountLabel) {
        currentLBP = parseFloat(amountLabel.textContent.replace(/[^\d.-]/g, ''));
      }
    }

    // Check and deduct visual balance safely
    if (currency === 'USD') {
      if (currentUSD < betAmount) {
        alert('Insufficient USD balance');
        return;
      }
      currentUSD -= betAmount;
      
      // Update USD dropdown item with proper HTML structure
      if (usdDropdownItem) {
        usdDropdownItem.innerHTML = `
          <span class="amount-label">$${currentUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span class="currency-label">USD</span>
        `;
      }
      
      // Update selected balance if USD is currently selected
      if (selectedBalance && selectedBalance.textContent.includes('$')) {
        selectedBalance.textContent = `$${currentUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      }
    } else if (currency === 'LBP') {
      if (currentLBP < betAmount) {
        alert('Insufficient LBP balance');
        return;
      }
      currentLBP -= betAmount;
      
      // Update LBP dropdown item with proper HTML structure
      if (lbpDropdownItem) {
        lbpDropdownItem.innerHTML = `
          <span class="amount-label">£${Math.round(currentLBP).toLocaleString()}</span>
          <span class="currency-label">LBP</span>
        `;
      }
      
      // Update selected balance if LBP is currently selected
      if (selectedBalance && selectedBalance.textContent.includes('£')) {
        selectedBalance.textContent = `£${Math.round(currentLBP).toLocaleString()}`;
      }
    }

    // Proceed with server request
    const response = await fetch('/games/plinko/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows:      currentRowCount,
        risk:      currentRiskLevel,
        betAmount: betAmount,
        currency:  currency
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Roll back visual deduction if server rejects
      if (errorData.error && errorData.error.toLowerCase().includes('insufficient')) {
        if (currency === 'USD') {
          // Restore USD balance with proper HTML structure
          if (usdDropdownItem) {
            usdDropdownItem.innerHTML = `
              <span class="amount-label">$${(currentUSD + betAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span class="currency-label">USD</span>
            `;
          }
          
          // Update selected balance if USD is currently selected
          if (selectedBalance && selectedBalance.textContent.includes('$')) {
            selectedBalance.textContent = `$${(currentUSD + betAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          }
        } else {
          // Restore LBP balance with proper HTML structure
          if (lbpDropdownItem) {
            lbpDropdownItem.innerHTML = `
              <span class="amount-label">£${Math.round(currentLBP + betAmount).toLocaleString()}</span>
              <span class="currency-label">LBP</span>
            `;
          }
          
          // Update selected balance if LBP is currently selected
          if (selectedBalance && selectedBalance.textContent.includes('£')) {
            selectedBalance.textContent = `£${Math.round(currentLBP + betAmount).toLocaleString()}`;
          }
        }
      }
      throw new Error(errorData.error || 'Server error');
    }

    const result = await response.json();
    if (!result.success) {
      // Rollback visual deduction if "success: false"
      if (currency === 'USD') {
        // Restore USD balance with proper HTML structure
        if (usdDropdownItem) {
          usdDropdownItem.innerHTML = `
            <span class="amount-label">$${(currentUSD + betAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span class="currency-label">USD</span>
          `;
        }
        
        // Update selected balance if USD is currently selected
        if (selectedBalance && selectedBalance.textContent.includes('$')) {
          selectedBalance.textContent = `$${(currentUSD + betAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
      } else {
        // Restore LBP balance with proper HTML structure
        if (lbpDropdownItem) {
          lbpDropdownItem.innerHTML = `
            <span class="amount-label">£${Math.round(currentLBP + betAmount).toLocaleString()}</span>
            <span class="currency-label">LBP</span>
          `;
        }
        
        // Update selected balance if LBP is currently selected
        if (selectedBalance && selectedBalance.textContent.includes('£')) {
          selectedBalance.textContent = `£${Math.round(currentLBP + betAmount).toLocaleString()}`;
        }
      }
      throw new Error(result.error || 'Failed to play');
    }

    // ─── Minimal Fix: No need to attach _originalCurrency. The server already returned 'currency' ───
    addBall(result.dropX, result);

  } catch (error) {
    console.error('Error playing Plinko:', error);
    alert('Failed to play. Please try again.');
  }
});


// Handle rows dropdown to update immediately
document.getElementById('rows').addEventListener('change', () => {
  currentRowCount = parseInt(document.getElementById('rows').value, 10);
  generateObstaclesAndSinks(currentRowCount);
});

// Add risk level change handler (add this near the rows change handler)
document.getElementById('risk').addEventListener('change', () => {
  currentRiskLevel = document.getElementById('risk').value;
});

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawPulseEffects();    // 👈 Draw beneath obstacles
  drawObstacles();
  drawSinks();
  balls.forEach(ball => {
    ball.draw();
    ball.update();
    checkForSinkLanding(ball);   // ← add this line
  });
}

function update() {
  draw();
  requestAnimationFrame(update);
}

// Start the render loop
update();


///////////////////////// HELPER FUNCTION FOR OBSTACLE PULSE ANIMATION ///////////////////////////////////////
function drawPulseEffects() {
  for (let i = pulseEffects.length - 1; i >= 0; i--) {
    const p = pulseEffects[i];

    ctx.save(); // Save current canvas state
    ctx.globalAlpha = p.alpha; // Set transparency

    ctx.beginPath();
    ctx.arc(unpad(p.x), unpad(p.y), p.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white'; // Plain color, no rgba
    ctx.fill();

    ctx.restore(); // Restore canvas state (including alpha)

    // Animate
    p.currentRadius += 0.5;
    p.alpha -= 0.025;

    // Remove if invisible
    if (p.alpha <= 0) {
      pulseEffects.splice(i, 1);
    }
  }
}

//////////////////////// Sound Effect Hlpers ////////////////////////////
function playSinkSound() {
  const sound = new Audio('/games/plinko/plinko_sink_sound.mp3');
  sound.play();
}
//////////////////////////////////////////////////////////////////////////

//////////// helper function to update balance ///////////////////
async function fetchBalances() {
  try {
    const res = await fetch('/api/user/balance');
    if (!res.ok) throw new Error('Failed to fetch balances');

    const data = await res.json();

    // Update balance display with new navbar structure
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
    const selectedBalance = document.getElementById('selected-balance');
    
    // Update USD dropdown item with proper HTML structure
    if (usdDropdownItem) {
      usdDropdownItem.innerHTML = `
        <span class="amount-label">$${data.balanceUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        <span class="currency-label">USD</span>
      `;
    }
    
    // Update LBP dropdown item with proper HTML structure
    if (lbpDropdownItem) {
      lbpDropdownItem.innerHTML = `
        <span class="amount-label">£${Math.round(data.balanceLBP).toLocaleString()}</span>
        <span class="currency-label">LBP</span>
      `;
    }
    
    // Update the selected balance display based on which currency is currently shown
    if (selectedBalance) {
      if (selectedBalance.textContent.includes('$')) {
        selectedBalance.textContent = `$${data.balanceUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      } else if (selectedBalance.textContent.includes('£')) {
        selectedBalance.textContent = `£${Math.round(data.balanceLBP).toLocaleString()}`;
      }
    }
  } catch (err) {
    console.error('Error fetching balances:', err);
  }
}

