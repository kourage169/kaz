
  
  
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


// Multiplier table for each mode/steps
const multiplierTable = {
    easy: {
      bombs: 1,
      startMultiplier: 1.0,
      maxMultiplier: 24.0,
      steps: [
        1.00, 1.15, 1.30, 1.50, 1.75,
        2.05, 2.40, 2.80, 3.25, 3.75,
        4.30, 5.00, 5.75, 6.60, 7.50,
        8.50, 9.75, 11.00, 12.50, 24.00
      ]
    },
    medium: {
      bombs: 3,
      startMultiplier: 1.09,
      maxMultiplier: 500.0,
      steps: [
        1.09, 1.30, 1.55, 1.85, 2.25,
        2.75, 3.40, 4.25, 5.50, 7.00,
        9.00, 12.00, 16.00, 22.00, 32.00,
        48.00, 75.00, 120.00, 200.00, 500.00
      ]
    },
    hard: {
      bombs: 5,
      startMultiplier: 1.20,
      maxMultiplier: 1000.0,
      steps: [
        1.20, 1.45, 1.75, 2.10, 2.55,
        3.10, 3.80, 4.70, 6.00, 8.00,
        10.50, 14.00, 19.00, 26.00, 36.00,
        52.00, 80.00, 150.00, 300.00, 1000.00
      ]
    }
  };
  


const canvas = document.getElementById("chickenCanvas");
const ctx = canvas.getContext("2d");

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Asset paths
const assetPath = "/games/chicken/chicken_assets/";
const assets = {
  startCrosswalk: new Image(),
  endCrosswalk: new Image(),
  sewer: new Image(),
  sidewalk: new Image(),
  sidewalk2: new Image(),
  chicken: new Image(),
  chickenWalk: new Image(),
  chickenDead: new Image(),
  block: new Image()
};

// Load car images
const carImages = Array(8).fill().map((_, i) => {
  const img = new Image();
  img.src = assetPath + `car${i + 1}.svg`;
  return img;
});

assets.startCrosswalk.src = assetPath + "start_crosswalk.svg";
assets.endCrosswalk.src = assetPath + "end_crosswalk.svg";
assets.sewer.src = assetPath + "sewer.svg";
assets.sidewalk.src = assetPath + "sidewalk.png";
assets.sidewalk2.src = assetPath + "sidewalk2.png";
assets.chicken.src = assetPath + "chicken.svg";
assets.chickenWalk.src = assetPath + "chicken_walk_sprite.png";
assets.chickenDead.src = assetPath + "chicken_dead.svg";
assets.block.src = assetPath + "block.png";

// Constants
const TOTAL_STEPS = 20;
const STEP_WIDTH = 150;
const CROSSWALK_WIDTH = 200;
const STREET_COLOR = "#313562";
const WHITE_LINE_WIDTH = 6;
const SEWER_SIZE = 85;

let cameraOffsetX = 0;
let currentStep = 0; // 0 to TOTAL_STEPS
let chickenY = canvasHeight / 2;

let cars = [];

let isDragging = false;
let dragStartX = null;
let dragStartY = null;
let dragStartOffset = null;
let dragDistance = 0;

// Current difficulty level
let currentDifficulty = "medium"; // Default difficulty

// Connect difficulty dropdown
document.getElementById('difficulty').addEventListener('change', function() {
  currentDifficulty = this.value;
});

function resizeCanvas() {
    // Match the canvas size to its styled dimensions
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    chickenY = canvasHeight / 2;
  }
  

window.addEventListener("resize", resizeCanvas);

// Add a flag to track whether camera should follow the chicken
let cameraFollowingChicken = false;

// Add a pending step state
let pendingStep = null;

// Add a game over state flag
let isGameOver = false;

// Add a flag to track whether the chicken is dead
let isChickenDead = false;

// Add a flag to track if chicken reached the end sidewalk
let reachedEndSidewalk = false;
let endSidewalkX = 0;

// Function to check if a street is clear of cars
function isStreetClear(stepIndex) {
  // Convert to 0-based street index
  const streetIndex = stepIndex - 1;
  const streetX = CROSSWALK_WIDTH + streetIndex * STEP_WIDTH + STEP_WIDTH / 2;
  
  // Check if any cars are on or near this street
  const buffer = 60; // Distance buffer around street center
  return !cars.some(car => 
    Math.abs(car.x - streetX) < buffer && 
    car.y > 0 && car.y < canvasHeight
  );
}

// Function to check for pending steps and execute if street is clear
function checkPendingStep() {
  if (pendingStep && !CHICKEN_SPRITE.isWalking && !BOMB_ANIMATION.active && !isGameOver) {
    // Check if the street is clear
    if (isStreetClear(pendingStep.nextStep)) {
      // Street is clear, start the walking animation
      startWalkAnimation(pendingStep.startX, pendingStep.targetX, pendingStep.isBombStep);

      // Save the next step value and pendingStep data
      const nextStepValue = pendingStep.nextStep;
      const isBomb = pendingStep.isBombStep;
      const isGameOverStep = pendingStep.gameOver;
      const bombCallback = pendingStep.bombCallback;
      const winCallback = pendingStep.winCallback;

      // Set up walk completion callback
      CHICKEN_SPRITE.onWalkComplete = () => {
        currentStep = nextStepValue;
        // Add step to completed steps if not a bomb
        if (!isBomb) {
          updateCompletedSteps(currentStep);
        }
        // Set up bomb completion callback if needed
        if (isGameOverStep && isBomb && bombCallback) {
          bombCallback();
        }
        // For win condition, delay the callback until chicken completes walking
        if (isGameOverStep && winCallback) {
          setTimeout(winCallback, 500);
        }
      };

      // Clear the pending step
      pendingStep = null;
    }
  }
}

// Function to start the walk animation
function startWalkAnimation(startX, targetX, isBombStep) {
  CHICKEN_SPRITE.isWalking = true;
  CHICKEN_SPRITE.walkProgress = 0;
  CHICKEN_SPRITE.currentFrame = 0;
  CHICKEN_SPRITE.startX = startX;
  CHICKEN_SPRITE.targetX = targetX;
  CHICKEN_SPRITE.isBombStep = isBombStep;
  
  // Enable camera following during movement
  cameraFollowingChicken = true;
}

