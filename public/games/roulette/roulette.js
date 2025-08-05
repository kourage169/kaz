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




const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas for high-DPI screens
function resizeCanvas() {
    const scale = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;

    ctx.setTransform(scale, 0, 0, scale, 0, 0); // Normalize drawing scale

    // Update wheel dimensions
    updateWheelDimensions();
    
    // Update ball constants after wheel dimensions change
    initializeBallConstants();
    
    // Redraw the wheel after resize
    drawWheel();
}

// Calculate wheel dimensions based on canvas size
function updateWheelDimensions() {
    // Make wheel responsive to the smaller canvas dimension
    const minDimension = Math.min(canvas.clientWidth, canvas.clientHeight);
    
    // Use 40% of the minimum dimension for the wheel diameter
    radius = minDimension * 0.4;
    
    // Center the wheel in the canvas
    centerX = canvas.clientWidth / 2;
    centerY = canvas.clientHeight / 2;
}

// Add resize event listener
window.addEventListener('resize', resizeCanvas);

////////////////////////////////////// BET TABLE ////////////////////////////////////////////////////

// Update the currentBets object structure to hold chip values and counts
// Example: { "red": { total: 5, chips: [{ value: 1, currency: "USD" }, { value: 1, currency: "USD" }, { value: 3, currency: "USD" }] } }
const currentBets = {};

// Calculate the total bet amount across all bet positions
function calculateTotalBetAmount() {
  let total = 0;
  
  for (const betKey in currentBets) {
    total += currentBets[betKey].total;
  }
  
  return total;
}

// Keep track of chip placement history for undo functionality
const chipPlacementHistory = [];

// Update the bet amount display
function updateBetAmountDisplay() {
  const currency = document.getElementById('currency').value;
  const totalAmount = calculateTotalBetAmount();
  
  // Format with currency symbol and commas for thousands
  if (currency === 'USD') {
    document.getElementById('betAmount').value = '$' + formatNumberWithCommas(totalAmount.toFixed(2));
  } else {
    document.getElementById('betAmount').value = '£' + formatNumberWithCommas(totalAmount.toFixed(0));
  }
}

// Helper function to format numbers with commas
function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to place a chip on a bet position
function placeChip(betPosition, chipValue, chipCurrency, chipImageSrc) {
  console.log(`Placing chip on position: "${betPosition}", value: ${chipValue}, currency: ${chipCurrency}`);
  
  // Ensure numeric bets are stored as numbers
  let betKey = betPosition;
  
  // Check if the bet position is a pure number (0, 1, 2, etc.) and convert to a number
  if (!isNaN(parseInt(betPosition)) && /^\d+$/.test(betPosition)) {
    betKey = parseInt(betPosition);
    console.log(`Converting numeric bet position "${betPosition}" to number ${betKey}`);
  } else {
    console.log(`Using string bet position: "${betPosition}"`);
  }
  
  // Initialize the bet position if it doesn't exist
  if (!currentBets[betKey]) {
    currentBets[betKey] = {
      total: 0,
      chips: []
    };
  }
  
  // Add the chip value to the total
  currentBets[betKey].total += chipValue;
  
  // Add the chip to the array
  currentBets[betKey].chips.push({
    value: chipValue,
    currency: chipCurrency
  });
  
  // Create the visual chip element
  const betElement = document.querySelector(`[data-bet="${betPosition}"]`);
  if (!betElement) {
    console.error(`Could not find element with data-bet="${betPosition}"`);
    return;
  }
  
  console.log(`Found bet element:`, betElement);
  
  // Create container for placed chips if it doesn't exist
  let chipsContainer = betElement.querySelector('.placed-chips-container');
  if (!chipsContainer) {
    chipsContainer = document.createElement('div');
    chipsContainer.className = 'placed-chips-container';
    betElement.appendChild(chipsContainer);
    console.log(`Created new chips container for position ${betPosition}`);
  }
  
  // Create the chip element
  const chipElement = document.createElement('div');
  chipElement.className = 'placed-chip';
  
  // Create the chip image
  const chipImg = document.createElement('img');
  chipImg.src = chipImageSrc;
  chipImg.alt = `${chipValue} Chip`;
  chipElement.appendChild(chipImg);
  
  // Create the chip value text
  const chipText = document.createElement('span');
  chipText.textContent = chipValue >= 1000 ? `${(chipValue / 1000).toFixed(0)}K` : chipValue;
  chipElement.appendChild(chipText);
  
  // Add the chip to the container
  chipsContainer.appendChild(chipElement);
  console.log(`Added chip to container for position ${betPosition}`);
  
  // Add to placement history for undo functionality
  chipPlacementHistory.push({
    betKey,
    betPosition,
    chipValue,
    chipElement,
    chipsContainer
  });
  
  // Update the bet amount display with formatted value
  updateBetAmountDisplay();
  
  // Enable undo button since we now have a chip to undo
  document.getElementById('undoBtn').disabled = false;
  
  console.log('Current bets:', currentBets);
}

// Function to undo the last chip placement
function undoLastChip() {
  // If no chips placed, do nothing
  if (chipPlacementHistory.length === 0) {
    return;
  }
  
  // Get the last placed chip from history
  const lastPlacement = chipPlacementHistory.pop();
  
  // Remove the chip visually
  lastPlacement.chipElement.remove();
  
  // If container is now empty, remove it too
  if (lastPlacement.chipsContainer.childNodes.length === 0) {
    lastPlacement.chipsContainer.remove();
  }
  
  // Update the bet data
  if (currentBets[lastPlacement.betKey]) {
    // Subtract the chip value from the total
    currentBets[lastPlacement.betKey].total -= lastPlacement.chipValue;
    
    // Remove the last chip from the array
    currentBets[lastPlacement.betKey].chips.pop();
    
    // If no more chips on this position, delete the bet
    if (currentBets[lastPlacement.betKey].chips.length === 0) {
      delete currentBets[lastPlacement.betKey];
    }
  }
  
  // Update the bet amount display with formatted value
  updateBetAmountDisplay();
  
  // Disable undo button if no more chips to undo
  if (chipPlacementHistory.length === 0) {
    document.getElementById('undoBtn').disabled = true;
  }
  
  console.log('Current bets after undo:', currentBets);
}

