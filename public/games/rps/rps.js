  
  
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


  
 // Multiplier table
 const MULTIPLIERS = [
    1.96,     // 1 win
    3.92,     // 2 wins
    7.84,     // 3 wins
    15.68,    // 4 wins
    31.36,    // 5 wins
    62.72,    // 6 wins
    125.44,   // 7 wins
    250.88,   // 8 wins
    501.76    // 9 wins (max)
  ];


// ─── Canvas Setup ────────────────
const canvas = document.getElementById('rpsCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    active: false,
    currentAnimation: null,
    winCount: 0,
    displayedWinCount: 0, // Separate counter for display purposes that updates after animations
    tieCount: 0,
    gameOver: false,
    playerMove: null,
    serverMove: null,
    outcome: null,
    revealInProgress: false,
    showResult: false, // Explicitly control showing the result
    previousResults: [], // Store previous results for displaying on the left
    previousPlayerMoves: [], // Store previous player moves
    previousOutcomes: [], // Store previous outcomes for colored borders
    previousMultipliers: [], // Store previous multipliers
    currentMultiplier: 1.00, // Track current multiplier
    flipAnimation: {
        progress: 0,
        duration: 300, // ms (faster animation)
        startTime: 0,
        active: false
    },
    playerAnimation: {
        progress: 0,
        duration: 400, // ms for player animation
        startTime: 0,
        active: false
    },
    slideAnimation: {
        progress: 0,
        duration: 600, // ms for slide animation
        startTime: 0,
        active: false
    }
};

// Load game assets
const playerBaseSVG = new Image();
playerBaseSVG.src = 'rps_assets/rps_player_base.svg';

// Load the hidden choice SVG
const hiddenChoiceSVG = new Image();
hiddenChoiceSVG.src = 'rps_assets/rps_hidden.png';

// Load player choice SVGs
const playerRockSVG = new Image();
playerRockSVG.src = 'rps_assets/player_rock.svg';

const playerPaperSVG = new Image();
playerPaperSVG.src = 'rps_assets/player_paper.svg';

const playerScissorsSVG = new Image();
playerScissorsSVG.src = 'rps_assets/player_scissors.svg';

// Load house choice SVGs
const houseRockSVG = new Image();
houseRockSVG.src = 'rps_assets/house_rock.svg';

const housePaperSVG = new Image();
housePaperSVG.src = 'rps_assets/house_paper.svg';

const houseScissorsSVG = new Image();
houseScissorsSVG.src = 'rps_assets/house_scissors.svg';

// Helper to get the correct SVG based on move and player/house
function getMoveSVG(move, isPlayer) {
    if (isPlayer) {
        switch(move) {
            case 'rock': return playerRockSVG;
            case 'paper': return playerPaperSVG;
            case 'scissors': return playerScissorsSVG;
            default: return hiddenChoiceSVG;
        }
    } else {
        switch(move) {
            case 'rock': return houseRockSVG;
            case 'paper': return housePaperSVG;
            case 'scissors': return houseScissorsSVG;
            default: return hiddenChoiceSVG;
        }
    }
}

// Helper function specifically for drawing history multipliers with custom positioning
function drawHistoryMultiplier(x, y, multiplier, width) {
    const padding = 8;
    const fontSize = 14;
    const text = multiplier.toFixed(2) + 'x';
    
    ctx.font = `bold ${fontSize}px Arial`;
    const textWidth = ctx.measureText(text).width;
    
    const badgeWidth = Math.max(textWidth + padding * 2, width * 0.6);
    const badgeHeight = 24;
    const badgeX = x + (width - badgeWidth) / 2;
    const badgeY = y + 5; // Custom offset for history multipliers
    const badgeRadius = 6;
    
    // Draw white background with rounded corners
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(badgeX + badgeRadius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY);
    ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeRadius, badgeRadius);
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius);
    ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - badgeRadius, badgeY + badgeHeight, badgeRadius);
    ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight);
    ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - badgeRadius, badgeRadius);
    ctx.lineTo(badgeX, badgeY + badgeRadius);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeRadius, badgeY, badgeRadius);
    ctx.fill();
    
    // Draw black text
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
}

