import httpx
from bs4 import BeautifulSoup
import urllib.parse
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

def test_duckduckgo_lite(query):
    url = "https://lite.duckduckgo.com/lite/"
    try:
        r = httpx.post(url, data={"q": query}, headers=headers, timeout=8.0)
        print("DDG Lite status:", r.status_code)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            links = soup.select(".result-link")
            print("DDG Lite links found:", len(links))
            for a in links[:5]:
                print("  ", a.get_text(strip=True), "->", a.get("href"))
    except Exception as e:
        print("DDG Lite error:", e)

def test_yahoo(query):
    url = f"https://search.yahoo.com/search?p={urllib.parse.quote_plus(query)}"
    try:
        r = httpx.get(url, headers=headers, timeout=8.0)
        print("Yahoo status:", r.status_code)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            results = soup.select("#web ol li div.compText") or soup.select(".algo") or soup.select("h3.title a")
            print("Yahoo results found:", len(results))
            for el in soup.select("h3 a")[:5]:
                print("  ", el.get_text(strip=True), "->", el.get("href"))
    except Exception as e:
        print("Yahoo error:", e)

def test_bing(query):
    url = f"https://www.bing.com/search?q={urllib.parse.quote_plus(query)}"
    try:
        r = httpx.get(url, headers=headers, timeout=8.0)
        print("Bing status:", r.status_code)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            links = soup.select("li.b_algo h2 a")
            print("Bing results found:", len(links))
            for a in links[:5]:
                print("  ", a.get_text(strip=True), "->", a.get("href"))
    except Exception as e:
        print("Bing error:", e)

if __name__ == "__main__":
    q = "real estate companies in New York"
    print("Testing query:", q)
    test_duckduckgo_lite(q)
    test_yahoo(q)
    test_bing(q)
