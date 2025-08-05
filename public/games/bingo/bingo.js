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
  
  // ─── B) Game State Variables ─────────────────────────────────────────────
  
  // Track game state
  let isPlaying = false;
  let currentBet = 0;
  let currentCurrency = 'USD';
  let serverNumbers = []; // Numbers from server
  let markedNumbers = []; // Numbers that should be marked
  let completedLines = []; // Track completed lines for special animation
  let isAnimatingLines = false; // Track if we're animating line completion
  let animatingLineTiles = new Set(); // Track which tiles are part of winning lines during animation

// ─── B) Bingo Grid Setup ─────────────────────────────────────────────

// Grid configuration constants
const GRID_ROWS = 5; // vertical
const GRID_COLS = 5; // horizontal
const GRID_PADDING_X = 15; // horizontal padding (left/right) - reduced from 35
const GRID_PADDING_Y_TOP = 15; // top padding - reduced from 50
const GRID_PADDING_Y_BOTTOM = 50; // bottom padding - reduced from 110
const TILE_GAP_X = 8; // horizontal gap between tiles
const TILE_GAP_Y = 14; // vertical gap between tiles

// Get canvas and context
const canvas = document.getElementById('bingoCanvas');
const ctx = canvas.getContext('2d');

// Track selected tiles
let selectedTiles = new Set(['2,2']); // Only center tile is always selected (row 2, col 2 = position 12)
let currentOpacity = 1;
let targetOpacity = 1;
let opacityAnimationId = null;
let clickAnimations = new Map(); // Track click animations for each tile

// Track tile numbers (24 tiles excluding center)
let tileNumbers = new Map(); // Maps tile key to number

// Generate random numbers for tiles (1-70, excluding center tile)
function generateRandomNumbers() {
  tileNumbers.clear();
  const usedNumbers = new Set();
  
  // Clear marked tiles (except center tile)
  selectedTiles.clear();
  selectedTiles.add('2,2'); // Keep center tile selected
  
  // Generate 24 unique random numbers (excluding center tile)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${row},${col}`;
      
      // Skip center tile (2,2)
      if (key === '2,2') continue;
      
      // Generate unique random number between 1 and 70
      let randomNum;
      do {
        randomNum = Math.floor(Math.random() * 70) + 1;
      } while (usedNumbers.has(randomNum));
      
      usedNumbers.add(randomNum);
      tileNumbers.set(key, randomNum);
    }
  }
  
  // Redraw grid to show new numbers and cleared markings
  drawGrid();
}

// Initialize with random numbers
generateRandomNumbers();

// Responsive padding function
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
    gapX: TILE_GAP_X * scaleFactor,
    gapY: TILE_GAP_Y * scaleFactor
  };
}

