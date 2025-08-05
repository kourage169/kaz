// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else if (currency === 'LBP') {
    // Format LBP with commas and £ symbol, ensuring it's an integer
    return `£${Math.floor(amount).toLocaleString('en-US')}`;
  }
  return amount.toString();
}

// Update balance display helper function
function updateBalanceDisplay(currency, newBalance) {
  // Find the dropdown item for the specified currency
  const currencyItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
  if (currencyItem) {
    // Update the dropdown item text with proper formatting
    if (currency === 'USD') {
      currencyItem.innerHTML = `
        <span class="amount-label">${formatCurrencyAmount(newBalance, 'USD')}</span>
        <span class="currency-label">USD</span>
      `;
    } else {
      currencyItem.innerHTML = `
        <span class="amount-label">${formatCurrencyAmount(newBalance, 'LBP')}</span>
        <span class="currency-label">LBP</span>
      `;
    }
  }
  
  // Also update the selected balance if it matches the current currency
  const selectedBalance = document.getElementById('selected-balance');
  if (selectedBalance) {
    selectedBalance.textContent = formatCurrencyAmount(newBalance, currency);
  }
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

// Sync currency selection between navbar and game controls
function syncCurrencySelections() {
  // Get references to elements
  const currencySelect = document.getElementById('currency');
  const selectedBalance = document.getElementById('selected-balance');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const balanceDropdown = document.getElementById('balance-dropdown');
  
  if (!currencySelect || !selectedBalance) {
    console.error('Currency synchronization failed: required elements not found');
    return;
  }
  
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      
      // Update bet input formatting and set to minimum bet for the currency
      formatBetInput(currency, true);
    });
  });

  // Set up event listener for game control currency dropdown
  currencySelect.addEventListener('change', () => {
    const currency = currencySelect.value;
    
    // Find the corresponding navbar dropdown item
    const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    
    if (matchingItem) {
      // Update selected balance display
      const amountLabel = matchingItem.querySelector('.amount-label');
      if (amountLabel) {
        selectedBalance.textContent = amountLabel.textContent;
      }
      
      // Hide dropdown after selection
      if (balanceDropdown) {
        balanceDropdown.style.display = 'none';
      }
    }
    
    // Update bet input formatting and set to minimum bet for the currency
    formatBetInput(currency, true);
  });
}

// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Game settings and configurations
const DIFFICULTY_SETTINGS = {
  easy: { columns: 4, rows: 9 },
  medium: { columns: 3, rows: 9 },
  hard: { columns: 2, rows: 9 },
  expert: { columns: 3, rows: 9 },
  master: { columns: 4, rows: 9 }
};

let currentDifficulty = 'easy'; // Default difficulty

// Canvas setup
const canvas = document.getElementById('towerCanvas');
const ctx = canvas.getContext('2d');

// Load game assets
const gameAssets = {
  diamonds: {
    gray: new Image(),
    light_blue: new Image(),
    dark_blue: new Image(),
    green: new Image(),
    pink: new Image(),
    red: new Image(),
    purple: new Image(),
    orange: new Image(),
    yellow: new Image()
  },
  bomb: new Image(),
  bombSpritesheet: new Image(),
  bombRevealSpritesheet: new Image(),
  castleTop: new Image()
};

// Bomb animation settings
let bombFrame = 0;
const BOMB_SPRITE_WIDTH = 105;
const BOMB_TOTAL_FRAMES = 8;

// Bomb reveal animation settings
const BOMB_REVEAL_SPRITE_WIDTH = 149;
const BOMB_REVEAL_TOTAL_FRAMES = 10;
const BOMB_REVEAL_DURATION_FRAMES = 5; // How many game frames each reveal animation frame lasts
const BOMB_IDLE_DURATION_FRAMES = 8; // Duration for each frame of idle animation

// Track bomb animations
const bombAnimations = new Map(); // Maps "rowIndex,colIndex" to animation state

// Row-specific diamond colors (bottom to top)
const rowDiamonds = [
  'gray',          // Bottom row (0)
  'light_blue',    // Row 1
  'dark_blue',     // Row 2
  'green',         // Row 3
  'pink',          // Row 4
  'red',           // Row 5
  'purple',        // Row 6
  'orange',        // Row 7
  'yellow'         // Top row (8)
];

