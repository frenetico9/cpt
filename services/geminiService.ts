import { GoogleGenAI, Type } from "@google/genai";
import { CryptoPair, TechnicalAnalysis, FullAnalysis } from '../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.OBJECT,
            properties: {
                suggestion: { type: Type.STRING, description: "Pode ser 'COMPRA', 'VENDA', ou 'NEUTRO'." },
                justification: { type: Type.STRING, description: "Explicação detalhada combinando análise técnica e de sentimento." },
                entryPoint: { type: Type.NUMBER },
                stopLoss: { type: Type.NUMBER },
                takeProfit: { type: Type.NUMBER },
                risk: { type: Type.STRING, description: "Pode ser 'BAIXO', 'MÉDIO', ou 'ALTO'." }
            },
        },
        news: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING, description: "Manchete da notícia." },
                    source: { type: Type.STRING, description: "Fonte, ex: 'Reuters'." },
                    sentiment: { type: Type.STRING, description: "Pode ser 'Positivo', 'Negativo', ou 'Neutro'." }
                },
            }
        },
        overallSentiment: { type: Type.STRING, description: "Sentimento geral ('Positivo', 'Negativo', 'Neutro') baseado nas notícias." }
    }
};


const generatePrompt = (pair: CryptoPair, tech: TechnicalAnalysis) => {
    return `
      Você é um analista de criptomoedas sênior e um agregador de notícias financeiras para o app 'Crypto IA Analyst'.
      Sua tarefa é realizar uma análise completa e integrada para o par ${pair}.

      O processo tem três etapas:
      1.  **Busca e Análise de Notícias:** Encontre 3-4 manchetes de notícias REAIS e recentes (últimos dias) para ${pair}. Para cada uma, determine a fonte e o sentimento ('Positivo', 'Negativo', 'Neutro'). Com base nelas, defina um 'overallSentiment'.
      2.  **Análise Técnica:** Analise os dados técnicos fornecidos abaixo.
      3.  **Conclusão e Recomendação:** Combine o sentimento das notícias com a análise técnica para gerar uma recomendação de negociação final ('analysis'). A justificativa deve explicar COMO as notícias e os indicadores técnicos levaram à sua decisão. O resultado deve ser retornado no formato JSON definido no schema.

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

      Agora, gere sua análise completa no formato JSON solicitado.
    `;
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCryptoAnalysis = async (
  pair: CryptoPair,
  technicalData: TechnicalAnalysis
): Promise<FullAnalysis> => {
  const prompt = generatePrompt(pair, technicalData);

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const content = response.text;

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
    console.error("Error fetching analysis from Gemini API:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly message for common API key issues
        if (error.message.includes('API key')) {
            return Promise.reject(new Error("Falha na chamada à API Gemini: A chave de API é inválida ou está faltando."));
        }
        throw new Error(`Falha na chamada à API Gemini: ${error.message}`);
    }
    throw new Error("Falha ao obter análise da IA. Verifique a conexão ou a API Gemini.");
  }
};