// Get tile size based on responsive padding
function getTileSize() {
  const responsive = getResponsivePadding();
  
  // Account for container padding - separate X padding
  const containerPadding = 50; // For top and bottom
  const containerPaddingX = 30; // Separate padding for X direction
  
  // Calculate available space after padding (including container padding)
  const availableWidth = canvas.clientWidth - 2 * (responsive.paddingX + containerPaddingX);
  const availableHeight = canvas.clientHeight - (responsive.paddingYTop + containerPadding) - (responsive.paddingYBottom + containerPadding);
  
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
    responsive: responsive,
    containerPadding: containerPadding,
    containerPaddingX: containerPaddingX
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

// Click animation function
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

// Opacity animation function
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

// Draw the bingo grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const { tileWidth, tileHeight, responsive, containerPadding, containerPaddingX } = getTileSize();
  
  // Draw background container
  const containerX = containerPaddingX;
  const containerY = containerPadding;
  const containerWidth = canvas.clientWidth - 2 * containerPaddingX;
  const containerHeight = canvas.clientHeight - 2 * containerPadding + 5;
  
  // Draw background container with rounded corners
  ctx.save();
  ctx.fillStyle = '#0f212d';
  ctx.strokeStyle = '#2f4552';
  ctx.lineWidth = 6; // Increased from 2 to 4 for thicker border
  roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 15);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // Adjust grid padding to account for container padding
  const adjustedPaddingX = responsive.paddingX + containerPaddingX;
  const adjustedPaddingYTop = responsive.paddingYTop + containerPadding;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = adjustedPaddingX + col * (tileWidth + responsive.gapX);
      const y = adjustedPaddingYTop + row * (tileHeight + responsive.gapY);
      const key = `${row},${col}`;
      
      // Apply click animation scaling
      const clickScale = clickAnimations.get(key) || 1;
      const centerX = x + tileWidth / 2;
      const centerY = y + tileHeight / 2;
      
      if (clickScale !== 1) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(clickScale, clickScale);
        ctx.translate(-centerX, -centerY);
      }
      
      // Apply opacity for unselected tiles when some are selected
      const isSelected = selectedTiles.has(key);
      if (!isSelected && selectedTiles.size > 0) {
        ctx.globalAlpha = currentOpacity;
      }
      
      // Draw shadow (3D effect)
      const shadowWidth = tileWidth * 1.07; // 7% wider
      const shadowHeight = tileHeight * 1.08; // 12% taller
      const shadowX = x - (shadowWidth - tileWidth) / 2; // Center the shadow
      const shadowY = y + 2; // Small y offset below the tile
      
      ctx.save();
      // Use special color for completed line tiles during animation
      const isLineTile = isAnimatingLines && animatingLineTiles.has(key);
      ctx.fillStyle = isSelected ? (isLineTile ? '#ec1679' : '#ff7e1d') : '#213742';
      roundRect(ctx, shadowX, shadowY, shadowWidth, shadowHeight, 6);
      ctx.fill();
      ctx.restore();
      
      // Draw tile
      ctx.save();
      ctx.fillStyle = isSelected ? '#ffc131' : '#2f4552';
      roundRect(ctx, x, y, tileWidth, tileHeight, 6);
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.restore();
      
      // Draw star on selected tiles
      if (isSelected) {
        ctx.save();
        ctx.fillStyle = isLineTile ? '#ec1679' : '#ff7e1d';
        ctx.font = 'bold 2rem Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x + tileWidth / 2, y + tileHeight / 2);
        ctx.restore();
      }
      
      // Draw number on non-center tiles
      if (key !== '2,2' && tileNumbers.has(key) && !isSelected) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 1.2rem Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tileNumbers.get(key).toString(), x + tileWidth / 2, y + tileHeight / 2);
        ctx.restore();
      }
      
      // Reset opacity and transform
      ctx.globalAlpha = 1;
      if (clickScale !== 1) {
        ctx.restore();
      }
    }
  }
  
  // Draw "BINGO" text below the grid
  ctx.save();
  
  // Draw background rectangle for BINGO text
  const textBgHeight = 38;
  const textBgY = containerY + containerHeight - textBgHeight - 2;  // Removed the -5 gap
  ctx.fillStyle = '#2f4552';
  ctx.fillRect(containerX, textBgY, containerWidth, textBgHeight);
  
  // Draw BINGO text
  ctx.fillStyle = '#8fa3b0'; // Changed from #4caf50 to white
  ctx.font = 'bold 1.2rem Arial'; // Reduced from 2rem to 1.5rem
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.globalAlpha = 0.6;
  
  // Position text at the bottom of the container
  const textY = containerY + containerHeight - 18; // Reduced from 40 to 25 to move down
  ctx.fillText('★ ★ ★ BINGO ★ ★ ★', canvas.clientWidth / 2, textY);
  ctx.restore();
}

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

// Initialize the grid
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Function to handle random button click (includes win message hiding)
function handleRandomButtonClick() {
  // Hide win message when generating new numbers
  hideWinMessage();
  // Generate new random numbers
  generateRandomNumbers();
}

// Connect random button to generate new numbers
document.getElementById('randomBtn').addEventListener('click', handleRandomButtonClick);

// ─── C) Play Functionality ─────────────────────────────────────────────

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

// Get bet limits based on currency
function getBetLimits(currency) {
  return currency === 'USD' 
    ? { min: 0.10, max: 1000 }
    : { min: 10000, max: 100000000 };
}

// Validate bet amount
function validateBet(amount, currency) {
  const limits = getBetLimits(currency);
  if (amount < limits.min || amount > limits.max) {
    return { valid: false, error: `Bet must be between ${formatCurrencyAmount(limits.min, currency)} and ${formatCurrencyAmount(limits.max, currency)}` };
  }
  return { valid: true };
}

