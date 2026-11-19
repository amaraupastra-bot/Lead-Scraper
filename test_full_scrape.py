import httpx
import re
from bs4 import BeautifulSoup
from test_parser import parse_lead_from_search

def full_test_scrape(niche, city, state, country, count=6):
    query = f"{niche} clinic in {city} {state} {country} phone address directory"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    }
    r = httpx.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers, timeout=8.0)
    soup = BeautifulSoup(r.text, "html.parser")
    
    leads = []
    seen_names = set()

    for res in soup.select(".result"):
        t_el = res.select_one(".result__title a")
        u_el = res.select_one(".result__url")
        s_el = res.select_one(".result__snippet")
        if not t_el:
            continue
        title = t_el.get_text(strip=True)
        url = u_el.get_text(strip=True) if u_el else ""
        snippet = s_el.get_text(strip=True) if s_el else ""
        
        # Filter out purely generic aggregate search pages that have no business name
        if title.lower().startswith("dentists in okara") or title.lower().startswith("dental clinic in okara"):
            # Check if snippet has listings inside it
            # e.g. "Listings include Delhi Dental Clinic Okara, Liaqat Medical & Dental Complex..."
            matches = re.findall(r"([A-Za-z0-9\s&]+(?:Dental|Clinic|Hospital|Complex))\b", snippet)
            for m in matches:
                clean_m = m.replace("include ", "").replace("Listings ", "").strip()
                if len(clean_m) > 4 and clean_m.lower() not in seen_names and "okara" not in clean_m.lower():
                    seen_names.add(clean_m.lower())
                    leads.append(parse_lead_from_search(clean_m, snippet, url, niche, city, state, country))
                    if len(leads) >= count:
                        break
            continue

        lead = parse_lead_from_search(title, snippet, url, niche, city, state, country)
        b_name_lower = lead["business_name"].lower()
        if b_name_lower not in seen_names and len(lead["business_name"]) > 3:
            seen_names.add(b_name_lower)
            leads.append(lead)

        if len(leads) >= count:
            break

    print(f"\nDiscovered {len(leads)} leads for {city}:")
    for i, l in enumerate(leads, 1):
        print(f"#{i}: {l['business_name']} | City: {l['city']} | Addr: {l['address']} | Phone: {l['phone']}")

full_test_scrape("dental", "Okara", "Punjab", "Pakistan", count=6)
