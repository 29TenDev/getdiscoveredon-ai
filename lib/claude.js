// lib/claude.js
// Uses Claude to generate uniquely written findings for each business report.
// Takes raw DataForSEO data and returns rich 3-part narrative findings.

export async function generateNarrativeReport(rawData) {
  const {
    businessName, domain, location,
    scores, llmData, metrics, serpData, bizProfile, onPage,
  } = rawData;

  const uniqueDomains = [...new Set(
    llmData.citedSources
      .map((s) => { try { return new URL(s.url).hostname; } catch { return null; } })
      .filter(Boolean)
  )];

  // Build a detailed data summary for Claude to reason from
  const dataSummary = `
BUSINESS: ${businessName}
DOMAIN: ${domain}
LOCATION: ${location}

AI VISIBILITY SCORES:
- ChatGPT: ${scores.chatgpt}/100
- Gemini: ${scores.gemini}/100  
- Perplexity: ${scores.perplexity}/100
- Overall: ${scores.overall}/100

LLM MENTIONS DATA:
- Total AI mentions found: ${llmData.rawMentionCount}
- Monthly AI search volume: ${llmData.aiVolume}
- AI impressions: ${metrics.impressions}
- Citation rate: ${(metrics.citationRate * 100).toFixed(1)}%
- Number of citation sources: ${uniqueDomains.length}
- Citation source domains: ${uniqueDomains.slice(0, 5).join(", ") || "none found"}

GOOGLE SERP DATA:
- Current Google ranking position: ${serpData.serpRank || "not found in top results"}
- AI Overview exists for category: ${serpData.hasAIOverview ? "YES" : "NO"}
- Business cited in AI Overview: ${serpData.aiOverviewMentioned ? "YES" : "NO"}
- Competitors currently cited in AI Overview: ${serpData.competitorsCited?.join(", ") || "none detected"}

GOOGLE BUSINESS PROFILE:
- Profile found: ${bizProfile.found ? "YES" : "NO"}
- Rating: ${bizProfile.rating}/5
- Review count: ${bizProfile.reviewCount}
- Profile verified/claimed: ${bizProfile.isVerified ? "YES" : "NO"}
- Has website listed: ${bizProfile.hasWebsite ? "YES" : "NO"}
- Hours listed: ${bizProfile.hoursListed ? "YES" : "NO"}
- Has phone: ${bizProfile.hasPhone ? "YES" : "NO"}
- Has photos: ${bizProfile.hasPhotos ? "YES" : "NO"}
- Has description: ${bizProfile.hasDescription ? "YES" : "NO"}
- Profile completeness score: ${bizProfile.completenessScore || 0}%

WEBSITE ON-PAGE SIGNALS:
- Schema markup present: ${onPage?.hasSchemaMarkup ? "YES" : "NO"}
- FAQ schema present: ${onPage?.hasFAQSchema ? "YES" : "NO"}
- LocalBusiness schema present: ${onPage?.hasLocalBusinessSchema ? "YES" : "NO"}
- Meta description present: ${onPage?.metaDescriptionPresent ? "YES" : "NO"}
- SSL/HTTPS: ${onPage?.hasSSL ? "YES" : "NO"}
- Estimated word count: ${onPage?.wordCount || "unknown"}
- On-page score: ${onPage?.onPageScore || "unknown"}
`;

  const prompt = `You are an expert AI Search Visibility Analyst writing a premium business intelligence report for ${businessName}, a business located in ${location} with website ${domain}.

Based on the following data collected from multiple APIs, write a comprehensive AI visibility report with:

1. An executive summary (2-3 sentences, specific to this business)
2. Six detailed findings, each with three parts:
   - "what_found": 2-3 sentences describing exactly what the data shows for THIS specific business
   - "why_matters": 2-3 sentences explaining the real business impact in plain language (mention specific numbers where available)
   - "what_to_do": 2-3 sentences with ONE concrete, prioritized action they can take this week

The six findings must cover:
1. Google AI Overview Presence
2. Google Business Profile Completeness  
3. AI Citation Sources & Authority
4. Website Structured Data & AI Readiness
5. Review Authority & Social Proof
6. Overall AI Search Visibility Score

Write in a professional but approachable tone — like a knowledgeable consultant who genuinely cares about helping this business owner succeed. Be specific to their actual data — never generic. Reference their actual scores, numbers, and competitor situation where relevant.

DATA:
${dataSummary}

Respond ONLY with valid JSON in this exact structure, no markdown, no explanation:
{
  "executiveSummary": "string",
  "findings": [
    {
      "title": "string",
      "status": "good|warning|bad",
      "what_found": "string",
      "why_matters": "string", 
      "what_to_do": "string"
    }
  ],
  "recommendations": [
    "string"
  ]
}

The recommendations array should contain 5 prioritized action items, ordered from highest to lowest impact. Each should be 1-2 sentences, specific and actionable.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON response
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  return {
    executiveSummary: parsed.executiveSummary,
    findings: parsed.findings,
    recommendations: parsed.recommendations,
    citedSources: llmData.citedSources.slice(0, 10),
    uniqueCitingDomains: uniqueDomains,
  };
}
