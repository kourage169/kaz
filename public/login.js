document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (result.success) {
      // 🔄 Fetch session info to check if user is admin
      const sessionRes = await fetch('/auth/session');
      const sessionData = await sessionRes.json();

      if (sessionData.isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } else {
      alert('Login failed!');
    }
  } catch (error) {
    alert('Error during login: ' + error.message);
  }
});
