// Withdraw network dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
  const selectedNetwork = document.getElementById('withdraw-selected-network');
  const networkDropdown = document.getElementById('withdraw-network-dropdown');
  const dropdownItems = document.querySelectorAll('.withdraw-dropdown-item');
  
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
      
      // Update display
      const selectedImg = selectedNetwork.querySelector('img');
      const selectedText = selectedNetwork.querySelector('span:not(.arrow)');
      
      if (selectedImg && selectedText && logo) {
        selectedImg.src = logo;
        selectedText.textContent = networkName;
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
  
  // Withdraw button functionality
  const withdrawBtn = document.getElementById('withdraw-btn');
  const withdrawAddress = document.getElementById('withdraw-address');
  
  withdrawBtn.addEventListener('click', function() {
    const address = withdrawAddress.value.trim();
    const selectedNetworkText = selectedNetwork.querySelector('span:not(.arrow)').textContent;
    
    if (!address) {
      showToast('Please enter a wallet address', 'error');
      return;
    }
    
    // Placeholder
    console.log('Withdraw request:', {
      address: address,
      network: selectedNetworkText
    });
  });
  
  // Toast notification function
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `withdraw-toast ${type}`;
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
  
  // === Withdraw History Functionality ===
  let currentPage = 0;
  let hasMoreWithdraws = true;
  
  // Load withdraw history
  async function loadWithdrawHistory(page = 0) {
    const historyTable = document.getElementById('withdraw-history');
    const loadingIndicator = document.getElementById('withdraw-loading-indicator');
    const noWithdrawsMessage = document.getElementById('no-withdraws-message');
    const nextPageBtn = document.getElementById('withdraw-next-page');
    const pageInfo = document.getElementById('withdraw-page-info');
    
    try {
      loadingIndicator.style.display = 'flex';
      historyTable.innerHTML = '';
      noWithdrawsMessage.style.display = 'none';
      
      const response = await fetch(`/api/user/withdraw-history?page=${page}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.withdraws.length === 0 && page === 0) {
          noWithdrawsMessage.style.display = 'flex';
        } else {
          data.withdraws.forEach((withdraw, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'withdraw-row-dark' : 'withdraw-row-light';
            
            const date = new Date(withdraw.date);
            const formattedDate = date.toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) + ' ' + date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            
            const formattedAmount = withdraw.currency === 'USD' 
              ? `$${withdraw.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `£${withdraw.amount.toLocaleString('en-GB')}`;
            
            row.innerHTML = `
              <td>${withdraw.type.charAt(0).toUpperCase() + withdraw.type.slice(1)}</td>
              <td>${formattedDate}</td>
              <td>${withdraw.currency}</td>
              <td>${formattedAmount}</td>
            `;
            
            historyTable.appendChild(row);
          });
        }
        
        hasMoreWithdraws = data.hasMore;
        nextPageBtn.disabled = !hasMoreWithdraws;
        
        if (page === 0) {
          pageInfo.textContent = 'Latest withdraws';
        } else {
          pageInfo.textContent = `Page ${page + 1}`;
        }
        
      } else {
        console.error('Failed to load withdraw history:', data.error);
      }
    } catch (error) {
      console.error('Error loading withdraw history:', error);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Next page button
  document.getElementById('withdraw-next-page').addEventListener('click', function() {
    if (hasMoreWithdraws) {
      currentPage++;
      loadWithdrawHistory(currentPage);
    }
  });
  
  // Load initial withdraw history
  loadWithdrawHistory();
});
