import httpx
import json

overpass_url = "https://overpass-api.de/api/interpreter"
query = """
[out:json][timeout:15];
area["name:en"="Pakistan"]->.country;
area["name"="Lahore"](area.country)->.city;
(
  node["amenity"="dentist"](area.city);
  node["healthcare"="dentist"](area.city);
  node["amenity"="clinic"](area.city);
);
out center 20;
"""

try:
    r = httpx.post(overpass_url, data={"data": query}, timeout=15.0)
    data = r.json()
    elements = data.get("elements", [])
    print("Found elements in Lahore:", len(elements))
    for el in elements[:10]:
        tags = el.get("tags", {})
        if tags.get("name"):
            print("Name:", tags.get("name"))
            print("  Street:", tags.get("addr:street") or tags.get("addr:full"))
            print("  Phone:", tags.get("phone") or tags.get("contact:phone"))
            print("  Website:", tags.get("website") or tags.get("contact:website"))
            print("  Lat/Lon:", el.get("lat"), el.get("lon"))
            print("---")
except Exception as e:
    print("Error:", e)
