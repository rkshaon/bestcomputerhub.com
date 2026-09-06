const url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&q=80';
async function test() {
  const getRes = await fetch(url, { method: 'GET' });
  console.log('GET ok:', getRes.ok);
  console.log('GET status:', getRes.status);
  console.log('GET type:', getRes.type);
  console.log('GET content-type:', getRes.headers.get('content-type'));
  const blob = await getRes.blob();
  console.log('Blob size:', blob.size);
}
test();
