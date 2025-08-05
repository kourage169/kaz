  // ─── A) Helper: getSession (same as coinflip.js) ────────────────
  async function getSession() {
    try {
      const res = await fetch('/auth/session');
      if (!res.ok) {
        window.location.href = '/login.html';
        return null;
      }
      const data = await res.json();
      
      // Store session data globally for other scripts to access
      window.sessionData = data;
      
      return data;
    } catch (err) {
      console.error('getSession error:', err);
      window.location.href = '/login.html';
      return null;
    }
  }
  
  getSession();