import httpx
import re
from bs4 import BeautifulSoup

def test_city_search(niche, city, state, country):
    print(f"\n=== Searching: {niche} in {city}, {state}, {country} ===")
    query = f"{niche} clinic in {city} {state} {country} phone address directory"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    }
    r = httpx.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers, timeout=8.0)
    print("Status:", r.status_code)
    soup = BeautifulSoup(r.text, "html.parser")
    results = []
    for res in soup.select(".result"):
        t_el = res.select_one(".result__title a")
        u_el = res.select_one(".result__url")
        s_el = res.select_one(".result__snippet")
        
        if not t_el:
            continue
        title = t_el.get_text(strip=True)
        url = u_el.get_text(strip=True) if u_el else ""
        snippet = s_el.get_text(strip=True) if s_el else ""
        
        print("T:", title)
        print("U:", url)
        print("S:", snippet[:100])
        print("---")

test_city_search("dental", "Okara", "Punjab", "Pakistan")
