const API = "/api";
api('/api/me').catch(() => window.location = '/index.html');


const bedSelect = document.getElementById("bedSelect");
const resSelect = document.getElementById("resSelect");
const allocTable = document.querySelector("#allocTable tbody");
const admitBtn = document.getElementById("admitBtn");
const admitMsg = document.getElementById("admitMsg");

// ---------------------- LOAD BEDS ---------------------- //
async function loadBeds() {
  try {
    const res = await fetch(`${API}/beds`);
    const beds = await res.json();

    bedSelect.innerHTML = "";
    allocTable.innerHTML = "";

    // Show beds in table (only allocated ones)
    beds.forEach(bed => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${bed.id}</td>
        <td>${bed.patientId || "—"}</td>
        <td>${bed.status}</td>
      `;
      allocTable.appendChild(tr);
    });

    // Populate dropdown (ALL BEDS)
    beds.forEach(bed => {
      const opt = document.createElement("option");
      opt.value = bed.id;
      opt.textContent = `${bed.id} (${bed.status})`;
      bedSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load beds:", err);
  }
}

// ---------------------- LOAD RESOURCES ---------------------- //
async function loadResources() {
  try {
    const res = await fetch(`${API}/resources`);
    const resources = await res.json();

    resSelect.innerHTML = "";

    resources.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.available}/${r.total})`;
      resSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load resources:", err);
  }
}

// ---------------------- ADMIT PATIENT ---------------------- //
admitBtn.addEventListener("click", async () => {
  const data = {
    name: document.getElementById("pName").value.trim(),
    age: document.getElementById("pAge").value,
    gender: document.getElementById("pGender").value,
    condition: document.getElementById("pCondition").value.trim(),
    bedId: bedSelect.value,
    resourceId: resSelect.value,
    qty: parseInt(document.getElementById("resQty").value)
  };

  const res = await fetch(`${API}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.error) {
    admitMsg.textContent = "❌ " + result.error;
    admitMsg.style.color = "red";
  } else {
    admitMsg.textContent = "✔ Patient Admitted Successfully!";
    admitMsg.style.color = "green";
    loadBeds();
    loadResources();
  }
});

// ---------------------- LOGOUT ---------------------- //
document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
});

// ---------------------- INITIAL LOAD ---------------------- //
loadBeds();
loadResources();
