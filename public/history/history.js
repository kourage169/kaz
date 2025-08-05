const socket = new WebSocket(`ws://${location.hostname}:3000`);

let toggleRowColor = true; // Global toggle for row colors
let currentView = 'all'; // Track current view: 'all' or 'my'
let allBets = []; // Store all bets for filtering
let myBets = []; // Store user's bets separately
let myBetsLoaded = false; // Flag to track if user bets have been loaded

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'bet') {
    // Add to our stored bets array
    allBets.unshift(data);
    
    // Add to myBets if it's the current user's bet
    if (isCurrentUserBet(data)) {
      myBets.unshift(data);
    }
    
    // Only add to feed if it matches current view
    if (currentView === 'all' || (currentView === 'my' && isCurrentUserBet(data))) {
      addBetToFeed(data);
    }
  }
};

// Helper function to check if a bet belongs to the current user
function isCurrentUserBet(bet) {
  // Use the global sessionData that should be set by the main page's getSession
  if (window.sessionData && window.sessionData.username) {
    return bet.username === window.sessionData.username;
  }
  return false;
}

function addBetToFeed({ game, username, currency, betAmount, payout, timestamp, createdAt }) {
  const tbody = document.getElementById('bet-history');
  if (!tbody) return;

  // Use createdAt if available (from database), otherwise use timestamp (from WebSocket)
  // This handles both MongoDB ISODate strings and JavaScript timestamps
  const dateValue = createdAt || timestamp;
  
  // Format the time with custom formatting to remove leading zero from hours
  const date = new Date(dateValue);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
  const timeStr = `${hours}:${minutes} ${ampm}`;

  // Format currency values with appropriate symbols
  const formattedBetAmount = formatCurrencyValue(betAmount, currency);
  const formattedPayout = formatCurrencyValue(payout, currency);

  const row = document.createElement('tr');

  // Add alternating classes for row colors
  if (toggleRowColor) {
    row.classList.add('bet-history-row-dark');
  } else {
    row.classList.add('bet-history-row-light');
  }
  toggleRowColor = !toggleRowColor; // Flip toggle for next row

  row.innerHTML = `
    <td>${game}</td>
    <td>${username}</td>
    <td>${timeStr}</td>
    <td>${formattedBetAmount}</td>
    <td>${formattedPayout}</td>
  `;

  tbody.prepend(row);

  // Get the current limit from the dropdown
  const limitSelect = document.getElementById('historyCountSelect');
  const limit = limitSelect ? parseInt(limitSelect.value) : 50;

  // Optional: limit max rows shown
  while (tbody.children.length > limit) {
    tbody.removeChild(tbody.lastChild);
  }
}

// Helper function to format currency values
function formatCurrencyValue(value, currency) {
  if (currency === 'USD') {
    // Format USD with $ symbol and 2 decimal places
    return `$${value.toFixed(2)}`;
  } else if (currency === 'LBP') {
    // Special case for zero values - show with decimal places
    if (value === 0) {
      return `£0.00`;
    }
    // Format LBP with £ symbol and no decimal places, with commas for thousands
    return `£${Math.floor(value).toLocaleString()}`;
  }
  // Fallback for any other currency
  return `${value.toFixed(2)} ${currency}`;
}

async function loadRecentHistory() {
  try {
    // Load all bets
    const res = await fetch('/betHistory');
    if (!res.ok) throw new Error('Failed to load bet history');

    const bets = await res.json();
    
    // Store all bets
    allBets = bets;
    
    // Also load user bets if user is logged in
    if (window.sessionData && window.sessionData.username) {
      await loadUserBets();
      myBetsLoaded = true;
    }
    
    // Clear existing rows if any
    const tbody = document.getElementById('bet-history');
    tbody.innerHTML = '';
    
    // Reset row coloring
    toggleRowColor = true;

    // Display the appropriate view
    if (currentView === 'all') {
      displayAllBets();
    } else {
      displayMyBets();
    }
  } catch (err) {
    console.error(err);
  }
}

// Function to load user-specific bets
async function loadUserBets() {
  try {
    // Only proceed if user is logged in
    if (!window.sessionData || !window.sessionData.username) {
      return;
    }
    
    // Pass username as query parameter
    const username = encodeURIComponent(window.sessionData.username);
    const res = await fetch(`/betHistory/user?username=${username}`);
    
    // Handle error responses
    if (!res.ok) {
      console.error('Failed to load user bet history');
      return;
    }

    const bets = await res.json();
    
    // Store user's bets
    myBets = bets;
    myBetsLoaded = true;
  } catch (err) {
    console.error('Error loading user bets:', err);
  }
}

// Function to display all bets
function displayAllBets() {
  // Clear existing rows
  const tbody = document.getElementById('bet-history');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Reset row coloring
  toggleRowColor = true;
  
  // Get the current limit from the dropdown
  const limitSelect = document.getElementById('historyCountSelect');
  const limit = limitSelect ? parseInt(limitSelect.value) : 50;
  
  // Display all bets up to the limit
  const displayBets = allBets.slice(0, limit);
  
  // Add each bet to the display
  for (let i = displayBets.length - 1; i >= 0; i--) {
    addBetToFeed(displayBets[i]);
  }
}

// Function to display user bets
function displayMyBets() {
  // Clear existing rows
  const tbody = document.getElementById('bet-history');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Reset row coloring
  toggleRowColor = true;
  
  // If user is not logged in
  if (!window.sessionData || !window.sessionData.username) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" style="text-align: center;">Please log in to view your bets</td>`;
    tbody.appendChild(row);
    return;
  }
  
  // If user bets haven't been loaded yet
  if (!myBetsLoaded) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" style="text-align: center;">Loading your bet history...</td>`;
    tbody.appendChild(row);
    
    // Load user bets and then display them
    loadUserBets().then(() => {
      displayMyBets();
    });
    return;
  }
  
  // Get the current limit from the dropdown
  const limitSelect = document.getElementById('historyCountSelect');
  const limit = limitSelect ? parseInt(limitSelect.value) : 50;
  
  // Display user bets up to the limit
  const displayBets = myBets.slice(0, limit);
  
  if (displayBets.length > 0) {
    // Add each bet to the display
    for (let i = displayBets.length - 1; i >= 0; i--) {
      addBetToFeed(displayBets[i]);
    }
  } else {
    // Show message if no bets found
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" style="text-align: center;">No bets found for your account</td>`;
    tbody.appendChild(row);
  }
}

// Function to refresh the bet history display based on current view
function refreshBetDisplay() {
  if (currentView === 'all') {
    displayAllBets();
  } else {
    displayMyBets();
  }
}

// Set up event listeners for tab buttons
window.addEventListener('DOMContentLoaded', () => {
  // Load history
  loadRecentHistory();
  
  // Set up tab button listeners
  const allBetsBtn = document.getElementById('allBetsBtn');
  const myBetsBtn = document.getElementById('myBetsBtn');
  
  if (allBetsBtn) {
    allBetsBtn.addEventListener('click', () => {
      currentView = 'all';
      allBetsBtn.classList.add('active');
      myBetsBtn.classList.remove('active');
      displayAllBets();
    });
  }
  
  if (myBetsBtn) {
    myBetsBtn.addEventListener('click', () => {
      currentView = 'my';
      myBetsBtn.classList.add('active');
      allBetsBtn.classList.remove('active');
      displayMyBets();
    });
  }
  
  // Set up count select listener
  const historyCountSelect = document.getElementById('historyCountSelect');
  if (historyCountSelect) {
    historyCountSelect.addEventListener('change', refreshBetDisplay);
  }
});
  