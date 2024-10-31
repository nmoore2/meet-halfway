import { NextResponse } from 'next/server';
import { getRecommendedVenues } from '../../../lib/openai';
import { getPlaceDetails } from '../../../lib/google-places';

export async function POST(request: Request) {
    try {
        const searchData = await request.json();
        const { activityType, meetupType, priceRange } = searchData;

        // Get recommendations
        const chatResponse = await getRecommendedVenues(activityType, meetupType, priceRange);

        // Ensure we have an array of venues
        const venues = Array.isArray(chatResponse) ? chatResponse : parseVenueRecommendations(chatResponse);

        if (!venues || !Array.isArray(venues) || venues.length === 0) {
            throw new Error('No valid venues found');
        }

        // Process each venue
        const enrichedVenues = await Promise.all(
            venues.map(async (venue) => {
                try {
                    const placeDetails = await getPlaceDetails(venue.name, venue.address);
                    return {
                        ...venue,
                        photos: placeDetails.photos || [],
                        location: placeDetails.geometry?.location || null,
                        price: placeDetails.price_level ? '$'.repeat(placeDetails.price_level) : '$'
                    };
                } catch (error) {
                    console.error(`Error enriching venue ${venue.name}:`, error);
                    return venue;
                }
            })
        );

        return NextResponse.json({
            success: true,
            suggestions: enrichedVenues
        });

    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to find meeting spots'
        }, { status: 500 });
    }
}

function parseVenueRecommendations(response: string): Array<any> {
    try {
        // Split the response into venue blocks
        const venues = [];
        let currentVenue: any = {};

        const lines = response.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();

            // Start of new venue
            if (trimmedLine.match(/^\d+\.$/)) {
                if (Object.keys(currentVenue).length > 0) {
                    venues.push(currentVenue);
                }
                currentVenue = {};
                continue;
            }

            // Parse venue details
            if (trimmedLine.startsWith('• Name:')) {
                currentVenue.name = trimmedLine.replace('• Name:', '').trim();
            } else if (trimmedLine.startsWith('• Address:')) {
                currentVenue.address = trimmedLine.replace('• Address:', '').trim();
            } else if (trimmedLine.startsWith('• Best for:')) {
                currentVenue.bestFor = trimmedLine.replace('• Best for:', '').trim();
            } else if (trimmedLine.startsWith('• Why:')) {
                currentVenue.why = trimmedLine.replace('• Why:', '').trim();
            }
        }

        // Add the last venue
        if (Object.keys(currentVenue).length > 0) {
            venues.push(currentVenue);
        }

        console.log('Parsed venues:', venues);
        return venues;
    } catch (error) {
        console.error('Error parsing venues:', error);
        return [];
    }
}