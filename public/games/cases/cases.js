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

// Case history variables - using relative sizes instead of fixed pixels
const MAX_HISTORY_ITEMS = 10;
// These will be calculated dynamically based on canvas size
let HISTORY_SLOT_WIDTH;
let HISTORY_SLOT_HEIGHT;
let HISTORY_SLOT_MARGIN;
let HISTORY_TOP_MARGIN;
let HISTORY_RIGHT_MARGIN;
let HISTORY_CORNER_RADIUS;

// Function to calculate responsive history slot dimensions
function calculateHistoryDimensions() {
  const slotWidthPercent = 0.12; // Make it wider (was 0.1)
  HISTORY_SLOT_WIDTH = Math.round(canvasWidth * slotWidthPercent);

  const heightRatio = 0.7; // Make it shorter than width (was 1.0 for square)
  HISTORY_SLOT_HEIGHT = Math.round(HISTORY_SLOT_WIDTH * heightRatio);

  // Margins and radius based on new width
  HISTORY_SLOT_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 0.2);
  HISTORY_TOP_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 0.4);
  HISTORY_RIGHT_MARGIN = Math.round(HISTORY_SLOT_WIDTH * 1.4);
  HISTORY_CORNER_RADIUS = Math.round(HISTORY_SLOT_WIDTH * 0.16);
}


// Array to store history of opened cases
let caseHistory = [];
let isHistoryAnimating = false;
let historyAnimationProgress = 0;

// Color mapping for case types
const CASE_COLORS = {
  'gray': '#557085',
  'light_blue': '#53dffd',
  'blue': '#017ffa',
  'red': '#ea183a',
  'green': '#0de443',
  'purple': '#973cf9',
  'gold': '#ffc131'
};

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

// ─── Currency Synchronization with Navbar ────────────────
function setupCurrencySync() {
  const currencySelect = document.getElementById('currency');
  if (!currencySelect) return;

  // Initial sync: Set game currency dropdown to match navbar selected currency
  if (window.getNavbarCurrency) {
    const navbarCurrency = window.getNavbarCurrency();
    currencySelect.value = navbarCurrency;
  }

  // When game currency dropdown changes, update navbar
  currencySelect.addEventListener('change', function() {
    if (window.setNavbarCurrency) {
      window.setNavbarCurrency(this.value);
    }
    
    // Update bet amount input attributes based on new currency
    updateBetAmountAttributes();
    
    // Set bet amount to minimum for the selected currency
    resetBetAmountToMinimum();
  });

  // Listen for navbar currency changes to update game dropdown
  // We'll use a MutationObserver to watch for changes in the selected-balance element
  const selectedBalance = document.getElementById('selected-balance');
  if (selectedBalance) {
    // Flag to skip the first mutation that happens on page load
    let isFirstMutation = true;
    
    const observer = new MutationObserver(function(mutations) {
      if (window.getNavbarCurrency) {
        // Skip the first mutation to prevent changing the initial bet amount
        if (isFirstMutation) {
          isFirstMutation = false;
          
          // Just sync the dropdown without changing the bet amount
          const navbarCurrency = window.getNavbarCurrency();
          currencySelect.value = navbarCurrency;
          updateBetAmountAttributes();
          return;
        }
        
        const navbarCurrency = window.getNavbarCurrency();
        currencySelect.value = navbarCurrency;
        
        // Update bet amount input attributes when navbar currency changes
        updateBetAmountAttributes();
        
        // Set bet amount to minimum for the selected currency
        resetBetAmountToMinimum();
      }
    });
    
    observer.observe(selectedBalance, { childList: true, characterData: true, subtree: true });
  }
  
  // Set up bet amount validation
  setupBetAmountValidation();
}

// ─── Bet Amount Validation ────────────────
function setupBetAmountValidation() {
  const betAmountInput = document.getElementById('betAmount');
  if (!betAmountInput) return;
  
  // Don't set attributes or validate on initialization - we handle this directly in the load event
  // This prevents multiple visual updates
  
  // Validate on blur (when user clicks away)
  betAmountInput.addEventListener('blur', validateBetAmount);
  
  // Validate on change (when user presses enter)
  betAmountInput.addEventListener('change', validateBetAmount);
}

