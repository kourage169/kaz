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
  
  // Clear all bets when currency changes
  clearAllBets();
  
  if (currency === 'USD') {
    usdChips.forEach(chip => chip.style.display = 'flex');
    lbpChips.forEach(chip => chip.style.display = 'none');
    
    const firstUsdChip = document.querySelector('.usd-chip[data-value="1"]');
    if (firstUsdChip) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      firstUsdChip.classList.add('selected');
      selectedChip = firstUsdChip;
      selectedChipValue = parseFloat(firstUsdChip.dataset.value);
    }
  } else {
    usdChips.forEach(chip => chip.style.display = 'none');
    lbpChips.forEach(chip => chip.style.display = 'flex');
    
    const firstLbpChip = document.querySelector('.lbp-chip[data-value="1000"]');
    if (firstLbpChip) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      firstLbpChip.classList.add('selected');
      selectedChip = firstLbpChip;
      selectedChipValue = parseFloat(firstLbpChip.dataset.value);
    }
  }
  
  // Update total bet display with new selected chip value
  updateTotalBetDisplay();
}

// Initialize currency sync after page load
document.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
});

const fullDeck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardValues = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 0, J: 0, Q: 0, K: 0
};

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

const CARD_CORNER_RADIUS = 5;

// Canvas setup and global variables
const canvas = document.getElementById('baccaratCanvas');
const ctx = canvas.getContext('2d');

// Card back image
const cardBackImage = new Image();
cardBackImage.src = '/games/blackjack/card_back.png';

// Background image
const backgroundImage = new Image();
backgroundImage.src = '/games/baccarat/baccarat_background.svg';

// Track dealt cards and hand totals
let dealtCards = {
    player: [],
    banker: []
};

let handTotals = {
    player: 0,
    banker: 0
};

// Track if game is in progress
let isGameActive = false;

// Function to initialize card dimensions and positions
function initializeCardDimensions() {
    // Card dimensions and positions
    window.CARD_WIDTH = canvas.width * 0.16;
    window.CARD_HEIGHT = CARD_WIDTH * 1.6;
    window.CARD_SPACING = CARD_WIDTH * 0.4;
    window.CARD_VERTICAL_OFFSET = CARD_HEIGHT * 0.15;

    // Calculate positions for player and banker hands
    window.TABLE_CENTER_Y = canvas.height * 0.50;
    window.HAND_Y = TABLE_CENTER_Y;
    window.GAP_BETWEEN_HANDS = CARD_WIDTH * 5;

    // Player hand starts from 15% of canvas width
    window.PLAYER_FIRST_CARD_X = canvas.width * 0.15;
    // Banker hand starts from 85% of canvas width minus the width of their hand
    window.BANKER_FIRST_CARD_X = canvas.width * 0.9 - (CARD_WIDTH + CARD_SPACING * 2);
}

// Animation timing
const DEAL_ANIMATION_DURATION = 200; // ms
const FLIP_ANIMATION_DURATION = 300; // ms

// Set canvas dimensions
function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Only update if dimensions have changed
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        initializeCardDimensions(); // Recalculate card dimensions when canvas resizes
        drawBackground();
    }
}

// Handle resize
window.addEventListener('resize', resizeCanvas);

// Initial setup
resizeCanvas();

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

// Initialize betting state
const currentBets = {
    player: 0,
    tie: 0,
    banker: 0
};

// Keep track of bet history for undo
const betHistory = [];

// Function to clear all bets
function clearAllBets() {
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
    
    // Update bet amount display
    updateTotalBetDisplay();
    
    // Disable undo button if no bets to undo
    document.getElementById('undoBtn').disabled = true;
}

// Function to undo last bet
function undoLastBet() {
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
    });
} else {
    document.getElementById('undoBtn').disabled = true;
    initChipSelection();
    initBetButtons();
}

