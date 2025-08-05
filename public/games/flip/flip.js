// Helper functions //

// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
    if (currency === 'USD') {
      // Format USD with commas and $ symbol
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'LBP') {
      // Format LBP with commas and £ symbol
      return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return amount.toString();
}

  // ─── A) Helper: getSession (same as other games) ────────────────
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

///////////////////////////////////////////////////////// Game Logic - canvas setup ////////////////////////////////////////////////////////////

// Canvas setup
const canvas = document.getElementById('flipCanvas');
const ctx = canvas.getContext('2d');

// Coin colors
const HEADS_COLOR = '#ffa127';
const TAILS_COLOR = '#4d74fa';

// Game state
let currentSide = 'heads'; // 'heads' or 'tails'
let isFlipping = false;

// Draw circular coin
function drawCoin() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.3;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw coin circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = currentSide === 'heads' ? HEADS_COLOR : TAILS_COLOR;
  ctx.fill();
  
  if (currentSide === 'heads') {
    // Draw inner circle for heads
    const innerRadius = radius * 0.45;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#071823';
    ctx.fill();
  } else {
    // Draw inner square for tails
    const squareSize = radius * 0.9;
    const squareX = centerX - squareSize / 2;
    const squareY = centerY - squareSize / 2;
    ctx.beginPath();
    ctx.rect(squareX, squareY, squareSize, squareSize);
    ctx.fillStyle = '#071823';
    ctx.fill();
  }
}

// Initialize canvas
function initCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawCoin();
}

// Flip animation variables - using same constants as coinflip.js
const flipDuration = 700; // 500ms like coinflip
const totalSpins = 2;     // 2 spins like coinflip

// Flip the coin
function flipCoin() {
  if (isFlipping) return;
  
  isFlipping = true;
  
  // Randomly determine result
  const newSide = Math.random() < 0.5 ? 'heads' : 'tails';
  currentSide = newSide;
  
  // Disable play button during flip
  const playBtn = document.getElementById('playBtn');
  playBtn.disabled = true;
  playBtn.textContent = 'Flipping...';
  
  // Start animation
  const start = performance.now();
  let animationFinished = false;
  
  const animate = (now) => {
    const progress = now - start;
    const normalizedProgress = progress / flipDuration;
    
    // Create tension by slowing down the last 25% of the animation
    let easedProgress;
    if (normalizedProgress < 0.75) {
      // First 75% - normal speed
      easedProgress = normalizedProgress / 0.75;
    } else {
      // Last 25% - slower for tension
      const remainingProgress = (normalizedProgress - 0.75) / 0.25;
      easedProgress = 0.75 + (remainingProgress * 0.25);
    }
    
    const rotation = easedProgress * 360 * totalSpins;
    
    // Draw coin at current rotation
    drawCoinAtRotation(rotation);
    
    if (progress < flipDuration) {
      requestAnimationFrame(animate);
    } else {
      animationFinished = true;
      finalizeFlip();
    }
  };
  
  requestAnimationFrame(animate);
  
  function finalizeFlip() {
    // Ensure final state matches the result
    const finalRotation = newSide === 'heads' ? 0 : 180;
    drawCoinAtRotation(finalRotation);
    
    // Re-enable play button
    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
    
    isFlipping = false;
  }
}

// Draw coin at specific rotation
function drawCoinAtRotation(rotation) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.3;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Save context for transform
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Apply horizontal rotation (like rotateY in CSS)
  const cos = Math.cos(rotation * Math.PI / 180);
  const scaleX = Math.abs(cos);
  
  // Scale the coin horizontally to create flip effect
  ctx.scale(scaleX, 1);
  
  // Determine which side to show based on rotation
  const sideToShow = Math.floor(rotation / 180) % 2 === 0 ? 'heads' : 'tails';
  
  // Draw coin
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = sideToShow === 'heads' ? HEADS_COLOR : TAILS_COLOR;
  ctx.fill();
  
  if (sideToShow === 'heads') {
    // Draw inner circle for heads
    const innerRadius = radius * 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#071823';
    ctx.fill();
  } else {
    // Draw inner square for tails
    const squareSize = radius * 0.9;
    const squareX = -squareSize / 2;
    const squareY = -squareSize / 2;
    ctx.beginPath();
    ctx.rect(squareX, squareY, squareSize, squareSize);
    ctx.fillStyle = '#071823';
    ctx.fill();
  }
  
  ctx.restore();
}

