// helpers // 

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

// Keno multipliers (includes 0 hits)
const kenoMultipliers = {
  // Classic Risk Mode
  classic: {
    1:  [0.00, 3.96],
    2:  [0.00, 1.90, 4.50],
    3:  [0.00, 1.00, 3.10, 10.40],
    4:  [0.00, 0.80, 1.80, 5.00, 22.50],
    5:  [0.00, 0.25, 1.40, 4.10, 16.50, 36.00],
    6:  [0.00, 0.00, 1.00, 3.68, 7.00, 16.50, 40.00],
    7:  [0.00, 0.00, 0.47, 3.00, 4.50, 14.00, 31.00, 60.00],
    8:  [0.00, 0.00, 0.00, 2.20, 4.00, 13.00, 22.00, 55.00, 70.00],
    9:  [0.00, 0.00, 0.00, 1.55, 3.00, 8.00, 15.00, 44.00, 60.00, 85.00],
    10: [0.00, 0.00, 0.00, 1.40, 2.25, 4.50, 8.00, 17.00, 50.00, 80.00, 100.00]
  },
  
  // Low risk Mode
  low: {
      1:  [0.70, 1.85],
      2:  [0.00, 2.00, 3.80],
      3:  [0.00, 1.10, 1.38, 26.00],
      4:  [0.00, 0.00, 2.20, 7.90, 90.00],
      5:  [0.00, 0.00, 1.50, 4.20, 13.00, 300.00],
      6:  [0.00, 0.00, 1.10, 2.00, 6.20, 100.00, 700.00],
      7:  [0.00, 0.00, 1.10, 1.60, 3.50, 15.00, 225.00, 700.00],
      8:  [0.00, 0.00, 1.10, 1.50, 2.00, 5.50, 39.00, 100.00, 800.00],
      9:  [0.00, 0.00, 1.10, 1.30, 1.70, 2.50, 7.50, 50.00, 250.00, 1000.00],
      10: [0.00, 0.00, 1.10, 1.20, 1.30, 1.80, 3.50, 13.00, 50.00, 250.00, 1000.00]
    },

  // Medium Risk Mode
  medium: {
      1:  [0.40, 2.75],
      2:  [0.00, 1.80, 5.10],
      3:  [0.00, 0.00, 2.80, 50.00],
      4:  [0.00, 0.00, 1.70, 10.00, 100.00],
      5:  [0.00, 0.00, 1.40, 4.00, 14.00, 390.00],
      6:  [0.00, 0.00, 0.00, 3.00, 9.00, 180.00, 710.00],
      7:  [0.00, 0.00, 0.00, 2.00, 7.00, 30.00, 400.00, 800.00],
      8:  [0.00, 0.00, 0.00, 2.00, 4.00, 11.00, 67.00, 400.00, 900.00],
      9:  [0.00, 0.00, 0.00, 2.00, 2.50, 5.00, 15.00, 100.00, 500.00, 1000.00],
      10: [0.00, 0.00, 0.00, 1.60, 2.00, 4.00, 7.00, 26.00, 100.00, 500.00, 1000.00]
    },

  // High Risk Mode
  high: {
      1:  [0.00, 3.96],
      2:  [0.00, 0.00, 17.10],
      3:  [0.00, 0.00, 0.00, 81.50],
      4:  [0.00, 0.00, 0.00, 10.00, 259.00],
      5:  [0.00, 0.00, 0.00, 4.50, 48.00, 450.00],
      6:  [0.00, 0.00, 0.00, 0.00, 11.00, 350.00, 710.00],
      7:  [0.00, 0.00, 0.00, 0.00, 7.00, 90.00, 400.00, 800.00],
      8:  [0.00, 0.00, 0.00, 0.00, 5.00, 20.00, 270.00, 600.00, 900.00],
      9:  [0.00, 0.00, 0.00, 0.00, 4.00, 11.00, 56.00, 500.00, 800.00, 1000.00],
      10: [0.00, 0.00, 0.00, 0.00, 3.50, 8.00, 13.00, 63.00, 500.00, 800.00, 1000.00]
    },

};


// ─── B) Keno Grid Setup ─────────────────────────────────────────────