// Load all diamond images
gameAssets.diamonds.gray.src = 'tower_assets/gray_diamond.png';
gameAssets.diamonds.light_blue.src = 'tower_assets/light_blue_diamond.png';
gameAssets.diamonds.dark_blue.src = 'tower_assets/dark_blue_diamond.png';
gameAssets.diamonds.green.src = 'tower_assets/green_diamond.png';
gameAssets.diamonds.pink.src = 'tower_assets/pink_diamond.png';
gameAssets.diamonds.red.src = 'tower_assets/red_diamond.png';
gameAssets.diamonds.purple.src = 'tower_assets/purple_diamond.png';
gameAssets.diamonds.orange.src = 'tower_assets/orange_diamond.png';
gameAssets.diamonds.yellow.src = 'tower_assets/yellow_diamond.png';
gameAssets.bomb.src = 'tower_assets/bomb.png';
gameAssets.bombSpritesheet.src = 'tower_assets/bomb_idle_spritesheet.png';
gameAssets.bombRevealSpritesheet.src = 'tower_assets/bomb_reveal_animation.png';
gameAssets.castleTop.src = 'tower_assets/castle_top_inactive.svg';

// Game state
let gameState = {
  tileWidth: 0,
  tileHeight: 0,
  paddingX: 35, // Horizontal padding
  paddingTop: 80,    // Top padding to move grid down
  paddingBottom: 30,  // Bottom padding
  tileGap: 8, // Gap between tiles
  tiles: [], // Will store our tile information
  isPlaying: false,
  gameId: null,
  currentRow: 0,
  activeRow: null, // Track which row is currently playable
  layoutPreview: null,
  lastClickedTile: null, // Track the last clicked tile
  betAmount: 0,
  currency: 'USD',
  currentMultiplier: 1.00, // Current multiplier, starting at 1.00x
  multiplierState: 'default', // Can be: 'default', 'safe', 'lose'
  isProcessingClick: false // Flag to prevent double clicks
};

// Responsive canvas setup
function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = container.clientWidth;
  const maxHeight = container.clientHeight || window.innerHeight * 0.8;

  // Set canvas size based on container
  canvas.width = Math.min(maxWidth - 40, 800);
  canvas.height = Math.min(maxHeight - 40, 900);

  // Calculate tile dimensions based on canvas size and current difficulty
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  gameState.tileWidth = (canvas.width - (gameState.paddingX * 2)) / settings.columns;
  gameState.tileHeight = (canvas.height - (gameState.paddingTop + gameState.paddingBottom)) / settings.rows;

  // Initialize tiles array
  initializeTiles();
  
  // Draw the game
  drawGame();
}

// Initialize tiles based on current difficulty
function initializeTiles() {
  const settings = DIFFICULTY_SETTINGS[currentDifficulty];
  gameState.tiles = [];

  for (let row = 0; row < settings.rows; row++) {
    const currentRow = [];
    for (let col = 0; col < settings.columns; col++) {
      currentRow.push({
        x: gameState.paddingX + (col * gameState.tileWidth),
        y: canvas.height - gameState.paddingBottom - ((row + 1) * gameState.tileHeight),
        width: gameState.tileWidth,
        height: gameState.tileHeight,
        state: 'inactive' // Can be: 'inactive', 'active', 'selected', 'wrong'
      });
    }
    gameState.tiles.push(currentRow);
  }
}