// Play bingo game
async function playBingo() {
  if (isPlaying) {
    console.log('Game already in progress!');
    return;
  }

  // Get bet amount and currency
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const currency = document.getElementById('currency').value;

  // Validate bet
  const validation = validateBet(betAmount, currency);
  if (!validation.valid) {
    console.log(validation.error);
    return;
  }

  // Check if user has enough funds before starting
  const currentBalance = getCurrentBalance(currency);
  if (currentBalance < betAmount) {
    console.log(`Insufficient funds. You have ${formatCurrencyAmount(currentBalance, currency)} but need ${formatCurrencyAmount(betAmount, currency)}.`);
    return;
  }

  // Get current tile numbers
  const tileNumbersArray = Array.from(tileNumbers.values());

  try {
    isPlaying = true;
    const playBtn = document.getElementById('playBtn');
    const randomBtn = document.getElementById('randomBtn');
    const betAmountInput = document.getElementById('betAmount');
    const currencySelect = document.getElementById('currency');
    
    // Disable play and random buttons
    playBtn.disabled = true;
    playBtn.textContent = 'Playing...';
    playBtn.style.opacity = '0.5'; // Lower opacity by 50%
    randomBtn.disabled = true;
    randomBtn.style.opacity = '0.5'; // Lower opacity by 50%
    
    // Disable bet amount and currency controls
    betAmountInput.disabled = true;
    currencySelect.disabled = true;
    currencySelect.style.opacity = '0.5'; // Lower opacity for currency select

    // Hide win message when starting new game
    hideWinMessage();

    // Deduct bet amount visually before starting
    updateBalanceDisplay(currency, -betAmount);

    const response = await fetch('/games/bingo/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        betAmount: betAmount,
        currency: currency,
        tileNumbers: tileNumbersArray
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to play bingo');
    }

    const data = await response.json();
    
    // Store server data
    serverNumbers = data.numbers;
    markedNumbers = data.markedNumbers;
    completedLines = data.completedLines || []; // Store completed lines from backend
    currentBet = betAmount;
    currentCurrency = currency;
    
    // Store game data globally for balance update after animations
    window.lastGameData = {
      currency: data.currency,
      newBalance: data.newBalance,
      winAmount: data.winAmount
    };

    // Display numbers in the table one by one
    addNumbersSequentially(serverNumbers, markedNumbers);

    // Show result
    if (data.winAmount > 0) {
      console.log(`Congratulations! You won ${formatCurrencyAmount(data.winAmount, currency)}!`);
    } else {
      console.log('No bingo lines completed. Try again!');
    }

    // Update balance from server response after animations complete
    // This will be called after the line completion animation finishes
    // setTimeout(() => {
    //   updateBalanceFromServer(data.currency, data.newBalance);
    // }, 2000); // Wait for all animations to complete

  } catch (error) {
    console.error('Play error:', error);
    console.log(error.message);
    
    // If there's an error, revert the visual balance deduction
    updateBalanceDisplay(currency, betAmount);
    
    // Re-enable buttons on error
    const playBtn = document.getElementById('playBtn');
    const randomBtn = document.getElementById('randomBtn');
    const betAmountInput = document.getElementById('betAmount');
    const currencySelect = document.getElementById('currency');
    
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
    playBtn.style.opacity = '1'; // Restore normal opacity
    randomBtn.disabled = false;
    randomBtn.style.opacity = '1'; // Restore normal opacity
    
    // Re-enable bet amount and currency controls
    betAmountInput.disabled = false;
    currencySelect.disabled = false;
    currencySelect.style.opacity = '1'; // Restore normal opacity
  }
  // Note: Button will be re-enabled in markCompletedLines function after animations complete
}

