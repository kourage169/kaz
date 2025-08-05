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


// Bet limits 
  const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
};

const canvas = document.getElementById('minesCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 5;
const COLS = 5;
const GRID_PADDING = 4; // Easily adjustable padding (in pixels)
const zoomAnimations = new Map(); // key => progress (0 to 1) for zoom in animation

// Load images
const diamondImage = new Image();
diamondImage.src = '/games/mines/diamond.png';
const mineImage = new Image();
mineImage.src = '/games/mines/mine.png';

let revealedTiles = new Set();
let revealedMines = new Set(); // Track which tiles are mines
let gameInProgress = false;
let isGameActive = false;
let currentMultiplier = 1.0;

// Update the playButton click handler
const playButton = document.getElementById('playBtn');
const cashoutButton = document.getElementById('cashoutBtn');
const winModal = document.getElementById('winModal');
const winAmountSpan = document.getElementById('winAmount');
const winCurrencySpan = document.getElementById('winCurrency');
const winMultiplierSpan = document.getElementById('winMultiplier');

// Add these variables at the top with other state variables
let lastRevealedKey = null;
let isGameOver = false;
let minePositions = [];
let isProcessingClick = false; // Flag to track if we're currently processing a tile click
let tilesRevealed = 0; // Track how many tiles have been revealed
let isStartingGame = false; // Flag to prevent multiple play button clicks

function getTileSize() {
  // Subtract padding from both sides when calculating tile size
  return (canvas.clientWidth - 2 * GRID_PADDING) / COLS;
}

// Resize canvas for high-DPI screens
function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  canvas.width = displayWidth * scale;
  canvas.height = displayHeight * scale;

  ctx.setTransform(scale, 0, 0, scale, 0, 0); // Normalize drawing scale
  drawGrid(); // Redraw on resize
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (let side in defaultRadius) {
        radius[side] = radius[side] || 0;
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

// Helper to draw tile shadow
// Draw a bottom shadow shape with rounded top corners extending upwards on left/right
function drawBottomEdgeShadow(ctx, x, y, width, height, radius, shadowColor) {
    ctx.beginPath();

    // Start bottom-left corner
    ctx.moveTo(x, y + height);

    // Bottom edge
    ctx.lineTo(x + width, y + height);

    // Right vertical edge going upward
    ctx.lineTo(x + width, y + radius);

    // Top-right rounded corner (arc)
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);

    // Top edge (shadow top)
    ctx.lineTo(x + radius, y);

    // Top-left rounded corner (arc)
    ctx.quadraticCurveTo(x, y, x, y + radius);

    // Left vertical edge going down to start point
    ctx.lineTo(x, y + height);

    ctx.closePath();

    ctx.fillStyle = shadowColor;
    ctx.fill();
}

// Main draw grid function
function drawGrid() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const TILE_SIZE = getTileSize();

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = GRID_PADDING + col * TILE_SIZE;
            const y = GRID_PADDING + row * TILE_SIZE;
            const key = `${row},${col}`;

            const outerPadding = 1;
            const bgPadding = 6;
            const coverPadding = 2;

            // Set opacity based on game state and last revealed tile
            ctx.globalAlpha = (isGameOver && key !== lastRevealedKey) ? 0.4 : 1;

            // Draw smaller background tile:
            ctx.fillStyle = '#061724';
            roundRect(
                ctx,
                x + outerPadding + bgPadding / 2,
                y + outerPadding + bgPadding / 2,
                TILE_SIZE - 2 * outerPadding - bgPadding,
                TILE_SIZE - 2 * outerPadding - bgPadding,
                6
            );
            ctx.fill();

            // Cover tile
            if (!revealedTiles.has(key) && (!isGameOver || zoomAnimations.has(key))) {
                ctx.save();

                // If this tile is animating, scale up the cover tile
                let scale = 1;
                if (zoomAnimations.has(key)) {
                    const progress = zoomAnimations.get(key);
                    scale = 1 - progress; // scale from 1 down to 0
                    if (scale < 0) scale = 0;
                    const centerX = x + TILE_SIZE / 2;
                    const centerY = y + TILE_SIZE / 2;
                    ctx.translate(centerX, centerY);
                    ctx.scale(scale, scale);
                    ctx.translate(-centerX, -centerY);
                }

                // Calculate cover tile position and size
                const coverX = x + outerPadding + coverPadding;
                const coverY = y + outerPadding + coverPadding;
                const coverSize = TILE_SIZE - 2 * outerPadding - 2 * coverPadding;

                // Draw cover tile rounded rect
                ctx.fillStyle = '#2f4552';
                roundRect(ctx, coverX, coverY, coverSize, coverSize, 10);
                ctx.fill();

                // Clip to cover tile shape so shadow won't overflow
                ctx.beginPath();
                roundRect(ctx, coverX, coverY, coverSize, coverSize, 10);
                ctx.clip();

                // Draw shadow clipped inside cover tile bounds
                drawBottomEdgeShadow(
                    ctx,
                    coverX,
                    coverY + coverSize - 4,  // position near bottom edge
                    coverSize,
                    8,                       // shadow height
                    6,                       // shadow corner radius
                    'rgba(0, 0, 0, 0.2)'     // shadow color with opacity
                );

                ctx.restore();
            }

            // Draw revealed state (diamond or mine)
            if (revealedTiles.has(key) || isGameOver) {
                const isMine = revealedMines.has(key);
                const image = isMine ? mineImage : diamondImage;
                const imageSize = (TILE_SIZE - 2 * outerPadding - bgPadding) * 0.8;
                const imageX = x + outerPadding + bgPadding / 2 + (TILE_SIZE - 2 * outerPadding - bgPadding - imageSize) / 2;
                const imageY = y + outerPadding + bgPadding / 2 + (TILE_SIZE - 2 * outerPadding - bgPadding - imageSize) / 2;
                ctx.drawImage(image, imageX, imageY, imageSize, imageSize);
            }

            // Reset opacity for next tile
            ctx.globalAlpha = 1;
        }
    }
}

  
  
