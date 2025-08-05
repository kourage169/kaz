  
  
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
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

  const snakesGameTables = {
    easy: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 2 },
        3: { type: 'multiplier', value: 1.30 },
        4: { type: 'multiplier', value: 1.20 },
        5: { type: 'multiplier', value: 1.10 },
        6: { type: 'multiplier', value: 1.01 },
        7: { type: 'snake'  },
        8: { type: 'multiplier', value: 1.01 },
        9: { type: 'multiplier', value: 1.10 },
        10: { type: 'multiplier', value: 1.20 },
        11: { type: 'multiplier', value: 1.30 },
        12: { type: 'multiplier', value: 2  }
      }
    },
  
    medium: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 4 },
        3: { type: 'multiplier', value: 2.50 },
        4: { type: 'multiplier', value: 1.40 },
        5: { type: 'multiplier', value: 1.11 },
        6: { type: 'snake' },
        7: { type: 'snake' },
        8: { type: 'snake' },
        9: { type: 'multiplier', value: 1.11},
        10: { type: 'multiplier', value: 1.40 },
        11: { type: 'multiplier', value: 2.50},
        12: { type: 'multiplier', value: 4.00 }
      }
    },
  
    hard: {
      board: {
        1: { type: 'start' },
        2: { type: 'multiplier', value: 7.50 },
        3: { type: 'multiplier', value: 3 },
        4: { type: 'multiplier', value: 1.38 },
        5: { type: 'snake' },
        6: { type: 'snake' },
        7: { type: 'snake' },
        8: { type: 'snake' },
        9: { type: 'snake' },
        10: { type: 'multiplier', value: 1.38 },
        11: { type: 'multiplier', value: 3 },
        12: { type: 'multiplier', value: 7.50 }
      }
    },
    expert: {
        board: {
          1: { type: 'start' },
          2: { type: 'multiplier', value: 10 },
          3: { type: 'multiplier', value: 4 },
          4: { type:  'snake' },
          5: { type: 'snake' },
          6: { type: 'snake' },
          7: { type: 'snake' },
          8: { type: 'snake' },
          9: { type: 'snake' },
          10: { type: 'snake' },
          11: { type: 'multiplier', value: 4 },
          12: { type: 'multiplier', value: 10 }
        }
      },
      master: {
        board: {
          1: { type: 'start' },
          2: { type: 'multiplier', value: 17.64 },
          3: { type: 'snake' },
          4: { type:  'snake' },
          5: { type: 'snake' },
          6: { type: 'snake' },
          7: { type: 'snake' },
          8: { type: 'snake' },
          9: { type: 'snake' },
          10: { type: 'snake' },
          11: { type: 'snake' },
          12: { type: 'multiplier', value: 17.64 }
        }
      }
  };

  // Highlight color map by difficulty
const HIGHLIGHT_COLORS = {
  easy:   { button: '#53dffd', shadow: '#1f9bee', border: '#1f9bee' },
  medium: { button: '#017ffa', shadow: '#0e60b0', border: '#0e60b0' },
  hard:   { button: '#00e53c', shadow: '#008921', border: '#008921' },
  expert: { button: '#973cf9', shadow: '#721bc2', border: '#721bc2' },
  master: { button: '#ffc131', shadow: '#ff7f1d', border: '#ff7f1d' }
};


  // Canvas setup
const canvas = document.getElementById('snakesCanvas');
const ctx = canvas.getContext('2d');

// Game state
let currentDifficulty = 'easy';
let gameBoard = snakesGameTables[currentDifficulty].board;

// Tile dimensions and layout
const TILES_PER_ROW = 4;
const TILES_PER_COL = 4;
const PADDING = 60;
const Y_OFFSET = 20;  // Move everything up by 40px

const snakeImage = new Image();
const snakeImage2 = new Image();
snakeImage.src = '/games/snakes/snake1.png';
snakeImage2.src = '/games/snakes/snake2.png';

// Wait for snake images to load before initializing
let imagesLoaded = 0;
const totalImages = 2;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        initializeGame();
    }
}