// Draw the game elements
function drawGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate sizes for cards early so they're available throughout the function
    const cardHeight = canvas.height * 0.28;
    const hiddenHeight = cardHeight;
    const hiddenWidth = (hiddenChoiceSVG.width / hiddenChoiceSVG.height) * hiddenHeight;
    const spacing = hiddenWidth * 1.15; // Spacing for hidden cards
    const borderWidth = 6; // Width of the colored borders
    const borderRadius = 12; // Reduced border radius to better match cards
    
    // Outcome border colors
    const borderColors = {
        'win': '#2bff1a',    // Bright green
        'lose': '#e9113c',   // Red
        'tie': '#ff9d00'     // Orange
    };
    
    // Helper function to draw rounded rectangle border
    function drawRoundedBorder(x, y, width, height, color, radius, opacity = 1.0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = borderWidth;
        ctx.globalAlpha = opacity;
        
        // Start from top-left, moving clockwise
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        
        ctx.stroke();
        ctx.closePath();
        ctx.globalAlpha = 1.0; // Reset opacity
    }
    
    // Helper function to draw multiplier badge
    function drawMultiplier(x, y, multiplier, width, isMain = false) {
        const padding = 8;
        const fontSize = 14; // Same size for all multipliers
        const text = multiplier.toFixed(2) + 'x';
        
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        
        const badgeWidth = Math.max(textWidth + padding * 2, width * 0.6);
        const badgeHeight = 24; // Same height for all multipliers
        const badgeX = x + (width - badgeWidth) / 2;
        
        // Use different Y position calculation depending on whether it's for history
        let badgeY;
        if (isMain) {
            // For the main multiplier or history multipliers (when isMain is true)
            badgeY = y; // Use the provided Y position directly
        } else {
            // For normal card multipliers (hidden cards)
            badgeY = y + hiddenHeight + 10; // Add offset for cards
        }
        
        const badgeRadius = 6;
        
        // Determine background color based on if it's the main multiplier and game outcome
        // Only apply colors if the showResult flag is true (after flip animation completes)
        // OR if it's a win/tie that should persist
        let bgColor = 'white';
        let textColor = 'black';
        
        if (isMain && gameState.outcome) {
            // For the initial color change, only do it after flip animation completes
            if (gameState.showResult || gameState.outcome === 'win' || gameState.outcome === 'tie') {
                if (gameState.outcome === 'win') {
                    bgColor = '#4caf50'; // Green for wins
                    textColor = 'white'; // White text on green background
                } else if (gameState.outcome === 'lose') {
                    // Only show red if we're still showing the result (don't persist loss color)
                    if (gameState.showResult) {
                        bgColor = '#eb1d39'; // Red for losses
                        textColor = 'white'; // White text on red background
                    }
                } else if (gameState.outcome === 'tie') {
                    bgColor = '#ff9d00'; // Orange for ties
                    textColor = 'white'; // White text on orange background
                }
            }
        }
        
        // Draw white background with rounded corners
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.moveTo(badgeX + badgeRadius, badgeY);
        ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY);
        ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeRadius, badgeRadius);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius);
        ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - badgeRadius, badgeY + badgeHeight, badgeRadius);
        ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight);
        ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - badgeRadius, badgeRadius);
        ctx.lineTo(badgeX, badgeY + badgeRadius);
        ctx.arcTo(badgeX, badgeY, badgeX + badgeRadius, badgeY, badgeRadius);
        ctx.fill();
        
        // Draw black text
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    }
    
    // Position in center horizontally and above the player base
    const centerX = (canvas.width - hiddenWidth) / 2;
    const centerY = canvas.height * 0.2 - hiddenHeight / 2;
    
    // Calculate player card sizes and positions
    const playerCardHeight = cardHeight;
    const playerFinalY = canvas.height * 0.635 - playerCardHeight / 2;
    
    // Calculate middle position between house and player
    const middleY = (centerY + hiddenHeight + playerFinalY) / 2 - 14;
    
    // Draw the player base in the center if image is loaded
    if (playerBaseSVG.complete) {
        // Calculate size for the SVG (30% of canvas height instead of 40%)
        const svgHeight = canvas.height * 0.34;
        const svgWidth = (playerBaseSVG.width / playerBaseSVG.height) * svgHeight;
        
        // Position in center horizontally but lower vertically (70% down instead of centered)
        const x = (canvas.width - svgWidth) / 2;
        const y = canvas.height * 0.65 - svgHeight / 2;
        
        // Draw the SVG
        ctx.drawImage(playerBaseSVG, x, y, svgWidth, svgHeight);
    }
    
    // Handle the slide animation (sliding all cards to the left)
    if (gameState.slideAnimation.active) {
        const progress = gameState.slideAnimation.progress;
        const slideAmount = spacing * progress;
        
        // Draw previous player moves shifted left during animation
        if (gameState.previousPlayerMoves.length > 0) {
            gameState.previousPlayerMoves.forEach((move, index) => {
                const playerMoveSVG = getMoveSVG(move, true);
                if (playerMoveSVG.complete) {
                    const moveWidth = (playerMoveSVG.width / playerMoveSVG.height) * playerCardHeight;
                    
                    // Calculate position (further left for older moves)
                    const centerPlayerX = (canvas.width - moveWidth) / 2;
                    // Shift all previous moves left during animation
                    const posX = centerPlayerX - spacing * (index + 1) - slideAmount;
                    
                    // Calculate size reduction for history items (85% of original size)
                    const historyScale = 0.85;
                    const historyHeight = playerCardHeight * historyScale;
                    const historyWidth = moveWidth * historyScale;
                    
                    // Adjust Y position to maintain vertical centering with reduced size
                    const yOffset = (playerCardHeight - historyHeight) / 2;
                    const historyY = playerFinalY + yOffset;
                    
                    // Adjust X position to account for width difference
                    const xOffset = (moveWidth - historyWidth) / 2;
                    const adjustedPosX = posX + xOffset;
                    
                    // Draw border if we have previous outcomes stored - using same opacity as cards
                    if (gameState.previousOutcomes.length > index) {
                        const outcome = gameState.previousOutcomes[index];
                        if (outcome && borderColors[outcome]) {
                            drawRoundedBorder(
                                adjustedPosX - borderWidth/2, 
                                historyY - borderWidth/2,
                                historyWidth + borderWidth, 
                                historyHeight + borderWidth,
                                borderColors[outcome],
                                borderRadius,
                                0.4 // Same opacity as history cards
                            );
                        }
                    }
                    
                    // Apply fixed opacity to ALL history items during animation too
                    ctx.globalAlpha = 0.4;
                    
                    // Draw with reduced opacity and size during animation
                    ctx.drawImage(playerMoveSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                    
                    // Reset opacity
                    ctx.globalAlpha = 1.0;
                }
            });
        }
        
        // If there's a player move to slide, draw it moving left
        if (gameState.playerMove) {
            const playerMoveSVG = getMoveSVG(gameState.playerMove, true);
            if (playerMoveSVG.complete) {
                const moveWidth = (playerMoveSVG.width / playerMoveSVG.height) * playerCardHeight;
                
                // Start at center, move to left
                const startX = (canvas.width - moveWidth) / 2;
                const endX = startX - spacing;
                const currentX = startX + (endX - startX) * progress;
                
                // Calculate the current opacity as we fade toward history opacity
                const targetOpacity = 0.4; // Same as other history items
                const currentOpacity = 1.0 - (progress * (1.0 - targetOpacity));
                
                // Calculate size reduction for history items (85% of original size)
                const historyScale = 0.85;
                const historyHeight = playerCardHeight * historyScale;
                const historyWidth = moveWidth * historyScale;
                
                // Adjust Y position to maintain vertical centering with reduced size
                const yOffset = (playerCardHeight - historyHeight) / 2;
                const historyY = playerFinalY + yOffset;
                
                // Adjust X position to account for width difference
                const xOffset = (moveWidth - historyWidth) / 2;
                const adjustedPosX = currentX + xOffset;
                
                // Draw border for current outcome before sliding - with fading opacity
                if (gameState.outcome && borderColors[gameState.outcome]) {
                    drawRoundedBorder(
                        adjustedPosX - borderWidth/2, 
                        historyY - borderWidth/2,
                        historyWidth + borderWidth, 
                        historyHeight + borderWidth,
                        borderColors[gameState.outcome],
                        borderRadius,
                        currentOpacity // Use same opacity as the card
                    );
                }
                
                // Gradually fade to target opacity during animation
                ctx.globalAlpha = currentOpacity;
                
                // Draw with gradually reducing opacity and size
                ctx.drawImage(playerMoveSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                
                // Reset opacity
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw previous results shifted left during animation
        if (gameState.previousResults.length > 0) {
            gameState.previousResults.forEach((result, index) => {
                const resultSVG = getMoveSVG(result, false);
                if (resultSVG.complete) {
                    // Calculate position (further left for older results)
                    const posX = centerX - spacing * (index + 1) - slideAmount;
                    
                    // Calculate size reduction for history items (85% of original size)
                    const historyScale = 0.85;
                    const historyHeight = hiddenHeight * historyScale;
                    const historyWidth = hiddenWidth * historyScale;
                    
                    // Adjust Y position to maintain vertical centering with reduced size
                    const yOffset = (hiddenHeight - historyHeight) / 2;
                    const historyY = centerY + yOffset;
                    
                    // Adjust X position to account for width difference
                    const xOffset = (hiddenWidth - historyWidth) / 2;
                    const adjustedPosX = posX + xOffset;
                    
                    // Draw border if we have previous outcomes stored - using same opacity as cards
                    if (gameState.previousOutcomes.length > index) {
                        const outcome = gameState.previousOutcomes[index];
                        if (outcome && borderColors[outcome]) {
                            drawRoundedBorder(
                                adjustedPosX - borderWidth/2, 
                                historyY - borderWidth/2,
                                historyWidth + borderWidth, 
                                historyHeight + borderWidth,
                                borderColors[outcome],
                                borderRadius,
                                0.4 // Same opacity as history cards
                            );
                        }
                    }
                    
                    // Apply fixed opacity to ALL history items during animation too
                    ctx.globalAlpha = 0.4;
                    
                    // Draw with reduced opacity and size during animation
                    ctx.drawImage(resultSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                    
                    // Draw multiplier for this history item - use false for isMain to get same positioning as hidden cards
                    if (gameState.previousMultipliers.length > index) {
                        drawMultiplier(adjustedPosX, historyY - 5, gameState.previousMultipliers[index], historyWidth, false);
                    }
                    
                    // Reset opacity
                    ctx.globalAlpha = 1.0;
                }
            });
        }
        
        // If there's a result to slide, draw it moving left
        if (gameState.serverMove && gameState.showResult) {
            const serverMoveSVG = getMoveSVG(gameState.serverMove, false);
            if (serverMoveSVG.complete) {
                // Start at center, move to left
                const startX = centerX;
                const endX = centerX - spacing;
                const currentX = startX + (endX - startX) * progress;
                
                // Calculate the current opacity as we fade toward history opacity
                const targetOpacity = 0.4; // Same as other history items
                const currentOpacity = 1.0 - (progress * (1.0 - targetOpacity));
                
                // Calculate size reduction for history items (85% of original size)
                const historyScale = 0.85;
                const historyHeight = hiddenHeight * historyScale;
                const historyWidth = hiddenWidth * historyScale;
                
                // Adjust Y position to maintain vertical centering with reduced size
                const yOffset = (hiddenHeight - historyHeight) / 2;
                const historyY = centerY + yOffset;
                
                // Adjust X position to account for width difference
                const xOffset = (hiddenWidth - historyWidth) / 2;
                const adjustedPosX = currentX + xOffset;
                
                // Draw border for current outcome before sliding - with fading opacity
                if (gameState.outcome && borderColors[gameState.outcome]) {
                    drawRoundedBorder(
                        adjustedPosX - borderWidth/2, 
                        historyY - borderWidth/2,
                        historyWidth + borderWidth, 
                        historyHeight + borderWidth,
                        borderColors[gameState.outcome],
                        borderRadius,
                        currentOpacity // Use same opacity as the card
                    );
                }
                
                // Gradually fade to target opacity during animation
                ctx.globalAlpha = currentOpacity;
                
                // Draw with gradually reducing opacity and size
                ctx.drawImage(serverMoveSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                
                // Reset opacity
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw sliding hidden cards row with multipliers
        if (hiddenChoiceSVG.complete) {
            // Draw each hidden card shifted to the left, starting with index 1 to skip the center position
            const numVisible = 6; // Number of visible hidden cards including center
            for (let i = 1; i < numVisible; i++) {
                const startX = centerX + (i * spacing);
                const currentX = startX - slideAmount;
                
                // Only draw if at least partially visible
                if (currentX + hiddenWidth > 0 && currentX < canvas.width) {
                    ctx.drawImage(hiddenChoiceSVG, currentX, centerY, hiddenWidth, hiddenHeight);
                    
                    // Draw future multiplier badge under card - using displayedWinCount instead of winCount
                    const multiplierIndex = Math.min(gameState.displayedWinCount + i - 1, MULTIPLIERS.length - 1);
                    const nextMultiplier = MULTIPLIERS[multiplierIndex];
                    drawMultiplier(currentX, centerY, nextMultiplier, hiddenWidth);
                }
            }
            
            // Draw a new card coming in from the right
            const newCardX = centerX + (numVisible * spacing) - slideAmount;
            if (newCardX < canvas.width + hiddenWidth) {
                ctx.drawImage(hiddenChoiceSVG, newCardX, centerY, hiddenWidth, hiddenHeight);
                
                // Draw multiplier badge under new card - using displayedWinCount instead of winCount
                const multiplierIndex = Math.min(gameState.displayedWinCount + numVisible - 1, MULTIPLIERS.length - 1);
                const nextMultiplier = MULTIPLIERS[multiplierIndex];
                drawMultiplier(newCardX, centerY, nextMultiplier, hiddenWidth);
            }
            
            // Draw the center card (only if we don't have a result to show)
            if (!gameState.serverMove || !gameState.showResult) {
                ctx.drawImage(hiddenChoiceSVG, centerX - slideAmount, centerY, hiddenWidth, hiddenHeight);
            }
        }
        
        // Draw main multiplier badge in the middle between house and player during animation
        const currentMultiplier = gameState.winCount > 0 ? MULTIPLIERS[gameState.winCount - 1] : 1.00;
        drawMultiplier(centerX - slideAmount, middleY, currentMultiplier, hiddenWidth, true);
    } else {
        // Regular (non-animated) drawing of cards and history
        
        // Draw previous player moves with reduced opacity (only when not animating)
        if (gameState.previousPlayerMoves.length > 0) {
            gameState.previousPlayerMoves.forEach((move, index) => {
                const playerMoveSVG = getMoveSVG(move, true);
                if (playerMoveSVG.complete) {
                    const moveWidth = (playerMoveSVG.width / playerMoveSVG.height) * playerCardHeight;
                    
                    // Calculate position (further left for older moves)
                    const centerPlayerX = (canvas.width - moveWidth) / 2;
                    const posX = centerPlayerX - spacing * (index + 1);
                    
                    // Calculate size reduction for history items (85% of original size)
                    const historyScale = 0.85;
                    const historyHeight = playerCardHeight * historyScale;
                    const historyWidth = moveWidth * historyScale;
                    
                    // Adjust Y position to maintain vertical centering with reduced size
                    const yOffset = (playerCardHeight - historyHeight) / 2;
                    const historyY = playerFinalY + yOffset;
                    
                    // Adjust X position to account for width difference
                    const xOffset = (moveWidth - historyWidth) / 2;
                    const adjustedPosX = posX + xOffset;
                    
                    // Draw border if we have previous outcomes stored - using same opacity as cards
                    if (gameState.previousOutcomes.length > index) {
                        const outcome = gameState.previousOutcomes[index];
                        if (outcome && borderColors[outcome]) {
                            drawRoundedBorder(
                                adjustedPosX - borderWidth/2, 
                                historyY - borderWidth/2,
                                historyWidth + borderWidth, 
                                historyHeight + borderWidth,
                                borderColors[outcome],
                                borderRadius,
                                0.4 // Same opacity as history cards
                            );
                        }
                    }
                    
                    // Use fixed opacity values for all previous moves
                    // Always apply opacity regardless of index
                    ctx.globalAlpha = 0.4;
                    
                    // Draw the previous move with reduced size
                    ctx.drawImage(playerMoveSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                    
                    // Reset opacity
                    ctx.globalAlpha = 1.0;
                }
            });
        }
        
        // If game is active and player made a move, show their choice with animation
        if (gameState.active && gameState.playerMove) {
            const playerMoveSVG = getMoveSVG(gameState.playerMove, true);
            if (playerMoveSVG.complete) {
                const moveWidth = (playerMoveSVG.width / playerMoveSVG.height) * playerCardHeight;
                
                // Final position for the player move on the player base
                const finalX = (canvas.width - moveWidth) / 2;
                
                if (gameState.playerAnimation.active) {
                    // Sliding animation from bottom of canvas
                    const progress = gameState.playerAnimation.progress;
                    // Start offscreen below canvas and slide up to final position
                    const startY = canvas.height + playerCardHeight / 2;
                    const currentY = startY + (playerFinalY - startY) * progress;
                    
                    // Draw at current position (full size for active cards)
                    ctx.drawImage(playerMoveSVG, finalX, currentY, moveWidth, playerCardHeight);
                } else {
                    // Draw at final position when animation is done (full size for active cards)
                    ctx.drawImage(playerMoveSVG, finalX, playerFinalY, moveWidth, playerCardHeight);
                }
            }
        }
        
        // Draw previous results on the left side with reduced opacity (only when not animating)
        if (gameState.previousResults.length > 0) {
            gameState.previousResults.forEach((result, index) => {
                const resultSVG = getMoveSVG(result, false);
                if (resultSVG.complete) {
                    // Calculate position (further left for older results)
                    const posX = centerX - spacing * (index + 1);
                    
                    // Calculate size reduction for history items (85% of original size)
                    const historyScale = 0.85;
                    const historyHeight = hiddenHeight * historyScale;
                    const historyWidth = hiddenWidth * historyScale;
                    
                    // Adjust Y position to maintain vertical centering with reduced size
                    const yOffset = (hiddenHeight - historyHeight) / 2;
                    const historyY = centerY + yOffset;
                    
                    // Adjust X position to account for width difference
                    const xOffset = (hiddenWidth - historyWidth) / 2;
                    const adjustedPosX = posX + xOffset;
                    
                    // Draw border if we have previous outcomes stored - using same opacity as cards
                    if (gameState.previousOutcomes.length > index) {
                        const outcome = gameState.previousOutcomes[index];
                        if (outcome && borderColors[outcome]) {
                            drawRoundedBorder(
                                adjustedPosX - borderWidth/2, 
                                historyY - borderWidth/2,
                                historyWidth + borderWidth, 
                                historyHeight + borderWidth,
                                borderColors[outcome],
                                borderRadius,
                                0.4 // Same opacity as history cards
                            );
                        }
                    }
                    
                    // Use fixed opacity values for all previous results
                    ctx.globalAlpha = 0.4;
                    
                    // Draw the previous result with reduced size
                    ctx.drawImage(resultSVG, adjustedPosX, historyY, historyWidth, historyHeight);
                    
                    // Draw multiplier for this history item - use false for isMain to get same positioning as hidden cards
                    if (gameState.previousMultipliers.length > index) {
                        drawMultiplier(adjustedPosX, historyY - 5, gameState.previousMultipliers[index], historyWidth, false);
                    }
                    
                    // Reset opacity
                    ctx.globalAlpha = 1.0;
                }
            });
        }
        
        // Middle card logic - explicitly decide based on our flags
        if (gameState.flipAnimation.active) {
            // Draw the flip animation for the middle card only
            const progress = gameState.flipAnimation.progress;
            
            if (progress < 0.5) {
                // First half of animation - hidden card flipping to vertical
                const scaleX = 1 - progress * 2; // Scale from 1 to 0
                
                ctx.save();
                ctx.translate(centerX + hiddenWidth / 2, centerY + hiddenHeight / 2);
                ctx.scale(scaleX, 1);
                ctx.translate(-(centerX + hiddenWidth / 2), -(centerY + hiddenHeight / 2));
                ctx.drawImage(hiddenChoiceSVG, centerX, centerY, hiddenWidth, hiddenHeight);
                ctx.restore();
            } else {
                // Second half of animation - result card flipping from vertical
                const scaleX = (progress - 0.5) * 2; // Scale from 0 to 1
                const serverMoveSVG = getMoveSVG(gameState.serverMove, false);
                
                if (serverMoveSVG.complete) {
                    ctx.save();
                    ctx.translate(centerX + hiddenWidth / 2, centerY + hiddenHeight / 2);
                    ctx.scale(scaleX, 1);
                    ctx.translate(-(centerX + hiddenWidth / 2), -(centerY + hiddenHeight / 2));
                    ctx.drawImage(serverMoveSVG, centerX, centerY, hiddenWidth, hiddenHeight);
                    ctx.restore();
                }
            }
        } else if (gameState.showResult) {
            // Explicitly show the result when our flag says so
            const serverMoveSVG = getMoveSVG(gameState.serverMove, false);
            if (serverMoveSVG.complete) {
                // Draw border for current outcome in center position - full opacity
                if (gameState.outcome && borderColors[gameState.outcome]) {
                    drawRoundedBorder(
                        centerX - borderWidth/2, 
                        centerY - borderWidth/2,
                        hiddenWidth + borderWidth, 
                        hiddenHeight + borderWidth,
                        borderColors[gameState.outcome],
                        borderRadius,
                        1.0 // Full opacity for active result
                    );
                }
                
                ctx.drawImage(serverMoveSVG, centerX, centerY, hiddenWidth, hiddenHeight);
            }
            
            // Draw player move with outcome border too (when showing result)
            if (gameState.playerMove) {
                const playerMoveSVG = getMoveSVG(gameState.playerMove, true);
                if (playerMoveSVG.complete) {
                    const moveWidth = (playerMoveSVG.width / playerMoveSVG.height) * playerCardHeight;
                    const playerX = (canvas.width - moveWidth) / 2;
                    
                    // Draw border for current outcome for player move - full opacity
                    if (gameState.outcome && borderColors[gameState.outcome]) {
                        drawRoundedBorder(
                            playerX - borderWidth/2, 
                            playerFinalY - borderWidth/2,
                            moveWidth + borderWidth, 
                            playerCardHeight + borderWidth,
                            borderColors[gameState.outcome],
                            borderRadius,
                            1.0 // Full opacity for active result
                        );
                    }
                    
                    // Draw active player card at full size
                    ctx.drawImage(playerMoveSVG, playerX, playerFinalY, moveWidth, playerCardHeight);
                }
            }
        } else {
            // Show hidden card otherwise
            if (hiddenChoiceSVG.complete) {
                ctx.drawImage(hiddenChoiceSVG, centerX, centerY, hiddenWidth, hiddenHeight);
            }
        }
        
        // Draw additional hidden options to the right with future multipliers
        if (hiddenChoiceSVG.complete) {
            const numAdditional = 5; // Number of additional hidden options
            
            for (let i = 1; i <= numAdditional; i++) {
                const rightX = centerX + (spacing * i);
                // Only draw if at least partially visible on screen
                if (rightX < canvas.width + hiddenWidth) {
                    ctx.drawImage(hiddenChoiceSVG, rightX, centerY, hiddenWidth, hiddenHeight);
                    
                    // Draw future multiplier badge under card - using displayedWinCount instead of winCount
                    const multiplierIndex = Math.min(gameState.displayedWinCount + i - 1, MULTIPLIERS.length - 1);
                    const nextMultiplier = MULTIPLIERS[multiplierIndex];
                    drawMultiplier(rightX, centerY, nextMultiplier, hiddenWidth);
                }
            }
        }
        
        // Draw main multiplier badge in the middle between house and player
        const currentMultiplier = gameState.winCount > 0 ? MULTIPLIERS[gameState.winCount - 1] : 1.00;
        drawMultiplier(centerX, middleY, currentMultiplier, hiddenWidth, true);
    }
}

// Animation loop for animations
function animationLoop(timestamp) {
    let needsRedraw = false;
    
    // Handle flip animation
    if (gameState.flipAnimation.active) {
        if (gameState.flipAnimation.startTime === 0) {
            gameState.flipAnimation.startTime = timestamp;
        }
        
        const elapsed = timestamp - gameState.flipAnimation.startTime;
        gameState.flipAnimation.progress = Math.min(elapsed / gameState.flipAnimation.duration, 1);
        needsRedraw = true;
        
        if (gameState.flipAnimation.progress >= 1) {
            // Animation completed - deactivate animation and explicitly set showResult flag
            gameState.flipAnimation.active = false;
            gameState.flipAnimation.startTime = 0;
            gameState.showResult = true; // Explicitly set flag to show result
        }
    }
    
    // Handle player animation
    if (gameState.playerAnimation.active) {
        if (gameState.playerAnimation.startTime === 0) {
            gameState.playerAnimation.startTime = timestamp;
        }
        
        const elapsed = timestamp - gameState.playerAnimation.startTime;
        gameState.playerAnimation.progress = Math.min(elapsed / gameState.playerAnimation.duration, 1);
        needsRedraw = true;
        
        if (gameState.playerAnimation.progress >= 1) {
            // Animation completed
            gameState.playerAnimation.active = false;
            gameState.playerAnimation.startTime = 0;
        }
    }
    
    // Handle slide animation
    if (gameState.slideAnimation.active) {
        if (gameState.slideAnimation.startTime === 0) {
            gameState.slideAnimation.startTime = timestamp;
        }
        
        const elapsed = timestamp - gameState.slideAnimation.startTime;
        gameState.slideAnimation.progress = Math.min(elapsed / gameState.slideAnimation.duration, 1);
        needsRedraw = true;
        
        if (gameState.slideAnimation.progress >= 1) {
            // Animation completed
            gameState.slideAnimation.active = false;
            gameState.slideAnimation.startTime = 0;
            
            // Update history before we reset current state
            
            // Add current outcome to previous outcomes if it exists
            if (gameState.outcome) {
                // Add to the front of the array (most recent first)
                gameState.previousOutcomes.unshift(gameState.outcome);
                
                // Limit to 3 previous outcomes (same as other history arrays)
                if (gameState.previousOutcomes.length > 3) {
                    gameState.previousOutcomes.pop();
                }
            }
            
            // Add current result to previous results if it exists
            if (gameState.serverMove) {
                // Add to the front of the array (most recent first)
                gameState.previousResults.unshift(gameState.serverMove);
                
                // Limit to 3 previous results
                if (gameState.previousResults.length > 3) {
                    gameState.previousResults.pop();
                }
            }
            
            // Add current player move to previous moves if it exists
            if (gameState.playerMove) {
                // Add to the front of the array (most recent first)
                gameState.previousPlayerMoves.unshift(gameState.playerMove);
                
                // Limit to 3 previous moves
                if (gameState.previousPlayerMoves.length > 3) {
                    gameState.previousPlayerMoves.pop();
                }
            }
            
            // Add current multiplier to previous multipliers
            if (gameState.currentMultiplier) {
                // Add to the front of the array (most recent first)
                gameState.previousMultipliers.unshift(gameState.currentMultiplier);
                
                // Limit to 3 previous multipliers
                if (gameState.previousMultipliers.length > 3) {
                    gameState.previousMultipliers.pop();
                }
            }
            
            // NOW update the displayed win count to match the actual win count
            gameState.displayedWinCount = gameState.winCount;
            
            // Reset current result display after slide is complete, but keep outcome for wins and ties
            gameState.showResult = false;
            gameState.serverMove = null;
            gameState.playerMove = null;
            
            // Only reset outcome for losses - keep it for wins and ties
            if (gameState.outcome === 'lose') {
                gameState.outcome = null;
            }
            
            // Force a redraw to ensure opacity is applied correctly
            drawGame();
        }
    }
    
    // Only redraw if needed
    if (needsRedraw) {
        drawGame();
        
        // Continue animation loop if any animation is still active
        if (gameState.flipAnimation.active || gameState.playerAnimation.active || gameState.slideAnimation.active) {
            requestAnimationFrame(animationLoop);
        }
    }
}

// Start flip animation
function startFlipAnimation() {
    gameState.flipAnimation.active = true;
    gameState.flipAnimation.startTime = 0;
    gameState.flipAnimation.progress = 0;
    requestAnimationFrame(animationLoop);
}

// Start player animation
function startPlayerAnimation() {
    gameState.playerAnimation.active = true;
    gameState.playerAnimation.startTime = 0;
    gameState.playerAnimation.progress = 0;
    requestAnimationFrame(animationLoop);
}

// Start slide animation
function startSlideAnimation() {
    gameState.slideAnimation.active = true;
    gameState.slideAnimation.startTime = 0;
    gameState.slideAnimation.progress = 0;
    requestAnimationFrame(animationLoop);
}

// Handle responsive canvas sizing
function resizeCanvas() {
    // Get the computed style of the canvas to respect CSS styling
    const computedStyle = getComputedStyle(canvas);
    const width = parseInt(computedStyle.width, 10);
    const height = parseInt(computedStyle.height, 10);
    
    // Set the canvas dimensions to match its display size
    canvas.width = width;
    canvas.height = height;
    
    // Redraw the canvas content after resize
    drawGame();
}

// Add these helper functions at the top of the file, after existing functions

// Helper function to show win message with error handling
function displayWinMessage(multiplier, amount, currency) {
    try {
        const winMessage = document.querySelector('.win-message');
        const multiplierElement = document.querySelector('.win-message .multiplier');
        const amountElement = document.querySelector('.win-message .amount');
        
        // Handle potential undefined values safely
        const safeMultiplier = typeof multiplier === 'number' ? multiplier : 1.0;
        
        // Set content with safe values
        multiplierElement.textContent = `${safeMultiplier.toFixed(2)}x`;
        amountElement.textContent = formatCurrencyAmount(amount, currency);
        
        // Make visible
        winMessage.classList.add('visible');
    } catch (err) {
        console.error('Error displaying win message:', err);
    }
}

// Helper function to hide win message
function hideWinMessage() {
    try {
        const winMessage = document.querySelector('.win-message');
        if (winMessage) {
            winMessage.classList.remove('visible');
        }
    } catch (err) {
        console.error('Error hiding win message:', err);
    }
}

// Start a new game
async function startGame() {
    // First reset the UI completely
    resetGameUI();
    
    // Hide win message when starting a new game
    hideWinMessage();
    
    // Get bet amount and currency
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = document.getElementById('currency').value;
    
    try {
        // Call backend to start game
        const response = await fetch('/games/rps/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ betAmount, currency })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error(data.error || 'Failed to start game');
            return;
        }
        
        // Update UI for game started
        gameState.active = true;
        gameState.winCount = 0;
        gameState.displayedWinCount = 0; // Initialize displayed win count
        gameState.tieCount = 0;
        gameState.gameOver = false;
        gameState.playerMove = null;
        gameState.serverMove = null;
        gameState.outcome = null;
        gameState.currentMultiplier = 1.00; // Reset to default multiplier
        
        // Update buttons
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('cashoutBtn').style.display = 'block';
        
        // Disable cashout button initially (need at least 1 win)
        const cashoutBtn = document.getElementById('cashoutBtn');
        cashoutBtn.disabled = true;
        cashoutBtn.style.opacity = 0.5;
        
        // Enable RPS buttons
        const rpsButtons = document.querySelectorAll('.rps-btn');
        rpsButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = 1;
        });
        
        // Update balance display using navbar function
        if (window.updateNavbarBalance) {
            window.updateNavbarBalance(currency, data.balance);
        }
        
        // Update profit on win
        const potentialWin = betAmount * data.gameState.currentMultiplier;
        document.getElementById('profitOnWin').textContent = formatCurrencyAmount(potentialWin, currency);
        
        // Redraw canvas
        drawGame();
        
    } catch (err) {
        console.error('Error starting game:', err);
    }
}

// Make a bet
async function placeBet(move) {
    if (!gameState.active || gameState.revealInProgress) return;
    
    // Update local state first
    gameState.playerMove = move;
    gameState.showResult = false; // Reset the show result flag
    
    // Disable RPS buttons during animation
    const rpsButtons = document.querySelectorAll('.rps-btn');
    rpsButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = 0.5;
    });
    
    // Start the player animation
    startPlayerAnimation();
    
    try {
        // Call backend to place bet
        const response = await fetch('/games/rps/bet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerMove: move })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Failed to place bet');
            
            // Re-enable RPS buttons if there's an error
            if (gameState.active) {
                rpsButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = 1;
                });
            }
            return;
        }
        
        // Start reveal process after player animation completes
        setTimeout(() => {
            gameState.revealInProgress = true;
            
            // Store the results from backend
            gameState.serverMove = data.serverMove;
            gameState.outcome = data.outcome;
            gameState.winCount = data.winCount;
            gameState.tieCount = data.tieCount;
            gameState.gameOver = data.gameOver;
            
            // Update current multiplier
            gameState.currentMultiplier = data.winCount > 0 ? MULTIPLIERS[data.winCount - 1] : 1.00;
            
            // Start the flip animation to reveal the result
            startFlipAnimation();
            
            // After flip animation completes, proceed with game flow
            setTimeout(() => {
                gameState.revealInProgress = false;
                
                // Update UI
                if (gameState.gameOver) {
                    // Handle game over
                    if (data.outcome === 'lose') {
                        // Game lost - don't do slide animation for loss
                        // Just update UI for game over without resetting visuals
                        document.getElementById('playBtn').style.display = 'block';
                        document.getElementById('cashoutBtn').style.display = 'none';
                        
                        // Disable RPS buttons when game is over due to loss
                        const rpsButtons = document.querySelectorAll('.rps-btn');
                        rpsButtons.forEach(btn => {
                            btn.disabled = true;
                            btn.style.opacity = 0.5;
                        });
                        
                        // Keep the game state for visual display, but mark it as inactive
                        gameState.active = false;
                    } else if (data.maxWinReached && data.autoWinApplied) {
                        // Max wins reached with auto-win applied
                        
                        
                        // Display win message with safe value
                        displayWinMessage(data.currentMultiplier || MULTIPLIERS[MULTIPLIERS.length - 1], data.winAmount, data.currency);
                        
                        // Update the balance display using navbar function
                        if (window.updateNavbarBalance) {
                            window.updateNavbarBalance(data.currency, data.balance);
                        }
                        
                        // Show play button and hide cashout button
                        document.getElementById('playBtn').style.display = 'block';
                        document.getElementById('cashoutBtn').style.display = 'none';
                        
                        // Disable RPS buttons
                        const rpsButtons = document.querySelectorAll('.rps-btn');
                        rpsButtons.forEach(btn => {
                            btn.disabled = true;
                            btn.style.opacity = 0.5;
                        });
                        
                        // Mark game as inactive but keep the visual state
                        gameState.active = false;
                        
                        // No slide animation - keep the final state visible
                    } else {
                        // Other game over cases (shouldn't happen with new logic, but kept for safety)
                        document.getElementById('playBtn').style.display = 'block';
                        document.getElementById('cashoutBtn').style.display = 'none';
                        
                        // Disable RPS buttons
                        const rpsButtons = document.querySelectorAll('.rps-btn');
                        rpsButtons.forEach(btn => {
                            btn.disabled = true;
                            btn.style.opacity = 0.5;
                        });
                        
                        // Start slide animation after a brief pause to show the result
                        setTimeout(() => {
                            // Start the slide animation to move result left and shift cards
                            startSlideAnimation();
                        }, 1000);
                    }
                } else {
                    // Not game over, continue with normal flow
                    
                    // Enable cashout button after first win
                    if (data.winCount >= 1 && document.getElementById('cashoutBtn').disabled) {
                        const cashoutBtn = document.getElementById('cashoutBtn');
                        cashoutBtn.disabled = false;
                        cashoutBtn.style.opacity = 1;
                    }
                    
                    // Update profit on win for next round
                    const betAmount = parseFloat(document.getElementById('betAmount').value);
                    const currency = document.getElementById('currency').value;
                    const potentialWin = betAmount * data.currentMultiplier;
                    document.getElementById('profitOnWin').textContent = formatCurrencyAmount(potentialWin, currency);
                    
                    // Start slide animation after a brief pause to show the result
                    setTimeout(() => {
                        // Start the slide animation to move result left and shift cards
                        startSlideAnimation();
                        
                        // Reset for next round if game not over (player's move only)
                        setTimeout(() => {
                            // Player move is now reset by the slide animation completion
                            drawGame();
                            
                            // Re-enable RPS buttons after all animations are complete if game is still active
                            if (gameState.active) {
                                const rpsButtons = document.querySelectorAll('.rps-btn');
                                rpsButtons.forEach(btn => {
                                    btn.disabled = false;
                                    btn.style.opacity = 1;
                                });
                            }
                        }, gameState.slideAnimation.duration + 500);
                    }, 1000);
                }
                
            }, gameState.flipAnimation.duration + 150); // Add extra time to ensure animation finishes completely
        }, gameState.playerAnimation.duration); // Wait for player animation to complete
        
    } catch (err) {
        console.error('Error placing bet:', err);
        alert('Error placing bet. Please try again.');
        
        // Re-enable RPS buttons if there's an error
        if (gameState.active) {
            rpsButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = 1;
            });
        }
    }
}

