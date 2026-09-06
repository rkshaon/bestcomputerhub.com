const res = await fetch('http://localhost:3000/api/v1/products/');
const data = await res.json();
console.log(Object.keys(data));
console.log(data);
