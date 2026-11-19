import httpx

def test_nominatim(q):
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "LeadScraperBot/2.0 (leadfinder@amara.com)"}
    params = {"q": q, "format": "json", "addressdetails": 1, "limit": 10}
    r = httpx.get(url, params=params, headers=headers, timeout=10.0)
    print("Status:", r.status_code)
    data = r.json()
    print(f"Results for '{q}': {len(data)}")
    for item in data[:5]:
        print("Display:", item.get("display_name"))
        print("Name:", item.get("name"))
        print("Type:", item.get("type"), "| Class:", item.get("class"))
        print("Address:", item.get("address"))
        print("---")

test_nominatim("dental clinic in Okara")
test_nominatim("dental clinic in Lahore")
