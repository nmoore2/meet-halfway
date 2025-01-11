import { NextResponse } from 'next/server';
import { searchNearbyVenues } from '../../../lib/google-places';
import { calculateGeometricMidpoint, calculateDrivingMidpoint } from '../../../lib/midpoint';
import { ClusterService } from '../../../services/ClusterService';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Get the midpoint and geocoded locations
        const midpoint = await calculateDrivingMidpoint(data.location1, data.location2);
        const [locationA, locationB] = await Promise.all([
            geocodeLocation(data.location1),
            geocodeLocation(data.location2)
        ]);

        // Calculate search radius based on total distance
        const searchRadius = Math.max(5, Math.min(15, midpoint.totalDistance / 3));

        // Get venues from Google Places
        const venues = await searchNearbyVenues(
            midpoint,
            searchRadius,
            data.activityType,
            data.priceRange,
            data.location1,
            data.location2,
            30  // Get more venues for better filtering
        );

        // Score and filter venues using ClusterService
        const clusterService = new ClusterService(locationA, locationB);
        const scoredVenues = await clusterService.findVenues(venues, data.preferences);

        return NextResponse.json({
            success: true,
            suggestions: scoredVenues,
            midpoint: midpoint
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({
            error: "Something went wrong while finding meeting spots. Please try again.",
            suggestions: []
        }, { status: 500 });
    }
}

async function geocodeLocation(address: string): Promise<{ lat: number; lng: number }> {
    if (!address) {
        throw new Error('No address provided for geocoding');
    }

    console.log(`Geocoding address: "${address}"`);

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('Geocoding API response:', {
        status: data.status,
        resultCount: data.results?.length,
        firstResult: data.results?.[0]
    });

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
        console.error('Geocoding failed:', {
            address,
            status: data.status,
            error_message: data.error_message
        });
        throw new Error(`Could not geocode address: ${address}`);
    }

    const location = data.results[0].geometry.location;

    // Ensure we have valid numbers
    const result = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
    };

    if (isNaN(result.lat) || isNaN(result.lng)) {
        throw new Error(`Invalid coordinates for address: ${address}`);
    }

    console.log(`Successfully geocoded "${address}" to:`, result);
    return result;
}