// Update bet amount input attributes based on currency
function updateBetAmountAttributes() {
  const betAmountInput = document.getElementById('betAmount');
  if (!betAmountInput) return;
  
  const currency = getCurrency();
  
  if (currency === 'USD') {
    betAmountInput.min = "0.10";
    betAmountInput.max = "1000";
    betAmountInput.step = "0.10";
  } else { // LBP
    betAmountInput.min = "10000";
    betAmountInput.max = "1000000000";
    betAmountInput.step = "10000";
  }
}

// Validate and adjust bet amount based on currency limits
function validateBetAmount() {
  const betAmountInput = document.getElementById('betAmount');
  if (!betAmountInput) return;
  
  const currency = getCurrency();
  let value = parseFloat(betAmountInput.value);
  
  // If not a valid number, set to minimum
  if (isNaN(value) || value <= 0) {
    if (currency === 'USD') {
      betAmountInput.value = "0.10";
    } else {
      betAmountInput.value = "10000";
    }
    return;
  }
  
  // Apply limits based on currency
  if (currency === 'USD') {
    if (value < 0.10) value = 0.10;
    if (value > 1000) value = 1000;
    betAmountInput.value = value.toFixed(2);
  } else { // LBP
    if (value < 10000) value = 10000;
    if (value > 1000000000) value = 1000000000;
    betAmountInput.value = Math.floor(value);
  }
}

// Reset bet amount to minimum value for the selected currency
function resetBetAmountToMinimum() {
  const betAmountInput = document.getElementById('betAmount');
  if (!betAmountInput) return;
  
  const currency = getCurrency();
  const currentValue = parseFloat(betAmountInput.value);
  
  // For USD: Check if current value is already valid (between 0.10 and 1000)
  if (currency === 'USD') {
    // Only reset if the current value is outside the valid range
    if (isNaN(currentValue) || currentValue < 0.10 || currentValue > 1000) {
      betAmountInput.value = "0.10";
    }
  } 
  // For LBP: Check if current value is already valid (between 10000 and 1000000000)
  else { 
    // Only reset if the current value is outside the valid range
    if (isNaN(currentValue) || currentValue < 10000 || currentValue > 1000000000) {
      betAmountInput.value = "10000";
    }
  }
}

// Helper function to get current currency
function getCurrency() {
  // Try to get from navbar first
  if (window.getNavbarCurrency) {
    return window.getNavbarCurrency();
  }
  
  // Fall back to local dropdown
  const currencySelect = document.getElementById('currency');
  return currencySelect ? currencySelect.value : 'USD';
}

// Constants
const CASE_TYPES = [
  'blue', 'gold', 'gray', 'green', 'light_blue', 'purple', 'red'
];

// Game state
let casesArray = [];
let canvas, ctx;
let canvasWidth, canvasHeight;
let isAnimating = false;
let pointer;
let scrollOffset = 0; // For horizontal scrolling animation
let animationSpeed = 0; // Speed of the animation
let targetScrollOffset = 0; // Target position for animation
let spinningTimeout = null; // For tracking animation timeout
let winningCase = null; // The selected winning case
let difficulty = 'medium'; // Default difficulty
let animationStartTime = 0; // For easing animation
let animationDuration = 3000; // Animation duration in ms
let initialScrollOffset = 0; // Starting position for animation
let openingAnimation = false; // Flag for case opening animation
let openingAnimationStartTime = 0; // Start time for opening animation
let openingAnimationDuration = 1500; // Duration for opening animation
let gemImage = null; // Image for the winning gem

// Initialize the game
function initGame() {
  canvas = document.getElementById('casesCanvas');
  ctx = canvas.getContext('2d');
  
  // Set canvas dimensions
  resizeCanvas();
  
  // Load pointer image
  pointer = new Image();
  pointer.src = './cases_assets/pointer.svg';
  
  // Generate cases
  generateCases();
  
  // Draw everything
  window.requestAnimationFrame(drawGame);
  
  // Add event listeners
  document.getElementById('playBtn').addEventListener('click', startGame);
  window.addEventListener('resize', resizeCanvas);
  
  // Add difficulty selector if it exists
  const difficultySelector = document.getElementById('difficulty');
  if (difficultySelector) {
    difficultySelector.addEventListener('change', (e) => {
      difficulty = e.target.value;
    });
  }
  
  // Set up currency synchronization with navbar
  // We'll set this up with a slight delay to avoid affecting the initial bet amount
  setTimeout(() => {
    setupCurrencySync();
  }, 100);
}