const canvas = document.getElementById('kenoCanvas');
const ctx = canvas.getContext('2d');

const GRID_ROWS = 5; // vertical
const GRID_COLS = 8; // horizontal
const GRID_PADDING_X = 10; // horizontal padding (left/right)
const GRID_PADDING_Y_TOP = 20; // top padding
const GRID_PADDING_Y_BOTTOM = 80; // bottom padding
const BLOCK_GAP_X = 4; // horizontal gap between blocks
const BLOCK_GAP_Y = 14; // vertical gap between blocks

// Responsive padding scaling
function getResponsivePadding() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Scale padding based on screen size
  let scaleFactor = 1;
  if (screenWidth > 1200) scaleFactor = 1.5; // Large screens
  if (screenWidth > 1600) scaleFactor = 2; // Extra large screens
  
  return {
    paddingX: GRID_PADDING_X * scaleFactor,
    paddingYTop: GRID_PADDING_Y_TOP * scaleFactor,
    paddingYBottom: GRID_PADDING_Y_BOTTOM * scaleFactor,
    gapX: BLOCK_GAP_X * scaleFactor,
    gapY: BLOCK_GAP_Y * scaleFactor
  };
}

// Track selected blocks
let selectedBlocks = new Set();
let currentOpacity = 1;
let targetOpacity = 1;
let opacityAnimationId = null;
let clickAnimations = new Map(); // Track click animations for each block
let gameResults = null; // Store game results from server
let selectedHits = []; // Store which selected blocks hit
let tenHits = []; // Store all 10 hits
let diamondImage = null; // Preload diamond image
let hitAnimations = new Map(); // Track hit animations for each block
let isAnimatingHits = false; // Track if we're currently animating hits

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
  const isMaxSelected = selectedBlocks.size >= 10; // Keno typically allows up to 10 selections
  targetOpacity = isMaxSelected ? 0.5 : 1;  // opacity for unselected blocks when max are selected
  
  if (opacityAnimationId === null) {
    opacityAnimationId = requestAnimationFrame(animateOpacity);
  }
}

function updatePlayButtonState() {
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    const hasValidSelection = selectedBlocks.size >= 1 && selectedBlocks.size <= 10;
    playBtn.disabled = !hasValidSelection;
    playBtn.style.opacity = hasValidSelection ? '1' : '0.5';
  }
}



