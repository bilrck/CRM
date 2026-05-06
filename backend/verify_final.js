
const key = 'awi5599f2atqLNkIvG6xNduqgQaCEJrg';
const instanceName = 'ws_final_test_' + Date.now();

async function verify() {
  console.log('Creating instance:', instanceName);
  try {
    const createRes = await fetch('http://localhost:8080/instance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key },
        body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' })
    });
    const createData = await createRes.json();
    console.log('Create Response:', JSON.stringify(createData, null, 2));

    for (let i = 1; i <= 6; i++) {
        console.log(`Polling QR (attempt ${i}/6)...`);
        await new Promise(r => setTimeout(r, 5000));

        const qrRes = await fetch('http://localhost:8080/instance/connect/' + instanceName, {
            headers: { 'apikey': key }
        });
        const qrData = await qrRes.json();
        
        if (qrData.base64 || (qrData.qrcode && qrData.qrcode.base64)) {
            console.log('✅ SUCCESS: QR Code received!');
            console.log('Base64 sample:', (qrData.base64 || qrData.qrcode.base64).substring(0, 50) + '...');
            return;
        } else {
            console.log('QR not ready yet. Response:', JSON.stringify(qrData));
        }
    }
    console.log('❌ FAILURE: QR Code never appeared after 30s');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

verify();
