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
  const res = await fetch(`${API}/beds`);
  const beds = await res.json();

  bedsTable.innerHTML = "";
  bedSelect.innerHTML = "";

  beds.forEach(bed => {
    // Populate bed dropdown
    const opt = document.createElement("option");
    opt.value = bed.id;
    opt.textContent = `${bed.id} (${bed.status})`;
    bedSelect.appendChild(opt);

    // Add table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${bed.id}</td>
      <td><span class="status-badge ${bed.status}">${bed.status}</span></td>
      <td>${bed.patientId || "—"}</td>
      <td>
        <select class="statusChange form-select" data-id="${bed.id}">
          <option value="available" ${bed.status === "available" ? "selected" : ""}>Available</option>
          <option value="reserved" ${bed.status === "reserved" ? "selected" : ""}>Reserved</option>
          <option value="maintenance" ${bed.status === "maintenance" ? "selected" : ""}>Maintenance</option>
        </select>
      </td>
    `;
    
    bedsTable.appendChild(tr);
  });

  // Add status change listeners
  document.querySelectorAll(".statusChange").forEach(sel => {
    sel.addEventListener("change", async () => {
      await fetch(`${API}/beds/${sel.dataset.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: sel.value })
      });
      loadBeds();
    });
  });
}



// ------------------------- LOAD RESOURCES -------------------------
async function loadResources() {
  const res = await fetch(`${API}/resources`);
  const resources = await res.json();

  resSelect.innerHTML = "";

  resources.forEach(resource => {
    const opt = document.createElement("option");
    opt.value = resource.id;
    opt.textContent = `${resource.name} (${resource.available}/${resource.total})`;
    resSelect.appendChild(opt);
  });
}



// ------------------------- ALLOCATE RESOURCE -------------------------
allocBtn.addEventListener("click", async () => {
  const bedId = bedSelect.value;
  const resourceId = resSelect.value;
  const qty = parseInt(qtyInput.value);

  if (!bedId || !resourceId || qty < 1) {
    allocMsg.textContent = "⚠ Please select bed, resource & quantity.";
    allocMsg.style.color = "red";
    return;
  }

  const res = await fetch(`${API}/allocate-resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bedId, resourceId, qty })
  });

  const data = await res.json();

  if (data.error) {
    allocMsg.textContent = "❌ " + data.error;
    allocMsg.style.color = "red";
  } else {
    allocMsg.textContent = "✔ Resource Allocated Successfully!";
    allocMsg.style.color = "green";
    loadBeds();
    loadResources();
  }
});



// ------------------------- LOGOUT BUTTON -------------------------
document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
});



// ------------------------- INITIAL LOAD -------------------------
loadBeds();
loadResources();