// Mark numbers on the grid based on server response
function markNumbersOnGrid() {
  // Clear previous selections (except center tile)
  selectedTiles.clear();
  selectedTiles.add('2,2'); // Keep center tile selected

  // Mark numbers that match server numbers
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${row},${col}`;
      if (key === '2,2') continue; // Skip center tile

      const tileNumber = tileNumbers.get(key);
      if (tileNumber && serverNumbers.includes(tileNumber)) {
        selectedTiles.add(key);
      }
    }
  }

  // Redraw grid to show marked tiles
  drawGrid();
}

// Connect play button
document.getElementById('playBtn').addEventListener('click', playBingo);

// ─── D) Numbers Table Management ─────────────────────────────────────────────

// Track numbers table state
let numbersTable = null;
let currentNumbers = [];
let displayedNumbers = [];

// Initialize numbers table
function initNumbersTable() {
  numbersTable = document.querySelector('.numbers-table');
  if (!numbersTable) return;
  
  // Clear any existing numbers
  numbersTable.innerHTML = '';
  currentNumbers = [];
  displayedNumbers = [];
}

// Add a single number to the table with animation
function addNumberToTable(number, isMarked = false) {
  if (!numbersTable) return;
  
  // Create number item
  const numberItem = document.createElement('div');
  numberItem.className = 'number-item';
  numberItem.textContent = number;
  numberItem.setAttribute('data-number', number);
  
  // Add to table
  numbersTable.appendChild(numberItem);
  
  // Add animation for new number
  numberItem.classList.add('new');
  
  // Remove animation class after animation completes
  setTimeout(() => {
    numberItem.classList.remove('new');
  }, 500);
  
  // Mark if it matches user's grid
  if (isMarked) {
    numberItem.classList.add('marked');
  }
  
  // Auto-scroll to keep latest number in view
  setTimeout(() => {
    scrollToLatestNumber();
  }, 100);
}

// Add numbers one by one with delay
function addNumbersSequentially(numbers, markedNumbers = []) {
  if (!numbersTable) return;
  
  // Clear existing numbers
  numbersTable.innerHTML = '';
  currentNumbers = numbers;
  displayedNumbers = [];
  
  // Clear previous selections (except center tile)
  selectedTiles.clear();
  selectedTiles.add('2,2'); // Keep center tile selected
  drawGrid(); // Redraw to clear previous markings
  
  // Add numbers one by one with delay
  numbers.forEach((number, index) => {
    setTimeout(() => {
      const isMarked = markedNumbers.includes(number);
      addNumberToTable(number, isMarked);
      displayedNumbers.push(number);
      
      // If this number is marked, also mark the corresponding tile
      if (isMarked) {
        markTileForNumber(number);
      }
      
      // After all numbers are revealed, mark completed lines
      if (index === numbers.length - 1) {
        setTimeout(() => {
          markCompletedLines(completedLines);
        }, 1000); // Wait 1 second after last number
      }
    }, index * 400); // Increased from 200ms to 400ms for slower animation
  });
}

// Mark the tile that corresponds to a specific number
function markTileForNumber(number) {
  // Find which tile has this number
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${row},${col}`;
      if (key === '2,2') continue; // Skip center tile
      
      const tileNumber = tileNumbers.get(key);
      if (tileNumber === number) {
        selectedTiles.add(key);
        drawGrid(); // Redraw to show the newly marked tile
        
        // Trigger subtle animation for the marked tile (same as connect.js)
        setTimeout(() => {
          animateClick(key);
        }, 100); // Small delay to ensure the tile is marked first
        
        return;
      }
    }
  }
}

// Scroll to keep the latest number in view
function scrollToLatestNumber() {
  if (!numbersTable) return;
  
  const lastItem = numbersTable.lastElementChild;
  if (lastItem) {
    lastItem.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest',
      inline: 'end'
    });
  }
}

// Update marked numbers in the table
function updateMarkedNumbers(markedNumbers) {
  if (!numbersTable) return;
  
  const numberItems = numbersTable.querySelectorAll('.number-item');
  numberItems.forEach(item => {
    const number = parseInt(item.getAttribute('data-number'));
    if (markedNumbers.includes(number)) {
      item.classList.add('marked');
    } else {
      item.classList.remove('marked');
    }
  });
}

// Initialize numbers table on page load
initNumbersTable();

// ─── F) Win Message Management ─────────────────────────────────────────────

// Win message element
let winMessageDiv = null;

// Setup win message
function setupWinMessage() {
  winMessageDiv = document.querySelector('.win-message');
  
  // Add click event listener to canvas to dismiss win message
  canvas.addEventListener('click', () => {
    if (winMessageDiv && winMessageDiv.classList.contains('visible')) {
      hideWinMessage();
    }
  });
}

// Show win message
function showWinMessage(multiplier, amount, currency) {
  if (winMessageDiv && winMessageDiv.classList) {
    const multiplierElement = winMessageDiv.querySelector('.multiplier');
    const amountElement = winMessageDiv.querySelector('.amount');
    
    if (multiplierElement) {
      multiplierElement.textContent = multiplier.toFixed(2) + 'x';
    }
    if (amountElement) {
      amountElement.textContent = formatCurrencyAmount(amount, currency);
    }
    winMessageDiv.classList.add('visible');
  }
}