// Draw the game state
function drawGame() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background with padding around the grid
  const gridPadding = 8; // Extra padding around the grid
  const outerPadding = 12; // Padding for the outer background
  
  // Calculate grid dimensions
  const gridWidth = gameState.tiles[0].length * gameState.tileWidth;
  const gridHeight = gameState.tiles.length * gameState.tileHeight;
  
  // Calculate inner background rectangle dimensions
  const bgX = gameState.paddingX - gridPadding;
  const bgY = canvas.height - gameState.paddingBottom - gridHeight - gridPadding;
  const bgWidth = gridWidth + (gridPadding * 2);
  const bgHeight = gridHeight + (gridPadding * 2);
  
  // Calculate outer background rectangle dimensions
  const outerBgX = bgX - outerPadding;
  const outerBgY = bgY - outerPadding;
  const outerBgWidth = bgWidth + (outerPadding * 2);
  const outerBgHeight = bgHeight + (outerPadding * 2);
  
  // Draw outer background (light gray)
  ctx.fillStyle = '#566879';
  
  // Draw a path with rounded corners only at the bottom
  ctx.beginPath();
  // Top-left (no rounding)
  ctx.moveTo(outerBgX, outerBgY);
  // Top-right (no rounding)
  ctx.lineTo(outerBgX + outerBgWidth, outerBgY);
  // Right side
  ctx.lineTo(outerBgX + outerBgWidth, outerBgY + outerBgHeight - 4);
  // Bottom-right corner (rounded)
  ctx.arcTo(outerBgX + outerBgWidth, outerBgY + outerBgHeight, outerBgX + outerBgWidth - 4, outerBgY + outerBgHeight, 4);
  // Bottom side
  ctx.lineTo(outerBgX + 4, outerBgY + outerBgHeight);
  // Bottom-left corner (rounded)
  ctx.arcTo(outerBgX, outerBgY + outerBgHeight, outerBgX, outerBgY + outerBgHeight - 4, 4);
  // Back to top-left
  ctx.lineTo(outerBgX, outerBgY);
  
  ctx.fill();
  
  // Draw castle top image above the background
  const castleTopHeight = 50; // Increased height of the castle top image
  const castleTopY = outerBgY - castleTopHeight; // Position it just above the outer background
  
  // Draw the castle top with the same width as the outer background
  ctx.drawImage(
    gameAssets.castleTop,
    outerBgX,
    castleTopY,
    outerBgWidth,
    castleTopHeight
  );
  
  // Draw multiplier counter in the center of the castle top image if game is in progress
  if (gameState.isPlaying || gameState.multiplierState === 'lose' || gameState.multiplierState === 'safe') {
    const multiplierText = gameState.currentMultiplier.toFixed(2) + 'x';
    ctx.font = 'bold 18px Arial';
    
    // Measure text to center it properly
    const textMetrics = ctx.measureText(multiplierText);
    const textWidth = textMetrics.width;
    
    // Background dimensions
    const multiplierBgWidth = textWidth + 24;
    const multiplierBgHeight = 26;
    const multiplierBgX = outerBgX + (outerBgWidth - multiplierBgWidth) / 2; // Center horizontally
    
    // Move the counter down by positioning it lower in the castle top
    const verticalOffset = 22; // Add offset to move down
    const multiplierBgY = castleTopY + (castleTopHeight - multiplierBgHeight) / 2 + verticalOffset;
    
    // Draw rounded rectangle for multiplier background
    ctx.fillStyle = '#0f212c';
    roundedRect(ctx, multiplierBgX, multiplierBgY, multiplierBgWidth, multiplierBgHeight, 13);
    ctx.fill();
    
    // Set text color based on multiplier state
    if (gameState.multiplierState === 'safe') {
      ctx.fillStyle = '#00e354'; // Green for safe steps
    } else if (gameState.multiplierState === 'lose') {
      ctx.fillStyle = '#eb1d39'; // Red for losing
    } else {
      ctx.fillStyle = 'white'; // White for default/start
    }
    
    // Draw multiplier text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      multiplierText,
      multiplierBgX + (multiplierBgWidth / 2),
      multiplierBgY + (multiplierBgHeight / 2)
    );
    
    // Reset text alignment for other text
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
  
  // Draw inner background (dark blue)
  ctx.fillStyle = '#182432';
  roundedRect(ctx, bgX, bgY, bgWidth, bgHeight, 2);
  ctx.fill();

  // Check if game is over (no active row)
  const isGameOver = !gameState.isPlaying && gameState.lastClickedTile !== null;
  
  // Update bomb animations if there are any bombs visible
  let animationsActive = false;
  if (gameState.tiles.some(row => row.some(tile => tile.state === 'wrong'))) {
    // Update general bomb frame for idle animations - we'll no longer use this directly
    bombFrame = (bombFrame + 1) % (BOMB_TOTAL_FRAMES * 5);
    
    // Update specific bomb animations
    bombAnimations.forEach((animation, key) => {
      animation.frameCounter++;
      
      if (animation.state === 'reveal') {
        // Reveal animation logic
        if (animation.frameCounter >= BOMB_REVEAL_DURATION_FRAMES) {
          animation.frameCounter = 0;
          animation.frame++;
          
          // Transition to idle when reveal animation is near complete (frame 7 out of 10)
          // This shows the bomb slightly before the reveal animation is completely finished
          if (animation.frame >= 7) {
            animation.state = 'idle';
            animation.frame = 0;
            animation.frameCounter = 0;
          }
        }
        animationsActive = true;
      } else if (animation.state === 'idle') {
        // Idle animation logic - similar to reveal animation but with different duration
        if (animation.frameCounter >= BOMB_IDLE_DURATION_FRAMES) {
          animation.frameCounter = 0;
          animation.frame = (animation.frame + 1) % BOMB_TOTAL_FRAMES;
          animationsActive = true;
        }
      }
    });
    
    // For bombs that don't have animations yet, create idle animations for them
    gameState.tiles.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile.state === 'wrong') {
          const key = `${rowIndex},${colIndex}`;
          if (!bombAnimations.has(key)) {
            bombAnimations.set(key, {
              state: 'idle',
              frame: 0,
              frameCounter: 0
            });
            animationsActive = true;
          }
        }
      });
    });
    
    // Request next animation frame if animations are still active
    if (animationsActive || bombAnimations.size > 0) {
      requestAnimationFrame(drawGame);
    }
  }

  // First pass: Draw all tiles and diamonds
  gameState.tiles.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      // Skip bomb tiles for now, we'll draw them in the second pass
      if (tile.state === 'wrong') return;
      
      // Set lower opacity for all tiles except the last clicked one when game is over
      if (isGameOver && 
          !(rowIndex === gameState.lastClickedTile.row && 
            colIndex === gameState.lastClickedTile.col)) {
        ctx.globalAlpha = 0.5;
      } else {
        ctx.globalAlpha = 1.0;
      }
      
      // Draw tile background with rounded corners
      const cornerRadius = 4; // Radius for rounded corners
      const x = tile.x + gameState.tileGap/2;
      const y = tile.y + gameState.tileGap/2;
      const width = tile.width - gameState.tileGap;
      const height = tile.height - gameState.tileGap;
      
      // Draw rounded rectangle
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
      
      ctx.fillStyle = getTileColor(tile.state);
      ctx.fill();

      // Add border for selected tiles and empty bomb tiles
      if (tile.state === 'selected' || tile.state === 'empty-bomb') {
        ctx.strokeStyle = '#3b525f';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw diamond if this is a selected tile
      if (tile.state === 'selected') {
        // Get the appropriate diamond color based on row index
        // The tiles array is already ordered from bottom to top, so we use rowIndex directly
        const diamondColor = rowDiamonds[rowIndex];
        const padding = 2;
        const imageSize = Math.min(tile.width, tile.height) - gameState.tileGap - (padding * 2);
        
        // Offset upward by 15% of the image height to make it stick out over the top edge
        const yOffset = imageSize * 0.15;
        
        // Draw diamond
        ctx.drawImage(
          gameAssets.diamonds[diamondColor],
          tile.x + (tile.width - imageSize) / 2,
          tile.y + (tile.height - imageSize) / 2 - yOffset,
          imageSize,
          imageSize
        );
      }
      
      // Reset opacity for next tile
      ctx.globalAlpha = 1.0;
    });
  });
  
  // Second pass: Draw bomb tiles with full opacity
  gameState.tiles.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile.state !== 'wrong') return;
      
      // Always use full opacity for bombs
      ctx.globalAlpha = 1.0;
      
      // Draw tile background with rounded corners
      const cornerRadius = 4; // Radius for rounded corners
      const x = tile.x + gameState.tileGap/2;
      const y = tile.y + gameState.tileGap/2;
      const width = tile.width - gameState.tileGap;
      const height = tile.height - gameState.tileGap;
      
      // Draw rounded rectangle
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
      
      ctx.fillStyle = getTileColor(tile.state);
      ctx.fill();
      
      // Draw the bomb with appropriate animation
      const padding = 0;
      const imageSize = Math.min(tile.width, tile.height) - gameState.tileGap - (padding * 2);
      const actualSize = imageSize * 1.5; // 50% larger
      const yOffset = actualSize * 0.3; // Make it stick out more
      
      // Get the animation state for this bomb
      const key = `${rowIndex},${colIndex}`;
      const animation = bombAnimations.get(key) || { 
        state: 'idle', 
        frame: 0,
        frameCounter: 0
      };
      
      // Calculate dimensions to maintain aspect ratio
      let spriteWidth, spriteHeight, currentFrame, spritesheet;
      
      if (animation.state === 'reveal') {
        // Use reveal animation
        spriteWidth = BOMB_REVEAL_SPRITE_WIDTH;
        spriteHeight = 189; // Height of reveal animation
        currentFrame = animation.frame;
        spritesheet = gameAssets.bombRevealSpritesheet;
      } else {
        // Use idle animation
        spriteWidth = BOMB_SPRITE_WIDTH;
        spriteHeight = 114; // Height of idle animation
        currentFrame = animation.frame; // Use animation's frame directly
        spritesheet = gameAssets.bombSpritesheet;
      }
      
      // Calculate dimensions to maintain aspect ratio
      const spriteRatio = spriteWidth / spriteHeight;
      let destWidth, destHeight;
      
      if (spriteRatio > 1) {
        // Wider than tall
        destWidth = actualSize;
        destHeight = actualSize / spriteRatio;
      } else {
        // Taller than wide
        destHeight = actualSize;
        destWidth = actualSize * spriteRatio;
      }
      
      ctx.drawImage(
        spritesheet,
        currentFrame * spriteWidth, // Source x
        0, // Source y
        spriteWidth, // Source width
        spriteHeight, // Source height
        tile.x + (tile.width - destWidth) / 2, // Destination x
        tile.y + (tile.height - destHeight) / 2 - yOffset, // Destination y
        destWidth, // Destination width
        destHeight // Destination height
      );
    });
  });
}

// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
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

// Get tile color based on its state
function getTileColor(state) {
  switch (state) {
    case 'active':
      return '#00e53d';
    case 'selected':
    case 'empty-bomb':
      return '#102632';
    case 'wrong':
      return '#8d0723';
    default:
      return '#213742';
  }
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  // Set initial difficulty from dropdown
  const difficultySelect = document.getElementById('difficulty');
  currentDifficulty = difficultySelect.value;
  
  // Add change listener to difficulty dropdown
  difficultySelect.addEventListener('change', (e) => {
    changeDifficulty(e.target.value);
  });
  
  // Initialize controls
  initializeControls();
  
  // Initial canvas setup
  resizeCanvas();
  
  // Start animation
  requestAnimationFrame(drawGame);
});

// Handle difficulty changes
function changeDifficulty(difficulty) {
  if (DIFFICULTY_SETTINGS[difficulty]) {
    currentDifficulty = difficulty;
    resizeCanvas(); // This will reinitialize the tiles and redraw
  }
}

// Initialize game controls
function initializeControls() {
  const playBtn = document.getElementById('playBtn');
  const cashoutBtn = document.getElementById('cashoutBtn');
  const betAmountInput = document.getElementById('betAmount');
  const currencySelect = document.getElementById('currency');

  // Remove readonly attribute to make bet amount editable
  betAmountInput.removeAttribute('readonly');
  
  // Set initial currency formatting with minimum bet
  formatBetInput(currencySelect.value, true);
  
  // Synchronize currency selection between navbar and game controls
  syncCurrencySelections();
  
  // Handle bet input events
  betAmountInput.addEventListener('focus', function() {
    // When focused, remove currency symbol for easier editing
    const currency = currencySelect.value;
    let value;
    
    if (currency === 'USD') {
      // For USD, keep decimal places
      value = this.value.replace(/[^0-9.]/g, '');
    } else {
      // For LBP, remove decimal places
      value = this.value.replace(/[^0-9]/g, '');
    }
    
    this.value = value;
  });
  
  betAmountInput.addEventListener('blur', function() {
    // When blurred, reapply formatting
    formatBetInput(currencySelect.value);
  });

  playBtn.addEventListener('click', startGame);
  canvas.addEventListener('click', handleTileClick);
}

