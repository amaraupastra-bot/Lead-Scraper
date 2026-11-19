async function searchLive(niche, city, state, country) {
  const q = `${niche} in ${city} ${state} ${country} contact phone address`;
  
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://html.duckduckgo.com/',
      'Origin': 'https://html.duckduckgo.com'
    },
    body: 'q=' + encodeURIComponent(q)
  });
  
  const html = await res.text();
  const resultBlocks = html.split('<div class="result results_links');
  
  const leads = [];
  const seen = new Set();
  
  for (let i = 1; i < resultBlocks.length; i++) {
    const block = resultBlocks[i];
    const titleMatch = block.match(/class="result__title"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    const snipMatch = block.match(/class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/);
    
    if (!titleMatch) continue;
    
    const rawHref = titleMatch[1];
    let rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
    const rawSnippet = snipMatch ? snipMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    let actualUrl = rawHref;
    if (rawHref.includes('uddg=')) {
      const match = rawHref.match(/[?&]uddg=([^&]+)/);
      if (match) {
        actualUrl = decodeURIComponent(match[1]);
      }
    }
    
    // Clean name
    let cleanName = rawTitle.replace(/^(?:\+?92|0)\s*\d{2,3}\s*\d{7}\s*/, '');
    cleanName = cleanName.split(/[\-\–|:»•]/)[0].trim();
    const cityRgx = new RegExp(`(?:,\\s*)?(?:in\\s+)?${city}.*$`, 'i');
    cleanName = cleanName.replace(cityRgx, '').trim();
    cleanName = cleanName.replace(/\(?\b202\d\b\)?/g, '').trim();
    cleanName = cleanName.replace(/[!?,.]+$/g, '').trim();
    
    cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    if (cleanName.length < 3 || /^(best|top|list of|find|directory|companies in|real estate in)/i.test(cleanName)) {
      continue;
    }
    
    const key = cleanName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    
    leads.push({
      business_name: cleanName,
      website: actualUrl.startsWith('http') ? actualUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + city + ' ' + country)}`
    });
    
    if (leads.length >= 5) break;
  }
  
  console.log(`\nResults for "${niche}" in "${city}":`);
  leads.forEach((l, idx) => console.log(`  ${idx+1}. ${l.business_name} (${l.website})`));
}

async function testAll() {
  await searchLive('real estate', 'Lahore', 'Punjab', 'Pakistan');
  await searchLive('real estate', 'Okara', 'Punjab', 'Pakistan');
  await searchLive('software house', 'Islamabad', 'Federal', 'Pakistan');
}

testAll();
