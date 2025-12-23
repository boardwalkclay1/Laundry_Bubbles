// ------------------------------
// Firebase + Stripe Setup
// ------------------------------
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

// Allow raw body for Stripe webhook
exports.stripeWebhook = functions
  .runWith({ memory: "256MB" })
  .https.onRequest((req, res) => {
    const sig = req.headers["stripe-signature"];

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

    // ------------------------------
    // Handle successful checkout
    // ------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { orderId, washerId, amount } = session.metadata;

      const orderRef = db.collection("orders").doc(orderId);

      // Update order totals
      orderRef.update({
        tipAmount: admin.firestore.FieldValue.increment(Number(amount)),
        washerEarnings: admin.firestore.FieldValue.increment(Number(amount)),
      });

      // Log event
      db.collection("order_events").add({
        orderId,
        washerId,
        status: "tip_added",
        amount: Number(amount),
        createdAt: Date.now(),
      });

      console.log("Tip processed:", amount);
    }

    res.sendStatus(200);
  });

// ------------------------------
// Create Stripe Checkout Session
// ------------------------------
exports.createTipCheckoutSession = functions
  .runWith({ memory: "256MB" })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      const { orderId, washerId, amount } = req.body;

      if (!orderId || !washerId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Washer Tip" },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: "https://yourdomain.com/tip-success.html",
        cancel_url: "https://yourdomain.com/tip-cancel.html",
        metadata: { orderId, washerId, amount },
      });

      return res.json({ url: session.url });
    } catch (err) {
      console.error("Checkout session error:", err);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
