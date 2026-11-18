from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# Contact
class ContactBase(BaseModel):
    contact_type: str
    contact_value: str
    source_url: Optional[str] = None
    verification_status: str = "Extracted"

class ContactResponse(ContactBase):
    id: str
    lead_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Lead Note
class LeadNoteCreate(BaseModel):
    note: str
    author_name: Optional[str] = "Agency Specialist"

class LeadNoteResponse(BaseModel):
    id: str
    lead_id: str
    author_name: str
    note: str
    created_at: datetime

    class Config:
        from_attributes = True

# Website Audit
class WebsiteAuditResponse(BaseModel):
    id: str
    lead_id: Optional[str] = None
    website_url: str
    improvement_score: int
    performance_score: int
    accessibility_score: int
    seo_score: int
    mobile_status: str
    broken_links: int
    load_time_ms: int
    has_https: bool
    detected_issues: List[str] = []
    recommendations: List[str] = []
    technologies_detected: List[str] = []
    analyzed_at: datetime

    class Config:
        from_attributes = True

class LiveAuditRequest(BaseModel):
    url: str

# Lead
class LeadBase(BaseModel):
    business_name: str
    category: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = "United States"
    state: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website_score: int = 0
    lead_priority: str = "Medium"
    lead_status: str = "New"
    is_favorite: bool = False
    source_name: str = "Open Web Discovery"
    source_url: Optional[str] = None
    has_website: bool = True
    has_verified_email: bool = False

class LeadCreate(LeadBase):
    qualification_reasons: List[str] = []

class LeadUpdate(BaseModel):
    business_name: Optional[str] = None
    category: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    lead_priority: Optional[str] = None
    lead_status: Optional[str] = None
    is_favorite: Optional[bool] = None

class LeadResponse(LeadBase):
    id: str
    search_id: Optional[str] = None
    qualification_reasons: List[str] = []
    created_at: datetime
    updated_at: datetime
    contacts: List[ContactResponse] = []
    audits: List[WebsiteAuditResponse] = []
    notes: List[LeadNoteResponse] = []

    class Config:
        from_attributes = True

# Search
class SearchCreate(BaseModel):
    keywords: str
    location: str
    country: Optional[str] = "United States"
    category: Optional[str] = None
    data_sources: Optional[List[str]] = Field(default_factory=lambda: ["open_web_search", "public_business_directory", "local_web_crawler"])
    max_results: int = 15
    has_website_filter: Optional[str] = "all"  # all, yes, no, outdated
    contact_filters: Optional[List[str]] = []  # email, phone, facebook, instagram
    min_website_score: Optional[int] = 0
    max_website_score: Optional[int] = 100

class SearchResponse(BaseModel):
    id: str
    search_name: str
    keywords: str
    location: str
    country: str
    category: Optional[str] = None
    status: str
    progress: int
    total_discovered: int
    total_processed: int
    total_qualified: int
    duplicates_removed: int
    failed_records: int
    active_sources: List[str] = []
    filters: Dict[str, Any] = {}
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Data Source
class DataSourceResponse(BaseModel):
    id: str
    provider_name: str
    display_name: str
    description: Optional[str] = None
    icon_type: str
    status: str
    enabled: bool
    rate_limit_info: str
    total_records_found: int
    last_sync: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DataSourceUpdate(BaseModel):
    enabled: Optional[bool] = None
    configuration_reference: Optional[Dict[str, Any]] = None

# Automation
class AutomationCreate(BaseModel):
    name: str
    category: str
    location: str
    schedule: str = "Weekly"  # Daily, Weekly, Monthly
    max_results: int = 25
    data_sources: List[str] = ["open_web_search", "public_business_directory"]
    is_active: bool = True

class AutomationResponse(BaseModel):
    id: str
    name: str
    category: str
    location: str
    schedule: str
    max_results: int
    data_sources: List[str] = []
    is_active: bool
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Export
class ExportRequest(BaseModel):
    format: str = "xlsx"  # xlsx or csv
    lead_ids: Optional[List[str]] = None
    lead_priority: Optional[str] = None
    lead_status: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    only_without_websites: bool = False
    only_outdated_websites: bool = False

class ExportResponse(BaseModel):
    id: str
    file_name: str
    format: str
    row_count: int
    download_url: str
    created_at: datetime

# Overview Metrics
class MetricCard(BaseModel):
    label: str
    value: int
    subtext: str
    change: Optional[str] = None

class OverviewMetrics(BaseModel):
    total_leads: int
    verified_emails: int
    without_websites: int
    outdated_websites: int
    high_priority_leads: int
    total_searches: int
    leads_by_priority: Dict[str, int]
    leads_by_status: Dict[str, int]
    leads_by_category: Dict[str, int]
    leads_by_country: Dict[str, int]
    website_quality_distribution: Dict[str, int]
    leads_over_time: List[Dict[str, Any]]
