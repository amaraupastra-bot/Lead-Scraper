"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers
} from "lucide-react";
import { ExportHistoryItem } from "../../types";
import { api } from "../../lib/api";

export const ExportCenterView: React.FC = () => {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [scope, setScope] = useState<string>("all"); // all, high_priority, no_website, outdated
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await api.getExportHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const res = await api.createExport({
        format,
        lead_priority: scope === "high_priority" ? "High Priority" : undefined,
        only_without_websites: scope === "no_website",
        only_outdated_websites: scope === "outdated",
      });

      setExportSuccess(res.file_name);
      await fetchHistory();

      // Trigger browser download
      window.open(api.getDownloadUrl(res.file_name), "_blank");
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Export Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Export qualified business records, website audit breakdowns, and contact channels in Excel (.xlsx) and CSV format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Export Generator (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleExport} className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Select Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("xlsx")}
                  className={`p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                    format === "xlsx"
                      ? "bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-xs">Excel Spreadsheet (.xlsx)</strong>
                    <span className="text-[11px] text-slate-500">
                      Formatted columns & styled agency headers
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                    format === "csv"
                      ? "bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <strong className="block text-xs">CSV Data File (.csv)</strong>
                    <span className="text-[11px] text-slate-500">
                      Compatible with Instantly, Clay, Apollo, CRM
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                2. Select Export Dataset Scope
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: "all",
                    title: "All Discovered Leads",
                    sub: "Complete database of discovered business records",
                  },
                  {
                    id: "high_priority",
                    title: "High-Priority Opportunities Only",
                    sub: "Only high urgency prospects (No website or severe defects + contact info)",
                  },
                  {
                    id: "no_website",
                    title: "Businesses Without Websites",
                    sub: "Prime prospects for brand new web design proposals",
                  },
                  {
                    id: "outdated",
                    title: "Outdated / Slow Websites Only",
                    sub: "Websites with defect scores >= 40/100",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      scope === item.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={item.id}
                      checked={scope === item.id}
                      onChange={() => setScope(item.id)}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <p className="text-xs font-bold">{item.title}</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          scope === item.id ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isExporting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Generating Export File..." : "GENERATE & DOWNLOAD EXPORT"}</span>
            </button>
          </form>

          {exportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Generated <strong>{exportSuccess}</strong>. Download initiated automatically!</span>
            </div>
          )}
        </div>

        {/* History (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Export Downloads</h3>
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {history.length > 0 ? (
              history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate">{h.file_name}</p>
                    <span className="text-[10px] text-slate-400">
                      {h.row_count} rows • {h.format.toUpperCase()} • {new Date(h.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={api.getDownloadUrl(h.file_name)}
                    download
                    className="p-2 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No exports generated yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
