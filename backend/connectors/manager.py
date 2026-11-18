import asyncio
import re
from typing import List, Dict, Tuple, Optional
from backend.connectors.base import BaseConnector, DiscoveredBusiness
from backend.connectors.web_search_connector import WebSearchConnector
from backend.connectors.public_directory_connector import PublicDirectoryConnector
from backend.connectors.domain_list_connector import DomainListConnector

class ConnectorManager:
    def __init__(self):
        self.connectors: Dict[str, BaseConnector] = {
            "open_web_search": WebSearchConnector(),
            "public_business_directory": PublicDirectoryConnector(),
            "local_web_crawler": DomainListConnector(),
        }

    def get_connector(self, name: str) -> Optional[BaseConnector]:
        return self.connectors.get(name)

    def list_connectors(self) -> List[Dict[str, Any]]:
        return [
            {
                "provider_name": conn.provider_name,
                "display_name": conn.display_name,
                "description": conn.description,
                "icon_type": conn.icon_type,
            }
            for conn in self.connectors.values()
        ]

    async def execute_discovery(
        self,
        keywords: str,
        location: str,
        category: Optional[str] = None,
        enabled_sources: Optional[List[str]] = None,
        limit_per_source: int = 15,
    ) -> Tuple[List[DiscoveredBusiness], int, int]:
        """
        Executes discovery across all enabled connectors.
        Returns (unique_businesses, total_discovered_count, duplicates_count)
        """
        if not enabled_sources:
            enabled_sources = list(self.connectors.keys())

        tasks = []
        for src_name in enabled_sources:
            connector = self.connectors.get(src_name)
            if connector:
                tasks.append(
                    connector.search(
                        keywords=keywords,
                        location=location,
                        category=category,
                        limit=limit_per_source
                    )
                )

        if not tasks:
            return [], 0, 0

        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        all_businesses: List[DiscoveredBusiness] = []
        for res in raw_results:
            if isinstance(res, list):
                all_businesses.extend(res)

        total_discovered = len(all_businesses)
        unique_businesses: List[DiscoveredBusiness] = []
        seen_identifiers = set()

        for b in all_businesses:
            # Identifier based on normalized name + website/phone
            norm_name = re.sub(r"[^a-zA-Z0-9]", "", b.business_name.lower())
            norm_site = re.sub(r"^https?://(www\.)?", "", (b.website or "").lower()).strip("/")
            
            identifier = f"{norm_name}:{norm_site}" if norm_site else f"{norm_name}:{b.phone or ''}"
            
            if identifier not in seen_identifiers:
                seen_identifiers.add(identifier)
                unique_businesses.append(b)

        duplicates_count = total_discovered - len(unique_businesses)
        return unique_businesses, total_discovered, duplicates_count

connector_manager = ConnectorManager()