snakeImage.onload = checkAllImagesLoaded;
snakeImage2.onload = checkAllImagesLoaded;

function initializeGame() {
    // Set up event listeners
    document.getElementById('playBtn').addEventListener('click', startGame);
    document.getElementById('rollBtn').addEventListener('click', roll);
    document.getElementById('cashoutBtn').addEventListener('click', cashout);
    
    // Event listener for difficulty changes
    document.getElementById('difficulty').addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        gameBoard = snakesGameTables[currentDifficulty].board;
        completedRolls = 0; // Reset completed rolls when changing difficulty
        drawBoard();
    });
    
    // Initial draw
    drawBoard();
}

function calculateTileDimensions() {
    const availableWidth = canvas.width - (PADDING * 2);
    const availableHeight = canvas.height - (PADDING * 2);
    
    const tileWidth = availableWidth / TILES_PER_ROW;
    const tileHeight = availableHeight / TILES_PER_COL;
    
    return { tileWidth, tileHeight };
}

function drawTile(x, y, width, height, tileData) {
    const cornerRadius = 14; // Radius for rounded corners
    
    // Add shadow effect
    ctx.shadowColor = '#213742';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    
    // Draw tile background with rounded corners
    ctx.fillStyle = '#2f4552';
    
    // Use roundRect if available (modern browsers), otherwise create path manually
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, cornerRadius);
        ctx.fill();
    } else {
        // Fallback for browsers that don't support roundRect
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + width - cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        ctx.lineTo(x + width, y + height - cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        ctx.lineTo(x + cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw tile content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let text = '';
    if (tileData.type === 'start') {
        text = '▶';
        const colors = HIGHLIGHT_COLORS[currentDifficulty] || HIGHLIGHT_COLORS.easy;
        ctx.fillStyle = colors.button;
    } else if (tileData.type === 'snake') {
        ctx.drawImage(snakeImage, x + 20, y + 20, width - 40, height - 40);
        return;
    } else if (tileData.type === 'multiplier') {
        text = tileData.value.toFixed(2) + 'x';
    }
    
    ctx.fillText(text, x + width/2, y + height/2);
}

// Game state variables
let isGameActive = false;
let currentPosition = 1;
let currentMultiplier = 1;
let completedRolls = 0; // Track number of completed rolls

// Add animation state variables with other state variables
let currentDice = {
    dice1: 1,
    dice2: 1
};
let diceAnimationState = {
    dice1Scale: 1,
    dice2Scale: 1
};
let multiplierColor = '#FFFFFF';

// Get DOM elements
const playBtn = document.getElementById('playBtn');
const cashoutBtn = document.getElementById('cashoutBtn');
const rollBtn = document.getElementById('rollBtn');
const betAmountInput = document.getElementById('betAmount');
const currencySelect = document.getElementById('currency');
const difficultySelect = document.getElementById('difficulty');

// Navbar elements for currency sync
const dropdownItems = document.querySelectorAll('.dropdown-item');
const selectedBalance = document.getElementById('selected-balance');

// ─── Sync currency selection between navbar and game controls ────────────────
function syncCurrencySelections() {
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      // Update bet amount to minimum for selected currency
      updateBetAmountToMinimum(currency);
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
    
    // Update bet amount to minimum for selected currency
    updateBetAmountToMinimum(currency);
  });
}

// Function to update bet amount to minimum for selected currency
function updateBetAmountToMinimum(currency) {
  const betAmountInput = document.getElementById('betAmount');
  const limits = BET_LIMITS[currency];
  betAmountInput.value = currency === 'LBP' ? limits.min.toFixed(0) : limits.min.toFixed(2);
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
  setupBetAmountValidation();
});