// Hide win message
function hideWinMessage() {
  if (winMessageDiv && winMessageDiv.classList) {
    winMessageDiv.classList.remove('visible');
  }
}

// Initialize win message on page load
setupWinMessage();

// ─── E) Line Completion Animation ─────────────────────────────────────────────

// Mark completed lines with special color and animation
function markCompletedLines(lines) {
  if (lines.length === 0) {
    // No completed lines, don't update balance - keep the visual deduction
    // Re-enable buttons when no lines are completed
    const playBtn = document.getElementById('playBtn');
    const randomBtn = document.getElementById('randomBtn');
    const betAmountInput = document.getElementById('betAmount');
    const currencySelect = document.getElementById('currency');
    
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
    playBtn.style.opacity = '1'; // Restore normal opacity
    randomBtn.disabled = false;
    randomBtn.style.opacity = '1'; // Restore normal opacity
    
    // Re-enable bet amount and currency controls
    betAmountInput.disabled = false;
    currencySelect.disabled = false;
    currencySelect.style.opacity = '1'; // Restore normal opacity
    
    isPlaying = false;
    return;
  }
  
  isAnimatingLines = true;
  animatingLineTiles.clear(); // Clear previous animation tiles
  
  let lineIndex = 0;
  let tileIndex = 0;
  
  function animateNextTile() {
    if (lineIndex >= lines.length) {
      isAnimatingLines = false;
      animatingLineTiles.clear(); // Clear animation tiles when done
      
      // Update balance from server response only if there are completed lines (win)
      if (window.lastGameData) {
        updateBalanceFromServer(window.lastGameData.currency, window.lastGameData.newBalance);
        
        // Show win message after balance update
        if (window.lastGameData.winAmount > 0) {
          const multiplier = window.lastGameData.winAmount / currentBet;
          setTimeout(() => {
            showWinMessage(multiplier, window.lastGameData.winAmount, window.lastGameData.currency);
          }, 500); // Show win message 500ms after balance update
        }
      }
      
      // Re-enable buttons after all animations are complete
      const playBtn = document.getElementById('playBtn');
      const randomBtn = document.getElementById('randomBtn');
      const betAmountInput = document.getElementById('betAmount');
      const currencySelect = document.getElementById('currency');
      
      playBtn.disabled = false;
      playBtn.textContent = 'Play';
      playBtn.style.opacity = '1'; // Restore normal opacity
      randomBtn.disabled = false;
      randomBtn.style.opacity = '1'; // Restore normal opacity
      
      // Re-enable bet amount and currency controls
      betAmountInput.disabled = false;
      currencySelect.disabled = false;
      currencySelect.style.opacity = '1'; // Restore normal opacity
      
      isPlaying = false;
      
      return;
    }
    
    const line = lines[lineIndex];
    const tiles = line.tiles; // Backend provides tile keys
    
    if (tileIndex >= tiles.length) {
      lineIndex++;
      tileIndex = 0;
      setTimeout(animateNextTile, 300); // Delay between lines
      return;
    }
    
    const tileKey = tiles[tileIndex];
    
    // Only animate tiles that are already marked (part of selectedTiles)
    if (selectedTiles.has(tileKey)) {
      // Add this tile to animating tiles (changes its color)
      animatingLineTiles.add(tileKey);
      drawGrid(); // Redraw to show the color change
      
      // Trigger animation for the marked tile
      setTimeout(() => {
        animateClick(tileKey);
      }, 100);
    }
    
    tileIndex++;
    setTimeout(animateNextTile, 200); // Delay between tiles
  }
  
  animateNextTile();
}

// Helper function to get current balance for a currency
function getCurrentBalance(currency) {
  const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
  const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
  
  if (currency === 'USD' && usdDropdownItem) {
    const amountLabel = usdDropdownItem.querySelector('.amount-label');
    if (amountLabel) {
      const balanceText = amountLabel.textContent.trim();
      return parseFloat(balanceText.replace(/[$,]/g, '')) || 0;
    }
  } else if (currency === 'LBP' && lbpDropdownItem) {
    const amountLabel = lbpDropdownItem.querySelector('.amount-label');
    if (amountLabel) {
      const balanceText = amountLabel.textContent.trim();
      return parseFloat(balanceText.replace(/[£,]/g, '')) || 0;
    }
  }
  
  return 0;
}