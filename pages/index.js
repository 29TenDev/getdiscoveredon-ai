// pages/index.js
// Style: aeonew.html applied throughout. Content unchanged from original project.

import { useState } from "react";
import Head from "next/head";

const PRICE = process.env.NEXT_PUBLIC_REPORT_PRICE_DISPLAY || "$49";

export default function Home() {
  const [form, setForm] = useState({ businessName: "", domain: "", location: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.businessName.trim()) return setError("Please enter your business name.");
    if (!form.domain.trim()) return setError("Please enter your website domain.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Shared inline styles ────────────────────────────────────────────────────
  const navLink = {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--slate-600)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s",
  };

  return (
    <>
      <Head>
        <title>GetDiscoveredOn.ai — AI Visibility Reports for Business Owners</title>
      </Head>

      {/* ── HEADER — fixed, frosted, h-20 ─────────────────────────────────── */}
      <header style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--slate-100)",
        zIndex: 50,
      }}>
        <div className="max-w-7xl" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "80px",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: 32, height: 32,
              background: "var(--blue-600)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: "18px", lineHeight: 1 }}>G</span>
            </div>
            <span style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--slate-900)",
            }}>
              GetDiscoveredOn<span style={{ color: "var(--blue-600)" }}>.AI</span>
            </span>
          </div>

          {/* Right — "One report · One price · No subscription" styled as nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, color: "var(--slate-600)" }}>
            <span>One report</span>
            <span style={{ color: "var(--slate-300)" }}>·</span>
            <span>One price</span>
            <span style={{ color: "var(--slate-300)" }}>·</span>
            <span>No subscription</span>
          </nav>
        </div>
      </header>

      {/* ── HERO — pt-40 pb-24 bg-gradient-blue, single column ───────────── */}
      <section style={{
        paddingTop: "160px",
        paddingBottom: "96px",
        background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
      }}>
        <div className="max-w-7xl">

          {/* GEO pill — plain text, no pill styling, above heading */}
          <p style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--slate-500)",
            marginBottom: "1.25rem",
            letterSpacing: "0.01em",
          }}>
            GEO · AEO · AI Search Visibility
          </p>

          {/* H1 — text-5xl/6xl font-bold text-slate-900 leading-[1.1] */}
          <h1 style={{
            fontSize: "clamp(40px, 6vw, 60px)",
            fontWeight: 700,
            color: "var(--slate-900)",
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            maxWidth: "700px",
          }}>
            Is your business invisible to AI?{" "}
            <br />
            <span style={{ color: "var(--blue-600)" }}>Be the Answer.</span>
          </h1>

          {/* Body — text-lg text-slate-600 leading-relaxed max-w-lg, color #475569 */}
          <p style={{
            fontSize: "18px",
            color: "#475569",
            lineHeight: 1.75,
            marginBottom: "2rem",
            maxWidth: "560px",
          }}>
            When customers ask ChatGPT, Gemini, or Perplexity to recommend a
            business like yours — do you show up? Find out in minutes.
          </p>

          {/* 3 LLM dots — text-lg matching body size, circle icons same size as text */}
          <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
            {[
              { name: "ChatGPT",   color: "#10a37f" },
              { name: "Gemini",    color: "#4285f4" },
              { name: "Perplexity",color: "#8b5cf6" },
            ].map((ai) => (
              <div key={ai.name} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "18px",
                color: "#475569",
                lineHeight: 1.75,
              }}>
                {/* Circle sized to match 18px text — 12px dot */}
                <span style={{
                  width: 12, height: 12,
                  borderRadius: "50%",
                  background: ai.color,
                  display: "inline-block",
                  flexShrink: 0,
                }} />
                {ai.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM SECTION — styled like Comparison Section in aeonew.html ──── */}
      <section id="get-report" style={{ padding: "96px 0", background: "var(--white)" }}>
        <div className="max-w-5xl">

          {/* Section heading — same style as SEO vs AAEO */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{
              fontSize: "30px",
              fontWeight: 700,
              color: "var(--slate-900)",
              marginBottom: "16px",
            }}>
              Get Your AI Visibility Report
            </h2>
            <p style={{ color: "var(--slate-500)", fontSize: "16px" }}>
              One-time payment of <strong style={{ color: "var(--slate-900)" }}>{PRICE}</strong>. No subscription. Instant report.
            </p>
          </div>

          {/* Form container — rounded-2xl border border-slate-200 shadow-sm */}
          <div style={{
            borderRadius: "1rem",
            border: "1px solid var(--slate-200)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            {/* "Enter your business details below" header row */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--slate-200)",
              background: "var(--slate-50)",
              textAlign: "center",
            }}>
              <span style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--blue-600)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Enter your business details below
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Form rows — each styled like a table row from aeonew.html */}
              {[
                { label: "Business Name", name: "businessName", placeholder: "e.g. Joe's Barbershop", type: "text", required: true },
                { label: "Website Domain", name: "domain", placeholder: "e.g. joesbarbershop.com", type: "text", required: true },
                { label: "City / Location", name: "location", placeholder: "e.g. Brooklyn, New York", type: "text", required: false },
                { label: "Your Email", name: "email", placeholder: "you@yourbusiness.com", type: "email", required: true },
              ].map((field, i, arr) => (
                <div key={field.name} style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  alignItems: "center",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--slate-100)" : "none",
                }}>
                  <div style={{
                    padding: "1.25rem 1.5rem",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--slate-600)",
                    borderRight: "1px solid var(--slate-100)",
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: "var(--blue-600)", marginLeft: 2 }}>*</span>}
                  </div>
                  <div style={{ padding: "0.75rem 1.5rem" }}>
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: "4px 0",
                        fontSize: "15px",
                        color: "var(--slate-700)",
                        width: "100%",
                        outline: "none",
                        boxShadow: "none",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Error message */}
              {error && (
                <div style={{
                  padding: "12px 24px",
                  background: "#fee2e2",
                  borderTop: "1px solid var(--slate-100)",
                  fontSize: "14px",
                  color: "#991b1b",
                }}>
                  {error}
                </div>
              )}

              {/* CTA inside the box — full-width bottom row */}
              <div style={{
                padding: "1.5rem",
                borderTop: "1px solid var(--slate-200)",
                background: "var(--slate-50)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-dark"
                  style={{ width: "100%", maxWidth: "400px", padding: "16px 32px", fontSize: "16px", borderRadius: "0.75rem" }}
                >
                  {loading ? (
                    <><span className="spinner" style={{ borderTopColor: "white" }} /> Preparing checkout...</>
                  ) : (
                    <>Get My AI Visibility Report — {PRICE}</>
                  )}
                </button>
                <p style={{ fontSize: "13px", color: "var(--slate-400)", textAlign: "center" }}>
                  🔒 One-time payment · No subscription · Instant report
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Calendar Section style from aeonew.html ──────────── */}
      <section style={{ padding: "96px 0", background: "var(--white)" }}>
        <div className="max-w-5xl">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "30px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "12px" }}>
              How it Works
            </h2>
            <p style={{ color: "var(--slate-500)" }}>Three steps. Done in under 60 seconds.</p>
          </div>

          {/* White card with shadow — Calendar Section style */}
          <div style={{
            background: "var(--white)",
            borderRadius: "1rem",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-card)",
            padding: "48px 40px",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
              textAlign: "center",
            }}>
              {[
                { n: "01", title: "Enter your business", body: "Your name, domain, and city. That's all we need." },
                { n: "02", title: "Pay Once",            body: `Secure ${PRICE} payment via Stripe. No subscription, ever.` },
                { n: "03", title: "Get Your Report",     body: "Instant scores for ChatGPT, Gemini, and Perplexity — with fixes." },
              ].map((s, i) => (
                <div key={s.n}>
                  <p style={{
                    fontFamily: "var(--font)",
                    fontSize: "40px",
                    fontWeight: 700,
                    color: "var(--slate-200)",
                    marginBottom: "12px",
                    lineHeight: 1,
                  }}>{s.n}</p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--slate-900)", marginBottom: "8px" }}>{s.title}</p>
                  <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.6 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S IN YOUR REPORT ────────────────────────────────────────────── */}
      <section style={{ padding: "96px 0", background: "var(--slate-50)" }}>
        <div className="max-w-5xl">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "30px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>
              What's in your report
            </h2>
            <p style={{ color: "var(--slate-500)" }}>Real data. Plain language. Actionable fixes.</p>
          </div>

          <div style={{
            borderRadius: "1rem",
            border: "1px solid var(--slate-200)",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {[
              { icon: "📊", title: "AI Visibility Scores",      body: "0–100 scores for ChatGPT, Gemini, and Perplexity based on real citation data." },
              { icon: "🔍", title: "Google AI Overview Status", body: "Whether your business appears in Google's AI-generated answers for your category." },
              { icon: "🔗", title: "Citation Sources",          body: "Which websites AI engines use to reference and recommend your business." },
              { icon: "📍", title: "Business Profile Health",   body: "Your Google Business Profile completeness — the #1 local AI visibility signal." },
              { icon: "✅", title: "Prioritized Fixes",         body: "Step-by-step recommendations ranked by impact. No jargon, just clear action." },
            ].map((item, i, arr) => (
              <div key={item.title} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "20px",
                padding: "1.5rem",
                background: "var(--white)",
                borderBottom: i < arr.length - 1 ? "1px solid var(--slate-100)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--slate-50)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--white)"}
              >
                <span style={{ fontSize: "20px", lineHeight: 1, marginTop: "2px" }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--slate-900)", marginBottom: "4px" }}>{item.title}</p>
                  <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER — exact aeonew.html footer ───────────────────────────────── */}
      <footer style={{ background: "var(--slate-900)", color: "var(--slate-400)", padding: "64px 0" }}>
        <div className="max-w-7xl">
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "48px",
            marginBottom: "48px",
          }}>
            {/* Brand col */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                <div style={{
                  width: 24, height: 24,
                  background: "var(--blue-600)",
                  borderRadius: "4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>G</span>
                </div>
                <span style={{ color: "white", fontWeight: 700, letterSpacing: "-0.01em" }}>
                  GetDiscoveredOn.AI
                </span>
              </div>
              <p style={{ fontSize: "14px", lineHeight: 1.75, maxWidth: "280px" }}>
                Building authority in the era of Artificial Intelligence. Helping SMBs be found where it matters most.
              </p>
            </div>

            {/* Agency */}
            <div>
              <h4 style={{ color: "white", fontWeight: 600, marginBottom: "24px", fontSize: "15px" }}>Agency</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {["About Us", "Case Studies", "AEO Guide"].map((l) => (
                  <li key={l}>
                    <a href="#" style={{ fontSize: "14px", color: "var(--slate-400)", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "white"}
                      onMouseLeave={e => e.target.style.color = "var(--slate-400)"}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ color: "white", fontWeight: 600, marginBottom: "24px", fontSize: "15px" }}>Services</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {["AI Optimization", "Local SEO", "Authority Building"].map((l) => (
                  <li key={l}>
                    <a href="#" style={{ fontSize: "14px", color: "var(--slate-400)", transition: "color 0.2s" }}
                      onMouseEnter={e => e.target.style.color = "white"}
                      onMouseLeave={e => e.target.style.color = "var(--slate-400)"}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            paddingTop: "32px",
            borderTop: "1px solid var(--slate-800)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
          }}>
            <p>© {new Date().getFullYear()} GetDiscoveredOn.AI Agency. All rights reserved.</p>
            <div style={{ display: "flex", gap: "32px" }}>
              {["Privacy Policy", "Terms of Service"].map((l) => (
                <a key={l} href="#" style={{ color: "var(--slate-400)", transition: "color 0.2s" }}
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
