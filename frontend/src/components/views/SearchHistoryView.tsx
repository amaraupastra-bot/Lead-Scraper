"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Layers,
  MapPin,
  Calendar
} from "lucide-react";
import { SearchJob } from "../../types";
import { api } from "../../lib/api";

interface SearchHistoryViewProps {
  onNavigateToLeads: (keywords?: string) => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  onNavigateToLeads,
}) => {
  const [history, setHistory] = useState<SearchJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getSearchHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Search Discovery History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical log of automated business discovery jobs and multi-source crawl executions.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
                <th className="py-3.5 px-5">Search Query & Terms</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Discovered</th>
                <th className="py-3.5 px-4 text-center">Qualified</th>
                <th className="py-3.5 px-4 text-center">Duplicates Filtered</th>
                <th className="py-3.5 px-4">Date Run</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading search history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    No past searches recorded.
                  </td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 block">{s.keywords}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.id.substring(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {s.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          s.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "running"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {s.total_discovered}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                      {s.total_qualified}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-amber-600">
                      {s.duplicates_removed}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onNavigateToLeads(s.keywords)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        View Leads
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
