api('/api/me').catch(() => window.location = '/index.html');

async function api(url, options = {}) {
  options.headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }
  return fetch(url, options)
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw err; });
      }
      return res.json();
    });
}

document.getElementById('logout').addEventListener('click', async () => {
  try {
    await api('/api/logout', { method: 'POST' });
    window.location.href = '/index.html'; // or your login page
  } catch (err) {
    alert('Logout failed!');
  }
});


async function loadResources() {
  try {
    const resources = await api('/api/resources');
    const tbody = document.querySelector('#resourcesTable tbody');
    tbody.innerHTML = '';
    resources.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.name}</td>
        <td><span class="badge bg-secondary">${r.total}</span></td>
        <td><span class="badge bg-success">${r.available}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    document.querySelector('#resourcesTable tbody').innerHTML = 
      `<tr><td colspan="3">Unable to load resources: ${err.error || 'Unknown error'}</td></tr>`;
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadResources();

  document.getElementById('addResBtn').addEventListener('click', async () => {
    const name = document.getElementById('resName').value.trim();
    const total = parseInt(document.getElementById('resTotal').value, 10);

    if (!name || !total) {
      document.getElementById('resMsg').innerText = '⚠ Enter name & total';
      return;
    }

    try {
      await api('/api/resources', { method: 'POST', body: { name, total }});
      document.getElementById('resMsg').innerText = '✔ Resource Added';
      loadResources();
    } catch (err) {
      document.getElementById('resMsg').innerText = err.error || 'Error';
    }
  });

  // Auto-refresh every 5 sec
  setInterval(loadResources, 5000);
});