// Resize canvas to maintain aspect ratio
function resizeCanvas() {
  // Get the container width
  const container = document.querySelector('.game-container');
  const containerWidth = container.clientWidth;
  
  // Set canvas size based on container width (keeping it square)
  canvas.width = containerWidth;
  canvas.height = containerWidth;
  
  // Update internal dimensions
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  
  // Calculate responsive history dimensions
  calculateHistoryDimensions();
  
  // Regenerate cases with new dimensions if they exist
  if (casesArray.length > 0) {
    generateCases();
  }
}

// Generate placeholder cases in a horizontal row
function generateCases() {
  casesArray = [];
  const numVisibleCases = 4; // Number of cases visible at once
  const totalCases = 20; // Total number of cases in the reel
  
  // Calculate case size to fit 4 cases with small gaps
  const gap = canvasWidth * 0.01; // 2% of canvas width for gap
  const caseWidth = (canvasWidth - (gap * (numVisibleCases + 1))) / numVisibleCases;
  const caseHeight = caseWidth * 1.2; // Make cases slightly taller
  
  // Calculate initial offset to center the first few cases
  const initialOffset = (canvasWidth - (numVisibleCases * (caseWidth + gap) + gap)) / 2;
  
  for (let i = 0; i < totalCases; i++) {
    // Calculate position in a horizontal line with gaps
    const x = i * (caseWidth + gap) + gap + caseWidth / 2 + initialOffset;
    const y = canvasHeight / 2;
    
    // Randomly select a case type
    const caseType = CASE_TYPES[Math.floor(Math.random() * CASE_TYPES.length)];
    
    // Create a new case object
    const caseObj = {
      x: x,
      y: y,
      type: caseType,
      image: new Image(),
      openedImage: new Image(), // Add opened case image
      width: caseWidth,
      height: caseHeight,
      opened: false,
      value: 0,
      isWinner: false,
      scaleX: 1, // For squeeze animation
      scaleY: 1, // For squeeze animation
      gemOffset: 0 // For gem floating animation
    };
    
    // Load the case images
    caseObj.image.src = `./cases_assets/cases_closed/${caseType}_closed.png`;
    caseObj.openedImage.src = `./cases_assets/cases_opened/${caseType}_open.png`;
    
    casesArray.push(caseObj);
  }
  
  // Reset scroll position and winning case
  scrollOffset = 0;
  winningCase = null;
  openingAnimation = false;
}