// Function to draw value counter
function drawValueCounter(x, y, value, isPlayer, gameResult = null) {
    if (!isGameActive) return; // Only draw if game is active
    
    const fontSize = CARD_WIDTH * 0.25;
    const padding = fontSize * 0.5; // Horizontal padding
    const verticalPadding = fontSize * 0.3; // Vertical padding
    const width = fontSize * 2 + padding * 2; // Width to accommodate 2 digits plus padding
    const height = fontSize + verticalPadding * 2;
    
    // Set background color based on game result
    if (gameResult) {
        if (gameResult === 'tie') {
            ctx.fillStyle = '#f39c12'; // Orange for tie
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
    ctx.fillText(value.toString(), x, y);
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
            ctx.lineWidth = 3;
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
        
        // Draw number
        ctx.font = `bold ${CARD_WIDTH * 0.4}px Arial`;
        ctx.fillText(card.value, textX, textY);
        
        // Draw suit symbol right below the number
        ctx.font = `${CARD_WIDTH * 0.7}px Arial`;
        ctx.fillText(suitSymbol, textX, textY + CARD_WIDTH * 0.35);
        
        ctx.restore();
    }
}

// Function to animate dealing a card
async function animateDealCard(toX, toY, isPlayer, cardValue, cardIndex) {
    return new Promise(resolve => {
        // Assign a random suit when the card is first created
        const card = {
            value: cardValue,
            suit: SUITS[Math.floor(Math.random() * SUITS.length)]
        };
        
        let startTime = performance.now();
        const startX = canvas.width - CARD_WIDTH - 40;
        const startY = 40 + CARD_HEIGHT / 2;
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
                        drawCardWithFlip(x, y, c, 1);
                    }
                });
                dealtCards.banker.forEach((c, i) => {
                    if (c) {
                        const x = BANKER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1);
                    }
                });
                
                // Draw value counters
                drawValueCounter(
                    PLAYER_FIRST_CARD_X + CARD_WIDTH/2, 
                    HAND_Y - CARD_HEIGHT * 0.75,
                    handTotals.player
                );
                drawValueCounter(
                    BANKER_FIRST_CARD_X + CARD_WIDTH/2,
                    HAND_Y - CARD_HEIGHT * 0.75,
                    handTotals.banker
                );
                
                // Draw the moving card (back facing)
                drawCardWithFlip(currentX, currentY, card, 0);
                
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
                        drawCardWithFlip(x, y, c, 1);
                    }
                });
                dealtCards.banker.forEach((c, i) => {
                    if (c) {
                        const x = BANKER_FIRST_CARD_X + i * CARD_SPACING;
                        const y = HAND_Y + i * CARD_VERTICAL_OFFSET;
                        drawCardWithFlip(x, y, c, 1);
                    }
                });
                
                // Draw value counters
                drawValueCounter(
                    PLAYER_FIRST_CARD_X + CARD_WIDTH/2, 
                    HAND_Y - CARD_HEIGHT * 0.75,
                    handTotals.player
                );
                drawValueCounter(
                    BANKER_FIRST_CARD_X + CARD_WIDTH/2,
                    HAND_Y - CARD_HEIGHT * 0.75,
                    handTotals.banker
                );
                
                // Draw the flipping card
                if (isPlayer) {
                    const y = HAND_Y + cardIndex * CARD_VERTICAL_OFFSET;
                    drawCardWithFlip(PLAYER_FIRST_CARD_X + cardIndex * CARD_SPACING, y, card, flipProgress);
                } else {
                    const y = HAND_Y + cardIndex * CARD_VERTICAL_OFFSET;
                    drawCardWithFlip(BANKER_FIRST_CARD_X + cardIndex * CARD_SPACING, y, card, flipProgress);
                }
                
                if (flipProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Store the dealt card and update totals
                    if (isPlayer) {
                        dealtCards.player[cardIndex] = card;
                        handTotals.player = calculateHandValue(dealtCards.player);
                    } else {
                        dealtCards.banker[cardIndex] = card;
                        handTotals.banker = calculateHandValue(dealtCards.banker);
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
    // Reset dealt cards and totals
    dealtCards = {
        player: [],
        banker: []
    };
    handTotals = {
        player: 0,
        banker: 0
    };
    
    // Set game as active to show counters
    isGameActive = true;
    
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
}

// Function to draw card back
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
    
    if (backgroundImage.complete) {
        // Get original SVG dimensions
        const originalWidth = backgroundImage.width;
        const originalHeight = backgroundImage.height;
        const originalAspect = originalWidth / originalHeight;
        
        // Calculate scale based on canvas width while maintaining original ratio
        const scale = (canvas.width * 0.4) / originalWidth;
        const width = originalWidth * scale;
        const height = originalHeight * scale;
        
        // Center the image
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2 + 100;
        
        // Draw the image
        ctx.drawImage(backgroundImage, x, y, width, height);
    }
    
    // Draw deck in top right corner - matching blackjack dimensions
    const deckWidth = canvas.width * 0.14; // Increased from 6% to 8% of canvas width
    const deckHeight = deckWidth * 1.5; // Standard card ratio
    const deckX = canvas.width - deckWidth - 20; // 50px from right edge
    const deckY = - 40 + deckHeight / 2; // 50px from top
    
    // Draw multiple card backs for stack effect
    const stackOffset = 1; // Slightly increased offset for better visibility of stacked cards
    for (let i = 5; i >= 0; i--) {
        drawCardBack(deckX - i * stackOffset, deckY - i * stackOffset, deckWidth, deckHeight);
    }
    
    // Draw value counters if they exist
    if (handTotals) {
        // Get game result from global state if it exists
        const gameResult = window.gameResult || null;
        
        drawValueCounter(
            PLAYER_FIRST_CARD_X + CARD_WIDTH/2, 
            HAND_Y - CARD_HEIGHT * 0.75,
            handTotals.player,
            true,
            gameResult
        );
        drawValueCounter(
            BANKER_FIRST_CARD_X + CARD_WIDTH/2,
            HAND_Y - CARD_HEIGHT * 0.75,
            handTotals.banker,
            false,
            gameResult
        );
    }
}

