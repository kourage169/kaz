async function fetchBalances() {
    const res = await fetch('/superagent/session');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('balanceUSD').textContent = data.balanceUSD.toFixed(2);
      document.getElementById('balanceLBP').textContent = data.balanceLBP.toFixed(0);
    }
  }
  
  async function fetchAgents() {
    const res = await fetch('/superagent/agents');
    const container = document.getElementById('agentList');
    container.innerHTML = '';
  
    if (!res.ok) {
      container.textContent = 'Failed to load agents';
      return;
    }
  
    const agents = await res.json();
    if (agents.length === 0) {
      container.textContent = 'No agents created yet.';
      return;
    }
  
    agents.forEach(agent => {
        const div = document.createElement('div');
        div.className = 'agent-entry';
        div.innerHTML = `
          <strong>${agent.username}</strong><br />
          USD: ${agent.balanceUSD.toFixed(2)}<br />
          LBP: ${agent.balanceLBP.toFixed(0)}<br />
          <button onclick="openActionModal('${agent._id}', '${agent.username}', 'deposit')">Deposit</button>
          <button onclick="openActionModal('${agent._id}', '${agent.username}', 'withdraw')">Withdraw</button>
        `;
        container.appendChild(div);
      });      
  }

  // Fetch transaction history between super agent and agents
  async function fetchTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    const res = await fetch('/superagent/transactions');
  
    if (!res.ok) {
      container.textContent = 'Failed to load history';
      return;
    }
  
    const txs = await res.json();
    if (txs.length === 0) {
      container.textContent = 'No transactions yet.';
      return;
    }
  
    container.innerHTML = '';
    txs.forEach(tx => {
      const div = document.createElement('div');
      div.className = 'agent-entry';
      div.innerHTML = `
        <strong>${tx.type.toUpperCase()}</strong> ${tx.amount} ${tx.currency}
        <br />
        Agent: ${tx.agentName}
        <br />
        <small>${new Date(tx.timestamp).toLocaleString()}</small>
      `;
      container.appendChild(div);
    });
  }
  
  document.getElementById('createAgentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
  
    const res = await fetch('/superagent/create-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  
    const status = document.getElementById('createStatus');
    if (res.ok) {
      status.textContent = 'Agent created successfully!';
      status.style.color = 'lightgreen';
      e.target.reset();
      fetchAgents();
    } else {
      const text = await res.text();
      status.textContent = `Error: ${text}`;
      status.style.color = 'tomato';
    }
  });
  
  fetchBalances();
  fetchAgents();
  fetchTransactionHistory();
  
  function openActionModal(agentId, agentUsername, action) {
    document.getElementById('modalTitle').textContent = `${action === 'deposit' ? 'Deposit' : 'Withdraw'}: ${agentUsername}`;
    document.getElementById('modalAgentId').value = agentId;
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
  
    const agentId = document.getElementById('modalAgentId').value;
    const action = document.getElementById('modalAction').value;
    const amount = Number(document.getElementById('modalAmount').value);
    const currency = document.getElementById('modalCurrency').value;
  
    const endpoint = action === 'deposit' ? '/superagent/deposit-agent' : '/superagent/withdraw-from-agent';
  
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, amount, currency })
    });
  
    const statusEl = document.getElementById('modalStatus');
    if (res.ok) {
      statusEl.textContent = 'Success!';
      statusEl.style.color = 'lightgreen';
      await fetchBalances();
      await fetchAgents();
      await fetchTransactionHistory();
      setTimeout(closeModal, 800);
    } else {
      const err = await res.json();
      statusEl.textContent = err.error || 'Failed';
      statusEl.style.color = 'tomato';
    }
  });