// ─── Bet Amount Validation ────────────────
function setupBetAmountValidation() {
  const betAmountInput = document.getElementById('betAmount');
  const currencySelect = document.getElementById('currency');
  
  // Function to validate and adjust bet amount
  function validateBetAmount() {
    const currency = currencySelect.value;
    const currentValue = parseFloat(betAmountInput.value);
    const limits = BET_LIMITS[currency];
    
    if (isNaN(currentValue) || currentValue < limits.min) {
      betAmountInput.value = currency === 'LBP' ? limits.min.toFixed(0) : limits.min.toFixed(2);
    } else if (currentValue > limits.max) {
      betAmountInput.value = currency === 'LBP' ? limits.max.toFixed(0) : limits.max.toFixed(2);
    }
  }
  
  // Validate on currency change
  currencySelect.addEventListener('change', () => {
    validateBetAmount();
  });
  
  // Validate on input blur (when user finishes typing)
  betAmountInput.addEventListener('blur', () => {
    validateBetAmount();
  });
  
  // Validate on Enter key
  betAmountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      validateBetAmount();
      betAmountInput.blur(); // Remove focus
    }
  });
}

// Function to draw roll indicators
function drawRollIndicators() {
    const circleRadius = 8;
    const circleSpacing = 20;
    const totalWidth = (circleRadius * 2 * 5) + (circleSpacing * 4);
    const startX = (canvas.width - totalWidth) / 2;
    const y = canvas.height - 40; // Position below the game board

    for (let i = 0; i < 5; i++) {
        const x = startX + (i * (circleRadius * 2 + circleSpacing));
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x + circleRadius, y, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = i < completedRolls ? HIGHLIGHT_COLORS[currentDifficulty].button : '#2f4552';
        ctx.fill();
    }
}

