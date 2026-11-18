"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  GlobeX,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import { Lead } from "../../types";
import { api } from "../../lib/api";

interface HighPriorityViewProps {
  onOpenLead: (lead: Lead) => void;
}

export const HighPriorityView: React.FC<HighPriorityViewProps> = ({ onOpenLead }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighPriority = async () => {
      setLoading(true);
      try {
        const data = await api.getLeads({ priority: "High Priority" });
        setLeads(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHighPriority();
  }, []);

  const handleCopyPitch = (lead: Lead) => {
    const issues = lead.qualification_reasons.join("\n- ");
    const pitch = `Hi ${lead.business_name} Team,\n\nI was reviewing local businesses in ${lead.city || "your area"} and noticed a few key opportunities with your online presence:\n- ${issues}\n\nWe specialize in modern web design and high-converting mobile sites. Would you be open to a quick 5-minute audit preview this week?`;
    
    navigator.clipboard.writeText(pitch);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/15">
        <div className="flex items-center space-x-2 text-rose-100 text-xs font-bold uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4 text-white fill-white" />
          <span>Prime Conversion Opportunities</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">High-Priority Agency Leads</h1>
        <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
          These businesses have the greatest urgency for web development services: either operating with 
          <strong> no website at all</strong>, or suffering from <strong>critical mobile/SSL/speed defects</strong>, 
          paired with <strong>direct verified emails and phone lines</strong> for immediate agency outreach.
        </p>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading high-priority leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <Flame className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No High-Priority Leads Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Run a search in &quot;Find Leads&quot; targeting industries like Plumbers, Dentists, or Roofers. 
            The system will automatically identify high-urgency redesign and build opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {l.category || "Local Business"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {l.business_name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex-shrink-0">
                    Defect: {l.website_score}/100
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{l.city || l.country}</span>
                </div>

                {/* Pitch Reasons */}
                <div className="mt-3.5 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Why This is High-Priority:
                  </span>
                  {l.qualification_reasons.slice(0, 2).map((r, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Outreach Channels */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {l.email ? (
                    <a
                      href={`mailto:${l.email}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold truncate max-w-[170px]"
                    >
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{l.email}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No direct email</span>
                  )}

                  {l.phone ? (
                    <a
                      href={`tel:${l.phone}`}
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{l.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No direct phone</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleCopyPitch(l)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                  >
                    {copiedId === l.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Pitch Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Pitch</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenLead(l)}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                  >
                    Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