// MAIN DRAW FUNCTION
function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Update animations
  updateBlockAnimations();
  
  // Check for pending steps
  checkPendingStep();
  
  // Update camera position to follow chicken
  updateCamera();

  ctx.save();
  ctx.translate(-cameraOffsetX, 0);

  drawStartCrosswalk(0);
  drawStreetSteps();
  drawEndCrosswalk(CROSSWALK_WIDTH + TOTAL_STEPS * STEP_WIDTH);
  drawCars();
  drawChicken();

  ctx.restore();

  requestAnimationFrame(draw);
}

// CAMERA FOLLOW
function updateCamera() {
  // Only follow the chicken if the flag is set
  if (cameraFollowingChicken) {
    let targetX;
    
    if (CHICKEN_SPRITE.isWalking) {
      // If chicken is walking, follow its current animated position
      targetX = CHICKEN_SPRITE.startX + (CHICKEN_SPRITE.targetX - CHICKEN_SPRITE.startX) * CHICKEN_SPRITE.walkProgress;
    } else {
      // Otherwise use the static position based on current step
      targetX = currentStep === 0
        ? CROSSWALK_WIDTH * 0.75  // Same as in drawChicken
        : CROSSWALK_WIDTH + (currentStep - 1) * STEP_WIDTH + STEP_WIDTH / 2;
    }
    
    const centerX = canvasWidth / 2;
    const padding = 100;
    
    // Target camera position
    const targetCameraX = targetX - (centerX - padding);
    
    // Smooth camera movement - interpolate towards target position
    if (Math.abs(targetCameraX - cameraOffsetX) > 0.5) {
      // Use a slightly higher smoothing factor to match chicken movement speed
      cameraOffsetX += (targetCameraX - cameraOffsetX) * 0.08; // Adjusted for smoother camera
    } else {
      cameraOffsetX = targetCameraX; // Snap when very close to avoid tiny movements
      
      // If we've reached the target and chicken is not walking, stop following
      if (!CHICKEN_SPRITE.isWalking) {
        cameraFollowingChicken = false;
      }
    }
    
    // Ensure camera stays within bounds
    const maxOffset = (CROSSWALK_WIDTH + TOTAL_STEPS * STEP_WIDTH + CROSSWALK_WIDTH) - canvasWidth;
    cameraOffsetX = Math.max(0, Math.min(maxOffset, cameraOffsetX));
  }
}

// DRAW HELPERS
function drawStartCrosswalk(x) {
  // Draw grass background
  ctx.fillStyle = "#02a686";
  ctx.fillRect(x, 0, CROSSWALK_WIDTH * 0.5, canvasHeight);
  // Draw sidewalk next to grass
  ctx.drawImage(assets.sidewalk, x + CROSSWALK_WIDTH * 0.5, 0, CROSSWALK_WIDTH * 0.5, canvasHeight);
  // Draw crosswalk image on top
  ctx.drawImage(assets.startCrosswalk, x, 0, CROSSWALK_WIDTH, canvasHeight);
}

function drawEndCrosswalk(x) {
  // Draw grass background
  ctx.fillStyle = "#02a686";
  ctx.fillRect(x + CROSSWALK_WIDTH * 0.5, 0, CROSSWALK_WIDTH * 0.5, canvasHeight);
  // Draw sidewalk2 next to grass (on the left)
  ctx.drawImage(assets.sidewalk2, x, 0, CROSSWALK_WIDTH * 0.5, canvasHeight);
  // Draw crosswalk image on top
  ctx.drawImage(
    assets.endCrosswalk, 
    x + 40, 
    45,
    CROSSWALK_WIDTH * 0.8,
    canvasHeight
  );
}

function drawStreetSteps() {
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const x = CROSSWALK_WIDTH + i * STEP_WIDTH;
    const stepNumber = i + 1; // Convert to 1-based step number

    // Street background
    ctx.fillStyle = STREET_COLOR;
    ctx.fillRect(x, 0, STEP_WIDTH, canvasHeight);

    // Single vertical white line at the end of each step with dashed effect
    // Skip drawing the line after the last step
    if (i < TOTAL_STEPS - 1) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = WHITE_LINE_WIDTH;
      ctx.setLineDash([20, 15]); // Create dashed effect: 20px line, 15px gap
      let lineX = x + STEP_WIDTH;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // Determine if the next step is a bomb
    const isBombStep = isGameActive && i === currentStep && pendingStep && pendingStep.isBombStep;
    const isNextSewer = isGameActive && i === currentStep && !CHICKEN_SPRITE.isWalking && !isBombStep;
    if (isNextSewer) {
      // Next sewer to click has full opacity
      ctx.globalAlpha = 1.0;
    } else {
      // All other sewers are semi-transparent
      ctx.globalAlpha = 0.5;
    }
    
    // Sewer image in center, moved slightly downward
    const sewerX = x + STEP_WIDTH / 2 - SEWER_SIZE / 2;
    const sewerY = (canvasHeight / 2 - SEWER_SIZE / 2) + 15;
    ctx.drawImage(assets.sewer, sewerX, sewerY, SEWER_SIZE, SEWER_SIZE);
    
    // Draw multiplier text with the same opacity
    const multiplier = multiplierTable[currentDifficulty].steps[i];
    if (multiplier) {
      ctx.font = "bold 16px Arial";
      
      // Change color based on whether this step has been completed
      // Green for completed steps, white for current and future steps
      const isCompleted = completedSteps.includes(stepNumber) && stepNumber < currentStep;
      ctx.fillStyle = isCompleted ? "#4caf50" : "white";
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textX = sewerX + SEWER_SIZE / 2;
      const textY = sewerY + SEWER_SIZE / 2;
      
      // Format the multiplier
      let formattedMultiplier;
      if (multiplier >= 100) {
        // For large numbers, show no decimals
        formattedMultiplier = Math.floor(multiplier).toString();
      } else {
        // For smaller numbers, always show 2 decimal places
        formattedMultiplier = multiplier.toFixed(2);
      }
      
      ctx.fillText(formattedMultiplier + "×", textX, textY);
    }
    
    // Reset opacity for other elements
    ctx.globalAlpha = 1.0;
    
    // Draw block on completed steps
    if (completedSteps.includes(stepNumber)) {
      // Draw block above the sewer with animation
      const blockHeight = SEWER_SIZE * 0.5; // Slightly shorter
      const blockWidth = SEWER_SIZE * 1.2;  // Wider than height
      const blockX = sewerX + SEWER_SIZE/2 - blockWidth/2;
      const finalBlockY = sewerY - blockHeight * 1.2; // Final position above the sewer
      
      // Get animation progress (0 to 1)
      const animation = blockAnimations[stepNumber] || { progress: 1 };
      
      // Calculate animated position (start from above the canvas)
      const startY = -blockHeight; // Start position above the canvas
      const currentY = startY + (finalBlockY - startY) * animation.progress;
      
      // Draw the block at its current animated position
      ctx.drawImage(assets.block, blockX, currentY, blockWidth, blockHeight);
    }
  }
}

