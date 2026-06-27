export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Simple router
    if (path === "/auth/signup" && method === "POST") {
      return signup(request, env);
    }
    if (path === "/auth/login" && method === "POST") {
      return login(request, env);
    }

    if (path === "/user/update" && method === "POST") {
      return updateUser(request, env);
    }

    if (path === "/washer/updateCapabilities" && method === "POST") {
      return updateWasherCapabilities(request, env);
    }

    if (path === "/washer/updateAvailability" && method === "POST") {
      return updateWasherAvailability(request, env);
    }

    if (path === "/order/create" && method === "POST") {
      return createOrder(request, env);
    }

    if (path === "/order/accept" && method === "POST") {
      return acceptOrder(request, env);
    }

    if (path === "/order/updateStatus" && method === "POST") {
      return updateOrderStatus(request, env);
    }

    if (path.startsWith("/order/") && method === "GET") {
      const id = path.split("/")[2];
      return getOrder(id, env);
    }

    if (path === "/location/update" && method === "POST") {
      return updateLocation(request, env);
    }

    if (path.startsWith("/location/washer/") && method === "GET") {
      const washerId = path.split("/")[3];
      return getWasherLocation(washerId, env);
    }

    if (path === "/message/send" && method === "POST") {
      return sendMessage(request, env, ctx);
    }

    if (path.startsWith("/message/history/") && method === "GET") {
      const orderId = path.split("/")[3];
      return getMessageHistory(orderId, env);
    }

    if (path === "/payout/send" && method === "POST") {
      return sendPayout(request, env);
    }

    return new Response("Not found", { status: 404 });
  },

  // Durable Object for chat
  async durableObjectNamespace(env) {
    return env.ORDER_CHAT;
  }
};

// ---------- AUTH ----------

