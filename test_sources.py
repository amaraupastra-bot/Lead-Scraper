import httpx
import json

def test_nominatim():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    # Let's test searching for real businesses with amenity / office tag
    queries = [
        "real estate agent in New York",
        "dentist in New York",
        "real estate in Austin",
    ]
    for q in queries:
        r = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "addressdetails": 1, "extratags": 1, "limit": 10},
            headers={"User-Agent": "LeadScraperTool/2.0 (leadtool@business.com)"},
            timeout=10.0
        )
        print(f"Query: {q} -> Status: {r.status_code}")
        items = r.json()
        print(f"Results: {len(items)}")
        for it in items:
            name = it.get("name")
            extra = it.get("extratags", {})
            website = extra.get("website") or extra.get("contact:website")
            phone = extra.get("phone") or extra.get("contact:phone")
            print(f"  {name} | Web: {website} | Phone: {phone}")

if __name__ == "__main__":
    test_nominatim()
