const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'replace_with_strong_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

function readJSON(filename) {
  const p = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJSON(filename, data) {
  const p = path.join(DATA_DIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// -------------------- LOGIN --------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = { username: user.username, role: user.role };
  res.json({ username: user.username, role: user.role });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

function requireRole(role) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Not logged in' });
    if (role === 'any') return next();
    if (Array.isArray(role)) {
      if (role.includes(user.role)) return next();
    } else if (user.role === role) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// -------------------- STATIC FILES --------------------
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/frontdesk.html', requireRole(['receptionist', 'admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'frontdesk.html'));
});
app.get('/admin.html', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/resources.html', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resources.html'));
});

// -------------------- BEDS --------------------
// -------------------- BEDS --------------------
app.get('/api/beds', requireRole(['receptionist', 'admin']), (req, res) => {
  const beds = readJSON('beds.json');
  const resources = readJSON('resources.json');

  const finalBeds = beds.map(bed => {
    const matchedResource = resources.find(r => r.id === bed.allocatedResource);

    return {
      ...bed,
      // restore admin panel expected structure
      resources: matchedResource
        ? [{ name: matchedResource.name, qty: 1 }]
        : bed.resources || [],

      resourceName: matchedResource ? matchedResource.name : null
    };
  });

  res.json(finalBeds);
});



// -------------------- PATIENT ASSIGNMENT --------------------
app.post('/api/patients', requireRole(['receptionist', 'admin']), (req, res) => {
  const { name, age, problem, bedId, resourceId } = req.body;

  if (!name || !bedId) return res.status(400).json({ error: 'Missing fields' });

  const beds = readJSON('beds.json');
  const patients = readJSON('patients.json');
  const resources = readJSON('resources.json');

  const bed = beds.find(b => b.id === bedId);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });
  if (bed.status !== 'available') return res.status(400).json({ error: 'Bed not available' });

  let assignedResource = null;
  if (resourceId) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.available < 1) return res.status(400).json({ error: 'Resource unavailable' });

    resource.available -= 1;
    assignedResource = { resourceId, name: resource.name, qty: 1 };
  }

  const newPatient = {
    id: 'P' + (patients.length + 1),
    name,
    age,
    problem,
    bedId,
    resourceId: resourceId || null,
    admittedAt: new Date().toISOString()
  };
  patients.push(newPatient);
  writeJSON('patients.json', patients);

  bed.patientId = newPatient.id;
  bed.status = 'reserved';
  bed.resources = assignedResource ? [assignedResource] : [];
  writeJSON('beds.json', beds);

  writeJSON('resources.json', resources);

  res.json({ ok: true, patient: newPatient });
});

// -------------------- FRONTDESK ALIASES (fix for your JS) --------------------
app.get('/api/resources-frontdesk', requireRole(['receptionist', 'admin']), (req, res) => {
  res.json(readJSON('resources.json'));
});

app.post('/api/patients-frontdesk', requireRole(['receptionist', 'admin']), (req, res) => {
  const body = req.body;  // keep the data
  req.body = body;        // ensure Express keeps it

  // Call main handler manually with correct method and body
  const { name, age, problem, bedId, resourceId } = body;

  if (!name || !bedId) return res.status(400).json({ error: "Missing fields" });

  const beds = readJSON('beds.json');
  const patients = readJSON('patients.json');
  const resources = readJSON('resources.json');

  const bed = beds.find(b => b.id === bedId);
  if (!bed) return res.status(404).json({ error: "Bed not found" });
  if (bed.status !== "available") return res.status(400).json({ error: "Bed not available" });

  let assignedResource = null;
  if (resourceId) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    if (resource.available < 1) return res.status(400).json({ error: "Resource unavailable" });
    resource.available -= 1;
    assignedResource = { resourceId, name: resource.name, qty: 1 };
  }

  const newPatient = {
    id: 'P' + (patients.length + 1),
    name,
    age,
    problem,
    bedId,
    resourceId: resourceId || null,
    admittedAt: new Date().toISOString()
  };

  patients.push(newPatient);
  writeJSON('patients.json', patients);

  bed.patientId = newPatient.id;
  bed.status = "reserved";
  bed.resources = assignedResource ? [assignedResource] : [];
  writeJSON('beds.json', beds);

  writeJSON('resources.json', resources);

  return res.json({ ok: true, patient: newPatient });
});


// -------------------- ADMIN ROUTES --------------------
app.get('/api/patients', requireRole(['receptionist', 'admin']), (req, res) => {
  res.json(readJSON('patients.json'));
});

app.put('/api/beds/:id/status', requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  const beds = readJSON('beds.json');
  const bed = beds.find(b => b.id === id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });

  if (!['available', 'reserved', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status === 'available') bed.patientId = null;
  bed.status = status;

  writeJSON('beds.json', beds);
  res.json({ ok: true, bed });
});

// Only admin version (leave untouched)
app.get('/api/resources', requireRole('admin'), (req, res) => {
  res.json(readJSON('resources.json'));
});

app.post('/api/resources', requireRole('admin'), (req, res) => {
  const { name, total } = req.body;
  if (!name || typeof total !== 'number') {
    return res.status(400).json({ error: 'Name and total required' });
  }

  const resources = readJSON('resources.json');
  const resource = {
    id: 'R' + (resources.length + 1),
    name,
    total,
    available: total
  };
  resources.push(resource);
  writeJSON('resources.json', resources);

  res.json({ ok: true, resource });
});

app.post('/api/allocate-resource', requireRole('admin'), (req, res) => {
  const { bedId, resourceId, qty } = req.body;

  const beds = readJSON('beds.json');
  const resources = readJSON('resources.json');

  const bed = beds.find(b => b.id === bedId);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });

  const resource = resources.find(r => r.id === resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  if (resource.available < qty)
    return res.status(400).json({ error: 'Not enough available' });

  resource.available -= qty;

  if (!bed.resources) bed.resources = [];
  bed.resources.push({ name: resource.name, qty });

  writeJSON('resources.json', resources);
  writeJSON('beds.json', beds);

  res.json({ ok: true });
});


// -------------------- START --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