// Cash out
async function cashout() {
    if (!gameState.active) return;
    
    try {
        // Call backend to cash out
        const response = await fetch('/games/rps/cashout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle specific error for losing
            if (data.error === 'Cannot cash out after losing') {
                alert('You cannot cash out after losing. Start a new game.');
            } else {
                alert(data.error || 'Failed to cash out');
            }
            return;
        }
        
        
        // Display win message with safe value
        const multiplier = gameState.winCount > 0 && gameState.winCount <= MULTIPLIERS.length 
            ? MULTIPLIERS[gameState.winCount - 1] 
            : 1.0;
        displayWinMessage(multiplier, data.winAmount, data.currency);
        
        // Update balance using navbar function
        if (window.updateNavbarBalance) {
            window.updateNavbarBalance(data.currency, data.balance);
        }
        
        // Reset UI
        resetGameUI();
        
    } catch (err) {
        console.error('Error cashing out:', err);
        alert('Error cashing out. Please try again.');
    }
}

// Reset UI after game ends
function resetGameUI() {
    gameState.active = false;
    gameState.winCount = 0;
    gameState.displayedWinCount = 0; // Reset displayed win count
    gameState.tieCount = 0;
    gameState.gameOver = false;
    gameState.playerMove = null;
    gameState.serverMove = null;
    gameState.outcome = null;
    gameState.showResult = false; // Reset the show result flag
    gameState.previousResults = []; // Clear previous results
    gameState.previousPlayerMoves = []; // Clear previous player moves
    gameState.previousOutcomes = []; // Clear previous outcomes
    gameState.previousMultipliers = []; // Clear previous multipliers
    gameState.currentMultiplier = 1.00; // Reset to default multiplier
    gameState.flipAnimation.active = false;
    gameState.playerAnimation.active = false;
    gameState.slideAnimation.active = false;
    
    // Reset buttons
    document.getElementById('playBtn').style.display = 'block';
    document.getElementById('cashoutBtn').style.display = 'none';
    document.getElementById('cashoutBtn').style.backgroundColor = '#2196F3';
    document.getElementById('cashoutBtn').textContent = 'Cashout';
    
    // Disable RPS buttons and reduce opacity when game is not active
    const rpsButtons = document.querySelectorAll('.rps-btn');
    rpsButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = 0.5;
    });
    
    // Redraw canvas
    drawGame();
}

