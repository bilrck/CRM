import 'dotenv/config';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

async function verifyCreate() {
    console.log("--- Testando Criação de Instância ---");
    
    const EVO_URL = process.env.EVOLUTION_API_URL;
    const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

    // Gerar nome único para evitar conflito
    const instanceName = `debug_test_${Date.now()}`;
    console.log(`Tentando criar instância: ${instanceName}`);

    try {
        const createRes = await fetch(`${EVO_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVO_GLOBAL_KEY
            },
            body: JSON.stringify({
                instanceName,
                qrcode: true,
                token: uuidv4(),
                integration: "WHATSAPP-BAILEYS"
            })
        });

        console.log(`Status Code: ${createRes.status}`);
        const text = await createRes.text();
        console.log("Response Body:", text);

        if (createRes.ok) {
            console.log("✅ Instância Criada com sucesso!");
            
            // Delete immediately to clean up
            console.log("Deletando instância de teste...");
            await fetch(`${EVO_URL}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_GLOBAL_KEY }
            });
            console.log("✅ Limpeza concluída.");
        } else {
            console.error("❌ Falha na criação.");
        }

    } catch (error) {
        console.error("Erro no fetch:", error);
    }
}

verifyCreate();
