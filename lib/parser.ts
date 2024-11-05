interface Venue {
    name: string;
    address: string;
    bestFor?: string;
    why?: string;
}

export function parseVenues(text: string) {
    console.log('Raw GPT Response:', text); // Debug log

    const venues: Array<{
        name: string;
        address: string;
        bestFor: string;
        why: string;
        price_level: string;
    }> = [];

    // Split the text into venue blocks
    const venueBlocks = text.split(/\d+\.\s+\*\*/);

    // Skip the first empty block if it exists
    const blocks = venueBlocks.slice(1);

    blocks.forEach((block) => {
        try {
            // Extract venue name
            const nameMatch = block.match(/([^*]+)\*\*/);
            const name = nameMatch ? nameMatch[1].trim() : '';

            // Extract address
            const addressMatch = block.match(/Address:\s*([^\n]+)/);
            const address = addressMatch ? addressMatch[1].trim() : '';

            // Extract Best for
            const bestForMatch = block.match(/Best for:\s*([^\n]+)/);
            const bestFor = bestForMatch ? bestForMatch[1].trim() : '';

            // Extract Why
            const whyMatch = block.match(/Why:\s*([^\n]+(?:\n[^\n-][^\n]+)*)/);
            const why = whyMatch ? whyMatch[1].trim() : '';

            // Extract Price Level
            const priceMatch = block.match(/Price Level:\s*(\$+)/);
            const price_level = priceMatch ? priceMatch[1] : '';

            console.log('Parsed Venue:', { // Debug log
                name,
                address,
                bestFor,
                why,
                price_level
            });

            if (name && address) {
                venues.push({
                    name,
                    address,
                    bestFor,
                    why,
                    price_level
                });
            }
        } catch (error) {
            console.error('Error parsing venue block:', error);
            console.error('Problematic block:', block);
        }
    });

    console.log('Final parsed venues:', venues); // Debug log
    return venues;
} 