// Game state
let gameActive = false;
let currentChoice = null;
let currentMultiplier = 1;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  window.addEventListener('resize', initCanvas);
  
  // Initialize choice buttons as disabled
  document.getElementById('headsBtn').disabled = true;
  document.getElementById('tailsBtn').disabled = true;
  
  // Play button click - start game
  document.getElementById('playBtn').addEventListener('click', startGame);
  
  // Cashout button click
  document.getElementById('cashoutBtn').addEventListener('click', cashoutGame);
  
  // Heads and Tails buttons
  const headsBtn = document.getElementById('headsBtn');
  const tailsBtn = document.getElementById('tailsBtn');
  
  headsBtn.addEventListener('click', () => {
    if (!gameActive) return;
    
    currentChoice = 'heads';
    
    // Make flip
    makeFlip('heads');
  });
  
  tailsBtn.addEventListener('click', () => {
    if (!gameActive) return;
    
    currentChoice = 'tails';
    
    // Make flip
    makeFlip('tails');
  });
});

// Start game function
async function startGame() {
  const playBtn = document.getElementById('playBtn');
  
  // Prevent double-clicking
  if (playBtn.disabled) {
    return;
  }
  
  try {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const currency = document.getElementById('currency').value;
    
    if (!betAmount || betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }
    
    // Disable button immediately
    playBtn.disabled = true;
    
    // Get current balance from navbar
    const balanceBox = document.getElementById('selected-balance');
    if (!balanceBox) {
      alert('Unable to get balance');
      return;
    }
    
    // Parse current balance
    const balanceText = balanceBox.textContent;
    const currencySymbol = currency === 'USD' ? '$' : '£';
    const currentBalance = parseFloat(balanceText.replace(currencySymbol, '').replace(/,/g, ''));
    
    // Check if user has enough funds
    if (currentBalance < betAmount) {
      alert('Insufficient balance');
      return;
    }
    
    // Call backend to start game
    const response = await fetch('/games/flip/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        betAmount,
        currency
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Deduct bet amount visually
      const newBalance = currentBalance - betAmount;
      balanceBox.textContent = formatBalance(newBalance, currency);
      
      // Start game
      gameActive = true;
      currentMultiplier = 1;
      
      // Switch buttons
      document.getElementById('playBtn').style.display = 'none';
      document.getElementById('cashoutBtn').style.display = 'block';
      document.getElementById('cashoutBtn').disabled = true; // Initially disabled
      
      // Enable choice buttons
      document.getElementById('headsBtn').disabled = false;
      document.getElementById('tailsBtn').disabled = false;
      
      // Show and update profit display
      updateProfitDisplay();
    } else {
      // Failed to start game
      playBtn.disabled = false;
    }
    
  } catch (err) {
    console.error('Start game error:', err);
    playBtn.disabled = false;
  }
}

// Make flip function
async function makeFlip(choice) {
  try {
    const headsBtn = document.getElementById('headsBtn');
    const tailsBtn = document.getElementById('tailsBtn');
    
    // Disable buttons during flip
    headsBtn.disabled = true;
    tailsBtn.disabled = true;
    
    const response = await fetch('/games/flip/flip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        choice
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Start flip animation with the result from backend
      flipCoinWithResult(data.result);
      
      // Handle game result
      if (data.won) {
        // Update multiplier for next flip
        if (data.currentMultiplier) {
          currentMultiplier = data.currentMultiplier;
        }
        
        if (data.maxWin) {
          // Max win reached
          setTimeout(() => {
            resetGame();
          }, flipDuration + 500);
        } else {
          // Continue game
          setTimeout(() => {
            // Re-enable buttons for next flip
            headsBtn.disabled = false;
            tailsBtn.disabled = false;
            // Enable cashout button after first flip
            document.getElementById('cashoutBtn').disabled = false;
            // Update profit display
            updateProfitDisplay();
          }, flipDuration + 500);
        }
      } else {
        // Game lost
        setTimeout(() => {
          resetGame();
        }, flipDuration + 500);
      }
      
      // Update balance visually based on game result
      const balanceBox = document.getElementById('selected-balance');
      if (balanceBox) {
        if (data.won && data.maxWin && data.newBalance !== undefined && data.currency !== undefined) {
          // Use server response for max win
          balanceBox.textContent = formatBalance(data.newBalance, data.currency);
        } else {
          // For regular wins/losses, balance stays the same (already deducted at start)
          // No need to update balance
        }
      }
      
    } else {
      // Failed to make flip
      headsBtn.disabled = false;
      tailsBtn.disabled = false;
    }
    
  } catch (err) {
    console.error('Make flip error:', err);
    const headsBtn = document.getElementById('headsBtn');
    const tailsBtn = document.getElementById('tailsBtn');
    headsBtn.disabled = false;
    tailsBtn.disabled = false;
  }
}

