const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Fetch failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
} 