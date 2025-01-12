import { SearchStrategy, Venue, VibePreferences } from '@/types';
import { searchNearbyVenues } from './google-places';
import { calculateDistance } from './maps-utils';

export class SearchService {
    private determineStrategy(locationPriority: number): SearchStrategy {
        if (locationPriority < 0.33) {
            return {
                type: 'EQUAL_DISTANCE',
                searchRadius: 2,    // 2km around midpoint
                minRating: 4.0,
                minReviews: 50
            };
        } else if (locationPriority > 0.66) {
            return {
                type: 'ENTERTAINMENT_DISTRICT',
                searchRadius: 5,    // 5km to find districts
                minRating: 3.5,
                minReviews: 25
            };
        } else {
            return {
                type: 'BALANCED',
                searchRadius: 3,    // 3km balanced approach
                minRating: 3.8,
                minReviews: 35
            };
        }
    }

    private calculateDistanceScore(venue: Venue, locationA: LatLng, locationB: LatLng): number {
        const distanceToA = calculateDistance(venue.location, locationA);
        const distanceToB = calculateDistance(venue.location, locationB);
        const totalDistance = calculateDistance(locationA, locationB);

        // Perfect score when distances are equal
        const difference = Math.abs(distanceToA - distanceToB);
        return 1 - (difference / totalDistance);
    }

    private async calculateDistrictScore(venue: Venue, allVenues: Venue[]): Promise<number> {
        const DISTRICT_RADIUS = 500; // 500m radius for district analysis

        const nearbyVenues = allVenues.filter(v =>
            v.id !== venue.id &&
            calculateDistance(venue.location, v.location) <= DISTRICT_RADIUS
        );

        if (nearbyVenues.length === 0) return 0;

        const averageRating = nearbyVenues.reduce((sum, v) => sum + v.rating, 0) / nearbyVenues.length;
        const density = Math.min(nearbyVenues.length / 10, 1); // Cap at 10 venues

        return (density * 0.7) + (averageRating / 5 * 0.3);
    }

    async findVenues(params: SearchParams, preferences: VibePreferences): Promise<Venue[]> {
        const strategy = this.determineStrategy(preferences.locationPriority);

        // Initial venue search
        const venues = await searchNearbyVenues({
            ...params,
            radius: strategy.searchRadius,
            minRating: strategy.minRating,
            minReviews: strategy.minReviews
        });

        // Score and rank venues
        const scoredVenues = await Promise.all(venues.map(async venue => {
            const distanceScore = this.calculateDistanceScore(venue, params.locationA, params.locationB);
            const districtScore = await this.calculateDistrictScore(venue, venues);
            const vibeScore = this.calculateVibeScore(venue, preferences);

            const scores = {
                distanceBalance: distanceScore,
                districtVibrancy: districtScore,
                vibeMatch: vibeScore,
                baseQuality: venue.rating / 5,
                final: this.calculateFinalScore(
                    distanceScore,
                    districtScore,
                    vibeScore,
                    venue.rating / 5,
                    strategy.type,
                    preferences
                )
            };

            return { ...venue, scores };
        }));

        return scoredVenues.sort((a, b) => b.scores!.final - a.scores!.final);
    }
} 