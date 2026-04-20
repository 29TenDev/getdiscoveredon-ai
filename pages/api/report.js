import Stripe from "stripe";
import { generateReport } from "../../lib/dataforseo";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return res.status(402).json({ error: "Payment not completed" });
    const { businessName, domain, location } = session.metadata;
    if (!businessName || !domain) return res.status(400).json({ error: "Missing business details in session" });
    const report = await generateReport({ businessName, domain, location });
    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error("Report generation error:", err);
    return res.status(500).json({ error: "Report generation failed. Please contact support." });
  }
}
