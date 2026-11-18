import {
  Lead,
  SearchJob,
  DataSourceItem,
  AutomationItem,
  ExportHistoryItem,
  OverviewMetricsData,
  WebsiteAuditItem
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; app: string }>("/api/health"),

  // Overview
  getOverviewMetrics: () => request<OverviewMetricsData>("/api/overview/metrics"),

  // Search
  createSearch: (data: {
    keywords: string;
    location: string;
    country?: string;
    category?: string;
    data_sources?: string[];
    max_results?: number;
    has_website_filter?: string;
    contact_filters?: string[];
  }) => request<SearchJob>("/api/search", { method: "POST", body: JSON.stringify(data) }),

  getSearchHistory: () => request<SearchJob[]>("/api/search/history"),
  getSearchById: (id: string) => request<SearchJob>(`/api/search/${id}`),
  pauseSearch: (id: string) => request<{ status: string }>(`/api/search/${id}/pause`, { method: "POST" }),
  resumeSearch: (id: string) => request<{ status: string }>(`/api/search/${id}/resume`, { method: "POST" }),
  cancelSearch: (id: string) => request<{ status: string }>(`/api/search/${id}/cancel`, { method: "POST" }),

  // Leads
  getLeads: (params?: {
    search?: string;
    priority?: string;
    status?: string;
    category?: string;
    country?: string;
    has_website?: boolean;
    is_favorite?: boolean;
    min_score?: number;
    max_score?: number;
    sort_by?: string;
    sort_dir?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    return request<Lead[]>(`/api/leads?${query.toString()}`);
  },

  getLeadById: (id: string) => request<Lead>(`/api/leads/${id}`),
  updateLead: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLead: (id: string) =>
    request<{ status: string }>(`/api/leads/${id}`, { method: "DELETE" }),
  addLeadNote: (id: string, note: string, author_name?: string) =>
    request<any>(`/api/leads/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note, author_name }),
    }),
  reanalyzeLead: (id: string) =>
    request<WebsiteAuditItem>(`/api/leads/${id}/analyze`, { method: "POST" }),

  // Website Analyzer
  runLiveAudit: (url: string) =>
    request<any>("/api/analyzer/run", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  saveAuditLead: (data: { audit_data: any; business_name: string; category?: string }) =>
    request<{ status: string; lead_id: string }>("/api/analyzer/save-lead", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Data Sources
  getDataSources: () => request<DataSourceItem[]>("/api/sources"),
  updateDataSource: (id: string, data: { enabled?: boolean; configuration_reference?: any }) =>
    request<DataSourceItem>(`/api/sources/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testDataSource: (id: string) =>
    request<{ status: string; connected: boolean }>(`/api/sources/${id}/test`, {
      method: "POST",
    }),

  // Automation
  getAutomations: () => request<AutomationItem[]>("/api/automation"),
  createAutomation: (data: Partial<AutomationItem>) =>
    request<AutomationItem>("/api/automation", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAutomation: (id: string, data: Partial<AutomationItem>) =>
    request<AutomationItem>(`/api/automation/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  triggerAutomation: (id: string) =>
    request<{ status: string; search_id: string }>(`/api/automation/${id}/trigger`, {
      method: "POST",
    }),
  deleteAutomation: (id: string) =>
    request<{ status: string }>(`/api/automation/${id}`, { method: "DELETE" }),

  // Export
  createExport: (data: {
    format: "xlsx" | "csv";
    lead_ids?: string[];
    lead_priority?: string;
    lead_status?: string;
    category?: string;
    country?: string;
    only_without_websites?: boolean;
    only_outdated_websites?: boolean;
  }) =>
    request<{
      id: string;
      file_name: string;
      format: string;
      row_count: number;
      download_url: string;
      created_at: string;
    }>("/api/export", { method: "POST", body: JSON.stringify(data) }),
  getExportHistory: () => request<ExportHistoryItem[]>("/api/export/history"),
  getDownloadUrl: (filename: string) => `${API_BASE}/api/export/download/${filename}`,
};
