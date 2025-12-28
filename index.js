// ------------------------------
// Firebase + Stripe Setup
// ------------------------------
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

/**
 * Stripe Webhook
 * - Expects raw body (configure in Firebase if needed)
 * - Verifies Stripe signature
 * - Handles checkout.session.completed for tips
 */
exports.stripeWebhook = functions
  .runWith({ memory: "256MB" })
  .https.onRequest(async (req, res) => {
    // Only allow POST for webhooks
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing Stripe signature header");
      return res.status(400).send("Missing Stripe signature header");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET env var");
      return res.status(500).send("Server misconfigured");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // ------------------------------
      // Handle successful checkout
      // ------------------------------
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const metadata = session.metadata || {};

        const orderId = metadata.orderId;
        const washerId = metadata.washerId;
        const amount = Number(metadata.amount);

        if (!orderId || !washerId || isNaN(amount)) {
          console.error("Missing or invalid metadata on session:", metadata);
        } else {
          const orderRef = db.collection("orders").doc(orderId);

          // Update order totals
          await orderRef.update({
            tipAmount: admin.firestore.FieldValue.increment(amount),
            washerEarnings: admin.firestore.FieldValue.increment(amount),
          });

          // Log event
          await db.collection("order_events").add({
            orderId,
            washerId,
            status: "tip_added",
            amount,
            createdAt: Date.now(),
          });

          console.log("Tip processed:", { orderId, washerId, amount });
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res.status(500).send("Internal Server Error");
    }
  });

/**
 * Create Stripe Checkout Session
 * - Expects JSON body: { orderId, washerId, amount }
 * - Returns: { url }
 */
exports.createTipCheckoutSession = functions
  .runWith({ memory: "256MB" })
  .https.onRequest(async (req, res) => {
    // Basic CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY env var");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    try {
      const { orderId, washerId, amount } = req.body || {};

      const numericAmount = Number(amount);

      if (!orderId || !washerId || isNaN(numericAmount) || numericAmount <= 0) {
        return res
          .status(400)
          .json({ error: "Missing or invalid orderId, washerId, or amount" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Washer Tip" },
              unit_amount: Math.round(numericAmount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: "https://yourdomain.com/tip-success.html",
        cancel_url: "https://yourdomain.com/tip-cancel.html",
        metadata: {
          orderId,
          washerId,
          amount: String(numericAmount),
        },
      });

      return res.json({ url: session.url });
    } catch (err) {
      console.error("Checkout session error:", err);
      return res
        .status(500)
        .json({ error: "Failed to create checkout session" });
    }
  });
