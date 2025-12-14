const API = "/api";

// DOM Elements
const bedSelect = document.getElementById("adminBedSelect");
const resSelect = document.getElementById("adminResSelect");
const qtyInput = document.getElementById("adminQty");
const allocBtn = document.getElementById("allocBtn");
const allocMsg = document.getElementById("allocMsg");
const bedsTable = document.querySelector("#bedsTable tbody");


// ------------------------- LOAD BEDS -------------------------
async function loadBeds() {
  const beds = await api('/api/beds');
  const tbody = document.querySelector('#bedsTable tbody');
  tbody.innerHTML = '';

  beds.forEach(b => {

    const patient = b.patientId ? b.patientId : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.status}</td>
      <td>${patient}</td>
      <td>
        <select class="statusChange form-select" data-id="${bed.id}">
          <option value="available" ${bed.status === "available" ? "selected" : ""}>Available</option>
          <option value="reserved" ${bed.status === "reserved" ? "selected" : ""}>Reserved</option>
          <option value="maintenance" ${bed.status === "maintenance" ? "selected" : ""}>Maintenance</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.statusSelect').value = b.status;
  });

  // attach listeners
  document.querySelectorAll('.statusSelect').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const bedId = e.target.dataset.bed;
      const status = e.target.value;
      try {
        await api('/api/beds/' + bedId + '/status', {
          method: 'PUT',
          body: { status }
        });
        loadBeds();
      } catch (err) {
        document.getElementById('allocMsg').innerText = err.error || 'Error';
      }
    });
  });
}

async function populateAdminSelects() {
  const beds = await api('/api/beds');
  const bedSel = document.getElementById('adminBedSelect');
  bedSel.innerHTML = '';
  beds.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.id;
    bedSel.appendChild(opt);
  });

  const resources = await api('/api/resources');
  const resSel = document.getElementById('adminResSelect');
  resSel.innerHTML = '';
  resources.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.name} (avail ${r.available})`;
    resSel.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadBeds();
  populateAdminSelects();

  document.getElementById('allocBtn').addEventListener('click', async () => {
    const bedId = document.getElementById('adminBedSelect').value;
    const resourceId = document.getElementById('adminResSelect').value;
    const qty = parseInt(document.getElementById('adminQty').value, 10) || 1;

    try {
      await api('/api/allocate-resource', {
        method: 'POST',
        body: { bedId, resourceId, qty }
      });
      document.getElementById('allocMsg').innerText = 'Allocated';
      loadBeds();
      populateAdminSelects();
    } catch (err) {
      document.getElementById('allocMsg').innerText = err.error || 'Error';
    }
  });

  setInterval(() => {
    loadBeds();
    populateAdminSelects();
  }, 5000);
});
