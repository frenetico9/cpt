import { CryptoPair, TechnicalAnalysis, FullAnalysis, WhaleAlert } from '../types';

// Using a free, public key for OpenRouter for demonstration purposes.
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// OpenRouter recommends setting these headers for proper rate-limiting and identification.
const YOUR_SITE_URL = "https://crypto-ia-analyst.app"; 
const YOUR_SITE_NAME = "Crypto IA Analyst";


const generateSystemPrompt = () => {
    return `
      Você é um analista de criptomoedas sênior e um agregador de notícias financeiras para o app 'Crypto IA Analyst'.
      Sua tarefa é realizar uma análise completa e integrada para um par de criptomoedas.
      O resultado DEVE ser um objeto JSON VÁLIDO.

      O processo tem três etapas:
      1.  **Busca e Análise de Notícias:** Encontre 3-4 manchetes de notícias REAIS e recentes (últimos dias) para o par solicitado. Para cada uma, determine a fonte e o sentimento ('Positivo', 'Negativo', 'Neutro'). Com base nelas, defina um 'overallSentiment'.
      2.  **Análise Técnica:** Analise os dados técnicos fornecidos pelo usuário.
      3.  **Conclusão e Recomendação:** Combine o sentimento das notícias com a análise técnica para gerar uma recomendação de negociação final ('analysis'). A justificativa deve explicar COMO as notícias e os indicadores técnicos levaram à sua decisão.

      O JSON de saída deve ter a seguinte estrutura:
      {
        "analysis": {
          "suggestion": "'COMPRA', 'VENDA', ou 'NEUTRO'",
          "justification": "Explicação detalhada da recomendação.",
          "entryPoint": 123.45,
          "stopLoss": 120.00,
          "takeProfit": 130.00,
          "risk": "'BAIXO', 'MÉDIO', ou 'ALTO'"
        },
        "news": [
          {
            "headline": "Manchete da notícia.",
            "source": "Fonte da notícia",
            "sentiment": "'Positivo', 'Negativo', ou 'Neutro'"
          }
        ],
        "overallSentiment": "'Positivo', 'Negativo', ou 'Neutro'"
      }
    `;
};

const generateUserPrompt = (pair: CryptoPair, tech: TechnicalAnalysis) => {
    return `
      Por favor, realize a análise completa para o par ${pair}.

      Dados Técnicos Atuais para ${pair}:
      - Preço Atual: ${tech.price.toFixed(4)}
      - RSI (14 períodos): ${tech.rsi.toFixed(2)} (Valores < 30 indicam sobrevenda, > 70 sobrecompra)
      - Histograma MACD: ${tech.macdValue.toFixed(6)} (Positivo sugere momentum de alta; negativo, de baixa)
      - Posição vs EMA(200): ${tech.price > tech.ema200 ? 'Acima' : 'Abaixo'} (Acima é tendência de alta; abaixo, de baixa)
      - Variação de Preço (24h): ${tech.priceChangePercent.toFixed(2)}%
      - Volume (24h em quote): ${tech.volume24h.toLocaleString()}

      Exemplo de Lógica Integrada:
      - Se o RSI está baixo (<30) e as notícias são majoritariamente 'Positivas' (ex: aprovação de um ETF), isso fortalece muito uma recomendação de 'COMPRA'.
      - Se o preço está acima da EMA(200) mas as notícias são 'Negativas' (ex: problemas regulatórios), a recomendação pode ser 'NEUTRO', aconselhando cautela.

      Gere sua análise completa no formato JSON solicitado no prompt do sistema.
    `;
};


