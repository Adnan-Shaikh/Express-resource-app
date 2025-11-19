async function loadResources() {
  const resources = await api('/api/resources');
  const tbody = document.querySelector('#resourcesTable tbody');
  tbody.innerHTML = '';
  resources.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.name}</td><td>${r.total}</td><td>${r.available}</td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadResources();
  document.getElementById('addResBtn').addEventListener('click', async () => {
    const name = document.getElementById('resName').value.trim();
    const total = parseInt(document.getElementById('resTotal').value, 10);
    if (!name || !total) { document.getElementById('resMsg').innerText = 'Enter name & total'; return; }
    try {
      await api('/api/resources', { method: 'POST', body: { name, total }});
      document.getElementById('resMsg').innerText = 'Added';
      loadResources();
    } catch (err) {
      document.getElementById('resMsg').innerText = err.error || 'Error';
    }
  });

  setInterval(loadResources, 5000);
});
