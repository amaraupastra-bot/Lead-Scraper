import httpx

def test_wikidata(niche="real estate", city="New York"):
    query = f"""
    SELECT DISTINCT ?item ?itemLabel ?website ?phone ?street WHERE {{
      ?item wdt:P31/wdt:P279* wd:Q4830453 ; # business/enterprise
            wdt:P856 ?website . # official website
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 10
    """
    url = "https://query.wikidata.org/sparql"
    headers = {"User-Agent": "LeadFinderApp/1.0 (contact@leadfinder.io)", "Accept": "application/json"}
    try:
        r = httpx.get(url, params={"query": query, "format": "json"}, headers=headers, timeout=10.0)
        print("Wikidata status:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            bindings = data.get("results", {}).get("bindings", [])
            print("Wikidata items:", len(bindings))
            for b in bindings[:5]:
                print(b.get("itemLabel", {}).get("value"), "->", b.get("website", {}).get("value"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_wikidata()
