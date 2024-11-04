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
    const halfDistance = totalDistance / 2;

    for (const step of steps) {
        distanceSoFar += step.distance.value;
        if (distanceSoFar >= halfDistance) {
            const midpoint = {
                lat: step.end_location.lat,
                lng: step.end_location.lng,
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
            console.log('===========================================\n');

            return midpoint;
        }
    }

    throw new Error('Could not calculate midpoint');
} 