// Update cases based on server response
function updateCasesFromServer(serverCases, winningIndex) {
  // We want to continue spinning with existing cases
  // Get the existing cases array or create a new one
  let existingCases = [...casesArray];
  const newCasesArray = [];
  
  // Get case dimensions
  const numVisibleCases = 4;
  const gap = canvasWidth * 0.02;
  const caseWidth = (canvasWidth - (gap * (numVisibleCases + 1))) / numVisibleCases;
  const caseHeight = caseWidth * 1.2; // Make cases slightly taller
  
  // If we have existing cases, use them for the continuation
  if (existingCases.length > 0) {
    // Calculate how much space we need for the server cases
    const serverCasesWidth = serverCases.length * (caseWidth + gap);
    
    // Get the last case's position
    const lastCasePos = existingCases[existingCases.length - 1].x;
    
    // Start position for new cases
    let startPos = lastCasePos + caseWidth + gap;
    
    // Keep track of the winning case index in the new array
    let winningPosition = newCasesArray.length + winningIndex;
    
    // Add all existing cases to the new array
    for (let i = 0; i < existingCases.length; i++) {
      // Reset isWinner flag on all existing cases
      existingCases[i].isWinner = false;
      newCasesArray.push(existingCases[i]);
    }
    
    // Now add the server cases
    for (let i = 0; i < serverCases.length; i++) {
      const serverCase = serverCases[i];
      const isWinningCase = (i === winningIndex);
      
      // Calculate position
      const x = startPos + i * (caseWidth + gap);
      const y = canvasHeight / 2;
      
      // Create case object
      const caseObj = {
        x: x,
        y: y,
        type: serverCase.type,
        image: new Image(),
        openedImage: new Image(), // Add opened case image
        width: caseWidth,
        height: caseHeight,
        opened: false,
        value: serverCase.value,
        isWinner: isWinningCase,
        scaleX: 1, // For squeeze animation
        scaleY: 1, // For squeeze animation
        gemOffset: 0 // For gem floating animation
      };
      
      // Load the case images
      caseObj.image.src = `./cases_assets/cases_closed/${serverCase.type}_closed.png`;
      caseObj.openedImage.src = `./cases_assets/cases_opened/${serverCase.type}_open.png`;
      
      newCasesArray.push(caseObj);
      
      // Store reference to winning case
      if (isWinningCase) {
        winningCase = caseObj;
        winningPosition = newCasesArray.length - 1;
        
        // Preload the gem image for the winning case
        gemImage = new Image();
        gemImage.src = `./cases_assets/gems/${serverCase.type}_gem.png`;
      }
    }
    
    // Add a few extra cases at the end
    const extraCases = 5;
    for (let i = 0; i < extraCases; i++) {
      const randomIndex = Math.floor(Math.random() * serverCases.length);
      const serverCase = serverCases[randomIndex];
      
      // Calculate position
      const x = startPos + serverCases.length * (caseWidth + gap) + i * (caseWidth + gap);
      const y = canvasHeight / 2;
      
      // Create case object
      const caseObj = {
        x: x,
        y: y,
        type: serverCase.type,
        image: new Image(),
        openedImage: new Image(), // Add opened case image
        width: caseWidth,
        height: caseHeight,
        opened: false,
        value: 0,
        isWinner: false,
        scaleX: 1, // For squeeze animation
        scaleY: 1, // For squeeze animation
        gemOffset: 0 // For gem floating animation
      };
      
      // Load the case images
      caseObj.image.src = `./cases_assets/cases_closed/${serverCase.type}_closed.png`;
      caseObj.openedImage.src = `./cases_assets/cases_opened/${serverCase.type}_open.png`;
      
      newCasesArray.push(caseObj);
    }
    
    // Replace the cases array
    casesArray = newCasesArray;
    
    // Set target scroll offset to position the winning case under the pointer
    const centerX = canvasWidth / 2;
    
    // Add randomness to where the pointer lands within the case
    // Generate a random offset between -40% and 40% of the case width
    const randomOffset = (Math.random() * 0.8 - 0.4) * caseWidth;
    
    targetScrollOffset = winningCase.x - centerX + randomOffset;
    
    // Set initial scroll offset to current scroll offset for continuous animation
    initialScrollOffset = scrollOffset;
  } else {
    // We'll create a repeating pattern with the server cases
    // First, add some cases before the winning case for the animation
    const initialCases = 15; // Number of cases before the winning case
    
    // Add initial cases (random selection from server cases)
    for (let i = 0; i < initialCases; i++) {
      const randomIndex = Math.floor(Math.random() * serverCases.length);
      const serverCase = serverCases[randomIndex];
      
      // Calculate position
      const x = i * (caseWidth + gap) + gap + caseWidth / 2;
      const y = canvasHeight / 2;
      
      // Create case object
      const caseObj = {
        x: x,
        y: y,
        type: serverCase.type,
        image: new Image(),
        openedImage: new Image(), // Add opened case image
        width: caseWidth,
        height: caseHeight,
        opened: false,
        value: 0, // These are just for animation
        isWinner: false,
        scaleX: 1, // For squeeze animation
        scaleY: 1, // For squeeze animation
        gemOffset: 0 // For gem floating animation
      };
      
      // Load the case images
      caseObj.image.src = `./cases_assets/cases_closed/${serverCase.type}_closed.png`;
      caseObj.openedImage.src = `./cases_assets/cases_opened/${serverCase.type}_open.png`;
      
      newCasesArray.push(caseObj);
    }
    
    // Now add all server cases in order, with the winning case
    for (let i = 0; i < serverCases.length; i++) {
      const serverCase = serverCases[i];
      const isWinningCase = (i === winningIndex);
      
      // Calculate position
      const x = (initialCases + i) * (caseWidth + gap) + gap + caseWidth / 2;
      const y = canvasHeight / 2;
      
      // Create case object
      const caseObj = {
        x: x,
        y: y,
        type: serverCase.type,
        image: new Image(),
        openedImage: new Image(), // Add opened case image
        width: caseWidth,
        height: caseHeight,
        opened: false,
        value: serverCase.value,
        isWinner: isWinningCase,
        scaleX: 1, // For squeeze animation
        scaleY: 1, // For squeeze animation
        gemOffset: 0 // For gem floating animation
      };
      
      // Load the case images
      caseObj.image.src = `./cases_assets/cases_closed/${serverCase.type}_closed.png`;
      caseObj.openedImage.src = `./cases_assets/cases_opened/${serverCase.type}_open.png`;
      
      newCasesArray.push(caseObj);
      
      // Store reference to winning case and preload the gem image
      if (isWinningCase) {
        winningCase = caseObj;
        
        // Preload the gem image for the winning case
        gemImage = new Image();
        gemImage.src = `./cases_assets/gems/${serverCase.type}_gem.png`;
      }
    }
    
    // Add some extra cases after the winning case to ensure we don't run out during animation
    const extraCases = 5;
    for (let i = 0; i < extraCases; i++) {
      const randomIndex = Math.floor(Math.random() * serverCases.length);
      const serverCase = serverCases[randomIndex];
      
      // Calculate position
      const x = (initialCases + serverCases.length + i) * (caseWidth + gap) + gap + caseWidth / 2;
      const y = canvasHeight / 2;
      
      // Create case object
      const caseObj = {
        x: x,
        y: y,
        type: serverCase.type,
        image: new Image(),
        openedImage: new Image(), // Add opened case image
        width: caseWidth,
        height: caseHeight,
        opened: false,
        value: 0, // These are just for animation
        isWinner: false,
        scaleX: 1, // For squeeze animation
        scaleY: 1, // For squeeze animation
        gemOffset: 0 // For gem floating animation
      };
      
      // Load the case images
      caseObj.image.src = `./cases_assets/cases_closed/${serverCase.type}_closed.png`;
      caseObj.openedImage.src = `./cases_assets/cases_opened/${serverCase.type}_open.png`;
      
      newCasesArray.push(caseObj);
    }
    
    // Replace the cases array
    casesArray = newCasesArray;
    
    // Calculate the target scroll offset to position winning case under pointer
    // The winning case is at position initialCases + winningIndex
    const winningCasePosition = initialCases + winningIndex;
    const centerX = canvasWidth / 2;
    
    // Add randomness to where the pointer lands within the case
    // Generate a random offset between -40% and 40% of the case width
    const randomOffset = (Math.random() * 0.8 - 0.4) * caseWidth;
    
    targetScrollOffset = casesArray[winningCasePosition].x - centerX + randomOffset;
    
    // Set initial scroll offset
    initialScrollOffset = 0;
  }
  
  return winningCase;
}

