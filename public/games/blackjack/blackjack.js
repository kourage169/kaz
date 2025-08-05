/**
 * Blackjack Game with Backend Integration
 * 
 * This game implements a client-server architecture for blackjack:
 * 
 * Backend Features:
 * - Deck creation and shuffling
 * - Initial card dealing
 * - Hit action (drawing additional cards)
 * - Stand action (dealer's turn)
 * - Double down action
 * - Bet management and balance updates
 * - Game outcome determination and payout calculation
 * 
 * Frontend Features:
 * - Canvas-based rendering
 * - Card animations (dealing, flipping, etc.)
 * - User interface for game actions
 * - Balance display and updates
 * 
 * Security Features:
 * - Server-side deck management prevents cheating
 * - Server-side game logic ensures fair play
 * - Hidden dealer card is only revealed when appropriate
 * - Balance updates are handled securely on the server
 */

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
  
// Add bet limits at the top with other constants
const BET_LIMITS = {
    USD: { min: 0.10, max: 1000 },
    LBP: { min: 10000, max: 100000000 }
};
  

// Card definitions
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
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

// Card corner radius - adjust this value to change roundness of card corners
// Recommended values:
// - 0: Sharp corners (square cards)
// - 5: Slightly rounded corners
// - 10: Medium rounded corners (default)
// - 15: More rounded corners
// - 20: Very rounded corners
const CARD_CORNER_RADIUS = 4;

// Card back image
const cardBackImage = new Image();
cardBackImage.src = '/games/blackjack/card_back.png';

// Logo image
const logoImage = new Image();
logoImage.src = '/games/blackjack/background_logo.png';

// Get canvas and context
const canvas = document.getElementById('blackjack-canvas');
const ctx = canvas.getContext('2d');

// Get game buttons
const playBtn = document.getElementById('playBtn');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const splitBtn = document.getElementById('splitBtn');
const doubleBtn = document.getElementById('doubleBtn');

// Game state
const gameState = {
    isPlaying: false,
    betAmount: 1.0,
    currency: 'USD',
    canSplit: false,
    canDouble: false,
    deck: [],
    playerHand: [],
    dealerHand: [],
    animatingCards: [],
    flippingCards: [], // Track cards that are being flipped
    dealerCardRevealed: false, // Track if dealer's second card has been revealed
    // Position offset for hand value displays (adjust these to change position)
    dealerValueOffset: 60,
    playerValueOffset: 60,
    // Card dimension multipliers (adjust these to change card size)
    cardWidthMultiplier: 0.16, // For player and dealer hands
    cardHeightRatio: 1.5,     // Height = width * this ratio
    deckCardWidthMultiplier: 0.14, // For the deck in the corner
    cardSpacingRatio: 0.5,     // Space between cards as ratio of card width
    cardVerticalOffsetRatio: 0.15,  // Vertical offset for each card as ratio of card height
    // Track adjusted Y positions for dealer and player hands
    adjustedDealerY: null,
    adjustedPlayerY: null,
    gameResult: null, // 'win', 'lose', 'draw' - used for highlighting cards
    gameId: null, // Added for game ID tracking
    initialAnimationInProgress: false, // Flag to track if initial animation is in progress
    visiblePlayerCards: [], // Array to track which player cards are visible
    visibleDealerCards: [],  // Array to track which dealer cards are visible
    playerValue: null,
    dealerFirstCardValue: null,
    showResult: false, // Flag to control when to show the result (borders)
    playerHands: [],
    currentHandIndex: 0,
    isSplit: false,
    splitResults: null, // Added for split mode results
    splitPayouts: null, // Added for split mode payouts
    splitDoubled: [], // Track if each split hand has doubled
};

// Set canvas dimensions based on its displayed size
function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas size doesn't match display size
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    
    renderCanvas();
}

// Draw the initial canvas state
function renderCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#0f212d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the logo in the background
    drawLogoBackground();
    
    // Always show the deck in the top right corner
    drawDeck();
    
    // If game is in progress or we have cards to show, draw the game state
    if (gameState.isPlaying || gameState.playerHand.length > 0 || gameState.dealerHand.length > 0) {
        drawGameState();
    }
}

// Draw the logo as a background
function drawLogoBackground() {
    // Only draw if the image is loaded
    if (logoImage && logoImage.complete) {
        try {
            // Get the logo dimensions (keeping aspect ratio)
            const maxWidth = canvas.width * 0.4;  // 40% of canvas width
            const maxHeight = canvas.height * 0.4; // 40% of canvas height
            
            // Calculate dimensions keeping aspect ratio
            const imgAspect = logoImage.width / logoImage.height;
            let drawWidth, drawHeight;
            
            if (imgAspect > 1) {
                // Image is wider than tall
                drawWidth = maxWidth;
                drawHeight = drawWidth / imgAspect;
            } else {
                // Image is taller than wide
                drawHeight = maxHeight;
                drawWidth = drawHeight * imgAspect;
            }
            
            // Position in center
            const drawX = (canvas.width - drawWidth) / 2;
            const drawY = (canvas.height - drawHeight) / 2;
            
            // Draw the logo
            ctx.drawImage(logoImage, drawX, drawY, drawWidth, drawHeight);
        } catch (e) {
            console.error('Error drawing logo on canvas:', e);
        }
    }
}


// Draw the current game state
function drawGameState() {
    // Draw the deck in the top right corner
    drawDeck();
    
    // Debug log to check hands
    console.log('Dealer hand:', gameState.dealerHand);
    console.log('Player hand:', gameState.playerHand);
    console.log('Visible dealer cards:', gameState.visibleDealerCards);
    console.log('Visible player cards:', gameState.visiblePlayerCards);
    
    if (gameState.isSplit) {
        console.log('Split mode active. Current hand:', gameState.currentHandIndex);
        console.log('Player hands:', gameState.playerHands);
    }
    
    // Calculate base positions for hands
    const dealerBaseY = canvas.height * 0.25;
    const playerBaseY = canvas.height * 0.75;
    
    // Draw dealer's cards
    const adjustedDealerY = drawHand(gameState.dealerHand, canvas.width / 2, dealerBaseY, true);
    
    // In split mode, draw both hands
    if (gameState.isSplit && gameState.playerHands && gameState.playerHands.length > 0) {
        // Draw first hand (left side)
        const handSpacing = Math.min(canvas.width, canvas.height) * 0.45; // Increased space between split hands
        const hand1X = canvas.width / 2 - handSpacing / 2;
        const hand1Y = playerBaseY;
        
        // Draw second hand (right side)
        const hand2X = canvas.width / 2 + handSpacing / 2;
        const hand2Y = playerBaseY;
        
        // Draw both hands
        let adjustedHand1Y, adjustedHand2Y;
        if (gameState.playerHands[0]) {
            // Draw hand 1 and highlight active hand
            const isActiveHand = gameState.currentHandIndex === 0;
            adjustedHand1Y = drawHand(gameState.playerHands[0], hand1X, hand1Y, false, isActiveHand);
            
            // Display hand value
            const hand1Value = calculateProgressiveHandValue(gameState.playerHands[0]);
            displayHandValue(hand1Value, hand1X, adjustedHand1Y - gameState.playerValueOffset, true, 0);
        }
        
        if (gameState.playerHands.length > 1 && gameState.playerHands[1]) {
            // Draw hand 2 and highlight active hand
            const isActiveHand = gameState.currentHandIndex === 1;
            adjustedHand2Y = drawHand(gameState.playerHands[1], hand2X, hand2Y, false, isActiveHand);
            
            // Display hand value
            const hand2Value = calculateProgressiveHandValue(gameState.playerHands[1]);
            displayHandValue(hand2Value, hand2X, adjustedHand2Y - gameState.playerValueOffset, true, 1);
        }
        
        // Store the adjusted positions for other functions to use
        gameState.adjustedPlayerY = playerBaseY; // In split mode, use the base Y for animations
    } else {
        // Regular mode (single hand)
        // Draw player's cards
        const adjustedPlayerY = drawHand(gameState.playerHand, canvas.width / 2, playerBaseY, false);
        
        // Store the adjusted positions for other functions to use
        gameState.adjustedDealerY = adjustedDealerY || dealerBaseY;
        gameState.adjustedPlayerY = adjustedPlayerY || playerBaseY;
        
        // Calculate progressive hand values based on visible cards
        let playerValue = 0;
        let dealerValue = 0;
        
        // For player hand: only count cards that are visible
        if (gameState.playerHand.length > 0 && gameState.visiblePlayerCards.length > 0) {
            // Get only the visible cards
            const visiblePlayerCards = gameState.playerHand.filter((_, index) => 
                gameState.visiblePlayerCards.includes(index));
            
            // Calculate value of visible cards
            playerValue = calculateProgressiveHandValue(visiblePlayerCards);
        }
        
        // For dealer hand: only count visible cards (usually just the first card until reveal)
        if (gameState.dealerHand.length > 0 && gameState.visibleDealerCards.length > 0) {
            // If dealer's card is revealed, show full value of visible cards
            if (gameState.dealerCardRevealed) {
                const visibleDealerCards = gameState.dealerHand.filter((_, index) => 
                    gameState.visibleDealerCards.includes(index));
                dealerValue = calculateProgressiveHandValue(visibleDealerCards);
            } else {
                // Otherwise just show the value of the first card
                if (gameState.visibleDealerCards.includes(0)) {
                    dealerValue = getCardValue(gameState.dealerHand[0]);
                }
            }
        }
        
        // Always display values
        if (playerValue > 0 || gameState.playerHand.length > 0) {
            displayHandValue(playerValue, canvas.width / 2, adjustedPlayerY - gameState.playerValueOffset, true);
        }
    }
    
    // Always display dealer value
    let dealerValue = 0;
    // For dealer hand: only count visible cards (usually just the first card until reveal)
    if (gameState.dealerHand.length > 0 && gameState.visibleDealerCards.length > 0) {
        // If dealer's card is revealed, show full value of visible cards
        if (gameState.dealerCardRevealed) {
            const visibleDealerCards = gameState.dealerHand.filter((_, index) => 
                gameState.visibleDealerCards.includes(index));
            dealerValue = calculateProgressiveHandValue(visibleDealerCards);
        } else {
            // Otherwise just show the value of the first card
            if (gameState.visibleDealerCards.includes(0)) {
                dealerValue = getCardValue(gameState.dealerHand[0]);
            }
        }
    }
    
    if (dealerValue > 0 || gameState.dealerHand.length > 0) {
        displayHandValue(dealerValue, canvas.width / 2, adjustedDealerY - gameState.dealerValueOffset, false);
    }
    
    // Draw any cards that are currently being animated
    if (gameState.animatingCards && gameState.animatingCards.length > 0) {
        console.log('Animating cards:', gameState.animatingCards);
        
        gameState.animatingCards.forEach(animCard => {
            // Only draw face up if this is a split original card
            const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
            const cardHeight = cardWidth * gameState.cardHeightRatio;
            if (animCard.splitOriginal) {
                renderCard(animCard.card, animCard.currentX, animCard.currentY, cardWidth, cardHeight, true);
            } else {
                drawCardBack(animCard.currentX, animCard.currentY, cardWidth, cardHeight);
            }
        });
    }
}

