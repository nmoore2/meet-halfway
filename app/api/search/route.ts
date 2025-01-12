import { NextResponse } from 'next/server';
import { calculateDrivingMidpoint } from '../../../lib/midpoint';
import { SearchService } from '../../../lib/search-service';
import { LatLng, SearchParams } from '../../../types';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        console.log('Search request data:', {
            location1: data.location1,
            location2: data.location2,
            activityType: data.activityType,
            preferences: data.preferences,
            // Log any other relevant fields
        });

        // Validate required fields
        if (!data.location1 || !data.location2 || !data.activityType) {
            console.warn('Missing required fields:', { data });
            return NextResponse.json({
                error: "Missing required fields: locations and activity type are required",
                suggestions: []
            }, { status: 400 });
        }

        // Get the midpoint and geocoded locations
        const midpoint = await calculateDrivingMidpoint(data.location1, data.location2);
        const [locationA, locationB] = await Promise.all([
            geocodeLocation(data.location1),
            geocodeLocation(data.location2)
        ]);

        // Create search parameters
        const searchParams: SearchParams = {
            locationA,
            locationB,
            midpoint,
            radius: Math.max(5, Math.min(15, midpoint.totalDistance / 3)),
            minRating: 0,
            minReviews: 0,
            activityType: data.activityType,
            priceRange: data.priceRange,
            location1: data.location1,
            location2: data.location2,
            maxResults: 30
        };

        // Initialize search service and find venues
        const searchService = new SearchService();
        const venues = await searchService.findVenues(searchParams, data.preferences);

        // Get drive times for the top venues
        const venuesWithDriveTimes = await addDriveTimes(venues, data.location1, data.location2);

        return NextResponse.json({
            success: true,
            suggestions: venuesWithDriveTimes,
            midpoint: {
                lat: midpoint.lat,
                lng: midpoint.lng,
                searchRadius: searchParams.radius
            }
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({
            error: "Something went wrong while finding meeting spots. Please try again.",
            suggestions: []
        }, { status: 500 });
    }
}

async function geocodeLocation(address: string): Promise<LatLng> {
    if (!address) {
        throw new Error('No address provided for geocoding');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
        throw new Error(`Could not geocode address: ${address}`);
    }

    const location = data.results[0].geometry.location;
    return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
    };
}

async function addDriveTimes(venues: any[], location1: string, location2: string) {
    // Implementation of drive times calculation
    // This can be moved to a separate service if needed
    const BATCH_SIZE = 10;
    let processedVenues = [...venues];

    for (let i = 0; i < venues.length; i += BATCH_SIZE) {
        const batch = venues.slice(i, i + BATCH_SIZE);
        const destinations = batch.map(venue =>
            `${venue.geometry.location.lat},${venue.geometry.location.lng}`
        ).join('|');

        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.append('origins', `${location1}|${location2}`);
        url.searchParams.append('destinations', destinations);
        url.searchParams.append('mode', 'driving');
        url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK') {
            batch.forEach((venue, index) => {
                const fromA = data.rows[0].elements[index];
                const fromB = data.rows[1].elements[index];

                processedVenues[i + index] = {
                    ...venue,
                    driveTimes: {
                        fromLocationA: fromA.duration ? Math.round(fromA.duration.value / 60) : null,
                        fromLocationB: fromB.duration ? Math.round(fromB.duration.value / 60) : null
                    }
                };
            });
        }

        // Add delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < venues.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return processedVenues;
}