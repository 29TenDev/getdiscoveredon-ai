// pages/report.js
// Redesigned report page with expanded 3-part Claude-generated finding cards

import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

function ScoreRing({ score, label, dot }) {
  const level = score >= 65 ? "good" : score >= 35 ? "warn" : "bad";
  return (
    <div style={{ textAlign: "center" }}>
      <div className={`score-ring ${level}`} style={{ margin: "0 auto 12px" }}>
        {score}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, display: "inline-block" }} />
        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-600)" }}>{label}</span>
      </div>
    </div>
  );
}

function FindingCard({ finding, index }) {
  const [expanded, setExpanded] = useState(true);
  const pillClass = finding.status === "good" ? "pill-good" : finding.status === "warning" ? "pill-warn" : "pill-bad";
  const pillLabel = finding.status === "good" ? "Good" : finding.status === "warning" ? "Needs Work" : "Critical";
  const statusColor = finding.status === "good" ? "var(--green)" : finding.status === "warning" ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{
      background: "var(--white)",
      border: "1.5px solid var(--slate-200)",
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {/* Finding header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          cursor: "pointer",
          background: expanded ? "var(--white)" : "var(--slate-50)",
          borderBottom: expanded ? "1px solid var(--slate-100)" : "none",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `${statusColor}15`,
            border: `2px solid ${statusColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: statusColor, flexShrink: 0,
          }}>{index + 1}</div>
          <span style={{ fontWeight: 600, fontSize: "16px", color: "var(--slate-900)" }}>
            {finding.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className={`pill ${pillClass}`}>{pillLabel}</span>
          <span style={{ color: "var(--slate-400)", fontSize: "18px", lineHeight: 1 }}>
            {expanded ? "−" : "+"}
          </span>
        </div>
      </div>

      {/* Expanded 3-part content */}
      {expanded && (
        <div style={{ padding: "0" }}>

          {/* What We Found */}
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--slate-100)",
            background: "var(--white)",
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                minWidth: "120px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--slate-400)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                paddingTop: "2px",
              }}>
                What We Found
              </div>
              <p style={{ fontSize: "14px", color: "var(--slate-700)", lineHeight: 1.7, margin: 0 }}>
                {finding.what_found}
              </p>
            </div>
          </div>

          {/* Why It Matters */}
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--slate-100)",
            background: "rgba(37,99,235,0.02)",
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                minWidth: "120px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--blue-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                paddingTop: "2px",
              }}>
                Why It Matters
              </div>
              <p style={{ fontSize: "14px", color: "var(--slate-700)", lineHeight: 1.7, margin: 0 }}>
                {finding.why_matters}
              </p>
            </div>
          </div>

          {/* What To Do First */}
          <div style={{
            padding: "1.25rem 1.5rem",
            background: "rgba(16,185,129,0.03)",
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                minWidth: "120px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                paddingTop: "2px",
              }}>
                What To Do First
              </div>
              <p style={{ fontSize: "14px", color: "var(--slate-700)", lineHeight: 1.7, margin: 0 }}>
                {finding.what_to_do}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [state, setState] = useState("loading");
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Verifying your payment...",
    "Querying AI search engines...",
    "Scanning your Google Business Profile...",
    "Analyzing citation sources...",
    "Checking website AI-readiness signals...",
    "Generating your personalized report...",
  ];

  useEffect(() => {
    if (!session_id) return;
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, loadingSteps.length - 1);
      setLoadingStep(i);
    }, 4000);

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session_id }),
    })
      .then((r) => r.json())
      .then((data) => {
        clearInterval(interval);
        if (data.success && data.report) {
          setReport(data.report);
          setState("success");
        } else {
          setErrorMsg(data.error || "Report generation failed.");
          setState("error");
        }
      })
      .catch(() => {
        clearInterval(interval);
        setErrorMsg("Network error. Please contact support@getdiscoveredon.ai");
        setState("error");
      });

    return () => clearInterval(interval);
  }, [session_id]);

  const Nav = () => (
    <header style={{
      position: "sticky", top: 0,
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--slate-100)",
      zIndex: 50,
    }}>
      <div className="max-w-7xl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "80px" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "var(--blue-600)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>G</span>
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--slate-900)" }}>
            GetDiscoveredOn<span style={{ color: "var(--blue-600)" }}>.AI</span>
          </span>
        </a>
        <span style={{ fontSize: "13px", color: "var(--slate-400)" }}>AI Visibility Report</span>
      </div>
    </header>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <>
        <Head><title>Building Your Report — GetDiscoveredOn.ai</title></Head>
        <Nav />
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)", padding: "2rem" }}>
          <div style={{ textAlign: "center", maxWidth: "520px" }}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3, margin: "0 auto 2rem" }} />
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "12px" }}>
              Building your personalized report
            </h2>
            <p style={{ color: "var(--slate-500)", marginBottom: "2rem", fontSize: "16px" }}>
              {loadingSteps[loadingStep]}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1.5rem" }}>
              {loadingSteps.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i <= loadingStep ? "var(--blue-600)" : "var(--slate-200)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "var(--slate-300)" }}>
              This takes 25–35 seconds — we're querying multiple AI engines and generating your personalized analysis
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <>
        <Head><title>Error — GetDiscoveredOn.ai</title></Head>
        <Nav />
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)", padding: "2rem" }}>
          <div style={{
            background: "var(--white)", borderRadius: "1rem",
            border: "1px solid var(--slate-200)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            padding: "3rem", maxWidth: "480px", textAlign: "center",
          }}>
            <p style={{ fontSize: "48px", marginBottom: "1rem" }}>⚠️</p>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "12px" }}>Something went wrong</h2>
            <p style={{ color: "var(--slate-500)", marginBottom: "2rem" }}>{errorMsg}</p>
            <a href="mailto:support@getdiscoveredon.ai" className="btn-dark">Contact Support</a>
          </div>
        </div>
      </>
    );
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const { scores, findings, recommendations, bizProfile, citedSources, aiVolume, impressions, citationRate, onPage, executiveSummary } = report;
  const overall = scores.overall;
  const overallLevel = overall >= 65 ? "good" : overall >= 35 ? "warn" : "bad";
  const overallColor = overallLevel === "good" ? "#10b981" : overallLevel === "warn" ? "#f59e0b" : "#ef4444";
  const overallLabel = overall >= 65 ? "Strong AI Presence" : overall >= 35 ? "Partial Visibility" : "Low Visibility";

  return (
    <>
      <Head>
        <title>AI Visibility Report — {report.businessName} | GetDiscoveredOn.ai</title>
      </Head>
      <Nav />

      {/* Hero band */}
      <section style={{
        background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
        padding: "48px 0 40px",
        borderBottom: "1px solid var(--slate-200)",
      }}>
        <div className="max-w-5xl">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--slate-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                AI Visibility Report
              </p>
              <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
                {report.businessName}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--slate-400)", marginBottom: "16px" }}>{report.domain}</p>

              {/* Executive Summary */}
              {executiveSummary && (
                <div style={{
                  background: "var(--white)",
                  border: "1px solid var(--slate-200)",
                  borderLeft: "4px solid var(--blue-600)",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  maxWidth: "580px",
                }}>
                  <p style={{ fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                    {executiveSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Overall score */}
            <div style={{
              background: "var(--white)",
              border: `2px solid ${overallColor}`,
              borderRadius: "14px",
              padding: "24px 32px",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              minWidth: "160px",
            }}>
              <p style={{ fontSize: "11px", color: "var(--slate-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                Overall Score
              </p>
              <p style={{ fontSize: "52px", fontWeight: 700, color: overallColor, lineHeight: 1 }}>{overall}</p>
              <p style={{ fontSize: "12px", fontWeight: 600, color: overallColor, marginTop: "6px" }}>{overallLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl" style={{ padding: "48px 0 80px" }}>

        {/* Score breakdown */}
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>Score Breakdown</h2>
        <div style={{
          background: "var(--white)", borderRadius: "12px",
          border: "1.5px solid var(--slate-200)",
          padding: "2rem", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem",
          marginBottom: "40px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <ScoreRing score={scores.chatgpt} label="ChatGPT" dot="#10a37f" />
          <ScoreRing score={scores.gemini} label="Gemini" dot="#4285f4" />
          <ScoreRing score={scores.perplexity} label="Perplexity" dot="#8b5cf6" />
        </div>

        {/* Key metrics */}
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>Key Metrics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "12px", marginBottom: "40px" }}>
          {[
            { label: "Monthly AI Searches", value: (aiVolume || 0).toLocaleString() },
            { label: "AI Impressions", value: (impressions || 0).toLocaleString() },
            { label: "Citation Rate", value: `${Math.round((citationRate || 0) * 100)}%` },
            { label: "Review Count", value: (bizProfile?.reviewCount || 0).toLocaleString() },
            { label: "GBP Completeness", value: `${bizProfile?.completenessScore || 0}%` },
            { label: "Schema Markup", value: onPage?.hasSchemaMarkup ? "✓ Found" : "✗ Missing" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--slate-50)", border: "1px solid var(--slate-200)",
              borderRadius: "10px", padding: "1rem",
            }}>
              <p style={{ fontSize: "11px", color: "var(--slate-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Detailed Findings */}
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "8px" }}>Detailed Findings</h2>
        <p style={{ fontSize: "14px", color: "var(--slate-400)", marginBottom: "24px" }}>
          Click any finding to expand or collapse the full analysis.
        </p>
        <div style={{ marginBottom: "40px" }}>
          {(findings || []).map((f, i) => (
            <FindingCard key={i} finding={f} index={i} />
          ))}
        </div>

        {/* Citation sources */}
        {citedSources?.length > 0 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>AI Citation Sources</h2>
            <div style={{ borderRadius: "12px", border: "1.5px solid var(--slate-200)", overflow: "hidden", marginBottom: "40px", background: "var(--white)" }}>
              {citedSources.slice(0, 6).map((src, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "1rem 1.5rem",
                  borderBottom: i < Math.min(citedSources.length, 6) - 1 ? "1px solid var(--slate-100)" : "none",
                }}>
                  <span className="pill" style={{
                    background: src.platform === "chatgpt" ? "#d1fae5" : "#dbeafe",
                    color: src.platform === "chatgpt" ? "#065f46" : "var(--blue-600)",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {src.platform === "chatgpt" ? "ChatGPT" : "Google AI"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                      {src.title || src.url}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--slate-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {src.url}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recommendations */}
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>
          Prioritized Recommendations
        </h2>
        <div style={{ borderRadius: "12px", border: "1.5px solid var(--slate-200)", overflow: "hidden", marginBottom: "48px", background: "var(--white)" }}>
          {(recommendations || []).map((rec, i) => (
            <div key={i} style={{
              display: "flex", gap: "16px", padding: "1.25rem 1.5rem", alignItems: "flex-start",
              borderBottom: i < recommendations.length - 1 ? "1px solid var(--slate-100)" : "none",
            }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: i === 0 ? "var(--blue-600)" : "var(--blue-50)",
                color: i === 0 ? "white" : "var(--blue-600)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, marginTop: "1px", flexShrink: 0,
              }}>{i + 1}</div>
              <p style={{ fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.7 }}>{rec}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
          border: "1.5px solid var(--slate-200)",
          borderRadius: "14px", padding: "2.5rem", textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "10px" }}>
            Run a report for another business?
          </h3>
          <p style={{ color: "var(--slate-500)", fontSize: "15px", marginBottom: "1.75rem" }}>
            Each report is a one-time payment. No subscription required.
          </p>
          <a href="/" className="btn-dark">
            Run Another Report — {process.env.NEXT_PUBLIC_REPORT_PRICE_DISPLAY || "$49"} →
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "var(--slate-900)", color: "var(--slate-400)", padding: "48px 0 28px" }}>
        <div className="max-w-7xl">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 24, height: 24, background: "var(--blue-600)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>G</span>
              </div>
              <span style={{ color: "white", fontWeight: 600 }}>GetDiscoveredOn.AI</span>
            </div>
            <p>© {new Date().getFullYear()} GetDiscoveredOn.AI Agency. All rights reserved.</p>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Privacy Policy", "Terms of Service"].map((l) => (
                <a key={l} href="#" style={{ color: "var(--slate-400)" }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = "var(--slate-400)"}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
