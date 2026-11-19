async function testDuck() {
  const q = 'dental clinic in Lahore Punjab Pakistan contact phone address';
  
  // Test with standard browser headers
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://html.duckduckgo.com/',
      'Origin': 'https://html.duckduckgo.com'
    },
    body: 'q=' + encodeURIComponent(q)
  });
  
  console.log('Status:', res.status, 'len:', (await res.text()).length);
}

testDuck();
