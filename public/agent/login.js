const form = document.getElementById('loginForm');
const status = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch('/agent/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    window.location.href = '/agent/dashboard'; // redirect to agent dashboard
  } else {
    const msg = await res.text();
    status.textContent = `Login failed: ${msg}`;
    status.style.color = 'tomato';
  }
});
