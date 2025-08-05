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

// Navbar elements
const balanceBox = document.getElementById('balance-box');
const selectedBalance = document.getElementById('selected-balance');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const currencySelect = document.getElementById('currency');

// Sync currency selection between navbar and game controls
function syncCurrencySelections() {
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      if (currencySelect) {
        currencySelect.value = currency;
        
        // Update bet input placeholder and value based on currency
        const betInput = document.getElementById('betAmount');
        if (betInput) {
          if (currency === 'USD') {
            betInput.value = '1.00';
            betInput.placeholder = 'Min: $0.10 - Max: $1,000';
            betInput.step = '0.10';
          } else {
            betInput.value = '10000';
            betInput.placeholder = 'Min: £10,000 - Max: £100,000,000';
            betInput.step = '10000';
          }
        }
        
        // Reset total multiplier and game state
        updateProfitDisplay(1); // Reset to 1x multiplier
      }
    });
  });

  // Set up event listener for game control currency dropdown
  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      const currency = currencySelect.value;
      
      // Find the corresponding navbar dropdown item
      const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
      
      if (matchingItem) {
        // Update selected balance display
        const amountSpan = matchingItem.querySelector('.amount-label');
        if (amountSpan && selectedBalance) {
          selectedBalance.textContent = amountSpan.textContent;
        }
        
        // Hide dropdown after selection
        const dropdown = document.getElementById('balance-dropdown');
        if (dropdown) {
          dropdown.style.display = 'none';
        }
      }
    });
  }
}

// Function to update balance display
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
    const selectedCurrency = currencySelect.value;
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
});

// Card definitions and constants
const CARD_NAMES = {
  1: 'A', 2: '2', 3: '3', 4: '4',
  5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
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

const CARD_CORNER_RADIUS = 10;

// Card back image
const cardBackImage = new Image();
cardBackImage.src = '/games/blackjack/card_back.png';

// Canvas setup
const canvas = document.getElementById('hiloCanvas');
const ctx = canvas.getContext('2d');

// Game state
const gameState = {
  currentCard: Math.floor(Math.random() * 13) + 1,
  currentSuit: SUITS[Math.floor(Math.random() * SUITS.length)],
  cardWidthMultiplier: 0.3,
  cardHeightRatio: 2.1,
  animatingCards: [], // Track cards being animated
  flippingCards: [], // Track cards being flipped,
  isPlaying: false, // Track if game is in progress
  hasLost: false, // Track if player just lost
  cardHistory: [], // Track history of cards
  lastTotalMultiplier: null, // Track last known total multiplier
  // Button state
  buttons: {
    higher: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false
    },
    lower: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false
    }
  },
  // Track if bet buttons are clickable
  betButtonsEnabled: true
};

// Add bet limits at the top with other constants
const BET_LIMITS = {
  USD: { min: 0.10, max: 1000 },
  LBP: { min: 10000, max: 100000000 }
};

// Add constants for button size multipliers at the top with other constants
const BUTTON_WIDTH_MULTIPLIER = 0.85;  // Button width relative to card width
const BUTTON_HEIGHT_MULTIPLIER = 0.6; // Button height relative to card height
const DECK_X_POSITION = 0.35;          // Deck position from left (as fraction of canvas width)
const BUTTON_GAP_MULTIPLIER = 0.2;    // Gap between buttons relative to button height
const BUTTON_X_OFFSET = 0.2;          // Button distance from card (as multiplier of card width)
const BUTTON_FONT_SIZE = 22;          // Font size for button text in pixels
const BUTTON_LINE_HEIGHT = 24;        // Line height for multi-line button text

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

// Draw card back
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
        // Image is wider than card - scale to height
        drawHeight = height - 4;
        drawWidth = drawHeight * imgAspect;
      } else {
        // Image is taller than card - scale to width
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

// Draw a single card
function renderCard(cardNumber, x, y, width, height, isLosingCard = false) {
  // Draw card background
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = isLosingCard ? '#e74c3c' : '#e5e6e7';
  ctx.lineWidth = isLosingCard ? 6 : 2;
  
  // Draw rounded rectangle for card
  roundRect(ctx, x, y - height / 2, width, height, CARD_CORNER_RADIUS, true, true);
  
  // Draw card value
  const cardText = CARD_NAMES[cardNumber];
  const suitSymbol = SUIT_SYMBOLS[gameState.currentSuit];
  const color = SUIT_COLORS[gameState.currentSuit];
  
  ctx.fillStyle = color;
  
  // Calculate positions and sizes
  const fontSize = width * 0.6;
  const suitFontSize = fontSize * 1.2;
  const padding = width * 0.15; // Padding from the edge of the card
  
  // Draw value in top left
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cardText, x + padding, y - height/2 + padding);
  
  // Draw suit symbol below the number
  ctx.font = `${suitFontSize}px Arial`;
  ctx.fillText(suitSymbol, x + padding, y - height/2 + padding + fontSize * 1.1);
}