// Draw when image loads
backgroundImage.onload = () => {
    drawBackground();
};

// Initial draw
drawBackground();

// Function to update total bet display
function updateTotalBetDisplay() {
    const currency = document.getElementById('currency').value;
    const totalBet = currentBets.player + currentBets.tie + currentBets.banker;
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

// Create win message element and add it to canvas container
const canvasContainer = document.getElementById('baccaratCanvas').parentElement;
const winMessageDiv = document.createElement('div');
winMessageDiv.className = 'win-message';
winMessageDiv.innerHTML = `
  <div class="multiplier"></div>
  <div class="amount"></div>
`;
canvasContainer.appendChild(winMessageDiv);


// Function to show win message
function showWinMessage(multiplier, amount, currency) {
  winMessageDiv.querySelector('.multiplier').textContent = multiplier.toFixed(2) + 'x';
  winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
  winMessageDiv.classList.add('visible');
}

// Function to hide win message
function hideWinMessage() {
  winMessageDiv.classList.remove('visible');
}

// Update play button handler
document.getElementById('playBtn').addEventListener('click', async () => {
    try {
        // Hide win message when starting new game
        hideWinMessage();
        
        // Reset game result at start
        window.gameResult = null;
        
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
        
        // Deduct bet amount from display immediately
        const newBalance = currentBalance - totalBetAmount;
        if (selectedBalance) {
            selectedBalance.textContent = formatCurrencyAmount(newBalance, currency);
        }
        
        // Reset game state
        isGameActive = false;
        drawBackground(); // Redraw background to clear previous counters
        
        // Disable play button while processing
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = true;
        
        // Make API call to backend
        const response = await fetch('/games/baccarat/play', {
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
        
        // Set game result before redrawing
        window.gameResult = result.outcome.toLowerCase();
        
        // Animate dealing the cards
        await dealCards(result.cards.player, result.cards.banker);
        
        // After animations complete, redraw all cards with result borders
        drawBackground();
        dealtCards.player.forEach((card, i) => {
            if (card) {
                drawCardWithFlip(
                    PLAYER_FIRST_CARD_X + i * CARD_SPACING,
                    HAND_Y + i * CARD_VERTICAL_OFFSET,
                    card,
                    1,
                    true,
                    window.gameResult
                );
            }
        });
        dealtCards.banker.forEach((card, i) => {
            if (card) {
                drawCardWithFlip(
                    BANKER_FIRST_CARD_X + i * CARD_SPACING,
                    HAND_Y + i * CARD_VERTICAL_OFFSET,
                    card,
                    1,
                    false,
                    window.gameResult
                );
            }
        });
        
        // Show win message if there's a win
        if (result.totalWin > 0) {
            // Get the winning bet details
            const winningBet = result.winDetails.find(bet => bet.won);
            // Use fixed multiplier based on bet type
            const multiplier = winningBet.type === 'player' ? 2 :
                             winningBet.type === 'banker' ? 1.95 : 9;
            showWinMessage(multiplier, result.totalWin, currency);
        }
        
        // Update balance display with final result
        // Update balance display with new navbar structure
        const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
        const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');
        
        // Update the current currency's balance with the value from the response
        if (selectedBalance) {
            selectedBalance.textContent = formatCurrencyAmount(result.balance, currency);
        }
        
        // Update the dropdown item for the current currency using HTML structure to preserve currency label
        if (currency === 'USD' && usdDropdownItem) {
            usdDropdownItem.innerHTML = `
                <span class="amount-label">${formatCurrencyAmount(result.balance, 'USD')}</span>
                <span class="currency-label">USD</span>
            `;
        } else if (currency === 'LBP' && lbpDropdownItem) {
            lbpDropdownItem.innerHTML = `
                <span class="amount-label">${formatCurrencyAmount(result.balance, 'LBP')}</span>
                <span class="currency-label">LBP</span>
            `;
        }
        
        // The other currency's balance remains unchanged since the server doesn't return it
        
    } catch (error) {
        console.error('Error playing game:', error);
        alert(error.message);
    } finally {
        // Re-enable play button
        document.getElementById('playBtn').disabled = false;
    }
});

// Function to calculate baccarat hand value
function calculateHandValue(cards) {
    let total = 0;
    cards.forEach(card => {
        if (card) {
            total += cardValues[card.value];
        }
    });
    return total % 10; // Baccarat only uses the last digit
}