// Function to draw a dice face with proper dot pattern and scale
function drawDiceFace(x, y, size, value, scale = 1) {
    // Apply scale transformation
    const scaledSize = size * scale;
    const offsetX = (size - scaledSize) / 2;
    const offsetY = (size - scaledSize) / 2;
    
    // Draw the square background
    ctx.shadowColor = '#acb5cd';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;
    
    ctx.fillStyle = '#d0d6e5';
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + offsetX, y + offsetY, scaledSize, scaledSize, 14 * scale);
        ctx.fill();
    } else {
        ctx.beginPath();
        const radius = 14 * scale;
        ctx.moveTo(x + offsetX + radius, y + offsetY);
        ctx.lineTo(x + offsetX + scaledSize - radius, y + offsetY);
        ctx.quadraticCurveTo(x + offsetX + scaledSize, y + offsetY, x + offsetX + scaledSize, y + offsetY + radius);
        ctx.lineTo(x + offsetX + scaledSize, y + offsetY + scaledSize - radius);
        ctx.quadraticCurveTo(x + offsetX + scaledSize, y + offsetY + scaledSize, x + offsetX + scaledSize - radius, y + offsetY + scaledSize);
        ctx.lineTo(x + offsetX + radius, y + offsetY + scaledSize);
        ctx.quadraticCurveTo(x + offsetX, y + offsetY + scaledSize, x + offsetX, y + offsetY + scaledSize - radius);
        ctx.lineTo(x + offsetX, y + offsetY + radius);
        ctx.quadraticCurveTo(x + offsetX, y + offsetY, x + offsetX + radius, y + offsetY);
        ctx.closePath();
        ctx.fill();
    }

    // Remove shadow for dots
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw dots
    ctx.fillStyle = '#304964';
    const dotSize = scaledSize * 0.12;
    
    const positions = {
        1: [[0.5, 0.5]],
        2: [[0.25, 0.25], [0.75, 0.75]],
        3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
        4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
        5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
        6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]]
    };

    const dots = positions[value] || positions[1];
    dots.forEach(([xRatio, yRatio]) => {
        const dotX = x + offsetX + (scaledSize * xRatio);
        const dotY = y + offsetY + (scaledSize * yRatio);
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize/2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Modify drawBoard function to use animation scales
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const { tileWidth, tileHeight } = calculateTileDimensions();
    
    // Calculate center position
    const centerX = PADDING + (1.5 * tileWidth);
    const centerY = PADDING + (1.5 * tileHeight) - Y_OFFSET + 15;
    const centerSize = tileWidth * 1.5;
    
    // Draw center square
    ctx.fillStyle = '#557085';
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(centerX - (centerSize - tileWidth)/2, centerY - (centerSize - tileHeight)/2, centerSize, centerSize, 14);
        ctx.fill();
    } else {
        const x = centerX - (centerSize - tileWidth)/2;
        const y = centerY - (centerSize - tileHeight)/2;
        ctx.beginPath();
        ctx.moveTo(x + 14, y);
        ctx.lineTo(x + centerSize - 24, y);
        ctx.quadraticCurveTo(x + centerSize - 10, y, x + centerSize - 10, y + 14);
        ctx.lineTo(x + centerSize - 10, y + centerSize - 24);
        ctx.quadraticCurveTo(x + centerSize - 10, y + centerSize - 10, x + centerSize - 24, y + centerSize - 10);
        ctx.lineTo(x + 14, y + centerSize - 10);
        ctx.quadraticCurveTo(x, y + centerSize - 10, x, y + centerSize - 24);
        ctx.lineTo(x, y + 14);
        ctx.quadraticCurveTo(x, y, x + 14, y);
        ctx.closePath();
        ctx.fill();
    }

    // Draw two squares inside the center square
    const innerSquareSize = (tileWidth - 10) * 0.7;
    const spacing = 5;
    
    // Calculate positions for the two squares
    const totalWidth = (innerSquareSize * 2) + spacing;
    const startX = centerX - (totalWidth / 2 - 48);
    const startY = centerY - (centerSize - tileHeight)/2 - 20;
    
    // Draw dice faces with current values and animation scales
    drawDiceFace(startX, startY, innerSquareSize, currentDice.dice1, diceAnimationState.dice1Scale);
    drawDiceFace(startX + innerSquareSize + spacing, startY, innerSquareSize, currentDice.dice2, diceAnimationState.dice2Scale);
    
    // Draw multiplier display
    const multiplierBoxHeight = 70; // Increased height
    const multiplierBoxWidth = totalWidth ; // Reduced width
    const multiplierBoxY = startY + innerSquareSize + 25; // Moved down by increasing gap
    const multiplierBoxX = startX ; // Adjusted X to maintain center alignment
    
    // Draw multiplier box background
    ctx.fillStyle = '#0f212d';
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(multiplierBoxX, multiplierBoxY, multiplierBoxWidth, multiplierBoxHeight, 10);
        ctx.fill();
    } else {
        ctx.beginPath();
        const radius = 10;
        ctx.moveTo(multiplierBoxX + radius, multiplierBoxY);
        ctx.lineTo(multiplierBoxX + multiplierBoxWidth - radius, multiplierBoxY);
        ctx.quadraticCurveTo(multiplierBoxX + multiplierBoxWidth, multiplierBoxY, multiplierBoxX + multiplierBoxWidth, multiplierBoxY + radius);
        ctx.lineTo(multiplierBoxX + multiplierBoxWidth, multiplierBoxY + multiplierBoxHeight - radius);
        ctx.quadraticCurveTo(multiplierBoxX + multiplierBoxWidth, multiplierBoxY + multiplierBoxHeight, multiplierBoxX + multiplierBoxWidth - radius, multiplierBoxY + multiplierBoxHeight);
        ctx.lineTo(multiplierBoxX + radius, multiplierBoxY + multiplierBoxHeight);
        ctx.quadraticCurveTo(multiplierBoxX, multiplierBoxY + multiplierBoxHeight, multiplierBoxX, multiplierBoxY + multiplierBoxHeight - radius);
        ctx.lineTo(multiplierBoxX, multiplierBoxY + radius);
        ctx.quadraticCurveTo(multiplierBoxX, multiplierBoxY, multiplierBoxX + radius, multiplierBoxY);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw multiplier text with current color
    ctx.fillStyle = multiplierColor;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentMultiplier.toFixed(2) + 'x', multiplierBoxX + multiplierBoxWidth/2, multiplierBoxY + multiplierBoxHeight/2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Define the path order for the tiles (clockwise from top-left)
    const pathOrder = [
        0,  1,  2,  3,    // Top row (positions 1-4)
        7,  11, 15,       // Right column (positions 5-7)
        14, 13, 12,       // Bottom row (positions 8-10)
        8,  4             // Left column (positions 11-12)
    ];
    
    // First draw tiles 1 through 6 (they'll be at the bottom)
    for (let i = 1; i <= 6; i++) {
        const position = pathOrder[i - 1];  // -1 because pathOrder is 0-based
        const row = Math.floor(position / TILES_PER_ROW);
        const col = position % TILES_PER_ROW;
        
        const x = PADDING + (col * tileWidth);
        const y = PADDING + (row * tileHeight) - Y_OFFSET;
        
        const tileData = gameBoard[i];
        drawTile(x, y, tileWidth - 10, tileHeight - 10, tileData);
    }
    
    // Draw tile 12 first (it will be below 11)
    const pos12 = pathOrder[11];  // Position for tile 12
    const row12 = Math.floor(pos12 / TILES_PER_ROW);
    const col12 = pos12 % TILES_PER_ROW;
    const x12 = PADDING + (col12 * tileWidth);
    const y12 = PADDING + (row12 * tileHeight) - Y_OFFSET;
    drawTile(x12, y12, tileWidth - 10, tileHeight - 10, gameBoard[12]);
    
    // Draw tile 11 after (it will be above 12)
    const pos11 = pathOrder[10];  // Position for tile 11
    const row11 = Math.floor(pos11 / TILES_PER_ROW);
    const col11 = pos11 % TILES_PER_ROW;
    const x11 = PADDING + (col11 * tileWidth);
    const y11 = PADDING + (row11 * tileHeight) - Y_OFFSET;
    drawTile(x11, y11, tileWidth - 10, tileHeight - 10, gameBoard[11]);
    
    // Draw bottom row tiles last (7-10)
    for (let i = 7; i <= 10; i++) {
        const position = pathOrder[i - 1];  // -1 because pathOrder is 0-based
        const row = Math.floor(position / TILES_PER_ROW);
        const col = position % TILES_PER_ROW;
        
        const x = PADDING + (col * tileWidth);
        const y = PADDING + (row * tileHeight) - Y_OFFSET;
        
        const tileData = gameBoard[i];
        drawTile(x, y, tileWidth - 10, tileHeight - 10, tileData);
    }
    
    // Draw roll indicators after the board
    drawRollIndicators();
}

