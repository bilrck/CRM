
import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/prisma.js';

const url = process.env.EVOLUTION_API_URL;
const key = process.env.EVOLUTION_API_KEY;

async function testQr() {
  const connection = await prisma.connection.findFirst({
    where: { provider: 'evolution' },
    orderBy: { createdAt: 'desc' }
  });

  if (!connection) {
    console.log('No evolution connection in DISCONNECTED state found.');
    return;
  }

  const instanceName = connection.config?.instanceName;
  console.log(`Testing QR fetch for instance: ${instanceName} at ${url}`);
  
  try {
    const response = await fetch(`${url}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': key }
    });
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('Data keys:', Object.keys(data));
    if (data.qrcode) {
        console.log('QR Code FOUND in base64! Length:', data.qrcode.base64?.length);
    } else if (data.base64) {
        console.log('QR Code FOUND in root base64! Length:', data.base64.length);
    } else {
        console.log('QR Code NOT found in response. Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

testQr();
