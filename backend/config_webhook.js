import dotenv from 'dotenv';
dotenv.config();

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const API_URL = process.env.API_URL || 'http://localhost:3001';
const INSTANCE = 'teste';

async function testWebhook() {
    try {
        console.log(`Checking Webhook Configuration for instance: ${INSTANCE}`);
        
        // 1. Fetch current settings
        const settingsUrl = `${EVO_URL}/webhook/find/${INSTANCE}`;
        const sResp = await fetch(settingsUrl, {
            headers: { 'apikey': EVO_KEY }
        });
        
        if (sResp.ok) {
            const settings = await sResp.json();
            console.log('Current Webhook Settings:', JSON.stringify(settings, null, 2));
        } else {
            console.log('Instance might not have webhook configured yet.');
        }

        // 2. Set/Update Webhook
        const setUrl = `${EVO_URL}/webhook/set/${INSTANCE}`;
        const webhookUrl = `${API_URL}/webhook/instance/${INSTANCE}`;
        
        console.log(`Setting Webhook URL to: ${webhookUrl}`);
        
        const setResp = await fetch(setUrl, {
            method: 'POST',
            headers: { 
                'apikey': EVO_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                enabled: true,
                webhook: {
                    url: webhookUrl,
                    enabled: true,
                    webhook_by_events: false,
                    events: [
                        "MESSAGES_UPSERT",
                        "MESSAGES_UPDATE",
                        "CONNECTION_UPDATE"
                    ]
                }
            })
        });

        if (setResp.ok) {
            console.log('✅ Webhook successfully updated!');
        } else {
            const err = await setResp.text();
            console.error('❌ Failed to update webhook:', err);
        }

    } catch (e) {
        console.error('System Error:', e.message);
    }
}

testWebhook();