// Modify startGame to reset dice values
async function startGame() {
    const betAmount = parseFloat(betAmountInput.value);
    const currency = currencySelect.value;
    const difficulty = difficultySelect.value;

    try {
        const response = await fetch('/games/snakes/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                betAmount,
                currency,
                difficulty
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start game');
        }

        const data = await response.json();
        
        // Update balance display using navbar function with server response data
        if (window.updateNavbarBalance) {
            window.updateNavbarBalance(data.currency, data.balance);
        }
        
        // Update game state
        isGameActive = true;
        currentPosition = 1;
        currentMultiplier = 1;
        completedRolls = 0;
        
        // Reset dice values to 1
        currentDice.dice1 = 1;
        currentDice.dice2 = 1;
        
        // Reset multiplier color
        multiplierColor = '#FFFFFF';
        
        // Update UI
        playBtn.style.display = 'none';
        rollBtn.style.display = 'block';
        rollBtn.disabled = false;
        rollBtn.style.opacity = 1;
        cashoutBtn.style.display = 'block';
        
        // Disable inputs during game
        betAmountInput.disabled = true;
        currencySelect.disabled = true;
        difficultySelect.disabled = true;
        
        // Clear any previous highlights and draw initial state
        drawBoard();
        return data;
    } catch (error) {
        alert(error.message);
        return null;
    }
}

