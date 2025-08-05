
  
// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
      // Format USD with commas and $ symbol
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'LBP') {
      // Format LBP with commas and £ symbol
      return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}

// Add bet limits at the top with other constants
const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
};

// ─── Currency synchronization variables ────────────────
const currencySelect = document.getElementById('currency');
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
      
      // Set bet amount to minimum for the selected currency
      const betAmountInput = document.getElementById('betAmount');
      if (betAmountInput) {
        const limits = BET_LIMITS[currency];
        if (currency === 'LBP') {
          betAmountInput.value = Math.round(limits.min).toString();
        } else {
          betAmountInput.value = limits.min.toFixed(2);
        }
      }
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
    
    // Set bet amount to minimum for the selected currency
    const betAmountInput = document.getElementById('betAmount');
    if (betAmountInput) {
      const limits = BET_LIMITS[currency];
      if (currency === 'LBP') {
        betAmountInput.value = Math.round(limits.min).toString();
      } else {
        betAmountInput.value = limits.min.toFixed(2);
      }
    }
  });
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


// Multiplier table based on cluster size (3+ connections only)
const CLUSTER_MULTIPLIERS = {
    1: 0.00,
    2: 0.00,
    3: 0.20,
    4: 1.40,
    5: 4.20,
    6: 6.20,
    7: 10.40,
    8: 24.00,
    9: 44.00,
    10: 100
};

// ─── B) Connect Grid Setup ─────────────────────────────────────────────

const canvas = document.getElementById('connectCanvas');
const ctx = canvas.getContext('2d');

const GRID_ROWS = 10; // vertical
const GRID_COLS = 8; // horizontal
const GRID_PADDING_X = 10; // horizontal padding (left/right)
const GRID_PADDING_Y_TOP = 10; // top padding
const GRID_PADDING_Y_BOTTOM = 40; // bottom padding
const TILE_GAP_X = 4; // horizontal gap between tiles
const TILE_GAP_Y = 10; // vertical gap between tiles

// Responsive padding scaling
function getResponsivePadding() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Scale padding based on screen size
  let scaleFactor = 1;
  if (screenWidth > 1200) scaleFactor = 1.2; // Large screens
  if (screenWidth > 1600) scaleFactor = 1.5; // Extra large screens
  
  return {
    paddingX: GRID_PADDING_X * scaleFactor,
    paddingYTop: GRID_PADDING_Y_TOP * scaleFactor,
    paddingYBottom: GRID_PADDING_Y_BOTTOM * scaleFactor,
    gapX: TILE_GAP_X * scaleFactor,
    gapY: TILE_GAP_Y * scaleFactor
  };
}

// Track game state
let gameResults = null; // Store game results from server
let hitAnimations = new Map(); // Track hit animations for each tile
let isAnimatingHits = false; // Track if we're currently animating hits
let currentOpacity = 1;
let targetOpacity = 1;
let opacityAnimationId = null;

function animateClick(key) {
  const startTime = performance.now();
  const duration = 200; // 200ms animation
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Create a "press down" effect: scale down to 0.9, then back to 1
    let scale = 1;
    if (progress < 0.5) {
      // Scale down
      scale = 1 - (0.1 * (progress * 2));
    } else {
      // Scale back up
      scale = 0.9 + (0.1 * ((progress - 0.5) * 2));
    }
    
    clickAnimations.set(key, scale);
    drawGrid();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      clickAnimations.delete(key);
    }
  }
  
  requestAnimationFrame(animate);
}

function animateOpacity() {
  if (Math.abs(currentOpacity - targetOpacity) > 0.01) {
    currentOpacity += (targetOpacity - currentOpacity) * 0.2;
    drawGrid();
    opacityAnimationId = requestAnimationFrame(animateOpacity);
  } else {
    currentOpacity = targetOpacity;
    opacityAnimationId = null;
  }
}

function updateOpacityTarget() {
  const isGameInProgress = gameResults !== null;
  targetOpacity = isGameInProgress ? 0.4 : 1;
  
  if (opacityAnimationId === null) {
    opacityAnimationId = requestAnimationFrame(animateOpacity);
  }
}

function updatePlayButtonState() {
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    const canPlay = !isAnimatingHits;
    playBtn.disabled = !canPlay;
    playBtn.style.opacity = canPlay ? '1' : '0.5';
  }
}

