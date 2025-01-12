import { LatLng, VibePreferences } from '../types';

export class ClusterService {
    constructor(private locationA: LatLng, private locationB: LatLng) { }

    async findVenues(venues: any[], preferences: { locationPriority: number }) {
        // Similar scoring logic to SearchService
        const equidistanceScore = this.calculateEquidistanceScore(venue.geometry.location);
        const densityScore = this.calculateEntertainmentScore(venue, venues);
    }

    private calculateEquidistanceScore(location: LatLng): number {
        const distanceToA = this.calculateDistance(location, this.locationA);
        const distanceToB = this.calculateDistance(location, this.locationB);
        const totalDistance = this.calculateDistance(this.locationA, this.locationB);

        // Calculate how balanced the distances are
        const balanceScore = 1 - (Math.abs(distanceToA - distanceToB) / totalDistance);

        // Calculate distance from ideal midpoint
        const midpoint = {
            lat: (this.locationA.lat + this.locationB.lat) / 2,
            lng: (this.locationA.lng + this.locationB.lng) / 2
        };
        const distanceToMidpoint = this.calculateDistance(location, midpoint);
        const midpointScore = 1 - (distanceToMidpoint / (totalDistance / 2));

        // Combine scores with heavy weight on balance
        return Math.pow(balanceScore * 0.7 + midpointScore * 0.3, 2);
    }

    private calculateEntertainmentScore(venue: any, allVenues: any[]): number {
        const DISTRICT_RADIUS = 1000; // 1km radius
        const nearbyVenues = allVenues.filter(other =>
            other.place_id !== venue.place_id &&
            this.calculateDistance(venue.geometry.location, other.geometry.location) <= DISTRICT_RADIUS
        );

        // Score based on number of nearby venues
        const densityScore = Math.min(nearbyVenues.length / 10, 1);

        // Consider venue ratings
        const averageRating = nearbyVenues.reduce((sum, v) => sum + (v.rating || 0), 0) /
            (nearbyVenues.length || 1);
        const ratingScore = averageRating / 5;

        return Math.pow(densityScore * 0.7 + ratingScore * 0.3, 2);
    }

    private calculateDistance(point1: LatLng, point2: LatLng): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = point1.lat * Math.PI / 180;
        const φ2 = point2.lat * Math.PI / 180;
        const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
        const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}