function getBlockSize() {
  const responsive = getResponsivePadding();
  
  // Calculate available space after padding
  const availableWidth = canvas.clientWidth - 2 * responsive.paddingX;
  const availableHeight = canvas.clientHeight - responsive.paddingYTop - responsive.paddingYBottom;
  
  // Calculate gaps needed for the grid
  const totalGapsX = GRID_COLS - 1;
  const totalGapsY = GRID_ROWS - 1;
  
  // Calculate block size to fill available space
  const blockWidth = (availableWidth - totalGapsX * responsive.gapX) / GRID_COLS;
  const blockHeight = (availableHeight - totalGapsY * responsive.gapY) / GRID_ROWS;
  
  return { 
    blockWidth: blockWidth, 
    blockHeight: blockHeight,
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

function drawMessageArea() {
  const { blockWidth, blockHeight, responsive } = getBlockSize();
  
  // Use the same responsive system as the blocks table
  const messageY = responsive.paddingYTop + (GRID_ROWS * blockHeight) + ((GRID_ROWS - 1) * responsive.gapY) + (responsive.paddingYTop * 0.8);
  const messageWidth = (GRID_COLS * blockWidth) + ((GRID_COLS - 1) * responsive.gapX) + (responsive.paddingX * 0.8);
  const messageHeight = Math.max(28, Math.min(65, canvas.clientHeight * 0.065)); // Reduced height
  const messageX = responsive.paddingX - (responsive.paddingX * 0.4);
  
  if (selectedBlocks.size === 0) {
    // No blocks selected - show instruction message at the bottom
    const messageText = "Select 1 - 10 numbers to play";
    
    // Position the message at the bottom (same position as hit counts)
    const instructionY = messageY + Math.max(25, Math.min(50, canvas.clientHeight * 0.055)) + 5; // Same position as hit counts would be
    
    // Draw background
    ctx.save();
    ctx.fillStyle = '#2f4552';
    roundRect(ctx, messageX, instructionY, messageWidth, messageHeight, 8);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(messageText, messageX + messageWidth / 2, instructionY + messageHeight / 2);
    ctx.restore();
    
  } else {
    // Blocks selected - show multipliers on top and hit counts at bottom
    const hitCounts = selectedBlocks.size + 1; // Number of selected blocks + 1 (for 0 hits)
    const difficulty = document.getElementById('difficulty')?.value || 'classic';
    const multipliers = kenoMultipliers[difficulty]?.[selectedBlocks.size] || [];
    
    // Draw multipliers section at the top
    if (multipliers.length > 0) {
      const multiplierY = messageY; // Start at the top
      const multiplierHeight = Math.max(25, Math.min(50, canvas.clientHeight * 0.055)); // Reduced height
      
      // Draw multiplier section background
      ctx.save();
      // Removed the dark background - individual blocks will have their own backgrounds
      
      // Calculate multiplier block dimensions
      const multiplierBlockCount = multipliers.length;
      const multiplierBlockSpacing = Math.max(2, messageWidth * 0.005);
      const multiplierTotalSpacing = (multiplierBlockCount - 1) * multiplierBlockSpacing;
      const multiplierAvailableWidth = messageWidth - multiplierTotalSpacing;
      const multiplierBlockWidth = multiplierAvailableWidth / multiplierBlockCount;
      
      // Responsive font size for multipliers
      const multiplierFontSize = Math.max(9, Math.min(14, multiplierBlockWidth / 10));
      
      for (let i = 0; i < multipliers.length; i++) {
        const multiplier = multipliers[i];
        const multiplierBlockX = messageX + (i * (multiplierBlockWidth + multiplierBlockSpacing));
        
        // Check if this is the multiplier for the number of hits achieved (only after animations complete + delay)
        const isWinningMultiplier = gameResults && gameResults.hits === i && gameResults.showHighlights;
        
        // Determine background color based on multiplier value
        let backgroundColor = '#2f4552'; // Default color
        if (isWinningMultiplier) {
          backgroundColor = multiplier < 1.00 ? '#1a2c37' : '#00e53d'; // Dark for <1x, green for wins
        }
        
        // Draw multiplier background
        ctx.fillStyle = backgroundColor;
        roundRect(ctx, multiplierBlockX, multiplierY, multiplierBlockWidth, multiplierHeight, 6);
        ctx.fill();
        
        // Draw multiplier text
        let textColor = 'white'; // Default white text
        if (isWinningMultiplier) {
          textColor = multiplier < 1.00 ? 'white' : '#000000'; // White for <1x, black for wins
        }
        ctx.fillStyle = textColor;
        ctx.font = `bold ${multiplierFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Format multiplier (show as decimal for small values, whole numbers for large)
        const multiplierText = multiplier >= 10 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(2)}x`;
        ctx.fillText(multiplierText, multiplierBlockX + multiplierBlockWidth / 2, multiplierY + multiplierHeight / 2);
      }
      ctx.restore();
    }
    
    // Draw hit counts section at the bottom
    const hitCountsY = messageY + (multipliers.length > 0 ? Math.max(25, Math.min(50, canvas.clientHeight * 0.055)) + 5 : 0); // 5px gap below multipliers
    const hitCountsHeight = Math.max(28, Math.min(65, canvas.clientHeight * 0.065)); // Reduced height
    
    // Calculate block dimensions to fit within the message area
    const blockCount = hitCounts;
    const blockSpacing = Math.max(2, messageWidth * 0.005); // Reduced to 0.5% of message width
    const totalSpacing = (blockCount - 1) * blockSpacing;
    const availableWidth = messageWidth - totalSpacing;
    const blockWidth = availableWidth / blockCount;
    const blockHeight = hitCountsHeight;
    
    // Responsive font size
    const fontSize = Math.max(10, Math.min(16, blockWidth / 8));
    
    for (let i = 0; i < hitCounts; i++) {
      const hitCount = i; // 0, 1, 2, 3, etc.
      const blockX = messageX + (i * (blockWidth + blockSpacing));
      
      // Check if this is the hit count that was achieved (only after animations complete + delay)
      const isAchievedHitCount = gameResults && gameResults.hits === hitCount && gameResults.showHighlights;
      
      // Draw background
      ctx.save();
      ctx.fillStyle = '#2f4552';
      roundRect(ctx, blockX, hitCountsY, blockWidth, blockHeight, 6);
      ctx.fill();
      
      // Draw blue border if this is the achieved hit count
      if (isAchievedHitCount) {
        ctx.strokeStyle = '#0082f5';
        ctx.lineWidth = 2;
        roundRect(ctx, blockX, hitCountsY, blockWidth, blockHeight, 6);
        ctx.stroke();
      }
      
      // Calculate positions for text and diamond
      const textY = hitCountsY + hitCountsHeight / 2;
      const hitCountText = `${hitCount}x`;
      
      // Draw hit count text
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'left'; // Use left alignment for precise positioning
      ctx.textBaseline = 'middle';
      
      // Measure text width AFTER setting the font
      const textWidth = ctx.measureText(hitCountText).width;
      const diamondSize = fontSize * 0.85; // Responsive diamond size based on font size
      const spacing = 2; // Space between text and diamond
      const totalWidth = textWidth + spacing + diamondSize;
      
      // Calculate the starting position to center the entire unit
      const unitStartX = blockX + (blockWidth - totalWidth) / 2;
      
      // Draw text first
      ctx.fillText(hitCountText, unitStartX, textY);
      
      // Draw diamond image if loaded (after text)
      if (diamondImage && diamondImage.complete) {
        const diamondX = unitStartX + textWidth + spacing;
        const diamondY = textY - diamondSize / 2;
        
        // Draw diamond image
        ctx.drawImage(diamondImage, diamondX, diamondY, diamondSize, diamondSize);
      }
      ctx.restore();
    }
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const { blockWidth, blockHeight, responsive } = getBlockSize();
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = responsive.paddingX + col * (blockWidth + responsive.gapX);
      const y = responsive.paddingYTop + row * (blockHeight + responsive.gapY);
      const key = `${row},${col}`;
      
      // Apply click animation scaling
      const clickScale = clickAnimations.get(key) || 1;
      const centerX = x + blockWidth / 2;
      const centerY = y + blockHeight / 2;
      
      // Apply hit animation scaling
      const hitAnimation = hitAnimations.get(key);
      let hitScale = 1;
      let isHitAnimating = false;
      
      if (hitAnimation) {
        hitScale = hitAnimation.scale;
        isHitAnimating = true;
      }
      
      // Apply opacity for unselected blocks when max are selected
      const isSelected = selectedBlocks.has(key);
      if (!isSelected && (selectedBlocks.size >= 10 || currentOpacity < 1)) {
        ctx.globalAlpha = currentOpacity;
      }
      
      // Calculate block number first
      const blockNumber = row * GRID_COLS + col + 1; // Numbers 1-40
      
      // Draw reveal block (hidden beneath) - always there for all blocks, NEVER animated
      ctx.save();
      ctx.fillStyle = '#071823';
      roundRect(ctx, x, y, blockWidth, blockHeight, 6);
      ctx.fill();
      
      // Draw top shadow inside reveal block
      ctx.fillStyle = '#001017';
      // Create shadow at perfect top with full width coverage
      const topShadowHeight = blockHeight * 0.12; // Shadow covers top 15% of block (reduced height)
      roundRect(ctx, x, y, blockWidth, topShadowHeight, 6); // Full width, no gaps, same radius as block
      ctx.fill();
      ctx.restore();
      
      // Draw shadow and block
      const isHit = tenHits.includes(blockNumber);
      const isBlockAnimating = hitAnimations.has(key);
      
      // For unselected hits: show block during animation, hide after
      // For selected hits: always show block
      // For non-hits: always show block
      const isUnselectedHit = isHit && !isSelected;
      const shouldDrawBlock = !isUnselectedHit || isBlockAnimating || (hitAnimation && hitAnimation.type === 'unselected');
      
      if (shouldDrawBlock) {
        // Apply transformations ONLY to the blocks (shadow + main block)
        if (clickScale !== 1 || isBlockAnimating) {
          ctx.save();
          ctx.translate(centerX, centerY);
          if (clickScale !== 1) {
            ctx.scale(clickScale, clickScale);
          }
          if (isBlockAnimating) {
            ctx.scale(hitScale, hitScale);
          }
          ctx.translate(-centerX, -centerY);
        }
        
        const shadowWidth = blockWidth * 1; // 7% wider
        const shadowHeight = blockHeight * 1.08; // 12% taller
        const shadowX = x - (shadowWidth - blockWidth) / 2; // Center the shadow
        const shadowY = y + 2; // Small y offset below the block
        
        // Draw shadow
        ctx.save();
        ctx.fillStyle = isSelected ? '#0e60b0' : '#213742';
        roundRect(ctx, shadowX, shadowY, shadowWidth, shadowHeight, 6);
        ctx.fill();
        ctx.restore();
        
        // Draw block
        ctx.save();
        ctx.fillStyle = isSelected ? '#017ffa' : '#2f4552';
        roundRect(ctx, x, y, blockWidth, blockHeight, 6);
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.restore();
        
        // Reset transformations for blocks
        if (clickScale !== 1 || isBlockAnimating) {
          ctx.restore();
        }
      }
      
      // Draw number on block
      ctx.save();
      
      // Check if this selected block hit and animation is running/completed
      const isSelectedHit = isSelected && selectedHits.includes(key);
      const isSelectedHitAnimating = hitAnimation && hitAnimation.type === 'selected';
      
      // Only draw number if block should be visible
      const shouldDrawNumber = !isUnselectedHit || isBlockAnimating || (hitAnimation && hitAnimation.type === 'unselected');
      
      if (isSelectedHit && gameResults && isSelectedHitAnimating) {
        // Draw square background for selected hits (bigger)
        const squareSize = Math.min(blockWidth, blockHeight) * 0.85;
        const squareX = x + (blockWidth - squareSize) / 2;
        const squareY = y + (blockHeight - squareSize) / 2;
        
        // Draw square background
        ctx.fillStyle = '#071823';
        ctx.fillRect(squareX, squareY, squareSize, squareSize);
        
        // Draw green diamond image if loaded
        if (diamondImage && diamondImage.complete) {
          const diamondSize = squareSize * 0.85;
          const diamondX = x + (blockWidth - diamondSize) / 2;
          const diamondY = y + (blockHeight - diamondSize) / 2;
          ctx.drawImage(diamondImage, diamondX, diamondY, diamondSize, diamondSize);
        }
        
        // Draw number in center of diamond
        ctx.fillStyle = '#139533';
      } else if ((isHit && shouldDrawNumber) || isBlockAnimating) {
        // Revealed blocks (hits) - change text color to red immediately when animation starts
        ctx.fillStyle = '#ea183a';
      } else if (shouldDrawNumber) {
        ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
      }
      
      // Responsive font size based on screen size and block size
      const screenWidth = window.innerWidth;
      let fontSizeMultiplier = 0.35; // Base multiplier (reduced from 0.4)
      let maxFontSize = 20; // Base max font size (reduced from 24)
      
      // Increase font size for larger screens
      if (screenWidth > 1200) {
        fontSizeMultiplier = 0.35; // Large screens (reduced from 0.38)
        maxFontSize = 22; // (reduced from 24)
      }
      if (screenWidth > 1600) {
        fontSizeMultiplier = 0.45; // Extra large screens (reduced from 0.48)
        maxFontSize = 30; // (reduced from 32)
      }
      if (screenWidth > 2000) {
        fontSizeMultiplier = 0.55; // Very large screens (reduced from 0.58)
        maxFontSize = 38; // (reduced from 40)
      }
      
      const fontSize = Math.max(12, Math.min(blockHeight * fontSizeMultiplier, maxFontSize));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Add slight vertical adjustment for better visual centering
      const textY = y + blockHeight / 2 + 2; // +1px for better visual centering
      ctx.fillText(blockNumber.toString(), x + blockWidth / 2, textY);
      ctx.restore();
      
      // Reset transformations
      if (clickScale !== 1 || isBlockAnimating) {
        ctx.restore();
      }
      
      // Reset opacity
      ctx.globalAlpha = 1;
    }
  }
  
  // Draw message area below the grid
  drawMessageArea();
}

// Handle selection
canvas.addEventListener('click', (e) => {
  // If win message is visible, only hide it and don't process block selection
  if (winMessageDiv.classList.contains('visible')) {
    hideWinMessage();
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  const { blockWidth, blockHeight, responsive } = getBlockSize();
  
  // Calculate which block was clicked
  const adjustedX = clickX - responsive.paddingX;
  const adjustedY = clickY - responsive.paddingYTop;
  const col = Math.floor(adjustedX / (blockWidth + responsive.gapX));
  const row = Math.floor(adjustedY / (blockHeight + responsive.gapY));
  
  if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
    const key = `${row},${col}`;
    
    // Reset previous game state when selecting/unselecting blocks
    tenHits = [];
    hitAnimations.clear();
    gameResults = null;
    selectedHits = [];
    
    // Trigger click animation
    animateClick(key);
    
    if (selectedBlocks.has(key)) {
      selectedBlocks.delete(key);
    } else {
      // Only allow selection if less than 10 blocks are selected
      if (selectedBlocks.size < 10) {
        selectedBlocks.add(key);
      }
    }
    
    updateOpacityTarget();
    updatePlayButtonState();
    drawGrid();
  }
});

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

// Random pick functionality
function randomPick() {
  // Reset previous game state
  tenHits = [];
  hitAnimations.clear();
  gameResults = null;
  selectedHits = [];
  
  // Disable play button during random pick animation
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.style.opacity = '0.5';
  }
  
  // Clear current selections
  selectedBlocks.clear();
  
  // Get all possible block positions
  const allBlocks = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      allBlocks.push(`${row},${col}`);
    }
  }
  
  // Shuffle and pick 10 random blocks
  const shuffled = allBlocks.sort(() => 0.5 - Math.random());
  const selectedIndices = shuffled.slice(0, 10);
  
  // Select blocks one by one with animation
  let index = 0;
  function selectNext() {
    if (index < selectedIndices.length) {
      const key = selectedIndices[index];
      selectedBlocks.add(key);
      animateClick(key);
      updateOpacityTarget();
      drawGrid();
      index++;
      setTimeout(selectNext, 150); // 150ms delay between selections
    } else {
      // Animation complete, update play button state
      updatePlayButtonState();
    }
  }
  
  selectNext();
}

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