// Format bet input based on currency
function formatBetInput(currency, forceMinimum = false) {
  const betAmountInput = document.getElementById('betAmount');
  let numValue = 0;
  
  // Parse the current value based on currency
  if (currency === 'USD') {
    numValue = parseFloat(betAmountInput.value.replace(/[^0-9.]/g, '')) || 0;
  } else {
    // For LBP, remove any decimal part
    numValue = parseInt(betAmountInput.value.replace(/[^0-9]/g, '')) || 0;
  }
  
  // If switching currencies or force minimum is true, set to minimum bet
  if (forceMinimum || currency === 'LBP' && numValue < BET_LIMITS.LBP.min) {
    numValue = BET_LIMITS[currency].min;
  }
  
  // If switching to USD and current value is too small, set to minimum USD bet
  if (currency === 'USD' && numValue < BET_LIMITS.USD.min) {
    numValue = BET_LIMITS.USD.min;
  }
  
  if (currency === 'USD') {
    betAmountInput.value = `$${numValue.toFixed(2)}`;
  } else {
    // For LBP, ensure it's an integer and use locale string for thousands separators
    betAmountInput.value = `£${Math.floor(numValue).toLocaleString('en-US')}`;
  }
}

// Start new game
async function startGame() {
  try {
    // Prevent double clicks
    if (gameState.isProcessingClick) return;
    gameState.isProcessingClick = true;
    
    // Hide any visible win message
    const winMessageDiv = document.querySelector('.win-message');
    winMessageDiv.classList.remove('visible');
    
    const betAmountInput = document.getElementById('betAmount');
    const currency = document.getElementById('currency').value;
    
    // Parse bet amount based on currency
    let betAmount;
    if (currency === 'USD') {
      betAmount = parseFloat(betAmountInput.value.replace(/[^0-9.]/g, ''));
    } else {
      // For LBP, remove any decimal part
      betAmount = parseInt(betAmountInput.value.replace(/[^0-9]/g, ''));
    }
    
    // Check if bet amount is valid
    if (isNaN(betAmount) || betAmount <= 0) {
      throw new Error('Please enter a valid bet amount');
    }
    
    // Check if bet amount is within limits for the selected currency
    const limits = BET_LIMITS[currency];
    if (betAmount < limits.min || betAmount > limits.max) {
      throw new Error(`Bet must be between ${formatCurrencyAmount(limits.min, currency)} and ${formatCurrencyAmount(limits.max, currency)}`);
    }
    
    // Get current balance from the navbar dropdown items
    const currencyItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    if (!currencyItem) {
      throw new Error('Currency selection not found');
    }
    
    // Extract balance from the dropdown item
    let currentBalance;
    const amountLabel = currencyItem.querySelector('.amount-label');
    
    if (!amountLabel) {
      throw new Error('Balance display not found');
    }
    
    if (currency === 'USD') {
      // Parse USD (remove $ and convert to number)
      currentBalance = parseFloat(amountLabel.textContent.replace(/[^0-9.]/g, ''));
    } else {
      // Parse LBP (remove £ and commas, convert to number)
      currentBalance = parseFloat(amountLabel.textContent.replace(/[^0-9]/g, ''));
    }
    
    // Check if player has enough balance
    if (isNaN(currentBalance) || currentBalance < betAmount) {
      throw new Error('Insufficient balance for this bet');
    }
    
    const response = await fetch('/games/tower/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        betAmount,
        currency,
        difficulty: currentDifficulty
      })
    });

    if (!response.ok) {
      throw new Error('Failed to start game');
    }

    const data = await response.json();
    console.log('Start game response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to start game');
    }

    // Visually update balance by deducting bet amount (will be properly updated when game ends)
    const newBalance = currentBalance - betAmount;
    updateBalanceDisplay(currency, newBalance);

    // Store game state
    gameState.isPlaying = true;
    gameState.currentRow = data.gameState.currentStep;
    gameState.activeRow = data.gameState.currentStep;
    gameState.layoutPreview = data.layoutPreview;
    gameState.betAmount = betAmount;
    gameState.currency = currency;
    gameState.currentMultiplier = 1.00; // Reset multiplier value
    gameState.multiplierState = 'default'; // Reset multiplier state

    // Reset and initialize game board
    initializeTiles();
    
    // Set initial active row
    setActiveRow(0);
    
    // Update UI
    document.getElementById('playBtn').style.display = 'none';
    
    // Show cashout button but initially disabled until first step is taken
    const cashoutBtn = document.getElementById('cashoutBtn');
    cashoutBtn.style.display = 'block';
    cashoutBtn.disabled = true;
    cashoutBtn.style.opacity = '0.4';
    cashoutBtn.style.cursor = 'not-allowed';
    
    // Disable controls during gameplay
    const currencySelect = document.getElementById('currency');
    const difficultySelect = document.getElementById('difficulty');
    
    // Disable bet amount without changing opacity
    betAmountInput.disabled = true;
    
    // Disable and lower opacity for currency and difficulty
    currencySelect.disabled = true;
    currencySelect.style.opacity = '0.6';
    
    difficultySelect.disabled = true;
    difficultySelect.style.opacity = '0.6';
    
    drawGame();

  } catch (error) {
    console.error('Error starting game:', error);
    alert(error.message || 'Failed to start game. Please try again.');
  } finally {
    // Reset processing flag regardless of success or failure
    gameState.isProcessingClick = false;
  }
}

