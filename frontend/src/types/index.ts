export type LeadPriority = "High Priority" | "Medium Priority" | "Low Priority";

export type LeadStatus = 
  | "New"
  | "Reviewed"
  | "Contacted"
  | "Interested"
  | "Not Interested"
  | "Converted";

export interface ContactItem {
  id: string;
  lead_id: string;
  contact_type: "email" | "phone" | "facebook" | "instagram" | "linkedin" | "twitter";
  contact_value: string;
  source_url?: string;
  verification_status: "Verified" | "Extracted" | "Pending" | "Unverified";
  created_at: string;
}

export interface WebsiteAuditItem {
  id: string;
  lead_id?: string;
  website_url: string;
  improvement_score: number;
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  mobile_status: string;
  broken_links: number;
  load_time_ms: number;
  has_https: boolean;
  detected_issues: string[];
  recommendations: string[];
  technologies_detected: string[];
  analyzed_at: string;
}

export interface LeadNoteItem {
  id: string;
  lead_id: string;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Lead {
  id: string;
  search_id?: string;
  business_name: string;
  category?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  country: string;
  state?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  website_score: number;
  lead_priority: LeadPriority;
  lead_status: LeadStatus;
  is_favorite: boolean;
  qualification_reasons: string[];
  source_name: string;
  source_url?: string;
  has_website: boolean;
  has_verified_email: boolean;
  created_at: string;
  updated_at: string;
  contacts?: ContactItem[];
  audits?: WebsiteAuditItem[];
  notes?: LeadNoteItem[];
}

export interface SearchJob {
  id: string;
  search_name: string;
  keywords: string;
  location: string;
  country: string;
  category?: string;
  status: "queued" | "running" | "paused" | "completed" | "cancelled" | "failed";
  progress: number;
  total_discovered: number;
  total_processed: number;
  total_qualified: number;
  duplicates_removed: number;
  failed_records: number;
  active_sources: string[];
  filters: Record<string, any>;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface DataSourceItem {
  id: string;
  provider_name: string;
  display_name: string;
  description?: string;
  icon_type: string;
  status: string;
  enabled: boolean;
  rate_limit_info: string;
  total_records_found: number;
  last_sync?: string;
  created_at: string;
}

export interface AutomationItem {
  id: string;
  name: string;
  category: string;
  location: string;
  schedule: "Daily" | "Weekly" | "Monthly" | "Custom";
  max_results: number;
  data_sources: string[];
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

export interface ExportHistoryItem {
  id: string;
  file_name: string;
  format: "xlsx" | "csv";
  row_count: number;
  download_url: string;
  created_at: string;
}

export interface OverviewMetricsData {
  total_leads: number;
  verified_emails: number;
  without_websites: number;
  outdated_websites: number;
  high_priority_leads: number;
  total_searches: number;
  leads_by_priority: Record<string, number>;
  leads_by_status: Record<string, number>;
  leads_by_category: Record<string, number>;
  leads_by_country: Record<string, number>;
  website_quality_distribution: Record<string, number>;
  leads_over_time: Array<{ date: string; leads: number }>;
  recent_leads: Lead[];
  recent_searches: SearchJob[];
}
