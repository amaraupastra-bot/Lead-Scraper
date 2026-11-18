"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  Zap,
  Gauge,
  Tag,
  Star,
  Sparkles
} from "lucide-react";
import { Lead, LeadStatus, LeadPriority } from "../types";
import { api } from "../lib/api";

interface LeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  onClose,
  onLeadUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "contacts" | "notes">("analysis");
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(lead?.lead_status || "New");
  const [priority, setPriority] = useState<LeadPriority>(lead?.lead_priority || "Medium Priority");

  if (!lead) return null;

  const latestAudit = lead.audits && lead.audits.length > 0 ? lead.audits[lead.audits.length - 1] : null;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatus(newStatus);
    try {
      const updated = await api.updateLead(lead.id, { lead_status: newStatus });
      onLeadUpdated(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    setPriority(newPriority);
    try {
      const updated = await api.updateLead(lead.id, { lead_priority: newPriority });
      onLeadUpdated(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const updated = await api.updateLead(lead.id, { is_favorite: !lead.is_favorite });
      onLeadUpdated(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await api.addLeadNote(lead.id, newNote);
      const refreshed = await api.getLeadById(lead.id);
      onLeadUpdated(refreshed);
      setNewNote("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleReanalyze = async () => {
    if (!lead.website) return;
    setIsReanalyzing(true);
    try {
      await api.reanalyzeLead(lead.id);
      const refreshed = await api.getLeadById(lead.id);
      onLeadUpdated(refreshed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              {lead.business_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{lead.business_name}</h2>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1 rounded-lg hover:bg-slate-200 transition-colors ${
                    lead.is_favorite ? "text-amber-500 fill-amber-500" : "text-slate-400"
                  }`}
                  title={lead.is_favorite ? "Favorited" : "Save as Favorite"}
                >
                  <Star className={`w-4 h-4 ${lead.is_favorite ? "fill-amber-500" : ""}`} />
                </button>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.category || "General Business"}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {lead.city ? `${lead.city}, ` : ""}
                    {lead.state ? `${lead.state}, ` : ""}
                    {lead.country}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {lead.website && (
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isReanalyzing ? "animate-spin" : ""}`} />
                <span>{isReanalyzing ? "Auditing Site..." : "Re-Analyze"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="New">New</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Converted">Converted</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Priority:</span>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as LeadPriority)}
                className="bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="High Priority">🔥 High Priority</option>
                <option value="Medium Priority">⚡ Medium Priority</option>
                <option value="Low Priority">🌱 Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-slate-500">
            <span>
              Source: <strong className="text-slate-700">{lead.source_name}</strong>
            </span>
            <span>
              Discovered:{" "}
              <strong className="text-slate-700">
                {new Date(lead.created_at).toLocaleDateString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 space-x-6 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "analysis"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Website Quality & Opportunity</span>
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "contacts"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact Records ({lead.contacts?.length || (lead.email ? 1 : 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Agency Notes ({lead.notes?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* Score Highlight Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
                      Improvement Need Score
                    </span>
                    <div className="flex items-baseline space-x-1.5 mt-1">
                      <span className="text-3xl font-extrabold">{lead.website_score}</span>
                      <span className="text-slate-400 text-sm">/ 100</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 font-medium">
                    {lead.website_score >= 50
                      ? "High redesign/rebuild opportunity for agency pitch."
                      : lead.website_score >= 25
                      ? "Moderate technical & mobile optimizations needed."
                      : "Website is relatively modern & functional."}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Mobile Usability
                  </span>
                  <div className="flex items-center space-x-2 mt-2">
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {latestAudit ? latestAudit.mobile_status : lead.has_website ? "Responsive" : "No Website"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {latestAudit?.mobile_status === "Non-Responsive"
                      ? "Fails mobile viewport checks. Broken layout on smartphones."
                      : "Standard viewport meta detected."}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Security & SSL
                  </span>
                  <div className="flex items-center space-x-2 mt-2">
                    <ShieldAlert
                      className={`w-5 h-5 ${
                        latestAudit?.has_https ? "text-emerald-500" : "text-rose-500"
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-800">
                      {latestAudit?.has_https ? "HTTPS Secure" : "Missing SSL (Insecure)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {latestAudit?.has_https
                      ? "Encrypted TLS connection active."
                      : "Browsers display 'Not Secure' warning to visitors."}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Load Response
                  </span>
                  <div className="flex items-center space-x-2 mt-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-slate-800">
                      {latestAudit?.load_time_ms ? `${(latestAudit.load_time_ms / 1000).toFixed(1)}s` : "N/A"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Server response & page fetch duration.
                  </p>
                </div>
              </div>

              {/* Qualification Reasons & Pitch Angles */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4.5">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Agency Pitch Angles & Qualification Factors
                </h4>
                <ul className="space-y-1.5">
                  {lead.qualification_reasons && lead.qualification_reasons.length > 0 ? (
                    lead.qualification_reasons.map((r, i) => (
                      <li key={i} className="text-xs text-blue-800 flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-blue-700">Standard business discovery profile.</li>
                  )}
                </ul>
              </div>

              {/* Detected Issues List */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Specific Website Issues Detected ({latestAudit?.detected_issues?.length || 0})
                </h4>
                {latestAudit?.detected_issues && latestAudit.detected_issues.length > 0 ? (
                  <div className="space-y-2">
                    {latestAudit.detected_issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-xs text-slate-800"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span className="font-medium">{issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                    No critical code or design issues detected, or business has no website.
                  </p>
                )}
              </div>

              {/* Recommendations */}
              {latestAudit?.recommendations && latestAudit.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    Recommended Design & Development Solutions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {latestAudit.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-xs flex items-start space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Publicly Extracted Channels & Profiles
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Business Email</span>
                  </div>
                  {lead.email ? (
                    <div className="flex items-center justify-between">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-bold text-blue-600 hover:underline truncate"
                      >
                        {lead.email}
                      </a>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {lead.has_verified_email ? "Verified Mailto" : "Extracted"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No public email found on website pages.</p>
                  )}
                </div>

                {/* Phone Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Business Phone</span>
                  </div>
                  {lead.phone ? (
                    <div className="flex items-center justify-between">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm font-bold text-slate-900 hover:underline"
                      >
                        {lead.phone}
                      </a>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                        Public Listing
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No public telephone listed.</p>
                  )}
                </div>

                {/* Website Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Primary Website</span>
                  </div>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{lead.website}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-xs text-rose-600 font-medium">
                      No website detected (Agency Client Prospect)
                    </p>
                  )}
                </div>

                {/* Social Media Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold mb-2">
                    <Share2 className="w-4 h-4 text-purple-600" />
                    <span>Social Media Channels</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    {lead.facebook && (
                      <a
                        href={lead.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Facebook
                      </a>
                    )}
                    {lead.instagram && (
                      <a
                        href={lead.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-600 hover:underline font-semibold"
                      >
                        Instagram
                      </a>
                    )}
                    {lead.linkedin && (
                      <a
                        href={lead.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        LinkedIn
                      </a>
                    )}
                    {!lead.facebook && !lead.instagram && !lead.linkedin && (
                      <span className="text-slate-400">No public social handles found.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record agency outreach notes, client responses, proposal status..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[80px]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
                >
                  {isSubmittingNote ? "Adding Note..." : "Add Agency Note"}
                </button>
              </form>

              {/* Note List */}
              <div className="space-y-2.5 pt-2">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{n.author_name}</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-800">{n.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No notes recorded yet for this business.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
