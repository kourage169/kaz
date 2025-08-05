// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
      // Format USD with commas and 2 decimal places
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'LBP') {
      // Format LBP with commas and £ symbol, no decimal places
      return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
  }

  // Add bet limits at the top with other constants
const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

// Canvas and drawing setup
const canvas = document.getElementById('teenPattiCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match CSS dimensions
function setCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Initialize canvas size
setCanvasSize();

// Card back image
const cardBackImage = new Image();
cardBackImage.src = '/games/blackjack/card_back.png';

// Card dimensions and constants
const CARD_CORNER_RADIUS = 5;

// Card suit constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = {
  'hearts': '♥',
  'diamonds': '♦',
  'clubs': '♣',
  'spades': '♠'
};

const SUIT_COLORS = {
  'hearts': '#e74c3c',
  'diamonds': '#e74c3c',
  'clubs': '#2c3e50',
  'spades': '#2c3e50'
};

// Animation timing
const DEAL_ANIMATION_DURATION = 200; // ms
const FLIP_ANIMATION_DURATION = 300; // ms

// Track dealt cards
let dealtCards = {
    player: [],
    banker: []
};

// Track if game is in progress
let isGameActive = false;

// Track hand results
let handResults = {
    player: null,
    banker: null
};

// Track if animations are complete
let animationsComplete = false;

// Track if a game is in progress to prevent double clicks
let gameInProgress = false;

// Function to draw hand result counter
function drawHandResult(x, y, result, isPlayer, gameResult = null) {
    if (!isGameActive || !result) return; // Only draw if game is active and result exists
    
    const fontSize = CARD_WIDTH * 0.2; // Slightly smaller for longer text
    const padding = fontSize * 0.8; // More padding for longer text
    const verticalPadding = fontSize * 0.4;
    
    // Calculate width based on text length
    ctx.font = `bold ${fontSize}px Arial`;
    const textWidth = ctx.measureText(result).width;
    const width = textWidth + padding * 2;
    const height = fontSize + verticalPadding * 2;
    
    // Set background color based on game result
    if (gameResult) {
        if (gameResult === 'tie') {
            ctx.fillStyle = '#f39c12'; // Orange for tie
        } else if (gameResult === 'win') {
            ctx.fillStyle = '#24a969'; // Green for win
        } else if (gameResult === 'loss') {
            ctx.fillStyle = '#bd453a'; // Red for loss
        } else if ((gameResult === 'player' && isPlayer) || (gameResult === 'banker' && !isPlayer)) {
            ctx.fillStyle = '#24a969'; // Green for win
        } else {
            ctx.fillStyle = '#bd453a'; // Red for loss
        }
    } else {
        ctx.fillStyle = '#535759'; // Default gray when no result
    }
    
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x - width/2, y - height/2, width, height, height/3, true, false);
    ctx.restore();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result, x, y);
}

// Function to initialize card dimensions and positions
function initializeCardDimensions() {
    // Card dimensions and positions - make cards bigger
    window.CARD_WIDTH = canvas.width * 0.18; // Increased from 0.16
    window.CARD_HEIGHT = CARD_WIDTH * 1.6;
    window.CARD_SPACING = CARD_WIDTH * 0.4;
    window.CARD_VERTICAL_OFFSET = CARD_HEIGHT * 0.15;
    
    // Hand positions - move hands up and spread apart more
    window.HAND_Y = canvas.height * 0.5; // Moved up from 0.55
    window.GAP_BETWEEN_HANDS = CARD_WIDTH * 6; // Increased from 5
    
    // Player and Banker card positions - spread apart more
    window.PLAYER_FIRST_CARD_X = canvas.width * 0.12; // Moved left from 0.15
    window.BANKER_FIRST_CARD_X = canvas.width * 0.88 - (CARD_WIDTH + CARD_SPACING * 2); // Moved right from 0.9
}

// Function to resize canvas
function resizeCanvas() {
    setCanvasSize();
    
    // Recalculate card dimensions when canvas resizes
    initializeCardDimensions();
    
    // Redraw background
    drawBackground();
}

// Initialize card dimensions
initializeCardDimensions();

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
  
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
      
      // Update chip display based on selected currency
      updateChipsForCurrency(currency);
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
        selectedBalance.textContent = formatCurrencyAmount(parseFloat(matchingItem.textContent.replace(/[^0-9.-]+/g, '')), currency);
      }
      
      // Hide dropdown after selection
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    }
    
    // Update chip display based on selected currency
    updateChipsForCurrency(currency);
  });
}

