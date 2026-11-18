# LeadFinder AI – Multi-Source Lead Scraper & Website Quality Analyzer SaaS

**LeadFinder AI** is a professional, full-stack B2B SaaS web application designed for web design, development, and digital marketing agencies. It automatically discovers local businesses across multiple public sources, crawls and analyzes website quality (mobile responsiveness, SSL, load speed, outdated code, accessibility), extracts verified public contacts, qualifies leads, and manages outreach in a centralized CRM dashboard.

---

## 🌟 Key Features

1. **Independent Lead Discovery (Zero Paid API Dependency)**:
   - Discovers real businesses using permitted open web search indexes, public business registries, and targeted domain crawlers.
   - Requires **no** paid Google Places API, Yelp Fusion API, or Bing API keys.

2. **Automated Website Quality & Defect Analyzer**:
   - Computes an internal **Website Improvement Opportunity Score (0–100)**.
   - Detects missing HTTPS / SSL certificates, slow page load speeds, missing mobile `<meta name="viewport">`, deprecated tags (`<font>`, `<marquee>`, frames, obsolete table layouts), outdated copyright notices (e.g. 2008–2019), missing lead capture forms, and broken links.
   - Provides targeted agency pitch angles and actionable recommendations for client proposals.

3. **Public Contact Information Extractor**:
   - Extracts publicly listed business emails (with priority for `mailto:` verified anchors), direct phone numbers (`(xxx) xxx-xxxx`), and social links (Facebook, Instagram, LinkedIn, Twitter/X).
   - Filters out false positives (image extensions, SVG filenames, dummy templates).

4. **Agency Lead Qualification Engine**:
   - Automatically segments leads into **High Priority**, **Medium Priority**, and **Low Priority**.
   - Prioritizes businesses operating **without a website** (immediate new website builds) and businesses with **critical website defects** paired with direct outreach contacts.

5. **10-Section Professional SaaS Interface**:
   - **Overview Dashboard**: Aggregate KPI cards, Recharts visualizations (leads over time, quality defect distribution, priority split, top industries), and recent activity feed.
   - **Find Leads**: Multi-filter discovery engine with real-time progress bar, live metrics (discovered, analyzed, qualified, duplicates removed), and pause/resume/cancel controls.
   - **All Leads**: CRM table with sorting, filtering, favorites, bulk selection, bulk Excel/CSV export, and status management (`New`, `Reviewed`, `Contacted`, `Interested`, `Not Interested`, `Converted`).
   - **High-Priority Leads**: Specialized high-conversion view with pre-written cold outreach pitch generators.
   - **Website Analyzer**: Standalone live audit tool to inspect any URL and save it directly as a CRM lead.
   - **Data Sources**: Connector manager to toggle, monitor rate limits, and test connection statuses.
   - **Search History**: Complete log of all past discovery runs with quick filter shortcuts.
   - **Automation**: Scheduled recurring search workflows (Daily, Weekly, Monthly) with duplicate prevention.
   - **Export Center**: Custom export engine generating styled Excel (`.xlsx`) and CSV (`.csv`) files.
   - **Settings**: Concurrency, crawl timeouts, SSRF guardrails, and agency branding.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Python, FastAPI, Uvicorn, REST API architecture.
- **Database**: Async SQLAlchemy with SQLite / PostgreSQL / Supabase compatibility.
- **Scraping & Crawling**: HTTPX, BeautifulSoup4, regular expressions, async task workers.
- **Exporting**: OpenPyXL (`.xlsx`), standard CSV (`.csv`).

---

## 🚀 Running the Application

### 1. Backend Server (FastAPI)
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation is accessible at: `http://127.0.0.1:8000/docs`

### 2. Frontend Application (Next.js)
```bash
cd frontend
npm run start -p 3000
# Or for development:
npm run dev -p 3000
```
Dashboard is accessible at: `http://localhost:3000`

---

## 📁 Project Architecture

```
Lead Scraper/
├── backend/
│   ├── config.py                 # Configuration & environment settings
│   ├── database.py               # Async SQLAlchemy engine & session factory
│   ├── models.py                 # DB models: User, DataSource, Search, Lead, Contact, Audit, Note, Export
│   ├── schemas.py                # Pydantic validation schemas
│   ├── connectors/               # Modular data discovery connectors
│   │   ├── base.py               # BaseConnector abstract class
│   │   ├── web_search_connector.py
│   │   ├── public_directory_connector.py
│   │   ├── domain_list_connector.py
│   │   └── manager.py            # Connector orchestrator & deduplication
│   ├── crawler/                  # Automated crawl & audit engine
│   │   ├── website_crawler.py    # Async HTTP crawler with SSRF guardrails
│   │   ├── contact_extractor.py  # Regex & DOM email, phone, and social extractor
│   │   ├── quality_analyzer.py   # 0-100 defect & improvement opportunity scoring
│   │   └── qualification.py      # Lead priority classifier with transparent reasons
│   ├── services/                 # Background business logic
│   │   ├── search_service.py     # Background job runner with pause/resume/cancel
│   │   ├── audit_service.py      # Live website auditor
│   │   ├── export_service.py     # XLSX and CSV generator
│   │   └── automation_service.py # Scheduled recurring workflows
│   ├── routers/                  # REST API endpoints
│   │   ├── overview.py
│   │   ├── search.py
│   │   ├── leads.py
│   │   ├── analyzer.py
│   │   ├── sources.py
│   │   ├── automation.py
│   │   └── export.py
│   └── main.py                   # FastAPI application initialization & CORS
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Dark navy collapsible navigation sidebar
│   │   │   ├── Header.tsx        # Top search, health indicator, notifications
│   │   │   ├── LeadDetailsModal.tsx # Full business profile & audit drawer
│   │   │   └── views/            # All 10 application views
│   │   ├── lib/api.ts            # Typed API client
│   │   └── types/index.ts        # TypeScript data definitions
├── test_platform.py              # End-to-end integration test suite
└── README.md
```
