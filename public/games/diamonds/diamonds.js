// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
    // Ensure amount is a valid number
    if (amount === null || amount === undefined || isNaN(amount)) {
        return currency === 'USD' ? '$0.00' : '£0';
    }

    if (currency === 'USD') {
        return `$${Number(amount).toFixed(2)}`;
    } else if (currency === 'LBP') {
        // Format LBP with commas and £ symbol
        return `£${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}

// Helper function to parse currency display to number
function parseBalanceDisplay(balanceText) {
    // Remove "Balance: " prefix and currency symbols
    const numStr = balanceText.replace('Balance: ', '').replace('$', '').replace('£', '').replace(/,/g, '');
    return parseFloat(numStr);
}

// Helper function to parse balance display text
// This is used to extract the numeric value from the balance display

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

// Synchronize currency selection with navbar
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
    
    // Reset bet amount to minimum for the selected currency
    resetBetAmountToMinimum();
  });

  // Listen for navbar currency changes to update game dropdown
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
        
        // Reset bet amount to minimum for the selected currency
        resetBetAmountToMinimum();
      }
    });
    
    observer.observe(selectedBalance, { childList: true, characterData: true, subtree: true });
  }
}

// Initialize currency sync when window loads
window.addEventListener('load', function() {
  // Initialize game first
  
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
  
  // Set up currency synchronization with navbar
  // We'll set this up with a slight delay to avoid affecting the initial bet amount
  setTimeout(() => {
    setupCurrencySync();
    
    // Initialize bet amount validation, but don't validate immediately
    setupBetAmountValidation(false);
  }, 100);
});

// ─── Bet Amount Validation ────────────────
function setupBetAmountValidation(validateNow = true) {
  const betAmountInput = document.getElementById('betAmount');
  if (!betAmountInput) return;
  
  // Set initial attributes based on current currency
  updateBetAmountAttributes();
  
  // Validate on blur (when user clicks away)
  betAmountInput.addEventListener('blur', validateBetAmount);
  
  // Validate on change (when user presses enter)
  betAmountInput.addEventListener('change', validateBetAmount);
  
  // Optionally validate immediately
  if (validateNow) {
    validateBetAmount();
  }
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

// Diamonds type
const diamondsColor = ['red', 'green', 'dark_blue', 'light_blue', 'purple', 'yellow', 'pink'];

const colorMap = {
    red: '#ff3956',
    green: '#00c533',
    dark_blue: '#357feb',
    light_blue: '#00d6de',
    purple: '#8753f4',
    yellow: '#fdce46',
    pink: '#ff6cbd',
}

// Load diamond images
const diamondImages = {};
function loadDiamondImages() {
    diamondsColor.forEach(color => {
        const img = new Image();
        img.src = `diamond_assets/${color}_diamond.png`;
        diamondImages[color] = img;
    });
}
loadDiamondImages();

// Display random diamonds on page load
function displayRandomDiamonds() {
    // Fill with random diamonds
    for (let i = 0; i < 5; i++) {
        currentDiamonds[i] = diamondsColor[Math.floor(Math.random() * diamondsColor.length)];
        // Set animation time in the past so they appear in place
        diamondAnimations[i] = Date.now() - 1000;
    }
    // Draw the tables with random diamonds
    drawTables();
    
    // Force another redraw after a slight delay to ensure diamonds are visible
    setTimeout(() => {
        drawTables();
    }, 100);
}

////////////////////////////////////////////////// Canvas //////////////////////////////////////////////////
const canvas = document.getElementById('diamondsCanvas');
const ctx = canvas.getContext('2d');

// Adjust canvas internal resolution to match CSS size
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawTables();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', function() {
  resizeCanvas();
  // Display random diamonds on page load after a slight delay
  // This ensures all images are loaded and canvas is ready
  setTimeout(() => {
    displayRandomDiamonds();
  }, 200);
});

// Game state
let currentDiamonds = Array(5).fill(null);
let isSpinning = false;
let diamondAnimations = Array(5).fill(null);
let dropAnimations = Array(5).fill(null);
let oldDiamonds = Array(5).fill(null);

function drawTables() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tableCount = 5;
    const spacing = canvas.width * 0.015;
    const tableWidth = canvas.width * 0.18;
    const tableHeight = canvas.height * 0.4;
    const radius = tableWidth * 0.04;

    const totalWidth = tableWidth * tableCount + spacing * (tableCount - 1);
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - tableHeight) / 2 * 1.6;

    // Draw tables and diamonds
    for (let i = 0; i < tableCount; i++) {
        const x = startX + i * (tableWidth + spacing);
        const y = startY;

        // Draw rounded table
        ctx.fillStyle = '#223842';
        drawRoundedRect(ctx, x, y, tableWidth, tableHeight, radius);

        // Draw bottom edge
        ctx.fillStyle = '#354451';
        const edgeHeight = Math.max(2, tableHeight * 0.15);
        ctx.fillRect(x, y + tableHeight - edgeHeight, tableWidth, edgeHeight);

        const diamondSize = Math.min(tableWidth, tableHeight) * 1.05;
        const diamondX = x + (tableWidth - diamondSize) / 2;
        const targetY = y + (tableHeight - diamondSize) / 2 - tableHeight * 0.45;

        // Draw dropping diamonds if they exist
        if (oldDiamonds[i] && dropAnimations[i]) {
            const dropProgress = Math.min(1, (Date.now() - dropAnimations[i]) / 300);
            const dropY = targetY + canvas.height * dropProgress * 1.5;
            
            const img = diamondImages[oldDiamonds[i]];
            if (img.complete && dropProgress < 1) {
                ctx.drawImage(img, diamondX, dropY, diamondSize, diamondSize);
            }
        }

        // Draw sliding diamonds if they exist and old diamonds are gone
        if (currentDiamonds[i] && diamondAnimations[i]) {
            // For initial display diamonds, use a completed animation
            const isInitialDisplay = Date.now() - diamondAnimations[i] > 900;
            
            // Calculate position based on animation progress
            let currentY;
            if (isInitialDisplay) {
                // For initial display, just show at final position
                currentY = targetY;
            } else {
                // For game animations, animate from top to position
                const startY = targetY - canvas.height * 0.5;
                const progress = Math.min(1, (Date.now() - diamondAnimations[i]) / 300);
                currentY = startY + (targetY - startY) * easeOutBack(progress);
            }
            
            // Draw the diamond
            const img = diamondImages[currentDiamonds[i]];
            if (img && img.complete) {
                ctx.drawImage(img, diamondX, currentY, diamondSize, diamondSize);
            }
        }
    }
    
    // Continue animation if any diamonds are animating
    if (dropAnimations.some(t => t && Date.now() - t < 300) || 
        diamondAnimations.some(t => t && Date.now() - t < 300)) {
        requestAnimationFrame(drawTables);
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
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
    ctx.fill();
}

// Easing function for bouncy effect
function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Show win message
function showWinMessage(multiplier, winAmount, currency) {
    console.log('Showing win message:', { multiplier, winAmount, currency }); // Debug log
    const winMessage = document.querySelector('.win-message');
    const multiplierEl = winMessage.querySelector('.multiplier');
    const amountEl = winMessage.querySelector('.amount');

    multiplierEl.textContent = `${multiplier.toFixed(2)}×`;
    amountEl.textContent = formatCurrencyAmount(winAmount, currency);
    winMessage.classList.add('visible');
}

// Add CSS for diamond colors
const style = document.createElement('style');
style.textContent = `
    .diamond-red { background-color: ${colorMap.red} !important; }
    .diamond-green { background-color: ${colorMap.green} !important; }
    .diamond-dark_blue { background-color: ${colorMap.dark_blue} !important; }
    .diamond-light_blue { background-color: ${colorMap.light_blue} !important; }
    .diamond-purple { background-color: ${colorMap.purple} !important; }
    .diamond-yellow { background-color: ${colorMap.yellow} !important; }
    .diamond-pink { background-color: ${colorMap.pink} !important; }

    .diamond-red-border { border: 2px solid ${colorMap.red} !important; }
    .diamond-green-border { border: 2px solid ${colorMap.green} !important; }
    .diamond-dark_blue-border { border: 2px solid ${colorMap.dark_blue} !important; }
    .diamond-light_blue-border { border: 2px solid ${colorMap.light_blue} !important; }
    .diamond-purple-border { border: 2px solid ${colorMap.purple} !important; }
    .diamond-yellow-border { border: 2px solid ${colorMap.yellow} !important; }
    .diamond-pink-border { border: 2px solid ${colorMap.pink} !important; }
`;
document.head.appendChild(style);

// Function to highlight winning pattern in payout table
function highlightWinningPattern(result, multiplier) {
    console.log('Highlighting pattern:', { result, multiplier }); // Debug log

    // Find the matching payout row based on multiplier
    const payoutRows = document.querySelectorAll('.payout-row');
    const winningRow = Array.from(payoutRows).find(row => 
        row.querySelector('.payout-multiplier').textContent === `${multiplier}×`
    );

    if (winningRow) {
        console.log('Found winning row:', winningRow); // Debug log
        
        // Find all matching groups in the result
        const matches = [];
        for (let i = 0; i < result.length - 1; i++) {
            let count = 1;
            for (let j = i + 1; j < result.length; j++) {
                if (result[i] === result[j]) {
                    count++;
                }
            }
            if (count >= 2 && !matches.some(m => m.color === result[i])) {
                matches.push({ color: result[i], count });
            }
        }

        // Sort matches by count in descending order
        matches.sort((a, b) => b.count - a.count);
        console.log('Found matches:', matches); // Debug log

        if (matches.length > 0) {
            // Get all diamonds in the winning row
            const diamonds = winningRow.querySelectorAll('.diamond-icon');
            
            // For each diamond in the payout row
            diamonds.forEach((diamond) => {
                if (diamond.classList.contains('diamond-win-pattern')) {
                    // For win patterns, use the color of the larger group
                    diamond.classList.add(`diamond-${matches[0].color}`);
                } else if (diamond.classList.contains('diamond-border-pattern') && matches.length > 1) {
                    // For border patterns in case of two groups, use the second group's color
                    diamond.classList.add(`diamond-${matches[1].color}-border`);
                }
            });
        }
    }
}

// Play button handler
document.getElementById('playBtn').addEventListener('click', async () => {
    if (isSpinning) return;

    // Validate bet amount first
    validateBetAmount();
    
    // Get bet amount and currency
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = getCurrency();

    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }

    // Get current balance from navbar display
    let currentBalance = 0;
    const selectedBalance = document.getElementById('selected-balance');
    
    if (selectedBalance) {
        const balanceText = selectedBalance.textContent;
        currentBalance = parseBalanceDisplay(balanceText);
    }
    
    // Check if we have enough balance
    if (currentBalance < betAmount) {
        alert(`Insufficient ${currency} balance`);
        return;
    }
    
    // Visually deduct bet amount from navbar display only
    if (window.updateNavbarBalance) {
        window.updateNavbarBalance(currency, currentBalance - betAmount);
    }

    isSpinning = true;
    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = true;

    // Clear win message at start of new game
    const winMessage = document.querySelector('.win-message');
    winMessage.classList.remove('visible');

    // Reset only color classes in payout table at start of new game
    document.querySelectorAll('.diamond-icon').forEach(diamond => {
        // Remove only color-related classes
        diamond.classList.remove(
            'diamond-red', 'diamond-green', 'diamond-dark_blue', 
            'diamond-light_blue', 'diamond-purple', 'diamond-yellow', 
            'diamond-pink', 'diamond-red-border', 'diamond-green-border',
            'diamond-dark_blue-border', 'diamond-light_blue-border',
            'diamond-purple-border', 'diamond-yellow-border',
            'diamond-pink-border'
        );
    });

    try {
        const response = await fetch('/games/diamonds/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: betAmount,
                currency: currency
            })
        });

        const data = await response.json();
        console.log('Backend response:', data); // Debug log for backend response

        if (!response.ok) {
            // If there's an error, refresh the balance from the server
            getSession().then(sessionData => {
                if (sessionData && window.updateNavbarBalance) {
                    window.updateNavbarBalance('USD', sessionData.balanceUSD);
                    window.updateNavbarBalance('LBP', sessionData.balanceLBP);
                }
            });
            throw new Error(data.error || 'Failed to play');
        }

        // Start drop animation for old diamonds
        oldDiamonds = [...currentDiamonds];
        dropAnimations = Array(5).fill(null);
        
        const startDropAnimation = () => {
            if (currentIndex < 5) {
                dropAnimations[currentIndex] = Date.now();
                currentDiamonds[currentIndex] = null;
                drawTables();
                currentIndex++;
                setTimeout(startDropAnimation, 100);
            } else {
                // After all diamonds have started dropping, start the new diamonds
                currentIndex = 0;
                diamondAnimations = Array(5).fill(null);
                setTimeout(startNewDiamonds, 50);
            }
        };

        const startNewDiamonds = () => {
            if (currentIndex < data.result.length) {
                currentDiamonds[currentIndex] = data.result[currentIndex];
                diamondAnimations[currentIndex] = Date.now();
                drawTables();
                currentIndex++;
                setTimeout(startNewDiamonds, 100);
            } else {
                // Animation complete
                isSpinning = false;
                playBtn.disabled = false;
                oldDiamonds = Array(5).fill(null);
                dropAnimations = Array(5).fill(null);

                // Show win message and highlight pattern after animations complete
                if (data.winAmount > 0) {
                    setTimeout(() => {
                        showWinMessage(data.multiplier, data.winAmount, currency);
                        highlightWinningPattern(data.result, data.multiplier.toFixed(2));
                        // Update balances with server response after showing win
                        if (window.updateNavbarBalance) {
                            window.updateNavbarBalance('USD', data.newBalanceUSD);
                            window.updateNavbarBalance('LBP', data.newBalanceLBP);
                        }
                    }, 300);
                } else {
                    // If no win, update balance with server data after animations
                    if (window.updateNavbarBalance) {
                        window.updateNavbarBalance('USD', data.newBalanceUSD);
                        window.updateNavbarBalance('LBP', data.newBalanceLBP);
                    }
                }
            }
        };

        // Reset current index and start animation sequence
        currentIndex = 0;
        startDropAnimation();

    } catch (error) {
        console.error('Game error:', error);
        alert(error.message);
        isSpinning = false;
        playBtn.disabled = false;
    }
});
  