function drawChicken() {
  // Determine the chicken's current position
  let chickenX;
  
  // If the chicken is dead from a bomb, always show the dead chicken
  if (isChickenDead) {
    // When not walking, calculate position based on current step
    if (currentStep === 0) {
      chickenX = CROSSWALK_WIDTH * 0.75; // Starting position
    } else {
      // Position at the current step
      chickenX = CROSSWALK_WIDTH + (currentStep - 1) * STEP_WIDTH + STEP_WIDTH / 2;
    }
    
    const CHICKEN_SIZE = 60;
    
    // Draw the dead chicken
    ctx.drawImage(
      assets.chickenDead, 
      chickenX - CHICKEN_SIZE/2, 
      chickenY - CHICKEN_SIZE/2, 
      CHICKEN_SIZE, 
      CHICKEN_SIZE
    );
    return;
  }
  
  if (CHICKEN_SPRITE.isWalking) {
    // During animation, use the interpolated position based on progress
    chickenX = CHICKEN_SPRITE.startX + (CHICKEN_SPRITE.targetX - CHICKEN_SPRITE.startX) * CHICKEN_SPRITE.walkProgress;
    
    // Update animation frame for the walking sprite
    const frameIndex = Math.floor(CHICKEN_SPRITE.currentFrame) % CHICKEN_SPRITE.frameCount;
    const CHICKEN_SIZE = 60;
    
    // Draw the walking chicken sprite
    ctx.drawImage(
      assets.chickenWalk,
      frameIndex * CHICKEN_SPRITE.frameWidth, 0,
      CHICKEN_SPRITE.frameWidth, CHICKEN_SPRITE.frameHeight,
      chickenX - CHICKEN_SIZE/2, chickenY - CHICKEN_SIZE/2,
      CHICKEN_SIZE, CHICKEN_SIZE
    );
    
    // Advance animation
    CHICKEN_SPRITE.currentFrame += CHICKEN_SPRITE.animationStep;
    CHICKEN_SPRITE.walkProgress += CHICKEN_SPRITE.walkSpeed;
    
    // Check if animation is complete
    if (CHICKEN_SPRITE.walkProgress >= 1) {
      // Animation is complete, finalize position and stop walking
      CHICKEN_SPRITE.walkProgress = 1; // Ensure we're exactly at the target
      chickenX = CHICKEN_SPRITE.targetX; // Set exact target position
      
      // Only stop the animation after we've drawn the final frame
      // This prevents any position jumps
      CHICKEN_SPRITE.isWalking = false;
      
      // Check if this was the final walk to the end sidewalk
      if (CHICKEN_SPRITE.targetX > CROSSWALK_WIDTH + TOTAL_STEPS * STEP_WIDTH) {
        reachedEndSidewalk = true;
        endSidewalkX = CHICKEN_SPRITE.targetX;
      }
      
      // If there's a walk completion callback, call it
      if (CHICKEN_SPRITE.onWalkComplete) {
        const callback = CHICKEN_SPRITE.onWalkComplete;
        CHICKEN_SPRITE.onWalkComplete = null;
        callback();
      }
      
      // If this was a walk to a bomb, start the bomb animation
      if (CHICKEN_SPRITE.isBombStep && !BOMB_ANIMATION.active) {
        startBombAnimation(chickenX, chickenY);
      }
    }
  } else {
    // When not walking, calculate position based on current step or end sidewalk
    if (reachedEndSidewalk) {
      // If we've reached the end sidewalk, stay there
      chickenX = endSidewalkX;
    } else if (currentStep === 0) {
      chickenX = CROSSWALK_WIDTH * 0.75; // Starting position
    } else {
      // Position at the current step
      chickenX = CROSSWALK_WIDTH + (currentStep - 1) * STEP_WIDTH + STEP_WIDTH / 2;
    }
    
    // Store the position for bomb animation
    if (CHICKEN_SPRITE.isBombStep) {
      BOMB_ANIMATION.chickenX = chickenX;
      BOMB_ANIMATION.chickenY = chickenY;
    }
    
    const CHICKEN_SIZE = 60;
    
    // Draw either dead or alive chicken based on bomb animation state
    if (BOMB_ANIMATION.active && BOMB_ANIMATION.showDeadChicken) {
      // Draw the dead chicken
      ctx.drawImage(
        assets.chickenDead, 
        chickenX - CHICKEN_SIZE/2, 
        chickenY - CHICKEN_SIZE/2, 
        CHICKEN_SIZE, 
        CHICKEN_SIZE
      );
    } else {
      // Draw the normal chicken
      ctx.drawImage(
        assets.chicken, 
        chickenX - CHICKEN_SIZE/2, 
        chickenY - CHICKEN_SIZE/2, 
        CHICKEN_SIZE, 
        CHICKEN_SIZE
      );
    }
  }
}

