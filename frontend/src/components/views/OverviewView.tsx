"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  MailCheck,
  GlobeX,
  ClockAlert,
  Flame,
  Search,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { OverviewMetricsData, Lead } from "../../types";
import { api } from "../../lib/api";

interface OverviewViewProps {
  onNavigate: (view: string) => void;
  onOpenLead: (lead: Lead) => void;
  onOpenNewSearch: () => void;
}

const PRIORITY_COLORS = {
  "High Priority": "#f43f5e", // Rose
  "Medium Priority": "#3b82f6", // Blue
  "Low Priority": "#10b981", // Emerald
};

const QUALITY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenLead,
  onOpenNewSearch,
}) => {
  const [metrics, setMetrics] = useState<OverviewMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      const data = await api.getOverviewMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const kpis = [
    {
      title: "Total Leads",
      value: metrics?.total_leads || 0,
      sub: "Discovered across active sources",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Verified Emails",
      value: metrics?.verified_emails || 0,
      sub: "Valid direct outreach contacts",
      icon: MailCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Without Websites",
      value: metrics?.without_websites || 0,
      sub: "Immediate web build opportunities",
      icon: GlobeX,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Outdated Websites",
      value: metrics?.outdated_websites || 0,
      sub: "Defect score >= 40/100",
      icon: ClockAlert,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "High-Priority Leads",
      value: metrics?.high_priority_leads || 0,
      sub: "High agency conversion potential",
      icon: Flame,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "Total Searches",
      value: metrics?.total_searches || 0,
      sub: "Multi-source discovery runs",
      icon: Search,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  // Prepare chart data
  const priorityPieData = metrics?.leads_by_priority
    ? Object.entries(metrics.leads_by_priority).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const qualityBarData = metrics?.website_quality_distribution
    ? Object.entries(metrics.website_quality_distribution).map(([name, count]) => ({
        name: name.split(" ")[0],
        full: name,
        leads: count,
      }))
    : [];

  const categoryBarData = metrics?.leads_by_category
    ? Object.entries(metrics.leads_by_category).map(([name, count]) => ({
        name: name.length > 14 ? name.substring(0, 14) + "..." : name,
        leads: count,
      }))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Agency Lead Dashboard
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Live SaaS Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-source business scraper, website audit engine, and client prospecting pipeline.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-all"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenNewSearch}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Start New Lead Discovery</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {loading ? "..." : kpi.value.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Leads Over Time */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Leads Discovered Over Time</h3>
              <p className="text-[11px] text-slate-500">Autonomous scraping trend across target regions</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Cumulative Growth
            </span>
          </div>
          <div className="h-64 w-full">
            {metrics?.leads_over_time && metrics.leads_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.leads_over_time}>
                  <defs>
                    <linearGradient id="leadGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#leadGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No search trends recorded yet. Run your first lead search above!
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Lead Priority Breakdown (Donut) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Qualification Split</h3>
            <p className="text-[11px] text-slate-500">Priority weighting for agency outreach</p>
          </div>
          <div className="h-48 w-full my-auto">
            {priorityPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || "#94a3b8"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No qualified leads yet.
              </div>
            )}
          </div>
          <div className="flex justify-around text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">High</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">Medium</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Website Quality Opportunity Distribution & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Website Quality Defect Spectrum</h3>
              <p className="text-[11px] text-slate-500">
                Higher scores = Critical defects & agency redesign opportunities
              </p>
            </div>
          </div>
          <div className="h-56 w-full">
            {qualityBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                    {qualityBarData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No website audits recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Industries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Prospect Categories</h3>
              <p className="text-[11px] text-slate-500">Distribution by industry and trade</p>
            </div>
          </div>
          <div className="h-56 w-full">
            {categoryBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="leads" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No industry categories recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Discovered Leads Table & Recent Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Discovered Leads</h3>
              <p className="text-[11px] text-slate-500">Recently qualified business opportunities</p>
            </div>
            <button
              onClick={() => onNavigate("all-leads")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="pb-2.5">Business Name</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Website Status</th>
                  <th className="pb-2.5">Priority</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recent_leads && metrics.recent_leads.length > 0 ? (
                  metrics.recent_leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">
                        <div className="flex items-center space-x-2">
                          <span>{l.business_name}</span>
                          {l.email && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Has Email" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">{l.category || "General"}</td>
                      <td className="py-3">
                        {l.has_website && l.website ? (
                          <span className="text-indigo-600 font-medium truncate max-w-[140px] inline-block">
                            Defect Score: {l.website_score}/100
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.lead_priority === "High Priority"
                              ? "bg-rose-100 text-rose-700"
                              : l.lead_priority === "Medium Priority"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {l.lead_priority}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onOpenLead(l)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No leads discovered yet. Click &quot;Start New Lead Discovery&quot; to begin scraping!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Search Activity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Searches</h3>
              <p className="text-[11px] text-slate-500">Autonomous discovery jobs</p>
            </div>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics?.recent_searches && metrics.recent_searches.length > 0 ? (
              metrics.recent_searches.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                      {s.keywords}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "running"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{s.location}</span>
                    <span>
                      <strong className="text-slate-700">{s.total_qualified}</strong> leads qualified
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No past search activity recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
