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

// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};


// ─── Sync currency selection between navbar and game controls ────────────────
function syncCurrencySelections() {
  // Get references to navbar elements
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const currencySelect = document.getElementById('currency');
  const selectedBalance = document.getElementById('selected-balance');

  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      
      // Update bet amount to minimum for the selected currency
      const betAmountInput = document.getElementById('betAmount');
      if (betAmountInput && BET_LIMITS[currency]) {
        const minAmount = BET_LIMITS[currency].min;
        betAmountInput.value = currency === 'USD' ? minAmount.toFixed(2) : Math.floor(minAmount).toString();
      }
      
      // Update profit calculation
      updateProfitOnWin();
    });
  });

  // Set up event listener for game control currency dropdown
  currencySelect.addEventListener('change', () => {
    const currency = currencySelect.value;
    
    // Update bet amount to minimum for the selected currency
    const betAmountInput = document.getElementById('betAmount');
    if (betAmountInput && BET_LIMITS[currency]) {
      const minAmount = BET_LIMITS[currency].min;
      betAmountInput.value = currency === 'USD' ? minAmount.toFixed(2) : Math.floor(minAmount).toString();
    }
    
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
    
    // Update profit calculation
    updateProfitOnWin();
  });
}

// ─── Validate and auto-adjust bet amount based on limits ───────────────────
function validateAndAdjustBetAmount() {
  const betAmountInput = document.getElementById('betAmount');
  const currencySelect = document.getElementById('currency');
  
  if (!betAmountInput || !currencySelect) return;
  
  const currency = currencySelect.value;
  const currentAmount = parseFloat(betAmountInput.value) || 0;
  const limits = BET_LIMITS[currency];
  
  if (!limits) return;
  
  let adjustedAmount = currentAmount;
  
  // Adjust if below minimum
  if (currentAmount < limits.min) {
    adjustedAmount = limits.min;
  }
  // Adjust if above maximum
  else if (currentAmount > limits.max) {
    adjustedAmount = limits.max;
  }
  
  // Update input value if adjustment was needed
  if (adjustedAmount !== currentAmount) {
    betAmountInput.value = currency === 'USD' ? adjustedAmount.toFixed(2) : Math.floor(adjustedAmount).toString();
    // Update profit calculation with new amount
    updateProfitOnWin();
  }
}

// ─── Manage UI state based on game activity ───────────────────────────────
function updateGameControlsState(isGameActive) {
  const currencySelect = document.getElementById('currency');
  const difficultySelect = document.getElementById('difficulty');
  const betAmountInput = document.getElementById('betAmount');
  
  if (!currencySelect || !difficultySelect || !betAmountInput) return;
  
  if (isGameActive) {
    // Disable controls when game is active
    currencySelect.disabled = true;
    difficultySelect.disabled = true;
    betAmountInput.disabled = true;
    
    // Lower opacity for dropdowns (but not bet amount input)
    currencySelect.style.opacity = '0.5';
    difficultySelect.style.opacity = '0.5';
    // Keep bet amount input at full opacity
    betAmountInput.style.opacity = '1';
  } else {
    // Enable controls when game is not active
    currencySelect.disabled = false;
    difficultySelect.disabled = false;
    betAmountInput.disabled = false;
    
    // Restore full opacity
    currencySelect.style.opacity = '1';
    difficultySelect.style.opacity = '1';
    betAmountInput.style.opacity = '1';
  }
}

// Helper function to update profit on win display
function updateProfitOnWin() {
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const currency = document.getElementById('currency').value;
  const currentMultiplier = window.pumpGame ? window.pumpGame.gameState.currentMultiplier : 1.00;
  const potentialWin = betAmount * currentMultiplier;
  document.getElementById('profitOnWin').textContent = formatCurrencyAmount(potentialWin, currency);
}

// Get session info
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

// Pump multiplier tables for different difficulties
const pumpMultipliers = {
  easy: [
    1.00, 1.02, 1.07, 1.11, 1.17, 1.24, 1.32, 1.41, 1.51, 1.62,
    1.74, 1.87, 2.01, 2.16, 2.32, 2.49, 2.67, 2.86, 3.06, 3.27,
    3.49, 3.72, 3.96, 4.21, 24.50
  ],
  medium: [
    1.00, 1.11, 1.27, 1.46, 1.69, 1.98, 2.33, 2.76, 3.31, 4.03,
    4.95, 6.19, 7.88, 10.25, 13.66, 18.78, 26.83, 40.25, 64.40, 112.70,
    225.40, 536.50, 1073.00
  ]
};