// Calculate progressive hand value based on visible cards
function calculateProgressiveHandValue(hand) {
    if (!hand || hand.length === 0) {
        return 0;
    }
    
    let value = 0;
    let aces = 0;
    
    // Sum up all non-ace cards
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    
    // Add aces (1 or 11 each)
    for (let i = 0; i < aces; i++) {
        if (value + 11 <= 21) {
            value += 11;
        } else {
            value += 1;
        }
    }
    
    return value;
}

// Draw the deck in the top right corner
function drawDeck() {
    // Calculate card dimensions based on canvas size and gameState multipliers
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    
    // Position in top right with some padding
    const x = canvas.width - cardWidth - 20;
    const y = 20 + cardHeight / 2;
    
    // Draw a few stacked cards to represent the deck
    for (let i = 2; i >= 0; i--) {
        // White border for cards
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 0.5;
        
        // Draw slightly offset cards
        roundRect(ctx, x - i * 2, y - cardHeight / 2 - i * 2, cardWidth, cardHeight, CARD_CORNER_RADIUS, true, true);
        
        // For the top card, draw the card back image
        if (i === 0 && cardBackImage.complete) {
            try {
                // Calculate dimensions to maintain aspect ratio but fit within card
                const imgAspect = cardBackImage.width / cardBackImage.height;
                const cardAspect = cardWidth / cardHeight;
                
                let drawWidth, drawHeight;
                if (imgAspect > cardAspect) {
                    // Image is wider than card, scale to width
                    drawWidth = cardWidth - 4; // Leave a small border
                    drawHeight = drawWidth / imgAspect;
                } else {
                    // Image is taller than card, scale to height
                    drawHeight = cardHeight - 4; // Leave a small border
                    drawWidth = drawHeight * imgAspect;
                }
                
                // Center the image within the card
                const drawX = x + (cardWidth - drawWidth) / 2;
                const drawY = y - cardHeight / 2 + (cardHeight - drawHeight) / 2;
                
                ctx.drawImage(cardBackImage, drawX, drawY, drawWidth, drawHeight);
            } catch (e) {
                console.error('Error drawing card back image in deck:', e);
                // Fallback to a simple blue background if image fails
                ctx.fillStyle = '#1e3a8a';
                roundRect(ctx, x + 2, y - cardHeight / 2 + 2, cardWidth - 4, cardHeight - 4, CARD_CORNER_RADIUS - 1, true, false);
            }
        } else if (i === 0) {
            // Fallback if image not loaded
            ctx.fillStyle = '#1e3a8a';
            roundRect(ctx, x + 2, y - cardHeight / 2 + 2, cardWidth - 4, cardHeight - 4, CARD_CORNER_RADIUS - 1, true, false);
        }
    }
}

// Draw a hand of cards
function drawHand(hand, centerX, centerY, isDealer, isActiveHand = false) {
    if (hand.length === 0) return centerY;
    
    // Calculate card dimensions based on canvas size and gameState multipliers
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const cardSpacing = cardWidth * gameState.cardSpacingRatio;
    const verticalOffset = cardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate the total width of the hand
    const totalWidth = (hand.length - 1) * cardSpacing + cardWidth;
    
    // Calculate the starting X position to center the hand
    const startX = centerX - totalWidth / 2;
    
    // Adjust centerY for player hand if it might go off the bottom of the canvas
    let adjustedCenterY = centerY;
    if (!isDealer && hand.length > 3) {
        // Calculate how far the bottom card would extend
        const bottomCardY = centerY + ((hand.length - 1) * verticalOffset) + cardHeight / 2;
        
        // If the bottom card would go off the canvas, adjust upward
        if (bottomCardY > canvas.height - 20) { // 20px margin from bottom
            const overflow = bottomCardY - (canvas.height - 20);
            adjustedCenterY = centerY - overflow;
        }
    }
    
    // Debug which hand we're drawing
    console.log(`Drawing ${isDealer ? 'dealer' : 'player'} hand at centerX: ${centerX}, startX: ${startX}`);
    console.log(`Hand dimensions - count: ${hand.length}, totalWidth: ${totalWidth}, startX: ${startX}, adjustedY: ${adjustedCenterY}`);
    
    // Get the visibility array for this hand
    const visibleCards = isDealer ? gameState.visibleDealerCards : gameState.visiblePlayerCards;
    
    // If this is an active split hand, draw a highlight indicator
    if (isActiveHand && gameState.isSplit) {
        // Draw an indicator to show which hand is active
        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'; // Semi-transparent green
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.7)'; // More opaque green for border
        ctx.lineWidth = 2;
        
        // Draw a rounded rectangle behind the entire hand
        const padding = cardWidth * 0.2; // Padding around the hand
        roundRect(
            ctx, 
            startX - padding, 
            adjustedCenterY - cardHeight / 2 - padding,
            totalWidth + padding * 2,
            cardHeight + (hand.length - 1) * verticalOffset + padding * 2,
            cardWidth * 0.1, // Corner radius
            true, // Fill
            true  // Stroke
        );
    }
    
    // Determine which split hand this is (if in split mode)
    let splitHandIndex;
    if (gameState.isSplit && !isDealer) {
        const handDivider = canvas.width / 2;
        splitHandIndex = centerX < handDivider ? 0 : 1;
        console.log(`Drawing split hand ${splitHandIndex} at centerX: ${centerX}`);
    }
    
    // Draw each card
    hand.forEach((card, index) => {
        // Find any flipping-card data for this hand/index
        let flippingCard = null;
        
        if (gameState.isSplit && !isDealer) {
            // In split mode, find flipping card for this specific split hand
            flippingCard = gameState.flippingCards.find(fc => 
                fc.handType === 'player' && 
                fc.cardIndex === index && 
                fc.splitHandIndex === splitHandIndex
            );
            
            console.log(`Looking for flipping card in split hand ${splitHandIndex} at index ${index}, found:`, flippingCard ? true : false);
        } else {
            // Regular search for dealer or non-split player hand
            flippingCard = gameState.flippingCards.find(fc => 
                fc.handType === (isDealer ? 'dealer' : 'player') && 
                fc.cardIndex === index
            );
        }
        
        // Skip drawing this index unless it's already marked visible OR is currently flipping
        if (!visibleCards.includes(index) && !flippingCard) {
            console.log(`Skipping card at index ${index} - not visible yet`);
            return;
        }
        
        // Compute x/y for this card
        const x = startX + index * cardSpacing;
        const y = adjustedCenterY + (index * verticalOffset);
        
        console.log(`Drawing card at index ${index} at position (${x}, ${y})`);
        
        if (flippingCard) {
            // Draw the card in its current flip state
            console.log(`Drawing flipping card at ${isDealer ? 'dealer' : 'player'} index ${index}`);
            drawFlippingCard(flippingCard, x, y, cardWidth, cardHeight, !isDealer);
            
        } else {
            // Check if this is a hidden card (dealer's second card or a placeholder)
            const isHiddenCard = card.hidden === true 
                || (isDealer && index === 1 && 
                    (!gameState.dealerCardRevealed && (gameState.isPlaying || gameState.gameResult === 'lose'))
                   );
            
            if (isHiddenCard) {
                console.log(`Drawing hidden card at ${isDealer ? 'dealer' : 'player'} index ${index}`);
                drawCardBack(x, y, cardWidth, cardHeight);
            } else {
                // All other cards should be visible face-up
                console.log(`Showing ${isDealer ? 'dealer' : 'player'} card at index ${index}:`, card);
                // Pass the split hand index to renderCard for proper result highlighting
                renderCard(card, x, y, cardWidth, cardHeight, !isDealer, splitHandIndex);
            }
        }
    });
    
    return adjustedCenterY; // Return the adjusted center Y position for other functions to use
}

// Draw a single card
function renderCard(card, x, y, width, height, isPlayerCard = false, splitHandIndex = undefined) {
    // Draw card background
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 0.5;
    
    // Draw rounded rectangle for card
    roundRect(ctx, x, y - height / 2, width, height, CARD_CORNER_RADIUS, true, true);
    
    // If game is over, highlight cards based on result
    if (!gameState.isPlaying && gameState.showResult) {
        // Only highlight player's cards
        if (isPlayerCard) {
            let borderColor;
            
            if (gameState.isSplit) {
                // In split mode, use the provided splitHandIndex parameter if available
                if (gameState.splitResults && splitHandIndex !== undefined) {
                    // Get result for this specific hand using the provided index
                    const handResult = gameState.splitResults[splitHandIndex];
                    
                    console.log(`Highlighting card at x=${x} as part of split hand ${splitHandIndex} with result ${handResult}`);
                    
                    switch (handResult) {
                        case 'blackjack':
                        case 'win':
                            borderColor = '#2ecc71'; // Green for win
                            break;
                        case 'lose':
                            borderColor = '#e74c3c'; // Red for loss
                            break;
                        case 'push':
                            borderColor = '#f39c12'; // Orange for draw
                            break;
                        default:
                            borderColor = '#000000'; // Default black
                    }
                } else {
                    // Fallback to position-based detection if splitHandIndex not provided
                    const handDivider = canvas.width / 2;
                    const handIndex = x < handDivider ? 0 : 1;
                    
                    // Get result for this specific hand
                    const handResult = gameState.splitResults ? gameState.splitResults[handIndex] : null;
                    
                    console.log(`Fallback: Highlighting card at x=${x} as part of hand ${handIndex} with result ${handResult}`);
                    
                    switch (handResult) {
                        case 'blackjack':
                        case 'win':
                            borderColor = '#2ecc71'; // Green for win
                            break;
                        case 'lose':
                            borderColor = '#e74c3c'; // Red for loss
                            break;
                        case 'push':
                            borderColor = '#f39c12'; // Orange for draw
                            break;
                        default:
                            borderColor = '#000000'; // Default black
                    }
                }
            } else {
                // Regular (non-split) game result
                switch (gameState.gameResult) {
                    case 'blackjack':
                    case 'win':
                        borderColor = '#2ecc71'; // Green for win
                        break;
                    case 'lose':
                        borderColor = '#e74c3c'; // Red for loss
                        break;
                    case 'push':
                    case 'draw':
                        borderColor = '#f39c12'; // Orange for draw
                        break;
                    default:
                        borderColor = '#000000'; // Default black
                }
            }
            
            // Draw colored border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            roundRect(ctx, x, y - height / 2, width, height, CARD_CORNER_RADIUS, false, true);
            
            // Reset stroke style for other drawings
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
        }
    }
    
    // Only draw card content if width is significant (during flip animation)
    if (width > 5) {
        // Draw card value and suit
        const suitSymbol = SUIT_SYMBOLS[card.suit];
        const color = SUIT_COLORS[card.suit];
        
        ctx.fillStyle = color;
        
        // Draw value (using current font size settings)
        const fontSize = width * 0.5;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const padding = width * 0.1;
        ctx.fillText(card.value, x + padding, y - height / 2 + padding);
        
        // Draw suit symbol with larger size
        const suitFontSize = fontSize * 1.5; // Make suit 50% larger than card value
        ctx.font = `bold ${suitFontSize}px Arial`;
        ctx.fillText(suitSymbol, x + padding, y - height + 65 / 2 + padding + fontSize * 1.1);
    }
}

