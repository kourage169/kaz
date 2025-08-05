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
  // Navbar elements
  const balanceBox = document.getElementById('balance-box');
  const selectedBalance = document.getElementById('selected-balance');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const currencySelect = document.getElementById('currency');

  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      currencySelect.value = currency;
      
      // Update bet limits based on new currency
      const limits = BET_LIMITS[currency];
      const betInput = document.getElementById('betAmount');
      
      betInput.min = limits.min;
      betInput.max = limits.max;
      betInput.step = currency === 'USD' ? '0.10' : '10000';
      
      // Always set bet amount to minimum when switching currencies
      betInput.value = limits.min;
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
        // Fallback if the structure is different
        selectedBalance.textContent = matchingItem.textContent.trim();
      }
      
      // Hide dropdown after selection
      const dropdown = document.getElementById('balance-dropdown');
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    }
    
    // Update bet limits and set to minimum for the new currency
    const limits = BET_LIMITS[currency];
    const betInput = document.getElementById('betAmount');
    
    betInput.min = limits.min;
    betInput.max = limits.max;
    betInput.step = currency === 'USD' ? '0.10' : '10000';
    
    // Always set bet amount to minimum when switching currencies
    betInput.value = limits.min;
  });
}

// Function to fetch and update balances in the navbar
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
        <span class="amount-label">${formatCurrencyAmount(data.balanceUSD, 'USD')}</span>
        <span class="currency-label">USD</span>
      `;
    }
    
    if (lbpDropdownItem) {
      lbpDropdownItem.innerHTML = `
        <span class="amount-label">${formatCurrencyAmount(data.balanceLBP, 'LBP')}</span>
        <span class="currency-label">LBP</span>
      `;
    }
    
    // Update the selected balance display if needed
    const currencySelect = document.getElementById('currency');
    const selectedCurrency = currencySelect.value;
    const selectedBalance = document.getElementById('selected-balance');
    
    if (selectedBalance) {
      if (selectedCurrency === 'USD') {
        selectedBalance.textContent = formatCurrencyAmount(data.balanceUSD, 'USD');
      } else {
        selectedBalance.textContent = formatCurrencyAmount(data.balanceLBP, 'LBP');
      }
    }
  } catch (err) {
    console.error('Error fetching balances:', err);
  }
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();
  fetchBalances(); // Fetch initial balances
  
  // Add event listener to adjust bet amount after user finishes input
  const betInput = document.getElementById('betAmount');
  
  // The 'change' event fires when the input loses focus after being changed
  betInput.addEventListener('change', () => {
    adjustBetAmount(betInput);
  });
  
  // The 'blur' event fires when the input loses focus
  betInput.addEventListener('blur', () => {
    adjustBetAmount(betInput);
  });
});

// Function to adjust bet amount based on current currency limits
function adjustBetAmount(betInput) {
  const currency = document.getElementById('currency').value;
  const limits = BET_LIMITS[currency];
  const betAmount = parseFloat(betInput.value);
  
  // If the input is not a valid number, set it to the minimum
  if (isNaN(betAmount) || betAmount <= 0) {
    betInput.value = limits.min;
    return;
  }
  
  // If the bet is below the minimum, set it to the minimum
  if (betAmount < limits.min) {
    betInput.value = limits.min;
  }
  // If the bet is above the maximum, set it to the maximum
  else if (betAmount > limits.max) {
    betInput.value = limits.max;
  }
  // Otherwise, format the value to ensure proper decimal places
  else {
    if (currency === 'USD') {
      // Format USD to 2 decimal places
      betInput.value = betAmount.toFixed(2);
    } else {
      // For LBP, round to whole number
      betInput.value = Math.round(betAmount);
    }
  }
}

  // Add bet limits at the top with other constants
const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
  };

  const RANKS = [
    { rank: '2', value: 2 },
    { rank: '3', value: 3 },
    { rank: '4', value: 4 },
    { rank: '5', value: 5 },
    { rank: '6', value: 6 },
    { rank: '7', value: 7 },
    { rank: '8', value: 8 },
    { rank: '9', value: 9 },
    { rank: '10', value: 10 },
    { rank: 'J', value: 11 },
    { rank: 'Q', value: 12 },
    { rank: 'K', value: 13 },
    { rank: 'A', value: 14 }
  ];
  

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


  // Card back image
const cardBackImage = new Image();
cardBackImage.src = '/games/blackjack/card_back.png';
cardBackImage.onload = () => {
    // Redraw the canvas once the image is loaded
    drawBackground();
};


const CARD_CORNER_RADIUS = 4;

// Canvas setup
const canvas = document.getElementById('videoPokerCanvas');
const ctx = canvas.getContext('2d');

// Card dimensions and positions
let CARD_WIDTH, CARD_HEIGHT, CARD_SPACING;

// Function to initialize card dimensions
function initializeCardDimensions() {
    // Calculate available width for cards (90% of canvas width to leave padding)
    const availableWidth = canvas.width * 0.9;
    
    // Calculate card width based on available width and desired gaps
    // We need space for 5 cards with 4 gaps between them
    // Let's make gaps 20% of card width
    // So if W = card width, we need: 5W + 4(0.2W) = availableWidth
    // Solving for W: 5W + 0.8W = availableWidth
    // Therefore: W = availableWidth / 5.8
    CARD_WIDTH = availableWidth / 6.5;
    
    // Standard card ratio (slightly taller than wide)
    CARD_HEIGHT = CARD_WIDTH * 1.65;
    
    // Gap between cards (20% of card width)
    CARD_SPACING = CARD_WIDTH * 0.42;
}

// Set canvas dimensions
function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        initializeCardDimensions();
        drawBackground();
    }
}

// Add winning cards tracking to game state
const gameState = {
    hand: [], // Current hand of cards
    isPlaying: false,
    selectedCards: new Set(), // Track indices of held cards
    flippingCards: [], // Track cards being flipped
    winningCards: new Set() // Track indices of winning cards
};

// Animation constants
const FLIP_DURATION = 300; // Duration of flip animation in ms
const DEAL_DELAY = 100; // Delay between dealing cards

// Function to draw a flipping card
function drawFlippingCard(x, y, card, flipProgress, flippingDown = false) {
    // Calculate scale factor for 3D effect
    let scaleFactor;
    if (flipProgress < 0.5) {
        scaleFactor = Math.cos(flipProgress * Math.PI);
    } else {
        scaleFactor = Math.cos((1 - flipProgress) * Math.PI);
    }
    
    // Ensure scale factor is positive and not too small
    scaleFactor = Math.max(Math.abs(scaleFactor), 0.1);
    
    // Calculate visible width
    const visibleWidth = CARD_WIDTH * scaleFactor;
    const offsetX = (CARD_WIDTH - visibleWidth) / 2;
    
    // Draw the appropriate side
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x + offsetX, y - CARD_HEIGHT/2, visibleWidth, CARD_HEIGHT, CARD_CORNER_RADIUS);
    ctx.clip();
    
    if (flippingDown) {
        // Flipping to face down
        if (flipProgress < 0.5) {
            drawCardFace(x, y, card);
        } else {
            drawCardBack(x, y);
        }
    } else {
        // Flipping to face up
        if (flipProgress < 0.5) {
            drawCardBack(x, y);
        } else {
            drawCardFace(x, y, card);
        }
    }
    
    ctx.restore();
}

// Function to animate a card flip
function animateCardFlip(flippingCard, onComplete) {
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / FLIP_DURATION, 1);
        
        // Use easing function for smoother animation
        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        flippingCard.flipProgress = easeInOutQuad(progress);
        
        drawBackground();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            flippingCard.complete = true;
            gameState.flippingCards = gameState.flippingCards.filter(fc => !fc.complete);
            if (onComplete) onComplete();
        }
    }
    
    requestAnimationFrame(animate);
}

// Function to render a card face
function drawCardFace(x, y, card, index) {
    ctx.save();
    
    // Draw white background with border
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    ctx.fill();

    // Only draw card content if we have a valid card
    if (card) {
        // Set color based on suit
        ctx.fillStyle = SUIT_COLORS[card.suit];

        // Draw rank
        ctx.font = `bold ${CARD_WIDTH * 0.5}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(card.rank, x + CARD_WIDTH * 0.1, y - CARD_HEIGHT * 0.2);

        // Draw suit symbol
        ctx.font = `${CARD_WIDTH * 0.7}px Arial`;
        ctx.fillText(SUIT_SYMBOLS[card.suit], x + CARD_WIDTH * 0.1, y + 15);
    }

    // Draw green border for winning cards when game is over
    if (!gameState.isPlaying && gameState.winningCards.has(index)) {
        ctx.strokeStyle = '#2ecc71'; // Green color
        ctx.lineWidth = 4;
        ctx.beginPath();
        roundRect(ctx, x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.stroke();
    }
    // Draw blue border for selected cards during gameplay
    else if (gameState.isPlaying && gameState.selectedCards.has(index)) {
        ctx.strokeStyle = '#1278dd';
        ctx.lineWidth = 4;
        ctx.beginPath();
        roundRect(ctx, x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.stroke();
    }

    // Draw dark overlay for losing cards when game is over
    if (!gameState.isPlaying && !gameState.winningCards.has(index)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent black
        ctx.beginPath();
        roundRect(ctx, x, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.fill();
    }

    // Draw "HOLD" label if selected during gameplay
    if (gameState.isPlaying && gameState.selectedCards.has(index)) {
        const labelWidth = CARD_WIDTH * 0.85;
        const labelHeight = CARD_HEIGHT * 0.16;
        const labelX = x + (CARD_WIDTH - labelWidth) / 2;
        const labelY = y + CARD_HEIGHT / 2 - labelHeight / 2;

        // Draw label background with rounded corners
        ctx.fillStyle = '#7e54f4';
        ctx.beginPath();
        roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 8);
        ctx.fill();

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${labelHeight * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HOLD', x + CARD_WIDTH / 2, labelY + labelHeight / 2);
    }

    ctx.restore();
}

// Draw background and cards
function drawBackground() {
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate total width of all cards with spacing
    const totalWidth = (CARD_WIDTH * 5) + (CARD_SPACING * 4);
    
    // Center horizontally
    const startX = (canvas.width - totalWidth) / 2;
    
    // Position vertically - center in the canvas
    const y = canvas.height / 2;
    
    // Draw the cards
    for (let i = 0; i < 5; i++) {
        const x = startX + (CARD_WIDTH + CARD_SPACING) * i;
        
        // Check if this card is being flipped
        const flippingCard = gameState.flippingCards.find(fc => fc.index === i);
        
        if (flippingCard) {
            drawFlippingCard(x, y, flippingCard.card, flippingCard.flipProgress, flippingCard.flippingDown);
        } else if (!gameState.hand[i]) {
            // Draw card back if card is null (face down)
            drawCardBack(x, y);
        } else {
            drawCardFace(x, y, gameState.hand[i], i);
        }
    }
}

// Function to draw card back
function drawCardBack(x, y) {
    if (!cardBackImage.complete) {
        // If image not loaded yet, draw placeholder
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        roundRect(ctx, x, y - CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.fill();
        return;
    }

    // Draw card back image with white border
    ctx.save();
    // Draw white border
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, x, y - CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    ctx.fill();
    
    // Draw the card back image
    ctx.drawImage(
        cardBackImage, 
        x + 2, 
        y - CARD_HEIGHT/2 + 2, 
        CARD_WIDTH - 4, 
        CARD_HEIGHT - 4
    );
    ctx.restore();
}

// Helper function for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
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
}

// Handle resize
window.addEventListener('resize', resizeCanvas);

// Function to update deal button state
function updateDealButtonState() {
    const dealBtn = document.getElementById('dealButton');
    if (gameState.isPlaying) {
        dealBtn.disabled = false;
        dealBtn.style.opacity = '1';
    } else {
        dealBtn.disabled = true;
        dealBtn.style.opacity = '0.5';
    }
}

// Initial setup
resizeCanvas();
updateDealButtonState(); // Set initial state

// Function to flip all cards face down before new game
async function flipAllCardsFaceDown() {
    return new Promise(resolve => {
        // If no cards to flip, resolve immediately
        if (!gameState.hand.length) {
            resolve();
            return;
        }

        // Create temporary array of current cards
        const currentCards = [...gameState.hand];
        
        // Create flipping card objects for all cards
        gameState.flippingCards = currentCards.map((card, index) => ({
            card: card, // Start with current card
            index,
            flipProgress: 0,
            complete: false,
            flippingDown: true // Add flag to indicate direction
        }));
        
        // Start flip animation for all cards
        let completedFlips = 0;
        const totalFlips = gameState.flippingCards.length;
        
        gameState.flippingCards.forEach(fc => {
            animateCardFlip(fc, () => {
                completedFlips++;
                if (completedFlips === totalFlips) {
                    // Clear the hand only after all flips are complete
                    gameState.hand = Array(5).fill(null);
                    gameState.selectedCards.clear();
                    gameState.flippingCards = [];
                    drawBackground();
                    // Add a small delay before resolving
                    setTimeout(resolve, 100);
                }
            });
        });
    });
}

// Function to show win message
function showWinMessage(result, multiplier, amount, currency) {
    const winMessageDiv = document.querySelector('.win-message');
    
    // Format the result text by replacing underscores with spaces and capitalizing each word
    const formattedResult = result
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    winMessageDiv.querySelector('.win-title').textContent = formattedResult;
    winMessageDiv.querySelector('.multiplier').textContent = multiplier.toFixed(2) + '×';
    winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
    winMessageDiv.classList.add('visible');
}

// Function to hide win message
function hideWinMessage() {
    const winMessageDiv = document.querySelector('.win-message');
    winMessageDiv.classList.remove('visible');
}

// Update play button handler to validate against limits
document.getElementById('playBtn').addEventListener('click', async () => {
    try {
        // Hide any existing win message
        hideWinMessage();

        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = true;
        playBtn.style.opacity = '0.5';

        // Get bet amount and currency
        const betAmount = parseFloat(document.getElementById('betAmount').value);
        const currency = document.getElementById('currency').value;

        // Validate bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount');
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
            return;
        }

        // Validate against bet limits
        const limits = BET_LIMITS[currency];
        if (betAmount < limits.min || betAmount > limits.max) {
            alert(`Bet must be between ${limits.min} and ${limits.max} ${currency}`);
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
            return;
        }

        // Get current balance from the navbar
        const selectedBalance = document.getElementById('selected-balance');
        if (!selectedBalance) {
            throw new Error('Could not find balance element');
        }
        
        // Extract the balance value from the selected balance text
        const balanceText = selectedBalance.textContent;
        const currentBalance = parseFloat(balanceText.replace(/[^0-9.-]+/g, ''));

        // Check if user has sufficient balance
        if (currentBalance < betAmount) {
            alert('Insufficient balance');
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
            return;
        }

        // Deduct bet amount from display immediately
        const newBalance = currentBalance - betAmount;
        selectedBalance.textContent = formatCurrencyAmount(newBalance, currency);

        // First flip any existing cards face down and wait for completion
        await flipAllCardsFaceDown();
        
        // Small delay before starting new game
        await new Promise(resolve => setTimeout(resolve, 200));

        // Start game request
        const response = await fetch('/games/video_poker/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                betAmount,
                currency
            })
        });

        if (!response.ok) {
            // If error occurs, restore the original balance
            selectedBalance.textContent = formatCurrencyAmount(currentBalance, currency);
            const error = await response.json();
            throw new Error(error.error || 'Failed to start game');
        }

        // Get game data
        const data = await response.json();
        
        // Update game state
        gameState.isPlaying = true;
        
        // Update balance display with the balance from backend
        if (typeof data.balance === 'number') {
            selectedBalance.textContent = formatCurrencyAmount(data.balance, currency);
        }
        
        // Update deal button state
        updateDealButtonState();
        
        // Flip all cards at once to reveal initial hand
        await flipAllCards(data.hand);
        drawBackground();

    } catch (error) {
        alert(error.message);
        console.error('Error starting game:', error);
        // Reset button state on error
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        gameState.isPlaying = false;
        updateDealButtonState();
    }
});