async function signup(request, env) {
  const body = await request.json();
  const { name, email, phone, role } = body;

  await env.DB.prepare(
    `INSERT INTO users (name, email, phone, role, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(name, email, phone, role).run();

  return json({ ok: true });
}

async function login(request, env) {
  // Stub: implement real auth later
  return json({ ok: true, token: "fake-token" });
}

// ---------- USER / WASHER ----------

async function updateUser(request, env) {
  const body = await request.json();
  const { userId, name, phone, photo } = body;

  await env.DB.prepare(
    `UPDATE users SET name = ?, phone = ?, photo = ? WHERE id = ?`
  ).bind(name, phone, photo, userId).run();

  return json({ ok: true });
}

async function updateWasherCapabilities(request, env) {
  const body = await request.json();
  const {
    userId,
    paypalEmail,
    radiusMeters,
    homeLat,
    homeLng,
    basePrice,
    foldingPrice,
    sewingPrice,
    shoePrice,
    maxBags
  } = body;

  await env.DB.prepare(
    `INSERT INTO washer_profiles
     (user_id, paypal_email, radius_meters, home_lat, home_lng,
      base_price, folding_price, sewing_price, shoe_price, max_bags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
      paypal_email = excluded.paypal_email,
      radius_meters = excluded.radius_meters,
      home_lat = excluded.home_lat,
      home_lng = excluded.home_lng,
      base_price = excluded.base_price,
      folding_price = excluded.folding_price,
      sewing_price = excluded.sewing_price,
      shoe_price = excluded.shoe_price,
      max_bags = excluded.max_bags`
  ).bind(
    userId,
    paypalEmail,
    radiusMeters,
    homeLat,
    homeLng,
    basePrice,
    foldingPrice,
    sewingPrice,
    shoePrice,
    maxBags
  ).run();

  return json({ ok: true });
}

async function updateWasherAvailability(request, env) {
  const body = await request.json();
  const { userId, available } = body;

  await env.DB.prepare(
    `UPDATE washer_profiles SET available = ? WHERE user_id = ?`
  ).bind(available ? 1 : 0, userId).run();

  return json({ ok: true });
}

// ---------- ORDERS ----------

async function createOrder(request, env) {
  const body = await request.json();
  const {
    clientId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    bagCount,
    folding,
    sewing,
    shoes
  } = body;

  // Basic pricing example
  const basePrice = 10 + bagCount * 5;
  const foldingPrice = folding ? 5 : 0;
  const sewingPrice = sewing ? 8 : 0;
  const shoePrice = shoes ? 6 : 0;

  const totalPrice = basePrice + foldingPrice + sewingPrice + shoePrice;

  const platformFeeBase = parseFloat(env.PLATFORM_FEE_BASE || "0.20");
  const washerCutBase = basePrice * (1 - platformFeeBase);
  const platformFee = basePrice - washerCutBase;

  const washerCut =
    washerCutBase +
    foldingPrice * 0.9 +
    sewingPrice * 0.95 +
    shoePrice * 0.9;

  const result = await env.DB.prepare(
    `INSERT INTO orders
     (client_id, status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
      bag_count, folding, sewing, shoes, price, washer_cut, platform_fee,
      created_at, updated_at)
     VALUES (?, 'requested', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    clientId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    bagCount,
    folding ? 1 : 0,
    sewing ? 1 : 0,
    shoes ? 1 : 0,
    totalPrice,
    washerCut,
    platformFee
  ).run();

  return json({ ok: true, orderId: result.lastRowId, price: totalPrice });
}

async function acceptOrder(request, env) {
  const body = await request.json();
  const { orderId, washerId } = body;

  await env.DB.prepare(
    `UPDATE orders
     SET washer_id = ?, status = 'accepted', updated_at = datetime('now')
     WHERE id = ?`
  ).bind(washerId, orderId).run();

  return json({ ok: true });
}

async function updateOrderStatus(request, env) {
  const body = await request.json();
  const { orderId, status } = body;

  await env.DB.prepare(
    `UPDATE orders
     SET status = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(status, orderId).run();

  return json({ ok: true });
}

async function getOrder(id, env) {
  const row = await env.DB.prepare(
    `SELECT * FROM orders WHERE id = ?`
  ).bind(id).first();

  return json({ ok: true, order: row });
}

// ---------- LOCATION ----------

async function updateLocation(request, env) {
  const body = await request.json();
  const { userId, lat, lng, type } = body;

  const key = `${type}:${userId}`;
  const value = JSON.stringify({
    lat,
    lng,
    timestamp: Date.now()
  });

  await env.LOCATIONS_KV.put(key, value);

  return json({ ok: true });
}

async function getWasherLocation(washerId, env) {
  const key = `washer:${washerId}`;
  const value = await env.LOCATIONS_KV.get(key);

  if (!value) return json({ ok: false, error: "No location" }, 404);

  return json({ ok: true, location: JSON.parse(value) });
}

// ---------- MESSAGING (Durable Object) ----------

export class OrderChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === "/send" && method === "POST") {
      const body = await request.json();
      const { orderId, senderId, text } = body;

      await this.env.DB.prepare(
        `INSERT INTO messages (order_id, sender_id, text, created_at)
         VALUES (?, ?, ?, datetime('now'))`
      ).bind(orderId, senderId, text).run();

      return json({ ok: true });
    }

    if (path.startsWith("/history/") && method === "GET") {
      const orderId = path.split("/")[2];

      const rows = await this.env.DB.prepare(
        `SELECT * FROM messages WHERE order_id = ? ORDER BY created_at ASC`
      ).bind(orderId).all();

      return json({ ok: true, messages: rows.results });
    }

    return new Response("Not found", { status: 404 });
  }
}

// ---------- PAYOUTS (stub) ----------

async function sendPayout(request, env) {
  const body = await request.json();
  const { orderId } = body;

  const order = await env.DB.prepare(
    `SELECT washer_id, washer_cut FROM orders WHERE id = ?`
  ).bind(orderId).first();

  if (!order) return json({ ok: false, error: "Order not found" }, 404);

  // Here you’d call PayPal Payouts API with washer_cut and washer’s PayPal email
  // Stubbed for now:
  await env.DB.prepare(
    `UPDATE orders SET status = 'payout_sent', updated_at = datetime('now') WHERE id = ?`
  ).bind(orderId).run();

  return json({ ok: true });
}

// ---------- UTIL ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
