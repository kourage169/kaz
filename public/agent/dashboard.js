async function fetchAgentSession() {
    const res = await fetch('/agent/session');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('balanceUSD').textContent = data.balanceUSD.toFixed(2);
      document.getElementById('balanceLBP').textContent = data.balanceLBP.toFixed(0);
    }
  }
  
  async function fetchUsers() {
    const res = await fetch('/agent/users');
    const container = document.getElementById('userList');
    container.innerHTML = '';
  
    if (!res.ok) {
      container.textContent = 'Failed to load users';
      return;
    }
  
    const users = await res.json();
    if (users.length === 0) {
      container.textContent = 'No users created yet.';
      return;
    }
  
    users.forEach(user => {
      const div = document.createElement('div');
      div.className = 'user-entry';
      div.innerHTML = `
        <strong>${user.username}</strong><br />
        USD: ${user.balanceUSD.toFixed(2)}<br />
        LBP: ${user.balanceLBP.toFixed(0)}
         <button onclick="openActionModal('${user._id}', '${user.username}', 'deposit')">Deposit</button>
         <button onclick="openActionModal('${user._id}', '${user.username}', 'withdraw')">Withdraw</button>
      `;
      container.appendChild(div);
    });
  }
  
  document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
  
    data.balanceUSD = Number(data.balanceUSD);
    data.balanceLBP = Number(data.balanceLBP);
  
    const res = await fetch('/agent/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  
    const status = document.getElementById('createStatus');
    if (res.ok) {
      status.textContent = 'User created!';
      status.style.color = 'lightgreen';
      e.target.reset();
      fetchUsers();
      fetchAgentSession();
    } else {
      const msg = await res.text();
      status.textContent = `Error: ${msg}`;
      status.style.color = 'tomato';
    }
  });
  
  fetchAgentSession();
  fetchUsers();
  

  function openActionModal(userId, username, action) {
    document.getElementById('modalTitle').textContent = `${action === 'deposit' ? 'Deposit' : 'Withdraw'}: ${username}`;
    document.getElementById('modalUserId').value = userId;
    document.getElementById('modalAction').value = action;
    document.getElementById('modalAmount').value = '';
    document.getElementById('modalStatus').textContent = '';
    document.getElementById('modalOverlay').classList.remove('hidden');
  }
  
  function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  }
  
  document.getElementById('modalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const userId = document.getElementById('modalUserId').value;
    const action = document.getElementById('modalAction').value;
    const amount = Number(document.getElementById('modalAmount').value);
    const currency = document.getElementById('modalCurrency').value;
  
    const endpoint = action === 'deposit'
      ? '/agent/deposit-user'
      : '/agent/withdraw-from-user';
  
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, currency })
    });
  
    const statusEl = document.getElementById('modalStatus');
    if (res.ok) {
      statusEl.textContent = 'Success!';
      statusEl.style.color = 'lightgreen';
      await fetchAgentSession();
      await fetchUsers();
      setTimeout(closeModal, 800);
    } else {
      const err = await res.json();
      statusEl.textContent = err.error || 'Failed';
      statusEl.style.color = 'tomato';
    }
  });
  