// Set active row tiles
function setActiveRow(rowIndex) {
  // Reset all tiles to inactive first
  gameState.tiles.forEach(row => {
    row.forEach(tile => {
      if (tile.state === 'active') {
        tile.state = 'inactive';
      }
    });
  });

  // Set new active row
  if (rowIndex >= 0 && rowIndex < gameState.tiles.length) {
    gameState.tiles[rowIndex].forEach(tile => {
      tile.state = 'active';
    });
    gameState.activeRow = rowIndex;
  }
}

// Handle tile click during game
async function handleTileClick(event) {
  if (!gameState.isPlaying) return;
  
  // Prevent double clicks
  if (gameState.isProcessingClick) return;

  const rect = canvas.getBoundingClientRect();
  // Calculate scale factors
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Apply scaling to get actual canvas coordinates
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  
  // Find clicked tile
  const currentRowTiles = gameState.tiles[gameState.activeRow];
  const clickedTile = currentRowTiles.find(tile => 
    x >= tile.x && x <= tile.x + tile.width &&
    y >= tile.y && y <= tile.y + tile.height
  );

  // Only allow clicking tiles in the active row
  if (!clickedTile || clickedTile.state !== 'active') return;

  try {
    // Set processing flag to prevent double clicks
    gameState.isProcessingClick = true;
    
    const response = await fetch('/games/tower/step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        columnIndex: currentRowTiles.indexOf(clickedTile),
        stepIndex: gameState.activeRow
      })
    });

    if (!response.ok) {
      throw new Error('Failed to process move');
    }

    const data = await response.json();
    console.log('Step response:', data); // Log response for debugging
    
    if (data.success) {
      // Store the last clicked tile
      gameState.lastClickedTile = {
        row: gameState.activeRow,
        col: currentRowTiles.indexOf(clickedTile)
      };
      
      if (data.result === 'safe') {
        // Correct tile selected
        clickedTile.state = 'selected';
        clickedTile.content = 'diamond';
        
        // Update the multiplier from the server response
        if (data.multiplier !== undefined) {
          gameState.currentMultiplier = data.multiplier;
          gameState.multiplierState = 'safe'; // Set multiplier text to green
        }
        
        // Enable cashout button after first step
        const cashoutBtn = document.getElementById('cashoutBtn');
        if (cashoutBtn.disabled) {
          cashoutBtn.disabled = false;
          cashoutBtn.style.opacity = '1';
          cashoutBtn.style.cursor = 'pointer';
        }
        
        // Move to next row
        const nextRow = gameState.activeRow + 1;
        if (nextRow < gameState.tiles.length) {
          setActiveRow(nextRow);
        }
        
        // Redraw the game board
        drawGame();
      } else if (data.result === 'bomb') {
        // Wrong tile selected
        clickedTile.state = 'wrong';
        clickedTile.content = 'bomb';
        
        // Set multiplier state to lose (red)
        gameState.multiplierState = 'lose';
        
        // Initialize the bomb reveal animation for this tile
        const key = `${gameState.activeRow},${currentRowTiles.indexOf(clickedTile)}`;
        bombAnimations.set(key, {
          state: 'reveal',
          frame: 0,
          frameCounter: 0
        });
        
        // Reveal the entire grid immediately
        if (data.revealedLayout) {
          revealFullGrid(data.revealedLayout);
        }
        
        // If the response includes the updated balance, update it in the UI
        if (data.balanceUSD !== undefined && data.balanceLBP !== undefined) {
          // Update both USD and LBP balances
          updateBalanceDisplay('USD', data.balanceUSD);
          updateBalanceDisplay('LBP', data.balanceLBP);
        } else if (data.balance !== undefined) {
          // Update only the current currency balance
          updateBalanceDisplay(gameState.currency, data.balance);
        }
        
        // End the game with lose status
        endGame('lose');
        
        // Redraw the game board to show the revealed grid
        drawGame();
      } else if (data.result === 'win') {
        clickedTile.state = 'selected';
        clickedTile.content = 'diamond';
        
        // Set multiplier state to 'safe' to keep green color
        gameState.multiplierState = 'safe';
        
        // Update the multiplier from the server response
        if (data.multiplier !== undefined) {
          gameState.currentMultiplier = data.multiplier;
        }
        
        // Reveal the entire grid immediately if available
        if (data.revealedLayout) {
          revealFullGrid(data.revealedLayout);
        }
        
        // If the response includes the updated balance, update it in the UI
        if (data.balanceUSD !== undefined && data.balanceLBP !== undefined) {
          // Update both USD and LBP balances
          updateBalanceDisplay('USD', data.balanceUSD);
          updateBalanceDisplay('LBP', data.balanceLBP);
        } else if (data.balance !== undefined) {
          // Update only the current currency balance
          updateBalanceDisplay(gameState.currency, data.balance);
        }
        
        // Calculate win amount based on bet and multiplier
        const winAmount = gameState.betAmount * gameState.currentMultiplier;
        showWinMessage(gameState.currentMultiplier, winAmount);
        
        // Redraw the game board to show the revealed grid with the multiplier
        drawGame();
        
        // End the game with win status
        endGame('win');
      }
    }

  } catch (error) {
    console.error('Error processing move:', error);
    alert('Failed to process move. Please try again.');
  } finally {
    // Reset processing flag regardless of success or failure
    gameState.isProcessingClick = false;
  }
}

