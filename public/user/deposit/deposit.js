// Deposit network dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  const selectedNetwork = document.getElementById('deposit-selected-network');
  const networkDropdown = document.getElementById('deposit-network-dropdown');
  const dropdownItems = document.querySelectorAll('.deposit-dropdown-item');
  const depositAddress = document.getElementById('deposit-address');
  const copyButton = document.getElementById('copy-address-btn');
  
  // Network addresses mapping
  const networkAddresses = {
    'bsc': '0x6ADeF8E72A89D6D8761449d2838334a007ED1188',
    'sol': '6CqWx2aqsKAvotcPHsP1krw4Bku6rfn44RvtWpmrtD1Q',
    'eth': '0x8891675E464042804Fdbc756579522BeAc574c33'
  };
  
  // Set initial address for BSC (default)
  depositAddress.value = networkAddresses['bsc'];
  
  // Copy button functionality
  copyButton.addEventListener('click', function() {
    if (depositAddress.value) {
      navigator.clipboard.writeText(depositAddress.value).then(function() {
        showToast('Address copied!', 'success');
      }).catch(function() {
        showToast('Failed to copy address', 'error');
      });
    } else {
      showToast('No address to copy', 'error');
    }
  });
  
  // Toast notification function
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `copy-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }
  
  // Toggle dropdown
  selectedNetwork.addEventListener('click', function(e) {
    e.stopPropagation();
    networkDropdown.classList.toggle('show');
  });
  
  // Select network option
  dropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const networkName = this.getAttribute('data-name');
      const logo = this.getAttribute('data-logo');
      const network = this.getAttribute('data-network');
      
      // Update display
      const selectedImg = selectedNetwork.querySelector('img');
      const selectedText = selectedNetwork.querySelector('span:not(.arrow)');
      
      if (selectedImg && selectedText && logo) {
        selectedImg.src = logo;
        selectedText.textContent = networkName;
      }
      
      // Update deposit address
      if (networkAddresses[network]) {
        depositAddress.value = networkAddresses[network];
      }
      
      // Close dropdown
      networkDropdown.classList.remove('show');
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!selectedNetwork.contains(e.target) && !networkDropdown.contains(e.target)) {
      networkDropdown.classList.remove('show');
    }
  });
  
  // === Deposit History Functionality ===
  let currentPage = 0;
  let hasMoreDeposits = true;
  
  // Load deposit history
  async function loadDepositHistory(page = 0) {
    const historyTable = document.getElementById('deposit-history');
    const loadingIndicator = document.getElementById('deposit-loading-indicator');
    const noDepositsMessage = document.getElementById('no-deposits-message');
    const nextPageBtn = document.getElementById('deposit-next-page');
    const pageInfo = document.getElementById('deposit-page-info');
    
    try {
      loadingIndicator.style.display = 'flex';
      historyTable.innerHTML = '';
      noDepositsMessage.style.display = 'none';
      
      const response = await fetch(`/api/user/deposit-history?page=${page}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.deposits.length === 0 && page === 0) {
          noDepositsMessage.style.display = 'flex';
        } else {
          data.deposits.forEach((deposit, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'deposit-row-dark' : 'deposit-row-light';
            
            const date = new Date(deposit.date);
            const formattedDate = date.toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) + ' ' + date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            const formattedAmount = deposit.currency === 'USD' 
              ? `$${deposit.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `£${deposit.amount.toLocaleString('en-GB')}`;
            
            row.innerHTML = `
              <td>${deposit.type.charAt(0).toUpperCase() + deposit.type.slice(1)}</td>
              <td>${formattedDate}</td>
              <td>${deposit.currency}</td>
              <td>${formattedAmount}</td>
            `;
            
            historyTable.appendChild(row);
          });
        }
        
        hasMoreDeposits = data.hasMore;
        nextPageBtn.disabled = !hasMoreDeposits;
        
        if (page === 0) {
          pageInfo.textContent = 'Latest deposits';
        } else {
          pageInfo.textContent = `Page ${page + 1}`;
        }
        
      } else {
        console.error('Failed to load deposit history:', data.error);
      }
    } catch (error) {
      console.error('Error loading deposit history:', error);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Next page button
  document.getElementById('deposit-next-page').addEventListener('click', function() {
    if (hasMoreDeposits) {
      currentPage++;
      loadDepositHistory(currentPage);
    }
  });
  
  // Load initial deposit history
  loadDepositHistory();
});
