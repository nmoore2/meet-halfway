import { LatLng } from '../types';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    try {
        const response = await fetch(url);
        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying fetch... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

export async function calculateDrivingMidpoint(
    location1: string,
    location2: string
): Promise<LatLng> {
    try {
        // Get the route between the two locations
        const url = `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${encodeURIComponent(location1)}` +
            `&destination=${encodeURIComponent(location2)}` +
            `&key=${GOOGLE_MAPS_KEY}`;

        const response = await fetchWithRetry(url);
        const directionsResponse = await response.json();

        if (directionsResponse.status !== 'OK') {
            console.error('Directions API error:', directionsResponse);
            // Fall back to geometric midpoint if directions fail
            return calculateGeometricMidpoint(location1, location2);
        }

        // Get the midpoint along the route
        const route = directionsResponse.routes[0].legs[0];
        const totalDistance = route.distance.value;
        const steps = route.steps;

        let distanceCovered = 0;
        for (const step of steps) {
            distanceCovered += step.distance.value;
            if (distanceCovered >= totalDistance / 2) {
                return step.start_location;
            }
        }

        // Fallback to geometric midpoint if something goes wrong
        return calculateGeometricMidpoint(location1, location2);

    } catch (error) {
        console.error('Error calculating driving midpoint:', error);
        // Fallback to geometric midpoint
        return calculateGeometricMidpoint(location1, location2);
    }
}

async function calculateGeometricMidpoint(location1: string, location2: string): Promise<LatLng> {
    try {
        // Get coordinates for both locations
        const [loc1Coords, loc2Coords] = await Promise.all([
            getCoordinates(location1),
            getCoordinates(location2)
        ]);

        return {
            lat: (loc1Coords.lat + loc2Coords.lat) / 2,
            lng: (loc1Coords.lng + loc2Coords.lng) / 2
        };
    } catch (error) {
        console.error('Error calculating geometric midpoint:', error);
        throw error;
    }
}

async function getCoordinates(location: string): Promise<LatLng> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(location)}` +
        `&key=${GOOGLE_MAPS_KEY}`;

    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        throw new Error(`Geocoding failed for ${location}`);
    }

    return data.results[0].geometry.location;
} 