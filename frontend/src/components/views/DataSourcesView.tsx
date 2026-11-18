"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Globe,
  Building,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Zap,
  Sliders
} from "lucide-react";
import { DataSourceItem } from "../../types";
import { api } from "../../lib/api";

export const DataSourcesView: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await api.getDataSources();
      setSources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggle = async (source: DataSourceItem) => {
    try {
      const updated = await api.updateDataSource(source.id, {
        enabled: !source.enabled,
      });
      setSources(sources.map((s) => (s.id === source.id ? updated : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      await api.testDataSource(id);
      await fetchSources();
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "building":
        return Building;
      case "crosshair":
        return Crosshair;
      default:
        return Globe;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Data Source Connectors
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Independent connector architecture. Connects to permitted public business indexes, search discovery engines, and domain crawlers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">
            Loading data connectors...
          </div>
        ) : (
          sources.map((src) => {
            const Icon = getSourceIcon(src.icon_type);
            const isTesting = testingId === src.id;

            return (
              <div
                key={src.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <button
                      onClick={() => handleToggle(src)}
                      className={`p-2 rounded-xl transition-colors ${
                        src.enabled
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                      title={src.enabled ? "Connector Enabled" : "Connector Disabled"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{src.display_name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {src.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Status:</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        src.status === "active" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {src.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Rate Limit:</span>
                    <span className="font-semibold text-slate-800">{src.rate_limit_info}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Last Sync:</span>
                    <span className="text-slate-500">
                      {src.last_sync ? new Date(src.last_sync).toLocaleTimeString() : "Ready"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleTestConnection(src.id)}
                    disabled={isTesting}
                    className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`} />
                    <span>{isTesting ? "Pinging Source..." : "Test Connection"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