// Draw a card back
function drawCardBack(x, y, width, height) {
    // Draw card background (white border)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 0.5;
    
    // Draw rounded rectangle for card
    roundRect(ctx, x, y - height / 2, width, height, CARD_CORNER_RADIUS, true, true);
    
    // Draw the card back image
    if (cardBackImage.complete) {
        // If image is loaded, draw it (centered and scaled to fit the card dimensions)
        try {
            // Calculate dimensions to maintain aspect ratio but fit within card
            const imgAspect = cardBackImage.width / cardBackImage.height;
            const cardAspect = width / height;
            
            let drawWidth, drawHeight;
            if (imgAspect > cardAspect) {
                // Image is wider than card, scale to width
                drawWidth = width - 4; // Leave a small border
                drawHeight = drawWidth / imgAspect;
            } else {
                // Image is taller than card, scale to height
                drawHeight = height - 4; // Leave a small border
                drawWidth = drawHeight * imgAspect;
            }
            
            // Center the image within the card
            const drawX = x + (width - drawWidth) / 2;
            const drawY = y - height / 2 + (height - drawHeight) / 2;
            
            ctx.drawImage(cardBackImage, drawX, drawY, drawWidth, drawHeight);
        } catch (e) {
            console.error('Error drawing card back image:', e);
            // Fallback to a simple blue background if image fails
            ctx.fillStyle = '#1e3a8a';
            roundRect(ctx, x + 2, y - height / 2 + 2, width - 4, height - 4, CARD_CORNER_RADIUS - 1, true, false);
        }
    } else {
        // If image is not loaded yet, draw a simple blue background as fallback
        ctx.fillStyle = '#1e3a8a';
        roundRect(ctx, x + 2, y - height / 2 + 2, width - 4, height - 4, CARD_CORNER_RADIUS - 1, true, false);
        
        // Add listener to redraw when image loads
        if (!cardBackImage.onload) {
            cardBackImage.onload = function() {
                renderCanvas();
            };
        }
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

// Initialize controls
function initControls() {
    const betAmountInput = document.getElementById('bet-amount');
    const currencySelect = document.getElementById('currency');
    
    // Update game state when bet amount changes
    betAmountInput.addEventListener('change', () => {
        gameState.betAmount = parseFloat(betAmountInput.value);
        console.log('Bet amount set to:', gameState.betAmount);
    });
    
    // Update game state when currency changes
    currencySelect.addEventListener('change', () => {
        gameState.currency = currencySelect.value;
        console.log('Currency set to:', gameState.currency);
    });
    
    // Start game when play button is clicked
    playBtn.addEventListener('click', () => {
        if (!gameState.isPlaying) {
            startGame();
        }
    });
    
    // Game action buttons
    hitBtn.addEventListener('click', () => {
        if (gameState.isPlaying) {
            handleHit();
        }
    });
    
    standBtn.addEventListener('click', () => {
        if (gameState.isPlaying) {
            handleStand();
        }
    });
    
    splitBtn.addEventListener('click', () => {
        if (gameState.isPlaying && gameState.canSplit) {
            handleSplit();
        }
    });
    
    doubleBtn.addEventListener('click', () => {
        if (gameState.isPlaying && gameState.canDouble) {
            handleDouble();
        }
    });
}

// Start a new game
function startGame() {
    // Get the bet amount and currency from the UI
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    const currency = document.getElementById('currency').value;
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
        showNotification('Please enter a valid bet amount.');
        return;
    }
    
    console.log('Starting game with bet:', betAmount, currency);
    
    gameState.isPlaying = true;
    gameState.betAmount = betAmount;
    gameState.currency = currency;
    
    // Reset hands
    gameState.playerHand = [];
    gameState.dealerHand = [];
    
    // Reset split-related state
    gameState.isSplit = false;
    gameState.playerHands = [];
    gameState.currentHandIndex = 0;
    gameState.splitResults = null;
    gameState.splitPayouts = null;
    gameState.splitDoubled = [];
    
    // Reset dealer card revealed flag
    gameState.dealerCardRevealed = false;
    
    // Reset game result
    gameState.gameResult = null;
    
    // Reset adjusted positions
    gameState.adjustedDealerY = null;
    gameState.adjustedPlayerY = null;
    
    // Disable all buttons during the dealing animation
    disableGameButtons();
    playBtn.disabled = true;
    playBtn.style.opacity = '0.5';
    
    // Reset any previous game state
    gameState.flippingCards = [];
    gameState.animatingCards = [];
    
    // Reset visibility arrays
    gameState.visiblePlayerCards = [];
    gameState.visibleDealerCards = [];
    
    // Instead of creating a deck locally, fetch the game state from the server
    fetch('/games/blackjack/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            betAmount: betAmount,
            currency: currency
        })
    })
    .then(response => {
        if (!response.ok) {
            // Check if it's a 400 error (client error, likely insufficient funds)
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Insufficient funds');
                });
            }
            throw new Error('Failed to start game');
        }
        return response.json();
    })
    .then(data => {
        console.log('Game started with server data:', data);
        
        // Store the game ID
        gameState.gameId = data.gameId;
        
        // Update hands with server data
        gameState.playerHand = data.playerHand;
        gameState.dealerHand = data.dealerHand;
        
        // Store the hand values from the server
        gameState.playerValue = data.playerValue;
        // For the first dealer card, we can use a simple value lookup since we only need to know the value of one card
        gameState.dealerFirstCardValue = getCardValue(data.dealerHand[0]);
        
        // Update bet amount and currency (in case server formatted them)
        gameState.betAmount = data.betAmount;
        gameState.currency = data.currency;
        
        // Update UI with new balance
        updateBalanceDisplay(data.newBalance, data.currency);
        
        // Now animate the dealing of cards
        animateInitialDeal();
    })
    .catch(error => {
        console.error('Error starting game:', error);
        // Reset game state
        gameState.isPlaying = false;
        
        // Re-enable play button if there was an error
        playBtn.disabled = false;
        playBtn.style.opacity = '1';
        
        // Show error notification
        showNotification(error.message || 'Insufficient funds');
    });
}

// Update balance display in the UI
function updateBalanceDisplay(balance, currency) {
    // Update the dropdown items in the navbar
    const usdDropdownItem = document.querySelector('.dropdown-item[data-currency="USD"]');
    const lbpDropdownItem = document.querySelector('.dropdown-item[data-currency="LBP"]');

    // If you have both balances, you can pass them in as an object, but for now, update only the relevant one
    if (usdDropdownItem && currency === 'USD') {
        usdDropdownItem.innerHTML = `
            <span class="amount-label">${formatCurrencyAmount(balance, 'USD')}</span>
            <span class="currency-label">USD</span>
        `;
    }
    if (lbpDropdownItem && currency === 'LBP') {
        lbpDropdownItem.innerHTML = `
            <span class="amount-label">${formatCurrencyAmount(balance, 'LBP')}</span>
            <span class="currency-label">LBP</span>
        `;
    }

    // Also update the selected balance if it matches the current currency
    const selectedBalance = document.getElementById('selected-balance');
    if (selectedBalance) {
        if (currency === 'USD') {
            selectedBalance.textContent = formatCurrencyAmount(balance, 'USD');
        } else if (currency === 'LBP') {
            selectedBalance.textContent = formatCurrencyAmount(balance, 'LBP');
        }
    }
}

// Animate the initial dealing of cards that were received from the server
function animateInitialDeal() {
    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f212d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the logo in the background
    drawLogoBackground();
    
    // Set the animation flag
    gameState.initialAnimationInProgress = true;
    
    // Clear visibility arrays
    gameState.visiblePlayerCards = [];
    gameState.visibleDealerCards = [];
    
    // Create a placeholder for the dealer's hidden card (we don't know its value yet)
    const hiddenCard = { hidden: true };
    
    // The dealer's hand from the server only has one card, so we add a placeholder for the second card
    if (gameState.dealerHand.length === 1) {
        console.log('Adding hidden card placeholder to dealer hand');
        gameState.dealerHand.push(hiddenCard);
    }
    
    console.log('Initial dealer hand:', gameState.dealerHand);
    console.log('Initial player hand:', gameState.playerHand);
    
    // Create a sequence for animation that matches the cards we received
    const dealSequence = [
        { recipient: 'player', card: gameState.playerHand[0], hidden: false, index: 0 },
        { recipient: 'dealer', card: gameState.dealerHand[0], hidden: false, index: 0 },
        { recipient: 'player', card: gameState.playerHand[1], hidden: false, index: 1 },
        { recipient: 'dealer', card: gameState.dealerHand[1], hidden: true, index: 1 }
    ];
    
    console.log('Animating deal sequence:', dealSequence);
    
    // Animate dealing the cards one by one
    animateDealSequence(dealSequence, 0);
}

