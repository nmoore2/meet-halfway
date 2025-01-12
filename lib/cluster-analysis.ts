interface DateCluster {
    id: string;
    center: {
        lat: number;
        lng: number;
    };
    primaryVenues: VenueDetails[];
}

interface VenueDetails {
    place_id: string;
    name: string;
    rating: number;
    user_ratings_total: number;
    price_level?: number;
    types: string[];
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    photos?: string[];
    vicinity: string;
}

export async function findDateClusters(
    locationA: string,
    locationB: string,
    midpoint: { lat: number; lng: number },
    searchRadius: number
): Promise<DateCluster[]> {
    console.log('Finding date clusters...', { midpoint, searchRadius });

    // First, find high-quality primary venues (restaurants/bars)
    const primaryVenues = await findPrimaryVenues(midpoint, searchRadius);
    console.log(`Found ${primaryVenues.length} primary venues`);

    // Group primary venues into potential clusters
    const rawClusters = await groupIntoClusters(primaryVenues);
    console.log(`Identified ${rawClusters.length} potential clusters`);

    // Enrich clusters with nearby venue data
    const enrichedClusters = await Promise.all(
        rawClusters.map(cluster => enrichClusterData(cluster))
    );

    // Score and sort clusters
    const scoredClusters = await scoreAndSortClusters(
        enrichedClusters,
        locationA,
        locationB
    );

    return scoredClusters.slice(0, 5); // Return top 5 clusters
}

async function findPrimaryVenues(
    midpoint: { lat: number; lng: number },
    searchRadius: number
): Promise<VenueDetails[]> {
    // Search for high-quality restaurants and bars
    const searchTypes = ['restaurant', 'bar'];
    const venues: VenueDetails[] = [];

    for (const type of searchTypes) {
        const response = await searchNearbyPlaces(midpoint, searchRadius, type);

        // Filter for high-quality venues
        const qualityVenues = response.filter((venue: VenueDetails) =>
            venue.rating >= 4.0 &&
            venue.user_ratings_total >= 100
        );

        venues.push(...qualityVenues);
    }

    return venues;
}

async function groupIntoClusters(
    venues: VenueDetails[]
): Promise<DateCluster[]> {
    const clusters: DateCluster[] = [];
    const processed = new Set<string>();

    for (const venue of venues) {
        if (processed.has(venue.place_id)) continue;

        // Find nearby primary venues (within 0.2 miles)
        const nearbyPrimary = venues.filter(v =>
            v.place_id !== venue.place_id &&
            !processed.has(v.place_id) &&
            calculateDistance(
                venue.geometry.location,
                v.geometry.location
            ) <= 0.2
        );

        // If we have enough nearby venues, create a cluster
        if (nearbyPrimary.length >= 2) {
            const cluster: DateCluster = {
                id: `cluster-${venue.place_id}`,
                center: venue.geometry.location,
                primaryVenues: [venue, ...nearbyPrimary],
                nearbyVenues: [],
                score: 0,
                metrics: {
                    varietyScore: 0,
                    qualityScore: 0,
                    densityScore: 0,
                    averageRating: 0
                }
            };

            clusters.push(cluster);

            // Mark these venues as processed
            processed.add(venue.place_id);
            nearbyPrimary.forEach(v => processed.add(v.place_id));
        }
    }

    return clusters;
}

async function enrichClusterData(
    cluster: DateCluster
): Promise<DateCluster> {
    // Find supporting venues within walking distance (0.25 miles)
    const supportingTypes = [
        'cafe',
        'park',
        'movie_theater',
        'art_gallery',
        'ice_cream_shop',
        'dessert',
        'bowling_alley'
    ];

    const nearbyVenues: VenueDetails[] = [];

    for (const type of supportingTypes) {
        const response = await searchNearbyPlaces(
            cluster.center,
            0.25, // quarter mile radius
            type
        );

        // Filter out venues already in primaryVenues
        const newVenues = response.filter(venue =>
            !cluster.primaryVenues.some(p => p.place_id === venue.place_id)
        );

        nearbyVenues.push(...newVenues);
    }

    return {
        ...cluster,
        nearbyVenues
    };
}

async function scoreAndSortClusters(
    clusters: DateCluster[],
    locationA: string,
    locationB: string
): Promise<DateCluster[]> {
    const scoredClusters = await Promise.all(clusters.map(async cluster => {
        // Calculate component scores
        const varietyScore = calculateVarietyScore(cluster);
        const qualityScore = calculateQualityScore(cluster);
        const densityScore = calculateDensityScore(cluster);
        const averageRating = calculateAverageRating(cluster.primaryVenues);

        // Get drive times to cluster center
        const driveTimes = await calculateDriveTimes(
            cluster.center,
            locationA,
            locationB
        );

        // Calculate drive time balance (how equal the times are)
        const driveTimeBalance = calculateDriveTimeBalance(driveTimes);

        // Weighted scoring
        const score = (
            varietyScore * 0.25 +
            qualityScore * 0.25 +
            densityScore * 0.25 +
            driveTimeBalance * 0.25
        );

        return {
            ...cluster,
            score,
            metrics: {
                varietyScore,
                qualityScore,
                densityScore,
                averageRating
            }
        };
    }));

    // Sort by score (highest first)
    return scoredClusters.sort((a, b) => b.score - a.score);
}

// Helper functions
function calculateVarietyScore(cluster: DateCluster): number {
    const allVenues = [...cluster.primaryVenues, ...cluster.nearbyVenues];
    const uniqueTypes = new Set(allVenues.flatMap(v => v.types));
    return Math.min(uniqueTypes.size / 10, 1); // Cap at 10 unique types
}

function calculateQualityScore(cluster: DateCluster): number {
    return cluster.primaryVenues.reduce((sum, venue) =>
        sum + (venue.rating || 0), 0
    ) / (cluster.primaryVenues.length * 5);
}

function calculateDensityScore(cluster: DateCluster): number {
    const totalVenues = cluster.primaryVenues.length + cluster.nearbyVenues.length;
    return Math.min(totalVenues / 15, 1); // Cap at 15 total venues
}

function calculateAverageRating(venues: VenueDetails[]): number {
    const validRatings = venues.filter(v => v.rating);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, v) => sum + v.rating, 0) / validRatings.length;
}

async function calculateDriveTimes(
    center: { lat: number; lng: number },
    locationA: string,
    locationB: string
): Promise<{ timeA: number; timeB: number }> {
    // Implementation using Google Distance Matrix API
    // ... (we can implement this next)
    return { timeA: 0, timeB: 0 };
}

function calculateDriveTimeBalance(
    driveTimes: { timeA: number; timeB: number }
): number {
    const { timeA, timeB } = driveTimes;
    const maxTime = Math.max(timeA, timeB);
    const minTime = Math.min(timeA, timeB);
    return minTime / maxTime; // 1 is perfect balance, lower numbers mean more imbalance
} 