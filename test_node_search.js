async function test() {
  const q = 'dental clinic in okara punjab pakistan address phone';
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'q=' + encodeURIComponent(q)
  });
  const html = await res.text();
  console.log('Got HTML status:', res.status, 'len:', html.length);
  
  // Extract result blocks
  const resultBlocks = html.split('<div class="result results_links');
  console.log('Result blocks count:', resultBlocks.length - 1);
  
  for (let i = 1; i < Math.min(resultBlocks.length, 8); i++) {
    const block = resultBlocks[i];
    const titleMatch = block.match(/class="result__title"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
    const snipMatch = block.match(/class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/);
    const urlMatch = block.match(/class="result__url"[\s\S]*?>([\s\S]*?)<\/span>/);
    
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const snip = snipMatch ? snipMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const url = urlMatch ? urlMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    console.log(`[#${i}] Title:`, title);
    console.log(`     URL:`, url);
    console.log(`     Snip:`, snip.slice(0, 100));
  }
}

test();