function getTileSize() {
  const responsive = getResponsivePadding();
  
  // Calculate available space after padding
  const availableWidth = canvas.clientWidth - 2 * responsive.paddingX;
  const availableHeight = canvas.clientHeight - responsive.paddingYTop - responsive.paddingYBottom;
  
  // Calculate gaps needed for the grid
  const totalGapsX = GRID_COLS - 1;
  const totalGapsY = GRID_ROWS - 1;
  
  // Calculate tile size to fill available space
  const tileWidth = (availableWidth - totalGapsX * responsive.gapX) / GRID_COLS;
  const tileHeight = (availableHeight - totalGapsY * responsive.gapY) / GRID_ROWS;
  
  return { 
    tileWidth: tileWidth, 
    tileHeight: tileHeight,
    totalWidth: availableWidth,
    totalHeight: availableHeight,
    responsive: responsive
  };
}

// Helper: draw rounded rectangle
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

function drawGrid() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const { tileWidth, tileHeight, responsive } = getTileSize();
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = responsive.paddingX + col * (tileWidth + responsive.gapX);
      const y = responsive.paddingYTop + row * (tileHeight + responsive.gapY);
      const key = `${row},${col}`;
      
      // Check if this tile is a hit (when game results are available)
      const isHit = gameResults && (
        (gameResults.hitTiles && gameResults.hitTiles.has(key)) || 
        (gameResults.hits && gameResults.hits.includes(row * GRID_COLS + col) && !isAnimatingHits)
      );
      
      // Check if this tile is part of a cluster
      const isCluster = gameResults && gameResults.clusterTiles && gameResults.clusterTiles.has(key);
      
      // Apply hit animation if this tile is a hit
      const hitScale = hitAnimations.get(key) || 1;
      const centerX = x + tileWidth / 2;
      const centerY = y + tileHeight / 2;
      
      if (hitScale !== 1) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(hitScale, hitScale);
        ctx.translate(-centerX, -centerY);
      }
      
      // Apply opacity for non-hit tiles when game is in progress
      if (!isHit && !isCluster && gameResults !== null) {
        ctx.globalAlpha = currentOpacity;
      }
      
      // Draw tile shadow (3D effect)
      const shadowWidth = tileWidth * 1.05; // 5% wider
      const shadowHeight = tileHeight * 1.08; // 8% taller
      const shadowX = x - (shadowWidth - tileWidth) / 2; // Center the shadow
      const shadowY = y + 2; // Small y offset below the tile
      
      ctx.save();
      if (isCluster) {
        // Get cluster size and color
        const clusterSize = gameResults.clusterSizes.get(key);
        const clusterColor = CLUSTER_COLORS[clusterSize];
        ctx.fillStyle = clusterColor ? clusterColor.shadow : '#6e1aba';
      } else if (isHit) {
        ctx.fillStyle = '#6e1aba'; // Purple shadow for hits
      } else {
        ctx.fillStyle = '#213742'; // Default shadow
      }
      roundRect(ctx, shadowX, shadowY, shadowWidth, shadowHeight, 4);
      ctx.fill();
      ctx.restore();
      
      // Draw tile
      ctx.save();
      if (isCluster) {
        // Get cluster size and color
        const clusterSize = gameResults.clusterSizes.get(key);
        const clusterColor = CLUSTER_COLORS[clusterSize];
        ctx.fillStyle = clusterColor ? clusterColor.tile : '#953bf5';
      } else if (isHit) {
        ctx.fillStyle = '#953bf5'; // Purple for hits
      } else {
        ctx.fillStyle = '#2f4552'; // Default color
      }
      roundRect(ctx, x, y, tileWidth, tileHeight, 4);
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.restore();
      
      // Reset transforms and opacity
      ctx.globalAlpha = 1;
      if (hitScale !== 1) {
        ctx.restore();
      }
    }
  }
  
  // Draw multipliers table below the grid
  drawMultipliersTable();
}

