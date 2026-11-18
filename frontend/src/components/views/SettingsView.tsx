"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Server,
  Sliders,
  CheckCircle2,
  Bot,
  Building,
  Save,
  Lock,
  Globe
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const [agencyName, setAgencyName] = useState("Vanguard Digital Solutions");
  const [outreachEmail, setOutreachEmail] = useState("prospects@vanguarddigital.agency");
  const [concurrency, setConcurrency] = useState(5);
  const [timeoutSec, setTimeoutSec] = useState(12);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Platform Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure crawler speed, SSRF guardrails, agency profile details, and system diagnostic parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agency Profile */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Building className="w-4 h-4 text-blue-600" />
            <span>1. Agency Outreach Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Web Design Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sender Outreach Email</label>
              <input
                type="email"
                value={outreachEmail}
                onChange={(e) => setOutreachEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Crawler Parameters */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>2. Autonomous Web Crawler & Scraper Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Concurrent Page Crawls</label>
              <input
                type="number"
                min="1"
                max="20"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Controls rate limiting and host load.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Request Timeout (Seconds)</label>
              <input
                type="number"
                min="5"
                max="30"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Unresponsive websites exceeding this limit receive poor speed scores.
              </span>
            </div>
          </div>
        </div>

        {/* Security & System Guardrails */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3. Security, SSRF & Access Guardrails</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block">SSRF Protection & Private IP Blocking</strong>
                <span className="text-slate-500 text-[11px]">
                  Internal localhost, 127.0.0.1, AWS/GCP metadata, and private subnets are blocked.
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Active & Enforced
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block">Database Storage Layer</strong>
                <span className="text-slate-500 text-[11px]">
                  Async SQLAlchemy with SQLite local storage, ready for Supabase / PostgreSQL.
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? "Saved Settings!" : "Save Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
