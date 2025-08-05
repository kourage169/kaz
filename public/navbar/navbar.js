// Format balance with commas/decimals helper function
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
  
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/auth/session');
      if (!res.ok) throw new Error('Session not found');
  
      const data = await res.json();
  
      const selectedBalance = document.getElementById('selected-balance');
      const dropdown = document.getElementById('balance-dropdown');
      const dropdownItems = document.querySelectorAll('.dropdown-item');
      const balanceBox = document.getElementById('balance-box');
  
      // Update dropdown values with span labels
      dropdownItems.forEach(item => {
        const currency = item.getAttribute('data-currency');
        let amountText = '';
        let labelText = '';
  
        if (currency === 'USD') {
          amountText = formatBalance(data.balanceUSD, 'USD');
          labelText = 'USD';
        } else if (currency === 'LBP') {
          amountText = formatBalance(data.balanceLBP, 'LBP');
          labelText = 'LBP';
        }
  
        item.innerHTML = `
          <span class="amount-label">${amountText}</span>
          <span class="currency-label">${labelText}</span>
        `;
      });
  
      // Default selected
      selectedBalance.textContent = formatBalance(data.balanceUSD, 'USD');
  
      // Toggle dropdown on click
      balanceBox.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
      });
  
      // Handle currency selection
      dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
          const amountSpan = item.querySelector('.amount-label');
          selectedBalance.textContent = amountSpan.textContent;
          dropdown.style.display = 'none';
        });
      });
  
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!balanceBox.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
  
    } catch (err) {
      console.error('Session fetch failed:', err);
      window.location.href = '/login.html';
    }
  });

  ///////////// Global balance update ////////////////

  // Update internal balance (dropdown + visible selected balance)
function updateBalance(currency, newAmount) {
    const formatted = formatBalance(newAmount, currency);
  
    // Update dropdown entry
    const item = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    if (item) {
      const label = currency;
      item.innerHTML = `
        <span class="amount-label">${formatted}</span>
        <span class="currency-label">${label}</span>
      `;
    }
  
    // If this is the currently selected currency, also update the visible balance
    const selectedBalance = document.getElementById('selected-balance');
    const selectedCurrency = getSelectedCurrency();
    if (selectedCurrency === currency) {
      selectedBalance.textContent = formatted;
    }
  }
  
  function getSelectedCurrency() {
    const selectedText = document.getElementById('selected-balance').textContent;
    return selectedText.includes('$') ? 'USD' : 'LBP';
  }
  
  // Function to set the selected currency in the navbar
  function setSelectedCurrency(currency) {
    if (currency !== 'USD' && currency !== 'LBP') return;
    
    // Find the dropdown item for this currency
    const item = document.querySelector(`.dropdown-item[data-currency="${currency}"]`);
    if (item) {
      // Get the amount text from the item
      const amountSpan = item.querySelector('.amount-label');
      if (amountSpan) {
        // Update the selected balance text
        const selectedBalance = document.getElementById('selected-balance');
        selectedBalance.textContent = amountSpan.textContent;
      }
    }
  }
  
  // Expose them globally so game scripts can use them
  window.updateNavbarBalance = updateBalance;
  window.getNavbarCurrency = getSelectedCurrency;
  window.setNavbarCurrency = setSelectedCurrency;
  
  
  /* //////////////////////////////////// Notification Button (navbar) ////////////////////////////////////////// */
  
  // Toggle notification dropdown
  const notifToggle = document.getElementById('notification-toggle');
  const notifDropdown = document.getElementById('notification-dropdown');
  
  notifToggle.addEventListener('click', () => {
    if (notifDropdown.style.display === 'flex') {
      notifDropdown.style.display = 'none';
    } else {
      notifDropdown.style.display = 'flex';
      // Hide red dot when user opens notifications
      const notifDot = document.getElementById('notif-dot');
      if (notifDot) notifDot.style.display = 'none';
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.style.display = 'none';
    }
  });
  
  async function loadNotifications() {
    try {
      const res = await fetch('/api/user/notifications', {
        credentials: 'include'  // Keep this as you have it
      });
      if (!res.ok) throw new Error('Failed to fetch');
  
      const notifications = await res.json();
      const list = document.getElementById('notification-list');
      const notifDot = document.getElementById('notif-dot');
  
      list.innerHTML = '';
  
      if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-item">No notifications</div>';
        if (notifDot) notifDot.style.display = 'none'; // Hide red dot if no notifications
        return;
      }
  
      if (notifDot) notifDot.style.display = 'block'; // Show red dot if notifications exist
  
      notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.textContent = n.message;
        list.appendChild(item);
      });
  
    } catch (err) {
      console.error('Failed to load notifications:', err);
      const list = document.getElementById('notification-list');
      list.innerHTML = '<div class="notification-item">Error loading notifications</div>';
    }
  }
  
  // Close button for notifications
  const notifClose = document.getElementById('notif-close');
  notifClose.addEventListener('click', () => {
    notifDropdown.style.display = 'none';
  });
  
  
  // Load notifications once on page load
  window.addEventListener('DOMContentLoaded', loadNotifications);
  
  
  /////////////////////////////////////////////////////////////// Profile Button (navbar) /////////////////////////////////////////////////////////////
  
  // Toggle profile dropdown
  const profileToggle = document.getElementById('profile-toggle');
  const profileDropdown = document.getElementById('profile-dropdown');
  
  profileToggle.addEventListener('click', () => {
    if (profileDropdown.style.display === 'flex') {
      profileDropdown.style.display = 'none';
    } else {
      profileDropdown.style.display = 'flex';
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.style.display = 'none';
    }
  });
  
  // Handle profile menu item clicks
  const profileItems = document.querySelectorAll('.profile-item');
  profileItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      
      switch(action) {
        case 'my-bets':
          // Navigate to my bets page
          window.location.href = '/user/my-bets';
          break;
        case 'deposit':
          // Navigate to deposit page
          window.location.href = '/user/deposit';
          break;
        case 'withdraw':
          // Navigate to withdraw page
          window.location.href = '/user/withdraw';
          break;
        case 'affiliate':
          // Navigate to affiliate page
          window.location.href = '/user/affiliate';
          break;
        case 'contact':
          // Navigate to contact page
          window.location.href = '/user/contact-us';
          break;
        case 'logout':
          // Handle logout
          fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
          }).then(() => {
            window.location.href = '/login.html';
          }).catch(err => {
            console.error('Logout failed:', err);
          });
          break;
      }
      
      // Close dropdown after action
      profileDropdown.style.display = 'none';
    });
  });
  
  // Close button for profile dropdown
  const profileClose = document.getElementById('profile-close');
  profileClose.addEventListener('click', () => {
    profileDropdown.style.display = 'none';
  });
  
  // Logo home navigation
  const logoHome = document.getElementById('logo-home');
  logoHome.addEventListener('click', () => {
    window.location.href = '/';
  });
  