// Function to clear all chips from the table
function clearAllChips() {
  // Remove all chip elements
  document.querySelectorAll('.placed-chips-container').forEach(container => {
    container.remove();
  });
  
  // Clear the bets object
  for (const key in currentBets) {
    delete currentBets[key];
  }
  
  // Clear the placement history
  chipPlacementHistory.length = 0;
  
  // Disable undo button since there are no chips to undo
  document.getElementById('undoBtn').disabled = true;
  
  // Reset the bet amount display with currency
  const currency = document.getElementById('currency').value;
  if (currency === 'USD') {
    document.getElementById('betAmount').value = '$' + formatNumberWithCommas(selectedChipValue.toFixed(2));
  } else {
    document.getElementById('betAmount').value = '£' + formatNumberWithCommas(selectedChipValue.toFixed(0));
  }
}

// Add the Clear button to the betting table container
document.querySelector('.game-container').insertAdjacentHTML('beforeend', `
  <button id="clearBetsBtn" class="clear-bets-btn">
    <span>Clear</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
    </svg>
  </button>
  
  <button id="undoBtn" class="undo-btn" disabled>
    <span>Undo</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 14L4 9l5-5"/>
      <path d="M4 9h16"/>
    </svg>
  </button>
`);

// Add event listener to the clear button
document.getElementById('clearBetsBtn').addEventListener('click', clearAllChips);

// Add event listener to the undo button
document.getElementById('undoBtn').addEventListener('click', undoLastChip);

// Make sure all bet positions are clickable
function addClickHandlersToAllBetPositions() {
  console.log('Adding click handlers to all bet positions');
  
  // Remove any existing click handlers first to avoid duplicates
  document.querySelectorAll('.bet-button, .number-tile').forEach(button => {
    const clone = button.cloneNode(true);
    button.parentNode.replaceChild(clone, button);
  });
  
  // Add new click handlers to all bet positions
  document.querySelectorAll('.bet-button, .number-tile').forEach(button => {
    if (!button.dataset.bet) {
      console.warn('Button missing data-bet attribute:', button);
      return;
    }
    
    button.addEventListener('click', (event) => {
      const betKey = button.dataset.bet;
      console.log(`Clicked on bet position: ${betKey}, element:`, button);
      
      // Make sure a chip is selected
      if (!selectedChip) {
        console.warn('No chip selected');
        return;
      }
      
      // Get the selected chip's value, currency, and image
      const chipValue = parseFloat(selectedChip.dataset.value);
      const chipCurrency = selectedChip.dataset.currency;
      const chipImage = selectedChip.querySelector('img').src;
      
      // Place the chip on the bet position
      placeChip(betKey, chipValue, chipCurrency, chipImage);
      
      // Prevent event bubbling
      event.stopPropagation();
    });
  });
  
  console.log('Click handlers added to', document.querySelectorAll('.bet-button, .number-tile').length, 'elements');
}

// Initialize the DOM for betting table
function initializeBettingTable() {
  console.log('Initializing betting table');
  
  // Create number tiles and add them to the grid
  const numberGrid = document.querySelector('.number-grid');
  const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  
  // Clear any existing tiles
  numberGrid.innerHTML = '';
  
  // Create tiles 1-36
  for (let i = 1; i <= 36; i++) {
    const tile = document.createElement('div');
    tile.classList.add('number-tile');
    tile.classList.add('bet-position'); // Add bet-position class immediately
    tile.dataset.bet = i.toString(); // Explicitly convert to string
    tile.textContent = i.toString();
  
    if (redNumbers.has(i)) {
      tile.classList.add('red');
    } else {
      tile.classList.add('black');
    }
  
    numberGrid.appendChild(tile);
    console.log(`Created number tile ${i} with data-bet="${tile.dataset.bet}"`);
  }
  
  // Make sure zero tile has the bet-position class and correct data-bet
  const zeroTile = document.querySelector('.number-tile.zero');
  if (zeroTile) {
    zeroTile.classList.add('bet-position');
    zeroTile.dataset.bet = "0"; // Ensure zero has the correct data-bet
    console.log('Updated zero tile with data-bet="0"');
  } else {
    console.error('Zero tile not found');
  }
  
  // Add bet-position class to all bet buttons as well
  document.querySelectorAll('.bet-button').forEach(el => {
    el.classList.add('bet-position');
    console.log(`Added bet-position class to button with data-bet="${el.dataset.bet}"`);
  });
  
  // Now add click handlers to all bet positions
  addClickHandlersToAllBetPositions();
}

// Call the initialization function
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeBettingTable();
    debugLogBetPositions();
  });
} else {
  initializeBettingTable();
  debugLogBetPositions();
}

