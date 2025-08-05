document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
  
    const res = await fetch('/superagent/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  
    const errorElem = document.getElementById('error');
  
    if (res.ok) {
      // Redirect to dashboard (to be built)
      window.location.href = '/superagent/dashboard.html';
    } else {
      const text = await res.text();
      errorElem.textContent = text || 'Login failed';
    }
  });
  