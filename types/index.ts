export interface LatLng {
    lat: number;
    lng: number;
}

export interface VibePreferences {
    atmosphere: number;
    energy: number;
    locationPriority: number;
}

// Add any other shared types here that might be used across components
export interface Venue {
    // ... existing venue type if you have one
}

export interface Cluster {
    // ... existing cluster type if you have one
}