// Function to reveal the full grid
function revealFullGrid(layout) {
  if (!layout) return;
  
  // Store the location of the last clicked tile (if available)
  const lastClickedRow = gameState.lastClickedTile ? gameState.lastClickedTile.row : null;
  const lastClickedCol = gameState.lastClickedTile ? gameState.lastClickedTile.col : null;
  
  // Check if layout is in the expected format or needs conversion
  // The step route returns layout as an array of arrays (map(row => row.tiles))
  // The cashout route returns the full layout object (with tiles and multiplier in each row)
  let processedLayout;
  if (Array.isArray(layout) && layout.length > 0) {
    if (typeof layout[0].tiles !== 'undefined') {
      // This is the full layout object from cashout
      processedLayout = layout.map(row => row.tiles);
    } else {
      // This is already processed layout from step
      processedLayout = layout;
    }
  } else {
    console.error('Invalid layout format', layout);
    return;
  }
  
  // Layout comes from bottom to top, matching our gameState.tiles structure
  processedLayout.forEach((rowData, rowIndex) => {
    if (!Array.isArray(rowData)) {
      console.error('Invalid row data format', rowData);
      return;
    }
    
    rowData.forEach((tileType, colIndex) => {
      // Skip if this is the clicked tile (already set) or if indices are out of bounds
      if (rowIndex >= gameState.tiles.length || colIndex >= gameState.tiles[rowIndex].length) {
        return;
      }
      
      if (gameState.tiles[rowIndex][colIndex].state === 'selected' || 
          gameState.tiles[rowIndex][colIndex].state === 'wrong') {
        return;
      }
      
      // Update tile state based on its type
      if (tileType === 'bomb') {
        // Only show the bomb that was stepped on, leave others empty
        if (lastClickedRow !== null && lastClickedCol !== null && 
            rowIndex === lastClickedRow && colIndex === lastClickedCol) {
          gameState.tiles[rowIndex][colIndex].state = 'wrong';
        } else {
          // For other bombs, use a special state to style them like revealed tiles
          gameState.tiles[rowIndex][colIndex].state = 'empty-bomb';
        }
      } else {
        // Show all diamonds regardless of row
        gameState.tiles[rowIndex][colIndex].state = 'selected';
      }
    });
  });
  
  // Turn off any remaining active tiles
  gameState.tiles.forEach(row => {
    row.forEach(tile => {
      if (tile.state === 'active') {
        tile.state = 'inactive';
      }
    });
  });
  
  // Clear active row since the game is over
  gameState.activeRow = null;
}

