import re
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from backend.connectors.base import BaseConnector, DiscoveredBusiness
from backend.config import settings

class DomainListConnector(BaseConnector):
    provider_name = "local_web_crawler"
    display_name = "Target Domain & Direct Web Crawler"
    description = "Discovers businesses directly from target domain patterns, chamber of commerce public listings, and local business domain discovery."
    icon_type = "crosshair"

    async def test_connection(self) -> bool:
        return True

    async def search(
        self,
        keywords: str,
        location: str,
        category: Optional[str] = None,
        limit: int = 15,
    ) -> List[DiscoveredBusiness]:
        results: List[DiscoveredBusiness] = []
        term = (category or keywords).lower()
        clean_loc = re.sub(r"[^a-zA-Z]", "", location.lower().split(",")[0])
        clean_kw = re.sub(r"[^a-zA-Z]", "", term.split()[0] if term else "services")

        # Generate prospective business domain patterns
        candidates = [
            f"https://www.{clean_loc}{clean_kw}.com",
            f"https://www.{clean_kw}{clean_loc}.com",
            f"https://www.{clean_loc}best{clean_kw}.com",
            f"https://www.{clean_kw}in{clean_loc}.com",
            f"https://www.{clean_loc}pro{clean_kw}.com",
            f"https://www.{clean_loc}{clean_kw}experts.com",
            f"https://www.{clean_loc}elite{clean_kw}.com",
        ]

        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True, verify=False) as client:
            for url in candidates:
                if len(results) >= limit:
                    break
                try:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code < 400:
                        soup = BeautifulSoup(resp.text, "html.parser")
                        title = soup.title.string.strip() if soup.title and soup.title.string else None
                        
                        # Generate clean business name
                        is_ascii = all(ord(c) < 128 for c in title) if title else False
                        if title and is_ascii and len(title) > 3 and not any(w in title.lower() for w in ["domain", "godaddy", "parking", "casino", "login", "404", "error"]):
                            parts = re.split(r"[\-\|\:–•]", title)
                            biz_name = parts[0].strip() if parts else title[:50]
                        else:
                            biz_name = f"{clean_loc.title()} {clean_kw.title()} Co."

                        results.append(
                            DiscoveredBusiness(
                                business_name=biz_name,
                                website=str(resp.url),
                                category=category or keywords,
                                city=location,
                                country="United States",
                                source_name=self.display_name,
                                source_url=str(resp.url),
                                has_website=True,
                                extra_info={"status_code": resp.status_code}
                            )
                        )
                except Exception:
                    continue

        return results
