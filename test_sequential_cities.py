import urllib.request
import json

def test_api_city(niche, city, state, country, count=5):
    req_data = json.dumps({
        'business_niche': niche,
        'country': country,
        'state_province': state,
        'city_town': city,
        'lead_count': count
    }).encode('utf-8')
    
    req = urllib.request.Request('http://localhost:3000/api/scraper/scrape', data=req_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    leads = data.get('leads', [])
    print(f"\n==========================================")
    print(f"SEARCH FOR '{niche}' in '{city}' (Count: {len(leads)}):")
    print(f"==========================================")
    for i, l in enumerate(leads, 1):
        print(f"  #{i}: {l.get('business_name')} | City: {l.get('city')} | Addr: {l.get('address')} | Web: {l.get('website')}")

test_api_city('dental', 'Okara', 'Punjab', 'Pakistan', 5)
test_api_city('dental', 'Lahore', 'Punjab', 'Pakistan', 5)
test_api_city('dental', 'Karachi', 'Sindh', 'Pakistan', 5)