// Clear table functionality
function clearTable() {
  selectedBlocks.clear();
  gameResults = null;
  selectedHits = [];
  tenHits = [];
  hitAnimations.clear();
  isAnimatingHits = false;
  updateOpacityTarget();
  updatePlayButtonState();
  drawGrid();
}

// Preload diamond image
function preloadDiamondImage() {
  diamondImage = new Image();
  diamondImage.onload = () => {
    console.log('Diamond image loaded successfully');
  };
  diamondImage.onerror = () => {
    console.error('Failed to load diamond image');
  };
  diamondImage.src = '/games/keno/keno-diamond.svg';
}

// Add win message container to game container after canvas
const gameContainer = document.querySelector('.game-container');
const winMessageDiv = document.createElement('div');
winMessageDiv.className = 'win-message';
winMessageDiv.innerHTML = `
  <div class="multiplier">1.00x</div>
  <div class="amount">$0.00</div>
`;
gameContainer.appendChild(winMessageDiv);

// Function to show win message
function showWinMessage(multiplier, amount, currency) {
  // Get current bet amount to determine if it's a win or loss
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const isLoss = amount < betAmount;
  
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

// Function to hide win message
function hideWinMessage() {
  winMessageDiv.classList.remove('visible');
}

// Add event listener for random pick button
document.addEventListener('DOMContentLoaded', () => {
  // Preload diamond image
  preloadDiamondImage();
  
  const randomPickBtn = document.getElementById('randomPickBtn');
  if (randomPickBtn) {
    randomPickBtn.addEventListener('click', () => {
      hideWinMessage();
      randomPick();
    });
  }
  
  const clearTableBtn = document.getElementById('clearTableBtn');
  if (clearTableBtn) {
    clearTableBtn.addEventListener('click', () => {
      hideWinMessage();
      clearTable();
    });
  }
  
  // Set initial play button state
  updatePlayButtonState();
  
  // Initialize currency synchronization
  syncCurrencySelections();
  
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
  
  // Add difficulty change event listener to update multipliers
  const difficultySelect = document.getElementById('difficulty');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', () => {
      // Clear previous game state when changing difficulty
      tenHits = [];
      hitAnimations.clear();
      gameResults = null;
      
      // Hide win message if visible
      hideWinMessage();
      
      // Redraw the grid to update the multipliers section and clear any highlights
      drawGrid();
    });
  }
  
  // Add play button functionality
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      // Hide win message when starting new game
      hideWinMessage();
      // Check if between 1 and 10 blocks are selected
      if (selectedBlocks.size < 1 || selectedBlocks.size > 10) {
        alert('Please select between 1 and 10 numbers to play');
        return;
      }
      
      // Reset previous game state before starting new game
      tenHits = [];
      hitAnimations.clear();
      gameResults = null;
      selectedHits = [];
      drawGrid(); // Redraw to show all blocks again
      
      // Get bet amount and currency
      const betAmount = parseFloat(document.getElementById('betAmount').value);
      const currency = document.getElementById('currency').value;
      const difficulty = document.getElementById('difficulty').value;
      
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
      
      // Check if user has enough balance (visual check)
      const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
      const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
      const selectedBalance = document.getElementById('selected-balance');
      
      let currentBalance = 0;
      if (currency === 'USD' && usdDropdownItem) {
        const amountLabel = usdDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
          // Handle different possible formats: "$100.00" or "100.00"
          const balanceText = amountLabel.textContent.trim();
          currentBalance = parseFloat(balanceText.replace(/[$,]/g, ''));
        }
      } else if (currency === 'LBP' && lbpDropdownItem) {
        const amountLabel = lbpDropdownItem.querySelector('.amount-label');
        if (amountLabel) {
          // Handle different possible formats: "£100,000" or "100000"
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
      
      // Convert selected blocks to array
      const selectedBlocksArray = Array.from(selectedBlocks);
      
      try {
        // Disable buttons during request
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
        
        const randomPickBtn = document.getElementById('randomPickBtn');
        const clearTableBtn = document.getElementById('clearTableBtn');
        if (randomPickBtn) {
          randomPickBtn.disabled = true;
          randomPickBtn.style.opacity = '0.5';
        }
        if (clearTableBtn) {
          clearTableBtn.disabled = true;
          clearTableBtn.style.opacity = '0.5';
        }
        
        const response = await fetch('/games/keno/play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            betAmount,
            currency,
            difficulty,
            selectedNumbers: selectedBlocksArray
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Handle successful play
          console.log('Keno play result:', data);
          
          // Store game results for display
          gameResults = data;
          selectedHits = data.selectedHits || [];
          
          // Update balance from server response if there was a win
          if (data.winAmount > 0) {
            updateBalanceFromServer(data.currency, data.newBalance);
            // Store win data for delayed win message
            data.showWinMessage = true;
            data.winMultiplier = data.multiplier;
            data.winAmount = data.winAmount;
            data.winCurrency = data.currency;
          }
          
          console.log(`Hits: ${data.hits}, Multiplier: ${data.multiplier}, Win Amount: ${data.winAmount}`);
          console.log(`Selected hits:`, selectedHits);
          console.log(`All hits:`, data.tenHits || []);
          
          // Start hit animations with the hits data
          animateAllHits(data.tenHits || []).then(() => {
            // Set tenHits after animations complete
            tenHits = data.tenHits || [];
            
            // Re-enable buttons after animations complete
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
            if (randomPickBtn) {
              randomPickBtn.disabled = false;
              randomPickBtn.style.opacity = '1';
            }
            if (clearTableBtn) {
              clearTableBtn.disabled = false;
              clearTableBtn.style.opacity = '1';
            }
          });
          
        } else {
          // Revert the visual balance deduction on error
          updateBalanceDisplay(currency, betAmount);
          alert(data.error || 'Failed to play game');
          // Re-enable buttons on error
          playBtn.disabled = false;
          playBtn.style.opacity = '1';
          const randomPickBtn = document.getElementById('randomPickBtn');
          const clearTableBtn = document.getElementById('clearTableBtn');
          if (randomPickBtn) {
            randomPickBtn.disabled = false;
            randomPickBtn.style.opacity = '1';
          }
          if (clearTableBtn) {
            clearTableBtn.disabled = false;
            clearTableBtn.style.opacity = '1';
          }
        }
        
      } catch (error) {
        console.error('Error playing game:', error);
        // Revert the visual balance deduction on error
        updateBalanceDisplay(currency, betAmount);
        alert('Error playing game. Please try again.');
        // Re-enable buttons on error
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        const randomPickBtn = document.getElementById('randomPickBtn');
        const clearTableBtn = document.getElementById('clearTableBtn');
        if (randomPickBtn) {
          randomPickBtn.disabled = false;
          randomPickBtn.style.opacity = '1';
        }
        if (clearTableBtn) {
          clearTableBtn.disabled = false;
          clearTableBtn.style.opacity = '1';
        }
      }
    });
  }
});