// Draw history slots at the top of the canvas
function drawHistorySlots(ctx) {
  // Draw each history slot from right to left
  caseHistory.forEach((item, index) => {
    // For new slot (index 0), start from just outside the canvas right edge
    let startX = canvasWidth - HISTORY_RIGHT_MARGIN;
    if (index > 0) {
      // For existing slots, start from their current position
      startX = canvasWidth - HISTORY_RIGHT_MARGIN - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * (index - 1);
    }
    
    // Calculate target position
    const targetX = canvasWidth - HISTORY_RIGHT_MARGIN - (HISTORY_SLOT_WIDTH + HISTORY_SLOT_MARGIN) * index;
    
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
    ctx.shadowBlur = Math.round(HISTORY_SLOT_WIDTH * 0.12); // Responsive shadow blur
    ctx.shadowOffsetY = Math.round(HISTORY_SLOT_WIDTH * 0.04); // Responsive shadow offset
    
    // Get the color based on case type
    const backgroundColor = CASE_COLORS[item.type] || '#8fa3b0';
    
    // Draw rounded rectangle background
    ctx.fillStyle = backgroundColor;
    roundRect(ctx, x, HISTORY_TOP_MARGIN, HISTORY_SLOT_WIDTH, HISTORY_SLOT_HEIGHT, HISTORY_CORNER_RADIUS);
    ctx.fill();
    ctx.restore();

    // Draw multiplier text - responsive font size
    ctx.fillStyle = 'black';
    const fontSize = Math.max(10, Math.round(HISTORY_SLOT_WIDTH * 0.28)); // Min 10px, otherwise 28% of slot width
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.value.toFixed(2) + 'x', x + HISTORY_SLOT_WIDTH/2, HISTORY_TOP_MARGIN + HISTORY_SLOT_HEIGHT/2);
  });
}