// Function to update chip display based on currency
function updateChipsForCurrency(currency) {
  const usdChips = document.querySelectorAll('.usd-chip');
  const lbpChips = document.querySelectorAll('.lbp-chip');
  
  if (currency === 'USD') {
    usdChips.forEach(chip => chip.style.display = 'flex');
    lbpChips.forEach(chip => chip.style.display = 'none');
    
    // Select first USD chip if no chip is selected
    if (!selectedChip || !selectedChip.classList.contains('usd-chip')) {
      const firstUsdChip = document.querySelector('.usd-chip[data-value="1"]');
      if (firstUsdChip) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        firstUsdChip.classList.add('selected');
        selectedChip = firstUsdChip;
        selectedChipValue = parseFloat(firstUsdChip.dataset.value);
        updateTotalBetDisplay();
      }
    }
  } else if (currency === 'LBP') {
    usdChips.forEach(chip => chip.style.display = 'none');
    lbpChips.forEach(chip => chip.style.display = 'flex');
    
    // Select first LBP chip if no chip is selected
    if (!selectedChip || !selectedChip.classList.contains('lbp-chip')) {
      const firstLbpChip = document.querySelector('.lbp-chip[data-value="1000"]');
      if (firstLbpChip) {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        firstLbpChip.classList.add('selected');
        selectedChip = firstLbpChip;
        selectedChipValue = parseFloat(firstLbpChip.dataset.value);
        updateTotalBetDisplay();
      }
    }
  }
  
  // Clear all bets when switching currency since chip values are different
  clearAllBets();
}

// Initialize currency sync
syncCurrencySelections();

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
            updateTotalBetDisplay(); // Update display with selected chip value
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
            selectedChipValue = parseFloat(chip.dataset.value);
            
            // Update bet amount display
            updateTotalBetDisplay();
        });
    });
}

// Helper function to format numbers with commas
function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize chips when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initChipSelection();
    });
} else {
    initChipSelection();
}

// Initialize betting state for teen patti
const currentBets = {
    player: 0,
    banker: 0,
    sixCardBonus: 0,
    pairPlusPlayer: 0,
    pairPlusBanker: 0
};

// Keep track of bet history for undo
const betHistory = [];

// Function to clear all bets
function clearAllBets() {
    // Prevent clearing bets during game
    if (gameInProgress) {
        return;
    }
    
    // Reset all bets to 0
    Object.keys(currentBets).forEach(type => {
        currentBets[type] = 0;
        updateBetDisplay(type);
    });
    
    // Clear all placed chips
    document.querySelectorAll('.placed-chips-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Clear bet history
    betHistory.length = 0;
    
    // Reset bet button borders
    const playerBetBtn = document.querySelector('.bet-button[data-bet="player"]');
    const bankerBetBtn = document.querySelector('.bet-button[data-bet="banker"]');
    const sixCardBonusBtn = document.querySelector('.bet-button[data-bet="sixCardBonus"]');
    const pairPlusPlayerBtn = document.querySelector('.bet-button[data-bet="pairPlusPlayer"]');
    const pairPlusBankerBtn = document.querySelector('.bet-button[data-bet="pairPlusBanker"]');
    if (playerBetBtn) playerBetBtn.style.border = '2px solid #4e697d';
    if (bankerBetBtn) bankerBetBtn.style.border = '2px solid #4e697d';
    if (sixCardBonusBtn) sixCardBonusBtn.style.border = '2px solid #4e697d';
    if (pairPlusPlayerBtn) pairPlusPlayerBtn.style.border = '2px solid #4e697d';
    if (pairPlusBankerBtn) pairPlusBankerBtn.style.border = '2px solid #4e697d';
    
    // Update bet amount display
    updateTotalBetDisplay();
    
    // Disable undo button if no bets to undo
    document.getElementById('undoBtn').disabled = true;
    
    // Update play button state
    updatePlayButtonState();
}

// Function to undo last bet
function undoLastBet() {
    // Prevent undoing bets during game
    if (gameInProgress) {
        return;
    }
    
    if (betHistory.length === 0) return;
    
    const lastBet = betHistory.pop();
    const { type, amount, chipElement } = lastBet;
    
    // Remove the chip value from current bets
    currentBets[type] -= amount;
    
    // Update the bet display
    updateBetDisplay(type);
    
    // Remove the last chip visual
    const container = document.querySelector(`[data-bet="${type}"] .placed-chips-container`);
    if (container && container.lastChild) {
        container.removeChild(container.lastChild);
    }
    
    // Update total bet display
    updateTotalBetDisplay();
    
    // Disable undo button if no more bets to undo
    if (betHistory.length === 0) {
        document.getElementById('undoBtn').disabled = true;
    }
    
    // Update play button state
    updatePlayButtonState();
}

// Add event listeners for clear and undo buttons
document.getElementById('clearBtn').addEventListener('click', clearAllBets);
document.getElementById('undoBtn').addEventListener('click', undoLastBet);

// Function to update bet amount display
function updateBetDisplay(betType) {
    const currency = document.getElementById('currency').value;
    const amount = currentBets[betType];
    const betAmountElement = document.querySelector(`[data-bet="${betType}"] .bet-amount`);
    
    // Use the same formatting as formatCurrencyAmount for consistency
    betAmountElement.textContent = formatCurrencyAmount(amount, currency);
}

// Modify bet button click handler to track bet history
function initBetButtons() {
    const betButtons = document.querySelectorAll('.bet-button');
    
    betButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Prevent placing bets during game
            if (gameInProgress) {
                return;
            }
            
            if (!selectedChip) {
                console.warn('No chip selected');
                return;
            }
            
            const betType = button.dataset.bet;
            const chipValue = parseFloat(selectedChip.dataset.value);
            
            // Add chip value to current bet
            currentBets[betType] += chipValue;
            
            // Update the displays
            updateBetDisplay(betType);
            updateTotalBetDisplay(); // Update total bet amount immediately
            
            // Create and add chip visual
            const chipsContainer = button.querySelector('.placed-chips-container') || 
                                 createChipsContainer(button);
            
            const chipVisual = addChipVisual(chipsContainer, selectedChip);
            
            // Add to bet history
            betHistory.push({
                type: betType,
                amount: chipValue,
                chipElement: chipVisual
            });
            
            // Enable undo button
            document.getElementById('undoBtn').disabled = false;
            
            // Update play button state
            updatePlayButtonState();
        });
    });
}

