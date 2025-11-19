async function api(path, opts={}) {
  opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
  opts.credentials = 'include';
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
  const r = await fetch(path, opts);
  if (!r.ok) {
    const t = await r.json().catch(()=>({ error: r.statusText }));
    throw t;
  }
  return r.json();
}

document.addEventListener('DOMContentLoaded', () => {
  // login form exists on index.html
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      try {
        const r = await api('/api/login', { method: 'POST', body: { username, password }});
        // redirect based on role
        if (r.role === 'admin') window.location = '/admin.html';
        else if (r.role === 'receptionist') window.location = '/frontdesk.html';
        else window.location = '/';
      } catch (err) {
        document.getElementById('msg').innerText = err.error || 'Login failed';
      }
    });
  }

  // logout button on other pages
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api('/api/logout', { method: 'POST' }).catch(()=>{});
      window.location = '/';
    });
  }

  // basic session check: if on page other than index, ensure logged in
  if (window.location.pathname !== '/') {
    api('/api/me').catch(()=> {
      window.location = '/';
    });
  }
});
