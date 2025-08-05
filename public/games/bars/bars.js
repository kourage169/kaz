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

// Odds for each mode and number of selected bars //
const barsConfig = {
    // Easy Mode //
    easy: {
      chances: [0.35, 0.35, 0.15, 0.08, 0.05, 0.02], // always 6 items
      multipliers: {
        1: [0.40, 0.60, 1.20, 1.50, 3.00, 9.00],
        2: [0.20, 0.30, 0.60, 0.75, 1.50, 4.50],
        3: [0.13, 0.20, 0.40, 0.50, 1.00, 3.00],
        4: [0.10, 0.15, 0.30, 0.38, 0.75, 2.25],
        5: [0.08, 0.12, 0.24, 0.30, 0.60, 1.80],
      }
    },
  
    // Medium Mode //
    medium: {
      chances: [0.35, 0.35, 0.15, 0.10, 0.03, 0.015, 0.005], // always 7 items
      multipliers: {
        1: [0.30, 0.60, 1.20, 1.40, 3.00, 6.00, 33.00],
        2: [0.15, 0.30, 0.60, 0.70, 1.50, 3.00, 16.50],
        3: [0.10, 0.20, 0.40, 0.47, 1.00, 2.00, 11.00],
        4: [0.08, 0.15, 0.30, 0.35, 0.75, 1.50, 8.25],
        5: [0.06, 0.12, 0.24, 0.28, 0.60, 1.20, 6.60],
      }
    },
  
    // Hard Mode //
    hard: {
      chances: [0.47, 0.31, 0.12, 0.06, 0.03, 0.008, 0.0018, 0.0002], // always 8 items
      multipliers: {
        1: [0.10, 0.30, 1.20, 2.40, 6.00, 12.00, 75.00, 705.00],
        2: [0.05, 0.15, 0.60, 1.20, 3.00, 6.00, 37.50, 352.50],
        3: [0.03, 0.10, 0.40, 0.80, 2.00, 4.00, 25.00, 235.00],
        4: [0.03, 0.08, 0.30, 0.60, 1.50, 3.00, 18.75, 176.25],
        5: [0.02, 0.06, 0.24, 0.48, 1.20, 2.40, 15.00, 141.00],
      }
    },
  
    // Expert Mode //
    expert: {
      chances: [0.50, 0.40, 0.06, 0.025, 0.01, 0.004, 0.0008, 0.00015, 0.00005], // sums ~1.0
      multipliers: {
        1: [0.00, 0.20, 1.50, 6.00, 9.00, 30.00, 150.00, 1200.00, 3000.00],
        2: [0.00, 0.10, 0.75, 3.00, 4.50, 15.00, 75.00, 600.00, 1500.00],
        3: [0.00, 0.07, 0.50, 2.00, 3.00, 10.00, 50.00, 400.00, 1000.00],
        4: [0.00, 0.05, 0.38, 1.50, 2.25, 7.50, 37.50, 300.00, 750.00],
        5: [0.00, 0.04, 0.30, 1.20, 1.80, 6.00, 30.00, 240.00, 600.00],
      }
    },
}  

// ─── B) Bars Grid Setup ─────────────────────────────────────────────

const canvas = document.getElementById('barsCanvas');
const ctx = canvas.getContext('2d');

const GRID_ROWS = 6; // vertical
const GRID_COLS = 5; // horizontal
const GRID_PADDING_X = 15; // horizontal padding (left/right)
const GRID_PADDING_Y_TOP = 20; // top padding
const GRID_PADDING_Y_BOTTOM = 60; // bottom padding - much more to move bars up
const BAR_GAP_X = 10; // horizontal gap between bars
const BAR_GAP_Y = 14; // vertical gap between bars - increased for more spacing

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
    gapX: BAR_GAP_X * scaleFactor,
    gapY: BAR_GAP_Y * scaleFactor
  };
}

// Track selected bars (for now, just visual feedback)
let selectedBars = new Set();
let currentOpacity = 1;
let targetOpacity = 1;
let opacityAnimationId = null;
let clickAnimations = new Map(); // Track click animations for each bar
let barMultipliers = null; // Store multipliers from backend response
let isRevealingSelectedBars = false; // Track if we're in the reveal animation
let selectedBarRevealIndex = 0; // Track which selected bar to reveal next
let selectedBarKeys = []; // Store selected bar keys in order
let allMultipliersRevealed = false; // Track if all multipliers are shown
let revealedBars = new Set(); // Track which bars have been revealed
let multiplierAnimations = new Map(); // Track multiplier text scale animations
let multiplierAnimationsStarted = false; // Track if multiplier animations have been started