// Function to flip cards face down
async function flipCardsFaceDown(holds) {
    return new Promise(resolve => {
        // Create temporary array of current cards
        const currentCards = [...gameState.hand];
        
        // First set non-held cards to null immediately
        currentCards.forEach((card, index) => {
            if (!holds.includes(index)) {
                gameState.hand[index] = null;
            }
        });
        
        // Create flipping card objects for non-held cards
        gameState.flippingCards = currentCards.map((card, index) => {
            if (!holds.includes(index)) {
                return {
                    card: card, // Start with current card
                    index,
                    flipProgress: 0,
                    complete: false,
                    flippingDown: true
                };
            }
            return null;
        }).filter(Boolean);
        
        // If no cards to flip, resolve immediately
        if (gameState.flippingCards.length === 0) {
            resolve();
            return;
        }
        
        // Start flip animation for all non-held cards
        let completedFlips = 0;
        const totalFlips = gameState.flippingCards.length;
        
        gameState.flippingCards.forEach(fc => {
            animateCardFlip(fc, () => {
                completedFlips++;
                if (completedFlips === totalFlips) {
                    gameState.flippingCards = [];
                    drawBackground();
                    setTimeout(resolve, 100);
                }
            });
        });
    });
}

// Function to flip cards one by one
// Update deal button handler to ensure proper sequencing
document.getElementById('dealButton').addEventListener('click', async () => {
    try {
        if (!gameState.isPlaying) return;

        const dealBtn = document.getElementById('dealButton');
        dealBtn.disabled = true;
        dealBtn.style.opacity = '0.5';

        // Convert Set to Array for the held card indices
        const holds = Array.from(gameState.selectedCards);

        // First flip non-held cards face down and wait for completion
        await flipCardsFaceDown(holds);
        
        // Small delay before making the deal request
        await new Promise(resolve => setTimeout(resolve, 200));

        // Send deal request
        const response = await fetch('/games/video_poker/deal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ holds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to deal cards');
        }

        // Get final hand data
        const data = await response.json();
        
        // Then flip them face up one by one with new values
        await flipCardsSequentially(data.finalHand, holds);
        
        // Clear selected cards and set game state
        gameState.selectedCards.clear();
        gameState.isPlaying = false;
        
        // Set winning cards based on the result
        gameState.winningCards.clear();
        if (data.winningCards && data.winningCards.length > 0) {
            data.winningCards.forEach(index => gameState.winningCards.add(index));
        }
        
        // Redraw to show winning/losing cards
        drawBackground();
        
        // Show result and update balance if there's a win
        if (data.win > 0) {
            showWinMessage(data.result, data.multiplier, data.win, data.currency);
            // Update balance display with the balance from response
            const selectedBalance = document.getElementById('selected-balance');
            if (selectedBalance && typeof data.balance === 'number') {
                selectedBalance.textContent = formatCurrencyAmount(data.balance, data.currency);
            }
        }
        
        // Re-enable play button
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        
        // Update deal button state
        updateDealButtonState();

    } catch (error) {
        alert(error.message);
        console.error('Error dealing cards:', error);
        // Re-enable deal button on error
        const dealBtn = document.getElementById('dealButton');
        dealBtn.disabled = false;
        dealBtn.style.opacity = '1';
    }
});

