import { SearchStrategy, Venue, VibePreferences, LatLng, SearchParams } from '../types';
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
        const distanceToA = calculateDistance(venue.geometry.location, locationA);
        const distanceToB = calculateDistance(venue.geometry.location, locationB);
        const totalDistance = calculateDistance(locationA, locationB);

        // Perfect score when distances are equal
        const difference = Math.abs(distanceToA - distanceToB);
        return 1 - (difference / totalDistance);
    }

    private async calculateDistrictScore(venue: Venue, allVenues: Venue[]): Promise<number> {
        const DISTRICT_RADIUS = 500; // 500m radius for district analysis

        const nearbyVenues = allVenues.filter(v =>
            v.place_id !== venue.place_id &&
            calculateDistance(venue.geometry.location, v.geometry.location) <= DISTRICT_RADIUS
        );

        if (nearbyVenues.length === 0) return 0;

        const averageRating = nearbyVenues.reduce((sum, v) => sum + v.rating, 0) / nearbyVenues.length;
        const density = Math.min(nearbyVenues.length / 10, 1); // Cap at 10 venues

        return (density * 0.7) + (averageRating / 5 * 0.3);
    }

    private calculateVibeScore(venue: Venue, preferences: VibePreferences): number {
        // Implement vibe matching logic based on venue attributes and user preferences
        // This is a placeholder - we'll implement the actual logic next
        return 0.5;
    }

    private calculateFinalScore(
        distanceScore: number,
        districtScore: number,
        vibeScore: number,
        baseQuality: number,
        strategyType: SearchStrategy['type'],
        preferences: VibePreferences
    ): number {
        switch (strategyType) {
            case 'EQUAL_DISTANCE':
                return (distanceScore * 0.5) + (vibeScore * 0.3) + (baseQuality * 0.2);
            case 'ENTERTAINMENT_DISTRICT':
                return (districtScore * 0.5) + (vibeScore * 0.3) + (baseQuality * 0.2);
            case 'BALANCED':
                return (distanceScore * 0.3) + (districtScore * 0.3) + (vibeScore * 0.2) + (baseQuality * 0.2);
            default:
                return baseQuality;
        }
    }

    async findVenues(params: SearchParams, preferences: VibePreferences): Promise<Venue[]> {
        const strategy = this.determineStrategy(preferences.locationPriority);

        // Initial venue search with complete params
        const searchParams: SearchParams = {
            ...params,
            maxResults: 30,
            minRating: strategy.minRating,
            minReviews: strategy.minReviews,
            radius: strategy.searchRadius
        };

        const venues = await searchNearbyVenues(searchParams);

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