// Cashout game function
async function cashoutGame() {
  try {
    const cashoutBtn = document.getElementById('cashoutBtn');
    cashoutBtn.disabled = true;
    
    const response = await fetch('/games/flip/cashout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Update balance visually using server response
      const balanceBox = document.getElementById('selected-balance');
      if (balanceBox && data.newBalance !== undefined && data.currency !== undefined) {
        balanceBox.textContent = formatBalance(data.newBalance, data.currency);
      }
      
      resetGame();
    } else {
      // Failed to cashout
      cashoutBtn.disabled = false;
    }
    
  } catch (err) {
    console.error('Cashout error:', err);
    const cashoutBtn = document.getElementById('cashoutBtn');
    cashoutBtn.disabled = false;
  }
}

// Update profit display function
function updateProfitDisplay() {
  const profitDisplay = document.getElementById('profitDisplay');
  const profitAmount = document.getElementById('profitAmount');
  const profitLabel = document.querySelector('label[for="profitAmount"]');
  
  if (gameActive) {
    const currentBetAmount = parseFloat(document.getElementById('betAmount').value);
    if (currentBetAmount > 0) {
      const totalProfit = currentBetAmount * currentMultiplier;
      const currency = document.getElementById('currency').value;
      profitAmount.value = formatBalance(totalProfit, currency);
      profitLabel.textContent = `Total Profit (${currentMultiplier.toFixed(2)}x)`;
      profitDisplay.style.display = 'block';
    } else {
      profitDisplay.style.display = 'none';
    }
  } else {
    profitDisplay.style.display = 'none';
  }
}

// Reset game function
function resetGame() {
  gameActive = false;
  currentChoice = null;
  currentMultiplier = 1;
  
  // Switch buttons back
  const playBtn = document.getElementById('playBtn');
  playBtn.style.display = 'block';
  playBtn.disabled = false; // Re-enable play button
  document.getElementById('cashoutBtn').style.display = 'none';
  document.getElementById('cashoutBtn').disabled = false;
  
  // Hide profit display
  document.getElementById('profitDisplay').style.display = 'none';
  
  const headsBtn = document.getElementById('headsBtn');
  const tailsBtn = document.getElementById('tailsBtn');
  
  headsBtn.disabled = true;
  tailsBtn.disabled = true;
}

// Modified flip function that uses backend result
function flipCoinWithResult(result) {
  if (isFlipping) return;
  
  isFlipping = true;
  
  // Use the result from backend
  currentSide = result;
  
  // Start animation
  const start = performance.now();
  
  const animate = (now) => {
    const progress = now - start;
    const normalizedProgress = progress / flipDuration;
    
    // Create tension by slowing down the last 25% of the animation
    let easedProgress;
    if (normalizedProgress < 0.75) {
      // First 75% - normal speed
      easedProgress = normalizedProgress / 0.75;
    } else {
      // Last 25% - slower for tension
      const remainingProgress = (normalizedProgress - 0.75) / 0.25;
      easedProgress = 0.75 + (remainingProgress * 0.25);
    }
    
    const rotation = easedProgress * 360 * totalSpins;
    
    // Draw coin at current rotation
    drawCoinAtRotation(rotation);
    
    if (progress < flipDuration) {
      requestAnimationFrame(animate);
    } else {
      finalizeFlipWithResult(result);
    }
  };
  
  requestAnimationFrame(animate);
}

// Finalize flip with specific result
function finalizeFlipWithResult(result) {
  // Ensure final state matches the result
  const finalRotation = result === 'heads' ? 0 : 180;
  drawCoinAtRotation(finalRotation);
  
  isFlipping = false;
}

// Initial draw
window.addEventListener('load', () => {
  setTimeout(initCanvas, 100);
});

