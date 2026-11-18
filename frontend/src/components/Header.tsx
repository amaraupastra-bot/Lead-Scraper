"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  User,
  Sliders,
  LogOut
} from "lucide-react";

interface HeaderProps {
  onOpenNewSearch: () => void;
  onGlobalSearch: (term: string) => void;
  isBackendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewSearch,
  onGlobalSearch,
  isBackendHealthy,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Real Discovery Engine Active",
      message: "Open web & public business connectors ready for multi-source scraping.",
      time: "Just now",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      id: 2,
      title: "Target Website Quality Analyzer Ready",
      message: "Analyzes load speed, HTTPS, viewport, mobile responsiveness, and outdated designs.",
      time: "1m ago",
      icon: Sparkles,
      color: "text-blue-500",
    },
    {
      id: 3,
      title: "Autonomous Deduplication",
      message: "Duplicate businesses and repeated websites are automatically filtered.",
      time: "5m ago",
      icon: AlertCircle,
      color: "text-amber-500",
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onGlobalSearch(searchTerm.trim());
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-xs">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-80 sm:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search leads, domains, categories (Ctrl+K)..."
          className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          ⌘K
        </kbd>
      </form>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Backend Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-slate-600 font-medium text-[11px]">
            {isBackendHealthy ? "Backend Engine Online" : "Connecting Backend..."}
          </span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">System Notifications</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* New Search Action */}
        <button
          onClick={onOpenNewSearch}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>New Lead Search</span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Agency Admin</p>
                <p className="text-[11px] text-slate-500">admin@leadfinder.ai</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Agency Tier • Unlimited
                </span>
              </div>
              <div className="py-1 text-xs text-slate-700">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile Overview</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Agency Branding</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
