// pages/report.js
// Style: aeonew.html applied. Content unchanged.

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

function FindingCard({ finding }) {
  const pillClass = finding.status === "good" ? "pill-good" : finding.status === "warning" ? "pill-warn" : "pill-bad";
  const pillLabel = finding.status === "good" ? "Good" : finding.status === "warning" ? "Needs work" : "Critical";
  return (
    <div style={{
      background: "var(--white)",
      borderBottom: "1px solid var(--slate-100)",
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--slate-900)" }}>{finding.title}</span>
        <span className={`pill ${pillClass}`}>{pillLabel}</span>
      </div>
      <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.65 }}>{finding.detail}</p>
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
    "Checking your Google Business Profile...",
    "Analyzing citation sources...",
    "Calculating your AI visibility scores...",
  ];

  useEffect(() => {
    if (!session_id) return;
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, loadingSteps.length - 1);
      setLoadingStep(i);
    }, 2200);

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session_id }),
    })
      .then((r) => r.json())
      .then((data) => {
        clearInterval(interval);
        if (data.success && data.report) { setReport(data.report); setState("success"); }
        else { setErrorMsg(data.error || "Report generation failed."); setState("error"); }
      })
      .catch(() => {
        clearInterval(interval);
        setErrorMsg("Network error. Please contact support@getdiscoveredon.ai");
        setState("error");
      });

    return () => clearInterval(interval);
  }, [session_id]);

  // ── Shared nav ────────────────────────────────────────────────────────────
  const Nav = () => (
    <header style={{
      position: "sticky", top: 0,
      background: "rgba(255,255,255,0.8)",
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
        <span style={{ fontSize: "13px", color: "var(--slate-400)" }}>
          AI Visibility Report
        </span>
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
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3, margin: "0 auto 2rem" }} />
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "12px" }}>
              Building your report
            </h2>
            <p style={{ color: "var(--slate-500)", marginBottom: "2rem", fontSize: "16px" }}>
              {loadingSteps[loadingStep]}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              {loadingSteps.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i <= loadingStep ? "var(--blue-600)" : "var(--slate-200)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "var(--slate-300)", marginTop: "1.5rem" }}>This takes about 10–15 seconds</p>
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
            border: "1px solid var(--slate-200)", boxShadow: "var(--shadow-card)",
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
  const { scores, findings, recommendations, bizProfile, citedSources, aiVolume, impressions, citationRate } = report;
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

      {/* Report hero band — bg-gradient-blue */}
      <section style={{
        background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
        padding: "56px 0 48px",
        borderBottom: "1px solid var(--slate-200)",
      }}>
        <div className="max-w-5xl">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--slate-500)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                AI Visibility Report
              </p>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
                {report.businessName}
              </h1>
              <p style={{ fontSize: "15px", color: "var(--slate-500)" }}>{report.domain}</p>
            </div>

            {/* Overall score — styled like the blue card from aeonew.html hero */}
            <div style={{
              background: "var(--white)",
              border: `2px solid ${overallColor}`,
              borderRadius: "1rem",
              padding: "20px 32px",
              textAlign: "center",
              boxShadow: "var(--shadow-card)",
              minWidth: "160px",
            }}>
              <p style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                Overall Score
              </p>
              <p style={{ fontSize: "48px", fontWeight: 700, color: overallColor, lineHeight: 1 }}>{overall}</p>
              <p style={{ fontSize: "12px", fontWeight: 600, color: overallColor, marginTop: "4px" }}>{overallLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl" style={{ padding: "56px 0 80px" }}>

        {/* Score breakdown */}
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "20px" }}>Score Breakdown</h2>
        <div style={{
          background: "var(--white)", borderRadius: "1rem",
          border: "1px solid var(--slate-200)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: "2rem", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem",
          marginBottom: "40px",
        }}>
          <ScoreRing score={scores.chatgpt} label="ChatGPT" dot="#10a37f" />
          <ScoreRing score={scores.gemini} label="Gemini" dot="#4285f4" />
          <ScoreRing score={scores.perplexity} label="Perplexity" dot="#8b5cf6" />
        </div>

        {/* Key metrics */}
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "20px" }}>Key Metrics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "14px", marginBottom: "40px" }}>
          {[
            { label: "Monthly AI Searches", value: (aiVolume || 0).toLocaleString() },
            { label: "AI Impressions",       value: (impressions || 0).toLocaleString() },
            { label: "Citation Rate",        value: `${Math.round((citationRate || 0) * 100)}%` },
            { label: "Review Count",         value: (bizProfile?.reviewCount || 0).toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--slate-50)", border: "1px solid var(--slate-200)",
              borderRadius: "0.75rem", padding: "1.25rem",
            }}>
              <p style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--slate-900)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Findings */}
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "20px" }}>Key Findings</h2>
        <div style={{ borderRadius: "1rem", border: "1px solid var(--slate-200)", overflow: "hidden", marginBottom: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {(findings || []).map((f, i) => <FindingCard key={i} finding={f} />)}
        </div>

        {/* Citation sources */}
        {citedSources?.length > 0 && (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "20px" }}>AI Citation Sources</h2>
            <div style={{ borderRadius: "1rem", border: "1px solid var(--slate-200)", overflow: "hidden", marginBottom: "40px", background: "var(--white)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{src.title || src.url}</p>
                    <p style={{ fontSize: "12px", color: "var(--slate-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{src.url}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recommendations */}
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "20px" }}>Recommendations</h2>
        <div style={{ borderRadius: "1rem", border: "1px solid var(--slate-200)", overflow: "hidden", marginBottom: "48px", background: "var(--white)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {(recommendations || []).map((rec, i) => (
            <div key={i} style={{
              display: "flex", gap: "16px", padding: "1.25rem 1.5rem", alignItems: "flex-start",
              borderBottom: i < recommendations.length - 1 ? "1px solid var(--slate-100)" : "none",
            }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: "var(--blue-50)", color: "var(--blue-600)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, marginTop: "1px",
              }}>{i + 1}</div>
              <p style={{ fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.65 }}>{rec}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
          border: "1px solid var(--slate-200)",
          borderRadius: "1rem",
          padding: "2.5rem",
          textAlign: "center",
          boxShadow: "var(--shadow-card)",
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
      <footer style={{ background: "var(--slate-900)", color: "var(--slate-400)", padding: "64px 0" }}>
        <div className="max-w-7xl">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                <div style={{ width: 24, height: 24, background: "var(--blue-600)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>G</span>
                </div>
                <span style={{ color: "white", fontWeight: 700 }}>GetDiscoveredOn.AI</span>
              </div>
              <p style={{ fontSize: "14px", lineHeight: 1.75, maxWidth: "280px" }}>
                Building authority in the era of Artificial Intelligence. Helping SMBs be found where it matters most.
              </p>
            </div>
            <div>
              <h4 style={{ color: "white", fontWeight: 600, marginBottom: "24px", fontSize: "15px" }}>Agency</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {["About Us", "Case Studies", "AEO Guide"].map((l) => (
                  <li key={l}><a href="#" style={{ fontSize: "14px", color: "var(--slate-400)" }}
                    onMouseEnter={e => e.target.style.color = "white"}
                    onMouseLeave={e => e.target.style.color = "var(--slate-400)"}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "white", fontWeight: 600, marginBottom: "24px", fontSize: "15px" }}>Services</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {["AI Optimization", "Local SEO", "Authority Building"].map((l) => (
                  <li key={l}><a href="#" style={{ fontSize: "14px", color: "var(--slate-400)" }}
                    onMouseEnter={e => e.target.style.color = "white"}
                    onMouseLeave={e => e.target.style.color = "var(--slate-400)"}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ paddingTop: "32px", borderTop: "1px solid var(--slate-800)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", fontSize: "12px" }}>
            <p>© {new Date().getFullYear()} GetDiscoveredOn.AI Agency. All rights reserved.</p>
            <div style={{ display: "flex", gap: "32px" }}>
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