// Function to animate hit for unselected blocks (scale down and remove)
function animateUnselectedHit(key) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const duration = 400; // 400ms animation (faster)
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Scale down from 1 to 0
      const scale = 1 - progress;
      
      hitAnimations.set(key, { scale, type: 'unselected' });
      drawGrid();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Keep the animation with scale 0 to hide the block
        hitAnimations.set(key, { scale: 0, type: 'unselected' });
        drawGrid();
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}

// Function to animate hit for selected blocks (show diamond)
function animateSelectedHit(key) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const duration = 350; // 350ms animation (faster)
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Scale up effect: start at 0.8, go to 1.2, then settle at 1
      let scale = 1;
      if (progress < 0.3) {
        // Scale up to 1.2
        scale = 0.8 + (0.4 * (progress / 0.3));
      } else if (progress < 0.7) {
        // Hold at 1.2
        scale = 1.2;
      } else {
        // Scale back to 1
        scale = 1.2 - (0.2 * ((progress - 0.7) / 0.3));
      }
      
      hitAnimations.set(key, { scale, type: 'selected' });
      drawGrid();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Keep the animation for selected hits (don't remove)
        hitAnimations.set(key, { scale: 1, type: 'selected' });
        drawGrid();
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}

// Function to animate all hits one by one
async function animateAllHits(hitsData) {
  if (isAnimatingHits) return; // Prevent multiple animations
  isAnimatingHits = true;
  
  // Convert selected blocks to array for easier lookup
  const selectedBlocksArray = Array.from(selectedBlocks);
  
  // Animate each hit with cascading effect
  for (let i = 0; i < hitsData.length; i++) {
    const hitNumber = hitsData[i];
    const row = Math.floor((hitNumber - 1) / GRID_COLS);
    const col = (hitNumber - 1) % GRID_COLS;
    const key = `${row},${col}`;
    
    // Check if this hit is on a selected block
    const isSelectedHit = selectedBlocksArray.includes(key);
    
    // Start animation immediately for cascading effect
    if (isSelectedHit) {
      // Animate selected hit (show diamond)
      animateSelectedHit(key);
    } else {
      // Animate unselected hit (scale down and remove)
      animateUnselectedHit(key);
    }
    
    // Small delay before starting next animation
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  
  isAnimatingHits = false;
  
  // Set timeout to show highlights after 400ms delay
  if (gameResults) {
    setTimeout(() => {
      gameResults.showHighlights = true;
      drawGrid(); // Redraw to show highlights
    }, 200);
    
    // Show win message after 300ms delay if there was a win
    if (gameResults.showWinMessage) {
      setTimeout(() => {
        showWinMessage(gameResults.winMultiplier, gameResults.winAmount, gameResults.winCurrency);
      }, 300);
    }
  }
}