// Function to create chips container
function createChipsContainer(button) {
    const container = document.createElement('div');
    container.className = 'placed-chips-container';
    button.appendChild(container);
    return container;
}

// Function to add chip visual
function addChipVisual(container, chipElement) {
    const chip = document.createElement('div');
    chip.className = 'placed-chip';
    
    const img = document.createElement('img');
    img.src = chipElement.querySelector('img').src;
    chip.appendChild(img);
    
    const span = document.createElement('span');
    span.textContent = chipElement.querySelector('span').textContent;
    chip.appendChild(span);
    
    container.appendChild(chip);
    return chip;
}

// Update currency change handler to update bet displays
const originalCurrencyHandler = document.getElementById('currency').onchange;
document.getElementById('currency').addEventListener('change', (e) => {
    // Update all bet displays
    Object.keys(currentBets).forEach(betType => {
        updateBetDisplay(betType);
    });
});

// Initialize with undo button disabled
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('undoBtn').disabled = true;
        initChipSelection();
        initBetButtons();
        updatePlayButtonState(); // Initialize play button state
    });
} else {
    document.getElementById('undoBtn').disabled = true;
    initChipSelection();
    initBetButtons();
    updatePlayButtonState(); // Initialize play button state
}

// Function to update total bet display
function updateTotalBetDisplay() {
    const currency = document.getElementById('currency').value;
    const totalBet = Object.values(currentBets).reduce((sum, amount) => sum + amount, 0);
    const betAmountInput = document.getElementById('betAmount');
    
    let displayAmount;
    if (totalBet === 0 && selectedChip) {
        // If no bets placed, show selected chip value
        displayAmount = parseFloat(selectedChip.dataset.value);
    } else {
        // Show total of placed bets
        displayAmount = totalBet;
    }
    
    // Format the value with commas for display in the text input
    if (currency === 'USD') {
        betAmountInput.value = displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        betAmountInput.value = displayAmount.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
}

// Function to check if any bets are placed and update play button state
function updatePlayButtonState() {
    const playBtn = document.getElementById('playBtn');
    const totalBet = Object.values(currentBets).reduce((sum, amount) => sum + amount, 0);
    
    if (totalBet === 0) {
        // No bets placed - disable button
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
    } else {
        // Bets placed - enable button (unless game in progress)
        if (!gameInProgress) {
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
        }
    }
}

// Deck drawing functions
function drawCardBack(x, y, width, height) {
    // Draw card background (white border)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e5e6e7';
    ctx.lineWidth = 1;
    
    // Draw rounded rectangle for card
    roundRect(ctx, x, y - height / 2, width, height, CARD_CORNER_RADIUS, true, true);
    
    // Draw the card back image
    if (cardBackImage.complete) {
        try {
            // Calculate dimensions to maintain aspect ratio and fill the card
            const imgAspect = cardBackImage.width / cardBackImage.height;
            const cardAspect = width / height;
            
            let drawWidth, drawHeight;
            if (imgAspect > cardAspect) {
                drawHeight = height - 4;
                drawWidth = drawHeight * imgAspect;
            } else {
                drawWidth = width - 4;
                drawHeight = drawWidth / imgAspect;
            }
            
            // Center the image within the card
            const drawX = x + (width - drawWidth) / 2;
            const drawY = y - height / 2 + (height - drawHeight) / 2;
            
            // Draw a clipping path for the image
            ctx.save();
            ctx.beginPath();
            roundRect(ctx, x + 2, y - height / 2 + 2, width - 4, height - 4, CARD_CORNER_RADIUS - 1, false, false);
            ctx.clip();
            
            // Draw the image
            ctx.drawImage(cardBackImage, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
            
        } catch (e) {
            console.error('Error drawing card back image:', e);
            ctx.fillStyle = '#1e3a8a';
            roundRect(ctx, x + 2, y - height / 2 + 2, width - 4, height - 4, CARD_CORNER_RADIUS - 1, true, false);
        }
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#1e3a8a';
        roundRect(ctx, x + 2, y - height / 2 + 2, width - 4, height - 4, CARD_CORNER_RADIUS - 1, true, false);
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    
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
    
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// Function to draw background with deck
function drawBackground() {
    ctx.fillStyle = '#0f212d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw deck in top right corner - responsive positioning
    const deckWidth = Math.min(canvas.width * 0.15, 100); // Increased from 0.12 and max from 80 to 100
    const deckHeight = deckWidth * 1.5; // Standard card ratio
    const deckX = canvas.width - deckWidth - 20; // 20px from right edge
    const deckY = - 45 + deckHeight / 2; // Moved much higher - 5px from top instead of 10px
    
    // Draw multiple card backs for stack effect
    const stackOffset = 1; // Slightly increased offset for better visibility of stacked cards
    for (let i = 5; i >= 0; i--) {
        drawCardBack(deckX - i * stackOffset, deckY - i * stackOffset, deckWidth, deckHeight);
    }
    
    // Draw dealt cards if game is active
    if (isGameActive) {
        dealtCards.player.forEach((c, i) => {
            if (c) {
                const x = PLAYER_FIRST_CARD_X + i * CARD_SPACING;
                const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                drawCardWithFlip(x, y, c, 1, true, window.gameOutcome);
            }
        });
        
        dealtCards.banker.forEach((c, i) => {
            if (c) {
                const x = BANKER_FIRST_CARD_X + i * CARD_SPACING;
                const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                drawCardWithFlip(x, y, c, 1, false, window.gameOutcome);
            }
        });
        
        // Draw hand results
        if (handResults.player) {
            drawHandResult(
                PLAYER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of player hand
                HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                handResults.player,
                true,
                window.gameOutcome // Use global game outcome
            );
        }
        if (handResults.banker) {
            drawHandResult(
                BANKER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of banker hand
                HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                handResults.banker,
                false,
                window.gameOutcome // Use global game outcome
            );
        }
        
        // Draw six card bonus result in center
        if (animationsComplete && window.lastGameResult && window.lastGameResult.hands && window.lastGameResult.hands.sixCard) {
            const centerX = canvas.width / 2;
            const centerY = HAND_Y + CARD_HEIGHT * 1.2; // Adjusted to be less far down
            
            // Check if six card bonus won
            const sixCardWin = window.lastGameResult.winDetails && 
                window.lastGameResult.winDetails.find(detail => detail.type === 'sixCardBonus' && detail.won);
            
            drawSixCardBonusResult(
                centerX,
                centerY,
                window.lastGameResult.hands.sixCard,
                sixCardWin ? true : false
            );
        }
    }
}

// Draw when image loads
cardBackImage.onload = () => {
    drawBackground();
};

// Initial draw
drawBackground();

// Play button handler for teen patti
document.getElementById('playBtn').addEventListener('click', async () => {
    try {
        // Hide win message when starting new game
        hideWinMessage();
        
        // Prevent double clicks
        if (gameInProgress) {
            return;
        }
        
        // Get current currency and bets
        const currency = document.getElementById('currency').value;
        
        // Create object with only non-zero bets
        const activeBets = {};
        Object.entries(currentBets).forEach(([type, amount]) => {
            if (amount > 0) {
                activeBets[type] = amount;
            }
        });
        
        // Validate that at least one bet is placed
        if (Object.keys(activeBets).length === 0) {
            alert('Please place at least one bet');
            return;
        }
        
        // Calculate total bet amount
        const totalBetAmount = Object.values(activeBets).reduce((sum, amount) => sum + amount, 0);
        
        // Get current balance from the navbar
        let currentBalance = 0;
        const selectedBalance = document.getElementById('selected-balance');
        if (selectedBalance) {
            // Extract the numeric value from the balance text
            currentBalance = parseFloat(selectedBalance.textContent.replace(/[^0-9.-]+/g, ''));
        }
        
        // Check if user has sufficient balance
        if (currentBalance < totalBetAmount) {
            alert('Insufficient balance');
            return;
        }
        
        // Set game in progress and disable buttons
        gameInProgress = true;
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';
        
        // Disable all bet buttons during game
        const betButtonsToDisable = document.querySelectorAll('.bet-button');
        betButtonsToDisable.forEach(btn => {
            btn.disabled = true;
        });
        
        // Deduct bet amount from display immediately
        const newBalance = currentBalance - totalBetAmount;
        if (selectedBalance) {
            selectedBalance.textContent = formatCurrencyAmount(newBalance, currency);
        }
        
        // Clear previous game state
        window.gameOutcome = null;
        window.lastGameResult = null;
        handResults.player = null;
        handResults.banker = null;
        isGameActive = false;
        animationsComplete = false;
        
        // Reset bet button borders
        const playerBetBtn = document.querySelector('.bet-button[data-bet="player"]');
        const bankerBetBtn = document.querySelector('.bet-button[data-bet="banker"]');
        const sixCardBonusBtn = document.querySelector('.bet-button[data-bet="sixCardBonus"]');
        const pairPlusPlayerBtn = document.querySelector('.bet-button[data-bet="pairPlusPlayer"]');
        const pairPlusBankerBtn = document.querySelector('.bet-button[data-bet="pairPlusBanker"]');
        if (playerBetBtn) playerBetBtn.style.border = '2px solid #4e697d';
        if (bankerBetBtn) bankerBetBtn.style.border = '2px solid #4e697d';
        if (sixCardBonusBtn) sixCardBonusBtn.style.border = '2px solid #4e697d';
        if (pairPlusPlayerBtn) pairPlusPlayerBtn.style.border = '2px solid #4e697d';
        if (pairPlusBankerBtn) pairPlusBankerBtn.style.border = '2px solid #4e697d';
        
        // Redraw to clear previous hand results
        drawBackground();
        
        // Make API call to backend
        const response = await fetch('/games/teen-patti/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currency: currency,
                betTypes: activeBets // Send only active bets
            })
        });
        
        if (!response.ok) {
            // If error occurs, restore the original balance
            if (selectedBalance) {
                selectedBalance.textContent = formatCurrencyAmount(currentBalance, currency);
            }
            const error = await response.json();
            throw new Error(error.error || 'Failed to play game');
        }
        
        const result = await response.json();
        
        // Store the game result globally for button highlighting
        window.lastGameResult = result;
        
        // Deal the cards with animation
        if (result.cards && result.cards.player && result.cards.banker) {
            await dealCards(result.cards.player, result.cards.banker);
            
            // Set hand results after cards are dealt
            if (result.hands) {
                handResults.player = result.hands.player;
                handResults.banker = result.hands.banker;
                window.gameOutcome = result.outcome; // Set global game outcome
                
                // Redraw background to show hand results with cards
                drawBackground();
                
                // Highlight bet buttons based on outcome AFTER animation
                highlightBetButtons(result.outcome);
            }
        }
        
        // Update balance with the new balance from server response
        if (result.newBalance !== undefined && selectedBalance) {
            selectedBalance.textContent = formatCurrencyAmount(result.newBalance, currency);
        }
        
        // Re-enable play button and bet buttons, reset game state
        gameInProgress = false;
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        
        // Re-enable all bet buttons
        const betButtonsToEnable = document.querySelectorAll('.bet-button');
        betButtonsToEnable.forEach(btn => {
            btn.disabled = false;
        });
        
        // Handle game result (you can add animations or result display here)
        console.log('Game result:', result);
        
        // Show win message if there's a win
        if (result.totalWin && result.totalWin > 0) {
            showWinMessage(result.totalMultiplier, result.totalWin, currency);
        }
        
    } catch (err) {
        console.error('Teen Patti error:', err);
        alert(err.message || 'Server error');
        
        // Re-enable play button and bet buttons on error
        gameInProgress = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('playBtn').style.opacity = '1';
        
        // Re-enable all bet buttons on error
        const betButtonsToReEnable = document.querySelectorAll('.bet-button');
        betButtonsToReEnable.forEach(btn => {
            btn.disabled = false;
        });
    }
});

// Create win message element and add it to canvas container
const canvasContainer = document.getElementById('teenPattiCanvas').parentElement;
const winMessageDiv = document.createElement('div');
winMessageDiv.className = 'win-message';
winMessageDiv.innerHTML = `
  <div class="multiplier"></div>
  <div class="amount"></div>
`;
canvasContainer.appendChild(winMessageDiv);

// Add click event listener to canvas to dismiss win message
canvas.addEventListener('click', () => {
    if (winMessageDiv.classList.contains('visible')) {
        hideWinMessage();
    }
});

// Function to show win message
function showWinMessage(multiplier, amount, currency) {
  // Handle cases where multiplier might be undefined or 0
  const displayMultiplier = multiplier && multiplier > 0 ? multiplier.toFixed(2) : '0.00';
  winMessageDiv.querySelector('.multiplier').textContent = displayMultiplier + 'x';
  winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
  winMessageDiv.classList.add('visible');
}

// Function to hide win message
function hideWinMessage() {
  winMessageDiv.classList.remove('visible');
}

// Function to draw a card with flip animation progress
function drawCardWithFlip(x, y, card, flipProgress = 1, isPlayer, gameResult = null) {
    const width = flipProgress < 0.5 ? 
        CARD_WIDTH * Math.cos(flipProgress * Math.PI) : 
        CARD_WIDTH * Math.cos((1 - flipProgress) * Math.PI);
    
    if (flipProgress < 0.5) {
        // Draw card back with scaling
        ctx.save();
        ctx.translate(x + CARD_WIDTH / 2, y);
        ctx.scale(Math.abs(Math.cos(flipProgress * Math.PI)), 1);
        ctx.translate(-(x + CARD_WIDTH / 2), -y);
        drawCardBack(x + (CARD_WIDTH - width) / 2, y, width, CARD_HEIGHT);
        ctx.restore();
    } else {
        // Draw card front with scaling
        ctx.save();
        ctx.translate(x + CARD_WIDTH / 2, y);
        ctx.scale(Math.abs(Math.cos((1 - flipProgress) * Math.PI)), 1);
        ctx.translate(-(x + CARD_WIDTH / 2), -y);
        
        // Draw card background (white)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e5e6e7';
        ctx.lineWidth = 1;
        roundRect(ctx, x + (CARD_WIDTH - width) / 2, y - CARD_HEIGHT / 2, width, CARD_HEIGHT, CARD_CORNER_RADIUS, true, true);
        
        // If game result is provided, draw colored border
        if (gameResult) {
            ctx.lineWidth = 4; // Increased from 3 to 4 for thicker border
            if (gameResult === 'tie') {
                ctx.strokeStyle = '#f39c12'; // Orange for tie
            } else if ((gameResult === 'player' && isPlayer) || (gameResult === 'banker' && !isPlayer)) {
                ctx.strokeStyle = '#24a969'; // Green for win
            } else {
                ctx.strokeStyle = '#bd453a'; // Red for loss
            }
            roundRect(ctx, x + (CARD_WIDTH - width) / 2, y - CARD_HEIGHT / 2, width, CARD_HEIGHT, CARD_CORNER_RADIUS, false, true);
        }
        
        const suitSymbol = SUIT_SYMBOLS[card.suit];
        const suitColor = SUIT_COLORS[card.suit];
        
        // Draw card value and suit symbol in top left
        ctx.fillStyle = suitColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Position for the number
        const textX = x + (CARD_WIDTH - width) / 2 + CARD_WIDTH * 0.1;
        const textY = y - CARD_HEIGHT / 2 + CARD_HEIGHT * 0.1;
        
        // Draw number (use rank for teen-patti)
        ctx.font = `bold ${CARD_WIDTH * 0.4}px Arial`;
        ctx.fillText(card.rank, textX, textY);
        
        // Draw suit symbol right below the number
        ctx.font = `${CARD_WIDTH * 0.7}px Arial`;
        ctx.fillText(suitSymbol, textX, textY + CARD_WIDTH * 0.35);
        
        ctx.restore();
    }
}

// Function to animate dealing a card
async function animateDealCard(toX, toY, isPlayer, cardData, cardIndex) {
    return new Promise(resolve => {
        let startTime = performance.now();
        const startX = canvas.width - CARD_WIDTH - 40;
        const startY = -45 + CARD_HEIGHT / 2; // Updated to match deck position at -45
        let dealProgress = 0;
        let flipProgress = 0;
        let isDealing = true;
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            
            if (isDealing) {
                // Deal animation
                dealProgress = Math.min(elapsed / DEAL_ANIMATION_DURATION, 1);
                const easeProgress = 1 - (1 - dealProgress) * (1 - dealProgress);
                
                // Calculate current position, including vertical offset for final position
                const finalY = toY + cardIndex * CARD_VERTICAL_OFFSET;
                const currentX = startX + (toX - startX) * easeProgress;
                const currentY = startY + (finalY - startY) * easeProgress;
                
                // Clear and redraw background
                drawBackground();
                
                // Draw previously dealt cards
                dealtCards.player.forEach((c, i) => {
                    if (c) {
                        const x = PLAYER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1, true, window.gameOutcome);
                    }
                });
                dealtCards.banker.forEach((c, i) => {
                    if (c) {
                        const x = BANKER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1, false, window.gameOutcome);
                    }
                });
                
                // Draw hand results
                if (handResults.player) {
                    drawHandResult(
                        PLAYER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of player hand
                        HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                        handResults.player,
                        true
                    );
                }
                if (handResults.banker) {
                    drawHandResult(
                        BANKER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of banker hand
                        HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                        handResults.banker,
                        false
                    );
                }
                
                // Draw six card bonus result in center
                if (animationsComplete && window.lastGameResult && window.lastGameResult.hands && window.lastGameResult.hands.sixCard) {
                    const centerX = canvas.width / 2;
                    const centerY = HAND_Y + CARD_HEIGHT * 1.2; // Adjusted to be less far down
                    
                    // Check if six card bonus won
                    const sixCardWin = window.lastGameResult.winDetails && 
                        window.lastGameResult.winDetails.find(detail => detail.type === 'sixCardBonus' && detail.won);
                    
                    drawSixCardBonusResult(
                        centerX,
                        centerY,
                        window.lastGameResult.hands.sixCard,
                        sixCardWin ? true : false
                    );
                }
                
                // Draw the moving card (back facing)
                drawCardWithFlip(currentX, currentY, cardData, 0);
                
                if (dealProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Start flip animation
                    isDealing = false;
                    startTime = performance.now();
                    requestAnimationFrame(animate);
                }
            } else {
                // Flip animation
                flipProgress = Math.min(elapsed / FLIP_ANIMATION_DURATION, 1);
                
                // Clear and redraw background
                drawBackground();
                
                // Draw previously dealt cards
                dealtCards.player.forEach((c, i) => {
                    if (c) {
                        const x = PLAYER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1, true, window.gameOutcome);
                    }
                });
                dealtCards.banker.forEach((c, i) => {
                    if (c) {
                        const x = BANKER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1, false, window.gameOutcome);
                    }
                });
                
                // Draw hand results
                if (handResults.player) {
                    drawHandResult(
                        PLAYER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of player hand
                        HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                        handResults.player,
                        true
                    );
                }
                if (handResults.banker) {
                    drawHandResult(
                        BANKER_FIRST_CARD_X + (CARD_WIDTH + CARD_SPACING * 2) / 2, // Center of banker hand
                        HAND_Y - CARD_HEIGHT * 0.75, // Above the cards
                        handResults.banker,
                        false
                    );
                }
                
                // Draw six card bonus result in center
                if (animationsComplete && window.lastGameResult && window.lastGameResult.hands && window.lastGameResult.hands.sixCard) {
                    const centerX = canvas.width / 2;
                    const centerY = HAND_Y + CARD_HEIGHT * 1.2; // Adjusted to be less far down
                    
                    // Check if six card bonus won
                    const sixCardWin = window.lastGameResult.winDetails && 
                        window.lastGameResult.winDetails.find(detail => detail.type === 'sixCardBonus' && detail.won);
                    
                    drawSixCardBonusResult(
                        centerX,
                        centerY,
                        window.lastGameResult.hands.sixCard,
                        sixCardWin ? true : false
                    );
                }
                
                // Draw the flipping card
                if (isPlayer) {
                    const y = HAND_Y + cardIndex * CARD_VERTICAL_OFFSET;
                    drawCardWithFlip(PLAYER_FIRST_CARD_X + cardIndex * CARD_SPACING, y, cardData, flipProgress);
                } else {
                    const y = HAND_Y + cardIndex * CARD_VERTICAL_OFFSET;
                    drawCardWithFlip(BANKER_FIRST_CARD_X + cardIndex * CARD_SPACING, y, cardData, flipProgress);
                }
                
                if (flipProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Store the dealt card
                    if (isPlayer) {
                        dealtCards.player[cardIndex] = cardData;
                    } else {
                        dealtCards.banker[cardIndex] = cardData;
                    }
                    resolve();
                }
            }
        }
        
        requestAnimationFrame(animate);
    });
}