// Function to draw multipliers table below the grid
function drawMultipliersTable() {
  const { responsive } = getTileSize();
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  
  // Calculate multipliers table position and dimensions
  const tableY = responsive.paddingYTop + (GRID_ROWS * getTileSize().tileHeight) + (GRID_ROWS - 1) * responsive.gapY + 10; // 10px gap below grid
  const tableHeight = Math.max(20, Math.min(35, canvasHeight * 0.04)); // Slimmer height
  const tableWidth = canvasWidth - 2 * responsive.paddingX;
  const tableX = responsive.paddingX;
  
  // Calculate multiplier block dimensions
  const multiplierCount = Object.keys(CLUSTER_MULTIPLIERS).length;
  const blockSpacing = Math.max(2, tableWidth * 0.005);
  const totalSpacing = (multiplierCount - 1) * blockSpacing;
  const availableWidth = tableWidth - totalSpacing;
  const blockWidth = availableWidth / multiplierCount;
  
  // Responsive font size for multipliers
  const multiplierFontSize = Math.max(10, Math.min(16, blockWidth / 6));
  

  
  // Draw multiplier blocks
  const multipliers = Object.entries(CLUSTER_MULTIPLIERS);
  for (let i = 0; i < multipliers.length; i++) {
    const [connections, multiplier] = multipliers[i];
    const blockX = tableX + (i * (blockWidth + blockSpacing));
    
    // Check if this multiplier should be highlighted (walking animation)
    const shouldHighlight = gameResults && gameResults.highlightedMultiplierIndex >= i;
    
    // Determine background color based on multiplier value
    let backgroundColor = '#2f4552'; // Default color
    if (shouldHighlight) {
      // Use the cluster color based on the multiplier's assigned cluster size
      const multiplierClusterSize = gameResults.multiplierClusterMap && gameResults.multiplierClusterMap[i];
      const clusterColor = multiplierClusterSize ? CLUSTER_COLORS[multiplierClusterSize] : null;
      backgroundColor = clusterColor ? clusterColor.tile : '#953bf5'; // Default purple if no cluster color
    }
    
    // Draw multiplier background
    ctx.save();
    ctx.fillStyle = backgroundColor;
    roundRect(ctx, blockX, tableY, blockWidth, tableHeight, 6);
    ctx.fill();
    
    // Draw multiplier text
    let textColor = 'white'; // Default white text
    if (shouldHighlight) {
      // Only use black text for multipliers that were actually won (match the cluster size)
      const multiplierClusterSize = gameResults.multiplierClusterMap && gameResults.multiplierClusterMap[i];
      const isWinningMultiplier = multiplierClusterSize && parseInt(connections) === multiplierClusterSize;
      textColor = isWinningMultiplier ? '#000000' : 'white'; // Black only for winning multipliers
    }
    ctx.fillStyle = textColor;
    ctx.font = `bold ${multiplierFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Format multiplier (show 2 decimals for all except 100+)
    const multiplierText = multiplier >= 100 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(2)}x`;
    ctx.fillText(multiplierText, blockX + blockWidth / 2, tableY + tableHeight / 2);
    
    ctx.restore();
  }
}

// Remove tile selection - this game doesn't need it