// Handle canvas clicks
canvas.addEventListener('click', (event) => {
    if (!gameState.isPlaying) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate card positions
    const totalWidth = (CARD_WIDTH * 5) + (CARD_SPACING * 4);
    const startX = (canvas.width - totalWidth) / 2;
    const centerY = canvas.height / 2;

    // Check each card
    for (let i = 0; i < 5; i++) {
        const cardX = startX + (CARD_WIDTH + CARD_SPACING) * i;
        const cardY = centerY - CARD_HEIGHT/2;

        // Check if click is within card bounds
        if (x >= cardX && x <= cardX + CARD_WIDTH &&
            y >= cardY && y <= cardY + CARD_HEIGHT) {
            // Toggle card selection
            if (gameState.selectedCards.has(i)) {
                gameState.selectedCards.delete(i);
            } else {
                gameState.selectedCards.add(i);
            }
            // Redraw canvas to show selection
            drawBackground();
            break;
        }
    }
});

// Function to flip all cards at once
async function flipAllCards(newHand) {
    return new Promise(resolve => {
        // Create flipping card objects for all cards
        gameState.flippingCards = newHand.map((card, index) => ({
            card,
            index,
            flipProgress: 0,
            complete: false
        }));
        
        // Start flip animation for all cards
        let completedFlips = 0;
        gameState.flippingCards.forEach(fc => {
            animateCardFlip(fc, () => {
                completedFlips++;
                if (completedFlips === newHand.length) {
                    gameState.hand = newHand;
                    resolve();
                }
            });
        });
    });
}

// Function to flip cards one by one
async function flipCardsSequentially(finalHand, holds) {
    // Keep track of which cards are currently face down
    const faceDownIndices = new Set();
    for (let i = 0; i < 5; i++) {
        if (!holds.includes(i)) {
            gameState.hand[i] = null; // Clear non-held cards
            faceDownIndices.add(i);
        }
    }
    drawBackground();

    // Flip each non-held card one by one
    for (let i = 0; i < 5; i++) {
        if (!holds.includes(i)) {
            await new Promise(resolve => {
                const flippingCard = {
                    card: finalHand[i],
                    index: i,
                    flipProgress: 0,
                    complete: false,
                    flippingDown: false // Add flag to indicate direction
                };
                
                gameState.flippingCards = [flippingCard];
                animateCardFlip(flippingCard, () => {
                    gameState.hand[i] = finalHand[i];
                    faceDownIndices.delete(i);
                    setTimeout(resolve, DEAL_DELAY);
                });
            });
        }
    }
}

// The currency change handler is now handled by the syncCurrencySelections function
