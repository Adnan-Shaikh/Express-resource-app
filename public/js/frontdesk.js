// Load beds, resources, and patients on page load
window.onload = () => {
    loadBeds();
    loadResources();
    loadAllocatedPatients();
};

// -------------------- Load Beds --------------------
function loadBeds() {
    fetch("/api/beds")
        .then(res => res.json())
        .then(beds => {
            const bedSelect = document.getElementById("bedSelect");
            bedSelect.innerHTML = "";

            beds.forEach(bed => {
                if (bed.status === "available") {
                    bedSelect.innerHTML += `
                        <option value="${bed.id}">${bed.id}</option>
                    `;
                }
            });
        });
}

// -------------------- Load Resources --------------------
function loadResources() {
    fetch("/api/resources-frontdesk")
        .then(res => res.json())
        .then(resources => {
            const select = document.getElementById("resourceSelect");
            select.innerHTML = `<option value="">-- No Resource --</option>`;

            resources.forEach(r => {
                if (r.available > 0) {
                    select.innerHTML += `
                        <option value="${r.id}">${r.name}</option>
                    `;
                }
            });
        });
}

// -------------------- Submit Form --------------------
document.getElementById("admitForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("pname").value;
    const age = document.getElementById("page").value;
    const problem = document.getElementById("pproblem").value;
    const bedId = document.getElementById("bedSelect").value;
    const resourceId = document.getElementById("resourceSelect").value;

    if (!name || !bedId) {
        alert("Name and Bed are required");
        return;
    }

    const body = {
        name,
        age,
        problem,
        bedId,
        resourceId: resourceId || null
    };

    fetch("/api/patients-frontdesk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("❌ Allocation Failed");
        } else {
            alert("✅ Submission Successful");
            loadBeds();
            loadAllocatedPatients();
        }
    })
    .catch(() => {
        alert("❌ Server Error");
    });
});

// -------------------- Load Allocated Patients --------------------
// -------------------- Load Allocated Patients --------------------
function loadAllocatedPatients() {
    fetch("/api/patients")
        .then(res => res.json())
        .then(patients => {
            const tbody = document.querySelector("#allocatedTable tbody");
            tbody.innerHTML = "";

            patients.forEach(p => {
                let statusText = "None";
                // You may need to adapt this logic based on true data structure
                if (p.status) {
                    if (p.status.toLowerCase() === "maintenance" || p.status.toLowerCase() === "under maintenance") {
                        statusText = "Under Maintenance";
                    } else if (p.status.toLowerCase() === "assigned" || p.resourceId) {
                        statusText = "Assigned";
                    } else {
                        statusText = p.status;
                    }
                } else if (p.resourceId) {
                    statusText = "Assigned";
                }
                // Default fallback
                tbody.innerHTML += `
                    <tr>
                        <td>${p.bedId}</td>
                        <td>${p.name}</td>
                        <td>${statusText}</td>
                    </tr>
                `;
            });
        });
}