// In drawCars, prevent cars from spawning or moving in the dead chicken's lane
function drawCars() {
  // Handle bomb animation if active
  if (BOMB_ANIMATION.active) {
    // Calculate current car position based on animation progress
    const carX = BOMB_ANIMATION.carX + (BOMB_ANIMATION.targetX - BOMB_ANIMATION.carX) * BOMB_ANIMATION.progress;
    const carY = BOMB_ANIMATION.carY + (BOMB_ANIMATION.targetY - BOMB_ANIMATION.carY) * BOMB_ANIMATION.progress;
    
    // Draw the car
    ctx.drawImage(carImages[BOMB_ANIMATION.carType], carX - 60, carY - 60, 120, 120);
    
    // Advance animation
    BOMB_ANIMATION.progress += BOMB_ANIMATION.speed;
    
    // Check if car has reached the chicken (around 50% of the animation)
    if (BOMB_ANIMATION.progress >= 0.5 && !BOMB_ANIMATION.showDeadChicken) {
      // Show dead chicken when car passes over
      BOMB_ANIMATION.showDeadChicken = true;
      // Set the global flag to keep chicken dead after game ends
      isChickenDead = true;
    }
    
    // Check if animation is complete
    if (BOMB_ANIMATION.progress >= 1) {
      // FORCE direct game ending when bomb animation completes
      isGameActive = false;
      isGameOver = true;
      
      // FORCE UI update
      document.getElementById('playBtn').style.display = 'block';
      document.getElementById('playBtn').disabled = false; // Ensure enabled
      document.getElementById('cashoutBtn').style.display = 'none';
      document.getElementById('cashoutBtn').disabled = false; // Reset for next game
      
      // Re-enable controls
      document.getElementById('betAmount').disabled = false;
      document.getElementById('currency').disabled = false;
      document.getElementById('difficulty').disabled = false;
      
      // Call the completion callback if provided (for showing alerts, etc)
      if (BOMB_ANIMATION.onComplete) {
        const callback = BOMB_ANIMATION.onComplete;
        BOMB_ANIMATION.onComplete = null;
        callback();
      }
      
      // Mark animation as inactive
      BOMB_ANIMATION.active = false;
    }
  }
  
  // Determine the forbidden lane if chicken is dead
  let forbiddenLane = null;
  if (isChickenDead && currentStep > 0) {
    forbiddenLane = currentStep - 1; // 0-based index
  }

  // Spawn new car with 1% chance
  if (Math.random() < 0.01) {
    // Calculate visible street range based on camera position
    const visibleStartStreet = Math.floor(cameraOffsetX / STEP_WIDTH);
    const visibleEndStreet = Math.ceil((cameraOffsetX + canvasWidth) / STEP_WIDTH);
    const visibleStreetCount = visibleEndStreet - visibleStartStreet;
    
    // Get available streets (no cars near spawn point and not completed)
    const occupiedStreets = new Set(
      cars.filter(car => car.y < 0)
        .map(car => Math.floor((car.x - CROSSWALK_WIDTH) / STEP_WIDTH))
    );
    
    // Calculate the next step index (the lane the chicken is about to walk to)
    const nextStepIndex = currentStep; // 0-based index of the next step
    
    // Try to find an available street
    let attempts = 0;
    let street;
    while (attempts < 10) {
      street = visibleStartStreet + Math.floor(Math.random() * visibleStreetCount);
      // Prevent spawning in forbidden lane if chicken is dead
      if (forbiddenLane !== null && street === forbiddenLane) {
        attempts++;
        continue;
      }
      // Check if street is valid (not occupied, not completed, within range, not the next step)
      const streetNumber = street + 1; // Convert to 1-based step number
      if (!occupiedStreets.has(street) && 
          !completedSteps.includes(streetNumber) && 
          street < TOTAL_STEPS &&
          street !== nextStepIndex // Prevent spawning in the next step lane
      ) {
        cars.push({
          x: CROSSWALK_WIDTH + street * STEP_WIDTH + STEP_WIDTH / 2,
          y: -120,
          type: Math.floor(Math.random() * 8)
        });
        break;
      }
      attempts++;
    }
  }

  // Update and draw regular moving cars
  cars = cars.filter(car => {
    // DO NOT remove cars from forbidden lane if chicken is dead; let them continue moving
    car.y += 5;
    if (car.y > canvasHeight + 120) return false;
    ctx.drawImage(carImages[car.type], car.x - 60, car.y - 60, 120, 120);
    return true;
  });
  
  // Draw stopped cars at completed steps
  Object.keys(stoppedCars).forEach(step => {
    const car = stoppedCars[step];
    ctx.drawImage(carImages[car.type], car.x - 60, car.y - 60, 120, 120);
  });
}

// Function to start the bomb animation
function startBombAnimation(chickenX, chickenY, callback) {
  // Set the chicken position for the dead chicken
  BOMB_ANIMATION.chickenX = chickenX;
  BOMB_ANIMATION.chickenY = chickenY;
  
  // Choose a random car type
  BOMB_ANIMATION.carType = Math.floor(Math.random() * carImages.length);
  
  // Set starting position (above the screen)
  BOMB_ANIMATION.carX = chickenX;
  BOMB_ANIMATION.carY = -120;
  
  // Set target position (below the screen)
  BOMB_ANIMATION.targetX = chickenX;
  BOMB_ANIMATION.targetY = canvasHeight + 120;
  
  // Reset animation state
  BOMB_ANIMATION.progress = 0;
  BOMB_ANIMATION.showDeadChicken = false;
  BOMB_ANIMATION.active = true;
  
  // Set completion callback
  BOMB_ANIMATION.onComplete = callback;
}

// Function to show the win message
function showWinMessage(multiplier, amount, currency) {
  const winMessage = document.querySelector('.win-message');
  const multiplierEl = winMessage.querySelector('.multiplier');
  const amountEl = winMessage.querySelector('.amount');
  
  // Format the multiplier
  multiplierEl.textContent = multiplier.toFixed(2) + 'x';
  
  // Format the amount based on currency
  if (currency === 'USD') {
    amountEl.textContent = '$' + amount.toFixed(2);
  } else {
    amountEl.textContent = '£' + Math.round(amount).toLocaleString();
  }
  
  // Remove fade-out if present
  winMessage.classList.remove('fade-out');
  // Make the message visible
  winMessage.classList.add('visible');

  // Handler to fade out the win message after a brief delay
  let fadeTimeout;
  function handleUserScroll() {
    // Only trigger once
    canvas.removeEventListener('mousemove', handleUserScroll);
    canvas.removeEventListener('touchmove', handleUserScroll);
    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      winMessage.classList.add('fade-out');
      setTimeout(() => {
        winMessage.classList.remove('visible');
        winMessage.classList.remove('fade-out');
      }, 500); // match CSS transition
    }, 500); // brief delay after scroll
  }

  // Listen for user scroll (drag) events on the canvas only
  canvas.addEventListener('mousemove', handleUserScroll);
  canvas.addEventListener('touchmove', handleUserScroll);
}

// Function to hide the win message
function hideWinMessage() {
  const winMessage = document.querySelector('.win-message');
  winMessage.classList.remove('visible');
}