function animateClick(key) {
  const startTime = performance.now();
  const duration = 200; // 200ms animation (slightly longer)
  
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

function startSelectedBarReveal(winData = null) {
  if (selectedBars.size === 0 || !barMultipliers) return;
  
  isRevealingSelectedBars = true;
  selectedBarRevealIndex = 0;
  selectedBarKeys = Array.from(selectedBars);
  allMultipliersRevealed = false;
  multiplierAnimationsStarted = false; // Reset for new reveal sequence
  revealedBars.clear(); // Clear revealed bars
  
  // Start revealing selected bars one by one
  revealNextSelectedBar(winData);
}

function revealNextSelectedBar(winData = null) {
  if (selectedBarRevealIndex >= selectedBarKeys.length) {
    // All selected bars revealed, now show all multipliers
    allMultipliersRevealed = true;
    drawGrid();
    return;
  }
  
  const currentBarKey = selectedBarKeys[selectedBarRevealIndex];
  
  // Start the next bar animation immediately (don't wait for current to finish)
  selectedBarRevealIndex++;
  if (selectedBarRevealIndex < selectedBarKeys.length) {
    setTimeout(() => revealNextSelectedBar(winData), 400); // Start next bar after 300ms
  }
  
  // Animate flip effect for this bar
  animateBarFlip(currentBarKey, () => {
    // Mark this bar as revealed when flip completes
    revealedBars.add(currentBarKey);
    
    // Check if this was the last selected bar
    const isLastBar = selectedBarRevealIndex >= selectedBarKeys.length;
    
    if (isLastBar) {
      // This was the last selected bar, show all multipliers after flip animation completes
      setTimeout(() => {
        allMultipliersRevealed = true;
        
        // Start scale animations for all unselected bars (only once)
        if (!multiplierAnimationsStarted) {
          multiplierAnimationsStarted = true;
          for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
              const key = `${row},${col}`;
              if (!selectedBars.has(key)) {
                animateMultiplierText(key);
              }
            }
          }
        }
        
        drawGrid();
        
        // Update balance after all animations are complete
        if (winData) {
          updateBalanceFromServer(winData.currency, winData.newBalance);
        }
        
        // Re-enable buttons after all animations are complete
        setTimeout(() => {
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
        }, 300); // Wait for scale animations to complete
      }, 500); // Match the flip animation duration
    }
  });
}

function animateBarFlip(barKey, onComplete) {
  const startTime = performance.now();
  const duration = 1000; // Increased from 500ms to 700ms for slower animation
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Add more easing for smoother animation (cubic ease-in-out)
    const easedProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Create 3D flip effect: rotate around Y-axis
    const rotation = easedProgress * Math.PI; // 0 to π (180 degrees)
    
    // Store flip animation for this bar
    clickAnimations.set(barKey, { type: 'flip', rotation: rotation });
    drawGrid();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      clickAnimations.delete(barKey);
      onComplete();
    }
  }
  
  requestAnimationFrame(animate);
}

function animateMultiplierText(key) {
  const startTime = performance.now();
  const duration = 300; // Increased to 300ms to accommodate overshoot
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing: start slow, then accelerate (ease-out)
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    // Scale with overshoot: 0.3 -> 1.1 -> 1.0
    let scale;
    if (progress < 0.75) {
      // First 75%: scale up to 1.1 (overshoot)
      const overshootProgress = progress / 0.75;
      const easedOvershoot = 1 - Math.pow(1 - overshootProgress, 3);
      scale = 0.3 + (easedOvershoot * 0.8); // 0.3 to 1.1
    } else {
      // Last 25%: scale down from 1.1 to 1.0
      const settleProgress = (progress - 0.75) / 0.25;
      const easedSettle = 1 - Math.pow(1 - settleProgress, 2);
      scale = 1.1 - (easedSettle * 0.1); // 1.1 to 1.0
    }
    
    multiplierAnimations.set(key, scale);
    drawGrid();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      multiplierAnimations.delete(key);
    }
  }
  
  requestAnimationFrame(animate);
}

