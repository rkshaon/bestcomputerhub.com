const res = await fetch('http://localhost:8000/api/v1/product-images/');
const data = await res.json();
console.log(data.results?.slice(0, 2).map(img => img.image));