// Add cashout function implementation
async function cashout() {
  if (!isGameActive) return;
  const cashoutBtn = document.getElementById('cashoutBtn');
  cashoutBtn.disabled = true;
  try {
    // Call the cashout API
    const response = await fetch('/games/chicken/cashout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cash out');
    }
    
    // If we get a success response
    if (data.success) {
      // Show the win message
      const currency = document.getElementById('currency').value;
      showWinMessage(data.multiplier, data.winAmount, currency);
      
      
      // Update balance
      if (window.updateNavbarBalance) { window.updateNavbarBalance(currency, data.balance); }
      
      // End game state so no more moves can be made
      isGameActive = false;
      isGameOver = true;

      // If bombSteps are provided, mark all safe steps as completed
      if (data.bombSteps && Array.isArray(data.bombSteps)) {
        for (let step = 1; step <= TOTAL_STEPS; step++) {
          if (!data.bombSteps.includes(step)) {
            if (!completedSteps.includes(step)) {
              completedSteps.push(step);
              // Add block animation and parked car instantly
              blockAnimations[step] = { progress: 1, startTime: performance.now() };
              const x = CROSSWALK_WIDTH + (step - 1) * STEP_WIDTH + STEP_WIDTH / 2;
              const sewerY = (canvasHeight / 2 - SEWER_SIZE / 2) + 15;
              const blockHeight = SEWER_SIZE * 0.5;
              const finalBlockY = sewerY - blockHeight * 1.2;
              const finalCarY = finalBlockY - 60;
              stoppedCars[step] = {
                x: x,
                y: finalCarY,
                type: Math.floor(Math.random() * 8),
                animation: { progress: 1, startTime: performance.now(), duration: 1200 }
              };
            }
          }
        }
      }

      // Reset UI only
      document.getElementById('playBtn').style.display = 'block';
      document.getElementById('playBtn').textContent = 'Play';
      document.getElementById('playBtn').disabled = false; // Ensure enabled
      document.getElementById('cashoutBtn').style.display = 'none';
      document.getElementById('cashoutBtn').disabled = false; // Reset for next game
      toggleProfitOnWinVisibility(false);
      document.getElementById('betAmount').disabled = false;
      document.getElementById('currency').disabled = false;
      document.getElementById('difficulty').disabled = false;
      
      // Reset game
      // resetGame(); // This line is removed as per the edit hint
    }
    
  } catch (error) {
    console.error('Error cashing out:', error);
    alert(error.message || 'Failed to cash out');
    cashoutBtn.disabled = false;
  }
}

// STEP ADVANCEMENT — Call this to simulate movement
async function advanceStep() {
  if (!isGameActive || isGameOver) return;
  if (isStepInProgress) return; // Prevent double/spam clicks
  isStepInProgress = true;

  try {
    // Calculate the next step
    const nextStep = currentStep + 1;
    
    // Don't proceed if we're trying to go beyond the last step
    if (nextStep > TOTAL_STEPS) return;
    
    // Calculate exact positions for animation
    const startX = currentStep === 0 
      ? CROSSWALK_WIDTH * 0.75  // Starting position
      : CROSSWALK_WIDTH + (currentStep - 1) * STEP_WIDTH + STEP_WIDTH / 2;
      
    const targetX = CROSSWALK_WIDTH + (nextStep - 1) * STEP_WIDTH + STEP_WIDTH / 2;
    
    // Call the step API first to ensure we have server confirmation
    const response = await fetch('/games/chicken/step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        step: nextStep
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to advance step');
    }
    
    // Check if there's a game over condition with a bomb
    let bombCallback = null;
    if (data.gameOver && data.result === 'bomb') {
      // Set up bomb animation completion callback
      bombCallback = () => {
        
        // Update balance display
        const currency = document.getElementById('currency').value;
        if (window.updateNavbarBalance) { window.updateNavbarBalance(currency, data.balance); }
        
        // End game without resetting
        endGame();
      };
    }
    // Handle non-bomb game over conditions (win)
    else if (data.gameOver && data.result === 'win') {
      // For win condition, we create a callback that executes after chicken reaches final step and end sidewalk
      const winCallback = () => {
        // Show the win message with multiplier and win amount
        const currency = document.getElementById('currency').value;
        showWinMessage(data.multiplier, data.winAmount, currency);
        
        
        // Update balance display
        if (window.updateNavbarBalance) { window.updateNavbarBalance(currency, data.balance); }
        
        // End game without resetting
        endGame();
      };
      
      // Set up the final walk to the sidewalk to happen after reaching the last sewer
      const finalWalkCallback = () => {
        // Calculate the final sidewalk position
        const finalSidewalkX = CROSSWALK_WIDTH + TOTAL_STEPS * STEP_WIDTH + CROSSWALK_WIDTH * 0.25;
        
        // Start another walk to the end sidewalk
        CHICKEN_SPRITE.isWalking = true;
        CHICKEN_SPRITE.walkProgress = 0;
        CHICKEN_SPRITE.currentFrame = 0;
        CHICKEN_SPRITE.startX = targetX;
        CHICKEN_SPRITE.targetX = finalSidewalkX;
        CHICKEN_SPRITE.isBombStep = false;
        
        // Enable camera following for final walk
        cameraFollowingChicken = true;
        
        // Set up callback for after sidewalk walk completes
        CHICKEN_SPRITE.onWalkComplete = winCallback;
      };
      
      // Store step data for execution when street is clear - first to the final sewer
      pendingStep = {
        nextStep: data.step,
        startX: startX,
        targetX: targetX,
        isBombStep: false,
        gameOver: data.gameOver,
        winCallback: finalWalkCallback
      };
      
      // Check if street is clear for final step
      checkPendingStep();
      return;
    }
    
    // Store step data for execution when street is clear
    pendingStep = {
      nextStep: data.step,
      startX: startX,
      targetX: targetX,
      isBombStep: (data.result === 'bomb'),
      gameOver: data.gameOver,
      bombCallback: bombCallback
    };
    
    // Immediately check if we can start walking (street is clear)
    checkPendingStep();
    
  } catch (error) {
    console.error('Error advancing step:', error);
    alert(error.message || 'Failed to advance step');
  } finally {
    isStepInProgress = false; // Always release the lock at the end
  }
}

// Set up sewer click detection
function setupSewerClickDetection() {
  // No active setup needed, click detection happens in handleEnd
}

function handleEnd(e) {
  // Check if this was a click (small drag distance) or a real drag
  const wasDragging = isDragging;
  const finalDragDistance = dragDistance;
  const finalDragStartX = dragStartX;
  const finalDragStartY = dragStartY;
  
  // Reset drag state
  isDragging = false;
  dragStartX = null;
  dragStartY = null;
  dragStartOffset = null;
  dragDistance = 0;
  canvas.style.cursor = 'default';
  
  // If this was just a small movement (a click), handle it as a sewer click
  if (
    wasDragging &&
    finalDragDistance < 5 &&
    isGameActive &&
    finalDragStartY !== null &&
    !CHICKEN_SPRITE.isWalking // Prevent advancing step while chicken is walking
  ) {
    // This was likely intended as a click, not a drag
    const gameX = finalDragStartX + cameraOffsetX;
    const gameY = finalDragStartY;
    
    // The next step is already set to currentStep on the backend
    // So we need to click on the sewer at the current step index
    const nextStepIndex = currentStep; // 0-based index of the next step
    
    if (nextStepIndex < TOTAL_STEPS) {
      const sewerX = CROSSWALK_WIDTH + nextStepIndex * STEP_WIDTH + STEP_WIDTH / 2;
      const sewerY = (canvasHeight / 2 - SEWER_SIZE / 2) + 15 + SEWER_SIZE / 2;
      const hitboxSize = STEP_WIDTH * 0.8; // Large hitbox
      
      // Block click if next step is a bomb
      if (pendingStep && pendingStep.isBombStep) return;
      if (
        Math.abs(gameX - sewerX) < hitboxSize / 2 &&
        Math.abs(gameY - sewerY) < hitboxSize / 2
      ) {
        // This was a click on the next sewer
        advanceStep();
      }
    }
  }
}