function getTileAtPos(x, y) {
  const TILE_SIZE = getTileSize();
  // Subtract padding when calculating tile position
  const col = Math.floor((x - GRID_PADDING) / TILE_SIZE);
  const row = Math.floor((y - GRID_PADDING) / TILE_SIZE);
  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
    return { row, col };
  }
  return null;
}

// Handle taps/clicks
canvas.addEventListener('click', async (e) => {
  if (!gameInProgress || isProcessingClick) return; // Prevent clicks while processing

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const tile = getTileAtPos(x, y);

  if (!tile) return;
  const key = `${tile.row},${tile.col}`;

  if (revealedTiles.has(key) || zoomAnimations.has(key)) return;

  // Set processing flag to prevent additional clicks
  isProcessingClick = true;

  // First: optimistically register that this tile is "about to animate"
  zoomAnimations.set(key, 0);
  drawGrid(); // show it immediately at scale = 1 before we even talk to the server

  try {
    const index = tile.row * COLS + tile.col;
    const response = await fetch('/games/mines/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    });
    const data = await response.json();

    lastRevealedKey = key;

    // Now start the 150ms zoom animation:
    const duration = 150;
    const startTime = performance.now();

    function animate() {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      zoomAnimations.set(key, progress);
      drawGrid();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        zoomAnimations.delete(key);
        revealedTiles.add(key);
        
        // Increment tiles revealed counter
        tilesRevealed++;
        
        // Enable cashout button after revealing at least one tile
        if (tilesRevealed === 1) {
          cashoutButton.disabled = false;
          cashoutButton.style.opacity = '1';
        }

        if (data.mineHit) {
          revealedMines.add(key);
          minePositions = data.allMinePositions || [];
          gameInProgress = false;
          endGame();
          // No need to fetch balances, already deducted on game start
        } else {
          currentMultiplier = data.multiplier;
          if (data.gameWon) {
            console.log('Auto-win detected! Game data:', data);
            minePositions = data.allMinePositions || [];
            showWinModal(data.winAmount, data.currency || 'USD', data.multiplier);
            gameInProgress = false;
            endGame();
            // Update balance from server response
            if (data.balance !== undefined) {
              updateBalanceFromServer(data.currency, data.balance);
            }
          }
        }

        drawGrid();
        // Reset processing flag only after animation is complete
        isProcessingClick = false;
      }
    }
    requestAnimationFrame(animate);

  } catch (err) {
    console.error('Reveal error:', err);
    alert('Error revealing tile');
    zoomAnimations.delete(key); // rollback if something went wrong
    drawGrid();
    // Make sure to reset processing flag even if there's an error
    isProcessingClick = false;
  }
});


  
// Add a resetGameState function to handle all resets
function resetGameState() {
    isGameActive = false;
    gameInProgress = false;
    isGameOver = false;
    currentMultiplier = 1.0;
    lastRevealedKey = null;
    minePositions = [];
    revealedTiles.clear();
    revealedMines.clear();
    zoomAnimations.clear();
    isProcessingClick = false; // Reset click processing flag
    tilesRevealed = 0; // Reset tiles revealed counter
    // Make sure play button is enabled when game ends
    playButton.disabled = false;
    hideWinModal();
    drawGrid();
}

