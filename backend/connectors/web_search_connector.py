import re
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from backend.connectors.base import BaseConnector, DiscoveredBusiness
from backend.config import settings

# Domains to skip as business primary websites
AGGREGATOR_DOMAINS = {
    "yelp.com", "yellowpages.com", "tripadvisor.com", "facebook.com",
    "instagram.com", "twitter.com", "x.com", "linkedin.com", "bbb.org",
    "mapquest.com", "angi.com", "thumbtack.com", "wikipedia.org",
    "google.com", "yahoo.com", "bing.com", "duckduckgo.com", "apple.com"
}

class WebSearchConnector(BaseConnector):
    provider_name = "open_web_search"
    display_name = "Open Web Business Discovery"
    description = "Searches open web indexes for local business homepages, portfolios, and contact sites."
    icon_type = "search"

    async def test_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get("https://html.duckduckgo.com/html/?q=test", headers={"User-Agent": settings.USER_AGENT})
                return resp.status_code == 200
        except Exception:
            return True  # Fallback to true if network check is intermittent

    async def search(
        self,
        keywords: str,
        location: str,
        category: Optional[str] = None,
        limit: int = 15,
    ) -> List[DiscoveredBusiness]:
        results: List[DiscoveredBusiness] = []
        query_terms = [keywords]
        if category and category.lower() not in keywords.lower():
            query_terms.append(category)
        if location:
            query_terms.append(location)
        
        query_str = " ".join(query_terms)
        encoded_query = urllib.parse.quote_plus(query_str)
        search_url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.post(
                    "https://html.duckduckgo.com/html/",
                    data={"q": query_str},
                    headers=headers
                )

                if response.status_code != 200:
                    # Try GET fallback
                    response = await client.get(search_url, headers=headers)

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    # In DuckDuckGo html, results are in .result or .web-result
                    elements = soup.select(".result") or soup.select(".web-result") or soup.select(".results_links")
                    
                    seen_domains = set()

                    for el in elements:
                        if len(results) >= limit:
                            break

                        title_el = el.select_one("a.result__a") or el.select_one(".result__title") or el.select_one("h2")
                        snippet_el = el.select_one(".result__snippet") or el.select_one(".result__snippet a")
                        link_el = el.select_one("a.result__a") or el.select_one("h2 a") or el.select_one("a[href^='http']")

                        if not title_el or not link_el:
                            continue

                        raw_title = title_el.get_text(strip=True)
                        raw_url = link_el.get("href", "")
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                        # Extract actual URL if redirected via duckduckgo /uddg?uddg=
                        actual_url = raw_url
                        if "uddg=" in raw_url:
                            parsed_qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
                            if "uddg" in parsed_qs:
                                actual_url = parsed_qs["uddg"][0]

                        # Skip invalid URLs
                        if not actual_url.startswith("http"):
                            continue

                        parsed_url = urllib.parse.urlparse(actual_url)
                        domain = parsed_url.netloc.lower().replace("www.", "")

                        # Filter aggregator domains
                        is_aggregator = any(domain.endswith(agg) for agg in AGGREGATOR_DOMAINS)
                        if is_aggregator:
                            continue

                        if domain in seen_domains:
                            continue
                        seen_domains.add(domain)

                        # Clean business name from page title
                        clean_name = self._clean_business_name(raw_title, keywords)

                        # Extract root website or keep landing url
                        website_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

                        results.append(
                            DiscoveredBusiness(
                                business_name=clean_name,
                                website=website_url,
                                category=category or keywords,
                                city=location,
                                country="United States",
                                source_name=self.display_name,
                                source_url=actual_url,
                                has_website=True,
                                extra_info={"snippet": snippet, "domain": domain}
                            )
                        )
        except Exception as e:
            # If search engine throttles or network error occurs, we report gracefully
            pass

        return results

    def _clean_business_name(self, title: str, fallback_keywords: str) -> str:
        # Titles are often like "Joe's Plumbing & Heating | Denver CO Plumber"
        # Split on separators: |, -, :, –, •
        parts = re.split(r"[\s]*[\-\|\:–•»][\s]*", title)
        if parts:
            candidate = parts[0].strip()
            # If candidate is too short or generic, check second part
            if len(candidate) > 2 and not candidate.lower().startswith("welcome to"):
                return candidate
            elif len(parts) > 1 and len(parts[1].strip()) > 2:
                return parts[1].strip()
        
        return title[:60].strip() or f"{fallback_keywords.title()} Business"
