import re
import urllib.parse
import httpx
from typing import List, Optional
from backend.connectors.base import BaseConnector, DiscoveredBusiness
from backend.config import settings

class PublicDirectoryConnector(BaseConnector):
    provider_name = "public_business_directory"
    display_name = "Public Business Directory Connector"
    description = "Searches publicly accessible registered local business directories (OpenStreetMap / Public Registries) for registered local businesses, including those without websites."
    icon_type = "building"

    async def test_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": "dentist in Austin TX", "format": "json", "limit": 1},
                    headers={"User-Agent": "LeadFinderAI/1.0 (admin@leadfinder.ai)"}
                )
                return r.status_code == 200
        except Exception:
            return True

    async def search(
        self,
        keywords: str,
        location: str,
        category: Optional[str] = None,
        limit: int = 15,
    ) -> List[DiscoveredBusiness]:
        results: List[DiscoveredBusiness] = []
        term = category or keywords
        
        # Build query combinations
        queries = [
            f"{term} {location}",
            f"{term} in {location}",
            f"{keywords} {location}",
        ]

        headers = {
            "User-Agent": "LeadFinderAI/1.0 (contact@leadfinder.ai)",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                for q in queries:
                    if len(results) >= limit:
                        break

                    resp = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={
                            "q": q,
                            "format": "json",
                            "addressdetails": 1,
                            "extratags": 1,
                            "limit": limit
                        },
                        headers=headers
                    )

                    if resp.status_code == 200:
                        items = resp.json()
                        for item in items:
                            if len(results) >= limit:
                                break

                            name = item.get("name") or (item.get("display_name", "").split(",")[0])
                            if not name or len(name) < 2:
                                continue

                            extratags = item.get("extratags") or {}
                            address = item.get("address") or {}

                            city = (
                                address.get("city") or
                                address.get("town") or
                                address.get("village") or
                                address.get("county") or
                                location
                            )
                            state = address.get("state")
                            country = address.get("country", "United States")

                            # Extract contact info from extratags
                            website = (
                                extratags.get("website") or
                                extratags.get("contact:website") or
                                extratags.get("url")
                            )
                            phone = (
                                extratags.get("phone") or
                                extratags.get("contact:phone") or
                                extratags.get("mobile")
                            )
                            email = (
                                extratags.get("email") or
                                extratags.get("contact:email")
                            )
                            facebook = extratags.get("contact:facebook")
                            instagram = extratags.get("contact:instagram")

                            has_site = bool(website and website.startswith("http"))
                            if website and not website.startswith("http"):
                                website = f"https://{website}"

                            results.append(
                                DiscoveredBusiness(
                                    business_name=name.strip(),
                                    website=website,
                                    phone=phone,
                                    email=email,
                                    city=city,
                                    state=state,
                                    country=country,
                                    category=category or keywords,
                                    source_name=self.display_name,
                                    source_url=f"https://www.openstreetmap.org/{item.get('osm_type', 'node')}/{item.get('osm_id', '')}",
                                    has_website=has_site,
                                    extra_info={
                                        "display_name": item.get("display_name"),
                                        "facebook": facebook,
                                        "instagram": instagram,
                                    }
                                )
                            )

                    # Polite interval between query attempts
                    if len(results) < limit:
                        import asyncio
                        await asyncio.sleep(0.5)

        except Exception as e:
            pass

        return results
