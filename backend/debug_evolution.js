import 'dotenv/config';
import fetch from 'node-fetch';

async function testEvolution() {
    console.log("--- Diagnóstico Evolution API ---");
    
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY; // Mask this in output

    console.log(`URL Configurada: ${url ? url : '(Não definida)'}`);
    console.log(`Key Configurada: ${key ? '(Definida - ' + key.slice(0, 5) + '...)' : '(Não definida)'}`);

    if (!url || !key) {
        console.error("❌ ERRO: Variáveis de ambiente faltando.");
        return;
    }

    try {
        console.log(`\nTentando conectar em: ${url}/instance/fetchInstances...`);
        const response = await fetch(`${url}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': key
            }
        });

        console.log(`Status Code: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Conexão BEM SUCEDIDA!");
            console.log(`Instâncias encontradas: ${Array.isArray(data) ? data.length : 'Formato desconhecido'}`);
        } else {
            console.error("❌ Falha na conexão.");
            const text = await response.text();
            console.log("Response Body:", text);
        }

    } catch (error) {
        console.error("❌ Erro de Rede/Fetch:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("Dica: Verifique se a Evolution API está rodando nessa URL.");
        }
    }
}

testEvolution();
