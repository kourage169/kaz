const form = document.getElementById('createUserForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Make sure the balances are numbers (could be negative in some cases, but we trust the front end already has min validations)
  data.balanceUSD = Number(data.balanceUSD);
  data.balanceLBP = Number(data.balanceLBP);

  const response = await fetch('/admin/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const statusEl = document.getElementById('status');
  if (response.ok) {
    statusEl.textContent = 'User created successfully!';
    statusEl.style.color = 'lightgreen';
    form.reset();
  } else {
    const msg = await response.text();
    statusEl.textContent = `Error: ${msg}`;
    statusEl.style.color = 'tomato';
  }
});

// Create a new super agent
const superForm = document.getElementById('createSuperAgentForm');

superForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(superForm);
  const data = Object.fromEntries(formData.entries());

  data.balanceUSD = Number(data.balanceUSD);
  data.balanceLBP = Number(data.balanceLBP);

  const response = await fetch('/admin/create-superagent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const statusEl = document.getElementById('superStatus');
  if (response.ok) {
    statusEl.textContent = 'Super Agent created successfully!';
    statusEl.style.color = 'lightgreen';
    superForm.reset();
  } else {
    const msg = await response.text();
    statusEl.textContent = `Error: ${msg}`;
    statusEl.style.color = 'tomato';
  }
});

//////////////////////////////////// Send Notification to Users ///////////////////////////////////////////

const notifForm = document.getElementById('sendNotificationForm');
const targetSelect = document.getElementById('target-select');
const usernameInput = document.getElementById('username-input');

// Show/hide username input based on target selection
targetSelect.addEventListener('change', () => {
  if (targetSelect.value === 'specific') {
    usernameInput.style.display = 'block';
    usernameInput.required = true;
  } else {
    usernameInput.style.display = 'none';
    usernameInput.required = false;
    usernameInput.value = '';
  }
});

notifForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(notifForm);
  const data = Object.fromEntries(formData.entries());

  if (data.targetType !== 'specific') {
    delete data.username;
  }

  const response = await fetch('/admin/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const statusEl = document.getElementById('notifStatus');
  if (response.ok) {
    statusEl.textContent = 'Notification sent!';
    statusEl.style.color = 'lightgreen';
    notifForm.reset();
    usernameInput.style.display = 'none';  // Hide username again on reset
  } else {
    const msg = await response.text();
    statusEl.textContent = `Error: ${msg}`;
    statusEl.style.color = 'tomato';
  }
});

