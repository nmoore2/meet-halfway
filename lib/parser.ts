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
            // Extract venue details using regex
            const nameMatch = venue.match(/^(.*?)(?=Address:|$)/s);
            const addressMatch = venue.match(/Address:\s*(.*?)(?=Best For:|$)/s);
            const bestForMatch = venue.match(/Best For:\s*(.*?)(?=Why:|$)/s);
            const whyMatch = venue.match(/Why:\s*(.*?)(?=$)/s);

            if (!nameMatch || !addressMatch || !bestForMatch || !whyMatch) {
                console.log('Failed to parse venue:', venue);
                return null;
            }

            return {
                name: nameMatch[1].trim(),
                address: addressMatch[1].trim(),
                bestFor: bestForMatch[1].trim(),
                why: whyMatch[1].trim()
            };
        }).filter(venue => venue !== null); // Remove any failed parses
    } catch (error) {
        console.error('Error parsing venues:', error);
        console.log('Raw response:', response);
        return [];
    }
} 