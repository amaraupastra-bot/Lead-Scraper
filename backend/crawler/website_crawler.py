import time
import socket
import ipaddress
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional, List
from backend.config import settings
from backend.crawler.contact_extractor import ContactExtractor
from backend.crawler.quality_analyzer import QualityAnalyzer
from backend.crawler.qualification import LeadQualifier

class WebsiteCrawler:
    @staticmethod
    def is_safe_url(url: str) -> bool:
        """SSRF protection: Ensure URL doesn't point to private or internal addresses."""
        try:
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return False
            
            hostname = parsed.hostname
            if not hostname:
                return False
            
            # Disallow localhost or internal domains
            if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
                return False

            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
                return False
            
            return True
        except Exception:
            return False

    @staticmethod
    async def crawl_and_audit(url: str) -> Dict[str, Any]:
        """
        Crawls the website, inspects homepage and contact links, extracts 
        contacts, calculates improvement scores, and qualifies the lead.
        """
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"

        if not WebsiteCrawler.is_safe_url(url):
            return {
                "success": False,
                "error": "URL blocked due to security or private network restrictions.",
                "url": url,
            }

        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        start_time = time.time()
        load_time_ms = 0
        html = ""
        status_code = 0
        final_url = url
        is_https = url.startswith("https://")

        try:
            async with httpx.AsyncClient(
                timeout=settings.CRAWL_TIMEOUT_SECONDS,
                follow_redirects=True,
                verify=False  # Do not crash on self-signed certs so we can audit non-https/broken ssl!
            ) as client:
                try:
                    resp = await client.get(url, headers=headers)
                    load_time_ms = int((time.time() - start_time) * 1000)
                    status_code = resp.status_code
                    html = resp.text
                    final_url = str(resp.url)
                    is_https = final_url.startswith("https://")
                except Exception as ex:
                    # If https fails, try http fallback
                    if url.startswith("https://"):
                        fallback_url = url.replace("https://", "http://")
                        start_time = time.time()
                        resp = await client.get(fallback_url, headers=headers)
                        load_time_ms = int((time.time() - start_time) * 1000)
                        status_code = resp.status_code
                        html = resp.text
                        final_url = str(resp.url)
                        is_https = False
                    else:
                        raise ex

                # 1. Contact Extraction from Homepage
                contact_data = ContactExtractor.extract_from_html(html, final_url, final_url)
                
                # 2. Check for subpages (/contact, /about) if email or phone missing
                if not contact_data["primary_email"] or not contact_data["primary_phone"]:
                    sub_links = WebsiteCrawler._find_subpage_links(html, final_url)
                    for sub_url in sub_links[:2]:
                        try:
                            sub_resp = await client.get(sub_url, headers=headers)
                            if sub_resp.status_code == 200:
                                sub_contacts = ContactExtractor.extract_from_html(sub_resp.text, final_url, sub_url)
                                if not contact_data["primary_email"] and sub_contacts["primary_email"]:
                                    contact_data["primary_email"] = sub_contacts["primary_email"]
                                if not contact_data["primary_phone"] and sub_contacts["primary_phone"]:
                                    contact_data["primary_phone"] = sub_contacts["primary_phone"]
                                for soc, val in sub_contacts["socials"].items():
                                    if not contact_data["socials"][soc] and val:
                                        contact_data["socials"][soc] = val
                                contact_data["all_contacts"].extend(sub_contacts["all_contacts"])
                        except Exception:
                            continue

                # 3. Quality Analysis
                audit_result = QualityAnalyzer.analyze_site(
                    html=html,
                    url=final_url,
                    load_time_ms=load_time_ms,
                    status_code=status_code,
                    is_https=is_https
                )

                # 4. Lead Qualification
                has_email = bool(contact_data["primary_email"])
                has_phone = bool(contact_data["primary_phone"])
                has_socials = any(bool(v) for v in contact_data["socials"].values())
                
                priority, reasons = LeadQualifier.qualify_lead(
                    has_website=True,
                    website_score=audit_result["improvement_score"],
                    has_email=has_email,
                    has_phone=has_phone,
                    has_socials=has_socials,
                    detected_issues=audit_result["detected_issues"]
                )

                return {
                    "success": True,
                    "url": final_url,
                    "status_code": status_code,
                    "load_time_ms": load_time_ms,
                    "is_https": is_https,
                    "contact_data": contact_data,
                    "audit": audit_result,
                    "lead_priority": priority,
                    "qualification_reasons": reasons,
                }

        except Exception as e:
            # Website couldn't be reached or connection timed out
            detected_issues = [f"Website unreachable or timed out: {str(e)[:100]}"]
            audit_result = {
                "improvement_score": 85,
                "performance_score": 15,
                "accessibility_score": 20,
                "seo_score": 20,
                "mobile_status": "Offline / Error",
                "broken_links": 1,
                "load_time_ms": load_time_ms or 10000,
                "has_https": False,
                "detected_issues": detected_issues,
                "recommendations": ["Rebuild website on reliable, modern cloud hosting."],
                "technologies_detected": ["Unknown"]
            }
            return {
                "success": False,
                "url": url,
                "error": str(e),
                "contact_data": {
                    "primary_email": None,
                    "primary_phone": None,
                    "socials": {"facebook": None, "instagram": None, "linkedin": None, "twitter": None},
                    "all_contacts": []
                },
                "audit": audit_result,
                "lead_priority": "High Priority",
                "qualification_reasons": ["Website is offline or non-functional - immediate redevelopment opportunity."],
            }

    @staticmethod
    def _find_subpage_links(html: str, base_url: str) -> List[str]:
        soup = BeautifulSoup(html, "html.parser")
        sub_links = []
        target_words = ["contact", "about", "reach", "team", "support"]

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            text = a_tag.get_text(strip=True).lower()
            joined = urllib.parse.urljoin(base_url, href)
            
            # Make sure it's on the same domain
            if urllib.parse.urlparse(joined).netloc == urllib.parse.urlparse(base_url).netloc:
                if any(w in href.lower() or w in text for w in target_words):
                    if joined not in sub_links and joined != base_url:
                        sub_links.append(joined)
                        if len(sub_links) >= 3:
                            break
        return sub_links
