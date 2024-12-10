interface Midpoint {
    lat: number;
    lng: number;
    searchRadius: number;
    totalDistance: number;
    routePolyline?: string;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const routeCache = new Map<string, { timestamp: number; data: any }>();

export async function calculateDrivingMidpoint(location1: string, location2: string): Promise<Midpoint> {
    // Check if we're in development
    if (process.env.NODE_ENV === 'development') {
        const cacheKey = `${location1}-${location2}`;
        const cached = routeCache.get(cacheKey);

        if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
            console.log('🎯 Using cached route data');
            return cached.data;
        }
    }

    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_KEY) throw new Error('Google Maps API key not found');

    // Get the route between the two locations
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(location1)}&destination=${encodeURIComponent(location2)}&key=${GOOGLE_MAPS_KEY}`
    );
    const directionsResponse = await response.json();

    if (directionsResponse.status !== 'OK') {
        console.error('Directions API error:', directionsResponse.status, directionsResponse.error_message);
        throw new Error(`Unable to find route: ${directionsResponse.status}`);
    }

    if (!directionsResponse.routes?.[0]?.legs?.[0]) {
        console.error('No route found between locations:', location1, location2);
        throw new Error('Could not find a driving route between these locations. Please check the addresses and try again.');
    }

    const route = directionsResponse.routes[0].legs[0];
    const totalDistance = route.distance.value; // in meters
    const steps = route.steps;

    // Find the step that contains the midpoint
    let distanceSoFar = 0;
    let previousDistance = 0;
    const halfDistance = totalDistance / 2;

    for (const step of steps) {
        const stepDistance = step.distance.value;
        distanceSoFar += stepDistance;

        if (distanceSoFar >= halfDistance) {
            // Calculate how far along this step the midpoint should be
            const fraction = (halfDistance - previousDistance) / stepDistance;
            const lat = step.start_location.lat + (step.end_location.lat - step.start_location.lat) * fraction;
            const lng = step.start_location.lng + (step.end_location.lng - step.start_location.lng) * fraction;

            const midpoint = {
                lat,
                lng,
                searchRadius: (totalDistance / 1609.34) * .15, // 15% of total distance in miles
                totalDistance: totalDistance / 1609.34, // total distance in miles
                routePolyline: directionsResponse.routes[0].overview_polyline.points
            };

            // Enhanced logging
            console.log('\n===========================================');
            console.log('🚗 ROUTE ANALYSIS');
            console.log('===========================================');
            console.log(`Total Route Distance: ${midpoint.totalDistance.toFixed(2)} miles`);
            console.log(`Search Radius: ${midpoint.searchRadius.toFixed(2)} miles`);
            console.log(`Location A: ${location1}`);
            console.log(`Location B: ${location2}`);

            // Log Google Maps links
            console.log('\n🗺️ MAPS LINKS:');
            console.log(`Midpoint: https://www.google.com/maps?q=${midpoint.lat},${midpoint.lng}`);
            console.log(`Full Route: https://www.google.com/maps/dir/${encodeURIComponent(location1)}/${midpoint.lat},${midpoint.lng}/${encodeURIComponent(location2)}`);

            // Log drive time analysis
            console.log('\n⏱️ DRIVE TIME ANALYSIS:');
            console.log(`Distance to midpoint from ${location1}: ${(totalDistance / 2 / 1609.34).toFixed(2)} miles`);
            console.log(`Distance to midpoint from ${location2}: ${(totalDistance / 2 / 1609.34).toFixed(2)} miles`);
            console.log('===========================================\n');

            if (process.env.NODE_ENV === 'development') {
                const cacheKey = `${location1}-${location2}`;
                routeCache.set(cacheKey, {
                    timestamp: Date.now(),
                    data: midpoint
                });
                console.log('🔄 Caching route data');
            }

            return midpoint;
        }
        previousDistance = distanceSoFar;
    }

    throw new Error('Could not calculate midpoint');
} 