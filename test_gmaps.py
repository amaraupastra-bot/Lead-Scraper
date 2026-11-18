import httpx
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def test_gmaps(query):
    url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}/"
    r = httpx.get(url, headers=headers, timeout=12.0)
    print("Google Maps Status:", r.status_code)
    
    # In Google Maps response, business names and data are embedded in window.APP_INITIALIZATION_STATE or js
    # Let's search for actual websites in the payload
    urls = re.findall(r'https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(?:/[a-zA-Z0-9\-\._~:/?#\[\]@!$&\'()*+,;=]*)?', r.text)
    skip_domains = [
        "google.", "gstatic.", "schema.org", "w3.org", "ggpht.com", "googleapis.com",
        "doubleclick.net", "g.co", "youtube.com", "googletagmanager.com", "android.com"
    ]
    real_sites = []
    for u in urls:
        if not any(s in u.lower() for s in skip_domains):
            if u not in real_sites:
                real_sites.append(u)
                
    print(f"Found {len(real_sites)} unique external URLs:")
    for s in real_sites[:10]:
        print("  ->", s)

if __name__ == "__main__":
    test_gmaps("real estate in new york")
    test_gmaps("dentists in austin")
