import urllib.request
import json

req_data = json.dumps({
    'business_niche': 'dental',
    'country': 'Pakistan',
    'state_province': 'punjab',
    'city_town': 'okara',
    'lead_count': 6
}).encode('utf-8')

# 1. FastAPI
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/scraper/scrape', data=req_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print("=== FASTAPI OKARA RESULTS ===")
    for i, l in enumerate(data.get('leads', []), 1):
        print(f"#{i}: {l.get('business_name')} | City: {l.get('city')} | Addr: {l.get('address')} | Phone: {l.get('phone')}")
except Exception as e:
    print("FastAPI test error:", e)

# 2. Next.js
try:
    req2 = urllib.request.Request('http://localhost:3000/api/scraper/scrape', data=req_data, headers={'Content-Type': 'application/json'})
    res2 = urllib.request.urlopen(req2)
    data2 = json.loads(res2.read())
    print("\n=== NEXTJS API OKARA RESULTS ===")
    for i, l in enumerate(data2.get('leads', []), 1):
        print(f"#{i}: {l.get('business_name')} | City: {l.get('city')} | Addr: {l.get('address')} | Phone: {l.get('phone')}")
except Exception as e:
    print("NextJS test error:", e)
