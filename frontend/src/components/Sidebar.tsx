"use client";

import React from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  Flame,
  Globe,
  Database,
  History,
  Clock,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  highPriorityCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  highPriorityCount = 0,
}) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "find-leads", label: "Find Leads", icon: Search },
    { id: "all-leads", label: "All Leads", icon: Users },
    { 
      id: "high-priority", 
      label: "High-Priority Leads", 
      icon: Flame, 
      badge: highPriorityCount > 0 ? highPriorityCount : null,
      badgeColor: "bg-rose-500 text-white"
    },
    { id: "analyzer", label: "Website Analyzer", icon: Globe },
    { id: "sources", label: "Data Sources", icon: Database },
    { id: "history", label: "Search History", icon: History },
    { id: "automation", label: "Automation", icon: Clock },
    { id: "export", label: "Export Center", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#090d16] text-slate-300 z-40 transition-all duration-300 flex flex-col border-r border-slate-800 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                LeadFinder <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-400 border border-blue-400/30">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider font-medium uppercase">Agency Prospecting</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {!isCollapsed && "Navigation"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all group ${
                isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5 space-x-3"
              } ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || "bg-blue-500 text-white"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Account & Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              AG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Agency Workspace</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-medium">Engine Active</span>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title="Engine Active" />
          </div>
        )}
      </div>
    </aside>
  );
};
