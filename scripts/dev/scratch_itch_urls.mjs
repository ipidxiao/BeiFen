const urls = [
  'https://chaosium.itch.io/the-derelict',
  'https://chaosium.itch.io/scritch-scratch',
  'https://chaosium.itch.io/the-lightless-beacon',
  'https://chaosium.itch.io/dead-light-and-other-dark-turns',
  'https://chaosium.itch.io/call-of-cthulhu-quickstart-rules'
];

for (const u of urls) {
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 CoC-Engine/1.0' } });
  const html = await r.text();
  const patterns = [
    /game_id["\s:]+(\d+)/g,
    /"id":(\d+),"filename"/g,
    /\/file\/(\d+)\//g,
    /uploads\/[^"']+\.pdf/gi,
    /data-upload[^>]*/gi,
    /itchio\.init\([^)]+\)/g,
    /"type":"download"[^}]+}/g
  ];
  console.log('===', u);
  for (const p of patterns) {
    const m = [...html.matchAll(p)].map((x) => x[0] || x[1]).slice(0, 5);
    if (m.length) console.log(p.source.slice(0, 30), m);
  }
  const jsonBlocks = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)];
  console.log('json blocks:', jsonBlocks.length);
  for (const b of jsonBlocks.slice(0, 2)) {
    try {
      const j = JSON.parse(b[1]);
      console.log('json keys:', Object.keys(j));
      if (j.game) console.log('game id', j.game.id, 'type', j.game.type);
    } catch (e) { console.log('parse err', b[1].slice(0, 80)); }
  }
}
