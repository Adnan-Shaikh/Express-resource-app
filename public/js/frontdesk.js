// Load beds and resources on page load
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
document.getElementById("submitBtn").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const problem = document.getElementById("problem").value;
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
                alert("❌ Allocation Failed: " + data.error);
            } else {
                alert(
                    `✅ Patient Successfully Allocated!
Patient: ${data.name}
Bed: ${data.bedId}
Resource: ${data.resourceId ? data.resourceId : "None"}`
                );

                loadBeds();
                loadAllocatedPatients();
            }
        })
        .catch(err => {
            alert("❌ Server Error: " + err.message);
        });
});

// -------------------- Load allocated patients --------------------
function loadAllocatedPatients() {
    fetch("/api/patients")
        .then(res => res.json())
        .then(patients => {
            const tbody = document.querySelector("#allocatedTable tbody");
            tbody.innerHTML = "";

            patients.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td>${p.bedId}</td>
                        <td>${p.name}</td>
                        <td>${p.resourceId ? p.resourceId : "None"}</td>
                    </tr>
                `;
            });
        });
}

