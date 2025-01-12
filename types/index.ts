export interface LatLng {
    lat: number;
    lng: number;
}

export interface VibePreferences {
    atmosphere: number;
    energy: number;
    locationPriority: number;
}

export interface SearchStrategy {
    type: 'EQUAL_DISTANCE' | 'ENTERTAINMENT_DISTRICT' | 'BALANCED';
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
