export interface LatLng {
    lat: number;
    lng: number;
}

export interface VibePreferences {
    venueStyle: number;          // 0 = Casual & Creative, 1 = Refined & Elegant
    neighborhoodVibe: number;    // 0 = Artsy & Eclectic, 1 = Polished & Established
    locationPriority: number;    // 0 = Equal Distance, 1 = Entertainment Districts
}

export interface SearchStrategy {
    type: 'EQUAL_DISTANCE' | 'BALANCED' | 'ENTERTAINMENT_DISTRICT';
    searchRadius: number;
    minRating: number;
    minReviews: number;
}

export interface Venue {
    id?: string;
    place_id: string;
    name: string;
    vicinity: string;
    rating: number;
    user_ratings_total: number;
    price_level?: number;
    photos?: string[];
    geometry: {
        location: LatLng;
    };
    scores?: {
        distanceBalance: number;
        districtVibrancy: number;
        vibeMatch: number;
        baseQuality: number;
        final: number;
    };
    driveTimes?: {
        fromLocationA: number;
        fromLocationB: number;
    };
}

export interface SearchParams {
    locationA: LatLng;
    locationB: LatLng;
    midpoint: LatLng;
    radius: number;
    minRating: number;
    minReviews: number;
    activityType: string;
    priceRange: string;
    location1: string;
    location2: string;
    maxResults?: number;
}

export interface VenueScores {
    distanceBalance: number;
    districtVibrancy: number;
    vibeMatch: number;
    baseQuality: number;
    final: number;
}
