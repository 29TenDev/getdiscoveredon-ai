const DFS_BASE = "https://api.dataforseo.com/v3";

function getAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString("base64");
  return { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };
}

async function dfsPost(path, body) {
  const res = await fetch(`${DFS_BASE}${path}`, {
    method: "POST", headers: getAuthHeader(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── 1. LLM Mentions — real ChatGPT + Google AI Overview citation data ─────────
async function getLLMMentions(brandName) {
  const data = await dfsPost("/ai_optimization/llm_mentions/search_mentions/live", [
    { keyword: brandName, language_code: "en", location_code: 2840, limit: 10 },
  ]);
  const results = data?.tasks?.[0]?.result || [];
  const citedSources = [];
  let totalVolume = 0;
  results.forEach((item) => {
    totalVolume += item.monthly_searches || 0;
    (item.sources || []).forEach((src) => {
      citedSources.push({
        url: src.url,
        title: src.title,
        type: src.type,
        platform: item.se_type,
      });
    });
  });
  return { mentions: results, citedSources, aiVolume: totalVolume, rawMentionCount: results.length };
}

// ── 2. Aggregated Metrics — impression share + citation rate ──────────────────
async function getAggregatedMetrics(brandName) {
  const data = await dfsPost("/ai_optimization/llm_mentions/aggregated_metrics/live", [
    { keyword: brandName, language_code: "en", location_code: 2840 },
  ]);
  const result = data?.tasks?.[0]?.result?.[0];
  if (!result) return { impressions: 0, citationRate: 0, topDomains: [], mentionShare: 0 };
  return {
    impressions: result.impressions || 0,
    citationRate: result.citation_rate || 0,
    topDomains: result.top_domains || [],
    mentionShare: result.mention_share || 0,
  };
}

// ── 3. SERP API — Google rankings + AI Overview presence ─────────────────────
async function getGoogleSerpVisibility(brandName, domain) {
  const queries = [brandName, `${brandName} reviews`, `${brandName} near me`];
  const data = await dfsPost("/serp/google/organic/live/advanced",
    queries.map((kw) => ({
      keyword: kw, language_code: "en", location_code: 2840, device: "desktop", os: "windows",
    }))
  );
  let serpRank = null, hasAIOverview = false, aiOverviewMentioned = false;
  (data?.tasks || []).forEach((task) => {
    (task?.result || []).forEach((result) => {
      (result?.items || []).forEach((item) => {
        if (item.type === "organic" && item.url?.includes(domain)) {
          if (serpRank === null || item.rank_absolute < serpRank) serpRank = item.rank_absolute;
        }
        if (item.type === "ai_overview") {
          hasAIOverview = true;
          if (JSON.stringify(item).toLowerCase().includes(brandName.toLowerCase())) aiOverviewMentioned = true;
        }
      });
    });
  });
  return { serpRank, hasAIOverview, aiOverviewMentioned, queriesChecked: queries.length };
}

// ── 4. Business Data API — Google Business Profile health ─────────────────────
async function getBusinessProfile(businessName, location) {
  const data = await dfsPost("/business_data/google/my_business_info/live", [
    { keyword: `${businessName} ${location}`, language_code: "en", location_code: 2840 },
  ]);
  const result = data?.tasks?.[0]?.result?.[0];
  if (!result) return { found: false };
  return {
    found: true, name: result.title,
    rating: result.rating?.value || 0,
    reviewCount: result.rating?.votes_count || 0,
    categories: result.category,
    address: result.address, phone: result.phone, website: result.website,
    hasWebsite: !!result.website, isVerified: result.is_claimed, hoursListed: !!result.work_hours,
  };
}

// ── Score Calculator — all 4 data sources combined ────────────────────────────
function calculateScores({ llmData, metrics, serpData, bizProfile }) {
  // ChatGPT — direct LLM mention count + citation rate + review authority
  const chatgptMentions = llmData.mentions.filter((m) => m.se_type === "chatgpt").length;
  const chatgptScore = Math.min(100,
    chatgptMentions * 15 +
    (metrics.citationRate || 0) * 50 +
    (bizProfile.reviewCount > 50 ? 20 : bizProfile.reviewCount > 10 ? 10 : 0)
  );

  // Gemini — AI Overview presence + SERP rank + GBP completeness
  const serpBonus = serpData.serpRank ? Math.max(0, 40 - serpData.serpRank * 2) : 0;
  const geminiScore = Math.min(100,
    (serpData.aiOverviewMentioned ? 40 : 0) +
    (serpData.hasAIOverview ? 15 : 0) +
    serpBonus +
    (bizProfile.isVerified ? 15 : 0) +
    (bizProfile.rating >= 4 ? 10 : 0)
  );

  // Perplexity — citation sources + impressions + web presence
  const citedSourceCount = llmData.citedSources.length;
  const perplexityScore = Math.min(100,
    citedSourceCount * 8 +
    (metrics.impressions > 1000 ? 25 : metrics.impressions > 100 ? 15 : 5) +
    (bizProfile.hasWebsite ? 20 : 0) +
    (bizProfile.rating >= 4.5 ? 15 : 0)
  );

  return {
    chatgpt: Math.round(chatgptScore),
    gemini: Math.round(geminiScore),
    perplexity: Math.round(perplexityScore),
    overall: Math.round((chatgptScore + geminiScore + perplexityScore) / 3),
  };
}

// ── Report Builder ────────────────────────────────────────────────────────────
function buildReport({ businessName, domain, llmData, metrics, serpData, bizProfile, scores }) {
  const uniqueDomains = [...new Set(
    llmData.citedSources
      .map((s) => { try { return new URL(s.url).hostname; } catch { return null; } })
      .filter(Boolean)
  )];

  const findings = [
    {
      title: "Google AI Overview",
      status: serpData.aiOverviewMentioned ? "good" : serpData.hasAIOverview ? "warning" : "bad",
      detail: serpData.aiOverviewMentioned
        ? "Your business is actively mentioned in Google's AI-generated answers — the strongest AI visibility signal available."
        : serpData.hasAIOverview
        ? "AI Overviews appear for your category but your business isn't cited. Competitors are capturing this traffic."
        : "No AI Overview detected for your brand queries. You're invisible in the fastest-growing search format.",
    },
    {
      title: "Google Business Profile",
      status: [bizProfile.hasWebsite, bizProfile.isVerified, bizProfile.hoursListed, bizProfile.rating >= 4]
        .filter(Boolean).length >= 3 ? "good" : bizProfile.found ? "warning" : "bad",
      detail: bizProfile.found
        ? `Rated ${bizProfile.rating}/5 from ${bizProfile.reviewCount} reviews. AI engines pull from this data directly when recommending local businesses.`
        : "No verified Google Business Profile found. This is the single biggest factor in local AI visibility.",
    },
    {
      title: "AI Citation Sources",
      status: uniqueDomains.length >= 5 ? "good" : uniqueDomains.length >= 2 ? "warning" : "bad",
      detail: uniqueDomains.length > 0
        ? `AI engines cite your brand from ${uniqueDomains.length} source${uniqueDomains.length !== 1 ? "s" : ""}: ${uniqueDomains.slice(0, 3).join(", ")}.`
        : "No citation sources detected. AI engines have no third-party content to reference when asked about your business.",
    },
  ];

  const recommendations = [];
  if (!serpData.aiOverviewMentioned) recommendations.push("Add FAQ schema markup to your website. AI engines heavily draw from structured Q&A when composing answers.");
  if (!bizProfile.isVerified) recommendations.push("Verify your Google Business Profile. It's free and directly feeds Google AI Overview and Gemini responses.");
  if ((bizProfile.reviewCount || 0) < 25) recommendations.push(`Build your review count past 50 (you have ${bizProfile.reviewCount || 0}). Review volume is a core AI trust signal.`);
  if (uniqueDomains.length < 5) recommendations.push("Get listed on Yelp, BBB, and industry directories. Each listing is a citation source AI engines can reference.");
  recommendations.push("Publish a plain-language 'About' page that directly answers 'What does [your business] do?' — the format AI engines index best.");

  return {
    businessName, domain, generatedAt: new Date().toISOString(),
    scores,
    aiVolume: llmData.aiVolume,
    impressions: metrics.impressions,
    citationRate: metrics.citationRate,
    citedSources: llmData.citedSources.slice(0, 10),
    uniqueCitingDomains: uniqueDomains,
    findings, recommendations, bizProfile, serpData,
  };
}

// ── Main Export ───────────────────────────────────────────────────────────────
export async function generateReport({ businessName, domain, location = "United States" }) {
  // All 4 API calls — LLM pair + SERP pair run in parallel
  const [llmData, metrics] = await Promise.all([
    getLLMMentions(businessName),
    getAggregatedMetrics(businessName),
  ]);
  const [serpData, bizProfile] = await Promise.all([
    getGoogleSerpVisibility(businessName, domain),
    getBusinessProfile(businessName, location),
  ]);
  const scores = calculateScores({ llmData, metrics, serpData, bizProfile });
  return buildReport({ businessName, domain, llmData, metrics, serpData, bizProfile, scores });
}