// Pump Game Class
class PumpGame {
  constructor() {
    this.canvas = document.getElementById('pumpCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.pumpBase = new Image();
    this.balloonTip = new Image();
    this.balloon = new Image();
    
    // Initialize difficulty
    this.currentDifficulty = 'easy';
    
                   this.gameState = {
        isPlaying: false,
        balloonSize: 1.0,
        maxBalloonSize: 24.0, // Changed to 24 for testing
        pumpSpeed: 0.35, // Increased from 0.3 for even more balloon growth per pump
        isPopped: false,
        pumpCount: 0,
        currentMultiplier: 1.00, // Current multiplier from backend
        displayMultiplier: 1.00, // Display multiplier for animation
        multiplierAnimation: {
          isActive: false,
          startValue: 1.00,
          targetValue: 1.00,
          duration: 500, // 500ms for smooth counting animation
          startTime: 0
        },
        balloonShake: 0, // Shake offset for realistic movement
        balloonRotation: 0, // Rotation angle for realistic wobble
       popAnimation: {
         isActive: false,
         scale: 0.2,
         targetScale: 1.4,
         duration: 200,
         startTime: 0,
         secondWave: {
           isActive: false,
           scale: 0.4,
           targetScale: 1.2,
           duration: 200,
           startTime: 0
         }
       },
       flyAwayAnimation: {
         isActive: false,
         startTime: 0,
         duration: 2000, // 1.5 seconds
         startY: 0,
         targetY: -1000, // Fly up and out of view
         startRotation: 0,
         targetRotation: 0.5, // Slight rotation as it flies away
         startScale: 1.0,
         targetScale: 0.8 // Slightly shrink as it flies away
       }
     };
    
    this.init();
  }
  
     async init() {
     // Load images
     this.pumpBase.src = 'pump-base.svg';
     this.balloonTip.src = 'balloon-tip.png';
     this.balloon.src = 'balloon.png';
     
     // Wait for all images to load
     await Promise.all([
       new Promise(resolve => this.pumpBase.onload = resolve),
       new Promise(resolve => this.balloonTip.onload = resolve),
       new Promise(resolve => this.balloon.onload = resolve)
     ]);
     
     this.setupCanvas();
     this.draw();
     this.setupEventListeners();
     this.updateMultiplierTable(); // Initialize multiplier table
     
     // Setup win message functionality
     this.setupWinMessage();
   }
  
  setupCanvas() {
    // Set canvas size to match display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Calculate center position
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    
    // Store original dimensions for scaling
    this.originalBaseWidth = this.canvas.width;
    this.originalBaseHeight = this.originalBaseWidth * 0.18;
    
    this.updateDimensions();
  }
  
  updateDimensions() {
    // Calculate scale factor based on balloon size
    // As balloon grows, everything else scales down to create zoom effect
    const scaleFactor = Math.max(0.4, 1 - (this.gameState.balloonSize - 1) * 0.35);
    
    // Calculate pump base dimensions with scaling
    this.baseWidth = this.originalBaseWidth * scaleFactor;
    this.baseHeight = this.originalBaseHeight * scaleFactor;
    this.baseX = this.centerX - this.baseWidth / 2;
    this.baseY = this.canvas.height - this.baseHeight;
    
    // Calculate nozzle position (center of the pump base)
    this.nozzleX = this.centerX;
    this.nozzleY = this.baseY + this.baseHeight * 0.25;
    
    // Calculate tip dimensions with scaling
    this.tipWidth = this.originalBaseWidth * 0.045 * scaleFactor;
    this.tipHeight = this.tipWidth * 0.8;
    this.tipX = this.nozzleX - 2 - this.tipWidth / 2;
    this.tipY = this.nozzleY - 15 - this.tipHeight + (1 - scaleFactor) * 25; // Move down more as base shrinks
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update dimensions based on current balloon size
    this.updateDimensions();
    
    // Draw pump base
    this.ctx.drawImage(this.pumpBase, this.baseX, this.baseY, this.baseWidth, this.baseHeight);
    
         // Only draw balloon tip and balloon if not popped
     if (!this.gameState.isPopped) {
       // Calculate tip scale factor separately (0.15 for tip, 0.35 for everything else)
       const tipScaleFactor = Math.max(0.6, 1 - (this.gameState.balloonSize - 1) * 0.15);
       
       // Calculate base positions
       let tipX = this.nozzleX + 3 - (this.originalBaseWidth * 0.045 * tipScaleFactor) / 2;
       let tipY = this.nozzleY - 15 - (this.originalBaseWidth * 0.045 * tipScaleFactor) * 0.8 + (1 - tipScaleFactor) * 20;
       
       // Apply fly away animation if active
       if (this.gameState.flyAwayAnimation.isActive) {
         const anim = this.gameState.flyAwayAnimation;
         const currentTime = performance.now();
         const elapsed = currentTime - anim.startTime;
         const progress = Math.min(elapsed / anim.duration, 1);
         
         // Easing function for smooth animation
         const easeOut = 1 - Math.pow(1 - progress, 3);
         
         // Calculate animation values
         const currentY = anim.startY + (anim.targetY - anim.startY) * easeOut;
         const currentRotation = anim.startRotation + (anim.targetRotation - anim.startRotation) * easeOut;
         const currentScale = anim.startScale + (anim.targetScale - anim.startScale) * easeOut;
         
         // Apply transformations
         tipY += currentY;
         
         // Draw balloon tip with fly away animation
         const tipWidth = this.originalBaseWidth * 0.045 * tipScaleFactor * currentScale;
         const tipHeight = tipWidth * 0.8;
         tipX = this.nozzleX + 3 - tipWidth / 2;
         
         this.ctx.save();
         this.ctx.translate(tipX + tipWidth / 2, tipY + tipHeight / 2);
         this.ctx.rotate(currentRotation);
         this.ctx.drawImage(this.balloonTip, -tipWidth / 2, -tipHeight / 2, tipWidth, tipHeight);
         this.ctx.restore();
         
         // Draw balloon connected to tip with fly away animation
         const baseBalloonWidth = this.canvas.width * 0.35;
         const balloonWidth = baseBalloonWidth * (1 + (this.gameState.balloonSize - 1) * 0.05) * currentScale;
         const aspectRatio = this.balloon.naturalHeight / this.balloon.naturalWidth;
         const balloonHeight = balloonWidth * aspectRatio;
         const balloonX = this.nozzleX + 2 - balloonWidth / 2 + this.gameState.balloonShake;
         const balloonY = tipY - balloonHeight + tipHeight * 0.8 - 10 + (1 - tipScaleFactor) * 7.5;
         
         // Apply rotation to balloon for fly away animation
         this.ctx.save();
         this.ctx.translate(balloonX + balloonWidth / 2, balloonY + balloonHeight / 2);
         this.ctx.rotate(currentRotation);
         this.ctx.drawImage(this.balloon, -balloonWidth / 2, -balloonHeight / 2, balloonWidth, balloonHeight);
         this.ctx.restore();
         
         // Draw multiplier text in center of balloon when game is playing
         if (this.gameState.isPlaying) {
           this.drawMultiplierText(balloonX + balloonWidth / 2, balloonY + balloonHeight / 2);
         }
         
         // Continue animation if not complete
         if (progress < 1) {
           requestAnimationFrame(() => this.draw());
         } else {
           // Animation complete, reset state
           this.gameState.flyAwayAnimation.isActive = false;
         }
         
       } else {
         // Normal drawing without fly away animation
         const tipWidth = this.originalBaseWidth * 0.045 * tipScaleFactor;
         const tipHeight = tipWidth * 0.8;
         tipX = this.nozzleX + 3 - tipWidth / 2;
         
         this.ctx.drawImage(this.balloonTip, tipX, tipY, tipWidth, tipHeight);
         
         // Draw balloon connected to tip
         const baseBalloonWidth = this.canvas.width * 0.35;
         const balloonWidth = baseBalloonWidth * (1 + (this.gameState.balloonSize - 1) * 0.05);
         const aspectRatio = this.balloon.naturalHeight / this.balloon.naturalWidth;
         const balloonHeight = balloonWidth * aspectRatio;
         const balloonX = this.nozzleX + 2 - balloonWidth / 2 + this.gameState.balloonShake;
         const balloonY = tipY - balloonHeight + tipHeight * 0.8 - 10 + (1 - tipScaleFactor) * 7.5;
         
         // Apply rotation to balloon for realistic wobble
         this.ctx.save();
         this.ctx.translate(balloonX + balloonWidth / 2, balloonY + balloonHeight / 2);
         this.ctx.rotate(this.gameState.balloonRotation);
         this.ctx.drawImage(this.balloon, -balloonWidth / 2, -balloonHeight / 2, balloonWidth, balloonHeight);
         this.ctx.restore();
         
         // Draw multiplier text in center of balloon when game is playing
         if (this.gameState.isPlaying) {
           this.drawMultiplierText(balloonX + balloonWidth / 2, balloonY + balloonHeight / 2);
         }
       }
       
     } else {
       // Draw pop animation
       this.drawPopAnimation();
     }
  }
  
  drawPopEffect() {
    // Simple pop effect - can be enhanced with particles
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('POP!', this.centerX, this.centerY);
  }
  
  drawMultiplierText(centerX, centerY) {
    // Use the display multiplier for smooth animation
    const displayMultiplier = this.gameState.displayMultiplier || 1.00;
    
    // Calculate responsive font size based on balloon size
    const baseFontSize = 32;
    const balloonSize = this.gameState.balloonSize;
    // Scale font size with balloon size, with min/max bounds
    const responsiveFontSize = Math.max(16, Math.min(48, baseFontSize * (0.8 + balloonSize * 0.2)));
    
    // Set text style with shadow for better visibility
    // Change color to red if balloon is popped
    this.ctx.fillStyle = this.gameState.isPopped ? '#ea183a' : 'white';
    this.ctx.font = `bold ${responsiveFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    // Draw multiplier text with 2 decimal places
    this.ctx.fillText(`${displayMultiplier.toFixed(2)}x`, centerX, centerY);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
  
  startMultiplierAnimation(targetValue) {
    const anim = this.gameState.multiplierAnimation;
    anim.isActive = true;
    anim.startValue = this.gameState.displayMultiplier;
    anim.targetValue = targetValue;
    anim.startTime = performance.now();
    
    // Start the animation loop
    this.animateMultiplier();
  }
  
  animateMultiplier() {
    const anim = this.gameState.multiplierAnimation;
    if (!anim.isActive) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    
    // Easing function for smooth counting animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Calculate current display value
    this.gameState.displayMultiplier = anim.startValue + (anim.targetValue - anim.startValue) * easeOut;
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(() => this.animateMultiplier());
    } else {
      // Animation complete
      anim.isActive = false;
      this.gameState.displayMultiplier = anim.targetValue;
    }
  }
  
  setupEventListeners() {
    // Add debounce tracking for button clicks
    this.buttonDebounce = {
      playBtn: false,
      pumpBtn: false,
      cashoutBtn: false,
      canvas: false
    };
    
    // Handle canvas click for pumping
    this.canvas.addEventListener('click', (e) => {
      if (!this.gameState.isPopped && !this.buttonDebounce.canvas) {
        this.buttonDebounce.canvas = true;
        this.manualPump();
        // Re-enable after 500ms
        setTimeout(() => {
          this.buttonDebounce.canvas = false;
        }, 500);
      }
    });
    
    // Handle play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (!this.buttonDebounce.playBtn) {
          this.buttonDebounce.playBtn = true;
          this.startGame();
          // Re-enable after 1000ms (longer for game start)
          setTimeout(() => {
            this.buttonDebounce.playBtn = false;
          }, 1000);
        }
      });
    }
    
         // Handle pump button
     const pumpBtn = document.getElementById('pumpBtn');
     if (pumpBtn) {
       pumpBtn.addEventListener('click', () => {
         if (!this.gameState.isPopped && !this.buttonDebounce.pumpBtn && this.gameState.isPlaying) {
           this.buttonDebounce.pumpBtn = true;
           this.manualPump();
           // Re-enable debounce after 800ms (longer to cover animation time)
           setTimeout(() => {
             this.buttonDebounce.pumpBtn = false;
           }, 800);
         }
       });
     }
    
    // Handle cashout button
    const cashoutBtn = document.getElementById('cashoutBtn');
    if (cashoutBtn) {
      cashoutBtn.addEventListener('click', () => {
        if (this.gameState.isPlaying && this.gameState.pumpCount > 0 && !this.buttonDebounce.cashoutBtn) {
          this.buttonDebounce.cashoutBtn = true;
          this.performCashout();
          // Re-enable after 1000ms (longer for cashout)
          setTimeout(() => {
            this.buttonDebounce.cashoutBtn = false;
          }, 1000);
        }
      });
    }
    
    // Handle difficulty changes
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
      difficultySelect.addEventListener('change', (e) => {
        this.currentDifficulty = e.target.value;
        this.updateMultiplierTable();
        // Reset game state when difficulty changes
        this.resetGame();
      });
    }
    
    // Handle bet amount changes
    const betAmountInput = document.getElementById('betAmount');
    if (betAmountInput) {
      betAmountInput.addEventListener('input', () => {
        updateProfitOnWin();
      });
      
      // Auto-adjust bet amount when user finishes input (blur event)
      betAmountInput.addEventListener('blur', () => {
        validateAndAdjustBetAmount();
      });
      
      // Also validate on change event for programmatic changes
      betAmountInput.addEventListener('change', () => {
        validateAndAdjustBetAmount();
      });
    }
    
         // Handle window resize
     window.addEventListener('resize', () => {
       this.setupCanvas();
       this.draw();
     });
   }
   
   setupWinMessage() {
     // Get the win message element
     this.winMessageDiv = document.querySelector('.win-message');
     
     // Add click event listener to canvas to dismiss win message
     this.canvas.addEventListener('click', () => {
       if (this.winMessageDiv.classList.contains('visible')) {
         this.hideWinMessage();
       }
     });
   }
   
   showWinMessage(multiplier, amount, currency) {
     if (this.winMessageDiv) {
       this.winMessageDiv.querySelector('.multiplier').textContent = multiplier.toFixed(2) + 'x';
       this.winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
       this.winMessageDiv.classList.add('visible');
     }
   }
   
   hideWinMessage() {
     if (this.winMessageDiv) {
       this.winMessageDiv.classList.remove('visible');
     }
   }
  
  manualPump() {
    if (this.gameState.isPopped || !this.gameState.isPlaying) return;
    
    // Immediately disable pump button to prevent rapid clicking during pump animation
    const pumpBtn = document.getElementById('pumpBtn');
    if (pumpBtn) {
      pumpBtn.disabled = true;
      pumpBtn.style.opacity = '0.5';
    }
    
    // Call backend to check pump result
    this.performPump();
  }
  
  async performPump() {
    try {
      const response = await fetch('/games/pump/pump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to pump');
        // Re-enable pump button on error
        const pumpBtn = document.getElementById('pumpBtn');
        if (pumpBtn && this.gameState.isPlaying && !this.gameState.isPopped) {
          pumpBtn.disabled = false;
          pumpBtn.style.opacity = '1';
        }
        return;
      }

      // Update pump count and multiplier from backend
      this.gameState.pumpCount = data.pumpCount;
      this.gameState.currentMultiplier = data.multiplier;
      
      // Start multiplier animation to new value
      this.startMultiplierAnimation(data.multiplier);
      
      // Start the pump animation
      this.animateManualPump(data.popped, data.multiplier, data.autoWin, data.winAmount, data);
      
    } catch (error) {
      console.error('Error performing pump:', error);
      alert('Failed to pump. Please try again.');
      // Re-enable pump button on error
      const pumpBtn = document.getElementById('pumpBtn');
      if (pumpBtn && this.gameState.isPlaying && !this.gameState.isPopped) {
        pumpBtn.disabled = false;
        pumpBtn.style.opacity = '1';
      }
    }
  }

  animateManualPump(popped = false, multiplier = 1.0, autoWin = false, winAmount = 0, data = null) {
    const targetSize = this.gameState.balloonSize + this.gameState.pumpSpeed;
    const startSize = this.gameState.balloonSize;
    const duration = 300; // 300ms for smooth animation
    const startTime = performance.now();
    
    // Generate random phase offset for shake animation
    const randomPhase = Math.random() * Math.PI * 2; // Random phase between 0 and 2π
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.gameState.balloonSize = startSize + (targetSize - startSize) * easeOut;
      
      // Add shaking animation with different intensities for left vs right
      const shakeFrequency = 20; // how fast it shakes
      const sineValue = Math.sin((elapsed * shakeFrequency / 1000) + randomPhase);
      
      // Apply shake and rotation with consistent amounts
      const shakeOffset = sineValue * 5 * (1 - progress);
      const rotationOffset = sineValue * 0.03 * (1 - progress); // 0.03 radians ≈ 1.7 degrees
      
      this.gameState.balloonShake = shakeOffset;
      this.gameState.balloonRotation = rotationOffset;
      
      this.draw();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Reset shake and rotation when animation completes
        this.gameState.balloonShake = 0;
        this.gameState.balloonRotation = 0;
        
                 // Handle game result after animation
         if (popped) {
           this.popBalloon();
         } else if (autoWin) {
           this.handleAutoWin(multiplier, winAmount, data);
         } else {
           // Continue game - update UI for next pump
           this.updateGameUI(multiplier);
           
           // Re-enable pump button only if game continues
           const pumpBtn = document.getElementById('pumpBtn');
           if (pumpBtn && this.gameState.isPlaying && !this.gameState.isPopped) {
             pumpBtn.disabled = false;
             pumpBtn.style.opacity = '1';
           }
         }
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  drawPopAnimation() {
    let shouldContinue = false;
    
    // Draw first wave
    if (this.gameState.popAnimation.isActive) {
      const anim = this.gameState.popAnimation;
      const currentTime = performance.now();
      const elapsed = currentTime - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      
      // Easing function for smooth expansion
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Calculate current scale
      const currentScale = anim.scale + (anim.targetScale - anim.scale) * easeOut;
      
      // Draw first wave hollow circle
      const radius = this.canvas.width * 0.15 * currentScale;
      this.ctx.strokeStyle = 'rgba(233, 17, 60, 0.8)';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      if (progress < 1) {
        shouldContinue = true;
      } else {
        this.gameState.popAnimation.isActive = false;
      }
    }
    
    // Draw second wave
    if (this.gameState.popAnimation.secondWave.isActive) {
      const secondAnim = this.gameState.popAnimation.secondWave;
      const currentTime = performance.now();
      const elapsed = currentTime - secondAnim.startTime;
      const progress = Math.min(elapsed / secondAnim.duration, 1);
      
      // Easing function for smooth expansion
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Calculate current scale
      const currentScale = secondAnim.scale + (secondAnim.targetScale - secondAnim.scale) * easeOut;
      
      // Draw second wave hollow circle
      const radius = this.canvas.width * 0.15 * currentScale;
      this.ctx.strokeStyle = 'rgba(233, 17, 60, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      if (progress < 1) {
        shouldContinue = true;
      } else {
        this.gameState.popAnimation.secondWave.isActive = false;
      }
    }
    
    // Draw multiplier text in red during pop animation
    // Calculate balloon position for text placement (same as normal drawing)
    const tipScaleFactor = Math.max(0.6, 1 - (this.gameState.balloonSize - 1) * 0.15);
    const tipWidth = this.originalBaseWidth * 0.045 * tipScaleFactor;
    const tipHeight = tipWidth * 0.8;
    const tipX = this.nozzleX + 3 - tipWidth / 2;
    const tipY = this.nozzleY - 15 - tipHeight + (1 - tipScaleFactor) * 20;
    
    const baseBalloonWidth = this.canvas.width * 0.35;
    const balloonWidth = baseBalloonWidth * (1 + (this.gameState.balloonSize - 1) * 0.05);
    const aspectRatio = this.balloon.naturalHeight / this.balloon.naturalWidth;
    const balloonHeight = balloonWidth * aspectRatio;
    const balloonX = this.nozzleX + 2 - balloonWidth / 2;
    const balloonY = tipY - balloonHeight + tipHeight * 0.8 - 10 + (1 - tipScaleFactor) * 7.5;
    
    // Draw multiplier text in center of balloon (will be red due to isPopped state)
    this.drawMultiplierText(balloonX + balloonWidth / 2, balloonY + balloonHeight / 2);
    
    // Continue animation if either wave is still active
    if (shouldContinue) {
      requestAnimationFrame(() => this.draw());
    } else {
      // Both animations complete, ensure both are deactivated
      this.gameState.popAnimation.isActive = false;
      this.gameState.popAnimation.secondWave.isActive = false;
      // Force a redraw to remove pop images
      setTimeout(() => {
        this.draw();
      }, 0);
    }
  }
  
  popBalloon() {
    this.gameState.isPopped = true;
    this.gameState.isPlaying = false;
    
    // Start first wave pop animation
    this.gameState.popAnimation.isActive = true;
    this.gameState.popAnimation.startTime = performance.now();
    
    // Start second wave halfway through first wave
    setTimeout(() => {
      this.gameState.popAnimation.secondWave.isActive = true;
      this.gameState.popAnimation.secondWave.startTime = performance.now();
    }, this.gameState.popAnimation.duration / 2);
    
    // Play pop sound if available
    // TODO: Add pop sound effect
    
    console.log(`Balloon popped after ${this.gameState.pumpCount} pumps!`);
    
    // Update multiplier table to show pop position in red
    // Use pumpCount (not +1) because this is the current position where the player lost
    this.updateMultiplierTableWithPop(this.gameState.pumpCount);
    
    // Show play button and disable pump/cashout buttons
    document.getElementById('playBtn').style.display = 'block';
    document.getElementById('pumpBtn').style.opacity = '0.5';
    document.getElementById('pumpBtn').disabled = true;
    document.getElementById('cashoutBtn').style.display = 'none';
    document.getElementById('profitOnWinContainer').style.display = 'none';
    
    // Re-enable game controls when game ends
    updateGameControlsState(false);
    
    // Reset button debounce states when game ends
    if (this.buttonDebounce) {
      this.buttonDebounce.playBtn = false;
      this.buttonDebounce.pumpBtn = false;
      this.buttonDebounce.cashoutBtn = false;
      this.buttonDebounce.canvas = false;
    }
    
    this.draw();
  }

     startFlyAwayAnimation() {
     this.gameState.flyAwayAnimation.isActive = true;
     this.gameState.flyAwayAnimation.startTime = performance.now();
     this.draw(); // Start the animation
   }
   
               handleAutoWin(multiplier, winAmount, data = null) {
       this.gameState.isPlaying = false;
       this.gameState.currentMultiplier = multiplier; // Store final multiplier
       this.startMultiplierAnimation(multiplier); // Animate to final multiplier
      
      // Update balance display - use newBalance from server response
      const currency = data && data.currency ? data.currency : document.getElementById('currency').value;
      const newBalance = data && data.newBalance ? data.newBalance : winAmount;
      if (window.updateNavbarBalance) {
        window.updateNavbarBalance(currency, newBalance);
      }
      
      // Show win message
      this.showWinMessage(multiplier, winAmount, currency);
      
      // Update multiplier table to show all positions as won (green)
      // Use pumpCount + 1 because the first position (1.00x) is the starting position
      this.updateMultiplierTableWithWin(this.gameState.pumpCount + 1);
      
      // Start fly away animation
      this.startFlyAwayAnimation();
      
             // Show play button and disable pump/cashout buttons after animation

        document.getElementById('playBtn').style.display = 'block';
        document.getElementById('pumpBtn').style.opacity = '0.5';
        document.getElementById('pumpBtn').disabled = true;
        document.getElementById('cashoutBtn').style.display = 'none';
        document.getElementById('profitOnWinContainer').style.display = 'none';
        
        // Re-enable game controls when game ends
        updateGameControlsState(false);
        
        // Reset button debounce states when game ends
        if (this.buttonDebounce) {
          this.buttonDebounce.playBtn = false;
          this.buttonDebounce.pumpBtn = false;
          this.buttonDebounce.cashoutBtn = false;
          this.buttonDebounce.canvas = false;
        }
  
      console.log(`Auto win after ${this.gameState.pumpCount} pumps with ${multiplier.toFixed(2)}x multiplier!`);
    }

  updateGameUI(multiplier) {
    // Update profit on win display
    updateProfitOnWin();
    
    // Update multiplier table with current position highlighted
    // Use pumpCount + 1 because the first position (1.00x) is the starting position
    this.updateMultiplierTableWithHighlight(this.gameState.pumpCount + 1);
    
    // Enable cashout button after first pump (pumpCount > 0 means at least one pump was made)
    const cashoutBtn = document.getElementById('cashoutBtn');
    if (cashoutBtn && this.gameState.pumpCount > 0) {
      cashoutBtn.disabled = false;
    }
    
    console.log(`Pump ${this.gameState.pumpCount}: Current multiplier ${multiplier.toFixed(2)}x`);
  }

  // Update profit display when game starts
  updateInitialProfit() {
    updateProfitOnWin();
    
    // Update multiplier table with initial position highlighted (1.00x is the starting position)
    this.updateMultiplierTableWithHighlight(1);
  }
  
  updateMultiplierTable() {
    const multiplierTable = document.querySelector('.multiplier-table');
    if (!multiplierTable) return;
    
    const multipliers = pumpMultipliers[this.currentDifficulty] || pumpMultipliers.easy;
    
    // Clear existing multiplier items
    multiplierTable.innerHTML = '';
    
    // Add new multiplier items
    multipliers.forEach((multiplier, index) => {
      const multiplierItem = document.createElement('div');
      multiplierItem.className = 'multiplier-item';
      multiplierItem.textContent = `${multiplier.toFixed(2)}x`;
      multiplierItem.setAttribute('data-index', index + 1); // 1-based index
      multiplierTable.appendChild(multiplierItem);
    });
  }

  updateMultiplierTableWithHighlight(currentPump) {
    const multiplierTable = document.querySelector('.multiplier-table');
    if (!multiplierTable) return;
    
    const multipliers = pumpMultipliers[this.currentDifficulty] || pumpMultipliers.easy;
    
    // Clear existing multiplier items
    multiplierTable.innerHTML = '';
    
    // Add new multiplier items with highlighting
    multipliers.forEach((multiplier, index) => {
      const multiplierItem = document.createElement('div');
      const position = index + 1; // 1-based position
      
      multiplierItem.className = 'multiplier-item';
      multiplierItem.textContent = `${multiplier.toFixed(2)}x`;
      multiplierItem.setAttribute('data-index', position);
      
      // Apply highlighting based on position
      if (position === currentPump) {
        // Current position - highlighted green
        multiplierItem.style.backgroundColor = '#00e53d';
        multiplierItem.style.color = 'black';
      } else if (position < currentPump) {
        // Past positions - lowered opacity (0.5)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        multiplierItem.style.color = 'rgba(255, 255, 255, 0.5)';
      } else {
        // Future positions - default (original color)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        multiplierItem.style.color = '#fff';
        multiplierItem.style.border = 'none';
      }
      
      multiplierTable.appendChild(multiplierItem);
    });
    
    // Auto-scroll to keep current multiplier as 2nd in view
    this.scrollToCurrentMultiplier(currentPump);
  }

  updateMultiplierTableWithPop(popPump) {
    const multiplierTable = document.querySelector('.multiplier-table');
    if (!multiplierTable) return;
    
    const multipliers = pumpMultipliers[this.currentDifficulty] || pumpMultipliers.easy;
    
    // Clear existing multiplier items
    multiplierTable.innerHTML = '';
    
    // Add new multiplier items with pop highlighting
    multipliers.forEach((multiplier, index) => {
      const multiplierItem = document.createElement('div');
      const position = index + 1; // 1-based position
      
      multiplierItem.className = 'multiplier-item';
      multiplierItem.textContent = `${multiplier.toFixed(2)}x`;
      multiplierItem.setAttribute('data-index', position);
      
      // Apply highlighting based on position
      if (position === popPump) {
        // Pop position - red (lost)
        multiplierItem.style.backgroundColor = '#ea183a';
        multiplierItem.style.color = 'white';
      } else if (position < popPump) {
        // Past positions - lowered opacity (0.5)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        multiplierItem.style.color = 'rgba(255, 255, 255, 0.5)';
      } else {
        // Future positions - default (original color)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        multiplierItem.style.color = '#fff';
        multiplierItem.style.border = 'none';
      }
      
      multiplierTable.appendChild(multiplierItem);
    });
    
    // Auto-scroll to keep pop multiplier as 2nd in view
    this.scrollToCurrentMultiplier(popPump);
  }

  updateMultiplierTableWithWin(winPump) {
    const multiplierTable = document.querySelector('.multiplier-table');
    if (!multiplierTable) return;
    
    const multipliers = pumpMultipliers[this.currentDifficulty] || pumpMultipliers.easy;
    
    // Clear existing multiplier items
    multiplierTable.innerHTML = '';
    
    // Add new multiplier items with win highlighting
    multipliers.forEach((multiplier, index) => {
      const multiplierItem = document.createElement('div');
      const position = index + 1; // 1-based position
      
      multiplierItem.className = 'multiplier-item';
      multiplierItem.textContent = `${multiplier.toFixed(2)}x`;
      multiplierItem.setAttribute('data-index', position);
      
      // Apply highlighting based on position
      if (position === winPump) {
        // Win position - highlighted green
        multiplierItem.style.backgroundColor = '#00e53d';
        multiplierItem.style.color = 'black';
      } else if (position < winPump) {
        // Past positions - lowered opacity (0.5)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        multiplierItem.style.color = 'rgba(255, 255, 255, 0.5)';
      } else {
        // Future positions - default (original color)
        multiplierItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        multiplierItem.style.color = '#fff';
        multiplierItem.style.border = 'none';
      }
      
      multiplierTable.appendChild(multiplierItem);
    });
    
    // Auto-scroll to keep win multiplier as 2nd in view
    this.scrollToCurrentMultiplier(winPump);
  }
  
  scrollToCurrentMultiplier(currentPump) {
    const multiplierTable = document.querySelector('.multiplier-table');
    if (!multiplierTable) return;
    
    const currentItem = multiplierTable.querySelector(`[data-index="${currentPump}"]`);
    if (!currentItem) return;
    
    // Calculate scroll position to keep current multiplier as 2nd in view
    const containerWidth = multiplierTable.offsetWidth;
    const itemWidth = currentItem.offsetWidth;
    const itemLeft = currentItem.offsetLeft;
    
    // Position the current multiplier as the 2nd item in view
    // This means we want it to be 1 item width from the left edge
    const targetScrollLeft = itemLeft - itemWidth;
    
    // Ensure we don't scroll past the beginning
    const scrollLeft = Math.max(0, targetScrollLeft);
    
    // Smooth scroll to the calculated position
    multiplierTable.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }
  
     async performCashout() {
     // Immediately disable pump button to prevent rapid clicking during cashout
     const pumpBtn = document.getElementById('pumpBtn');
     if (pumpBtn) {
       pumpBtn.disabled = true;
       pumpBtn.style.opacity = '0.5';
     }
     
     try {
       const response = await fetch('/games/pump/cashout', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         }
       });

       const data = await response.json();

       if (!response.ok) {
         alert(data.error || 'Failed to cashout');
         // Re-enable pump button on error
         if (pumpBtn && this.gameState.isPlaying && !this.gameState.isPopped) {
           pumpBtn.disabled = false;
           pumpBtn.style.opacity = '1';
         }
         return;
       }

      // Update balance display - use newBalance from server response
      const currency = data.currency || document.getElementById('currency').value;
      if (window.updateNavbarBalance) {
        window.updateNavbarBalance(currency, data.newBalance);
      }
      
             // Store final multiplier from backend
       this.gameState.currentMultiplier = data.multiplier;
       this.startMultiplierAnimation(data.multiplier); // Animate to final multiplier
       
       // Show win message
       this.showWinMessage(data.multiplier, data.winAmount, currency);
       
       // Update multiplier table to show final position as won (green)
       // Use pumpCount + 1 because the first position (1.00x) is the starting position
       this.updateMultiplierTableWithWin(data.pumpCount + 1);
      
      // End game
      this.gameState.isPlaying = false;
       
       // Start fly away animation
       this.startFlyAwayAnimation();
       
       // Show play button and disable pump/cashout buttons after animation
         document.getElementById('playBtn').style.display = 'block';
         document.getElementById('pumpBtn').style.opacity = '0.5';
         document.getElementById('pumpBtn').disabled = true;
         document.getElementById('cashoutBtn').style.display = 'none';
         document.getElementById('cashoutBtn').disabled = true;
         document.getElementById('profitOnWinContainer').style.display = 'none';
         
         // Re-enable game controls when game ends
         updateGameControlsState(false);
         
         // Reset button debounce states when game ends
         if (this.buttonDebounce) {
           this.buttonDebounce.playBtn = false;
           this.buttonDebounce.pumpBtn = false;
           this.buttonDebounce.cashoutBtn = false;
           this.buttonDebounce.canvas = false;
         }

      
      console.log(`Cashout after ${data.pumpCount} pumps with ${data.multiplier.toFixed(2)}x multiplier!`);
      
         } catch (error) {
       console.error('Error performing cashout:', error);
       alert('Failed to cashout. Please try again.');
       // Re-enable pump button on error
       const pumpBtn = document.getElementById('pumpBtn');
       if (pumpBtn && this.gameState.isPlaying && !this.gameState.isPopped) {
         pumpBtn.disabled = false;
         pumpBtn.style.opacity = '1';
       }
     }
  }
  
     resetGame() {
           this.gameState = {
        isPlaying: false,
        balloonSize: 1.0,
        maxBalloonSize: 24.0,
        pumpSpeed: 0.35,
        isPopped: false,
        pumpCount: 0, // Start at 0 (initial state)
        currentMultiplier: 1.00, // Reset to initial multiplier
        displayMultiplier: 1.00, // Reset display multiplier
        balloonShake: 0,
        balloonRotation: 0,
       popAnimation: {
         isActive: false,
         scale: 0.2,
         targetScale: 1.4,
         duration: 200,
         startTime: 0,
         secondWave: {
           isActive: false,
           scale: 0.4,
           targetScale: 1.2,
           duration: 200,
           startTime: 0
         }
       },
       multiplierAnimation: {
         isActive: false,
         startValue: 1.00,
         targetValue: 1.00,
         duration: 500, // 500ms for smooth counting animation
         startTime: 0
       },
       flyAwayAnimation: {
         isActive: false,
         startTime: 0,
         duration: 2000, // 2 seconds
         startY: 0,
         targetY: -1000, // Fly up and out of view
         startRotation: 0,
         targetRotation: 0.5, // Slight rotation as it flies away
         startScale: 1.0,
         targetScale: 0.8 // Slightly shrink as it flies away
       }
     };
    
    // Reset button debounce states
    if (this.buttonDebounce) {
      this.buttonDebounce.playBtn = false;
      this.buttonDebounce.pumpBtn = false;
      this.buttonDebounce.cashoutBtn = false;
      this.buttonDebounce.canvas = false;
    }
    
         // Reset UI buttons
     document.getElementById('playBtn').style.display = 'block';
     document.getElementById('pumpBtn').style.opacity = '0.5';
     document.getElementById('pumpBtn').disabled = true;
     document.getElementById('cashoutBtn').style.display = 'none';
     document.getElementById('cashoutBtn').disabled = true;
     document.getElementById('profitOnWinContainer').style.display = 'none';
     
     // Re-enable game controls when game is reset
     updateGameControlsState(false);
     
     // Hide any existing win message
     this.hideWinMessage();
     
     this.draw();
   }





  // Start game
  async startGame() {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = document.getElementById('currency').value;
    const difficulty = this.currentDifficulty;
    const selectedBalance = document.getElementById('selected-balance');
    const currentBalance = selectedBalance ? parseFloat(selectedBalance.textContent.replace(/[^\d.-]/g, '')) : 0;

    // Validate inputs
    if (betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (currentBalance < betAmount) {
      alert('Insufficient balance');
      return;
    }

    // Disable play button during request
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.disabled = true;
      playBtn.textContent = 'Starting...';
    }

    try {
      const response = await fetch('/games/pump/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betAmount,
          currency,
          difficulty
        })
      });

      const data = await response.json();

             if (data.success) {
         // Update navbar balance visually
         if (window.updateNavbarBalance) {
           window.updateNavbarBalance(currency, data.newBalance);
         }
         
                   // Reset game state for new game
          this.resetGame();
          this.gameState.isPlaying = true;
          this.gameState.currentMultiplier = 1.00; // Set initial multiplier
          this.gameState.displayMultiplier = 1.00; // Set initial display multiplier
          
          // Update initial profit display
          this.updateInitialProfit();
          
          // Redraw canvas to show initial multiplier text
          this.draw();
         
                   // Show pump and cashout buttons, hide play button
          document.getElementById('playBtn').style.display = 'none';
          document.getElementById('pumpBtn').style.opacity = '1';
          document.getElementById('pumpBtn').disabled = false;
          document.getElementById('cashoutBtn').style.display = 'block';
          document.getElementById('cashoutBtn').disabled = true;
          document.getElementById('profitOnWinContainer').style.display = 'flex';
         
         // Disable game controls when game is active
         updateGameControlsState(true);
         
         console.log('Game started successfully');
       } else {
         alert(data.error || 'Failed to start game');
       }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      // Re-enable play button
      if (playBtn) {
        playBtn.disabled = false;
        playBtn.textContent = 'Roll';
      }
    }
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pumpGame = new PumpGame();
  
  // Initialize currency synchronization
  syncCurrencySelections();
});

// Load user session when page loads
getSession();