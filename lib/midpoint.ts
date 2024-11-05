interface Midpoint {
    lat: number;
    lng: number;
    searchRadius: number;
    totalDistance: number;
    routePolyline?: string;
}

export async function calculateDrivingMidpoint(location1: string, location2: string): Promise<Midpoint> {
    const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_KEY) throw new Error('Google Maps API key not found');

    // Get the route between the two locations
    const directionsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(location1)}&destination=${encodeURIComponent(location2)}&key=${GOOGLE_MAPS_KEY}`
    ).then(res => res.json());

    if (!directionsResponse.routes?.[0]?.legs?.[0]) {
        throw new Error('Could not find route between locations');
    }

    const route = directionsResponse.routes[0].legs[0];
    const totalDistance = route.distance.value; // in meters
    const steps = route.steps;

    // Find the step that contains the midpoint
    let distanceSoFar = 0;
    let previousDistance = 0;  // Track the previous step's distance
    const halfDistance = totalDistance / 2;

    for (const step of steps) {
        const stepDistance = step.distance.value;
        distanceSoFar += stepDistance;

        if (distanceSoFar >= halfDistance) {
            // Calculate how far along this step the midpoint should be
            const fraction = (halfDistance - previousDistance) / stepDistance;

            // Interpolate between start and end coordinates
            const lat = step.start_location.lat + (step.end_location.lat - step.start_location.lat) * fraction;
            const lng = step.start_location.lng + (step.end_location.lng - step.start_location.lng) * fraction;

            const midpoint = {
                lat,
                lng,
                searchRadius: (totalDistance / 1609.34) * 0.15, // 15% of total distance in miles
                totalDistance: totalDistance / 1609.34, // total distance in miles
                routePolyline: directionsResponse.routes[0].overview_polyline.points
            };

            console.log('\n===========================================');
            console.log('🚗 ROUTE-BASED CALCULATIONS');
            console.log('===========================================');
            console.log('Total Distance:', midpoint.totalDistance.toFixed(2), 'miles');
            console.log('Time-Based Midpoint:', midpoint);
            console.log('Search Radius:', midpoint.searchRadius.toFixed(2), 'miles');
            console.log('\n🗺️ Google Maps Link:');
            console.log(`https://www.google.com/maps?q=${midpoint.lat},${midpoint.lng}`);
            console.log('\n🔍 Route Overview:');
            console.log(`https://www.google.com/maps/dir/${encodeURIComponent(location1)}/${midpoint.lat},${midpoint.lng}/${encodeURIComponent(location2)}`);
            console.log('===========================================\n');

            return midpoint;
        }
        previousDistance = distanceSoFar;
    }

    throw new Error('Could not calculate midpoint');
} 