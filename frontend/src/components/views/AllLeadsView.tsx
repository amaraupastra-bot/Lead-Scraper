"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Star,
  CheckCircle2,
  Share2,
  MoreHorizontal,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Lead, LeadPriority, LeadStatus } from "../../types";
import { api } from "../../lib/api";

interface AllLeadsViewProps {
  onOpenLead: (lead: Lead) => void;
}

export const AllLeadsView: React.FC<AllLeadsViewProps> = ({ onOpenLead }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({
        search: searchTerm,
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        has_website: hasWebsiteFilter === "yes" ? true : hasWebsiteFilter === "no" ? false : undefined,
      });
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, priorityFilter, statusFilter, hasWebsiteFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const updated = await api.updateLead(leadId, { lead_status: newStatus });
      setLeads(leads.map((l) => (l.id === leadId ? updated : l)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (leadId: string, current: boolean) => {
    try {
      const updated = await api.updateLead(leadId, { is_favorite: !current });
      setLeads(leads.map((l) => (l.id === leadId ? updated : l)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await api.deleteLead(leadId);
      setLeads(leads.filter((l) => l.id !== leadId));
      setSelectedIds(selectedIds.filter((id) => id !== leadId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkExport = async (format: "xlsx" | "csv") => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try {
      const res = await api.createExport({
        format,
        lead_ids: selectedIds,
      });
      window.open(api.getDownloadUrl(res.file_name), "_blank");
    } catch (e) {
      console.error(e);
      alert("Failed to export leads.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            All Discovered Leads
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              {leads.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized CRM table with defect scoring, contact channels, and agency qualification statuses.
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 animate-in slide-in-from-top-2">
            <span className="text-xs font-bold text-blue-900">
              {selectedIds.length} Selected
            </span>
            <button
              onClick={() => handleBulkExport("xlsx")}
              disabled={isExporting}
              className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleBulkExport("csv")}
              disabled={isExporting}
              className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business name, category, city, email, domain..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="High Priority">🔥 High Priority</option>
            <option value="Medium Priority">⚡ Medium Priority</option>
            <option value="Low Priority">🌱 Low Priority</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Converted">Converted</option>
          </select>
        </div>

        {/* Website Presence */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-medium">Website:</span>
          <select
            value={hasWebsiteFilter}
            onChange={(e) => setHasWebsiteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="">All Presence</option>
            <option value="yes">Has Website</option>
            <option value="no">No Website (Build Opp)</option>
          </select>
        </div>

        <button
          onClick={fetchLeads}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Refresh table"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3">Business Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Website</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Defect Score</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading discovered leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    No leads match the current filters. Run a new search in &quot;Find Leads&quot; to populate records.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Business Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleFavorite(l.id, l.is_favorite)}
                          className={`p-0.5 rounded transition-colors ${
                            l.is_favorite ? "text-amber-500" : "text-slate-300 hover:text-slate-500"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${l.is_favorite ? "fill-amber-500" : ""}`} />
                        </button>
                        <span
                          onClick={() => onOpenLead(l)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors truncate max-w-[170px]"
                        >
                          {l.business_name}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 text-slate-600 truncate max-w-[120px]">
                      {l.category || "General"}
                    </td>

                    {/* Website */}
                    <td className="py-3.5 px-3">
                      {l.has_website && l.website ? (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium truncate max-w-[140px]"
                        >
                          <span className="truncate">{l.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          No Website
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-3">
                      {l.email ? (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-slate-700 font-medium truncate max-w-[130px]">
                            {l.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-3 text-slate-700 truncate max-w-[120px]">
                      {l.phone || <span className="text-slate-300">—</span>}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 text-slate-600 truncate max-w-[110px]">
                      {l.city || l.country}
                    </td>

                    {/* Defect Score */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                          l.website_score >= 60
                            ? "bg-rose-100 text-rose-700"
                            : l.website_score >= 35
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {l.website_score}/100
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={l.lead_status}
                        onChange={(e) => handleStatusChange(l.id, e.target.value as LeadStatus)}
                        className="bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2 py-0.5 text-[11px] font-semibold focus:outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenLead(l)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l.id)}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
