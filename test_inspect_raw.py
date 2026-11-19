import httpx
from bs4 import BeautifulSoup
import re
import urllib.parse

def inspect_raw(query):
    print(f"\n==========================================")
    print(f"RAW DUCKDUCKGO RESULTS FOR: {query}")
    print(f"==========================================")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://html.duckduckgo.com/',
        'Origin': 'https://html.duckduckgo.com'
    }
    r = httpx.post('https://html.duckduckgo.com/html/', data={'q': query}, headers=headers, timeout=10.0)
    soup = BeautifulSoup(r.text, 'html.parser')
    for idx, res in enumerate(soup.select('.result')[:12], 1):
        t_el = res.select_one('.result__title a')
        s_el = res.select_one('.result__snippet')
        if not t_el: continue
        title = t_el.get_text(strip=True)
        snip = s_el.get_text(strip=True) if s_el else ''
        href = t_el.get('href', '')
        # decode
        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
        actual = parsed.get('uddg', [''])[0] if 'uddg' in parsed else href
        print(f"[{idx}] TITLE:   {title}")
        print(f"     SNIP:    {snip[:120]}")
        print(f"     LINK:    {actual}")
        print("---")

inspect_raw("dentist dental clinic in Lahore Pakistan phone address")
inspect_raw("dentist dental clinic in Okara Pakistan phone address")
