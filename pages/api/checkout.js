import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { businessName, domain, location, email } = req.body;
  if (!businessName || !domain) return res.status(400).json({ error: "businessName and domain are required" });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: parseInt(process.env.NEXT_PUBLIC_REPORT_PRICE || "4900"),
          product_data: {
            name: "AI Visibility Report",
            description: `Full AI visibility analysis for ${businessName} — ChatGPT, Gemini & Perplexity`,
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/report?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?cancelled=true`,
      metadata: { businessName, domain, location: location || "United States" },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Could not create checkout session" });
  }
}
