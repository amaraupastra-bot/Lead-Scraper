"use client";

import React, { useState } from "react";
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Smartphone,
  Layers,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  Check,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { api } from "../../lib/api";

export const WebsiteAnalyzerView: React.FC = () => {
  const [url, setUrl] = useState("https://example.com");
  const [businessName, setBusinessName] = useState("Example Company");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAuditing(true);
    setErrorMsg(null);
    setAuditResult(null);
    setSavedSuccess(false);

    try {
      const res = await api.runLiveAudit(url.trim());
      if (res.error) {
        setErrorMsg(res.error);
      }
      setAuditResult(res);
      
      // Auto deduce business name from domain
      try {
        const hostname = new URL(res.url || url).hostname.replace(/^www\./, "");
        const namePart = hostname.split(".")[0];
        setBusinessName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      } catch {
        setBusinessName("Audited Prospect");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze website. Ensure URL is publicly accessible.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSaveAsLead = async () => {
    if (!auditResult) return;
    setIsSaving(true);
    try {
      await api.saveAuditLead({
        audit_data: auditResult,
        business_name: businessName || "Audited Prospect",
        category: "Audited Prospect",
      });
      setSavedSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save as lead.");
    } finally {
      setIsSaving(false);
    }
  };

  const auditInfo = auditResult?.audit;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Standalone Website Quality Analyzer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform a deep inspection on any prospect&apos;s website. Detect outdated markup, mobile flaws, missing SSL, and performance bottlenecks.
        </p>
      </div>

      {/* Input Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <form onSubmit={handleRunAudit} className="space-y-4">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Enter Public Website URL:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. acmeplumbing.com or https://dentalclinic.org"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAuditing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isAuditing ? "Auditing Website..." : "Run Complete Audit"}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Audit Report Result */}
      {auditResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-3">
          {/* Top Bar with Save Button */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Audited Website:
              </span>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{auditResult.url}</span>
                <a
                  href={auditResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Company Name"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
              <button
                onClick={handleSaveAsLead}
                disabled={isSaving || savedSuccess}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to CRM!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Save as Lead</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col justify-between shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Defect / Need Score
              </span>
              <div className="my-2">
                <span className="text-4xl font-black">{auditInfo?.improvement_score || 0}</span>
                <span className="text-slate-400 text-xs"> / 100</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {auditInfo?.improvement_score >= 45
                  ? "🔥 High agency pitch potential"
                  : "Moderate redesign opportunity"}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Performance Rating
              </span>
              <div className="my-2 flex items-baseline space-x-1">
                <span className="text-4xl font-extrabold text-blue-600">
                  {auditInfo?.performance_score || 0}
                </span>
                <span className="text-slate-400 text-xs">/100</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Load time: {((auditInfo?.load_time_ms || 0) / 1000).toFixed(2)}s
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mobile Status
              </span>
              <div className="my-2">
                <span
                  className={`text-base font-extrabold px-2.5 py-1 rounded-xl ${
                    auditInfo?.mobile_status === "Responsive"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {auditInfo?.mobile_status || "Unknown"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Viewport meta configuration</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Security & SSL
              </span>
              <div className="my-2">
                <span
                  className={`text-base font-extrabold px-2.5 py-1 rounded-xl ${
                    auditInfo?.has_https
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {auditInfo?.has_https ? "HTTPS Secure" : "Missing SSL"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Data encryption in transit</p>
            </div>
          </div>

          {/* Issues and Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detected Issues */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Detected Technical & Design Flaws</span>
              </h3>
              <div className="space-y-2">
                {auditInfo?.detected_issues && auditInfo.detected_issues.length > 0 ? (
                  auditInfo.detected_issues.map((issue: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 flex items-start space-x-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No critical errors discovered.</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Client Proposal Recommendations</span>
              </h3>
              <div className="space-y-2">
                {auditInfo?.recommendations && auditInfo.recommendations.length > 0 ? (
                  auditInfo.recommendations.map((rec: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific recommendations.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