// Add a cashout button event handler
document.getElementById('cashoutBtn').addEventListener('click', async () => {
  // Prevent double clicks
  if (gameState.isProcessingClick) return;
  
  try {
    // Set processing flag to prevent double clicks
    gameState.isProcessingClick = true;
    
    const response = await fetch('/games/tower/cashout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to cash out');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Set multiplier state to 'safe' to keep green color on cashout
      gameState.multiplierState = 'safe';
      
      // Reveal the full grid immediately if provided
      if (data.revealedLayout) {
        revealFullGrid(data.revealedLayout);
      }
      
      // Update balance from the server response
      if (data.balanceUSD !== undefined && data.balanceLBP !== undefined) {
        updateBalanceDisplay('USD', data.balanceUSD);
        updateBalanceDisplay('LBP', data.balanceLBP);
      } else if (data.balance !== undefined) {
        updateBalanceDisplay(gameState.currency, data.balance);
      }
      
      // Display win message with multiplier and win amount
      showWinMessage(gameState.currentMultiplier, data.winAmount);
      
      // Redraw the game to show the revealed grid with multiplier
      drawGame();
      
      // End game with cashout status
      endGame('cashout');
    }
  } catch (error) {
    console.error('Error cashing out:', error);
    alert('Failed to cash out. Please try again.');
    // Reset processing flag on error
    gameState.isProcessingClick = false;
  }
});

// End the game
function endGame(status) {
  // Update game state
  gameState.isPlaying = false;
  gameState.activeRow = null;
  gameState.isProcessingClick = false; // Reset processing flag
  
  // Determine if we need to wait for bomb animation
  const needsAnimationDelay = status === 'lose' && 
                             bombAnimations.size > 0 && 
                             Array.from(bombAnimations.values()).some(a => a.state === 'reveal');
  
  if (needsAnimationDelay) {
    // For bomb hits, wait for the animation to complete before showing play button
    const waitTime = 500; // Approximation of reveal animation duration
    setTimeout(() => {
      updateGameEndUI();
    }, waitTime);
  } else {
    // For wins and cashouts, update UI immediately
    updateGameEndUI();
  }
}

// Helper to update UI at game end
function updateGameEndUI() {
  document.getElementById('playBtn').style.display = 'block';
  document.getElementById('cashoutBtn').style.display = 'none';
  
  // Re-enable controls
  const betAmountInput = document.getElementById('betAmount');
  const currencySelect = document.getElementById('currency');
  const difficultySelect = document.getElementById('difficulty');
  
  // Enable bet amount
  betAmountInput.disabled = false;
  
  // Enable and restore opacity for currency and difficulty
  currencySelect.disabled = false;
  currencySelect.style.opacity = '1';
  
  difficultySelect.disabled = false;
  difficultySelect.style.opacity = '1';
  
  // Keep multiplier value and state after game ends
  // (Will be reset when starting a new game)
  
  // Redraw the game with updated UI
  drawGame();
}

// Add this function to display the win message
function showWinMessage(multiplier, winAmount) {
  const winMessageDiv = document.querySelector('.win-message');
  const multiplierDiv = winMessageDiv.querySelector('.multiplier');
  const amountDiv = winMessageDiv.querySelector('.amount');
  
  // Format multiplier and win amount
  multiplierDiv.textContent = multiplier.toFixed(2) + 'x';
  amountDiv.textContent = formatCurrencyAmount(winAmount, gameState.currency);
  
  // Show the message
  winMessageDiv.classList.add('visible');
  
  // No timeout - message will stay visible until new game starts
}