// Draw a flipping card
function drawFlippingCard(flippingCard, x, y, width, height) {
  // Calculate the scale factor based on flip progress to simulate perspective
  let scaleFactor;
  if (flippingCard.flipProgress < 0.5) {
    // First half of flip: card appears to get narrower as it rotates
    scaleFactor = Math.cos(flippingCard.flipProgress * Math.PI);
  } else {
    // Second half of flip: card appears to get wider as it completes rotation
    scaleFactor = Math.cos((1 - flippingCard.flipProgress) * Math.PI);
  }
  
  // Ensure scale factor is positive and not too small
  scaleFactor = Math.max(Math.abs(scaleFactor), 0.1);
  
  // Calculate the visible width using the scale factor
  const visibleWidth = width * scaleFactor;
  
  // Keep the card centered during flip
  const offsetX = (width - visibleWidth) / 2;
  
  // Draw the appropriate side
  if (flippingCard.flipProgress < 0.5) {
    // First half of animation - show card back
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x + offsetX, y - height / 2, visibleWidth, height, CARD_CORNER_RADIUS, false, false);
    ctx.clip();
    drawCardBack(x, y, width, height);
    ctx.restore();
  } else {
    // Second half of animation - show card front
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x + offsetX, y - height / 2, visibleWidth, height, CARD_CORNER_RADIUS, false, false);
    ctx.clip();
    renderCard(flippingCard.card, x, y, width, height);
    ctx.restore();
  }
}

// Animate card flip
function animateCardFlip(flippingCard, onComplete) {
  const startTime = performance.now();
  const duration = 300; // Animation duration in ms
  
  function animate(currentTime) {
    try {
      // Calculate animation progress (0 to 1)
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother animation
      const easeInOutQuad = function(t) { 
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      };
      
      // Update flip progress with easing
      flippingCard.flipProgress = easeInOutQuad(progress);
      
      // Calculate card dimensions
      const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
      const cardHeight = cardWidth * gameState.cardHeightRatio;
      const centerX = canvas.width * DECK_X_POSITION - cardWidth / 2;
      const centerY = canvas.height / 2;
      
      // Clear and redraw background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f212d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw side arrows first
      drawSideArrows(ctx, canvas.width, canvas.height);
      
      // Draw deck stack
      const stackPeekAmount = 5;
      for (let i = 6; i > 0; i--) {
        drawCardBack(
          centerX,
          centerY + stackPeekAmount * i,
          cardWidth,
          cardHeight
        );
      }
      
      // Draw the flipping card
      drawFlippingCard(flippingCard, centerX, centerY, cardWidth, cardHeight);
      
      // Draw buttons
      const buttonWidth = cardWidth * BUTTON_WIDTH_MULTIPLIER;
      const buttonHeight = cardHeight * BUTTON_HEIGHT_MULTIPLIER;
      const buttonX = centerX + cardWidth + cardWidth * BUTTON_X_OFFSET;
      const buttonGap = buttonHeight * BUTTON_GAP_MULTIPLIER;
      
      const higherButtonY = centerY - buttonHeight - buttonGap/2;
      const lowerButtonY = centerY + buttonGap/2;
      
      // Update button positions in gameState
      gameState.buttons.higher = {
        ...gameState.buttons.higher,
        x: buttonX,
        y: higherButtonY,
        width: buttonWidth,
        height: buttonHeight
      };
      
      gameState.buttons.lower = {
        ...gameState.buttons.lower,
        x: buttonX,
        y: lowerButtonY,
        width: buttonWidth,
        height: buttonHeight
      };
      
      // Draw the buttons
      drawButton(
        buttonX, higherButtonY, buttonWidth, buttonHeight,
        'HIGHER',
        gameState.buttons.higher.hovered,
        gameState.isPlaying,
        '#ffcd35', // Higher button color
        '#000000'  // Higher button text color
      );
      
      drawButton(
        buttonX, lowerButtonY, buttonWidth, buttonHeight,
        'LOWER',
        gameState.buttons.lower.hovered,
        gameState.isPlaying,
        '#804ff7', // Lower button color
        '#ffffff'  // Lower button text color
      );
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        flippingCard.complete = true;
        gameState.flippingCards = gameState.flippingCards.filter(fc => !fc.complete);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error in animateCardFlip:', error, flippingCard);
      flippingCard.complete = true;
      gameState.flippingCards = gameState.flippingCards.filter(fc => !fc.complete);
      if (onComplete) onComplete();
    }
  }
  
  requestAnimationFrame(animate);
}

