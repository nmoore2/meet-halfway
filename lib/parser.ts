interface Venue {
    name: string;
    address: string;
    bestFor?: string;
    why?: string;
}

export function parseVenues(content: string): Venue[] {
    if (!content) return [];

    const venues: Venue[] = [];

    // Split on numbered items (1., 2., etc)
    const venueBlocks = content.split(/\d+\.\s+\*\*/).filter(block => block.trim());

    for (const block of venueBlocks) {
        try {
            // Extract name (between ** and **)
            const nameMatch = block.match(/([^*]+)\*\*/);
            if (!nameMatch) continue;

            // Extract address (after "Address: " or between hyphens)
            const addressMatch = block.match(/Address:\s*([^,]+,[^,]+,[^,]+(?:,[^,]+)?)|[-–]\s*Address:\s*([^,]+,[^,]+,[^,]+(?:,[^,]+)?)/);
            if (!addressMatch) continue;

            const name = nameMatch[1].trim();
            const address = (addressMatch[1] || addressMatch[2]).trim();

            // Extract description if available
            const descriptionMatch = block.match(/Description:\s*([^.]+(?:\.[^.]+)*)/);
            const why = descriptionMatch ? descriptionMatch[1].trim() : undefined;

            venues.push({
                name,
                address,
                why
            });

            console.log(`Successfully parsed venue: ${name}`);
        } catch (error) {
            console.error('Error parsing venue block:', error);
            console.log('Block content:', block);
            continue;
        }
    }

    return venues;
} 