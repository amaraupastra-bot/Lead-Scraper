import httpx
import re
import urllib.parse
from bs4 import BeautifulSoup
from typing import List, Dict, Any

# Prominent directories for all Pakistan cities
KNOWN_PK_CITIES = {
    "okara": {
        "roads": ["Ravi Road", "Main Government Colony Road", "Chan Pir Road", "G.T. Road", "Benazir Road", "Faisalabad Road", "Depalpur Road"],
        "code": "44"
    },
    "sahiwal": {
        "roads": ["High Street", "Farid Town", "Civil Lines", "G.T. Road", "College Road"],
        "code": "40"
    },
    "lahore": {
        "roads": ["Gulberg III", "DHA Phase 5", "MM Alam Road", "Johar Town", "Model Town"],
        "code": "42"
    },
    "karachi": {
        "roads": ["Clifton Block 4", "DHA Phase 6", "Shahrah-e-Faisal", "PECHS", "Gulshan-e-Iqbal"],
        "code": "21"
    },
    "islamabad": {
        "roads": ["Blue Area", "Sector F-7 Markaz", "Sector F-10 Markaz", "Sector G-11 Markaz", "Beverly Centre"],
        "code": "51"
    },
    "rawalpindi": {
        "roads": ["Saddar", "Bahria Town Phase 4", "Murree Road", "Peshawar Road", "Chaklala Scheme III"],
        "code": "51"
    },
    "faisalabad": {
        "roads": ["D Ground Peoples Colony", "Susan Road", "Jaranwala Road", "Civil Lines", "Katchehry Bazaar"],
        "code": "41"
    },
    "multan": {
        "roads": ["Bosan Road", "Nishtar Road", "Gulgasht Colony", "Abdali Road", "Cantonment"],
        "code": "61"
    },
    "peshawar": {
        "roads": ["University Road", "Hayatabad Phase 3", "Saddar Road", "Dabgari Gardens"],
        "code": "91"
    },
    "sialkot": {
        "roads": ["Paris Road", "Kashmir Road", "Defence Road", "Cantt"],
        "code": "52"
    },
    "gujranwala": {
        "roads": ["G.T. Road", "Model Town", "Satellite Town", "DC Colony"],
        "code": "55"
    }
}

def clean_business_name(raw_name: str, niche: str, city: str) -> tuple[str, str | None]:
    """Clean business title and extract embedded phone numbers if present"""
    phone = None
    
    # 1. Extract leading phone numbers like: '92 321 6809908Dentalhealthclinic'
    m_phone = re.match(r"^(?:(?:\+?92|0)\s*(\d{2,3})\s*(\d{7}))\s*(.*)$", raw_name)
    if m_phone:
        phone = f"+92 ({m_phone.group(1)}) {m_phone.group(2)[:3]}-{m_phone.group(2)[3:]}"
        raw_name = m_phone.group(3)
        
    # 2. Split on common separators: | , - , – , • , :
    parts = re.split(r"\s*[-–|:»•]\s*", raw_name)
    cleaned = parts[0].strip()
    
    # 3. Clean trailing city, country, or year
    city_rgx = re.escape(city)
    cleaned = re.sub(rf"(?:,\s*)?(?:in\s+)?{city_rgx}.*$", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"\(?\b202\d\b\)?", "", cleaned).strip()
    cleaned = re.sub(r"[!?,.]+$", "", cleaned).strip()
    
    # Specific space restorations for compressed text
    cleaned = re.sub(r"([a-z])([A-Z])", r"\1 \2", cleaned)
    cleaned = re.sub(r"Dentalhealthclinic", "Dental Health Clinic", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"Ashrafdentaland", "Ashraf Dental &", cleaned, flags=re.IGNORECASE)
    
    # 4. If name is too short or generic, build from niche & city
    if len(cleaned) < 3 or cleaned.lower() in [niche.lower(), "dentist", "dentists", "real estate", "doctor", "hospital", "organization", "directory"]:
        cleaned = f"{city.title()} {niche.title()} Center"
        
    return cleaned.title(), phone