// Animate card sliding up
function animateCardSlideUp(card, onComplete) {
  const startTime = performance.now();
  const duration = 300; // Animation duration in ms
  
  // Calculate card dimensions
  const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
  const cardHeight = cardWidth * gameState.cardHeightRatio;
  
  // Calculate start and end positions
  const centerX = canvas.width * DECK_X_POSITION - cardWidth / 2;
  const startY = canvas.height / 2;
  const endY = -cardHeight;
  
  // Maximum rotation angle in radians (about 25 degrees)
  const maxRotation = 25 * Math.PI / 180;
  // Randomly choose direction (-1 for left, 1 for right)
  const rotationDirection = Math.random() < 0.5 ? -1 : 1;
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easing functions for smoother animation
    const easeInQuad = t => t * t;
    
    // Calculate vertical position with easing
    const currentY = startY + (endY - startY) * easeInQuad(progress);
    
    // Calculate rotation angle
    const rotation = rotationDirection * maxRotation * Math.sin(progress * Math.PI) * (1 - progress);
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f212d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw side arrows first
    drawSideArrows(ctx, canvas.width, canvas.height);
    
    // Draw deck stack
    const stackPeekAmount = 5;
    for (let i = 6; i > 0; i--) {
      drawCardBack(
        centerX,
        canvas.height / 2 + stackPeekAmount * i,
        cardWidth,
        cardHeight
      );
    }
    
    // Draw sliding card with rotation
    ctx.save();
    ctx.translate(centerX + cardWidth / 2, currentY);
    ctx.rotate(rotation);
    renderCard(card, -cardWidth / 2, 0, cardWidth, cardHeight);
    ctx.restore();
    
    // Draw buttons
    const buttonWidth = cardWidth * BUTTON_WIDTH_MULTIPLIER;
    const buttonHeight = cardHeight * BUTTON_HEIGHT_MULTIPLIER;
    const buttonX = centerX + cardWidth + cardWidth * BUTTON_X_OFFSET;
    const buttonGap = buttonHeight * BUTTON_GAP_MULTIPLIER;
    
    const higherButtonY = canvas.height / 2 - buttonHeight - buttonGap/2;
    const lowerButtonY = canvas.height / 2 + buttonGap/2;
    
    // Update button positions in gameState
    gameState.buttons.higher = {
      ...gameState.buttons.higher,
      x: buttonX,
      y: higherButtonY,
      width: buttonWidth,
      height: buttonHeight
    };
    
    gameState.buttons.lower = {
      ...gameState.buttons.lower,
      x: buttonX,
      y: lowerButtonY,
      width: buttonWidth,
      height: buttonHeight
    };
    
    // Draw the buttons
    drawButton(
      buttonX, higherButtonY, buttonWidth, buttonHeight,
      'HIGHER',
      gameState.buttons.higher.hovered,
      gameState.isPlaying,
      '#ffcd35', // Higher button color
      '#000000'  // Higher button text color
    );
    
    drawButton(
      buttonX, lowerButtonY, buttonWidth, buttonHeight,
      'LOWER',
      gameState.buttons.lower.hovered,
      gameState.isPlaying,
      '#804ff7', // Lower button color
      '#ffffff'  // Lower button text color
    );
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  }
  
  requestAnimationFrame(animate);
}

