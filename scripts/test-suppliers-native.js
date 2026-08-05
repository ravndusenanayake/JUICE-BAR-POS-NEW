async function test() {
  const res = await fetch('http://localhost:3000/api/suppliers');
  const data = await res.json();
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
}
test();
