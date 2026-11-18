import httpx
import json

def test_overpass():
    # Search for real businesses in any city with real websites
    # Overpass QL query:
    query = """
    [out:json][timeout:25];
    (
      node["office"~"estate_agent|lawyer|company|insurance|dentist|physician|architect"](40.68,-74.05,40.85,-73.90);
      node["amenity"~"dentist|clinic|doctors|restaurant"](40.68,-74.05,40.85,-73.90);
    );
    out 20;
    """
    url = "https://overpass-api.de/api/interpreter"
    r = httpx.post(url, data={"data": query}, timeout=25.0)
    print("Overpass Status:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        elements = data.get("elements", [])
        print("Total elements:", len(elements))
        for el in elements[:10]:
            tags = el.get("tags", {})
            name = tags.get("name")
            website = tags.get("website") or tags.get("contact:website")
            phone = tags.get("phone") or tags.get("contact:phone")
            email = tags.get("email") or tags.get("contact:email")
            addr = f"{tags.get('addr:housenumber', '')} {tags.get('addr:street', '')}".strip()
            print(f"Name: {name} | Web: {website} | Phone: {phone} | Email: {email} | Addr: {addr}")

if __name__ == "__main__":
    test_overpass()
