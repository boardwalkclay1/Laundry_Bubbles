const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Helpers for JSON "DB" ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function readJSON(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8') || '[]';
  return JSON.parse(raw);
}

function writeJSON(file, data) {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static(__dirname)); // serve all your HTML/JS/CSS

// Simple cookie-based session (for demo)
function createSession(userId) {
  const sessions = readJSON('sessions.json');
  const token = crypto.randomBytes(16).toString('hex');
  sessions.push({ token, userId, createdAt: Date.now() });
  writeJSON('sessions.json', sessions);
  return token;
}

function getSession(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([a-f0-9]+)/);
  if (!match) return null;
  const token = match[1];
  const sessions = readJSON('sessions.json');
  return sessions.find(s => s.token === token) || null;
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });
  req.userId = session.userId;
  next();
}

function requireActiveSubscription(req, res, next) {
  const payments = readJSON('payments.json');
  const now = Date.now();
  const record = payments.find(p => p.userId === req.userId && p.expiresAt > now);
  if (!record) {
    return res.status(402).json({ error: 'Subscription required', redirectTo: '/payment-methods.html' });
  }
  next();
}

// --- Auth endpoints ---
app.post('/api/signup', (req, res) => {
  const { email, password, role } = req.body; // role: 'client' | 'washer'
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const users = readJSON('users.json');
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  users.push({ id, email, password, role, createdAt: Date.now() });
  writeJSON('users.json', users);

  const token = createSession(id);
  res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/`);
  res.json({ success: true, userId: id });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = createSession(user.id);
  res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/`);
  res.json({ success: true, userId: user.id });
});

// --- Payment gating: $1 per 24 hours ---
app.post('/api/create-payment', requireAuth, (req, res) => {
  // For now, just simulate a payment link.
  // In production, integrate Stripe/PayPal and return their checkout URL.
  const fakePaymentId = crypto.randomBytes(8).toString('hex');
  const payments = readJSON('payments.json');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  payments.push({
    id: fakePaymentId,
    userId: req.userId,
    amount: 1,
    currency: 'USD',
    createdAt: Date.now(),
    expiresAt
  });
  writeJSON('payments.json', payments);

  // Frontend can just redirect to a "success" page for now
  res.json({
    success: true,
    paymentId: fakePaymentId,
    message: 'Payment simulated. Access granted for 24 hours.'
  });
});

// --- Location + active users ---
app.post('/api/location', requireAuth, requireActiveSubscription, (req, res) => {
  const { lat, lng, isActive } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const locations = readJSON('locations.json');
  const now = Date.now();
  const idx = locations.findIndex(l => l.userId === req.userId);

  const record = {
    userId: req.userId,
    lat,
    lng,
    isActive: !!isActive,
    updatedAt: now
  };

  if (idx === -1) locations.push(record);
  else locations[idx] = record;

  writeJSON('locations.json', locations);
  res.json({ success: true });
});

app.get('/api/active-users', requireAuth, requireActiveSubscription, (req, res) => {
  const locations = readJSON('locations.json');
  const users = readJSON('users.json');
  const now = Date.now();
  const cutoff = now - 5 * 60 * 1000; // last 5 minutes

  const active = locations
    .filter(l => l.isActive && l.updatedAt > cutoff)
    .map(l => {
      const user = users.find(u => u.id === l.userId) || {};
      return {
        userId: l.userId,
        lat: l.lat,
        lng: l.lng,
        role: user.role,
        updatedAt: l.updatedAt
      };
    });

  res.json({ active });
});

// Example protected route for chat / matching
app.get('/api/protected-chat', requireAuth, requireActiveSubscription, (req, res) => {
  res.json({ ok: true, message: 'You can access chat because you paid.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
