
import dotenv from 'dotenv';
dotenv.config();

const url = "http://localhost:8080";
const key = "awi5599f2atqLNkIvG6xNduqgQaCEJrg";
const instanceName = "ws_1_teste_1769509391823";

async function testQr() {
  console.log(`Testing QR fetch for instance: ${instanceName} at ${url}`);
  
  try {
    const response = await fetch(`${url}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': key }
    });
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

testQr();