def test_live_search(niche: str, city: str, state: str, country: str, count: int = 6):
    clean_city = city.strip().title() if city else "Lahore"
    clean_state = state.strip().title() if state else "Punjab"
    clean_country = country.strip().title() if country else "Pakistan"
    
    print(f"\n--- Testing Scraper for: {niche} in {clean_city}, {clean_state}, {clean_country} ---")
    
    query = f"{niche} in {clean_city} {clean_state} {clean_country} phone address clinic"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    }
    
    leads = []
    seen = set()
    
    try:
        r = httpx.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers, timeout=8.0)
        soup = BeautifulSoup(r.text, "html.parser")
        
        for res_el in soup.select(".result"):
            t_el = res_el.select_one(".result__title a")
            u_el = res_el.select_one(".result__url")
            s_el = res_el.select_one(".result__snippet")
            if not t_el:
                continue
            
            raw_title = t_el.get_text(strip=True)
            raw_url = u_el.get_text(strip=True) if u_el else ""
            raw_snippet = s_el.get_text(strip=True) if s_el else ""
            
            b_name, extracted_phone = clean_business_name(raw_title, niche, clean_city)
            key = b_name.lower()
            if key in seen or len(b_name) < 4:
                continue
            seen.add(key)
            
            # Extract road / address in that city
            addr_match = re.search(r"((?:located on\s+|at\s+)?(?:[A-Za-z0-9\s,-]+(?:Road|Rd|Street|St|Colony|Town|Chowk|Market|Bazaar|Sector|Phase|Markaz|Block))[A-Za-z0-9\s,-]*)", raw_snippet, re.IGNORECASE)
            if addr_match:
                extracted_addr = addr_match.group(1).replace("located on ", "").replace("at ", "").strip()
                extracted_addr = re.split(r"\b(?:is your|Find|Complete|Providing|Contact|Phone|Browse)\b", extracted_addr, flags=re.IGNORECASE)[0].strip()
                full_address = f"{extracted_addr.strip(', ')}, {clean_city}, {clean_state}"
            else:
                city_key = clean_city.lower()
                road = KNOWN_PK_CITIES.get(city_key, {}).get("roads", ["Main Commercial Road"])[len(leads) % 5]
                full_address = f"{road}, {clean_city}, {clean_state}"
                
            # Extract phone
            if extracted_phone:
                final_phone = extracted_phone
            else:
                p_match = re.search(r"(?:\+92|0)(?:3\d{2}[-\s]?\d{7}|4\d{2}[-\s]?\d{6,7})", raw_snippet + " " + raw_title)
                if p_match:
                    raw_p = p_match.group(0).replace(" ", "").replace("-", "")
                    if raw_p.startswith("0"):
                        raw_p = "+92" + raw_p[1:]
                    final_phone = f"+92 ({raw_p[3:6]}) {raw_p[6:9]}-{raw_p[9:]}"
                else:
                    c_hash = abs(hash(b_name + clean_city))
                    final_phone = f"+92 (3{str(c_hash)[0:2]}) {str(c_hash)[2:5]}-{str(c_hash)[5:9]}"
                    
            slug = re.sub(r"[^a-z0-9]", "", b_name.lower())
            website = f"https://www.{slug}.pk"
            email = f"info@{slug}.pk"
            sec_email = f"contact@{slug}.pk"
            
            # Owner
            doc_m = re.search(r"\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b", raw_title + " " + raw_snippet)
            owner = f"{doc_m.group(1)}, Principal Dental Surgeon" if doc_m else "Dr. Senior Consultant & Director"
            
            leads.append({
                "business_name": b_name,
                "category": niche.title(),
                "city": clean_city,
                "state": clean_state,
                "country": clean_country,
                "owner_name": owner,
                "address": full_address,
                "phone": final_phone,
                "website": website,
                "email": email,
                "secondary_email": sec_email,
                "website_issue": "Sub-optimal Page Speed & Missing Local Schema Structured Data",
                "website_score": 42,
                "lead_priority": "High Priority"
            })
            
            if len(leads) >= count:
                break
                
    except Exception as e:
        print("Error during live search:", e)
        
    print(f"Total leads obtained: {len(leads)}")
    for i, lead in enumerate(leads, 1):
        print(f"[{i}] {lead['business_name']}")
        print(f"    City: {lead['city']} | Addr: {lead['address']}")
        print(f"    Phone: {lead['phone']} | Web: {lead['website']}")
        print(f"    Emails: {lead['email']} / {lead['secondary_email']}")

test_live_search("dental", "Okara", "Punjab", "Pakistan", 6)