function updateOpacityTarget() {
  const isMaxSelected = selectedBars.size >= 5;
  const isGameInProgress = barMultipliers !== null;
  targetOpacity = (isMaxSelected || isGameInProgress) ? 0.4 : 1;
  
  if (opacityAnimationId === null) {
    opacityAnimationId = requestAnimationFrame(animateOpacity);
  }
}

function updatePlayButtonState() {
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    const hasValidSelection = selectedBars.size >= 1 && selectedBars.size <= 5;
    playBtn.disabled = !hasValidSelection;
    playBtn.style.opacity = hasValidSelection ? '1' : '0.5';
  }
}

function drawMessageArea() {
  const { barWidth, barHeight, responsive } = getBarSize();
  
  // Use the same responsive system as the bars table
  const messageY = responsive.paddingYTop + (GRID_ROWS * barHeight) + ((GRID_ROWS - 1) * responsive.gapY) + (responsive.paddingYTop * 0.8);
  const messageWidth = (GRID_COLS * barWidth) + ((GRID_COLS - 1) * responsive.gapX) + (responsive.paddingX * 0.8);
  const messageHeight = Math.max(35, Math.min(80, canvas.clientHeight * 0.08));
  const messageX = responsive.paddingX - (responsive.paddingX * 0.4);
  
  if (selectedBars.size === 0) {
    // No bars selected - show instruction message
    const messageText = "Select 1 - 5 bars to play";
    
    // Draw background
    ctx.save();
    ctx.fillStyle = '#2f4552';
    roundRect(ctx, messageX, messageY, messageWidth, messageHeight, 8);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(messageText, messageX + messageWidth / 2, messageY + messageHeight / 2);
    ctx.restore();
    
  } else {
    // Bars selected - show multipliers
    const difficulty = document.getElementById('difficulty')?.value || 'easy';
    const config = barsConfig[difficulty];
    
    if (config && config.multipliers[selectedBars.size]) {
      const multipliers = config.multipliers[selectedBars.size];
      
      // Calculate block dimensions to fit within the message area
      const blockCount = multipliers.length;
      const blockSpacing = Math.max(2, messageWidth * 0.005); // Reduced to 1% of message width
      const totalSpacing = (blockCount - 1) * blockSpacing;
      const availableWidth = messageWidth - totalSpacing;
      const blockWidth = availableWidth / blockCount;
      const blockHeight = messageHeight;
      
      // Responsive font size
      const fontSize = Math.max(12, Math.min(18, blockWidth / 8));
      
      for (let i = 0; i < multipliers.length; i++) {
        const multiplier = multipliers[i];
        const blockX = messageX + (i * (blockWidth + blockSpacing));
        
        // Draw background
        ctx.save();
        ctx.fillStyle = '#2f4552';
        roundRect(ctx, blockX, messageY, blockWidth, blockHeight, 6);
        ctx.fill();
        
        // Draw multiplier text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const multiplierText = multiplier >= 100 ? `${Math.round(multiplier)}x` : `${multiplier.toFixed(2)}x`;
        ctx.fillText(multiplierText, blockX + blockWidth / 2, messageY + blockHeight / 2);
        ctx.restore();
      }
    }
  }
}

