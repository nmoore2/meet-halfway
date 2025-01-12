import { SearchStrategy, Venue, VibePreferences, LatLng, SearchParams } from '../types';
import { searchNearbyVenues } from './google-places';
import { calculateDistance } from './maps-utils';
import { VenueAnalyzer, VenueCluster } from './venue-analysis';

export class SearchService {
    private determineStrategy(locationPriority: number): SearchStrategy {
        // More granular strategy selection
        if (locationPriority < 0.3) {
            return {
                type: 'EQUAL_DISTANCE',
                searchRadius: 1.5,    // Tight 1.5km radius around midpoint
                minRating: 4.2,       // Higher quality threshold
                minReviews: 50
            };
        } else if (locationPriority < 0.7) {
            return {
                type: 'BALANCED',
                searchRadius: 3,      // Medium 3km radius
                minRating: 4.0,
                minReviews: 35
            };
        } else {
            return {
                type: 'ENTERTAINMENT_DISTRICT',
                searchRadius: 5,      // Wide 5km radius to find districts
                minRating: 3.8,       // More lenient rating for district venues
                minReviews: 25
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
        const DISTRICT_RADIUS = 300; // Tighter radius (300m) for district analysis

        const nearbyVenues = allVenues.filter(v =>
            v.place_id !== venue.place_id &&
            calculateDistance(venue.geometry.location, v.geometry.location) <= DISTRICT_RADIUS
        );

        if (nearbyVenues.length === 0) return 0;

        const averageRating = nearbyVenues.reduce((sum, v) => sum + v.rating, 0) / nearbyVenues.length;
        const density = Math.min(nearbyVenues.length / 5, 1); // Cap at 5 venues for tighter grouping

        // Higher weight on density for entertainment districts
        return (density * 0.8) + (averageRating / 5 * 0.2);
    }

    private calculateVibeScore(venue: Venue, preferences: VibePreferences): number {
        // Keywords that indicate a more artsy/trendy vibe
        const artsyTrendyIndicators = [
            'indie', 'art', 'creative', 'trendy', 'hip', 'vintage', 'local',
            'craft', 'unique', 'bohemian', 'casual'
        ];

        // Keywords that indicate a more upscale/polished vibe
        const upscalePolishedIndicators = [
            'upscale', 'elegant', 'refined', 'luxury', 'fine', 'exclusive',
            'sophisticated', 'premium', 'high-end', 'formal'
        ];

        // Get all the text we can analyze from the venue
        const venueText = [
            venue.name,
            venue.vicinity,
            ...(venue.types || [])
        ].join(' ').toLowerCase();

        // Count matches for each vibe type
        const artsyScore = artsyTrendyIndicators.reduce((score, keyword) =>
            score + (venueText.includes(keyword) ? 1 : 0), 0) / artsyTrendyIndicators.length;

        const upscaleScore = upscalePolishedIndicators.reduce((score, keyword) =>
            score + (venueText.includes(keyword) ? 1 : 0), 0) / upscalePolishedIndicators.length;

        // Factor in price level if available (higher price suggests more upscale)
        const priceScore = venue.price_level
            ? venue.price_level / 4  // Normalize to 0-1 range
            : 0.5;  // Default to middle if no price info

        // Combine scores
        const combinedScore = (artsyScore + upscaleScore + priceScore) / 3;

        // Calculate how well this matches user preference
        // preferences.atmosphere: 0 = Artsy & Trendy, 1 = Upscale & Polished
        const userPreference = preferences.atmosphere;

        // If user prefers artsy (low atmosphere value), we want higher artsyScore
        // If user prefers upscale (high atmosphere value), we want higher upscaleScore
        return userPreference < 0.5
            ? 1 - Math.abs(artsyScore - (1 - userPreference))
            : 1 - Math.abs(upscaleScore - userPreference);
    }

    private calculateFinalScore(
        distanceScore: number,
        districtScore: number,
        vibeScore: number,
        baseQuality: number,
        strategyType: SearchStrategy['type'],
        preferences: VibePreferences
    ): number {
        // Increase neighborhood character weight when user wants artsy/eclectic
        const isArtsyPreference = preferences.atmosphere < 0.5;
        const neighborhoodWeight = isArtsyPreference ? 0.5 : 0.3;
        const distanceWeight = (1 - preferences.locationPriority) * 0.3;
        const vibeWeight = 0.3;
        const qualityWeight = 0.1;

        // Boost artsy venues when that's the preference
        const adjustedVibeScore = isArtsyPreference
            ? vibeScore * 1.5  // Boost artsy venues
            : vibeScore;

        return (
            (distanceScore * distanceWeight) +
            (districtScore * neighborhoodWeight) +
            (adjustedVibeScore * vibeWeight) +
            (baseQuality * qualityWeight)
        );
    }

    async findVenues(params: SearchParams, preferences: VibePreferences): Promise<Venue[]> {
        console.log('\n========== 🔍 STARTING NEW SEARCH ==========');
        console.log('📍 Locations:', {
            A: params.location1,
            B: params.location2,
            midpoint: `${params.midpoint.lat}, ${params.midpoint.lng}`
        });
        console.log('🎯 Preferences:', {
            neighborhoodVibe: preferences.neighborhoodVibe < 0.5 ? 'Artsy & Eclectic' : 'Polished & Established',
            activityType: params.activityType,
            locationPriority: preferences.locationPriority
        });

        // Pass preferences to searchNearbyVenues
        const venues = await searchNearbyVenues({
            ...params,
            preferences: {
                venueStyle: preferences.venueStyle,
                neighborhoodVibe: preferences.neighborhoodVibe,
                locationPriority: preferences.locationPriority
            }
        });
        if (!venues.length) {
            console.log('❌ No venues found');
            return [];
        }

        console.log(`\n🏘️ Found ${venues.length} venues, analyzing neighborhoods...`);

        // Find and analyze clusters
        const clusters = await VenueAnalyzer.findClusters(venues);

        // Sort clusters by neighborhood character match
        const sortedClusters = clusters.sort((a, b) => {
            const aScore = preferences.neighborhoodVibe < 0.5 ?
                a.scores.vibeScores.artsy :
                a.scores.vibeScores.upscale;
            const bScore = preferences.neighborhoodVibe < 0.5 ?
                b.scores.vibeScores.artsy :
                b.scores.vibeScores.upscale;
            return bScore - aScore;
        });

        console.log('\n📊 Cluster Rankings:');
        sortedClusters.forEach((cluster, i) => {
            console.log(`\n${i + 1}. ${cluster.venues[0].vicinity}`);
            console.log('   Scores:', {
                artsy: `${Math.round(cluster.scores.vibeScores.artsy * 100)}%`,
                upscale: `${Math.round(cluster.scores.vibeScores.upscale * 100)}%`,
                entertainment: `${Math.round(cluster.scores.vibeScores.entertainment * 100)}%`
            });
            console.log('   Venues:', cluster.venues.map(v => v.name).join(', '));
        });

        // Return venues from sorted clusters
        const rankedVenues = sortedClusters.flatMap(cluster => cluster.venues);
        console.log('\n=========================================');

        return rankedVenues;
    }

    private async rankVenuesByDistance(
        venues: Venue[],
        params: SearchParams,
        preferences: VibePreferences
    ): Promise<Venue[]> {
        // Score and rank venues based on distance
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
                    'EQUAL_DISTANCE',
                    preferences
                )
            };

            return { ...venue, scores };
        }));

        return scoredVenues.sort((a, b) => b.scores!.final - a.scores!.final);
    }

    private async rankVenuesInClusters(
        clusters: VenueCluster[],
        preferences: VibePreferences
    ): Promise<Venue[]> {
        console.group('🎯 Ranking Venues');
        console.log(`Processing ${clusters.length} clusters`);

        // Flatten all venues from clusters and score them
        const allVenues = clusters.flatMap(cluster => cluster.venues);
        console.log(`Total venues: ${allVenues.length}`);

        const scoredVenues = allVenues.map(venue => {
            const cluster = clusters.find(c =>
                c.venues.some(v => v.place_id === venue.place_id)
            );

            if (!cluster) {
                console.warn('⚠️ Venue not found in any cluster:', venue.name);
                return venue;
            }

            const scores = {
                distanceBalance: 0.5,
                districtVibrancy: cluster.scores.density,
                vibeMatch: this.calculateVibeMatchScore(cluster.scores.vibeScores, preferences),
                baseQuality: venue.rating / 5,
                final: 0
            };

            scores.final = this.calculateFinalScore(
                scores.distanceBalance,
                scores.districtVibrancy,
                scores.vibeMatch,
                scores.baseQuality,
                'ENTERTAINMENT_DISTRICT',
                preferences
            );

            console.log(`📍 ${venue.name}: ${Math.round(scores.final * 100)}%`);
            return { ...venue, scores };
        });

        console.groupEnd();
        return scoredVenues.sort((a, b) => b.scores!.final - a.scores!.final);
    }

    private calculateVibeMatchScore(
        vibeScores: VenueCluster['scores']['vibeScores'],
        preferences: VibePreferences
    ): number {
        // Make the artsy/trendy score more dominant when that's the preference
        if (preferences.atmosphere < 0.5) {
            const artsyScore = vibeScores.artsy * 0.7 + vibeScores.trendy * 0.3;
            return artsyScore * 1.2; // Boost artsy scores
        } else {
            return (vibeScores.upscale + vibeScores.entertainment) / 2;
        }
    }

    private async rankVenuesBalanced(
        venues: Venue[],
        params: SearchParams,
        preferences: VibePreferences
    ): Promise<Venue[]> {
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
                    'BALANCED',
                    preferences
                )
            };

            return { ...venue, scores };
        }));

        return scoredVenues.sort((a, b) => b.scores!.final - a.scores!.final);
    }

    async searchVenues(params: SearchParams): Promise<Venue[]> {
        try {
            const venues = await searchNearbyVenues(params);

            if (!venues.length) {
                console.log('No venues found, trying broader search...');
                // Try a broader search by removing some filters
                const broaderParams = {
                    ...params,
                    minRating: Math.max((params.minRating || 3.8) - 0.3, 3.5),
                    minReviews: Math.max((params.minReviews || 25) - 10, 15)
                };
                return searchNearbyVenues(broaderParams);
            }

            return venues;
        } catch (error) {
            console.error('Error in searchVenues:', error);
            return [];
        }
    }
} 