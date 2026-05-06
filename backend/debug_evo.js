import fetch from 'node-fetch';

const EVO_URL = 'http://localhost:8080';
const EVO_KEY = 'awi5599f2atqLNkIvG6xNduqgQaCEJrg';
const INSTANCE = 'ws_1_teste_1773076906517';

async function run() {
  try {
    const res = await fetch(`${EVO_URL}/instance/fetchInstances?instanceName=${INSTANCE}`, {
      headers: { apikey: EVO_KEY }
    });
    const data = await res.json();
    console.log('--- INSTANCE INFO ---');
    console.log(JSON.stringify(data, null, 2));

    const webRes = await fetch(`${EVO_URL}/webhook/find/${INSTANCE}`, {
      headers: { apikey: EVO_KEY }
    });
    const webData = await webRes.json();
    console.log('--- WEBHOOK INFO ---');
    console.log(JSON.stringify(webData, null, 2));
  } catch (err) {
    console.error('Error checking Evolution:', err);
  }
}

run();