// INIT
function preloadAssets(callback) {
  let loaded = 0;
  const total = Object.keys(assets).length + carImages.length;
  
  // Load regular assets
  for (let key in assets) {
    assets[key].onload = () => {
      loaded++;
      if (loaded === total) callback();
    };
  }
  
  // Load car images
  carImages.forEach(img => {
    img.onload = () => {
      loaded++;
      if (loaded === total) callback();
    };
  });
}

preloadAssets(() => {
  resizeCanvas();
  setupSewerClickDetection();
  draw();
});

// Add this function to get both X and Y coordinates from events
function getEventCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.type.startsWith('touch')) {
    return e.touches[0] ? {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    } : null;
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function handleStart(e) {
  if (e.type.startsWith('touch')) {
    e.preventDefault();
  }
  
  const coords = getEventCoordinates(e);
  if (!coords) return;
  
  // Disable camera following when user starts manual navigation
  cameraFollowingChicken = false;
  
  isDragging = true;
  dragStartX = coords.x;
  dragStartY = coords.y;
  dragStartOffset = cameraOffsetX;
  dragDistance = 0;
  canvas.style.cursor = 'grabbing';
}

function handleMove(e) {
  if (!isDragging || dragStartX === null) return;
  
  if (e.type.startsWith('touch')) {
    e.preventDefault();
  }
  
  const coords = getEventCoordinates(e);
  if (!coords) return;
  
  const deltaX = coords.x - dragStartX;
  
  // Track total drag distance
  dragDistance += Math.abs(deltaX);
  
  // Add extra width to ensure end crosswalk is fully visible
  const maxOffset = (CROSSWALK_WIDTH + TOTAL_STEPS * STEP_WIDTH + CROSSWALK_WIDTH) - canvasWidth;
  cameraOffsetX = Math.max(0, Math.min(maxOffset, dragStartOffset - deltaX));
}

// Prevent all default touch actions on the canvas
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTapHighlightColor = 'transparent';
canvas.style.position = 'relative';
canvas.style.zIndex = '1';

// Add event listeners with proper options
const touchOptions = { passive: false, capture: true };

// Mouse events
canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('mouseleave', handleEnd);

// Touch events
canvas.addEventListener('touchstart', handleStart, touchOptions);
canvas.addEventListener('touchmove', handleMove, touchOptions);
canvas.addEventListener('touchend', handleEnd, touchOptions);
canvas.addEventListener('touchcancel', handleEnd, touchOptions);

// Remove the click handler since we're using drag now
canvas.removeEventListener("click", advanceStep);

// Game state
let isGameActive = false;
let betAmount = 1.00; // Default bet amount changed to $1.00

// Add a lock to prevent double/spam step clicks
let isStepInProgress = false;

// Define minimum bet amounts for each currency
const MIN_BET = {
  USD: 1.00,
  LBP: 10000
};

// Track completed steps and block animations
let completedSteps = [];
let blockAnimations = {}; // Maps step number to animation progress (0-1)
let stoppedCars = {}; // Maps step number to stopped car information

// Chicken animation properties
const CHICKEN_SPRITE = {
  totalWidth: 288,
  totalHeight: 82,
  frameCount: 4,
  frameWidth: 288 / 4, // 72px per frame
  frameHeight: 82,
  currentFrame: 0,
  isWalking: false,
  startX: 0,
  targetX: 0,
  walkProgress: 0,
  walkSpeed: 0.03, // Slower for smoother animation
  animationStep: 0.15, // Controls frame rate
  lastStep: -1, // Track the last step to prevent position conflicts
  isBombStep: false,
  onWalkComplete: null // Callback function when walking animation completes
};

// Bomb animation state
const BOMB_ANIMATION = {
  active: false,
  carType: 0, // Index of car to use
  carX: 0,
  carY: 0,
  targetX: 0,
  targetY: 0,
  progress: 0,
  speed: 0.02,
  chickenX: 0,
  chickenY: 0,
  showDeadChicken: false,
  onComplete: null
};

// Add a function to toggle visibility of the profit on win display
function toggleProfitOnWinVisibility(show) {
  const profitOnWin = document.getElementById('profitOnWin').parentElement;
  profitOnWin.style.display = show ? 'block' : 'none';
}

function updateProfitOnWin() {
  const betAmountInput = document.getElementById('betAmount');
  const betAmount = parseFloat(betAmountInput.value.replace(/,/g, '')) || 0; // Remove commas before parsing
  const currency = document.getElementById('currency').value;
  
  // Get current difficulty
  const difficulty = document.getElementById('difficulty').value;
  
  // Get the multiplier for the current step (or max multiplier if no game in progress)
  let multiplier;
  if (isGameActive && currentStep > 0) {
    // Use the multiplier for the current step (adjust for 0-based index)
    multiplier = multiplierTable[difficulty].steps[currentStep - 1];
  } else {
    // Use the max multiplier when no game is active
    multiplier = multiplierTable[difficulty].maxMultiplier;
  }
  
  // Calculate total win amount (including the bet)
  const totalWin = betAmount * multiplier;
  
  // Format based on currency
  let formattedAmount;
  if (currency === 'USD') {
    // USD with dollar sign and 2 decimal places
    formattedAmount = '$' + totalWin.toFixed(2);
  } else {
    // LBP with pound sign, no decimals, and commas for thousands
    formattedAmount = '£' + Math.round(totalWin).toLocaleString();
  }
  
  document.getElementById('profitOnWin').textContent = formattedAmount;
}

// Add currency sync with navbar (adapted from rps.js)
function syncCurrencySelections() {
  const currencySelect = document.getElementById('currency');
  const selectedBalance = document.getElementById('selected-balance');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const betAmountInput = document.getElementById('betAmount');

  // When user clicks a currency in the navbar dropdown, update the controls
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      currencySelect.value = currency;
      // Set bet amount to min for this currency
      const min = MIN_BET[currency];
      betAmountInput.value = currency === 'USD' ? min.toFixed(2) : min.toLocaleString();
      updateProfitOnWin();
    });
  });

  // When user changes the controls' currency select, update the navbar
  currencySelect.addEventListener('change', () => {
    const currency = currencySelect.value;
    if (window.setNavbarCurrency) {
      window.setNavbarCurrency(currency);
    }
    // Set bet amount to min for this currency
    const min = MIN_BET[currency];
    betAmountInput.value = currency === 'USD' ? min.toFixed(2) : min.toLocaleString();
    updateProfitOnWin();
  });

  // Keep controls in sync if navbar changes (MutationObserver)
  const observer = new MutationObserver(() => {
    if (window.getNavbarCurrency) {
      const navbarCurrency = window.getNavbarCurrency();
      currencySelect.value = navbarCurrency;
      // Set bet amount to min for this currency
      const min = MIN_BET[navbarCurrency];
      betAmountInput.value = navbarCurrency === 'USD' ? min.toFixed(2) : min.toLocaleString();
      updateProfitOnWin();
    }
  });
  if (selectedBalance) {
    observer.observe(selectedBalance, { childList: true, characterData: true, subtree: true });
  }
}

