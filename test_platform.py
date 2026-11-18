import asyncio
import httpx
import sys

API_BASE = "http://127.0.0.1:8000"

async def test_all():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("[1] Testing Health Endpoint...")
        res = await client.get(f"{API_BASE}/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(" -> Health check passed:", res.json())

        print("\n[2] Testing Data Sources Initialization...")
        res = await client.get(f"{API_BASE}/api/sources")
        assert res.status_code == 200, f"Sources failed: {res.text}"
        sources = res.json()
        print(f" -> Found {len(sources)} active connectors:", [s['display_name'] for s in sources])

        print("\n[3] Testing Standalone Website Analyzer...")
        res = await client.post(f"{API_BASE}/api/analyzer/run", json={"url": "https://example.com"})
        assert res.status_code == 200, f"Analyzer failed: {res.text}"
        audit = res.json()
        print(f" -> Audited {audit.get('url')}:")
        print(f"    Defect / Improvement Score: {audit.get('audit', {}).get('improvement_score')}/100")
        print(f"    Mobile Status: {audit.get('audit', {}).get('mobile_status')}")
        print(f"    Detected Issues: {len(audit.get('audit', {}).get('detected_issues', []))}")

        print("\n[4] Testing Lead Search Discovery Execution...")
        search_payload = {
            "keywords": "Roofing Austin",
            "location": "Austin, TX",
            "category": "Roofing",
            "max_results": 10,
            "data_sources": ["open_web_search", "public_business_directory"]
        }
        res = await client.post(f"{API_BASE}/api/search", json=search_payload)
        assert res.status_code == 200, f"Create search failed: {res.text}"
        search_job = res.json()
        search_id = search_job["id"]
        print(f" -> Started Search Job: {search_id}")

        # Poll for completion
        print(" -> Polling search job until finished...")
        for _ in range(25):
            await asyncio.sleep(2)
            check_res = await client.get(f"{API_BASE}/api/search/{search_id}")
            job_data = check_res.json()
            print(f"    Progress: {job_data['progress']}% | Status: {job_data['status']} | Discovered: {job_data['total_discovered']} | Qualified: {job_data['total_qualified']}")
            if job_data["status"] in ("completed", "failed", "cancelled"):
                break

        print("\n[5] Testing Leads Query & CRM Features...")
        leads_res = await client.get(f"{API_BASE}/api/leads")
        assert leads_res.status_code == 200
        leads = leads_res.json()
        print(f" -> Total leads in DB: {len(leads)}")
        if leads:
            first_lead = leads[0]
            print(f"    Sample Lead: {first_lead['business_name']} ({first_lead['category']}) - Priority: {first_lead['lead_priority']} - Web Score: {first_lead['website_score']}")
            
            # Test note addition
            note_res = await client.post(
                f"{API_BASE}/api/leads/{first_lead['id']}/notes",
                json={"note": "Initial outreach scheduled via agency specialist."}
            )
            assert note_res.status_code == 200
            print("    -> Successfully added note to lead!")

            # Test status update
            update_res = await client.put(
                f"{API_BASE}/api/leads/{first_lead['id']}",
                json={"lead_status": "Contacted"}
            )
            assert update_res.status_code == 200
            print("    -> Updated lead status to 'Contacted'!")

        print("\n[6] Testing Export Center (.xlsx and .csv)...")
        # Test Excel export
        export_res = await client.post(f"{API_BASE}/api/export", json={"format": "xlsx"})
        assert export_res.status_code == 200
        xlsx_info = export_res.json()
        print(f" -> Generated Excel export: {xlsx_info['file_name']} ({xlsx_info['row_count']} rows)")

        # Test CSV export
        export_csv_res = await client.post(f"{API_BASE}/api/export", json={"format": "csv"})
        assert export_csv_res.status_code == 200
        csv_info = export_csv_res.json()
        print(f" -> Generated CSV export: {csv_info['file_name']} ({csv_info['row_count']} rows)")

        print("\n[7] Testing Automation Workflows...")
        auto_res = await client.post(
            f"{API_BASE}/api/automation",
            json={
                "name": "Weekly Dental Lead Bot",
                "category": "Dentists",
                "location": "Dallas, TX",
                "schedule": "Weekly",
                "max_results": 20
            }
        )
        assert auto_res.status_code == 200
        flow = auto_res.json()
        print(f" -> Created Automation: {flow['name']} (ID: {flow['id']})")

        print("\n[8] Testing Overview Dashboard Aggregate Metrics...")
        metrics_res = await client.get(f"{API_BASE}/api/overview/metrics")
        assert metrics_res.status_code == 200
        metrics = metrics_res.json()
        print(f" -> Total Leads: {metrics['total_leads']}")
        print(f" -> Verified Emails: {metrics['verified_emails']}")
        print(f" -> High-Priority Leads: {metrics['high_priority_leads']}")
        print(f" -> Outdated Websites: {metrics['outdated_websites']}")
        print(f" -> Searches Run: {metrics['total_searches']}")

        print("\n" + "="*50)
        print("ALL BACKEND & PLATFORM TESTS PASSED SUCCESSFULLY!")
        print("="*50)

if __name__ == "__main__":
    asyncio.run(test_all())