// Animate dealing a sequence of cards one by one
function animateDealSequence(sequence, index) {
    if (index >= sequence.length) {
        // All cards dealt, continue with the game
        gameState.initialAnimationInProgress = false;
        finishDealing();
        return;
    }
    
    const step = sequence[index];
    const card = step.card;
    
    console.log(`Animating deal to ${step.recipient}:`, card, `Hidden: ${step.hidden}`);
    
    // Get deck position (source)
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const sourceX = canvas.width - cardWidth - 20;
    const sourceY = 20 + cardHeight / 2;
    
    // Calculate target position based on recipient and current hand state
    let targetHand, baseY;
    if (step.recipient === 'dealer') {
        // For dealer's hand, use the visible cards we've already dealt
        targetHand = gameState.dealerHand.slice(0, gameState.visibleDealerCards.length);
        baseY = canvas.height * 0.25;
    } else {
        // For player's hand, use the visible cards we've already dealt
        targetHand = gameState.playerHand.slice(0, gameState.visiblePlayerCards.length);
        baseY = canvas.height * 0.75;
    }
    
    // Calculate card dimensions and spacing
    const playerCardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const playerCardHeight = playerCardWidth * gameState.cardHeightRatio;
    const playerCardSpacing = playerCardWidth * gameState.cardSpacingRatio;
    const verticalOffset = playerCardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate position for this card
    const handLength = targetHand.length;
    const cardIndex = step.index;
    const totalWidth = handLength > 0 ? (handLength - 1) * playerCardSpacing + playerCardWidth : playerCardWidth;
    const startX = canvas.width / 2 - totalWidth / 2;
    const targetX = startX + (cardIndex * playerCardSpacing);
    const targetY = baseY + (cardIndex * verticalOffset);
    
    // Create a temporary card object for animation
    const animatingCard = {
        card: card,
        recipient: step.recipient,
        hidden: step.hidden,
        currentX: sourceX,
        currentY: sourceY,
        targetX: targetX,
        targetY: targetY,
        placed: false
    };
    
    // Add the card to gameState for animation
    if (!gameState.animatingCards) {
        gameState.animatingCards = [];
    }
    gameState.animatingCards.push(animatingCard);
    
    // Animate the card movement
    animateCardMovement(animatingCard, () => {
        // Card has reached its destination
        animatingCard.placed = true;
        
        // Remove from animating cards
        gameState.animatingCards = gameState.animatingCards.filter(c => !c.placed);
        
        // Add this card to the visible cards array
        if (step.recipient === 'dealer') {
            if (!gameState.visibleDealerCards.includes(step.index)) {
                gameState.visibleDealerCards.push(step.index);
            }
        } else {
            if (!gameState.visiblePlayerCards.includes(step.index)) {
                gameState.visiblePlayerCards.push(step.index);
            }
        }
        
        // Force a redraw to ensure cards are displayed correctly
        renderCanvas();
        
        // If the card should be revealed (not dealer's second card), flip it
        if (!step.hidden) {
            // Create a flipping card object for the reveal animation
            const handType = step.recipient;
            const cardIndex = step.index;
            
            flipCard(handType, cardIndex, card, () => {
                // After flip animation completes, deal the next card
                setTimeout(() => {
                    animateDealSequence(sequence, index + 1);
                }, 100); // Reduced delay after flip
            });
        } else {
            // If it should remain hidden (dealer's second card), move to the next card
            // No need to add it to visible cards again since we did it above
            setTimeout(() => {
                animateDealSequence(sequence, index + 1);
            }, 200); // Small delay after animation
        }
    });
}

// Animate a card moving from source to target position
function animateCardMovement(animatingCard, callback) {
    const startTime = performance.now();
    const duration = 250; // Reduced from 400ms to 250ms for faster animation
    
    // Store the initial positions for reference
    const initialX = animatingCard.currentX;
    const initialY = animatingCard.currentY;
    const targetX = animatingCard.targetX;
    const targetY = animatingCard.targetY;
    
    console.log(`Starting card animation from (${initialX}, ${initialY}) to (${targetX}, ${targetY})`);
    
    function animate(currentTime) {
        try {
            // Calculate animation progress (0 to 1)
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate current position using easing function
            // Using easeOutCubic for smoother movement
            const easeOutCubic = function(t) { return 1 - Math.pow(1 - t, 3); };
            const easedProgress = easeOutCubic(progress);
            
            // Calculate the exact current position
            animatingCard.currentX = initialX + (targetX - initialX) * easedProgress;
            animatingCard.currentY = initialY + (targetY - initialY) * easedProgress;
            
            // Render the current state
            renderCanvas();
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure the card is exactly at the target position when animation completes
                animatingCard.currentX = targetX;
                animatingCard.currentY = targetY;
                
                // Animation complete, call the callback
                if (callback) callback();
            }
        } catch (error) {
            console.error('Error in animateCardMovement:', error);
            // Complete the animation anyway to prevent hanging
            if (callback) callback();
        }
    }
    
    // Start the animation
    requestAnimationFrame(animate);
}

