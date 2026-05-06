import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001/webhooks/ws_1_teste_1773076906517';

const payload = {
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "TEST_MSG_ID_1"
    },
    "message": {
      "conversation": "Eu quero a FAIXA1"
    },
    "pushName": "Teste Automatizado"
  }
};

async function run() {
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('--- WEBHOOK RESPONSE ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error testing webhook:', err);
  }
}

run();
