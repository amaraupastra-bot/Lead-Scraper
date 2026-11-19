import httpx
from backend.connectors.verified_lead_database import REAL_BUSINESS_DATABASE

print("Checking all database websites...")
working = 0
failed = 0
for b in REAL_BUSINESS_DATABASE:
    url = b["website"]
    try:
        r = httpx.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=4.0, follow_redirects=True)
        print(f"[LIVE {r.status_code}] {b['business_name']} -> {url}")
        working += 1
    except Exception as e:
        print(f"[FAIL] {b['business_name']} -> {url}")
        failed += 1

print(f"\nSummary: {working} working, {failed} failed")
