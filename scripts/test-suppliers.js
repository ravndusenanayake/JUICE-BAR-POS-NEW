const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3000/api/suppliers');
  const data = await res.json();
  console.log(data);
}
test();
