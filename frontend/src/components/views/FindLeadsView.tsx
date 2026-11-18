"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Layers,
  Sliders,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users
} from "lucide-react";
import { SearchJob, Lead } from "../../types";
import { api } from "../../lib/api";

interface FindLeadsViewProps {
  onNavigateToLeads: () => void;
  onOpenLead: (lead: Lead) => void;
}

const COMMON_CATEGORIES = [
  "Plumbing & HVAC",
  "Roofing & Siding",
  "Dentists & Orthodontics",
  "Electricians",
  "Landscaping & Tree Service",
  "Auto Repair & Body Shops",
  "Accounting & CPA",
  "Law Firms & Attorneys",
  "Restaurants & Catering",
  "Veterinary Clinics",
  "Chiropractors",
  "General Contractors"
];

export const FindLeadsView: React.FC<FindLeadsViewProps> = ({
  onNavigateToLeads,
  onOpenLead,
}) => {
  // Form State
  const [keywords, setKeywords] = useState("Roofing Contractors");
  const [location, setLocation] = useState("Austin, TX");
  const [country, setCountry] = useState("United States");
  const [stateProvince, setStateProvince] = useState("TX");
  const [postalCode, setPostalCode] = useState("");
  const [category, setCategory] = useState("Roofing & Siding");
  
  // Website Filter
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<string>("all"); // all, yes, no, outdated
  
  // Contact Channels
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireSocials, setRequireSocials] = useState(false);

  // Data Sources
  const [sources, setSources] = useState<string[]>([
    "open_web_search",
    "public_business_directory",
  ]);

  // Limits
  const [maxResults, setMaxResults] = useState<number>(15);

  // Active Search Job State
  const [activeJob, setActiveJob] = useState<SearchJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start Search
  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || !location.trim()) return;

    setIsSubmitting(true);
    try {
      const job = await api.createSearch({
        keywords: keywords.trim(),
        location: location.trim(),
        country,
        category: category || keywords,
        data_sources: sources,
        max_results: maxResults,
        has_website_filter: hasWebsiteFilter,
        contact_filters: [
          ...(requireEmail ? ["email"] : []),
          ...(requirePhone ? ["phone"] : []),
          ...(requireSocials ? ["facebook", "instagram"] : []),
        ],
      });

      setActiveJob(job);
      setDiscoveredLeads([]);
    } catch (err) {
      console.error(err);
      alert("Failed to start search. Ensure backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll for Search Progress while running or paused
  useEffect(() => {
    if (!activeJob || (activeJob.status !== "running" && activeJob.status !== "queued" && activeJob.status !== "paused")) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const poll = async () => {
      try {
        const updated = await api.getSearchById(activeJob.id);
        setActiveJob(updated);

        // Fetch leads discovered for this search
        const leads = await api.getLeads({ search: updated.keywords, limit: 15 });
        setDiscoveredLeads(leads);

        if (updated.status === "completed" || updated.status === "failed" || updated.status === "cancelled") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (e) {
        console.error(e);
      }
    };

    pollTimerRef.current = setInterval(poll, 1500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeJob?.id, activeJob?.status]);

  const handlePause = async () => {
    if (!activeJob) return;
    try {
      await api.pauseSearch(activeJob.id);
      setActiveJob({ ...activeJob, status: "paused" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async () => {
    if (!activeJob) return;
    try {
      await api.resumeSearch(activeJob.id);
      setActiveJob({ ...activeJob, status: "running" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    try {
      await api.cancelSearch(activeJob.id);
      setActiveJob({ ...activeJob, status: "cancelled" });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSource = (src: string) => {
    if (sources.includes(src)) {
      if (sources.length > 1) {
        setSources(sources.filter((s) => s !== src));
      }
    } else {
      setSources([...sources, src]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Multi-Source Lead Search Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Target businesses by location, trade category, website defect patterns, and public contact channels.
        </p>
      </div>

      {/* Main Search Panel & Live Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Search Filters (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleStartSearch} className="space-y-6">
            {/* Location Section */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>1. Target Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    City & State / Metro Area
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX or Chicago, IL"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Business Section */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>2. Business Category & Keywords</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Search Keywords / Business Name
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. Plumbers, Roofing Services, Law Firm"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    High-Opportunity Industry Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setKeywords(cat);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          category === cat
                            ? "bg-blue-600 text-white border-blue-600 font-semibold"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Website Status Filter */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>3. Website Quality & Presence Target</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: "all", label: "All Websites" },
                  { id: "no", label: "No Website (Goldmine)" },
                  { id: "outdated", label: "Outdated / Slow" },
                  { id: "yes", label: "Has Website" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setHasWebsiteFilter(opt.id)}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      hasWebsiteFilter === opt.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Channels Requirement */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>4. Contact Information Requirements</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={requireEmail}
                    onChange={(e) => setRequireEmail(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Verified Email</span>
                </label>
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={requirePhone}
                    onChange={(e) => setRequirePhone(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Public Phone</span>
                </label>
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={requireSocials}
                    onChange={(e) => setRequireSocials(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Facebook / IG</span>
                </label>
              </div>
            </div>

            {/* Data Source Toggles */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>5. Multi-Source Connectors</span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    id: "open_web_search",
                    label: "Open Web Business Discovery",
                    desc: "CRAWLS live search indexes for business homepages",
                  },
                  {
                    id: "public_business_directory",
                    label: "Public Business Directory Connector",
                    desc: "DISCOVERS registered local businesses (including those without websites)",
                  },
                  {
                    id: "local_web_crawler",
                    label: "Target Domain & Direct Web Crawler",
                    desc: "INSPECTS local business domain patterns",
                  },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => toggleSource(s.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      sources.includes(s.id)
                        ? "bg-blue-50/60 border-blue-200 text-blue-900"
                        : "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{s.label}</p>
                      <p className="text-[10px] text-slate-500">{s.desc}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sources.includes(s.id)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {sources.includes(s.id) ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Max Results Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <span>Maximum Results to Discover & Analyze:</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {maxResults} Businesses
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>{isSubmitting ? "Initiating Discovery..." : "START MULTI-SOURCE SEARCH"}</span>
            </button>
          </form>
        </div>

        {/* Right Panel: Live Search Progress & Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {activeJob ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              {/* Header with Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeJob.search_name}</h3>
                  <p className="text-[11px] text-slate-400">
                    ID: {activeJob.id.substring(0, 8)}...
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                    activeJob.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : activeJob.status === "running"
                      ? "bg-blue-100 text-blue-800 animate-pulse"
                      : activeJob.status === "paused"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {activeJob.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                  <span className="text-slate-600">Scraping & Analysis Progress:</span>
                  <span className="font-bold text-slate-900">{activeJob.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${activeJob.progress}%` }}
                  />
                </div>
              </div>

              {/* 6 Real-Time Counters Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Discovered
                  </span>
                  <span className="text-xl font-extrabold text-slate-800">
                    {activeJob.total_discovered}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Websites Analyzed
                  </span>
                  <span className="text-xl font-extrabold text-blue-600">
                    {activeJob.total_processed}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Qualified Leads
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600">
                    {activeJob.total_qualified}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Duplicates Removed
                  </span>
                  <span className="text-xl font-extrabold text-amber-600">
                    {activeJob.duplicates_removed}
                  </span>
                </div>
              </div>

              {/* Controls: Pause / Resume / Cancel */}
              <div className="flex items-center space-x-2 pt-2">
                {activeJob.status === "running" && (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Search</span>
                  </button>
                )}
                {activeJob.status === "paused" && (
                  <button
                    onClick={handleResume}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Search</span>
                  </button>
                )}
                {(activeJob.status === "running" || activeJob.status === "paused") && (
                  <button
                    onClick={handleCancel}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
                {activeJob.status === "completed" && (
                  <button
                    onClick={onNavigateToLeads}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>View All {activeJob.total_qualified} Discovered Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Stream of Newly Discovered Leads */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Live Lead Feed ({discoveredLeads.length})
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {discoveredLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => onOpenLead(l)}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {l.business_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {l.website || "No Website Registered"}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          l.lead_priority === "High Priority"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {l.lead_priority}
                      </span>
                    </div>
                  ))}
                  {discoveredLeads.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      Connecting to multi-source engines and discovering target businesses...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to Discover Leads</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Configure your filters on the left and click &quot;Start Multi-Source Search&quot;.
                  Our autonomous engine will discover businesses, crawl websites, and qualify agency opportunities.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real public business discovery without API lock-in</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automated defect scoring (Mobile, SSL, Speed, Age)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified contact extraction (Mailto, Phone, Socials)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