// purely visual case color squares
function drawCaseColorLegend() {
  const colorKeys = Object.keys(CASE_COLORS);
  const numColors = colorKeys.length;

  // Responsive size
  const boxSize = canvasWidth * 0.045; // Each square is ~3.5% of canvas width
  const boxGap = boxSize * 0.25;       // Gap between squares
  const totalWidth = numColors * boxSize + (numColors - 1) * boxGap;

  // Bottom center position
  const startX = (canvasWidth - totalWidth) / 2;
  const y = canvasHeight - boxSize * 1.8; // Some padding from bottom

  const cornerRadius = boxSize * 0.2;

  colorKeys.forEach((key, index) => {
    const x = startX + index * (boxSize + boxGap);
    const color = CASE_COLORS[key];

    // Draw rounded square
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + boxSize - cornerRadius, y);
    ctx.quadraticCurveTo(x + boxSize, y, x + boxSize, y + cornerRadius);
    ctx.lineTo(x + boxSize, y + boxSize - cornerRadius);
    ctx.quadraticCurveTo(x + boxSize, y + boxSize, x + boxSize - cornerRadius, y + boxSize);
    ctx.lineTo(x + cornerRadius, y + boxSize);
    ctx.quadraticCurveTo(x, y + boxSize, x, y + boxSize - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    ctx.fill();
  });
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

// Draw the game
function drawGame() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw history slots at the top
  drawHistorySlots(ctx);
  
  // Update animation
  updateAnimation();
  
  // Draw cases
  drawCases();

  // Draw case color squares
  drawCaseColorLegend(); 
  
  // Draw pointer in the center
  drawPointer();
  
  // Continue animation loop
  window.requestAnimationFrame(drawGame);
}

// Easing function for smooth animation
function easeInOutQuart(x) {
  return 1 - Math.pow(1 - x, 5); // More gradual slowdown
}