// Debug function to log all bet positions
function debugLogBetPositions() {
  console.log('=== DEBUG: All Bet Positions ===');
  document.querySelectorAll('.bet-position').forEach((el, index) => {
    console.log(`${index + 1}. Element: ${el.tagName}.${Array.from(el.classList).join('.')}, data-bet="${el.dataset.bet}"`);
  });
  
  console.log('=== DEBUG: Number Tiles ===');
  document.querySelectorAll('.number-tile').forEach((el, index) => {
    console.log(`${index + 1}. Number Tile: ${el.textContent}, data-bet="${el.dataset.bet}", classes="${Array.from(el.classList).join(' ')}"`);
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////



// Initialize variables (will be updated in updateWheelDimensions)
let radius;
let centerX;
let centerY;
let rotationAngle = 0;

// European roulette wheel number sequence
const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
  27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26
];

// History of winning numbers (most recent first)
const winningHistory = [];
const MAX_HISTORY_ITEMS = 5;

// Function to add a number to the history
function addToHistory(number) {
  // Add to the beginning of the array
  winningHistory.unshift(number);
  
  // Keep only the most recent MAX_HISTORY_ITEMS
  if (winningHistory.length > MAX_HISTORY_ITEMS) {
    winningHistory.pop();
  }
  
  // Update the history display
  updateHistoryDisplay();
}

// Function to update the history display
function updateHistoryDisplay() {
  const historyResults = document.getElementById('historyResults');
  if (!historyResults) return;
  
  // Clear the current history display
  historyResults.innerHTML = '';
  
  // Add each history item
  winningHistory.forEach(number => {
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${getHistoryItemClass(number)}`;
    historyItem.textContent = number;
    historyResults.appendChild(historyItem);
  });
}

// Function to determine the class for a history item based on the number
function getHistoryItemClass(number) {
  if (number === 0) return 'green';
  
  const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36
  ];
  
  return redNumbers.includes(number) ? 'red' : 'black';
}

// Determine color for each number
function getColor(number) {
    if (number === 0) return '#2d7437'; // Custom green
    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18,
      19, 21, 23, 25, 27, 30, 32, 34, 36
    ];
    return redNumbers.includes(number) ? '#c8092d' : '#20313d'; // Custom red / black
  }





  // Number grid creation is now handled by initializeBettingTable()




// ────────────────────────────────────────────────────────────────────────────
// Ball State & Constants
// ────────────────────────────────────────────────────────────────────────────

let ballPhase = 'none';           // 'none' | 'outer' | 'falling' | 'inner'
let ballAngle = 0;                // current angle of the ball (radians)
let ballAngularVelocity = 0;      // angular speed (radians/frame)
let ballRadius = 0;               // current radial distance from center
let isStuckToWheel = false;       // true once settled into target segment
let targetNumberIndex = 0;        // index of winning segment (0..SEGMENT_COUNT−1)
let stuckOffsetAngle = 0;         // offset so ball "sticks" to rotating wheel

let ballX = 0;
let ballY = 0;
let ballZ = 0;                    // height above the wheel plane
let ballVZ = 0;                   // vertical velocity

// Physics constants
const BASE_BALL_SIZE = 10;  // Base size that will be scaled
let BALL_SIZE = BASE_BALL_SIZE;  // Will be updated in initializeBallConstants
const OUTER_FRICTION = 0.992;     // friction on outer edge (higher = less friction)
const INNER_FRICTION = 0.985;     // friction on inner edge
const GRAVITY = 0.08;             // vertical gravity
const BOUNCE_DAMPING = 0.9;       // energy retained after bounce
const OUTER_PHASE_FRAMES = 120; // Fixed value for outer phase frames
const FALL_SPEED = 8;           // how fast the ball falls (higher = faster)
const CEILING_BOUNCE_DAMPING = 0.7; // energy retained when hitting ceiling
const BALL_RIM_OFFSET = 4;        // fine-tune the ball's position on the inner rim (increased to ensure ball stays outside)

// Path recording
let pathRecording = false;        // Whether we're recording paths
let recordedPaths = [];           // Array to store recorded paths

// Segment constants
const SEGMENT_COUNT = numbers.length;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

let outerBallRadius, innerBallRadius;

// Add this with other state variables
let frameCount = 0;
let currentOuterPhaseFrames = OUTER_PHASE_FRAMES; // Track the current spin's outer phase frames

function initializeBallConstants() {
  const scaleFactor = radius / 250;
  outerBallRadius = radius - (-20 * scaleFactor);
  innerBallRadius = radius - (95 * scaleFactor);
  BALL_SIZE = BASE_BALL_SIZE * scaleFactor;  // Scale the ball size
  ballRadius = outerBallRadius;
  ballX = centerX + ballRadius * Math.cos(ballAngle);
  ballY = centerY + ballRadius * Math.sin(ballAngle);
}
initializeBallConstants();

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

function normalizeAngle(angle) {
  return (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
}

function smallestAngleDiff(a, b) {
  const diff = normalizeAngle(a - b);
  return diff > Math.PI ? diff - 2 * Math.PI : diff;
}

// ────────────────────────────────────────────────────────────────────────────
// Trigger Ball Spin
// ────────────────────────────────────────────────────────────────────────────

// Example paths for different numbers (will be populated by recordPathsForAllNumbers)
const roulettePaths = {
  // The path we know works for testing
  0: { initialAngle: 4.0307811203308, initialVelocity: 0.22999430561133852 }
  // More paths will be added through the recordPathsForAllNumbers function
};

function spinBall(targetIndex, customParams = null) {
  if (ballPhase !== 'none') return;

  // Reset all timers and counters to ensure consistent start state
  animateWheel.lastTime = null;
  spinBall.startTime = performance.now();
  spinBall.bounceCount = 0;
  frameCount = 0;  // Reset frame counter
  
  isStuckToWheel = false;
  ballPhase = 'outer';
  
  // Use the target number index
  targetNumberIndex = targetIndex;
  
  // Use custom parameters if provided, otherwise use defaults with random variations
  let initialAngle, initialVelocity, outerFrames;
  
  if (customParams) {
    initialAngle = customParams.initialAngle;
    initialVelocity = customParams.initialVelocity;
    currentOuterPhaseFrames = customParams.outerPhaseFrames || 120;
    console.log(`Using provided path: Angle: ${initialAngle.toFixed(6)}, Velocity: ${initialVelocity.toFixed(6)}, OuterPhaseFrames: ${currentOuterPhaseFrames}`);
  } else {
    // Base values that we know work
    const baseAngle = 4.0307811203308;
    const baseVelocity = 0.22999430561133852;
    
    // Create small random variations to try to get different numbers
    const angleVar = (Math.random() * 0.4 - 0.2);  // Random value between -0.2 and 0.2
    const velocityVar = (Math.random() * 0.04 - 0.02);  // Random value between -0.02 and 0.02
    
    // Always use 120 frames for outer phase
    currentOuterPhaseFrames = 120;
    
    initialAngle = baseAngle + angleVar;
    initialVelocity = Math.abs(baseVelocity + velocityVar); // Make sure velocity is positive for clockwise rotation
    console.log(`Using variation: Angle: ${initialAngle.toFixed(6)}, Velocity: ${initialVelocity.toFixed(6)}, OuterPhaseFrames: ${currentOuterPhaseFrames}`);
  }
  
  ballAngle = initialAngle;
  ballAngularVelocity = initialVelocity;
  
  ballRadius = outerBallRadius - BALL_SIZE/2;
  
  // Set a fixed initial wheel rotation (multiple of SEGMENT_ANGLE to align with segments)
  rotationAngle = 0;
  
  // Reset vertical position and velocity
  ballZ = 0;
  ballVZ = 0;
  
  // Calculate ball position
  ballX = centerX + ballRadius * Math.cos(ballAngle);
  ballY = centerY + ballRadius * Math.sin(ballAngle);
  
  // Record initial conditions if we're recording paths
  if (pathRecording) {
    spinBall.recordedPath = {
      initialAngle: ballAngle,
      initialVelocity: ballAngularVelocity,
      outerPhaseFrames: currentOuterPhaseFrames,
      timestamp: Date.now(),
      landingNumber: null // Will be filled when the ball lands
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Update Ball: Called Every Frame
// ────────────────────────────────────────────────────────────────────────────

function updateBall(deltaTime) {
  if (ballPhase === 'none') return;

  // Use fixed time step for deterministic physics
  const dt = 1/60;  // Fixed time step instead of using deltaTime
  
  // Increment frame counter for deterministic phase transitions
  if (ballPhase === 'outer') {
    frameCount++;
  }
  
  // Update position based on current phase
  switch (ballPhase) {
    case 'outer': {
      // Spin on outer edge with friction
      ballAngle += ballAngularVelocity * dt * 60; // Changed from -= to += to reverse direction
      ballAngularVelocity *= Math.pow(OUTER_FRICTION, dt * 60);
      
      // Keep radius fixed at outer edge
      ballRadius = outerBallRadius - BALL_SIZE/2;
      
      // After specified number of frames, transition to falling phase
      if (frameCount >= currentOuterPhaseFrames) {
        ballPhase = 'falling';
        // Store the angle at which the ball starts falling
        spinBall.fallAngle = ballAngle;
      }
      break;
    }
    
    case 'falling': {
      // Keep angle fixed during falling (no sine wave movement)
      ballAngle = spinBall.fallAngle;
      
      // Move inward at constant speed
      ballRadius -= FALL_SPEED * dt * 60;
      
      // When reaching inner rim, transition to inner phase
      if (ballRadius <= innerBallRadius + BALL_SIZE/2) {
        // Position the ball exactly on the inner rim circle
        ballRadius = innerBallRadius + BALL_SIZE/2;
        ballPhase = 'inner';
        // Fixed upward velocity on first impact
        ballVZ = 1.5;
      }
      break;
    }
    
    case 'inner': {
      // Apply gravity to vertical motion
      ballVZ -= GRAVITY * dt * 60;
      ballZ += ballVZ * dt * 60;
      
      // Bounce off the circular floor (inner rim)
      if (ballZ <= 0) {
        ballZ = 0;
        
        // Only bounce if coming down with enough velocity
        if (ballVZ < -0.3) {
          ballVZ = -ballVZ * BOUNCE_DAMPING;
          // No random variation on bounce
          spinBall.bounceCount++;
        } else {
          ballVZ = 0;
        }
      }
      
      // Calculate the current radius based on ball's vertical position
      const scaleFactor = radius / 250;
      const heightFactor = Math.min(ballZ * 0.1, 1);
      const currentRadius = innerBallRadius + BALL_SIZE/2 + 
                           ((outerBallRadius - innerBallRadius - BALL_SIZE) * heightFactor);
      
      // Apply the calculated radius
      ballRadius = currentRadius;
      
      // Check if the ball hits the "ceiling" (outer rim's bottom edge)
      const outerRimBottom = outerBallRadius - (40 * scaleFactor);  // Use bottom edge of outer rim
      if (ballRadius >= outerRimBottom) {
        ballRadius = outerRimBottom;
        
        // Only bounce if moving outward with enough velocity
        if (ballVZ > 0.1) {
          ballVZ = -ballVZ * BOUNCE_DAMPING;
          spinBall.bounceCount++;
        } else {
          ballVZ = 0.01;
        }
      }
      
      // Update angle (spin) with friction
      ballAngle += ballAngularVelocity * dt * 60; // Changed from -= to += to reverse direction
      ballAngularVelocity *= Math.pow(INNER_FRICTION, dt * 60);
      
      // Check if ball has almost stopped
      if (Math.abs(ballAngularVelocity) < 0.01 && ballZ === 0 && spinBall.bounceCount >= 3) {
        // Get the current segment the ball is in
        const relativeAngle = normalizeAngle(ballAngle - rotationAngle);
        const segmentIndex = Math.floor(relativeAngle / SEGMENT_ANGLE);
        
        // Ball has naturally landed on a number
        ballPhase = 'none';
        isStuckToWheel = true;
        
        // Store the segment index we landed in
        spinBall.landedSegmentIndex = segmentIndex;
        
        // If we're recording paths, save the landing number
        if (pathRecording && spinBall.recordedPath) {
          spinBall.recordedPath.landingNumber = numbers[segmentIndex];
          recordedPaths.push(spinBall.recordedPath);
          console.log('Path recorded:', spinBall.recordedPath);
          console.log(`Total paths recorded: ${recordedPaths.length}`);
          
          // Optional: Save to localStorage periodically
          if (recordedPaths.length % 5 === 0) {
            saveRecordedPaths();
          }
        }
        
        // If we're not recording, check if we landed on the target
        if (!pathRecording) {
          const landedNumber = numbers[segmentIndex];
          console.log(`Ball landed on: ${landedNumber}, Target was: ${numbers[targetNumberIndex]}`);
        }
      }
      break;
    }
  }
  
  // If ball is stuck to wheel, update its position to stay in the winning segment
  if (isStuckToWheel) {
    // Calculate the center angle of our segment
    const segmentCenterAngle = spinBall.landedSegmentIndex * SEGMENT_ANGLE + (SEGMENT_ANGLE / 2);
    // Position the ball at the center of its segment, accounting for wheel rotation
    ballAngle = rotationAngle + segmentCenterAngle;
    // Keep the ball on the inner rim
    ballRadius = innerBallRadius + BALL_SIZE/2;
    ballZ = 0;
  }
  
  // Update ball position
  ballX = centerX + ballRadius * Math.cos(ballAngle);
  ballY = centerY + ballRadius * Math.sin(ballAngle);
}



// ────────────────────────────────────────────────────────────────────────────
// Optional: Check for Bounces on Inner Rim Dividers (Cosmetic)
// ────────────────────────────────────────────────────────────────────────────

function checkInnerBounces() {
  const relativeAngle = normalizeAngle(ballAngle - rotationAngle);
  const segIndex = Math.floor(relativeAngle / SEGMENT_ANGLE);
  const segStart = segIndex * SEGMENT_ANGLE;
  const segCenter = segStart + SEGMENT_ANGLE / 2;

  const angleDiff = Math.abs(smallestAngleDiff(relativeAngle, segCenter));
  const closeToEdge = angleDiff > (SEGMENT_ANGLE / 2 - 0.01);

  if (closeToEdge) {
    ballAngularVelocity *= -BOUNCE_DAMPING;
    settleBounceCount++;
  }
}


// ────────────────────────────────────────────────────────────────────────────
// 6) drawBall(): render the ball with shadow
// ────────────────────────────────────────────────────────────────────────────

function drawBall() {
  // If ball is stuck to wheel, don't draw it here (it's drawn in drawWheel)
  if (isStuckToWheel) return;

  // Calculate direction from center to ball
  const dx = ballX - centerX;
  const dy = ballY - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // Shadow (offset based on height)
  const shadowOffset = Math.min(ballZ * 0.5, 10);
  ctx.beginPath();
  ctx.arc(ballX + shadowOffset * 0.5, ballY + shadowOffset * 0.5, BALL_SIZE, 0, 2 * Math.PI);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.1, 0.3 - ballZ * 0.02)})`;
  ctx.fill();

  // Ball (offset vertically by ballZ)
  ctx.beginPath();
  // Only offset the ball vertically when bouncing
  ctx.arc(ballX, ballY - ballZ, BALL_SIZE, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}


// ────────────────────────────────────────────────────────────────────────────
// 7) animateWheel(): update wheel rotation & ball, then render
// ────────────────────────────────────────────────────────────────────────────

// Add this with other constants at the top
const WHEEL_ROTATION_SPEED = -0.008; // Changed to negative for clockwise rotation

function animateWheel() {
  // Use fixed time step for deterministic physics
  const dt = 1/60;  // Fixed time step instead of using deltaTime

  // Use fixed rotation speed
  rotationAngle += WHEEL_ROTATION_SPEED;
  rotationAngle = normalizeAngle(rotationAngle);

  // Update ball physics after wheel rotation
  updateBall(dt);

  // Clear & draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWheel();
  drawBall();

  // Loop
  requestAnimationFrame(animateWheel);
}


// ────────────────────────────────────────────────────────────────────────────
// 8) init(): set up canvas, handle resize, start animation loop
// ────────────────────────────────────────────────────────────────────────────

function init() {
  resizeCanvas();            // your function to size canvas + compute centerX/centerY/radius
  window.addEventListener('resize', resizeCanvas);
  initializeBallConstants(); // recalc any radii if canvas resized
  animateWheel();
}

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

////////////////////////////////////////////// DRAW WHEEL ///////////////////////////////////////////////////////

  // Draw the roulette wheel
  function drawWheel() {
    const segmentAngle = (2 * Math.PI) / numbers.length;
    
    // Calculate scale factor based on original radius of 250
    const scaleFactor = radius / 250;
  
    ctx.save();
    ctx.translate(centerX, centerY);
    // Remove global rotation. We'll apply it per segment.
    ctx.translate(-centerX, -centerY);
  
    // Draw outer rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + (40 * scaleFactor), 0, 2 * Math.PI);
    ctx.fillStyle = '#05191f';
    ctx.fill();
  
    // Draw segments
    for (let i = 0; i < numbers.length; i++) {
        const startAngle = rotationAngle + i * SEGMENT_ANGLE;
        const endAngle = startAngle + SEGMENT_ANGLE;
  
        ctx.save();
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = getColor(numbers[i]);
        ctx.fill();
  
        // Draw number
        const angle = startAngle + SEGMENT_ANGLE / 2;
        const textRadius = radius - (30 * scaleFactor);
        const x = centerX + textRadius * Math.cos(angle);
        const y = centerY + textRadius * Math.sin(angle);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = `${16 * scaleFactor}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numbers[i].toString(), 0, 0);
        ctx.restore();
  
        // If this is the segment where the ball landed, draw the ball here
        if (isStuckToWheel && i === spinBall.landedSegmentIndex) {
          // Calculate ball position in segment
          const segmentCenterAngle = startAngle + SEGMENT_ANGLE / 2;
          
          // Move to wheel center and apply rotation
          ctx.save();
          ctx.translate(centerX, centerY);
          
          // Calculate ball position slightly higher on inner rim edge
          const ballOffsetRadius = radius - (100 * scaleFactor) + (BALL_SIZE/2) + 4;  // Added +2 to move it slightly higher
          const ballX = ballOffsetRadius * Math.cos(segmentCenterAngle);
          const ballY = ballOffsetRadius * Math.sin(segmentCenterAngle);
          
          // Draw ball shadow
          ctx.beginPath();
          ctx.arc(ballX + 2, ballY + 2, BALL_SIZE, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
  
          // Draw ball
          ctx.beginPath();
          ctx.arc(ballX, ballY, BALL_SIZE, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          ctx.restore();
        }
  
        ctx.restore();
    }
  
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - (100 * scaleFactor), 0, 2 * Math.PI);
    ctx.fillStyle = '#05191f';
    ctx.fill();
  
    // Apply rotation to the entire handle/legs section
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // === Simple Solid Golden Handle === (scaled from original sizes)
    const outerRadius = 22 * scaleFactor;
    const innerRadius = 10 * scaleFactor;
  
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffb82e';
    ctx.fill();
  
    ctx.beginPath();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  
    // === Handle Legs === (all measurements scaled)
    const legLength = 80 * scaleFactor;
    const baseWidth = 14 * scaleFactor;
    const tipWidth = 4 * scaleFactor;
    const tipRadius = 6 * scaleFactor;
    const numLegs = 4;
  
    for (let i = 0; i < numLegs; i++) {
      const angle = (2 * Math.PI / numLegs) * i;
      const startX = centerX + innerRadius * Math.cos(angle);
      const startY = centerY + innerRadius * Math.sin(angle);
      const endX = centerX + legLength * Math.cos(angle);
      const endY = centerY + legLength * Math.sin(angle);
      const perpAngle = angle + Math.PI / 2;
      const offsetXBase = (baseWidth / 2) * Math.cos(perpAngle);
      const offsetYBase = (baseWidth / 2) * Math.sin(perpAngle);
      const offsetXTip = (tipWidth / 2) * Math.cos(perpAngle);
      const offsetYTip = (tipWidth / 2) * Math.sin(perpAngle);
  
      const p1x = startX + offsetXBase;
      const p1y = startY + offsetYBase;
      const p2x = endX + offsetXTip;
      const p2y = endY + offsetYTip;
      const p3x = endX - offsetXTip;
      const p3y = endY - offsetYTip;
      const p4x = startX - offsetXBase;
      const p4y = startY - offsetYBase;
  
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p4x, p4y);
      ctx.closePath();
      ctx.fillStyle = '#ffb82e';
      ctx.fill();
  
      ctx.beginPath();
      ctx.arc(endX, endY, tipRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffb82e';
      ctx.fill();
    }

    // Restore context after handle rotation
    ctx.restore();
  
    ctx.restore();
  }

//////////////////////////////////////////////////// PLAY BUTTON //////////////////////////////////////////////////////
  
// Add click handler for the play button
document.getElementById('playBtn').addEventListener('click', async () => {
  console.log('Play button clicked');

  const currency = document.getElementById('currency').value;

  const betKeys = Object.keys(currentBets);
  if (betKeys.length === 0) {
    alert('Please place a bet first.');
    return;
  }

  // Get the total bet amount and all bets
  const totalBetAmount = calculateTotalBetAmount();
  const bets = {};
  
  // Format all bets for the API
  for (const betKey in currentBets) {
    bets[betKey] = currentBets[betKey].total;
  }
  
  console.log('Sending bets to server:', bets);
  console.log('Detailed bet information:');
  for (const key in bets) {
    console.log(`Key: "${key}" | Type: ${typeof key} | Value: ${bets[key]}`);
  }

  if (totalBetAmount <= 0) {
    alert('Invalid bet amount.');
    return;
  }

  // Check if the user has enough balance for the bet using the new navbar structure
  let currentBalance = 0;
  const selectedBalance = document.getElementById('selected-balance');
  if (selectedBalance) {
    // Extract the numeric value from the balance text
    currentBalance = parseFloat(selectedBalance.textContent.replace(/[^0-9.-]+/g, ''));
  }
  
  // Check if the user has enough balance
  if (currentBalance < totalBetAmount) {
    alert('Insufficient balance for this bet.');
    return;
  }
  
  // Update displayed balance (visual only)
  const newBalance = currentBalance - totalBetAmount;
  if (selectedBalance) {
    if (currency === 'USD') {
      selectedBalance.textContent = `$${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      selectedBalance.textContent = `£${newBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
  }

  try {
    // Make API call to the backend to get the spin result
    const response = await fetch('/games/roulette/spin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        betAmount: totalBetAmount,
        bets: bets,
        currency
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const result = await response.json();
    console.log('Spin result from server:', result);

    // Hide clear button and undo button during wheel animation
    document.getElementById('clearBetsBtn').style.display = 'none';
    document.getElementById('undoBtn').style.display = 'none';

    // Now that we have the server response, hide betting table and show wheel
    document.getElementById('betTable').style.display = 'none';
    document.getElementById('historyPanel').style.display = 'none';
    document.getElementById('rouletteWheel').style.display = 'block';
    // Immediately resize canvas and redraw the wheel now it's visible
    resizeCanvas();

    // Disable path recording for this spin
    pathRecording = false;
    
    // Call spinBall with the server-provided parameters
    if (result.spinPath) {
      // Pass the server path directly to spinBall
      spinBall(result.winningIndex, result.spinPath);
    } else {
      // Fallback to default parameters if no path is provided
      spinBall(result.winningIndex);
    }
    
    // Wait for the spin to complete
    const spinPromise = new Promise(resolve => {
      // Check every 100ms if the ball has stopped
      const checkInterval = setInterval(() => {
        if (ballPhase === 'none' && isStuckToWheel) {
          clearInterval(checkInterval);
          
          // Get the segment the ball landed on
          const relativeAngle = normalizeAngle(ballAngle - rotationAngle);
          const segmentIndex = Math.floor(relativeAngle / SEGMENT_ANGLE);
          const landedNumber = numbers[segmentIndex];
          
          console.log(`Ball landed on: ${landedNumber}`);
          resolve({ winningNumber: landedNumber, winningIndex: segmentIndex });
        }
      }, 100);
    });
    
    // Wait for the spin to complete
    const spinResult = await spinPromise;
    
    // Add the winning number to history
    addToHistory(spinResult.winningNumber);
    
    // Update balances with the final result from server using the new navbar structure
    if (result.newBalance !== undefined && result.newBalance !== null) {
      // Update the selected balance display
      if (selectedBalance) {
        if (currency === 'USD') {
          selectedBalance.textContent = `$${result.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
          selectedBalance.textContent = `£${result.newBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        }
      }
      
      // Update the dropdown items
      const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
      const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
      
      if (currency === 'USD' && usdDropdownItem) {
        usdDropdownItem.innerHTML = `
          <span class="amount-label">$${result.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="currency-label">USD</span>
        `;
      } else if (currency === 'LBP' && lbpDropdownItem) {
        lbpDropdownItem.innerHTML = `
          <span class="amount-label">£${result.newBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span class="currency-label">LBP</span>
        `;
      }
    }
    
    // No longer clearing chips, preserving them instead
    // clearAllChips();
    
    // Revert UI visibility after a short delay
    setTimeout(() => {
      // Revert UI visibility
      document.getElementById('betTable').style.display = 'flex'; // Use 'flex' instead of 'block' to match CSS
      document.getElementById('historyPanel').style.display = 'block';
      document.getElementById('rouletteWheel').style.display = 'none';
      // Show clear button and undo button again
      document.getElementById('clearBetsBtn').style.display = '';
      document.getElementById('undoBtn').style.display = '';
      
    }, 1000);

  } catch (err) {
    console.error('Spin error:', err);
    alert('Error during spin. Try again later.');

    // Revert UI visibility on error
    document.getElementById('betTable').style.display = 'flex'; // Use 'flex' instead of 'block' to match CSS
    document.getElementById('historyPanel').style.display = 'block';
    document.getElementById('rouletteWheel').style.display = 'none';
    // Show clear button and undo button again
    document.getElementById('clearBetsBtn').style.display = '';
    document.getElementById('undoBtn').style.display = '';
  }
});

  //////////////////////////////////////////////////////////////////////////

//////////// helper function to update balance ///////////////////
async function fetchBalances() {
  try {
    const res = await fetch('/api/user/balance');
    if (!res.ok) throw new Error('Failed to fetch balances');

    const data = await res.json();
    
    // Update dropdown items with new balance values
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
    
    if (usdDropdownItem) {
      usdDropdownItem.innerHTML = `
        <span class="amount-label">$${data.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span class="currency-label">USD</span>
      `;
    }
    
    if (lbpDropdownItem) {
      lbpDropdownItem.innerHTML = `
        <span class="amount-label">£${data.balanceLBP.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        <span class="currency-label">LBP</span>
      `;
    }
    
    // Update the selected balance display if needed
    const selectedCurrency = document.getElementById('currency').value;
    const selectedBalance = document.getElementById('selected-balance');
    if (selectedBalance) {
      if (selectedCurrency === 'USD') {
        selectedBalance.textContent = `$${data.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        selectedBalance.textContent = `£${data.balanceLBP.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      }
    }
  } catch (err) {
    console.error('Error fetching balances:', err);
  }
}

// Function to toggle path recording mode
function togglePathRecording() {
  pathRecording = !pathRecording;
  console.log(`Path recording ${pathRecording ? 'enabled' : 'disabled'}`);
  return pathRecording;
}

// Function to save recorded paths to localStorage
function saveRecordedPaths() {
  try {
    localStorage.setItem('roulettePaths', JSON.stringify(recordedPaths));
    console.log(`Saved ${recordedPaths.length} paths to localStorage`);
  } catch (err) {
    console.error('Error saving paths:', err);
  }
}

// Function to load recorded paths from localStorage
function loadRecordedPaths() {
  try {
    const paths = localStorage.getItem('roulettePaths');
    if (paths) {
      recordedPaths = JSON.parse(paths);
      console.log(`Loaded ${recordedPaths.length} paths from localStorage`);
    }
  } catch (err) {
    console.error('Error loading paths:', err);
  }
}

// Function to export recorded paths as JSON
function exportRecordedPaths() {
  const dataStr = JSON.stringify(recordedPaths, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'roulette_paths.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Load any previously recorded paths on startup
loadRecordedPaths();

// Add keyboard shortcut for toggling recording mode (Ctrl+Shift+R)
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    const isRecording = togglePathRecording();
    alert(`Path recording ${isRecording ? 'enabled' : 'disabled'}`);
  }
  
  // Export recorded paths (Ctrl+Shift+E)
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    exportRecordedPaths();
  }
});

// Function to record paths for all numbers
async function recordPathsForAllNumbers() {
  // Base values that we know work
  const baseAngle = 4.0307811203308;
  const baseVelocity = 0.22999430561133852;
  
  // Variations to try (create a grid of test values)
  const angleVariations = [];
  const velocityVariations = [];
  const outerPhaseFrames = 120; // Fixed value for outer phase frames
  
  // Create angle variations: 21 values from -0.2 to +0.2
  for (let i = -0.2; i <= 0.2; i += 0.02) {
    angleVariations.push(parseFloat(i.toFixed(3)));
  }
  
  // Create velocity variations: 21 values from -0.02 to +0.02
  for (let i = -0.02; i <= 0.02; i += 0.002) {
    velocityVariations.push(parseFloat(i.toFixed(4)));
  }
  
  // Enable path recording
  pathRecording = true;
  
  // Keep track of which numbers we've found paths for
  const foundNumbers = new Set();
  
  console.log(`Starting path recording for all numbers. Testing ${angleVariations.length * velocityVariations.length} combinations...`);
  
  // Try different combinations
  for (const angleVar of angleVariations) {
    // Skip if we've found paths for all numbers
    if (foundNumbers.size === numbers.length) break;
    
    for (const velVar of velocityVariations) {
      // Skip if we've found paths for all numbers
      if (foundNumbers.size === numbers.length) break;
      
      // Calculate new values
      const newAngle = baseAngle + angleVar;
      const newVelocity = Math.abs(baseVelocity + velVar); // Make sure velocity is positive for clockwise rotation
      
      // Override the standard values for recording
      const originalSpinBall = spinBall;
      spinBall = function(targetIndex) {
        // Call the original function first (to reset everything)
        originalSpinBall.call(this, targetIndex);
        
        // Then override with our test values
        ballAngle = newAngle;
        ballAngularVelocity = newVelocity;
        currentOuterPhaseFrames = outerPhaseFrames;
        
        // Update ball position after changing angle
        ballX = centerX + ballRadius * Math.cos(ballAngle);
        ballY = centerY + ballRadius * Math.sin(ballAngle);
      };
      
      // Start the spin
      spinBall(0);
      
      // Wait for the ball to land
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (ballPhase === 'none' && isStuckToWheel) {
            clearInterval(checkInterval);
            
            // Get the landed number
            const landedNumber = numbers[spinBall.landedSegmentIndex];
            
            // If we haven't recorded this number yet, save it
            if (!foundNumbers.has(landedNumber)) {
              foundNumbers.add(landedNumber);
              roulettePaths[landedNumber] = {
                initialAngle: newAngle,
                initialVelocity: newVelocity,
                outerPhaseFrames: outerPhaseFrames
              };
              console.log(`Found path for number ${landedNumber} - total: ${foundNumbers.size}/${numbers.length}`);
              console.log(`Angle: ${newAngle.toFixed(6)}, Velocity: ${newVelocity.toFixed(6)}, OuterPhaseFrames: ${outerPhaseFrames}`);
            }
            
            resolve();
          }
        }, 100);
      });
      
      // Wait a bit before next spin
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Restore original spinBall function
  spinBall = originalSpinBall;
  
  // Disable path recording
  pathRecording = false;
  
  // Output results
  console.log('Path recording complete!');
  console.log(`Found paths for ${foundNumbers.size}/${numbers.length} numbers`);
  
  // Generate code for all found paths
  let pathCode = `const roulettePaths = {\n`;
  Object.keys(roulettePaths).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
    const path = roulettePaths[num];
    pathCode += `  ${num}: { initialAngle: ${path.initialAngle.toFixed(16)}, initialVelocity: ${path.initialVelocity.toFixed(16)}, outerPhaseFrames: ${path.outerPhaseFrames} },\n`;
  });
  pathCode += `};\n`;
  
  console.log('Copy this code to use the paths:');
  console.log(pathCode);
  
  return roulettePaths;
}

// Add keyboard shortcut to start recording paths (Ctrl+Shift+P)
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'P') {
    recordPathsForAllNumbers();
  }
});

// Add after the existing bet button event listeners
// Initialize chip selection
let selectedChip = null;
let selectedChipValue = 1; // Default value

// Function to initialize chip selection
function initChipSelection() {
  const chips = document.querySelectorAll('.chip');
  
  // Select the first USD chip by default
  if (chips.length > 0) {
    const firstChip = document.querySelector('.usd-chip[data-value="1"]');
    if (firstChip) {
      firstChip.classList.add('selected');
      selectedChip = firstChip;
      selectedChipValue = parseFloat(firstChip.dataset.value);
      document.getElementById('betAmount').value = '$' + formatNumberWithCommas(selectedChipValue.toFixed(2));
    }
  }
  
  // Add click event listeners to all chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Remove selected class from all chips
      chips.forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked chip
      chip.classList.add('selected');
      selectedChip = chip;
      
      // Update selected chip value
      selectedChipValue = parseFloat(chip.dataset.value);
      
      // Only update bet amount if no bets have been placed
      if (Object.keys(currentBets).length === 0) {
        const currency = document.getElementById('currency').value;
        if (currency === 'USD') {
          document.getElementById('betAmount').value = '$' + formatNumberWithCommas(selectedChipValue.toFixed(2));
        } else {
          document.getElementById('betAmount').value = '£' + formatNumberWithCommas(selectedChipValue.toFixed(0));
        }
      }
      
      console.log(`Selected chip: ${selectedChipValue}`);
    });
  });
}

// Initialize chips when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initChipSelection();
  });
} else {
  initChipSelection();
}

// Initialize the history display when the page loads
document.addEventListener('DOMContentLoaded', () => {
  updateHistoryDisplay();
});

// ─── Sync currency selection between navbar and game controls ────────────────
function syncCurrencySelections() {
  // Get elements
  const currencySelect = document.getElementById('currency');
  const balanceBox = document.getElementById('balance-box');
  const selectedBalance = document.getElementById('selected-balance');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const dropdown = document.getElementById('balance-dropdown');
  
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      
      // Clear all existing bets when currency changes
      clearAllChips();
      
      // Show/hide chips based on currency
      const usdChips = document.querySelectorAll('.usd-chip');
      const lbpChips = document.querySelectorAll('.lbp-chip');
      
      if (currency === 'USD') {
        usdChips.forEach(chip => chip.style.display = 'flex');
        lbpChips.forEach(chip => chip.style.display = 'none');
        
        // Select the first USD chip
        const firstUsdChip = document.querySelector('.usd-chip[data-value="1"]');
        if (firstUsdChip) {
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
          firstUsdChip.classList.add('selected');
          selectedChip = firstUsdChip;
          selectedChipValue = parseFloat(firstUsdChip.dataset.value);
          document.getElementById('betAmount').value = '$' + formatNumberWithCommas(selectedChipValue.toFixed(2));
        }
      } else {
        usdChips.forEach(chip => chip.style.display = 'none');
        lbpChips.forEach(chip => chip.style.display = 'flex');
        
        // Select the first LBP chip
        const firstLbpChip = document.querySelector('.lbp-chip[data-value="1000"]');
        if (firstLbpChip) {
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
          firstLbpChip.classList.add('selected');
          selectedChip = firstLbpChip;
          selectedChipValue = parseFloat(firstLbpChip.dataset.value);
          document.getElementById('betAmount').value = '£' + formatNumberWithCommas(selectedChipValue.toFixed(0));
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
      const amountLabel = matchingItem.querySelector('.amount-label');
      if (amountLabel) {
        selectedBalance.textContent = amountLabel.textContent;
      } else {
        // If no amount-label span exists yet, use the text content directly
        selectedBalance.textContent = currency === 'USD' ? 
          `$${parseFloat(matchingItem.textContent.replace(/[^0-9.-]+/g, '')).toFixed(2)}` : 
          `£${parseFloat(matchingItem.textContent.replace(/[^0-9.-]+/g, '')).toFixed(0)}`;
      }
      
      // Hide dropdown after selection
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    }
    
    // Clear all existing bets when currency changes
    clearAllChips();
    
    // Disable the undo button since we've cleared all chips
    document.getElementById('undoBtn').disabled = true;
    
    // Show/hide chips based on currency
    const usdChips = document.querySelectorAll('.usd-chip');
    const lbpChips = document.querySelectorAll('.lbp-chip');
    
    if (currency === 'USD') {
      usdChips.forEach(chip => chip.style.display = 'flex');
      lbpChips.forEach(chip => chip.style.display = 'none');
      
      // Select the first USD chip
      const firstUsdChip = document.querySelector('.usd-chip[data-value="1"]');
      if (firstUsdChip) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        firstUsdChip.classList.add('selected');
        selectedChip = firstUsdChip;
        selectedChipValue = parseFloat(firstUsdChip.dataset.value);
        document.getElementById('betAmount').value = '$' + formatNumberWithCommas(selectedChipValue.toFixed(2));
      }
    } else {
      usdChips.forEach(chip => chip.style.display = 'none');
      lbpChips.forEach(chip => chip.style.display = 'flex');
      
      // Select the first LBP chip
      const firstLbpChip = document.querySelector('.lbp-chip[data-value="1000"]');
      if (firstLbpChip) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        firstLbpChip.classList.add('selected');
        selectedChip = firstLbpChip;
        selectedChipValue = parseFloat(firstLbpChip.dataset.value);
        document.getElementById('betAmount').value = '£' + formatNumberWithCommas(selectedChipValue.toFixed(0));
      }
    }
  });
}

// Initialize currency sync after page load
document.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
});