// Function to deal all cards with animation
async function dealCards(playerCards, bankerCards) {
    // Reset dealt cards
    dealtCards = {
        player: [],
        banker: []
    };
    
    // Set game as active and animations not complete
    isGameActive = true;
    animationsComplete = false;
    
    // Deal initial cards alternating between player and banker
    for (let i = 0; i < Math.max(playerCards.length, bankerCards.length); i++) {
        if (playerCards[i]) {
            await animateDealCard(
                PLAYER_FIRST_CARD_X + i * CARD_SPACING,
                HAND_Y,
                true,
                playerCards[i],
                i
            );
        }
        if (bankerCards[i]) {
            await animateDealCard(
                BANKER_FIRST_CARD_X + i * CARD_SPACING,
                HAND_Y,
                false,
                bankerCards[i],
                i
            );
        }
        // Add a small delay between deals
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Mark animations as complete
    animationsComplete = true;
    
    // Redraw background to show all results
    drawBackground();
}

// Function to highlight bet buttons based on game outcome
function highlightBetButtons(outcome) {
    const playerBetBtn = document.querySelector('.bet-button[data-bet="player"]');
    const bankerBetBtn = document.querySelector('.bet-button[data-bet="banker"]');
    const sixCardBonusBtn = document.querySelector('.bet-button[data-bet="sixCardBonus"]');
    const pairPlusPlayerBtn = document.querySelector('.bet-button[data-bet="pairPlusPlayer"]');
    const pairPlusBankerBtn = document.querySelector('.bet-button[data-bet="pairPlusBanker"]');
    
    // Reset all button borders first
    if (playerBetBtn) playerBetBtn.style.border = '2px solid #4e697d';
    if (bankerBetBtn) bankerBetBtn.style.border = '2px solid #4e697d';
    if (sixCardBonusBtn) sixCardBonusBtn.style.border = '2px solid #4e697d';
    if (pairPlusPlayerBtn) pairPlusPlayerBtn.style.border = '2px solid #4e697d';
    if (pairPlusBankerBtn) pairPlusBankerBtn.style.border = '2px solid #4e697d';
    
    // Apply colored borders based on outcome
    if (outcome === 'player') {
        if (playerBetBtn) playerBetBtn.style.border = '3px solid #24a969'; // Green for player win
    } else if (outcome === 'banker') {
        if (bankerBetBtn) bankerBetBtn.style.border = '3px solid #24a969'; // Green for banker win
    } else if (outcome === 'tie') {
        if (playerBetBtn) playerBetBtn.style.border = '3px solid #f39c12'; // Orange for tie
        if (bankerBetBtn) bankerBetBtn.style.border = '3px solid #f39c12'; // Orange for tie
    }
    
    // Check if pair plus bets won (independent of player/banker outcome)
    if (window.lastGameResult && window.lastGameResult.hands) {
        // Check if pair plus player would win (based on player hand)
        const playerHand = window.lastGameResult.hands.player;
        const pairPlusPlayerWin = playerHand && (playerHand === 'Pair' || playerHand === 'Three of a Kind' || 
            playerHand === 'Straight' || playerHand === 'Flush' || playerHand === 'Straight Flush');
        
        // Check if pair plus banker would win (based on banker hand)
        const bankerHand = window.lastGameResult.hands.banker;
        const pairPlusBankerWin = bankerHand && (bankerHand === 'Pair' || bankerHand === 'Three of a Kind' || 
            bankerHand === 'Straight' || bankerHand === 'Flush' || bankerHand === 'Straight Flush');
        
        if (pairPlusPlayerWin && pairPlusPlayerBtn) {
            pairPlusPlayerBtn.style.border = '3px solid #24a969'; // Green for pair plus player win
        }
        if (pairPlusBankerWin && pairPlusBankerBtn) {
            pairPlusBankerBtn.style.border = '3px solid #24a969'; // Green for pair plus banker win
        }
    }
    
    // Check if six card bonus won (independent of player/banker outcome)
    if (window.lastGameResult && window.lastGameResult.winDetails) {
        const sixCardWin = window.lastGameResult.winDetails.find(detail => detail.type === 'sixCardBonus' && detail.won);
        if (sixCardWin && sixCardBonusBtn) {
            sixCardBonusBtn.style.border = '3px solid #24a969'; // Green for six card bonus win
        }
    }
}

// Function to draw six card bonus result counter (uses gray for loss instead of red)
function drawSixCardBonusResult(x, y, result, won) {
    if (!isGameActive || !result) return; // Only draw if game is active and result exists
    
    const fontSize = CARD_WIDTH * 0.2; // Slightly smaller for longer text
    const padding = fontSize * 0.8; // More padding for longer text
    const verticalPadding = fontSize * 0.4;
    
    // Calculate width based on text length
    ctx.font = `bold ${fontSize}px Arial`;
    const textWidth = ctx.measureText(result).width;
    const width = textWidth + padding * 2;
    const height = fontSize + verticalPadding * 2;
    
    // Set background color - green for win, gray for loss (no red)
    if (won) {
        ctx.fillStyle = '#24a969'; // Green for win
    } else {
        ctx.fillStyle = '#535759'; // Gray for loss (instead of red)
    }
    
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x - width/2, y - height/2, width, height, height/3, true, false);
    ctx.restore();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result, x, y);
}


