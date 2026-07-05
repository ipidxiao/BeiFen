const post = await fetch('https://chaosium.itch.io/the-derelict/download_url', {
  method: 'POST',
  headers: {
    Referer: 'https://chaosium.itch.io/the-derelict',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({ upload_id: '2139931' }),
});
const { url } = await post.json();
console.log('signed', url);
const dl = await fetch(url, { redirect: 'follow', headers: { Referer: 'https://chaosium.itch.io/the-derelict' } });
console.log('final', dl.status, dl.url.slice(0, 120));
console.log('ct', dl.headers.get('content-type'), 'len', dl.headers.get('content-length'));
const buf = await dl.arrayBuffer();
console.log('bytes', buf.byteLength);
console.log('magic', Buffer.from(buf.slice(0, 5)).toString());
