// My Bets Page JavaScript

let currentCursor = null;
let nextCursor = null;
let hasNextPage = false;
let toggleRowColor = true;

// Format balance with commas/decimals helper function (same as navbar)
function formatBalance(amount, currency) {
  if (currency === 'USD') {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  } else if (currency === 'LBP') {
    return `£${Math.floor(amount).toLocaleString()}`;
  }
  return amount;
}

// Helper function to format currency values (same as history.js)
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

// Format date helper function
function formatDate(dateValue) {
  const date = new Date(dateValue);
  
  // Format date as MM/DD/YYYY (month without leading zero)
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString(); // No padStart for month
  const year = date.getFullYear();
  
  // Format time as HH:MM AM/PM
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
  
  return `${hours}:${minutes} ${ampm} ${month}/${day}/${year}`;
}

// Add bet row to table
function addBetToTable({ game, currency, betAmount, payout, createdAt }) {
  const tbody = document.getElementById('my-bets-history');
  if (!tbody) return;

  const dateStr = formatDate(createdAt);
  const formattedBetAmount = formatCurrencyValue(betAmount, currency);
  const formattedPayout = formatCurrencyValue(payout, currency);

  const row = document.createElement('tr');

  // Add alternating classes for row colors
  if (toggleRowColor) {
    row.classList.add('my-bets-row-dark');
  } else {
    row.classList.add('my-bets-row-light');
  }
  toggleRowColor = !toggleRowColor; // Flip toggle for next row

  row.innerHTML = `
    <td>${game}</td>
    <td>${dateStr}</td>
    <td>${formattedBetAmount}</td>
    <td>${formattedPayout}</td>
  `;

  tbody.appendChild(row);
}

// Load user bets with cursor-based pagination
async function loadUserBets(cursor = null) {
  try {
    // Show loading indicator
    showLoading(true);
    hideNoBetsMessage();

    // Get session data to check if user is logged in
    const sessionRes = await fetch('/auth/session');
    if (!sessionRes.ok) {
      window.location.href = '/login.html';
      return;
    }

    const sessionData = await sessionRes.json();
    if (!sessionData.username) {
      window.location.href = '/login.html';
      return;
    }

    // Build query parameters
    const username = encodeURIComponent(sessionData.username);
    const params = new URLSearchParams({
      username: username,
      limit: '10'
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    // Fetch paginated bets
    const res = await fetch(`/betHistory/user/paginated?${params}`);
    
    if (!res.ok) {
      throw new Error('Failed to load user bets');
    }

    const data = await res.json();
    
    // Update pagination info
    hasNextPage = data.pagination.hasNextPage;
    nextCursor = data.pagination.nextCursor;
    currentCursor = cursor;
    
    // Update UI
    updatePaginationInfo();
    
    // Clear existing rows
    const tbody = document.getElementById('my-bets-history');
    tbody.innerHTML = '';
    
    // Reset row coloring
    toggleRowColor = true;
    
    if (data.bets.length > 0) {
      // Add each bet to the table
      data.bets.forEach(bet => {
        addBetToTable(bet);
      });
    } else {
      showNoBetsMessage();
    }
    
    // Hide loading indicator
    showLoading(false);
    
  } catch (err) {
    console.error('Error loading user bets:', err);
    showLoading(false);
    showNoBetsMessage();
  }
}

// Update pagination info display
function updatePaginationInfo() {
  const pageInfo = document.getElementById('page-info');
  const nextBtn = document.getElementById('next-page');
  
  // Always show "Latest bets" for consistency
  pageInfo.textContent = 'Latest bets';
  nextBtn.disabled = !hasNextPage;
}

// Show/hide loading indicator
function showLoading(show) {
  const loadingIndicator = document.getElementById('loading-indicator');
  const table = document.querySelector('.my-bets-table');
  
  if (show) {
    loadingIndicator.style.display = 'flex';
    // Keep table visible with lower opacity to maintain structure
    table.style.opacity = '0.3';
  } else {
    loadingIndicator.style.display = 'none';
    table.style.opacity = '1';
  }
}

// Show/hide no bets message
function showNoBetsMessage() {
  const noBetsMessage = document.getElementById('no-bets-message');
  const table = document.querySelector('.my-bets-table');
  
  noBetsMessage.style.display = 'flex';
  table.style.display = 'none';
}

function hideNoBetsMessage() {
  const noBetsMessage = document.getElementById('no-bets-message');
  noBetsMessage.style.display = 'none';
}

// Navigation function
function goToNextPage() {
  if (hasNextPage && nextCursor) {
    loadUserBets(nextCursor);
  }
}

// Load and display user profile data
async function loadUserProfile() {
  try {
    // Get session data for username and balances
    const sessionRes = await fetch('/auth/session');
    if (!sessionRes.ok) {
      window.location.href = '/login.html';
      return;
    }

    const sessionData = await sessionRes.json();
    if (!sessionData.username) {
      window.location.href = '/login.html';
      return;
    }

    // Fetch joined date from the new route
    const joinedDateRes = await fetch('/api/user/joined-date');
    let joinedDate = null;
    if (joinedDateRes.ok) {
      const joinedDateData = await joinedDateRes.json();
      joinedDate = joinedDateData.joinedAt;
    }

    // Update profile card with user data
    const usernameElement = document.getElementById('profile-username');
    const usdBalanceElement = document.getElementById('usd-balance');
    const lbpBalanceElement = document.getElementById('lbp-balance');
    const joinedDateElement = document.getElementById('joined-date');

    if (usernameElement) {
      usernameElement.textContent = sessionData.username;
    }

    if (usdBalanceElement) {
      usdBalanceElement.textContent = formatBalance(sessionData.balanceUSD || 0, 'USD');
    }

    if (lbpBalanceElement) {
      lbpBalanceElement.textContent = formatBalance(sessionData.balanceLBP || 0, 'LBP');
    }

    if (joinedDateElement && joinedDate) {
      const joinedDateObj = new Date(joinedDate);
      // Format as MM/DD/YYYY only (no time)
      const month = (joinedDateObj.getMonth() + 1).toString(); // No leading zero
      const day = joinedDateObj.getDate().toString().padStart(2, '0');
      const year = joinedDateObj.getFullYear();
      const formattedDate = `${month}/${day}/${year}`;
      joinedDateElement.textContent = `Joined: ${formattedDate}`;
    }

  } catch (err) {
    console.error('Error loading user profile:', err);
  }
}

// Initialize page
window.addEventListener('DOMContentLoaded', async () => {
  // Load user profile data
  await loadUserProfile();
  
  // Load initial data (no cursor for first page)
  await loadUserBets();
  
  // Set up pagination button listener
  const nextBtn = document.getElementById('next-page');
  nextBtn.addEventListener('click', goToNextPage);
}); 