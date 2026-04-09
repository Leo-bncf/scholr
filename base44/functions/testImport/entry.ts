import fs from 'fs';
try {
  const content = fs.readFileSync('pages/Landing.js', 'utf-8');
  console.log("Landing.js read successful");
} catch (e) {
  console.error(e);
}