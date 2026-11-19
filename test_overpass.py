import httpx
import json

def test_city(city_name="Lahore"):
    # Overpass QL area query
    query = f"""
    [out:json][timeout:25];
    area["name"="{city_name}"]->.searchArea;
    (
      node["office"](area.searchArea);
      node["amenity"](area.searchArea);
      node["shop"](area.searchArea);
    );
    out 25;
    """
    url = "https://overpass-api.de/api/interpreter"
    headers = {
        "User-Agent": "LeadFinderPlatform/1.0 (contact@leadfinder.ai)"
    }
    try:
        r = httpx.post(url, data={"data": query}, headers=headers, timeout=25.0)
        print(f"Overpass Status for {city_name}:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            elements = data.get("elements", [])
            print(f"Total elements in {city_name}:", len(elements))
            for el in elements[:10]:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("name:en")
                website = tags.get("website") or tags.get("contact:website")
                phone = tags.get("phone") or tags.get("contact:phone")
                addr = f"{tags.get('addr:street', '')} {tags.get('addr:city', '')}".strip()
                print(f"  * {name} | Web: {website} | Phone: {phone} | Addr: {addr}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_city("Lahore")
