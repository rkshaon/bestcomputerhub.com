const url = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&q=80';
async function run() {
  const res = await fetch(url, { method: 'HEAD' });
  console.log('HEAD status:', res.status, res.type);
  const getRes = await fetch(url, { method: 'GET' });
  console.log('GET status:', getRes.status, getRes.type);
  const blob = await getRes.blob();
  console.log('Blob size:', blob.size);
}
run();