// Add bet amount validation and auto-adjustment after user input
function validateBetAmount() {
  const betAmountInput = document.getElementById('betAmount');
  const currency = document.getElementById('currency').value;
  let value = parseFloat(betAmountInput.value.toString().replace(/,/g, ''));
  const limits = BET_LIMITS[currency] || BET_LIMITS['USD'];

  // Handle empty or non-numeric input
  if (isNaN(value)) {
    value = limits.min;
  }

  // Enforce min/max constraints
  if (value < limits.min) value = limits.min;
  if (value > limits.max) value = limits.max;

  // Update input if changed
  betAmountInput.value = currency === 'USD' ? value.toFixed(2) : value.toLocaleString();
  updateProfitOnWin();
}

// Connect UI elements
document.addEventListener('DOMContentLoaded', function() {
  // Connect play button
  const playBtn = document.getElementById('playBtn');
  playBtn.addEventListener('click', startGame);
  
  // Connect cashout button
  const cashoutBtn = document.getElementById('cashoutBtn');
  cashoutBtn.addEventListener('click', cashout);
  
  // Connect bet amount input
  const betAmountInput = document.getElementById('betAmount');
  betAmountInput.value = betAmount.toFixed(2);
  betAmountInput.addEventListener('input', updateProfitOnWin);
  betAmountInput.addEventListener('blur', validateBetAmount);
  betAmountInput.addEventListener('change', validateBetAmount);
  
  // Connect currency select
  const currencySelect = document.getElementById('currency');
  // Ensure USD is selected by default
  currencySelect.value = 'USD';
  currencySelect.addEventListener('change', function() {
    // Update bet amount when currency changes
    const newCurrency = this.value;
    const betAmountInput = document.getElementById('betAmount');
    
    // Set to minimum bet for the selected currency
    if (newCurrency === 'USD') {
      betAmountInput.value = MIN_BET[newCurrency].toFixed(2);
    } else {
      // For LBP, format with commas and no decimals
      betAmountInput.value = MIN_BET[newCurrency].toLocaleString();
    }
    
    // Update profit calculation
    updateProfitOnWin();
  });
  
  // Initial profit update
  updateProfitOnWin();
  
  // Initially hide profit on win display
  toggleProfitOnWinVisibility(false);
  syncCurrencySelections();
});