// Responsive resize
function resizeCanvas() {
  const scale = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  canvas.width = displayWidth * scale;
  canvas.height = displayHeight * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawGrid();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', resizeCanvas);

// Add click event to canvas to hide win message
canvas.addEventListener('click', () => {
  hideWinMessage();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set initial play button state
  updatePlayButtonState();
  
  // Initialize currency synchronization
  syncCurrencySelections();
  
  // Add win message container to game container after canvas
  const gameContainer = document.querySelector('.game-container');
  const winMessageDiv = document.createElement('div');
  winMessageDiv.className = 'win-message';
  winMessageDiv.innerHTML = `
    <div class="multiplier">1.00x</div>
    <div class="amount">$0.00</div>
  `;
  gameContainer.appendChild(winMessageDiv);
  
  // Add bet amount validation and auto-adjustment
  const betAmountInput = document.getElementById('betAmount');
  if (betAmountInput) {
    betAmountInput.addEventListener('blur', () => {
      const currency = currencySelect.value;
      const limits = BET_LIMITS[currency];
      let currentValue = parseFloat(betAmountInput.value);
      
      if (isNaN(currentValue)) {
        currentValue = limits.min;
      } else if (currentValue < limits.min) {
        currentValue = limits.min;
      } else if (currentValue > limits.max) {
        currentValue = limits.max;
      }
      
      // Update the input value with the adjusted amount
      // Remove decimals for LBP, keep 2 decimals for USD
      if (currency === 'LBP') {
        betAmountInput.value = Math.round(currentValue).toString();
      } else {
        betAmountInput.value = currentValue.toFixed(2);
      }
    });
  }
  
    // Add play button functionality
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      // Hide any existing win message
      hideWinMessage();
      
      // Clear previous game state when starting new game
      if (gameResults && gameResults.hitTiles && gameResults.hitTiles.size > 0) {
        // Animate clearing all hit tiles at once
        animateClearHits();
        // Wait for clear animation to complete before proceeding
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        gameResults = null;
        updateOpacityTarget();
        drawGrid();
      }
      
      // Get bet amount and currency
      const betAmount = parseFloat(document.getElementById('betAmount').value);
      const currency = document.getElementById('currency').value;
      
      // Validate bet amount
      if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
      }
      
      // Check bet limits
      const limits = BET_LIMITS[currency];
      if (betAmount < limits.min || betAmount > limits.max) {
        alert(`Bet amount must be between ${formatCurrencyAmount(limits.min, currency)} and ${formatCurrencyAmount(limits.max, currency)}`);
        return;
      }
      
      // Check if user has enough balance
      const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
      const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
      
      let currentBalance = 0;
      if (currency === 'USD' && usdDropdownItem) {
        const amountLabel = usdDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
          const balanceText = amountLabel.textContent.trim();
          currentBalance = parseFloat(balanceText.replace(/[$,]/g, ''));
        }
      } else if (currency === 'LBP' && lbpDropdownItem) {
        const amountLabel = lbpDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
          const balanceText = amountLabel.textContent.trim();
          currentBalance = parseFloat(balanceText.replace(/[£,]/g, ''));
        }
      }
      
      if (isNaN(currentBalance) || currentBalance < betAmount) {
        alert('Insufficient balance');
        return;
      }
      
      // Visually deduct bet amount immediately
      updateBalanceDisplay(currency, -betAmount);
      
      try {
        // Disable buttons during request
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
        
        const response = await fetch('/games/connect/play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            betAmount,
            currency
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Handle successful play
          console.log('Play result:', data);
          
          // Store bet amount in the data for win calculation
          data.betAmount = betAmount;
          data.currency = currency;
          
          // Start hit animations (don't set gameResults yet)
          animateAllHits(data.hits, data.clusters, data);
          
        } else {
          // Revert the visual balance deduction on error
          updateBalanceDisplay(currency, betAmount);
          alert(data.error || 'Failed to play game');
          // Re-enable buttons on error
          playBtn.disabled = false;
          playBtn.style.opacity = '1';
        }
        
      } catch (error) {
        console.error('Error playing game:', error);
        // Revert the visual balance deduction on error
        updateBalanceDisplay(currency, betAmount);
        alert('Error playing game. Please try again.');
        // Re-enable buttons on error
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
      }
    });
  }
});

