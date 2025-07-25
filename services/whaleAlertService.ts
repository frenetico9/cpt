import { WhaleAlert } from '../types';

const WHALE_ALERT_RSS_URL = 'https://feeds.whale-alert.io/rss.xml';

// This function correctly parses the specific title format from Whale Alert
const parseTitle = (title: string): Partial<Omit<WhaleAlert, 'id' | 'date' | 'title'>> | null => {
    // Example: 1,000,000,000 #DOGE (123,456,789 USD) transferred from #Robinhood to unknown wallet
    const transferRegex = /([\d,.]+) #(\w+) \(([\d,.]+) USD\) transferred from (.*) to (.*)/;
    const transferMatch = title.match(transferRegex);

    if (transferMatch) {
        const [, amountCoinStr, coin, amountUSDStr, from, to] = transferMatch;
        return {
            coin: coin,
            amountCoin: parseFloat(amountCoinStr.replace(/,/g, '')),
            amountUSD: parseFloat(amountUSDStr.replace(/,/g, '')),
            from: from.trim(),
            to: to.trim(),
        };
    }
    
    // Return null for titles that don't match the expected transfer format
    return null;
};


export const fetchWhaleAlerts = async (): Promise<WhaleAlert[]> => {
    // New Strategy: Fetch the raw XML via a reliable CORS proxy and parse it client-side.
    // This removes dependency on unreliable RSS-to-JSON services.
    const encodedUrl = encodeURIComponent(WHALE_ALERT_RSS_URL);
    const proxyUrl = `https://api.allorigins.win/get?url=${encodedUrl}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`CORS Proxy Error: Responded with status ${response.status}.`, errorBody);
            throw new Error(`O serviço de proxy CORS (allorigins.win) retornou um erro: ${response.status}`);
        }
        
        const data = await response.json();
        const xmlString = data.contents;
        
        if (!xmlString) {
             throw new Error("O proxy CORS não retornou conteúdo do feed.");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        if (xmlDoc.getElementsByTagName("parsererror").length) {
            throw new Error("Falha ao analisar o XML do feed de alertas de baleias.");
        }

        const items = xmlDoc.querySelectorAll('item');
        const alerts: WhaleAlert[] = [];

        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const parsedData = parseTitle(title);

            if (parsedData) {
                 const guid = item.querySelector('guid')?.textContent || `whale_${Math.random()}`;
                 const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

                 alerts.push({
                    id: guid,
                    title,
                    date: new Date(pubDate).toISOString(),
                    ...parsedData
                } as WhaleAlert);
            }
        });
        
        return alerts.slice(0, 15);

    } catch (error) {
        console.error("Full error details in fetchWhaleAlerts:", error);
         if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error("Falha de rede ao buscar alertas. Verifique sua conexão e se o proxy (allorigins.win) está online.");
        }
        if (error instanceof Error) {
            throw error; // Re-throw the specific error message from above
        }
        throw new Error("Ocorreu um erro desconhecido ao processar os alertas de baleias.");
    }
};