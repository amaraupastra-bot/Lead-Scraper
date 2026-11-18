from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

@dataclass
class DiscoveredBusiness:
    business_name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "United States"
    category: Optional[str] = None
    industry: Optional[str] = None
    source_name: str = "Discovery Engine"
    source_url: Optional[str] = None
    has_website: bool = True
    extra_info: Dict[str, Any] = field(default_factory=dict)

class BaseConnector(ABC):
    provider_name: str
    display_name: str
    description: str
    icon_type: str = "globe"

    @abstractmethod
    async def search(
        self,
        keywords: str,
        location: str,
        category: Optional[str] = None,
        limit: int = 15,
    ) -> List[DiscoveredBusiness]:
        """Perform business discovery and return a list of standard DiscoveredBusiness objects."""
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """Verify provider availability."""
        pass
