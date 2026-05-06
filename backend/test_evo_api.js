import dotenv from 'dotenv';
dotenv.config();

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = 'user_1_teste_1767903018712';
const JID = '559484153978@s.whatsapp.net';

async function test() {
    const urls = [
        `${EVO_URL}/chat/findMessages/${INSTANCE}`,
        `${EVO_URL}/chat/fetchMessages/${INSTANCE}`,
        `${EVO_URL}/instance/fetchInstances`
    ];

    for (const url of urls) {
        console.log(`Testing ${url}...`);
        try {
            const method = url.includes('/instance/') ? 'GET' : 'POST';
            const r = await fetch(url, {
                method,
                headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify({ where: { remoteJid: JID }, limit: 1 }) : undefined
            });
            const text = await r.text();
            console.log(`Result (${r.status}): ${text.substring(0, 500)}`);
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

test();
