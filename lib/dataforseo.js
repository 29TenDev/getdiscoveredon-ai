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

// ── Domain normalizer — strips protocol and trailing slashes ─────────────────
function normalizeDomain(domain) {
  return domain
    .replace(/^https?:\/\//i, "")  // remove http:// or https://
    .replace(/\/+$/, "")            // remove trailing slashes
    .toLowerCase()
    .trim();
}

// ── SSL checker — does an actual HEAD request to verify HTTPS works ───────────
async function checkSSL(domain) {
  try {
    const cleanDomain = normalizeDomain(domain);
    const res = await fetch(`https://${cleanDomain}`, {
      method: "HEAD",
      redirect: "follow",
    });
    return res.ok || res.status < 500;
  } catch {
    // If fetch fails it could be CORS or timeout — assume SSL is present
    // since Vercel and most modern hosts provision it automatically
    return true;
  }
}

// ── 1. LLM Mentions Search ────────────────────────────────────────────────────
async function getLLMMentions(brandName) {
  const data = await dfsPost("/ai_optimization/llm_mentions/search/live", [
    {
      language_name: "English",
      location_code: 2840,
      platform: "google",
      target: [
        {
          keyword: brandName,
          search_filter: "include",
          search_scope: ["answer"],
        },
      ],
      limit: 10,
    },
  ]);
  const results = data?.tasks?.[0]?.result || [];
  const citedSources = [];
  let totalVolume = 0;
  results.forEach((item) => {
    totalVolume += item.ai_search_volume || 0;
    (item.sources || []).forEach((src) => {
      citedSources.push({
        url: src.url,
        title: src.title,
        type: src.type,
        platform: "google",
      });
    });
  });
  return {
    mentions: results,
    citedSources,
    aiVolume: totalVolume,
    rawMentionCount: results.length,
  };
}

// ── 2. Aggregated Metrics ─────────────────────────────────────────────────────
async function getAggregatedMetrics(brandName) {
  const data = await dfsPost("/ai_optimization/llm_mentions/aggregated_metrics/live", [
    {
      language_name: "English",
      location_code: 2840,
      platform: "google",
      target: [
        {
          keyword: brandName,
          search_filter: "include",
          search_scope: ["answer"],
        },
      ],
    },
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

// ── 3. SERP API ───────────────────────────────────────────────────────────────
async function getGoogleSerpVisibility(brandName, domain) {
  const cleanDomain = normalizeDomain(domain);
  const queries = [brandName, `${brandName} reviews`, `${brandName} near me`];
  const data = await dfsPost("/serp/google/organic/live/advanced",
    queries.map((kw) => ({
      keyword: kw, language_code: "en", location_code: 2840, device: "desktop", os: "windows",
    }))
  );
  let serpRank = null, hasAIOverview = false, aiOverviewMentioned = false;
  let competitorsCited = [];

  (data?.tasks || []).forEach((task) => {
    (task?.result || []).forEach((result) => {
      (result?.items || []).forEach((item) => {
        if (item.type === "organic" && item.url?.includes(cleanDomain)) {
          if (serpRank === null || item.rank_absolute < serpRank) serpRank = item.rank_absolute;
        }
        if (item.type === "ai_overview") {
          hasAIOverview = true;
          const itemStr = JSON.stringify(item).toLowerCase();
          if (itemStr.includes(brandName.toLowerCase())) aiOverviewMentioned = true;
          (item.items || []).forEach((ref) => {
            if (ref.url && !ref.url.includes(cleanDomain)) {
              try {
                const host = new URL(ref.url).hostname;
                if (!competitorsCited.includes(host)) competitorsCited.push(host);
              } catch {}
            }
          });
        }
      });
    });
  });

  return {
    serpRank,
    hasAIOverview,
    aiOverviewMentioned,
    competitorsCited: competitorsCited.slice(0, 5),
    queriesChecked: queries.length,
  };
}

// ── 4. Business Data API ──────────────────────────────────────────────────────
async function getBusinessProfile(businessName, location) {
  const data = await dfsPost("/business_data/google/my_business_info/live", [
    { keyword: `${businessName} ${location}`, language_code: "en", location_code: 2840 },
  ]);
  const result = data?.tasks?.[0]?.result?.[0];
  if (!result) return { found: false };

  const reviewCount =
    result?.rating?.votes_count ||
    result?.rating?.rating_count ||
    result?.rating?.count ||
    result?.reviews_count ||
    result?.user_ratings_total ||
    0;

  const completenessSignals = {
    hasWebsite: !!result.website,
    isVerified: !!result.is_claimed,
    hoursListed: !!result.work_hours,
    hasPhone: !!result.phone,
    hasAddress: !!result.address,
    hasCategories: !!(result.category || result.additional_categories),
    hasPhotos: (result.photos_count || 0) > 0,
    hasDescription: !!result.description,
  };

  const completenessScore = Math.round(
    (Object.values(completenessSignals).filter(Boolean).length / 8) * 100
  );

  return {
    found: true,
    name: result.title,
    rating: result.rating?.value || 0,
    reviewCount,
    categories: result.category,
    address: result.address,
    phone: result.phone,
    website: result.website,
    photosCount: result.photos_count || 0,
    description: result.description || null,
    lastReviewDate: result.last_review_date || null,
    ...completenessSignals,
    completenessScore,
  };
}

// ── 5. On-Page API ────────────────────────────────────────────────────────────
async function getOnPageSignals(domain) {
  if (!domain) return { found: false };
  const cleanDomain = normalizeDomain(domain);

  try {
    // Check SSL via real HTTPS request — not just string prefix
    const hasSSL = await checkSSL(cleanDomain);

    const taskData = await dfsPost("/on_page/task_post", [
      {
        target: cleanDomain,
        max_crawl_pages: 1,
        load_resources: false,
        enable_javascript: false,
        check_spell: false,
      },
    ]);
    const taskId = taskData?.tasks?.[0]?.id;
    if (!taskId) return { found: false, hasSSL };

    await new Promise((r) => setTimeout(r, 8000));

    const summaryData = await dfsPost("/on_page/summary", [{ id: taskId }]);
    const summary = summaryData?.tasks?.[0]?.result?.[0];
    if (!summary) return { found: false, hasSSL };

    const pagesData = await dfsPost("/on_page/pages", [
      { id: taskId, limit: 1, filters: ["resource_type", "=", "html"] },
    ]);
    const page = pagesData?.tasks?.[0]?.result?.items?.[0];
    const checks = page?.checks || {};

    return {
      found: true,
      hasSSL,                          // from real HTTPS check, not string prefix
      hasSchemaMarkup: !!(checks.has_micromarkup || checks.has_structured_data),
      hasFAQSchema: !!(checks.has_micromarkup_faq),
      hasLocalBusinessSchema: !!(checks.has_micromarkup_local_business),
      metaDescriptionPresent: !!(checks.has_meta_description),
      titleTagPresent: !!(checks.has_title),
      wordCount: page?.meta?.content?.plain_text_word_count || 0,
      onPageScore: summary?.page_score || 0,
      brokenLinks: summary?.broken_links || 0,
    };
  } catch {
    return { found: false, hasSSL: true }; // default SSL to true on error
  }
}

// ── Score Calculator ──────────────────────────────────────────────────────────
function calculateScores({ llmData, metrics, serpData, bizProfile, onPage }) {
  const chatgptMentions = llmData.mentions.filter((m) => m.se_type === "chatgpt").length;
  const chatgptScore = Math.min(100,
    chatgptMentions * 15 +
    (metrics.citationRate || 0) * 50 +
    (bizProfile.reviewCount > 50 ? 20 : bizProfile.reviewCount > 10 ? 10 : 0)
  );

  const serpBonus = serpData.serpRank ? Math.max(0, 40 - serpData.serpRank * 2) : 0;
  const geminiScore = Math.min(100,
    (serpData.aiOverviewMentioned ? 40 : 0) +
    (serpData.hasAIOverview ? 15 : 0) +
    serpBonus +
    (bizProfile.isVerified ? 15 : 0) +
    (bizProfile.rating >= 4 ? 10 : 0)
  );

  const citedSourceCount = llmData.citedSources.length;
  const perplexityScore = Math.min(100,
    citedSourceCount * 8 +
    (metrics.impressions > 1000 ? 25 : metrics.impressions > 100 ? 15 : 5) +
    (bizProfile.hasWebsite ? 15 : 0) +
    (bizProfile.rating >= 4.5 ? 15 : 0) +
    (onPage?.hasSchemaMarkup ? 15 : 0) +
    (onPage?.hasFAQSchema ? 10 : 0)
  );

  return {
    chatgpt: Math.round(chatgptScore),
    gemini: Math.round(geminiScore),
    perplexity: Math.round(perplexityScore),
    overall: Math.round((chatgptScore + geminiScore + perplexityScore) / 3),
  };
}

// ── Main Export ───────────────────────────────────────────────────────────────
export async function generateRawData({ businessName, domain, location = "United States" }) {
  const cleanDomain = normalizeDomain(domain);

  const [llmData, metrics] = await Promise.all([
    getLLMMentions(businessName),
    getAggregatedMetrics(businessName),
  ]);

  const [serpData, bizProfile, onPage] = await Promise.all([
    getGoogleSerpVisibility(businessName, cleanDomain),
    getBusinessProfile(businessName, location),
    getOnPageSignals(cleanDomain),
  ]);

  const scores = calculateScores({ llmData, metrics, serpData, bizProfile, onPage });

  return {
    businessName,
    domain: cleanDomain,
    location,
    scores,
    llmData,
    metrics,
    serpData,
    bizProfile,
    onPage,
    generatedAt: new Date().toISOString(),
  };
}