// Draw a button
function drawButton(x, y, width, height, text, isHovered, isEnabled, buttonColor, textColor) {
  // Set opacity based on game state and button enabled state
  ctx.globalAlpha = (isEnabled && gameState.betButtonsEnabled) ? 1 : 0.5;
  
  // Button background
  ctx.fillStyle = isHovered && isEnabled && gameState.betButtonsEnabled ? buttonColor : buttonColor;
  ctx.strokeStyle = '#213842';
  ctx.lineWidth = 8;
  
  // Draw arrow-shaped button
  const arrowHeight = height * 0.4; // Arrow height is 40% of button height
  
  ctx.beginPath();
  if (text === 'HIGHER') {
    // Draw upward pointing arrow button
    ctx.moveTo(x + width/2, y); // Top point
    ctx.lineTo(x + width, y + arrowHeight); // Top right corner
    ctx.lineTo(x + width, y + height); // Bottom right
    ctx.lineTo(x, y + height); // Bottom left
    ctx.lineTo(x, y + arrowHeight); // Top left corner
  } else {
    // Draw downward pointing arrow button
    ctx.moveTo(x, y); // Top left
    ctx.lineTo(x + width, y); // Top right
    ctx.lineTo(x + width, y + height - arrowHeight); // Bottom right corner
    ctx.lineTo(x + width/2, y + height); // Bottom point
    ctx.lineTo(x, y + height - arrowHeight); // Bottom left corner
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Button text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${BUTTON_FONT_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Get button text based on current card
  let buttonText = text;
  if (gameState.currentCard === 1) { // Ace
    buttonText = text === 'HIGHER' ? 'Higher' : 'Same';
  } else if (gameState.currentCard === 13) { // King
    buttonText = text === 'HIGHER' ? 'Same' : 'Lower';
  } else {
    buttonText = text === 'HIGHER' ? 'Higher\nor same' : 'Lower\nor same';
  }
  
  // Calculate win probability
  let probability;
  const currentCard = gameState.currentCard;
  if (text === 'HIGHER') {
    if (currentCard === 1) { // Ace
      probability = 12/13; // All cards except Ace are higher
    } else if (currentCard === 13) { // King
      probability = 1/13; // Only same is possible
    } else {
      probability = (14 - currentCard) / 13; // Higher or same
    }
  } else {
    if (currentCard === 1) { // Ace
      probability = 1/13; // Only same is possible
    } else if (currentCard === 13) { // King
      probability = 12/13; // Lower only
    } else {
      probability = currentCard / 13; // Lower or same
    }
  }
  
  // Handle multi-line text
  const lines = buttonText.split('\n');
  let startY;
  if (text === 'HIGHER') {
    // Keep higher button text centered
    startY = y + height/2 - (lines.length - 1) * BUTTON_LINE_HEIGHT/2;
  } else {
    // Move lower button text to top
    startY = y + height * 0.25 - (lines.length - 1) * BUTTON_LINE_HEIGHT/2;
  }
  
  // Draw main text
  lines.forEach((line, i) => {
    ctx.fillText(line, x + width/2, startY + i * BUTTON_LINE_HEIGHT);
  });
  
  // Draw probability percentage
  ctx.font = `bold ${BUTTON_FONT_SIZE * 1.1}px Arial`; // Bigger font for percentage
  const percentageText = `${(probability * 100).toFixed(2)}%`;
  const percentageY = text === 'HIGHER' ? 
    startY + lines.length * BUTTON_LINE_HEIGHT + BUTTON_LINE_HEIGHT/2 : // Below text for higher button
    startY + lines.length * BUTTON_LINE_HEIGHT + BUTTON_LINE_HEIGHT/2; // Same spacing as higher button
  ctx.fillText(percentageText, x + width/2, percentageY);
  
  // Reset opacity
  ctx.globalAlpha = 1;
}

// Draw side arrows and letters
function drawSideArrows(ctx, canvasWidth, canvasHeight) {
  const arrowColor = '#213742';
  const arrowWidth = 5; // Increased thickness
  const arrowLength = canvasHeight * 0.6;
  const arrowHeadSize = 25;
  const letterSize = 'bold 42px Arial'; // Bigger font
  
  // Center Y positions for both arrows
  const centerY = canvasHeight / 2;
  const halfArrowLength = arrowLength / 2;
  
  // Left side upward arrow (K)
  ctx.beginPath();
  ctx.strokeStyle = arrowColor;
  ctx.fillStyle = arrowColor;
  ctx.lineWidth = arrowWidth;
  
  // Left arrow position (centered)
  const leftX = canvasWidth * 0.07; // Moved from 0.1 to 0.05 (closer to left edge)
  const leftStartY = centerY + halfArrowLength;
  const leftEndY = centerY - halfArrowLength;
  
  // Draw left arrow line
  ctx.moveTo(leftX, leftStartY);
  ctx.lineTo(leftX, leftEndY);
  
  // Draw left arrow head
  ctx.moveTo(leftX - arrowHeadSize/2, leftEndY + arrowHeadSize);
  ctx.lineTo(leftX, leftEndY);
  ctx.lineTo(leftX + arrowHeadSize/2, leftEndY + arrowHeadSize);
  ctx.stroke();
  
  // Draw K above left arrow
  ctx.font = letterSize;
  ctx.textAlign = 'center';
  ctx.fillText('K', leftX, leftEndY - 25);
  
  // Right side downward arrow (A)
  ctx.beginPath();
  
  // Right arrow position (centered)
  const rightX = canvasWidth * 0.92; // Moved from 0.9 to 0.95 (closer to right edge)
  const rightStartY = centerY - halfArrowLength;
  const rightEndY = centerY + halfArrowLength;
  
  // Draw right arrow line
  ctx.moveTo(rightX, rightStartY);
  ctx.lineTo(rightX, rightEndY);
  
  // Draw right arrow head
  ctx.moveTo(rightX - arrowHeadSize/2, rightEndY - arrowHeadSize);
  ctx.lineTo(rightX, rightEndY);
  ctx.lineTo(rightX + arrowHeadSize/2, rightEndY - arrowHeadSize);
  ctx.stroke();
  
  // Draw A below right arrow
  ctx.fillText('A', rightX, rightEndY + 45);
}

// Update drawGame function to include side arrows
function drawGame() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f212d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw side arrows first
  drawSideArrows(ctx, canvas.width, canvas.height);
  
  // Calculate card dimensions
  const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
  const cardHeight = cardWidth * gameState.cardHeightRatio;
  
  // Calculate center position (shifted left by 10% of canvas width)
  const centerX = canvas.width * DECK_X_POSITION - cardWidth / 2;
  const centerY = canvas.height / 2;
  
  // Draw deck stack effect
  const stackPeekAmount = 5;
  for (let i = 6; i > 0; i--) {
    drawCardBack(
      centerX,
      centerY + stackPeekAmount * i,
      cardWidth,
      cardHeight
    );
  }
  
  // Draw any flipping cards or current card
  if (gameState.flippingCards.length > 0) {
    gameState.flippingCards.forEach(flippingCard => {
      drawFlippingCard(flippingCard, centerX, centerY, cardWidth, cardHeight);
    });
  } else {
    renderCard(gameState.currentCard, centerX, centerY, cardWidth, cardHeight, gameState.hasLost);
  }
  
  // Calculate button dimensions and positions
  const buttonWidth = cardWidth * BUTTON_WIDTH_MULTIPLIER;
  const buttonHeight = cardHeight * BUTTON_HEIGHT_MULTIPLIER;
  const buttonX = centerX + cardWidth + cardWidth * BUTTON_X_OFFSET;
  const buttonGap = buttonHeight * BUTTON_GAP_MULTIPLIER;
  
  // Position buttons vertically centered relative to the card
  const higherButtonY = centerY - buttonHeight - buttonGap/2;
  const lowerButtonY = centerY + buttonGap/2;
  
  // Update button positions in gameState
  gameState.buttons.higher = {
    ...gameState.buttons.higher,
    x: buttonX,
    y: higherButtonY,
    width: buttonWidth,
    height: buttonHeight
  };
  
  gameState.buttons.lower = {
    ...gameState.buttons.lower,
    x: buttonX,
    y: lowerButtonY,
    width: buttonWidth,
    height: buttonHeight
  };
  
  // Draw the buttons with new colors
  drawButton(
    buttonX, higherButtonY, buttonWidth, buttonHeight,
    'HIGHER',
    gameState.buttons.higher.hovered,
    gameState.isPlaying,
    '#ffcd35', // Higher button color
    '#000000'  // Higher button text color
  );
  
  drawButton(
    buttonX, lowerButtonY, buttonWidth, buttonHeight,
    'LOWER',
    gameState.buttons.lower.hovered,
    gameState.isPlaying,
    '#804ff7', // Lower button color
    '#ffffff'  // Lower button text color
  );
}

// Handle mouse movement for button hover effects
canvas.addEventListener('mousemove', (event) => {
  if (!gameState.isPlaying) return;
  
  // Get canvas-relative coordinates
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Scale coordinates based on canvas scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = x * scaleX;
  const canvasY = y * scaleY;
  
  // Check if mouse is over either button
  let needsRedraw = false;
  
  ['higher', 'lower'].forEach(button => {
    const b = gameState.buttons[button];
    const isHovered = canvasX >= b.x && canvasX <= b.x + b.width &&
                     canvasY >= b.y && canvasY <= b.y + b.height;
    
    if (isHovered !== b.hovered) {
      b.hovered = isHovered;
      needsRedraw = true;
    }
  });
  
  if (needsRedraw) {
    drawGame();
  }
});

// Handle button clicks
canvas.addEventListener('click', async (event) => {
  if (!gameState.isPlaying || !gameState.betButtonsEnabled) return;
  
  // Get canvas-relative coordinates
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Scale coordinates based on canvas scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = x * scaleX;
  const canvasY = y * scaleY;
  
  // Check which button was clicked
  for (const [guess, button] of Object.entries(gameState.buttons)) {
    if (canvasX >= button.x && canvasX <= button.x + button.width &&
        canvasY >= button.y && canvasY <= button.y + button.height) {
      // Disable buttons to prevent double clicks
      gameState.betButtonsEnabled = false;
      // Update button appearance
      drawGame();
      
      // Send guess to backend
      try {
        const response = await fetch('/games/hilo/guess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentCard: gameState.currentCard,
            guess
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to make guess');
        }
        
        const data = await response.json();
        
        // Enable cashout button after first bet
        const cashoutBtn = document.getElementById('cashoutBtn');
        if (cashoutBtn.disabled) {
          cashoutBtn.disabled = false;
          cashoutBtn.style.opacity = '1';
        }
        
        // Store the old card for animation
        const oldCard = gameState.currentCard;
        // Update the current card with the one from the backend
        gameState.currentCard = data.nextCard;
        
        // First animate the current card sliding up
        animateCardSlideUp(oldCard, () => {
          setTimeout(() => {
            // Create a flipping card object for the new card
            const flippingCard = {
              card: data.nextCard,
              flipProgress: 0,
              complete: false
            };
            
            // Add to flipping cards array
            gameState.flippingCards = [flippingCard];
            
            // Start the flip animation
            animateCardFlip(flippingCard, () => {
              // After animation completes, handle win/loss
              if (data.won) {
                gameState.hasLost = false;
                gameState.lastTotalMultiplier = data.totalMultiplier;
                updateProfitDisplay(data.totalMultiplier);
                
                // Add new card to history with multiplier
                addCardToHistory(data.nextCard, gameState.currentSuit);
                // Update the multiplier box of the last added card
                const lastContainer = document.querySelector('.history-card-container:last-child');
                if (lastContainer) {
                  const multiplierBox = lastContainer.querySelector('.multiplier-box');
                  if (multiplierBox) {
                    multiplierBox.textContent = data.totalMultiplier.toFixed(2) + 'x';
                  }
                }
                // Re-enable bet buttons for next bet
                gameState.betButtonsEnabled = true;
                drawGame();
              } else {
                // Set losing state before adding card to history
                gameState.hasLost = true;
                // Add losing card to history before handling loss
                addCardToHistory(data.nextCard, gameState.currentSuit);
                // Update the multiplier box of the last added card to show 0.00x
                const lastContainer = document.querySelector('.history-card-container:last-child');
                if (lastContainer) {
                  const multiplierBox = lastContainer.querySelector('.multiplier-box');
                  if (multiplierBox) {
                    multiplierBox.className = 'multiplier-box lose';
                    multiplierBox.textContent = '0.00x';
                  }
                  // Update the arrow to be red for loss
                  const arrow = lastContainer.previousElementSibling;
                  if (arrow && arrow.classList.contains('arrow-indicator')) {
                    arrow.className = 'arrow-indicator lose';
                  }
                }
                handleGameLoss();
              }
            });
          }, 200);
        });
        
      } catch (error) {
        console.error('Error making guess:', error);
        alert(error.message || 'Failed to make guess');
        // Re-enable bet buttons in case of error
        gameState.betButtonsEnabled = true;
        drawGame();
      }
      break;
    }
  }
});

// Update skip button functionality
document.getElementById('skipBtn').addEventListener('click', () => {
  winMessageDiv.classList.remove('visible'); // Clear win message
  
  // Reset losing state
  gameState.hasLost = false;
  
  // Reset total multiplier if not in active game
  if (!gameState.isPlaying) {
    updateProfitDisplay(1);
  }
  
  // Disable the skip button during animation
  document.getElementById('skipBtn').disabled = true;
  
  // Store the new card values
  const newCard = Math.floor(Math.random() * 13) + 1;
  const newSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
  
  // First animate the current card sliding up
  animateCardSlideUp(gameState.currentCard, () => {
    setTimeout(() => {
      const flippingCard = {
        card: newCard,
        flipProgress: 0,
        complete: false
      };
      
      gameState.flippingCards = [flippingCard];
      gameState.currentCard = newCard;
      gameState.currentSuit = newSuit;
      
      animateCardFlip(flippingCard, () => {
        // Add new card to history with skipped flag if game is in progress
        addCardToHistory(newCard, newSuit, gameState.isPlaying);
        document.getElementById('skipBtn').disabled = false;
      });
    }, 200);
  });
});

// Update play button functionality
document.getElementById('playBtn').addEventListener('click', async () => {
  if (gameState.isPlaying) return;
  
  // Prevent double-clicking
  const playBtn = document.getElementById('playBtn');
  if (playBtn.disabled) return;
  playBtn.disabled = true;
  
  winMessageDiv.classList.remove('visible'); // Clear win message
  
  // Reset losing state
  gameState.hasLost = false;
  
  const betAmount = parseFloat(document.getElementById('betAmount').value);
  const currency = document.getElementById('currency').value;
  const limits = BET_LIMITS[currency];
  
  if (isNaN(betAmount) || betAmount < limits.min || betAmount > limits.max) {
    alert(`Please enter a valid bet amount (${formatCurrencyAmount(limits.min, currency)} - ${formatCurrencyAmount(limits.max, currency)})`);
    playBtn.disabled = false;
    return;
  }
  
  try {
    const response = await fetch('/games/hilo/create', {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start game');
    }
    
    const data = await response.json();
    
    // Update balances in navbar
    await fetchBalances();
    
    // Animate existing cards sliding out
    const historyContainer = document.getElementById('cardHistory');
    const existingCards = historyContainer.children;
    Array.from(existingCards).forEach(card => {
      card.classList.add('slide-out');
    });
    
    // Clear container and add current base card after animation
    setTimeout(() => {
      historyContainer.innerHTML = '';
      gameState.cardHistory = [];
      gameState.lastTotalMultiplier = null;
      updateProfitDisplay(1); // Reset profit display
      
      // Add current base card to history
      addCardToHistory(gameState.currentCard, gameState.currentSuit);
      
      // Update game state
      gameState.isPlaying = true;
      gameState.betButtonsEnabled = true; // Ensure bet buttons are enabled for new game
      
      // Update UI
      document.getElementById('betAmount').disabled = true;
      document.getElementById('currency').disabled = true;
      document.getElementById('playBtn').style.display = 'none';
      
      // Show cashout button but initially disabled until first bet
      const cashoutBtn = document.getElementById('cashoutBtn');
      cashoutBtn.style.display = 'block';
      cashoutBtn.disabled = true;
      cashoutBtn.style.opacity = '0.5';
      
      // Update balance display with new navbar structure
      const selectedBalance = document.getElementById('selected-balance');
      if (selectedBalance) {
        selectedBalance.textContent = `${formatCurrencyAmount(data.balance, currency)}`;
      }
      
      drawGame();
      playBtn.disabled = false;
    }, 200);
    
  } catch (error) {
    console.error('Error starting game:', error);
    alert(error.message || 'Failed to start game');
    playBtn.disabled = false;
  }
});

// Cashout button functionality
document.getElementById('cashoutBtn').addEventListener('click', async () => {
  if (!gameState.isPlaying) return;
  
  // Prevent double-clicking
  const cashoutBtn = document.getElementById('cashoutBtn');
  if (cashoutBtn.disabled) return;
  cashoutBtn.disabled = true;
  
  try {
    // Call the backend API to cashout
    const response = await fetch('/games/hilo/cashout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cashout');
    }
    
    const data = await response.json();
    
    // Update balances in navbar
    await fetchBalances();
    
    // Update game state
    gameState.isPlaying = false;
    
    // Re-enable controls
    document.getElementById('betAmount').disabled = false;
    document.getElementById('currency').disabled = false;
    document.getElementById('playBtn').style.display = 'block';
    document.getElementById('cashoutBtn').style.display = 'none';
    
    // Update balance display with cashout amount
    const currency = document.getElementById('currency').value;
    // Update balance display with new navbar structure
    const selectedBalance = document.getElementById('selected-balance');
    if (selectedBalance) {
      selectedBalance.textContent = `${formatCurrencyAmount(data.balance, currency)}`;
    }
    
    // Show win message
    showWinMessage(data.totalMultiplier, data.winAmount, document.getElementById('currency').value);
    
    // Redraw to update button states
    drawGame();
    
  } catch (error) {
    console.error('Error cashing out:', error);
    alert(error.message || 'Failed to cashout');
    cashoutBtn.disabled = false;
  }
});

// Handle losing game
function handleGameLoss() {
  gameState.hasLost = true;
  gameState.isPlaying = false;
  gameState.betButtonsEnabled = true; // Reset bet buttons state after loss
  updateProfitDisplay(0);
  
  // Redraw to show the losing card with red border
  drawGame();
  
  // Re-enable controls after a delay
  setTimeout(() => {
    document.getElementById('betAmount').disabled = false;
    document.getElementById('currency').disabled = false;
    document.getElementById('playBtn').style.display = 'block';
    document.getElementById('cashoutBtn').style.display = 'none';
  }, 500);
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
    // as it's handled by navbar.js, but we'll call fetchBalances to ensure it's updated
    await fetchBalances();

    // Store session data globally for other scripts to access
    window.sessionData = data;
    
    return data;
  } catch (err) {
    console.error('getSession error:', err);
    window.location.href = '/login.html';
    return null;
  }
}