// Add animation function for dice click effect
async function animateDiceClick(diceNumber) {
    const frames = 4;
    const scaleMin = 0.9;
    const scaleMax = 1;
    const frameTime = 50;

    for (let i = 0; i < frames; i++) {
        const progress = i / (frames - 1);
        const scale = scaleMin + (scaleMax - scaleMin) * (1 - Math.cos(progress * Math.PI)) / 2;
        
        if (diceNumber === 1) {
            diceAnimationState.dice1Scale = scale;
        } else {
            diceAnimationState.dice2Scale = scale;
        }
        
        drawBoard();
        await new Promise(resolve => setTimeout(resolve, frameTime));
    }
}

// Modify roll function to animate dice updates sequentially
async function roll() {
    if (!isGameActive) return;

    // Disable roll button and reduce opacity during roll
    rollBtn.disabled = true;
    rollBtn.style.opacity = 0.5;

    completedRolls++;
    drawBoard();

    try {
        const response = await fetch('/games/snakes/roll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to roll');
        }

        const data = await response.json();
        
        // Update dice values one at a time with animation
        if (data.dice1 && data.dice2) {
            // Update and animate first die
            currentDice.dice1 = data.dice1;
            await animateDiceClick(1);
            
            // Small delay between dice
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Update and animate second die
            currentDice.dice2 = data.dice2;
            await animateDiceClick(2);
            
            // Small delay before movement animation
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Animate movement from START to new position
        for (let i = 1; i <= data.position; i++) {
            drawBoard();
            highlightTile(i, i === data.position);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Update game state and multiplier color
        currentPosition = data.position;
        currentMultiplier = data.multiplier;
        
        // Set color based on outcome
        if (!data.isAlive && data.finalWin === 0) {
            multiplierColor = '#ea183a'; // Red for snake
        } else if (data.multiplier > 1) {
            multiplierColor = '#00e53d'; // Green for win
        }
        drawBoard();
        highlightTile(data.position, true); // Re-apply highlight after updating multiplier
        
        // If game is over (hit snake or won)
        if (!data.isAlive) {
            isGameActive = false;
            rollBtn.style.display = 'none';
            cashoutBtn.style.display = 'none';
            playBtn.style.display = 'block';
            
            // Enable inputs
            betAmountInput.disabled = false;
            currencySelect.disabled = false;
            difficultySelect.disabled = false;
            
            // Update balance using navbar function with server response data if available
            if (data.balance && window.updateNavbarBalance) {
                window.updateNavbarBalance(data.currency, data.balance);
            }
        } else {
            // Re-enable roll button if game is still active
            rollBtn.disabled = false;
            rollBtn.style.opacity = 1;
        }
        
        return data;
    } catch (error) {
        // Re-enable roll button on error
        rollBtn.disabled = false;
        rollBtn.style.opacity = 1;
        alert(error.message);
        return null;
    }
}

// Function to highlight the current tile
function highlightTile(position, isFinal = false) {
    const { tileWidth, tileHeight } = calculateTileDimensions();
    const pathOrder = [
        0,  1,  2,  3,    // Top row (positions 1-4)
        7,  11, 15,       // Right column (positions 5-7)
        14, 13, 12,       // Bottom row (positions 8-10)
        8,  4             // Left column (positions 11-12)
    ];
    
    const pos = pathOrder[position - 1];
    const row = Math.floor(pos / TILES_PER_ROW);
    const col = pos % TILES_PER_ROW;
    
    const x = PADDING + (col * tileWidth);
    const y = PADDING + (row * tileHeight) - Y_OFFSET;
    
    const tileData = gameBoard[position];
    // Use red only if landed (isFinal) and tile is snake
    const useRed = isFinal && tileData.type === 'snake';
    // Use gray for border/shadow if animating over a snake
    const useGray = !isFinal && tileData.type === 'snake';
    let colors;
    if (useRed) {
        colors = { button: '#ea183a', shadow: '#bb132f', border: '#bb132f' };
    } else if (useGray) {
        colors = { button: '#2f4552', shadow: '#a6b1bf', border: '#a6b1bf' };
    } else {
        colors = HIGHLIGHT_COLORS[currentDifficulty] || HIGHLIGHT_COLORS.easy;
    }
    
    // Use shadow color for all steps
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    
    // Draw tile background with rounded corners
    ctx.fillStyle = isFinal ? colors.button : '#2f4552';
    if (useGray) ctx.fillStyle = '#2f4552';
    
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, tileWidth - 10, tileHeight - 10, 14);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(x + 14, y);
        ctx.lineTo(x + tileWidth - 24, y);
        ctx.quadraticCurveTo(x + tileWidth - 10, y, x + tileWidth - 10, y + 14);
        ctx.lineTo(x + tileWidth - 10, y + tileHeight - 24);
        ctx.quadraticCurveTo(x + tileWidth - 10, y + tileHeight - 10, x + tileWidth - 24, y + tileHeight - 10);
        ctx.lineTo(x + 14, y + tileHeight - 10);
        ctx.quadraticCurveTo(x, y + tileHeight - 10, x, y + tileHeight - 24);
        ctx.lineTo(x, y + 14);
        ctx.quadraticCurveTo(x, y, x + 14, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw tile content
    ctx.fillStyle = isFinal ? '#000' : '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let text = '';
    if (tileData.type === 'start') {
        text = '▶';
    } else if (tileData.type === 'snake') {
        const img = isFinal ? snakeImage2 : snakeImage;
        ctx.drawImage(img, x + 20, y + 20, tileWidth - 50, tileHeight - 50);
        // Add border for non-final steps
        if (!isFinal) {
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 3;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, tileWidth - 10, tileHeight - 10, 14);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(x + 14, y);
                ctx.lineTo(x + tileWidth - 24, y);
                ctx.quadraticCurveTo(x + tileWidth - 10, y, x + tileWidth - 10, y + 14);
                ctx.lineTo(x + tileWidth - 10, y + tileHeight - 24);
                ctx.quadraticCurveTo(x + tileWidth - 10, y + tileHeight - 10, x + tileWidth - 24, y + tileHeight - 10);
                ctx.lineTo(x + 14, y + tileHeight - 10);
                ctx.quadraticCurveTo(x, y + tileHeight - 10, x, y + tileHeight - 24);
                ctx.lineTo(x, y + 14);
                ctx.quadraticCurveTo(x, y, x + 14, y);
                ctx.closePath();
                ctx.stroke();
            }
        }
        return;
    } else if (tileData.type === 'multiplier') {
        text = tileData.value.toFixed(2) + 'x';
    }
    
    ctx.fillText(text, x + (tileWidth - 10)/2, y + (tileHeight - 10)/2);
    
    // Add border for non-final steps
    if (!isFinal) {
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 3;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, tileWidth - 10, tileHeight - 10, 14);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x + 14, y);
            ctx.lineTo(x + tileWidth - 24, y);
            ctx.quadraticCurveTo(x + tileWidth - 10, y, x + tileWidth - 10, y + 14);
            ctx.lineTo(x + tileWidth - 10, y + tileHeight - 24);
            ctx.quadraticCurveTo(x + tileWidth - 10, y + tileHeight - 10, x + tileWidth - 24, y + tileHeight - 10);
            ctx.lineTo(x + 14, y + tileHeight - 10);
            ctx.quadraticCurveTo(x, y + tileHeight - 10, x, y + tileHeight - 24);
            ctx.lineTo(x, y + 14);
            ctx.quadraticCurveTo(x, y, x + 14, y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

// Cashout function
async function cashout() {
    if (!isGameActive) return;

    try {
        const response = await fetch('/games/snakes/cashout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cashout');
        }

        const data = await response.json();
        
        // Update balance using navbar function with server response data
        if (window.updateNavbarBalance) {
            window.updateNavbarBalance(data.currency, data.balance);
        }
        
        // Update game state
        isGameActive = false;
        
        // Update UI
        rollBtn.style.display = 'none';
        cashoutBtn.style.display = 'none';
        playBtn.style.display = 'block';
        
        // Enable inputs
        betAmountInput.disabled = false;
        currencySelect.disabled = false;
        difficultySelect.disabled = false;
        
        return data;
    } catch (error) {
        alert(error.message);
        return null;
    }
}
