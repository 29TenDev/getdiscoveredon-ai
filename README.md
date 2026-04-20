# GetDiscoveredOn.ai — Full Stack Next.js App

AI Visibility Reports for business owners. One-time $49 payment.
Powered by DataForSEO LLM Mentions API + Stripe + Claude AI.

---

## Project Structure

```
getdiscoveredon-ai/
├── pages/
│   ├── _app.js           # Global CSS wrapper
│   ├── _document.js      # HTML head / SEO meta tags
│   ├── index.js          # Landing page + checkout form
│   ├── report.js         # Report page (shown after payment)
│   └── api/
│       ├── checkout.js   # Creates Stripe Checkout session
│       └── report.js     # Verifies payment + generates report
├── lib/
│   └── dataforseo.js     # All 4 DataForSEO API calls + scoring
├── styles/
│   └── globals.css       # Design system (dark editorial theme)
├── .env.local.example    # Environment variables template
├── next.config.js
└── package.json
```

---

## User Flow (How Money is Made)

```
User visits getdiscoveredon.ai
        ↓
Fills in: Business Name, Domain, City, Email
        ↓
Clicks "Get My AI Visibility Report — $49"
        ↓
POST /api/checkout → Creates Stripe session → Redirects to Stripe
        ↓
Customer pays $49
        ↓
Stripe redirects to /report?session_id=cs_...
        ↓
POST /api/report → Verifies payment → Calls DataForSEO (4 APIs) → Returns report
        ↓
Customer sees full AI visibility report
```

---

## Setup (Local Development)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

```
# DataForSEO — sign up free at app.dataforseo.com
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password

# Stripe — get from dashboard.stripe.com → Developers → API Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price in cents ($49 = 4900)
NEXT_PUBLIC_REPORT_PRICE=4900
NEXT_PUBLIC_REPORT_PRICE_DISPLAY=$49

# Email (optional — use Resend.com for free tier)
RESEND_API_KEY=re_...
FROM_EMAIL=reports@getdiscoveredon.ai

# Your deployed URL
NEXT_PUBLIC_SITE_URL=https://getdiscoveredon.ai
```

### 3. Run locally
```bash
npm run dev
# Visit http://localhost:3000
```

---

## Deployment (Vercel — Recommended)

Vercel is the fastest way to deploy — it's built for Next.js.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create getdiscoveredon-ai --private --push
```

### Step 2: Deploy to Vercel
1. Go to vercel.com → "Add New Project"
2. Import your GitHub repo
3. Add all environment variables from `.env.local`
4. Click Deploy

### Step 3: Add your domain
1. In Vercel → Settings → Domains → Add `getdiscoveredon.ai`
2. Update your DNS records as shown by Vercel
3. Update `NEXT_PUBLIC_SITE_URL=https://getdiscoveredon.ai` in Vercel env vars

### Step 4: Configure Stripe webhook
1. Go to dashboard.stripe.com → Developers → Webhooks
2. Add endpoint: `https://getdiscoveredon.ai/api/webhook` (optional — app works without it)
3. Or just rely on the session verification in `/api/report.js`

---

## Cost Per Report

| API Call              | Cost       |
|-----------------------|------------|
| LLM Mentions Search   | $0.11      |
| Aggregated Metrics    | $0.10      |
| Google SERP (3 calls) | $0.006     |
| Business Data         | $0.002     |
| **Total**             | **~$0.22** |

**Your price: $49 → Gross margin: ~99.5%**

DataForSEO LLM Mentions API requires a $100/month minimum balance top-up
(stays in your account as spending credit — not an access fee).
At $0.22/report, $100 covers ~450 reports.

---

## DataForSEO Free Trial

Sign up free (no credit card) at:
https://app.dataforseo.com/register

Test all endpoints in their playground before going live.

---

## Scaling

When you're ready to scale beyond the MVP:

1. **Add Supabase** to cache reports (so repeat customers don't re-run API calls)
2. **Add Resend** to email the PDF report to the customer
3. **Add a referral system** — business owners talk to each other
4. **Add agency pricing** — bulk reports for marketing agencies

---

## Support

Questions? Open an issue or email: support@getdiscoveredon.ai