// Update play button handler to use resetGameState
playButton.addEventListener('click', async () => {
    // Prevent multiple clicks while processing
    if (isStartingGame) return;
    
    // Set flag to prevent additional clicks
    isStartingGame = true;
    
    // Visual feedback that button is processing
    playButton.disabled = true;
    
    let betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = document.getElementById('currency').value;
    const bombCount = parseInt(document.getElementById('bombCount').value);

    // Auto-adjust bet amount to fit within limits
    const min = BET_LIMITS[currency].min;
    const max = BET_LIMITS[currency].max;
    if (betAmount < min) {
        betAmount = min;
        document.getElementById('betAmount').value = min;
    } else if (betAmount > max) {
        betAmount = max;
        document.getElementById('betAmount').value = max;
    }

    try {
        const response = await fetch('/games/mines/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                betAmount,
                mineCount: bombCount,
                currency
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Reset all game state before starting new game
                resetGameState();
                
                // Set new game state
                isGameActive = true;
                gameInProgress = true;
                playButton.style.display = 'none';
                cashoutButton.style.display = 'block';
                
                // Initially disable cashout button until at least one tile is revealed
                cashoutButton.disabled = true;
                cashoutButton.style.opacity = '0.5';
                
                // Disable controls
                document.getElementById('betAmount').disabled = true;
                document.getElementById('currency').disabled = true;
                document.getElementById('bombCount').disabled = true;
                
                // Visually update balance display after bet is placed
                updateBalanceDisplay(currency, -betAmount);
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to start game');
            
            // Re-enable play button if there's an error
            playButton.disabled = false;
        }
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Error starting game');
        
        // Re-enable play button if there's an error
        playButton.disabled = false;
    } finally {
        // Reset the flag regardless of success or failure
        isStartingGame = false;
    }
});

// Add currency formatting helper function
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
    } else if (currency === 'LBP') {
        // Format LBP with commas and £ symbol
        return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}

function showWinModal(amount, currency, multiplier) {
    winMultiplierSpan.textContent = multiplier.toFixed(2);
    winAmountSpan.textContent = formatCurrencyAmount(amount, currency);
    winCurrencySpan.style.display = 'none'; // Hide the currency text since it's now part of the formatted amount
    winModal.classList.add('show');
    console.log('Win modal shown with:', { amount, currency, multiplier });
}

function hideWinModal() {
    winModal.classList.remove('show');
}

function endGame() {
    isGameActive = false;
    gameInProgress = false;
    isGameOver = true;
    playButton.style.display = 'block';
    cashoutButton.style.display = 'none';
    document.getElementById('betAmount').disabled = false;
    document.getElementById('currency').disabled = false;
    document.getElementById('bombCount').disabled = false;
    
    // Reveal all mines
    if (minePositions && minePositions.length > 0) {
        minePositions.forEach(pos => {
            const row = Math.floor(pos / COLS);
            const col = pos % COLS;
            const key = `${row},${col}`;
            revealedTiles.add(key);
            revealedMines.add(key);
        });
    }
    drawGrid();
}



// On window resize
window.addEventListener('resize', resizeCanvas);

// Initial setup
resizeCanvas();


// Sync currency selection between navbar and game controls
function syncCurrencySelections() {
    // Set up event listeners for navbar dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const currencySelect = document.getElementById('currency');
    const selectedBalance = document.getElementById('selected-balance');
    
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const currency = item.getAttribute('data-currency');
            // Update the game control dropdown to match navbar selection
            currencySelect.value = currency;
            setBetAmountToMin(); // Adjust bet amount
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
        setBetAmountToMin(); // Adjust bet amount
    });
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
    syncCurrencySelections();
});

