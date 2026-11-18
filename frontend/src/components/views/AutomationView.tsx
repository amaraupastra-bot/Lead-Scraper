"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Power,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { AutomationItem } from "../../types";
import { api } from "../../lib/api";

export const AutomationView: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState("Weekly Dental Lead Scraper");
  const [category, setCategory] = useState("Dentists & Orthodontics");
  const [location, setLocation] = useState("Denver, CO");
  const [schedule, setSchedule] = useState<"Daily" | "Weekly" | "Monthly">("Weekly");
  const [maxResults, setMaxResults] = useState(25);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const data = await api.getAutomations();
      setAutomations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAutomation({
        name,
        category,
        location,
        schedule,
        max_results: maxResults,
        data_sources: ["open_web_search", "public_business_directory"],
        is_active: true,
      });
      setAutomations([created, ...automations]);
      setShowCreateModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create automation.");
    }
  };

  const handleTriggerNow = async (id: string) => {
    setTriggeringId(id);
    try {
      await api.triggerAutomation(id);
      alert("Automation workflow triggered! Running lead search in background.");
      await fetchAutomations();
    } catch (e) {
      console.error(e);
      alert("Failed to trigger workflow.");
    } finally {
      setTriggeringId(null);
    }
  };

  const handleToggleActive = async (flow: AutomationItem) => {
    try {
      const updated = await api.updateAutomation(flow.id, {
        is_active: !flow.is_active,
      });
      setAutomations(automations.map((a) => (a.id === flow.id ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automated workflow?")) return;
    try {
      await api.deleteAutomation(id);
      setAutomations(automations.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Scheduled Automations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure autonomous recurring scraper workflows. Automatically discovers new businesses without collecting duplicates.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Scheduled Workflow</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">
            Loading scheduled workflows...
          </div>
        ) : automations.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Scheduled Automations Active</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Automations allow you to scrape new leads automatically every day, week, or month.
            </p>
          </div>
        ) : (
          automations.map((flow) => (
            <div
              key={flow.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {flow.schedule} Cadence
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(flow)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        flow.is_active
                          ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                      }`}
                      title={flow.is_active ? "Pause Automation" : "Resume Automation"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(flow.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{flow.name}</h3>
                
                <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Target:</span>
                    <strong className="text-slate-800">{flow.category}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Location:</span>
                    <strong className="text-slate-800">{flow.location}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Batch Cap:</span>
                    <strong className="text-slate-800">{flow.max_results} Leads / Run</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Last run: {flow.last_run ? new Date(flow.last_run).toLocaleDateString() : "Never"}
                </span>
                <button
                  onClick={() => handleTriggerNow(flow.id)}
                  disabled={triggeringId === flow.id}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{triggeringId === flow.id ? "Triggering..." : "Run Now"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-lg space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Create Scheduled Workflow</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Industry / Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Metro</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recurrence Schedule</label>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Leads / Cycle</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