// Easing function for bounce effect
function easeOutBounce(x) {
  const n1 = 7.5625;
  const d1 = 2.75;
  
  if (x < 1 / d1) {
      return n1 * x * x;
  } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

// Variable to store game result for later use
let currentGameResult = null;

// Update the balance display after a win
function updateBalanceDisplay(gameResult) {
  if (!gameResult) return;
  
  // Use the navbar's global update function to update with the final balance from server
  if (window.updateNavbarBalance) {
    window.updateNavbarBalance(gameResult.currency, gameResult.newBalance);
  } else {
    console.warn('Navbar balance update function not available');
  }
}

// Draw all cases
function drawCases() {
  casesArray.forEach(caseObj => {
    // Adjust position based on scroll offset
    const adjustedX = caseObj.x - scrollOffset;
    
    // Only draw cases that are visible or close to being visible
    if (adjustedX > -caseObj.width && adjustedX < canvasWidth + caseObj.width) {
      // Calculate position to center the image on its coordinates
      const x = adjustedX - caseObj.width / 2;
      const y = caseObj.y - caseObj.height / 2;
      
      // Save context for transformations
      ctx.save();
      
      // Apply scale for squeeze animation if this is the winning case
      if (caseObj.isWinner && (caseObj.scaleX !== 1 || caseObj.scaleY !== 1)) {
        // Scale from the center of the case
        ctx.translate(adjustedX, caseObj.y);
        ctx.scale(caseObj.scaleX, caseObj.scaleY);
        ctx.translate(-adjustedX, -caseObj.y);
      }
      
      // Draw the case (closed or opened)
      if (caseObj.opened) {
        // For opened cases, preserve the original height ratio but match the bottom position
        const openedHeight = caseObj.width * 1.6; // Adjust this ratio if needed
        // Position the opened case so its bottom aligns with where the closed case would be
        ctx.drawImage(caseObj.openedImage, x, y - (openedHeight - caseObj.height), caseObj.width, openedHeight);
        
        // Draw gem if this is the winning case
        if (caseObj.isWinner && gemImage && gemImage.complete) {
          const gemWidth = caseObj.width * 0.75;
          const gemHeight = gemWidth * 1.3; // Increase height relative to width
          const gemX = adjustedX - gemWidth / 2;
          // Adjust gem position to account for taller opened case
          const gemY = y - (openedHeight - caseObj.height) * 0.95 + caseObj.gemOffset;
          
          ctx.drawImage(gemImage, gemX, gemY, gemWidth, gemHeight);
          
          // Draw multiplier text below the gem
          // Multiplier background size relative to case width
const bgWidth = caseObj.width * 0.7;
const bgHeight = caseObj.width * 0.28; // Taller than text, fixed ratio
const bgX = adjustedX - bgWidth / 2;
const bgY = y + caseObj.height * 0.72;

// Draw rounded background
ctx.fillStyle = '#304552'; // Background color
const radius = caseObj.width * 0.12; // Rounded corner radius relative to size
ctx.beginPath();
ctx.moveTo(bgX + radius, bgY);
ctx.lineTo(bgX + bgWidth - radius, bgY);
ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
ctx.lineTo(bgX + radius, bgY + bgHeight);
ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
ctx.lineTo(bgX, bgY + radius);
ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
ctx.closePath();
ctx.fill();

// Draw multiplier text centered inside the fixed-size background
const multiplierText = `${caseObj.value.toFixed(2)}x`;
ctx.fillStyle = '#ffffff';
ctx.font = 'bold ' + (caseObj.width * 0.17) + 'px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(multiplierText, adjustedX, bgY + bgHeight / 2 + 1);

        }
      } else {
        ctx.drawImage(caseObj.image, x, y, caseObj.width, caseObj.height);
      }
      
      // Restore context
      ctx.restore();
    }
  });
}

// Draw the pointer in the center
function drawPointer() {
  if (pointer.complete) {
    const pointerWidth = canvasWidth * 0.12;
    const pointerHeight = pointerWidth * 1.5; // Maintain aspect ratio
    const x = canvasWidth / 2 - pointerWidth / 2;
    const y = canvasHeight / 2 - pointerHeight / 2 + 70;
    
    ctx.drawImage(pointer, x, y, pointerWidth, pointerHeight);
  }
}

// Start the game
async function startGame() {
  if (isAnimating || openingAnimation) return;
  
  // Clear any existing timeout
  if (spinningTimeout) {
    clearTimeout(spinningTimeout);
  }
  
  // Don't reset any properties of the winning case
  // Just leave it as is with the gem and multiplier visible
  
  // Validate bet amount first
  validateBetAmount();
  
  // Get bet amount and currency
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const currency = getCurrency();
  
  if (isNaN(betAmount) || betAmount <= 0) {
    alert('Please enter a valid bet amount');
    return;
  }
  
  try {
    // Disable play button during API call
    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = true;
    playBtn.textContent = 'Spinning...';
    
    // Get current balance from navbar
    let currentBalance = 0;
    
    // Get the current displayed balance from the navbar
    const selectedBalanceElement = document.getElementById('selected-balance');
    if (selectedBalanceElement) {
      const balanceText = selectedBalanceElement.textContent;
      // Extract numeric value from the balance text (removing currency symbols)
      currentBalance = parseFloat(balanceText.replace(/[^0-9.-]+/g, ""));
    } else if (window.sessionData) {
      // Fallback to session data if navbar element not found
      currentBalance = currency === 'USD' ? window.sessionData.balanceUSD : window.sessionData.balanceLBP;
    }
    
    // Check if deducting would result in negative balance
    if (currentBalance < betAmount) {
      // Don't update the visual balance if it would go negative
      // The backend will reject the bet anyway
    } else {
      // Only update visual balance if it won't go negative
      const newVisualBalance = currentBalance - betAmount;
      
      // Use the navbar's global update function for visual feedback only
      if (window.updateNavbarBalance) {
        window.updateNavbarBalance(currency, newVisualBalance);
      }
    }
    
    // Call the backend API
    const response = await fetch('/games/cases/play', {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to play game');
    }
    
    const gameResult = await response.json();
    // Store result for later use when animation completes
    currentGameResult = gameResult;
    
    // Update cases with server data
    winningCase = updateCasesFromServer(gameResult.cases, gameResult.winningIndex);
    
    // Start animation with timing
    isAnimating = true;
    animationStartTime = Date.now();
    
    // Set a timeout to ensure animation stops
    spinningTimeout = setTimeout(() => {
      if (isAnimating) {
        isAnimating = false;
        scrollOffset = targetScrollOffset;
        
        // Start opening animation
        if (winningCase) {
          openingAnimation = true;
          openingAnimationStartTime = Date.now();
        }
      }
    }, animationDuration + 500); // Add a little buffer
    
  } catch (error) {
    alert(error.message || 'An error occurred');
    console.error('Error playing game:', error);
  } finally {
    // Re-enable play button
    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
  }
}

// Update the updateAnimation function to update balance after animation completes
function updateAnimation() {
  if (isAnimating) {
    // Calculate progress based on time
    const currentTime = Date.now();
    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Apply easing function for smooth animation
    const easedProgress = easeInOutQuart(progress);
    
    // Update scroll offset based on eased progress
    scrollOffset = initialScrollOffset + (targetScrollOffset - initialScrollOffset) * easedProgress;
    
    // Check if animation is complete
    if (progress >= 1) {
      // Animation complete
      scrollOffset = targetScrollOffset;
      isAnimating = false;
      
      // Start opening animation for winning case
      if (winningCase) {
        openingAnimation = true;
        openingAnimationStartTime = Date.now();
        
        if (winningCase.value > 0) {
          console.log(`You won: ${winningCase.value}`);
        } else {
          console.log('Better luck next time!');
        }
      }
    }
  }
  
  // Update opening animation for winning case
  if (openingAnimation && winningCase) {
    const currentTime = Date.now();
    const elapsed = currentTime - openingAnimationStartTime;
    const progress = Math.min(elapsed / openingAnimationDuration, 1);
    
    // Phase 1: Squeeze animation (0-20% of animation)
    if (progress < 0.2) {
      const squeezeProgress = progress / 0.2; // Normalize to 0-1
      // Squeeze horizontally only, not vertically
      winningCase.scaleX = 1 - 0.2 * Math.sin(squeezeProgress * Math.PI);
      winningCase.scaleY = 1;
    } 
    // Phase 2: Open case (20-40% of animation)
    else if (progress < 0.4) {
      // Reset scales and mark as opened
      winningCase.scaleX = 1;
      winningCase.scaleY = 1;
      winningCase.opened = true;
    }
    // Phase 3: Gem floating animation (40-100% of animation)
    else {
      const gemProgress = (progress - 0.4) / 0.6; // Normalize to 0-1
      // Use easeOutBounce for a nice bouncing effect
      const easedGemProgress = easeOutBounce(gemProgress);
      // Float up to 30% of the case height
      winningCase.gemOffset = -winningCase.height * 0.15 * easedGemProgress;
    }
    
    // Check if opening animation is complete
    if (progress >= 1) {
      openingAnimation = false;
      
      // Add the case to history
      if (winningCase) {
        // Start history animation
        isHistoryAnimating = true;
        historyAnimationProgress = 0;
        
        // Add new item to history
        const newHistoryItem = {
          type: winningCase.type,
          value: winningCase.value
        };
        
        // Add to beginning of array and maintain max length
        caseHistory.unshift(newHistoryItem);
        if (caseHistory.length > MAX_HISTORY_ITEMS) {
          caseHistory.pop();
        }
        
        // Animate history
        const historyAnimDuration = 300; // 300ms animation
        const historyStartTime = performance.now();
        
        function animateHistory() {
          const now = performance.now();
          const progress = Math.min((now - historyStartTime) / historyAnimDuration, 1);
          
          // Update animation progress
          historyAnimationProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          
          if (progress < 1) {
            requestAnimationFrame(animateHistory);
          } else {
            isHistoryAnimating = false;
            
            // Now that all animations are complete, update balance with the final amount from server
            updateBalanceDisplay(currentGameResult);
          }
        }
        
        // Start history animation
        requestAnimationFrame(animateHistory);
      } else {
        // If there's no history animation (shouldn't happen), still update the balance
        updateBalanceDisplay(currentGameResult);
      }
    }
  }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
  // Initialize game first
  initGame();
  
  // Just set the attributes without modifying the value
  // This avoids the multiple visual updates
  const betAmountInput = document.getElementById('betAmount');
  if (betAmountInput) {
    const currency = getCurrency();
    if (currency === 'USD') {
      betAmountInput.min = "0.10";
      betAmountInput.max = "1000";
      betAmountInput.step = "0.10";
      // Don't modify the value here - it's already set in HTML
    } else { // LBP
      betAmountInput.min = "10000";
      betAmountInput.max = "1000000000";
      betAmountInput.step = "10000";
      // For LBP, we do need to reset to minimum
      betAmountInput.value = "10000";
    }
  }
});