function getBarSize() {
  const responsive = getResponsivePadding();
  
  // Calculate available space after padding
  const availableWidth = canvas.clientWidth - 2 * responsive.paddingX;
  const availableHeight = canvas.clientHeight - responsive.paddingYTop - responsive.paddingYBottom;
  
  // Calculate gaps needed for the grid
  const totalGapsX = GRID_COLS - 1;
  const totalGapsY = GRID_ROWS - 1;
  
  // Calculate bar size to fill available space
  const barWidth = (availableWidth - totalGapsX * responsive.gapX) / GRID_COLS;
  const barHeight = (availableHeight - totalGapsY * responsive.gapY) / GRID_ROWS;
  
  return { 
    barWidth: barWidth, 
    barHeight: barHeight,
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

// Helper: draw 3D shadow under bar
function drawBottomEdgeShadow(ctx, x, y, width, height, radius, shadowColor) {
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width, y + radius);
  ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
  ctx.lineTo(x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fillStyle = shadowColor;
  ctx.fill();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const { barWidth, barHeight, responsive } = getBarSize();
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = responsive.paddingX + col * (barWidth + responsive.gapX);
      const y = responsive.paddingYTop + row * (barHeight + responsive.gapY);
      const key = `${row},${col}`;
      
      // Apply click animation scaling
      const clickScale = clickAnimations.get(key) || 1;
      const centerX = x + barWidth / 2;
      const centerY = y + barHeight / 2;
      
      // Handle different animation types
      let isFlipping = false;
      let flipRotation = 0;
      
      if (typeof clickScale === 'object' && clickScale.type === 'flip') {
        isFlipping = true;
        flipRotation = clickScale.rotation;
      } else if (clickScale !== 1) {
        // Regular scale animation
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(clickScale, clickScale);
        ctx.translate(-centerX, -centerY);
      }
      
      // Apply opacity for unselected bars when 5 are selected or when game is in progress
      const isSelected = selectedBars.has(key);
      if (!isSelected && (selectedBars.size >= 5 || currentOpacity < 1 || barMultipliers !== null)) {
        ctx.globalAlpha = currentOpacity;
      }
      
      // Draw shadow (3D effect)
      const shadowWidth = barWidth * 1.07; // 10% wider
      const shadowHeight = barHeight * 1.12; // 20% taller
      const shadowX = x - (shadowWidth - barWidth) / 2; // Center the shadow
      const shadowY = y + 2; // Small y offset below the bar
      
      if (isFlipping) {
        // Apply 3D flip transformation
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, Math.abs(Math.cos(flipRotation))); // Scale Y based on rotation (vertical flip)
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.save();
      ctx.fillStyle = isSelected ? '#ff7e1d' : '#213742';
      roundRect(ctx, shadowX, shadowY, shadowWidth, shadowHeight, 6);
      ctx.fill();
      ctx.restore();
      
      // Draw bar
      ctx.save();
      ctx.fillStyle = isSelected ? '#ffc131' : '#2f4552';
      roundRect(ctx, x, y, barWidth, barHeight, 6);
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.restore();
      
      // Reset flip transformation
      if (isFlipping) {
        ctx.restore();
      }
      
      // Display multiplier if available
      if (barMultipliers) {
        const barIndex = row * 5 + col;
        const multiplier = barMultipliers[barIndex];
        
        if (multiplier > 0) {
          // Check if we should show this multiplier based on animation state
          let shouldShowMultiplier = false;
          
          if (allMultipliersRevealed) {
            // Show all multipliers after animation is complete
            shouldShowMultiplier = true;
          } else if (isRevealingSelectedBars) {
            // During reveal animation, only show multipliers for already revealed selected bars
            const isSelected = selectedBars.has(key);
            if (isSelected) {
              // Check if this bar has been revealed
              const isRevealed = revealedBars.has(key);
              
              // Check if this bar is currently flipping and almost done
              const flipAnimation = clickAnimations.get(key);
              const isFlipping = flipAnimation && flipAnimation.type === 'flip';
              const isAlmostDone = isFlipping && flipAnimation.rotation > Math.PI * 0.8; // 80% through flip
              
              shouldShowMultiplier = isRevealed || isAlmostDone;
            }
          }
          
          if (shouldShowMultiplier) {
            // Draw multiplier text
            ctx.save();
            
            // Check if this bar was selected
            const isSelected = selectedBars.has(key);
            ctx.fillStyle = isSelected ? '#000000' : '#ffffff'; // Black for selected, white for others
            
            // Responsive font size based on bar size
            const responsive = getResponsivePadding();
            const baseFontSize = Math.max(12, Math.min(barHeight * 0.35, 22)); // Responsive font size - increased
            ctx.font = `bold ${baseFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Format multiplier (e.g., 1.20x, 3.00x)
            const multiplierText = `${multiplier.toFixed(2)}x`;
            
            // Apply scale animation for unselected bars
            const scaleAnimation = multiplierAnimations.get(key);
            if (!isSelected && scaleAnimation !== undefined) {
              // Apply scale transformation
              const centerX = x + barWidth / 2;
              const centerY = y + barHeight / 2;
              ctx.translate(centerX, centerY);
              ctx.scale(scaleAnimation, scaleAnimation);
              ctx.translate(-centerX, -centerY);
            }
            
            // Draw text with shadow for better visibility
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 2;
            ctx.fillText(multiplierText, x + barWidth / 2, y + barHeight / 2);
            ctx.restore();
          }
        }
      }
      
      // Reset opacity and transform
      ctx.globalAlpha = 1;
      if (clickScale !== 1) {
        ctx.restore();
      }
    }
  }
  
  // Draw message area below the grid
  drawMessageArea();
}

// Handle selection
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  const { barWidth, barHeight, responsive } = getBarSize();
  
  // Calculate which bar was clicked
  const adjustedX = clickX - responsive.paddingX;
  const adjustedY = clickY - responsive.paddingYTop; // Adjusted for top padding
  const col = Math.floor(adjustedX / (barWidth + responsive.gapX));
  const row = Math.floor(adjustedY / (barHeight + responsive.gapY));
  
  if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
    const key = `${row},${col}`;
    
    // Trigger click animation
    animateClick(key);
    
    if (selectedBars.has(key)) {
      selectedBars.delete(key);
    } else {
      // Only allow selection if less than 5 bars are selected
      if (selectedBars.size < 5) {
        selectedBars.add(key);
      }
    }
    
    // Clear multipliers when bars are selected/unselected
    barMultipliers = null;
    allMultipliersRevealed = false;
    multiplierAnimations.clear();
    multiplierAnimationsStarted = false;
    
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
  // Disable play button during random pick animation
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.style.opacity = '0.5';
  }
  
  // Clear current selections
  selectedBars.clear();
  
  // Clear multipliers when using random pick
  barMultipliers = null;
  allMultipliersRevealed = false;
  multiplierAnimations.clear();
  multiplierAnimationsStarted = false;
  
  // Get all possible bar positions
  const allBars = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      allBars.push(`${row},${col}`);
    }
  }
  
  // Shuffle and pick 5 random bars
  const shuffled = allBars.sort(() => 0.5 - Math.random());
  const selectedIndices = shuffled.slice(0, 5);
  
  // Select bars one by one with animation
  let index = 0;
  function selectNext() {
    if (index < selectedIndices.length) {
      const key = selectedIndices[index];
      selectedBars.add(key);
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

// Clear table functionality
function clearTable() {
  selectedBars.clear();
  barMultipliers = null; // Clear multipliers
  isRevealingSelectedBars = false; // Reset animation state
  selectedBarRevealIndex = 0;
  selectedBarKeys = [];
  allMultipliersRevealed = false;
  revealedBars.clear(); // Clear revealed bars
  multiplierAnimations.clear(); // Clear multiplier animations
  multiplierAnimationsStarted = false; // Reset multiplier animations flag
  updateOpacityTarget();
  updatePlayButtonState();
  drawGrid();
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

// Add event listener for random pick button
document.addEventListener('DOMContentLoaded', () => {
  const randomPickBtn = document.getElementById('randomPickBtn');
  if (randomPickBtn) {
    randomPickBtn.addEventListener('click', randomPick);
  }
  
  const clearTableBtn = document.getElementById('clearTableBtn');
  if (clearTableBtn) {
    clearTableBtn.addEventListener('click', clearTable);
  }
  
  // Set initial play button state
  updatePlayButtonState();
  
  // Add difficulty change listener
  const difficultySelect = document.getElementById('difficulty');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', () => drawGrid());
  }
  
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
  
  // Add play button functionality
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      // Check if between 1 and 5 bars are selected
      if (selectedBars.size < 1 || selectedBars.size > 5) {
        alert('Please select between 1 and 5 bars to play');
        return;
      }
      
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
      
      // Convert selected bars to array
      const selectedBarsArray = Array.from(selectedBars);
      
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
        
        const response = await fetch('/games/bars/play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            betAmount,
            currency,
            difficulty,
            selectedBars: selectedBarsArray
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Handle successful play
          console.log('Play result:', data);
          
          // Store multipliers for display
          barMultipliers = data.allBarMultipliers;
          
          // Reset animation flags for new game
          multiplierAnimationsStarted = false;
          
                    // Store win data for later update after animations complete
          const winData = data.winAmount > 0 ? {
            currency: data.currency,
            newBalance: data.newBalance
          } : null;
          
          // Start reveal animation for selected bars AFTER getting server response
          updateOpacityTarget();
          drawGrid(); // Initial draw without multipliers
          startSelectedBarReveal(winData); // Start the reveal animation with win data
          
          // Note: Play button will be re-enabled when all animations complete
          
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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