// Initialize game
function init() {
  getSession().then(data => {
    if (data) {
      // Wait a bit for navbar.js to initialize
      setTimeout(() => {
        // Make sure currency dropdown is synced with navbar
        syncCurrencySelections();
      }, 100);
    }
  });
  
  // Add listener to redraw when card back image loads
  if (!cardBackImage.complete) {
    cardBackImage.onload = drawGame;
  }
  // Add initial card to history
  addCardToHistory(gameState.currentCard, gameState.currentSuit);
  updateProfitDisplay(1); // Initialize profit display with 1x multiplier
  drawGame();
}

// Start the game when page loads
init();

// Function to add card to history
function addCardToHistory(card, suit, isSkipped = false) {
  const historyContainer = document.getElementById('cardHistory');
  
  // If game hasn't started, clear history and add new card
  if (!gameState.isPlaying) {
    // Animate existing cards sliding out
    const existingCards = historyContainer.children;
    Array.from(existingCards).forEach(card => {
      card.classList.add('slide-out');
    });
    
    // Clear container after animation
    setTimeout(() => {
      historyContainer.innerHTML = '';
      gameState.cardHistory = [];
      
      // Add the new card
      createAndAddCard();
    }, 200);
  } else {
    createAndAddCard();
  }
  
  function createAndAddCard() {
    // If this isn't the first card, add an arrow indicator
    if (historyContainer.children.length > 0) {
        const arrowIndicator = document.createElement('div');
        arrowIndicator.className = 'arrow-indicator';
        if (isSkipped) {
            arrowIndicator.className += ' skip';
        } else if (gameState.hasLost) {
            arrowIndicator.className += ' lose';
        } else {
            arrowIndicator.className += ' win';
        }
        
        // Add arrow SVG
        arrowIndicator.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        `;
        
        historyContainer.appendChild(arrowIndicator);
    }

    // Create new card element
    const cardElement = document.createElement('div');
    cardElement.className = `history-card slide-in ${SUIT_COLORS[suit] === '#e74c3c' ? 'red-suit' : 'black-suit'}`;
    if (isSkipped) {
        cardElement.classList.add('skipped');
    }
    
    // Add card value
    const valueElement = document.createElement('div');
    valueElement.className = 'card-value';
    valueElement.textContent = CARD_NAMES[card];
    cardElement.appendChild(valueElement);
    
    // Add suit symbol
    const suitElement = document.createElement('div');
    suitElement.className = 'card-suit';
    suitElement.textContent = SUIT_SYMBOLS[suit];
    cardElement.appendChild(suitElement);

    // Create container for card and its multiplier
    const cardContainer = document.createElement('div');
    cardContainer.className = 'history-card-container';
    cardContainer.appendChild(cardElement);

    // Add multiplier box
    const multiplierBox = document.createElement('div');
    // Check if this is the first card in history
    if (historyContainer.children.length === 0) {
      // First card always shows "start card"
      multiplierBox.className = 'multiplier-box start';
      multiplierBox.textContent = 'start card';
    } else if (isSkipped) {
      // Skipped card during game
      multiplierBox.className = 'multiplier-box';
      multiplierBox.textContent = (gameState.lastTotalMultiplier || 1).toFixed(2) + 'x';
    } else if (gameState.hasLost) {
      // Losing bet
      multiplierBox.className = 'multiplier-box lose';
      multiplierBox.textContent = '0.00x';
    } else {
      // Winning bet - use multiplier from backend response
      multiplierBox.className = 'multiplier-box';
      // We'll update this with actual multiplier from backend
      multiplierBox.textContent = '1.00x'; // Default value
    }
    cardContainer.appendChild(multiplierBox);
    
    // Add to history array and DOM
    gameState.cardHistory.push({ card, suit, isSkipped });
    historyContainer.appendChild(cardContainer);
    
    // Remove slide-in class after animation completes
    setTimeout(() => {
      cardElement.classList.remove('slide-in');
    }, 300);
    
    // Scroll to the newest card
    historyContainer.scrollLeft = historyContainer.scrollWidth;
  }
}

// Update the updateProfitDisplay function to handle currency-specific formatting
function updateProfitDisplay(totalMultiplier) {
  const profitContainer = document.querySelector('.profit-container');
  const betAmount = parseFloat(document.getElementById('betAmount').value) || 0;
  const currency = document.getElementById('currency').value;
  const winAmount = betAmount * (totalMultiplier || 1);
  
  // Use currency-specific default amounts
  const defaultAmount = currency === 'USD' ? 1.00 : 10000;
  
  profitContainer.innerHTML = `
    <div class="profit-title">Total Profit (${(totalMultiplier || 1).toFixed(2)}x)</div>
    <div class="profit-amount">${formatCurrencyAmount(winAmount || defaultAmount, currency)}</div>
  `;
}

// Add currency change handler
document.getElementById('currency').addEventListener('change', function() {
  const currency = this.value;
  const betInput = document.getElementById('betAmount');
  
  // Update placeholder and value based on currency
  if (currency === 'USD') {
    betInput.value = '1.00';
    betInput.placeholder = 'Min: $0.10 - Max: $1,000';
    betInput.step = '0.10';
  } else {
    betInput.value = '10000';
    betInput.placeholder = 'Min: £10,000 - Max: £100,000,000';
    betInput.step = '10000';
  }
  
  // Reset total multiplier and game state
  gameState.lastTotalMultiplier = null;
  updateProfitDisplay(1); // Reset to 1x multiplier
  
  // Clear win message if visible
  winMessageDiv.classList.remove('visible');
  
  // Update navbar dropdown selection
  const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
  if (matchingItem) {
    // Simulate a click on the dropdown item to update the navbar
    matchingItem.click();
  }
});

document.getElementById('betAmount').addEventListener('blur', function() {
  const currency = document.getElementById('currency').value;
  const limits = BET_LIMITS[currency];
  let value = parseFloat(this.value);
  if (isNaN(value)) {
    value = limits.min;
  } else if (value < limits.min) {
    value = limits.min;
  } else if (value > limits.max) {
    value = limits.max;
  }
  this.value = currency === 'USD' ? value.toFixed(2) : value.toString();
  updateProfitDisplay(1); // Update profit display with clamped value
});

// Add win message container to game container after canvas
const gameContainer = document.querySelector('.game-container');
const winMessageDiv = document.createElement('div');
winMessageDiv.className = 'win-message';
winMessageDiv.innerHTML = `
  <div class="multiplier">1.00x</div>
  <div class="amount">$0.00</div>
`;
gameContainer.appendChild(winMessageDiv);

// Function to show win message
function showWinMessage(multiplier, amount, currency) {
  winMessageDiv.querySelector('.multiplier').textContent = multiplier.toFixed(2) + 'x';
  winMessageDiv.querySelector('.amount').textContent = formatCurrencyAmount(amount, currency);
  winMessageDiv.classList.add('visible');
}