// Function to update balance display visually
function updateBalanceDisplay(currency, amount) {
  // Get the dropdown items
  const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
  const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
  
  // Get the selected balance display
  const selectedBalance = document.getElementById('selected-balance');
  
  if (currency === 'USD' && usdDropdownItem) {
    const amountLabel = usdDropdownItem.querySelector('.amount-label');
    if (amountLabel) {
      // Extract current balance value (handle different formats)
      const balanceText = amountLabel.textContent.trim();
      let currentBalance = parseFloat(balanceText.replace(/[$,]/g, ''));
      
      if (!isNaN(currentBalance)) {
        // Update balance
        currentBalance += amount;
        // Update display
        amountLabel.textContent = formatCurrencyAmount(currentBalance, 'USD');
        
        // Update selected balance if USD is currently selected
        if (document.getElementById('currency').value === 'USD' && selectedBalance) {
          selectedBalance.textContent = formatCurrencyAmount(currentBalance, 'USD');
        }
      }
    }
  } else if (currency === 'LBP' && lbpDropdownItem) {
    const amountLabel = lbpDropdownItem.querySelector('.amount-label');
    if (amountLabel) {
      // Extract current balance value (handle different formats)
      const balanceText = amountLabel.textContent.trim();
      let currentBalance = parseFloat(balanceText.replace(/[£,]/g, ''));
      
      if (!isNaN(currentBalance)) {
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
}

// Function to update balance from server response
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

// Cluster color mapping based on connection count
const CLUSTER_COLORS = {
  3: { tile: '#ffe600', shadow: '#c4a900' }, // Yellow
  4: { tile: '#ff9f1c', shadow: '#c46e00' }, // Orange
  5: { tile: '#ea183a', shadow: '#bb132f' }, // Red
  6: { tile: '#00e53c', shadow: '#008921' }, // Green
  7: { tile: '#53dffd', shadow: '#1f9bee' }, // Cyan
  8: { tile: '#017ffa', shadow: '#0e60b0' }, // Blue
  9: { tile: '#ff4eb8', shadow: '#c72184' }, // Pink
  10: { tile: '#963cf7', shadow: '#6f1abd' } // Purple
};

// Animate all hits
async function animateAllHits(hits, clusters, gameData) {
  isAnimatingHits = true;
  updatePlayButtonState();
  
  // Don't set gameResults yet - we'll set it individually for each tile
  
  // Animate each hit with a delay
  for (let i = 0; i < hits.length; i++) {
    const hitIndex = hits[i];
    const row = Math.floor(hitIndex / GRID_COLS);
    const col = hitIndex % GRID_COLS;
    const key = `${row},${col}`;
    
    // Set gameResults only when this specific tile animation starts
    if (i === 0) {
      gameResults = gameData;
    }
    
    // Mark this tile as hit immediately (like keno adds to selectedBlocks)
    // This will make it appear colored during the animation
    if (!gameResults.hitTiles) gameResults.hitTiles = new Set();
    gameResults.hitTiles.add(key);
    drawGrid(); // Redraw to show the color immediately
    
    // Animate this hit
    animateHit(key);
    
    // Wait before next hit
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // After hit animations complete, start multiplier animation and cluster animations in parallel
  if (clusters && clusters.length > 0) {
    // Start multiplier animation after the same delay as cluster animation
    setTimeout(() => {
      animateMultiplierWalk();
    }, 500);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before cluster animation
  }
  
  // Animate all clusters together (start each cluster simultaneously)
  const clusterPromises = clusters.map(async (cluster) => {
    const clusterSize = cluster.length;
    
    for (const tileIndex of cluster) {
      const row = Math.floor(tileIndex / GRID_COLS);
      const col = tileIndex % GRID_COLS;
      const key = `${row},${col}`;
      
      // Mark this tile as cluster
      if (!gameResults.clusterTiles) gameResults.clusterTiles = new Set();
      if (!gameResults.clusterSizes) gameResults.clusterSizes = new Map();
      gameResults.clusterTiles.add(key);
      gameResults.clusterSizes.set(key, clusterSize);
      drawGrid(); // Redraw to show the color immediately
      
      // Animate this cluster tile using the same animation as hits
      animateHit(key);
      
      // Wait before next cluster tile
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  });
  
  // Wait for all clusters to complete their animations
  await Promise.all(clusterPromises);
  
  // Set winning multiplier for highlighting in multipliers table immediately after animations
  if (gameResults && gameResults.clusters && gameResults.clusters.length > 0) {
    // Find the largest cluster size
    let maxClusterSize = 0;
    for (const cluster of gameResults.clusters) {
      if (cluster.length > maxClusterSize) {
        maxClusterSize = cluster.length;
      }
    }
    // Set the winning multiplier and cluster size based on the largest cluster
    gameResults.winningMultiplier = CLUSTER_MULTIPLIERS[maxClusterSize] || 0;
    gameResults.winningClusterSize = maxClusterSize;
    
    // Calculate win amount if not provided by server
    if (!gameResults.winAmount && gameResults.betAmount) {
      gameResults.winAmount = gameResults.betAmount * gameResults.winningMultiplier;
    }
    
    // Set win multiplier for display
    gameResults.winMultiplier = gameResults.winningMultiplier;
  }
  
  // Update balance from server response
  if (gameResults) {
    updateBalanceFromServer(gameResults.currency, gameResults.newBalance);
  }
  
  // Show win message after all animations complete (only if there's a win)
  if (gameResults) {
    // Use the total multiplier from server response and bet amount
    const totalMultiplier = gameResults.totalMultiplier || gameResults.multiplier || 0;
    const betAmount = gameResults.betAmount || 0;
    const currency = gameResults.currency || 'USD';
    const winAmount = betAmount * totalMultiplier;
    
    console.log('Checking win message:', { totalMultiplier, winAmount, currency });
    
    // Only show win message if there's actually a win (multiplier > 0)
    if (totalMultiplier > 0) {
      // Add 200ms delay before showing win message
      setTimeout(() => {
        showWinMessage(totalMultiplier, winAmount, currency);
      }, 200);
    }
  }
  
  // Set game state after animations complete
  isAnimatingHits = false;
  updatePlayButtonState();
}

// Animate clearing all hit tiles at once
function animateClearHits() {
  const startTime = performance.now();
  const duration = 200; // Same duration as hit animation
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Create a "scale up then down" effect: scale up to 1.1, then down to 0.8, then back to 1
    let scale = 1;
    if (progress < 0.5) {
      // Scale up to 1.1
      scale = 1 + (0.1 * (progress * 2));
    } else {
      // Scale down to 0.8, then back to 1
      scale = 1.1 - (0.3 * ((progress - 0.5) * 2));
    }
    
    // Apply scale animation to all hit tiles
    if (gameResults && gameResults.hitTiles) {
      for (const key of gameResults.hitTiles) {
        hitAnimations.set(key, scale);
      }
    }
    
    drawGrid();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Clear all animations and game state
      hitAnimations.clear();
      gameResults = null;
      updateOpacityTarget();
      drawGrid();
    }
  }
  
  requestAnimationFrame(animate);
}



// Animate walking through multipliers
async function animateMultiplierWalk() {
  if (!gameResults || !gameResults.clusters) return;
  
  // Get all unique cluster sizes and sort them
  const clusterSizes = [...new Set(gameResults.clusters.map(cluster => cluster.length))].sort((a, b) => a - b);
  
  if (clusterSizes.length === 0) return;
  
  // Initialize highlighted index and cluster mapping
  gameResults.highlightedMultiplierIndex = -1;
  gameResults.multiplierClusterMap = {};
  
  // For each cluster size, animate through its range
  let startIndex = 0;
  for (const clusterSize of clusterSizes) {
    // Find the multiplier index for this cluster size
    const multipliers = Object.entries(CLUSTER_MULTIPLIERS);
    let clusterIndex = -1;
    for (let i = 0; i < multipliers.length; i++) {
      const [connections, multiplier] = multipliers[i];
      if (parseInt(connections) === clusterSize) {
        clusterIndex = i;
        break;
      }
    }
    
    if (clusterIndex === -1) continue;
    
    // Assign cluster colors to multipliers (only for new multipliers)
    for (let i = startIndex; i <= clusterIndex; i++) {
      gameResults.multiplierClusterMap[i] = clusterSize;
    }
    
    // First, instantly highlight all multipliers up to this cluster size
    for (let i = 0; i <= clusterIndex; i++) {
      gameResults.highlightedMultiplierIndex = i;
    }
    drawGrid();
    
    // Then animate only the new multipliers (from startIndex to clusterIndex)
    for (let i = startIndex; i <= clusterIndex; i++) {
      gameResults.highlightedMultiplierIndex = i;
      drawGrid();
      
      // Wait before highlighting next multiplier
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    // Update startIndex for the next cluster (continue from where we left off)
    startIndex = clusterIndex + 1;
  }
}

// Animate individual hit (same style as keno random pick)
function animateHit(key) {
  const startTime = performance.now();
  const duration = 200; // Same duration as keno
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Create a "press down" effect: scale down to 0.9, then back to 1 (same as keno)
    let scale = 1;
    if (progress < 0.5) {
      // Scale down
      scale = 1 - (0.1 * (progress * 2));
    } else {
      // Scale back up
      scale = 0.9 + (0.1 * ((progress - 0.5) * 2));
    }
    
    hitAnimations.set(key, scale);
    drawGrid();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      hitAnimations.delete(key);
    }
  }
  
  requestAnimationFrame(animate);
}

// Function to show win message
function showWinMessage(multiplier, amount, currency) {
  // Safety check for undefined values
  if (multiplier === undefined || amount === undefined || currency === undefined) {
    console.warn('showWinMessage called with undefined values:', { multiplier, amount, currency });
    return;
  }
  
  // Get current bet amount to determine if it's a win or loss
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const isLoss = amount < betAmount;
  
  const winMessageDiv = document.querySelector('.win-message');
  if (winMessageDiv) {
    winMessageDiv.querySelector('.multiplier').textContent = multiplier.toFixed(2) + 'x';
    winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
    
    // Add loss class if win amount is less than bet amount
    if (isLoss) {
      winMessageDiv.classList.add('loss');
    } else {
      winMessageDiv.classList.remove('loss');
    }
    
    winMessageDiv.classList.add('visible');
  }
}

// Function to hide win message
function hideWinMessage() {
  const winMessageDiv = document.querySelector('.win-message');
  if (winMessageDiv) {
    winMessageDiv.classList.remove('visible');
  }
}






