interface Venue {
    name: string;
    address: string;
    bestFor: string;
    why: string;
    travelContext?: string;
}

export function parseVenues(response: string) {
    try {
        // Split the response into individual venue sections
        const venues = response.split('Name:').slice(1);

        return venues.map(venue => {
            // Extract venue details using regex and clean up any asterisks
            const nameMatch = venue.match(/^(.*?)(?=Address:|$)/s);
            const addressMatch = venue.match(/Address:\s*(.*?)(?=Best For:|$)/s);
            const bestForMatch = venue.match(/Best For:\s*(.*?)(?=Why:|$)/s);
            const whyMatch = venue.match(/Why:\s*(.*?)(?=$)/s);

            if (!nameMatch || !addressMatch || !bestForMatch || !whyMatch) {
                console.log('Failed to parse venue:', venue);
                return null;
            }

            // Clean up any asterisks from the text
            const cleanText = (text: string) => text.replace(/\*/g, '').trim();

            return {
                name: cleanText(nameMatch[1]),
                address: cleanText(addressMatch[1]),
                bestFor: cleanText(bestForMatch[1]),
                why: cleanText(whyMatch[1])
            };
        }).filter(venue => venue !== null);
    } catch (error) {
        console.error('Error parsing venues:', error);
        console.log('Raw response:', response);
        return [];
    }
} 