export const getCryptoAnalysis = async (
  pair: CryptoPair,
  technicalData: TechnicalAnalysis
): Promise<FullAnalysis> => {

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': YOUR_SITE_URL, 
                'X-Title': YOUR_SITE_NAME,
            },
            body: JSON.stringify({
                model: 'qwen/qwen-2.5-72b-instruct:free',
                messages: [
                    { role: 'system', content: generateSystemPrompt() },
                    { role: 'user', content: generateUserPrompt(pair, technicalData) }
                ],
                response_format: { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter API Error:", errorData);
            throw new Error(`Falha na chamada à API OpenRouter: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("A resposta da IA está vazia ou em formato inesperado.");
        }
        
        try {
            const parsedJson: FullAnalysis = JSON.parse(content);
            if (!parsedJson.analysis || !parsedJson.news || !parsedJson.overallSentiment) {
                console.warn("Incomplete AI response", parsedJson);
                throw new Error("O JSON retornado pela IA está incompleto ou malformado.");
            }
            return parsedJson;
        } catch (parseError) {
            console.error("Failed to parse JSON from AI response:", content, parseError);
            throw new Error("Falha ao processar a resposta da IA. O formato do JSON é inválido.");
        }

    } catch (error) {
        console.error("Error fetching analysis from OpenRouter:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return Promise.reject(new Error("Falha na chamada à API: A chave de API do OpenRouter é inválida ou está faltando."));
            }
            throw new Error(`Falha na chamada à API: ${error.message}`);
        }
        throw new Error("Falha ao obter análise da IA. Verifique a conexão ou a API OpenRouter.");
    }
};

const generateWhaleSystemPrompt = () => {
    return `
      Você é um analista de blockchain especializado em identificar projetos de criptomoedas novos e de alto potencial.
      Sua tarefa é encontrar e relatar as 5 movimentações mais significativas (grandes transações) em criptomoedas que foram lançadas nos últimos 3 MESES.

      Você deve usar suas capacidades de pesquisa para encontrar transações reais e recentes para esses novos ativos. Ignore transações de moedas antigas como Bitcoin, Ethereum, Doge, etc., a menos que seja um novo token relacionado a elas com menos de 3 meses de vida. O foco é em NOVOS PROJETOS.

      Para cada transação, você DEVE fornecer os detalhes em um formato JSON estrito. O resultado DEVE ser um array JSON de objetos, contendo exatamente 5 alertas.

      A estrutura para cada objeto no array JSON deve ser:
      {
        "id": "um_id_unico_gerado_por_voce_usando_partes_da_transacao",
        "title": "Um resumo conciso da transação. Ex: 500,000 #NOVACOIN (250,000 USD) transferred from Uniswap to unknown wallet",
        "date": "A data e hora da transação no formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ).",
        "coin": "O ticker da criptomoeda (ex: 'WIF', 'JUP', 'DYM').",
        "amountCoin": 500000,
        "amountUSD": 250000,
        "from": "A carteira ou exchange de origem (ex: 'unknown wallet', '#Uniswap').",
        "to": "A carteira ou exchange de destino (ex: 'unknown wallet', '#Gate.io')."
      }

      Não inclua nenhum texto ou explicação fora do array JSON. A sua resposta DEVE começar com '[' e terminar com ']'.
    `;
};

const generateWhaleUserPrompt = () => {
    return `
      Por favor, encontre as 5 movimentações de baleias mais recentes e significativas EM CRIPTOMOEDAS COM MENOS DE 3 MESES DE EXISTÊNCIA e retorne-as no formato JSON especificado no system prompt.
    `;
};

export const getAIWhaleAlerts = async (): Promise<WhaleAlert[]> => {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': YOUR_SITE_URL,
                'X-Title': YOUR_SITE_NAME,
            },
            body: JSON.stringify({
                model: 'google/gemini-flash-1.5',
                messages: [
                    { role: 'system', content: generateWhaleSystemPrompt() },
                    { role: 'user', content: generateWhaleUserPrompt() }
                ],
                // Although we ask for an array, telling the model to format as a JSON object
                // can lead to more stable, well-formed responses. We will parse it flexibly.
                response_format: { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter API Error (Whale Alerts):", errorData);
            throw new Error(`Falha na busca de alertas de baleias via IA: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("A resposta da IA para alertas de baleias está vazia.");
        }

        try {
            let parsedJson: WhaleAlert[];
            const trimmedContent = content.trim();

            if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
                 parsedJson = JSON.parse(trimmedContent);
            } else {
                // If the AI wrapped the array in an object, e.g. {"alerts": [...]}, extract it.
                const potentialObject = JSON.parse(trimmedContent);
                const key = Object.keys(potentialObject).find(k => Array.isArray(potentialObject[k]));
                if(key) {
                    parsedJson = potentialObject[key];
                } else {
                    throw new Error("O JSON retornado pela IA não contém um array de alertas.");
                }
            }
            
            if (!Array.isArray(parsedJson)) {
                throw new Error("A resposta da IA não é um array de alertas válidos.");
            }

            return parsedJson.slice(0, 15); // Return up to 15, even though we ask for 5.
        } catch (parseError) {
            console.error("Failed to parse JSON from AI whale alert response:", content, parseError);
            throw new Error("Falha ao processar a resposta da IA para alertas de baleias. O formato é inválido.");
        }

    } catch (error) {
        console.error("Error fetching whale alerts from AI:", error);
        if (error instanceof Error) {
            throw new Error(`Falha ao obter alertas de baleias: ${error.message}`);
        }
        throw new Error("Ocorreu um erro desconhecido ao obter alertas de baleias da IA.");
    }
};
