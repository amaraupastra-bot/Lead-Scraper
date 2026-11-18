import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, default="Agency Admin")
    email = Column(String(255), nullable=False, default="admin@leadfinder.ai")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon_type = Column(String(50), default="globe")
    status = Column(String(50), default="active")  # active, rate_limited, disabled, error
    enabled = Column(Boolean, default=True)
    configuration_reference = Column(JSON, default=dict)
    rate_limit_info = Column(String(100), default="30 req / min")
    total_records_found = Column(Integer, default=0)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class Search(Base):
    __tablename__ = "searches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    search_name = Column(String(200), nullable=False)
    keywords = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    country = Column(String(100), default="United States")
    category = Column(String(100), nullable=True)
    status = Column(String(50), default="queued")  # queued, running, paused, completed, cancelled, failed
    progress = Column(Integer, default=0)  # 0 to 100 percentage
    total_discovered = Column(Integer, default=0)
    total_processed = Column(Integer, default=0)
    total_qualified = Column(Integer, default=0)
    duplicates_removed = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    active_sources = Column(JSON, default=list)
    filters = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    scraping_jobs = relationship("ScrapingJob", back_populates="search", cascade="all, delete-orphan")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    search_id = Column(String(36), ForeignKey("searches.id", ondelete="SET NULL"), nullable=True)
    business_name = Column(String(255), nullable=False, index=True)
    category = Column(String(150), nullable=True, index=True)
    industry = Column(String(150), nullable=True)
    website = Column(String(500), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    secondary_email = Column(String(255), nullable=True)
    ghl_tag = Column(String(255), default="Scraped Lead, VIP")
    in_ghl = Column(Boolean, default=False)
    phone = Column(String(100), nullable=True)
    country = Column(String(100), default="United States")
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    postal_code = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    
    facebook = Column(String(500), nullable=True)
    instagram = Column(String(500), nullable=True)
    linkedin = Column(String(500), nullable=True)
    twitter = Column(String(500), nullable=True)
    
    website_score = Column(Integer, default=0)  # 0 to 100 improvement opportunity score
    lead_priority = Column(String(50), default="Medium", index=True)  # High Priority, Medium Priority, Low Priority
    lead_status = Column(String(50), default="New", index=True)  # New, Reviewed, Contacted, Interested, Not Interested, Converted
    is_favorite = Column(Boolean, default=False)
    
    qualification_reasons = Column(JSON, default=list)
    source_name = Column(String(100), default="Open Web Discovery")
    source_url = Column(String(1000), nullable=True)
    has_website = Column(Boolean, default=True)
    has_verified_email = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    contacts = relationship("Contact", back_populates="lead", cascade="all, delete-orphan")
    audits = relationship("WebsiteAudit", back_populates="lead", cascade="all, delete-orphan")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    contact_type = Column(String(50), nullable=False)  # email, phone, facebook, instagram, linkedin, twitter
    contact_value = Column(String(500), nullable=False)
    source_url = Column(String(1000), nullable=True)
    verification_status = Column(String(50), default="Extracted")  # Verified, Extracted, Pending, Unverified
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    lead = relationship("Lead", back_populates="contacts")

class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    website_url = Column(String(500), nullable=False)
    
    improvement_score = Column(Integer, default=0)  # 0 - 100 (higher = more agency opportunity)
    performance_score = Column(Integer, default=0)
    accessibility_score = Column(Integer, default=0)
    seo_score = Column(Integer, default=0)
    mobile_status = Column(String(50), default="Unknown")  # Responsive, Non-Responsive, Partially Responsive
    broken_links = Column(Integer, default=0)
    load_time_ms = Column(Integer, default=0)
    has_https = Column(Boolean, default=False)
    
    detected_issues = Column(JSON, default=list)  # list of issue descriptions
    recommendations = Column(JSON, default=list)
    technologies_detected = Column(JSON, default=list)
    
    analyzed_at = Column(DateTime(timezone=True), default=get_utc_now)

    lead = relationship("Lead", back_populates="audits")

class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    author_name = Column(String(100), default="Agent")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    lead = relationship("Lead", back_populates="notes")

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    search_id = Column(String(36), ForeignKey("searches.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(100), nullable=False)
    job_status = Column(String(50), default="queued")  # queued, running, completed, failed
    progress = Column(Integer, default=0)
    total_discovered = Column(Integer, default=0)
    total_processed = Column(Integer, default=0)
    errors = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    search = relationship("Search", back_populates="scraping_jobs")

class ExportRecord(Base):
    __tablename__ = "exports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    format = Column(String(20), nullable=False)  # csv, xlsx
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0)
    filters = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class AutomationWorkflow(Base):
    __tablename__ = "automations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    schedule = Column(String(50), default="Weekly")  # Daily, Weekly, Monthly, Custom
    max_results = Column(Integer, default=25)
    data_sources = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime(timezone=True), nullable=True)
    next_run = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