async function startGame() {
  const playBtn = document.getElementById('playBtn');
  playBtn.disabled = true;
  try {
    // Reset game state if we were in game over
    if (isGameOver) {
      resetGame();
    }

    setChickenToStart();   // Chicken is at start
    cameraOffsetX = 0;     // Camera is at start  draw();                // Force a frame so chicken is visible at start
    
    // Hide win message when starting a new game
    hideWinMessage();
    
    // Get bet amount and currency from inputs
    const betAmountInput = document.getElementById('betAmount');
    const currencySelect = document.getElementById('currency');
    
    // Parse bet amount, removing commas if present
    const betAmount = parseFloat(betAmountInput.value.replace(/,/g, ''));
    const currency = currencySelect.value;
    
    // Get selected difficulty
    const difficultySelect = document.getElementById('difficulty');
    const difficulty = difficultySelect.value;
    
    // Reset completed steps
    completedSteps = [];
    
    // Reset animation state
    CHICKEN_SPRITE.isWalking = false;
    CHICKEN_SPRITE.walkProgress = 0;
    CHICKEN_SPRITE.currentFrame = 0;
    CHICKEN_SPRITE.isBombStep = false;
    
    // Reset bomb animation state
    BOMB_ANIMATION.active = false;
    BOMB_ANIMATION.progress = 0;
    BOMB_ANIMATION.showDeadChicken = false;
    BOMB_ANIMATION.onComplete = null;
    
    // Reset the play button text
    playBtn.textContent = 'Play';
    
    // Make API call to start game
    const response = await fetch('/games/chicken/start', {
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to start game');
    }
    
    // Update game state - backend already moved to step 1
    isGameActive = true;
    isGameOver = false;
    
    // Calculate exact positions for animation
    const startX = CROSSWALK_WIDTH * 0.75; // Starting position
    const targetX = CROSSWALK_WIDTH + (data.gameState.currentStep - 1) * STEP_WIDTH + STEP_WIDTH / 2; // First step position
    
    // Check if the first step hit a bomb
    let bombCallback = null;
    if (data.gameState.result === 'bomb') {
      // Set up bomb animation completion callback
      bombCallback = () => {
        
        // Update balance display
        if (window.updateNavbarBalance) { window.updateNavbarBalance(currency, data.balance); }
        
        // End game without resetting
        endGame();
      };
    } else {
      // Update UI for game started
      playBtn.style.display = 'none';
      cashoutBtn.style.display = 'block';
      cashoutBtn.disabled = false; // Ensure enabled
      
      // Show profit on win display
      toggleProfitOnWinVisibility(true);
      
      // Disable controls during gameplay
      document.getElementById('betAmount').disabled = true;
      document.getElementById('currency').disabled = true;
      document.getElementById('difficulty').disabled = true;
    }
    
    // Store step data for execution when street is clear
    pendingStep = {
      nextStep: data.gameState.currentStep,
      startX: startX,
      targetX: targetX,
      isBombStep: (data.gameState.result === 'bomb'),
      gameOver: data.gameState.result === 'bomb',
      bombCallback: bombCallback
    };
    
    // Immediately check if we can start walking (street is clear)
    checkPendingStep();
    
    // Update balance display
    if (window.updateNavbarBalance) { window.updateNavbarBalance(currency, data.balance); }
    
  } catch (error) {
    console.error('Error starting game:', error);
    alert(error.message || 'Failed to start game');
    playBtn.disabled = false;
  }
}

function resetGame() {
  isGameActive = false;
  isGameOver = false;
  isChickenDead = false; // Reset the chicken dead state
  reachedEndSidewalk = false; // Reset the end sidewalk state
  endSidewalkX = 0; // Reset end sidewalk position
  completedSteps = []; // Reset completed steps
  blockAnimations = {}; // Reset block animations
  stoppedCars = {}; // Reset stopped cars
  cameraFollowingChicken = false; // Reset camera following state
  pendingStep = null; // Reset pending step
  
  // Reset chicken animation state completely
  CHICKEN_SPRITE.isWalking = false;
  CHICKEN_SPRITE.walkProgress = 0;
  CHICKEN_SPRITE.currentFrame = 0;
  CHICKEN_SPRITE.startX = 0;
  CHICKEN_SPRITE.targetX = 0;
  CHICKEN_SPRITE.isBombStep = false;
  
  // Reset bomb animation state
  BOMB_ANIMATION.active = false;
  BOMB_ANIMATION.progress = 0;
  BOMB_ANIMATION.showDeadChicken = false;
  BOMB_ANIMATION.onComplete = null;
  
  // Reset UI
  document.getElementById('playBtn').style.display = 'block';
  document.getElementById('playBtn').textContent = 'Play';
  document.getElementById('playBtn').disabled = false; // Ensure enabled
  document.getElementById('cashoutBtn').style.display = 'none';
  document.getElementById('cashoutBtn').disabled = false; // Reset for next game
  
  // Hide profit on win display
  toggleProfitOnWinVisibility(false);
  
  // Enable controls
  document.getElementById('betAmount').disabled = false;
  document.getElementById('currency').disabled = false;
  document.getElementById('difficulty').disabled = false;
}

// Update completed steps - add the current step to the list
function updateCompletedSteps(step) {
  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
    // Initialize animation for this step
    blockAnimations[step] = {
      progress: 0,
      startTime: performance.now()
    };
    
    // Add a stopped car for this step
    const streetIndex = step - 1; // Convert to 0-based index
    const x = CROSSWALK_WIDTH + streetIndex * STEP_WIDTH + STEP_WIDTH / 2;
    stoppedCars[step] = {
      x: x,
      y: -120, // Start above the canvas
      type: Math.floor(Math.random() * 8),
      animation: {
        progress: 0,
        startTime: performance.now(),
        duration: 1200 // Longer than block animation (500ms) to arrive after block
      }
    };
    
    // Update profit on win when step changes
    updateProfitOnWin();
  }
}

// Update block animations
function updateBlockAnimations() {
  const now = performance.now();
  const animationDuration = 500; // Animation duration in ms
  
  for (const step in blockAnimations) {
    const animation = blockAnimations[step];
    const elapsed = now - animation.startTime;
    
    if (elapsed < animationDuration) {
      // Animation in progress
      animation.progress = Math.min(1, elapsed / animationDuration);
    } else {
      // Animation complete
      animation.progress = 1;
    }
  }
  
  // Update stopped car animations
  for (const step in stoppedCars) {
    const car = stoppedCars[step];
    const elapsed = now - car.animation.startTime;
    
    if (elapsed < car.animation.duration) {
      // Animation in progress
      car.animation.progress = Math.min(1, elapsed / car.animation.duration);
      
      // Calculate animated position
      const startY = -120; // Start position above the canvas
      
      // Calculate the final Y position (just before the block)
      const stepNumber = parseInt(step);
      const streetIndex = stepNumber - 1; // Convert to 0-based index
      const sewerY = (canvasHeight / 2 - SEWER_SIZE / 2) + 15;
      const blockHeight = SEWER_SIZE * 0.5;
      const finalBlockY = sewerY - blockHeight * 1.2;
      const finalCarY = finalBlockY - 60; // Stop just before the block
      
      // Animated position
      car.y = startY + (finalCarY - startY) * car.animation.progress;
    } else {
      // Animation complete - car is stopped at the block
      car.animation.progress = 1;
      
      // Final position calculation (same as above)
      const stepNumber = parseInt(step);
      const streetIndex = stepNumber - 1;
      const sewerY = (canvasHeight / 2 - SEWER_SIZE / 2) + 15;
      const blockHeight = SEWER_SIZE * 0.5;
      const finalBlockY = sewerY - blockHeight * 1.2;
      const finalCarY = finalBlockY - 60;
      
      car.y = finalCarY;
    }
  }
}

// Function to end the game without resetting
function endGame() {
  console.log("Ending game - updating UI");
  
  // Set game state flags
  isGameActive = false;
  isGameOver = true;
  
  // Note: We do NOT reset the chicken state here
  // isChickenDead stays true if it was set during bomb animation
  // reachedEndSidewalk stays true to keep chicken on sidewalk if it reached there
  
  // Force UI update
  document.getElementById('playBtn').style.display = 'block';
  document.getElementById('playBtn').disabled = false; // Ensure enabled
  document.getElementById('cashoutBtn').style.display = 'none';
  document.getElementById('cashoutBtn').disabled = false; // Reset for next game
  
  // Hide profit on win display
  toggleProfitOnWinVisibility(false);
  
  // Enable controls
  document.getElementById('betAmount').disabled = false;
  document.getElementById('currency').disabled = false;
  document.getElementById('difficulty').disabled = false;
  
  // Log the current state of the UI elements
  console.log("UI updated - playBtn:", document.getElementById('playBtn').style.display, 
              "cashoutBtn:", document.getElementById('cashoutBtn').style.display);
}


function setChickenToStart() {
  currentStep = 0;
  CHICKEN_SPRITE.isWalking = false;
  CHICKEN_SPRITE.walkProgress = 0;
  CHICKEN_SPRITE.currentFrame = 0;
  CHICKEN_SPRITE.startX = CROSSWALK_WIDTH * 0.75;
  CHICKEN_SPRITE.targetX = CROSSWALK_WIDTH * 0.75;
  CHICKEN_SPRITE.isBombStep = false;
}