// Finish the dealing process and continue with the game
function finishDealing() {
    console.log('Finishing dealing. Final hands:');
    console.log('Dealer:', gameState.dealerHand);
    console.log('Player:', gameState.playerHand);
    
    // Mark game as in progress
    gameState.isPlaying = true;
    
    // Check if player can split (same value cards)
    if (gameState.playerHand[0].value === gameState.playerHand[1].value) {
        splitBtn.disabled = false;
        gameState.canSplit = true;
    }
    
    // Fetch the current game state to get player value
    fetch(`/games/blackjack/game/${gameState.gameId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get game state');
            }
            return response.json();
        })
        .then(data => {
            // Update player value from server (stored for game logic, not display)
            gameState.playerValue = data.playerValue;
            
            // Redraw to ensure correct display
            renderCanvas();
            
            // Only enable hit if player doesn't have 21
            if (gameState.playerValue < 21) {
                hitBtn.disabled = false;
                standBtn.disabled = false;
                // Enable double only for initial 2 cards and not 21
                if (gameState.playerHand.length === 2) {
                    doubleBtn.disabled = false;
                    gameState.canDouble = true;
                } else {
                    doubleBtn.disabled = true;
                    gameState.canDouble = false;
                }
            } else {
                hitBtn.disabled = true;
                standBtn.disabled = true;
                doubleBtn.disabled = true;
                gameState.canDouble = false;
                console.log('Player has 21, automatically standing');
                handleStand();
                return;
            }
    
            // Keep play button disabled during active game
            playBtn.disabled = true;
            playBtn.style.opacity = '0.5';
    
            // Check for blackjack
            if (gameState.playerValue === 21) {
                // If player has blackjack, immediately stand and end player turn
                handleStand();
                return;
            }
        })
        .catch(error => {
            console.error('Error getting game state:', error);
            // Enable basic buttons anyway
            hitBtn.disabled = false;
            standBtn.disabled = false;
            playBtn.disabled = false;
            playBtn.style.opacity = '1';
        });
}

// Handle hit action
function handleHit() {
    console.log('Player hits');
    
    // Make sure we have a game ID
    if (!gameState.gameId) {
        console.error('No game ID found');
        return;
    }
    
    // Disable all buttons during animation
    disableGameButtons();
    
    // Make API request to hit
    fetch('/games/blackjack/hit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId: gameState.gameId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to hit');
        }
        return response.json();
    })
    .then(data => {
        console.log('Hit response:', data);
        
        // Check if this is a split game
        if (gameState.isSplit && data.playerHands && data.currentHandIndex !== undefined) {
            // Handle hit for split game
            const handIndex = data.currentHandIndex;
            
            // Get the current hand that received a new card
            const currentHand = data.currentHand;
            
            // Validate the current hand
            if (!currentHand || !Array.isArray(currentHand) || currentHand.length === 0) {
                console.error('Invalid current hand data:', currentHand);
                updateGameButtons(); // Re-enable buttons
                return;
            }
            
            // Get the new card (the last card in the current hand)
            const newCard = currentHand[currentHand.length - 1];
            
            if (!newCard) {
                console.error('Invalid new card data:', newCard);
                updateGameButtons(); // Re-enable buttons
                return;
            }
            
            console.log(`Split hit: Adding card to hand ${handIndex}:`, newCard);
            
            // Update the player hands data immediately, but don't mark the new card as visible yet
            gameState.playerHands = data.playerHands;
            gameState.currentHandIndex = data.currentHandIndex;
            gameState.playerHand = data.currentHand;
            
            // Animate the new card being added to the current hand
            animateHitCardSplit(newCard, handIndex, () => {
                console.log('Updated game state after split hit animation');
                
                // Check if current hand busted or has 21
                if (data.busted || data.handValue === 21) {
                    // Current hand is done, check if we need to move to next hand
                    if (data.splitComplete && data.splitComplete.some(complete => !complete)) {
                        // There's still an incomplete hand
                        console.log('Hand busted or has 21, automatically standing to move to the next hand');
                        // Automatically stand to move to the next hand
                        handleStand();
                    } else {
                        // All hands are complete, stand automatically
                        console.log('All split hands complete, standing automatically');
                        handleStand();
                    }
                } else {
                    // Continue play with current hand
                    console.log('Continuing with current split hand:', data.currentHandIndex);
                    updateGameButtons();
                }
            });
        } else {
            // Regular hit (non-split game)
            // Get the new card (the last card in the updated hand)
            const newCard = data.playerHand[data.playerHand.length - 1];
            
            // Update the player's hand with the new card BEFORE animation starts
            // This ensures proper positioning calculation, but we won't show it yet
            gameState.playerHand = data.playerHand;
            gameState.playerValue = data.playerValue;
            
            console.log('Updated player hand:', gameState.playerHand);
            console.log('New card to animate:', newCard);
            
            // Animate the new card being added - the card will only become visible
            // after the animation completes
            animateHitCard(newCard, () => {
                // Check if player busted
                if (data.busted) {
                    // Player busts - end the game immediately
                    gameState.isPlaying = false;
                    gameState.gameResult = 'lose';
                    gameState.showResult = true;
                    
                    // Update UI with new balance if provided
                    if (data.newBalance) {
                        updateBalanceDisplay(data.newBalance, data.currency);
                    }
                    
                    // Force a redraw to show the result
                    renderCanvas();
                    
                    // Re-enable play button
                    playBtn.disabled = false;
                    playBtn.style.opacity = '1';
                } else if (data.playerValue === 21) {
                    // Player has 21 - disable hit button and enable stand
                    hitBtn.disabled = true;
                    standBtn.disabled = true;
                    doubleBtn.disabled = true;
                    splitBtn.disabled = true;
                    console.log('Player has 21, automatically standing');
                    
                    // Auto-stand instantly (no delay)
                    handleStand();
                } else {
                    // Re-enable game buttons if player hasn't busted
                    hitBtn.disabled = false;
                    standBtn.disabled = false;
                    
                    // Disable double and split after hitting
                    doubleBtn.disabled = true;
                    splitBtn.disabled = true;
                    gameState.canDouble = false;
                    gameState.canSplit = false;
                }
            });
        }
    })
    .catch(error => {
        console.error('Error hitting:', error);
        // Re-enable buttons
        updateGameButtons();
    });
}

// Animate a card being added when player hits in split mode
function animateHitCardSplit(card, handIndex, onComplete) {
    // Validate inputs
    if (!card || handIndex === undefined || handIndex === null) {
        console.error('Invalid parameters for animateHitCardSplit:', { card, handIndex });
        if (onComplete) onComplete();
        return;
    }
    
    // Make sure the player hands array exists and the specified hand exists
    if (!gameState.playerHands || !gameState.playerHands[handIndex]) {
        console.error('Invalid hand index or playerHands not initialized:', handIndex);
        if (onComplete) onComplete();
        return;
    }
    
    // Get deck position (source)
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const sourceX = canvas.width - cardWidth - 20;
    const sourceY = 20 + cardHeight / 2;
    
    // Calculate card dimensions for player cards
    const playerCardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const playerCardHeight = playerCardWidth * gameState.cardHeightRatio;
    const playerCardSpacing = playerCardWidth * gameState.cardSpacingRatio;
    const verticalOffset = playerCardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate hand spacing for split mode
    const handSpacing = Math.min(canvas.width, canvas.height) * 0.45; // Increased space between split hands
    const handBaseY = canvas.height * 0.75;
    
    // Get the current hand
    const currentHand = gameState.playerHands[handIndex];
    
    // Calculate card index in the hand - the new card should be the last one
    const cardIndex = currentHand.length - 1;
    
    // Calculate the exact center position for this split hand
    const handCenterX = handIndex === 0 
        ? canvas.width / 2 - handSpacing / 2  // Left hand
        : canvas.width / 2 + handSpacing / 2; // Right hand
    
    // Calculate the exact position for this card in the hand
    // First, calculate the total width of all cards in the hand
    const totalWidth = (currentHand.length - 1) * playerCardSpacing + playerCardWidth;
    
    // Calculate the starting X position to center the hand
    const handStartX = handCenterX - totalWidth / 2;
    
    // Calculate the exact target X position for this specific card
    const targetX = handStartX + (cardIndex * playerCardSpacing);
    
    // Calculate the exact target Y position with vertical offset
    const targetY = handBaseY + (cardIndex * verticalOffset);
    
    console.log(`Split hit card position - hand: ${handIndex}, cardIndex: ${cardIndex}, handCenterX: ${handCenterX}, targetX: ${targetX}, targetY: ${targetY}`);
    
    // Create a temporary card object for animation
    const animatingCard = {
        card: card,
        recipient: 'player',
        hidden: true, // Always start hidden during movement
        currentX: sourceX,
        currentY: sourceY,
        targetX: targetX,
        targetY: targetY,
        placed: false,
        splitHandIndex: handIndex // Reference to track which split hand
    };
    
    // Add the card to gameState for animation
    if (!gameState.animatingCards) {
        gameState.animatingCards = [];
    }
    gameState.animatingCards.push(animatingCard);
    
    console.log(`Starting animation for split hand ${handIndex}, card ${cardIndex}`);
    
    // Animate the card movement
    animateCardMovement(animatingCard, () => {
        console.log(`Card movement complete for split hand ${handIndex}`);
        
        // Card has reached its destination
        animatingCard.placed = true;
        
        // Remove from animating cards
        gameState.animatingCards = gameState.animatingCards.filter(c => !c.placed);
        
        // Force a redraw to ensure cards are displayed correctly
        renderCanvas();
        
        // Add this card to visible cards
        if (!gameState.visiblePlayerCards.includes(cardIndex)) {
            gameState.visiblePlayerCards.push(cardIndex);
        }
        
        // Create a flipping card object for this specific card in this hand
        const flippingCard = {
            handType: 'player',
            cardIndex: cardIndex,
            card: card,
            splitHandIndex: handIndex,
            flipProgress: 0,
            complete: false
        };
        
        // Add to flipping cards array
        if (!gameState.flippingCards) {
            gameState.flippingCards = [];
        }
        gameState.flippingCards.push(flippingCard);
        
        console.log(`Starting flip animation for split hand ${handIndex}`);
        
        // Start the flip animation
        animateCardFlip(flippingCard, () => {
            console.log(`Flip animation complete for split hand ${handIndex}`);
            
            // Call the completion callback after flip animation completes
            if (onComplete) onComplete();
        });
    });
}

// Handle stand action
function handleStand() {
    console.log('Player stands');
    
    // Make sure we have a game ID
    if (!gameState.gameId) {
        console.error('No game ID found');
        return;
    }
    
    // Disable all game buttons
    disableGameButtons();
    
    // Make API request to stand
    fetch('/games/blackjack/stand', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId: gameState.gameId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to stand');
        }
        return response.json();
    })
    .then(data => {
        console.log('Stand response:', data);
        
        // Check if this is a split game that's not yet complete
        if (gameState.isSplit && data.allHandsComplete === false && data.playerHands && data.currentHandIndex !== undefined) {
            // We're moving to the next hand in a split game
            gameState.playerHands = data.playerHands;
            gameState.currentHandIndex = data.currentHandIndex;
            
            // Make sure current hand reference is valid
            if (!data.currentHand) {
                console.error('Invalid current hand data:', data.currentHand);
                
                // Reset split state to avoid further errors
                gameState.isPlaying = false;
                playBtn.disabled = false;
                playBtn.style.opacity = '1';
                renderCanvas();
                return;
            }
            
            // Update the active hand reference
            gameState.playerHand = data.currentHand;
            
            // Force a redraw to highlight the new active hand
            renderCanvas();
            
            // Re-enable buttons for the next hand
            updateGameButtons();
        } else if (gameState.isSplit && data.playerHands && data.dealerHand) {
            // All split hands are complete, handle dealer play and results
            
            // Update hands data
            gameState.playerHands = data.playerHands;
            
            // Mark that the dealer's card is being revealed
            gameState.dealerCardRevealed = true;
            
            // Replace the dealer's hidden card with the actual card
            gameState.dealerHand = data.dealerHand;
            
            // Add the dealer's second card to the visible cards array
            if (!gameState.visibleDealerCards.includes(1)) {
                gameState.visibleDealerCards.push(1);
            }
            
            // Store the results for each hand
            gameState.splitResults = data.results || [];
            gameState.splitPayouts = data.payouts || [];
            
            // End the game
            gameState.isPlaying = false;
            gameState.showResult = false;
            
            // Animate the dealer's card flip
            flipCard('dealer', 1, gameState.dealerHand[1], () => {
                // Check if dealer drew additional cards
                const additionalDealerCards = data.dealerHand.slice(2);
                if (additionalDealerCards.length > 0) {
                    // Animate dealer drawing additional cards
                    animateDealerDrawingCards(additionalDealerCards, 0, () => {
                        // After all animations complete, show the results
                        gameState.showResult = true;
                        
                        // Update UI with new balance
                        updateBalanceDisplay(data.newBalance, data.currency);
                        
                        // Force a redraw to show the results
                        renderCanvas();
                        
                        // Re-enable play button
                        playBtn.disabled = false;
                        playBtn.style.opacity = '1';
                    });
                } else {
                    // No additional dealer cards, show results immediately
                    gameState.showResult = true;
                    
                    // Update UI with new balance
                    updateBalanceDisplay(data.newBalance, data.currency);
                    
                    // Force a redraw to show the results
                    renderCanvas();
                    
                    // Re-enable play button
                    playBtn.disabled = false;
                    playBtn.style.opacity = '1';
                }
            });
        } else {
            // Regular stand (non-split game)
            
            // Now we get the dealer's hidden card from the server
            const dealerHiddenCard = data.dealerHand[1];
            
            // Mark that the dealer's card is being revealed
            gameState.dealerCardRevealed = true;
            
            // Replace the placeholder hidden card with the actual card from the server
            gameState.dealerHand[1] = dealerHiddenCard;
            
            // Store the additional dealer cards for later animation
            // Instead of immediately adding them to the dealer's hand
            const additionalDealerCards = data.dealerHand.slice(2);
            
            // Update hand values from server (stored for game logic, not display)
            gameState.playerValue = data.playerValue;
            gameState.dealerValue = data.dealerValue;
            
            // Set game result but don't show it yet
            gameState.gameResult = data.result;
            gameState.showResult = false;
            gameState.isPlaying = false;
            
            // Make sure dealer's second card is in the visible cards array
            if (!gameState.visibleDealerCards.includes(1)) {
                gameState.visibleDealerCards.push(1);
            }
            
            // Animate the dealer's card flip first
            flipCard('dealer', 1, dealerHiddenCard, () => {
                // After the card is flipped, check if dealer drew additional cards
                if (additionalDealerCards.length > 0) {
                    // Animate dealer drawing additional cards
                    animateDealerDrawingCards(additionalDealerCards, 0, () => {
                        // After all animations complete, show the result and update balance
                        gameState.showResult = true;
                        
                        // Update UI with new balance (only after animations)
                        updateBalanceDisplay(data.newBalance, data.currency);
                        
                        // Force a redraw to show the result
                        renderCanvas();
                        
                        // Re-enable play button
                        playBtn.disabled = false;
                        playBtn.style.opacity = '1';
                    });
                } else {
                    // No additional cards, show the result immediately
                    gameState.showResult = true;
                    
                    // Update UI with new balance (only after animations)
                    updateBalanceDisplay(data.newBalance, data.currency);
                    
                    // Force a redraw to show the result
                    renderCanvas();
                    
                    // Re-enable play button
                    playBtn.disabled = false;
                    playBtn.style.opacity = '1';
                }
            });
        }
    })
    .catch(error => {
        console.error('Error standing:', error);
        // Re-enable buttons
        updateGameButtons();
    });
}

// Animate dealer drawing additional cards one by one
function animateDealerDrawingCards(cards, index, onComplete) {
    if (index >= cards.length) {
        // All cards drawn, call completion callback
        if (onComplete) onComplete();
        return;
    }
    
    const card = cards[index];
    
    // Add this card to the dealer's hand only when we're ready to animate it
    // This prevents cards from appearing before animation
    const cardIndex = index + 2; // +2 because we're adding after the first two cards
    gameState.dealerHand[cardIndex] = card;
    
    // Get deck position (source)
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const sourceX = canvas.width - cardWidth - 20;
    const sourceY = 20 + cardHeight / 2;
    
    // Calculate dealer card position
    const dealerCardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const dealerCardHeight = dealerCardWidth * gameState.cardHeightRatio;
    const dealerCardSpacing = dealerCardWidth * gameState.cardSpacingRatio;
    const verticalOffset = dealerCardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate position for this card
    const handLength = cardIndex + 1;
    const totalWidth = (handLength - 1) * dealerCardSpacing + dealerCardWidth;
    const startX = canvas.width / 2 - totalWidth / 2;
    const targetX = startX + (cardIndex * dealerCardSpacing);
    
    // Get the base dealer Y position and adjust if needed
    const dealerBaseY = canvas.height * 0.25;
    let adjustedDealerY = dealerBaseY;
    
    // Use the stored adjusted position if available
    if (gameState.adjustedDealerY) {
        adjustedDealerY = gameState.adjustedDealerY;
    }
    
    // Calculate the target Y position with vertical offset
    const targetY = adjustedDealerY + (cardIndex * verticalOffset);
    
    // Create a temporary card object for animation
    const animatingCard = {
        card: card,
        recipient: 'dealer',
        hidden: false,
        currentX: sourceX,
        currentY: sourceY,
        targetX: targetX,
        targetY: targetY,
        placed: false
    };
    
    // Add the card to gameState for animation
    if (!gameState.animatingCards) {
        gameState.animatingCards = [];
    }
    gameState.animatingCards.push(animatingCard);
    
    // Animate the card movement
    animateCardMovement(animatingCard, () => {
        // Card has reached its destination
        animatingCard.placed = true;
        
        // Remove from animating cards
        gameState.animatingCards = gameState.animatingCards.filter(c => !c.placed);
        
        // Force a redraw to ensure cards are displayed correctly
        renderCanvas();
        
        // Add this card to the visible dealer cards
        gameState.visibleDealerCards.push(cardIndex);
        
        // Flip the card to reveal it
        flipCard('dealer', cardIndex, card, () => {
            // Redraw to show updated hand value
            renderCanvas();
            
            // Continue with next card after flip animation completes
            setTimeout(() => {
                animateDealerDrawingCards(cards, index + 1, onComplete);
            }, 200); // Small delay between cards
        });
    });
}

// Handle split action
function handleSplit() {
    console.log('Player splits');
    
    // Make sure we have a game ID
    if (!gameState.gameId) {
        console.error('No game ID found');
        return;
    }
    
    // Disable all buttons during animation
    disableGameButtons();
    
    // Make API request to split
    fetch('/games/blackjack/split', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId: gameState.gameId })
    })
    .then(response => {
        if (!response.ok) {
            // Check if it's a 400 error (client error, likely insufficient funds)
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Insufficient funds for splitting');
                });
            }
            throw new Error('Failed to split');
        }
        return response.json();
    })
    .then(data => {
        console.log('Split response:', data);
        
        // Update game state for split hands
        gameState.playerHands = data.playerHands;
        gameState.currentHandIndex = data.currentHandIndex;
        gameState.isSplit = true;
        
        // Set the active hand reference
        gameState.playerHand = gameState.playerHands[gameState.currentHandIndex];
        
        // Update bet amount and balance
        gameState.betAmount = data.betAmount;
        updateBalanceDisplay(data.newBalance, data.currency);
        
        // Clear visual state for animation
        gameState.visiblePlayerCards = [];
        
        // Animate the split
        animateSplit(data.playerHands, () => {
            // Re-enable appropriate buttons after animation
            updateGameButtons();
        });
    })
    .catch(error => {
        console.error('Error splitting:', error);
        // Re-enable buttons
        updateGameButtons();
        
        // Show error notification
        showNotification(error.message || 'Insufficient funds for splitting');
    });
}

// End the game
function endGame(gameData) {
    gameState.isPlaying = false;
    
    // Game result should already be set from the stand API response
    
    console.log(`Game ended with result: ${gameState.gameResult}`);
    
    // Display game result and payout
    if (gameData) {
        let resultMessage = '';
        
        switch (gameData.result) {
            case 'blackjack':
                resultMessage = `Blackjack! You win ${gameData.currency === 'USD' ? '$' : '£'}${gameData.payout.toFixed(gameData.currency === 'USD' ? 2 : 0)}`;
                break;
            case 'win':
                resultMessage = `You win ${gameData.currency === 'USD' ? '$' : '£'}${gameData.payout.toFixed(gameData.currency === 'USD' ? 2 : 0)}`;
                break;
            case 'lose':
                resultMessage = 'Dealer wins';
                break;
            case 'push':
                resultMessage = `Push! Your bet of ${gameData.currency === 'USD' ? '$' : '£'}${gameData.betAmount.toFixed(gameData.currency === 'USD' ? 2 : 0)} is returned`;
                break;
        }
        
        
    }
    
    // Force a redraw to show highlighted cards
    renderCanvas();
    
    // Re-enable play button
    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    
    // Disable game action buttons
    disableGameButtons();
}

// Disable all game action buttons
function disableGameButtons() {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    splitBtn.disabled = true;
    doubleBtn.disabled = true;
}

// Initialize the game
function init() {
    // Set up resize listener
    window.addEventListener('resize', resizeCanvas);
    
    // Initial canvas setup
    resizeCanvas();
    
    // Initialize controls
    initControls();
    
    // Ensure game buttons are disabled initially
    disableGameButtons();
    
   
}

// Start everything when the page loads
window.addEventListener('load', init);

// Draw a card that is in the process of being flipped
function drawFlippingCard(flippingCard, x, y, width, height, isPlayerCard = false) {
    // Calculate the visible width of the card based on flip progress
    // As flip progress goes from 0 to 0.5, width goes from 100% to 0%
    // As flip progress goes from 0.5 to 1, width goes from 0% to 100%
    let visibleWidth;
    if (flippingCard.flipProgress < 0.5) {
        visibleWidth = width * (1 - flippingCard.flipProgress * 2);
    } else {
        visibleWidth = width * ((flippingCard.flipProgress - 0.5) * 2);
    }
    
    // Important: Keep the card perfectly centered during the flip animation
    // by adjusting the drawing position based on the scaled width
    const offsetX = (width - visibleWidth) / 2;
    
    // Draw the card with appropriate side showing
    if (flippingCard.flipProgress < 0.5) {
        // First half of animation - show card back
        ctx.save();
        
        // Set clip region to only show the visible portion of the card
        ctx.beginPath();
        roundRect(ctx, x + offsetX, y - height / 2, visibleWidth, height, CARD_CORNER_RADIUS, false, false);
        ctx.clip();
        
        // Draw the full card back at original width but clipped
        drawCardBack(x, y, width, height);
        
        ctx.restore();
    } else {
        // Second half of animation - show card front
        ctx.save();
        
        // Set clip region to only show the visible portion of the card
        ctx.beginPath();
        roundRect(ctx, x + offsetX, y - height / 2, visibleWidth, height, CARD_CORNER_RADIUS, false, false);
        ctx.clip();
        
        // Draw the card front at original width but clipped
        renderCard(flippingCard.card, x, y, width, height, isPlayerCard);
        
        ctx.restore();
    }
}

// Start a card flip animation
function flipCard(handType, cardIndex, card, onComplete) {
    console.log(`Flipping card: ${handType} at index ${cardIndex}`, card);
    
    // Create a flipping card object
    const flippingCard = {
        handType: handType,
        cardIndex: cardIndex,
        card: card,
        flipProgress: 0,
        complete: false
    };
    
    // Add to flipping cards array
    gameState.flippingCards.push(flippingCard);
    
    // Start the flip animation
    animateCardFlip(flippingCard, onComplete);
}

// Animate a card flip
function animateCardFlip(flippingCard, onComplete) {
    const startTime = performance.now();
    const duration = 200; // Reduced from 600ms to 200ms for quicker animation
    
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
            
            // Render the current state - this calls drawHand which correctly 
            // positions and draws all cards including flipping ones
            renderCanvas();
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                flippingCard.complete = true;
                
                // Remove from flipping cards
                gameState.flippingCards = gameState.flippingCards.filter(fc => !fc.complete);
                
                // Force one more render to ensure the card is displayed correctly
                renderCanvas();
                
                // Call the completion callback
                if (onComplete) onComplete();
            }
        } catch (error) {
            console.error('Error in animateCardFlip:', error, flippingCard);
            // Complete the animation anyway to prevent hanging
            flippingCard.complete = true;
            gameState.flippingCards = gameState.flippingCards.filter(fc => !fc.complete);
            renderCanvas();
            if (onComplete) onComplete();
        }
    }
    
    // Start the animation
    requestAnimationFrame(animate);
}

// Display hand value with rounded grey background
function displayHandValue(value, x, y, isPlayer = false, splitHandIndex = undefined) {
    // Set up styling for the value display
    const fontSize = Math.min(canvas.width, canvas.height) * 0.05;
    const padding = fontSize * 0.7;
    const radius = fontSize * 0.6;
    
    // Measure text width
    ctx.font = `bold ${fontSize}px Arial`;
    const textWidth = ctx.measureText(value.toString()).width;
    
    // Default background color
    let bgColor = 'rgba(100, 100, 100, 0.8)';
    let textColor = 'white';
    
    // If game is over and this is player's value, change color based on result
    if (!gameState.isPlaying && isPlayer && gameState.showResult) {
        // Split mode: use splitResults if available and splitHandIndex is defined
        if (gameState.isSplit && Array.isArray(gameState.splitResults) && splitHandIndex !== undefined) {
            const handResult = gameState.splitResults[splitHandIndex];
            switch (handResult) {
                case 'blackjack':
                case 'win':
                    bgColor = 'rgba(46, 204, 113, 0.8)'; // Green for win
                    break;
                case 'lose':
                    bgColor = 'rgba(231, 76, 60, 0.8)'; // Red for loss
                    break;
                case 'push':
                case 'draw':
                    bgColor = 'rgba(243, 156, 18, 0.8)'; // Orange for draw
                    break;
            }
        } else if (gameState.gameResult) {
            // Normal game
            switch (gameState.gameResult) {
                case 'blackjack':
                case 'win':
                    bgColor = 'rgba(46, 204, 113, 0.8)'; // Green for win
                    break;
                case 'lose':
                    bgColor = 'rgba(231, 76, 60, 0.8)'; // Red for loss
                    break;
                case 'push':
                case 'draw':
                    bgColor = 'rgba(243, 156, 18, 0.8)'; // Orange for draw
                    break;
            }
        }
    }
    
    // Draw rounded rectangle background
    ctx.fillStyle = bgColor;
    roundRect(
        ctx, 
        x - textWidth/2 - padding, 
        y - fontSize/2 - padding/2, 
        textWidth + padding*2, 
        fontSize + padding, 
        radius, 
        true, 
        false
    );
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), x, y);
}

// End game when player busts
function endGamePlayerBust() {
    gameState.isPlaying = false;
    gameState.gameResult = 'lose';
    gameState.showResult = true;
    
    // Force a redraw to show highlighted cards
    renderCanvas();
    
    // Re-enable play button
    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    
    // Disable game action buttons
    disableGameButtons();
}

// Update game buttons based on the current game state
function updateGameButtons() {
    // Only enable buttons if the game is in progress
    if (!gameState.isPlaying) {
        disableGameButtons();
        return;
    }
    
    if (gameState.isSplit && gameState.playerHands && gameState.playerHands.length > 0) {
        // Split game in progress
        // Get the current hand
        const currentHandIndex = gameState.currentHandIndex || 0;
        
        // Make sure the hand exists before proceeding
        if (currentHandIndex >= gameState.playerHands.length) {
            console.error('Invalid hand index:', currentHandIndex);
            disableGameButtons();
            return;
        }
        
        const currentHand = gameState.playerHands[currentHandIndex];
        
        // Make sure the hand is defined
        if (!currentHand) {
            console.error('Current hand is undefined');
            disableGameButtons();
            return;
        }
        
        // Calculate hand value
        const handValue = calculateHandValue(currentHand);
        
        // Enable hit and stand buttons for active hand
        hitBtn.disabled = handValue >= 21;
        standBtn.disabled = false;
        
        // In split mode, double and split are not allowed for the second hand
        // or after drawing additional cards
        doubleBtn.disabled = !!gameState.splitDoubled[currentHandIndex] || currentHand.length > 2 || handValue >= 21;
        splitBtn.disabled = true; // No re-splitting in this implementation
    } else if (gameState.playerHand) {
        // Regular game
        // Get player's hand value
        const playerValue = gameState.playerValue || 0;
        
        // Enable/disable hit and stand buttons
        hitBtn.disabled = playerValue >= 21;
        standBtn.disabled = false;
        
        // Check if player can double (only with 2 cards and enough balance)
        doubleBtn.disabled = !gameState.canDouble || !gameState.playerHand || gameState.playerHand.length > 2 || playerValue >= 21;
        
        // Check if player can split (only with 2 cards of same value)
        splitBtn.disabled = !gameState.canSplit || !gameState.playerHand || gameState.playerHand.length > 2 || playerValue >= 21;
    } else {
        // Something's wrong with the game state
        console.error('Invalid game state:', gameState);
        disableGameButtons();
    }
}

// Helper function to get the value of a single card
function getCardValue(card) {
    if (!card) return 0;
    
    if (card.value === 'A') {
        return 11; // Ace is always 11 for a single card
    } else if (['K', 'Q', 'J'].includes(card.value)) {
        return 10;
    } else {
        return parseInt(card.value);
    }
}

// Handle double action
function handleDouble() {
    console.log('Player doubles down');

    if (!gameState.gameId) {
        console.error('No game ID found');
        return;
    }

    // Disable all game buttons
    disableGameButtons();

    fetch('/games/blackjack/double', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId })
    })
    .then(response => {
        if (!response.ok) {
            // If 400, show the server's error message (e.g. insufficient funds)
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Insufficient funds for doubling down');
                });
            }
            throw new Error('Failed to double down');
        }
        return response.json();
    })
    .then(data => {
        console.log('Double down response:', data);

        // --- SPLIT HAND BRANCH (unchanged except for balance timing) ---
        if (gameState.isSplit && Array.isArray(data.playerHands) && data.currentHandIndex !== undefined) {
            const handIndex = gameState.currentHandIndex;
            const doubledHand = data.playerHands[handIndex];
            const newCard = doubledHand[doubledHand.length - 1];
            
            // Update the local bet amount immediately so it appears on screen
            gameState.betAmount = data.betAmount;
            
            // Update the player hands data immediately to ensure proper card positioning
            gameState.playerHands = data.playerHands;
            
            // Keep the current hand reference updated
            gameState.playerHand = gameState.playerHands[handIndex];

            console.log(`Split double: Adding card to hand ${handIndex}:`, newCard);
            console.log('Updated player hands:', gameState.playerHands);

            // Animate the new card being added to the current split hand
            animateHitCardSplit(newCard, handIndex, () => {
                // After card animation completes, update the current hand index
                gameState.currentHandIndex = data.currentHandIndex;

                // If all split hands done, dealer's turn begins
                if (data.allHandsComplete === true) {
                    console.log('All split hands complete after double, getting dealer cards');
                    handleStand();
                } else {
                    // Otherwise, move to next split hand in UI
                    gameState.playerHand = gameState.playerHands[gameState.currentHandIndex];
                    updateGameButtons();
                    renderCanvas();
                }
            });

            // Mark this hand as doubled
            gameState.splitDoubled[handIndex] = true;

            return; // exit split‐branch here
        }


        // --- NON‐SPLIT HAND (regular double) ---
        // 1) Immediately reflect the new bet amount on screen
        gameState.betAmount = data.betAmount;
        
        // 2) Insert the new card into gameState, but do NOT update balance yet
        const newCard = data.playerHand[data.playerHand.length - 1];
        gameState.playerHand = data.playerHand;
        gameState.playerValue = data.playerValue;

        console.log('New card to animate (double):', newCard);

        // 3) Start animating the player's new card
        animateHitCard(newCard, () => {
            // This callback fires when the player's card has moved & flipped

            // 4) If the player busted on this double, show loss immediately
            if (data.busted) {
                gameState.gameResult = 'lose';
                gameState.showResult = true;
                gameState.isPlaying = false;

                // Red border will show on renderCanvas() below
                renderCanvas();

                // Now that the border is visible, update balance
                if (data.newBalance !== undefined) {
                    updateBalanceDisplay(data.newBalance, data.currency);
                }

                // Re‐enable the Play button
                playBtn.disabled = false;
                playBtn.style.opacity = '1';
                return;
            }

            // 5) Player did not bust—check if dealer data & final result arrived
            if (Array.isArray(data.dealerHand) && data.dealerHand.length > 1 && data.result) {
                // a) Reveal dealer's second card
                gameState.dealerCardRevealed = true;
                gameState.dealerHand[1] = data.dealerHand[1];

                // Store any further dealer cards for sequential animation
                const additionalDealerCards = data.dealerHand.slice(2);

                // Temporarily store result, but do NOT set showResult = true until animations finish
                gameState.gameResult = data.result;
                gameState.showResult = false;
                gameState.isPlaying = false;

                // Ensure dealer's hidden card index (1) is visible
                if (!gameState.visibleDealerCards.includes(1)) {
                    gameState.visibleDealerCards.push(1);
                }

                // b) Animate flipping dealer's second card
                flipCard('dealer', 1, data.dealerHand[1], () => {
                    // After flipping the dealer's "hole card" face‐up:
                    if (additionalDealerCards.length > 0) {
                        // c) Animate any additional dealer draws
                        animateDealerDrawingCards(additionalDealerCards, 0, () => {
                            // d) All animations done: show final borders & update balance
                            gameState.showResult = true;
                            renderCanvas();

                            if (data.newBalance !== undefined) {
                                updateBalanceDisplay(data.newBalance, data.currency);
                            }
                            playBtn.disabled = false;
                            playBtn.style.opacity = '1';
                        });
                    } else {
                        // No extra dealer draws—just finalize
                        gameState.showResult = true;
                        renderCanvas();

                        if (data.newBalance !== undefined) {
                            updateBalanceDisplay(data.newBalance, data.currency);
                        }
                        playBtn.disabled = false;
                        playBtn.style.opacity = '1';
                    }
                });
            } else {
                // 6) No dealer info yet—automatically stand (dealer turn)
                handleStand();
            }
        });
    })
    .catch(error => {
        console.error('Error doubling down:', error);
        updateGameButtons();
        showNotification(error.message || 'Insufficient funds for doubling down');
    });
}


// Show notification message
function showNotification(message, duration = 2000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    // Set the message
    notificationText.textContent = message;
    
    // Remove any existing classes
    notification.classList.remove('fade-out');
    
    // Show the notification
    notification.classList.add('show');
    
    // Set a timeout to hide it
    setTimeout(() => {
        // Add fade-out animation
        notification.classList.add('fade-out');
        
        // Remove the show class after animation completes
        setTimeout(() => {
            notification.classList.remove('show');
        }, 500); // Match the animation duration in CSS
    }, duration);
}

// Animate a split operation
function animateSplit(playerHands, onComplete) {
    // Calculate card dimensions based on canvas size and gameState multipliers
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const handSpacing = Math.min(canvas.width, canvas.height) * 0.45; // Increased space between split hands
    const cardSpacing = cardWidth * gameState.cardSpacingRatio;
    const verticalOffset = cardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate the exact positions for the split hands
    const handBaseY = canvas.height * 0.75;
    const hand1X = canvas.width / 2 - handSpacing / 2;
    const hand2X = canvas.width / 2 + handSpacing / 2;
    
    // Original cards (face up)
    const card1 = playerHands[0][0];
    const card2 = playerHands[1][0];
    
    // Initialize the player hands array with just the first cards
    gameState.playerHands = [
        [card1],
        [card2]
    ];
    
    // Calculate the exact starting position for both cards
    const initialX = canvas.width / 2;
    const initialY = handBaseY;
    
    // Calculate the exact target positions for both original cards
    // For the first hand, we need to calculate where the first card will be positioned
    const hand1TotalWidth = cardWidth; // Just one card initially
    const hand1StartX = hand1X - hand1TotalWidth / 2;
    const hand1CardX = hand1StartX;
    
    // For the second hand, we need to calculate where the first card will be positioned
    const hand2TotalWidth = cardWidth; // Just one card initially
    const hand2StartX = hand2X - hand2TotalWidth / 2;
    const hand2CardX = hand2StartX;
    
    console.log(`Split animation positions - hand1X: ${hand1X}, hand1CardX: ${hand1CardX}, hand2X: ${hand2X}, hand2CardX: ${hand2CardX}`);
    
    // Create animation objects for both cards with exact positions
    const animatingCard1 = {
        card: card1,
        currentX: initialX,
        currentY: initialY,
        targetX: hand1CardX,
        targetY: handBaseY,
        placed: false,
        hidden: false, // FACE UP
        splitOriginal: true // Only originals get this flag
    };
    
    const animatingCard2 = {
        card: card2,
        currentX: initialX,
        currentY: initialY,
        targetX: hand2CardX,
        targetY: handBaseY,
        placed: false,
        hidden: false, // FACE UP
        splitOriginal: true // Only originals get this flag
    };
    
    gameState.animatingCards = [animatingCard1, animatingCard2];
    console.log('Starting split animation for initial cards');
    
    // First animate both original cards moving to their positions
    Promise.all([
        new Promise(resolve => animateCardMovement(animatingCard1, resolve)),
        new Promise(resolve => animateCardMovement(animatingCard2, resolve))
    ]).then(() => {
        // Both original cards have reached their positions
        console.log('Split animation complete for initial cards');
        gameState.animatingCards = [];
        
        // Mark both original cards as visible in their respective hands
        gameState.visiblePlayerCards = [0];
        renderCanvas();
        
        // Get deck position for source of new cards
        const deckCardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
        const deckCardHeight = deckCardWidth * gameState.cardHeightRatio;
        const sourceX = canvas.width - deckCardWidth - 20;
        const sourceY = 20 + deckCardHeight / 2;
        
        // Get the new cards to be dealt
        const card3 = playerHands[0][1];
        const card4 = playerHands[1][1];
        
        // Calculate exact positions for the second card in each hand
        const hand1Card2X = hand1CardX + cardSpacing;
        const hand1Card2Y = handBaseY + verticalOffset;
        
        const hand2Card2X = hand2CardX + cardSpacing;
        const hand2Card2Y = handBaseY + verticalOffset;
        
        console.log(`Second card positions - hand1: (${hand1Card2X}, ${hand1Card2Y}), hand2: (${hand2Card2X}, ${hand2Card2Y})`);
        
        // Then animate and flip card for hand 2
        const animateSecondHand = () => {
            const animatingCard = {
                card: card4,
                currentX: sourceX,
                currentY: sourceY,
                targetX: hand2Card2X,
                targetY: hand2Card2Y,
                placed: false,
                hidden: true // Start face down
            };
            gameState.animatingCards = [animatingCard];
            
            // Animate the card movement to hand 2
            animateCardMovement(animatingCard, () => {
                // Card has reached its destination
                animatingCard.placed = true;
                gameState.animatingCards = [];
                
                // Now add the card to the second hand
                gameState.playerHands[1][1] = card4;
                
                // Force a redraw
                renderCanvas();
                
                // Now flip the card
                const flippingCard = {
                    handType: 'player',
                    cardIndex: 1,
                    card: card4,
                    splitHandIndex: 1, // Explicitly set split hand index
                    flipProgress: 0,
                    complete: false
                };
                
                // Add to flipping cards array
                if (!gameState.flippingCards) {
                    gameState.flippingCards = [];
                }
                gameState.flippingCards.push(flippingCard);
                
                // Add this card to visible cards
                if (!gameState.visiblePlayerCards.includes(1)) {
                    gameState.visiblePlayerCards.push(1);
                }
                
                // Start the flip animation
                animateCardFlip(flippingCard, () => {
                    // All animations complete
                    console.log('Split animation sequence complete');
                    
                    // Update the current hand reference to the active hand
                    gameState.playerHand = gameState.playerHands[gameState.currentHandIndex];
                    
                    if (onComplete) onComplete();
                });
            });
        };
        
        // Similarly update the first hand animation
        const animateFirstHand = () => {
            const animatingCard = {
                card: card3,
                currentX: sourceX,
                currentY: sourceY,
                targetX: hand1Card2X,
                targetY: hand1Card2Y,
                placed: false,
                hidden: true // Start face down
            };
            gameState.animatingCards = [animatingCard];
            
            // Animate the card movement to hand 1
            animateCardMovement(animatingCard, () => {
                // Card has reached its destination
                animatingCard.placed = true;
                gameState.animatingCards = [];
                
                // Now add the card to the first hand
                gameState.playerHands[0][1] = card3;
                
                // Force a redraw
                renderCanvas();
                
                // Now flip the card
                const flippingCard = {
                    handType: 'player',
                    cardIndex: 1,
                    card: card3,
                    splitHandIndex: 0, // Explicitly set split hand index
                    flipProgress: 0,
                    complete: false
                };
                
                // Add to flipping cards array
                if (!gameState.flippingCards) {
                    gameState.flippingCards = [];
                }
                gameState.flippingCards.push(flippingCard);
                
                // Add this card to visible cards
                if (!gameState.visiblePlayerCards.includes(1)) {
                    gameState.visiblePlayerCards.push(1);
                }
                
                // Start the flip animation
                animateCardFlip(flippingCard, () => {
                    // After first card is flipped, proceed with second hand
                    animateSecondHand();
                });
            });
        };
        
        // Start the sequential animation
        animateFirstHand();
    });
}

// Animate a card being added when player hits
function animateHitCard(card, onComplete) {
    // Get deck position (source)
    const cardWidth = Math.min(canvas.width, canvas.height) * gameState.deckCardWidthMultiplier;
    const cardHeight = cardWidth * gameState.cardHeightRatio;
    const sourceX = canvas.width - cardWidth - 20;
    const sourceY = 20 + cardHeight / 2;
    
    // Calculate player card position
    const playerCardWidth = Math.min(canvas.width, canvas.height) * gameState.cardWidthMultiplier;
    const playerCardHeight = playerCardWidth * gameState.cardHeightRatio;
    const playerCardSpacing = playerCardWidth * gameState.cardSpacingRatio;
    const verticalOffset = playerCardHeight * gameState.cardVerticalOffsetRatio;
    
    // Calculate where the card should end up based on current hand
    // The new card will be at the end of the current hand
    const handLength = gameState.playerHand.length;
    const cardIndex = handLength - 1; // Index of the new card in the hand
    
    // Calculate the total width of all cards in the hand
    const totalWidth = (handLength - 1) * playerCardSpacing + playerCardWidth;
    
    // Calculate the starting X position to center the hand
    const startX = canvas.width / 2 - totalWidth / 2;
    
    // Calculate the target X position for this specific card
    const targetX = startX + (cardIndex * playerCardSpacing);
    
    // Get the base player Y position and adjust for potential overflow
    const playerBaseY = canvas.height * 0.75;
    let adjustedPlayerY = playerBaseY;
    
    // Check if we have a stored adjusted position
    if (gameState.adjustedPlayerY) {
        adjustedPlayerY = gameState.adjustedPlayerY;
    } else if (handLength > 3) {
        // If not, calculate it for hands with more than 3 cards
        const bottomCardY = playerBaseY + ((handLength - 1) * verticalOffset) + playerCardHeight / 2;
        if (bottomCardY > canvas.height - 20) {
            const overflow = bottomCardY - (canvas.height - 20);
            adjustedPlayerY = playerBaseY - overflow;
        }
    }
    
    // Apply the vertical offset for this card's index
    const targetY = adjustedPlayerY + (cardIndex * verticalOffset);
    
    console.log(`Hit card position - handLength: ${handLength}, cardIndex: ${cardIndex}, targetX: ${targetX}, targetY: ${targetY}`);
    
    // Create a temporary card object for animation
    const animatingCard = {
        card: card,
        recipient: 'player',
        hidden: true, // Always start hidden during movement
        currentX: sourceX,
        currentY: sourceY,
        targetX: targetX,
        targetY: targetY,
        placed: false
    };
    
    // Add the card to gameState for animation
    if (!gameState.animatingCards) {
        gameState.animatingCards = [];
    }
    gameState.animatingCards.push(animatingCard);
    
    // Animate the card movement
    animateCardMovement(animatingCard, () => {
        // Card has reached its destination
        animatingCard.placed = true;
        
        // Remove from animating cards
        gameState.animatingCards = gameState.animatingCards.filter(c => !c.placed);
        
        // Force a redraw to ensure cards are displayed correctly
        renderCanvas();
        
        // Add this card to the visible player cards
        gameState.visiblePlayerCards.push(cardIndex);
        
        // Flip the card in place - no additional movement should happen
        flipCard('player', cardIndex, card, () => {
            // Redraw to show updated hand value
            renderCanvas();
            
            // After the card is flipped, call the completion callback
            if (onComplete) onComplete();
        });
    });
}

// Calculate the total value of a hand (similar to backend function)
function calculateHandValue(hand) {
    if (!hand || hand.length === 0) {
        return 0;
    }
    
    let value = 0;
    let aces = 0;
    
    // Sum up all non-ace cards
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    
    // Add aces (1 or 11 each)
    for (let i = 0; i < aces; i++) {
        if (value + 11 <= 21) {
            value += 11;
        } else {
            value += 1;
        }
    }
    
    return value;
}

// Navbar elements
const balanceBox = document.getElementById('balance-box');
const selectedBalance = document.getElementById('selected-balance');
const dropdownItems = document.querySelectorAll('.dropdown-item');

// Helper to format currency amounts (copied from dice.js)
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
    } else if (currency === 'LBP') {
        return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}

// Sync currency selection between navbar and game controls (copied from dice.js)
function syncCurrencySelections() {
  // Set up event listeners for navbar dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const currency = item.getAttribute('data-currency');
      // Update the game control dropdown to match navbar selection
      const currencySelect = document.getElementById('currency');
      currencySelect.value = currency;
      // Set bet amount to min for selected currency
      const betAmountInput = document.getElementById('bet-amount');
      if (BET_LIMITS[currency]) {
        betAmountInput.value = BET_LIMITS[currency].min;
      }
      // Optionally, update profit calculation or other UI here
      // updateProfitOnWin(); // Uncomment if you have this function
    });
  });

  // Set up event listener for game control currency dropdown
  const currencySelect = document.getElementById('currency');
  currencySelect.addEventListener('change', () => {
    const currency = currencySelect.value;
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
    // Set bet amount to min for selected currency
    const betAmountInput = document.getElementById('bet-amount');
    if (BET_LIMITS[currency]) {
      betAmountInput.value = BET_LIMITS[currency].min;
    }
    // Optionally, update profit calculation or other UI here
    // updateProfitOnWin(); // Uncomment if you have this function
  });
}

window.addEventListener('DOMContentLoaded', () => {
  syncCurrencySelections();

  // Bet amount auto-adjust on blur or change
  const betAmountInput = document.getElementById('bet-amount');
  const currencySelect = document.getElementById('currency');

  function clampBetAmount() {
    const currency = currencySelect.value;
    const limits = BET_LIMITS[currency];
    let value = parseFloat(betAmountInput.value);
    if (isNaN(value)) value = limits.min;
    if (value < limits.min) value = limits.min;
    if (value > limits.max) value = limits.max;
    // Only update if changed, to avoid unnecessary events
    if (betAmountInput.value != value) {
      betAmountInput.value = value;
    }
  }

  betAmountInput.addEventListener('blur', clampBetAmount);
  betAmountInput.addEventListener('change', clampBetAmount);
  // Optionally, also clamp when currency changes
  currencySelect.addEventListener('change', clampBetAmount);
});