// Add event listeners
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('cashoutBtn').addEventListener('click', cashout);

// Add event listeners to RPS buttons
const rpsButtons = document.querySelectorAll('.rps-btn');
rpsButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        if (!gameState.active || gameState.revealInProgress) return;
        
        const move = btn.textContent.split(' ')[0].toLowerCase();
        placeBet(move);
    });
});

// Make sure the SVGs are loaded before drawing
playerBaseSVG.onload = function() {
    drawGame();
};

hiddenChoiceSVG.onload = function() {
    drawGame();
};

// Initialize canvas after all resources are defined
window.addEventListener('load', function() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// ─── Sync currency selection between navbar and game controls ────────────────
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
            const limits = getBetLimits(currency);
            betAmountInput.value = limits.min;
            updateProfitOnWin();
        });
    });

    // When user changes the controls' currency select, update the navbar
    currencySelect.addEventListener('change', () => {
        const currency = currencySelect.value;
        // Find the corresponding navbar dropdown item
        const matchingItem = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
        if (matchingItem) {
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
        // Set bet amount to min for this currency
        const limits = getBetLimits(currency);
        betAmountInput.value = limits.min;
        updateProfitOnWin();
    });
}

// Helper to update profit on win display
function updateProfitOnWin() {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = document.getElementById('currency').value;
    // Use current multiplier (or 1.00 if not started)
    const multiplier = gameState.currentMultiplier || 1.00;
    const profit = betAmount * multiplier;
    document.getElementById('profitOnWin').textContent = formatCurrencyAmount(profit, currency);
}

// Helper to get bet limits for the selected currency
function getBetLimits(currency) {
    return BET_LIMITS[currency] || BET_LIMITS['USD'];
}

// Validate and auto-adjust bet amount input
function validateBetAmount() {
    const betAmountInput = document.getElementById('betAmount');
    const currency = document.getElementById('currency').value;
    let value = parseFloat(betAmountInput.value);
    const limits = getBetLimits(currency);

    // Handle empty or non-numeric input
    if (isNaN(value)) {
        value = limits.min;
    }

    // Enforce min/max constraints
    if (value < limits.min) value = limits.min;
    if (value > limits.max) value = limits.max;

    // Update input if changed
    betAmountInput.value = value;
    updateProfitOnWin();
}

// Initialize currency sync after page load
window.addEventListener('DOMContentLoaded', () => {
    syncCurrencySelections();
    const betAmountInput = document.getElementById('betAmount');
    betAmountInput.addEventListener('blur', validateBetAmount);
    betAmountInput.addEventListener('change', validateBetAmount);
});