// Cashout handler
cashoutButton.addEventListener('click', async () => {
    if (!isGameActive) return;

    try {
        const response = await fetch('/games/mines/cashout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Cashout successful! Received from backend:', {
                    winnings: result.winnings,
                    multiplier: result.multiplier,
                    currency: result.currency,
                    balance: result.balance
                });
                // Store mine positions before showing win modal
                minePositions = result.allMinePositions || [];
                showWinModal(result.winnings, result.currency || 'USD', currentMultiplier);
                endGame();
                // Update balance from server response
                if (result.balance !== undefined) {
                    updateBalanceFromServer(result.currency, result.balance);
                }
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to cashout');
        }
    } catch (error) {
        console.error('Error cashing out:', error);
        alert('Error cashing out');
    }
});

// New function to update balance display visually
function updateBalanceDisplay(currency, amount) {
    // Get the dropdown items
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
    
    // Get the selected balance display
    const selectedBalance = document.getElementById('selected-balance');
    
    if (currency === 'USD' && usdDropdownItem) {
        const amountLabel = usdDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
            // Extract current balance value (remove $ and convert to number)
            let currentBalance = parseFloat(amountLabel.textContent.replace('$', ''));
            // Update balance
            currentBalance += amount;
            // Update display
            amountLabel.textContent = formatCurrencyAmount(currentBalance, 'USD');
            
            // Update selected balance if USD is currently selected
            if (document.getElementById('currency').value === 'USD' && selectedBalance) {
                selectedBalance.textContent = formatCurrencyAmount(currentBalance, 'USD');
            }
        }
    } else if (currency === 'LBP' && lbpDropdownItem) {
        const amountLabel = lbpDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
            // Extract current balance value (remove £ and commas, convert to number)
            let currentBalance = parseFloat(amountLabel.textContent.replace('£', '').replace(/,/g, ''));
            // Update balance
            currentBalance += amount;
            // Update display
            amountLabel.textContent = formatCurrencyAmount(currentBalance, 'LBP');
            
            // Update selected balance if LBP is currently selected
            if (document.getElementById('currency').value === 'LBP' && selectedBalance) {
                selectedBalance.textContent = formatCurrencyAmount(currentBalance, 'LBP');
            }
        }
    }
}

// New function to update balance from server response
function updateBalanceFromServer(currency, newBalance) {
    // Get the dropdown items
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
    
    // Get the selected balance display
    const selectedBalance = document.getElementById('selected-balance');
    
    if (currency === 'USD' && usdDropdownItem) {
        const amountLabel = usdDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
            // Set the exact balance from server
            amountLabel.textContent = formatCurrencyAmount(newBalance, 'USD');
            
            // Update selected balance if USD is currently selected
            if (document.getElementById('currency').value === 'USD' && selectedBalance) {
                selectedBalance.textContent = formatCurrencyAmount(newBalance, 'USD');
            }
        }
    } else if (currency === 'LBP' && lbpDropdownItem) {
        const amountLabel = lbpDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
            // Set the exact balance from server
            amountLabel.textContent = formatCurrencyAmount(newBalance, 'LBP');
            
            // Update selected balance if LBP is currently selected
            if (document.getElementById('currency').value === 'LBP' && selectedBalance) {
                selectedBalance.textContent = formatCurrencyAmount(newBalance, 'LBP');
            }
        }
    }
}

// Add event listener to auto-adjust bet amount input after user finishes input
const betAmountInput = document.getElementById('betAmount');
betAmountInput.addEventListener('blur', () => {
    const currency = document.getElementById('currency').value;
    let value = parseFloat(betAmountInput.value);
    const min = BET_LIMITS[currency].min;
    const max = BET_LIMITS[currency].max;
    if (isNaN(value) || value < min) {
        betAmountInput.value = min;
    } else if (value > max) {
        betAmountInput.value = max;
    }
});

// Helper to set bet amount to min for selected currency
function setBetAmountToMin() {
    const currency = document.getElementById('currency').value;
    betAmountInput.value = BET_LIMITS[currency].min;
}
