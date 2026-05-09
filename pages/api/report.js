// pages/api/report.js
// Verifies Stripe payment, collects DataForSEO data, generates Claude narrative.

import Stripe from "stripe";
import { generateRawData } from "../../lib/dataforseo";
import { generateNarrativeReport } from "../../lib/claude";

// Force Node.js runtime — prevents React bundling conflicts
export const config = {
  runtime: "nodejs",
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  try {
    // 1. Verify Stripe payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const { businessName, domain, location } = session.metadata;
    if (!businessName || !domain) {
      return res.status(400).json({ error: "Missing business details in session" });
    }

    // 2. Collect all DataForSEO data
    const rawData = await generateRawData({
      businessName,
      domain,
      location: location || "United States",
    });

    // 3. Generate Claude narrative findings
    const narrative = await generateNarrativeReport(rawData);

    // 4. Assemble final report
    const report = {
      businessName,
      domain,
      location: location || "United States",
      generatedAt: rawData.generatedAt,
      scores: rawData.scores,
      aiVolume: rawData.llmData.aiVolume,
      impressions: rawData.metrics.impressions,
      citationRate: rawData.metrics.citationRate,
      bizProfile: rawData.bizProfile,
      serpData: rawData.serpData,
      onPage: rawData.onPage,
      executiveSummary: narrative.executiveSummary,
      findings: narrative.findings,
      recommendations: narrative.recommendations,
      citedSources: narrative.citedSources,
      uniqueCitingDomains: narrative.uniqueCitingDomains,
    };

    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error("Report generation error:", err);
    return res.status(500).json({ error: "Report generation failed. Please contact support." });
  }
}
