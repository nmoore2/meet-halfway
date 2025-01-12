import { LatLng, Venue, VibePreferences } from '../types';
import { calculateDistance } from './maps-utils';

export interface VenueCluster {
    center: LatLng;
    radius: number;
    venues: Venue[];
    scores: {
        density: number;
        averageRating: number;
        vibeScores: {
            artsy: number;
            trendy: number;
            upscale: number;
            entertainment: number;
        };
    };
}

export class VenueAnalyzer {
    static async findClusters(venues: Venue[], radius: number = 300): Promise<VenueCluster[]> {
        console.log(`🔍 Finding clusters among ${venues.length} venues`);
        const clusters: VenueCluster[] = [];
        const processed = new Set<string>();

        // Sort venues by rating * review count for better cluster centers
        const sortedVenues = [...venues].sort((a, b) =>
            (b.rating * b.user_ratings_total) - (a.rating * a.user_ratings_total)
        );

        for (const venue of sortedVenues) {
            if (processed.has(venue.place_id)) continue;

            // Find nearby venues
            const nearbyVenues = venues.filter(v =>
                !processed.has(v.place_id) &&
                calculateDistance(venue.geometry.location, v.geometry.location) <= radius
            );

            // Create cluster if we have enough venues
            if (nearbyVenues.length >= 2) { // Reduced from 3 to 2 for testing
                console.log(`Found cluster around ${venue.name} with ${nearbyVenues.length} venues`);
                const cluster = await this.createCluster(venue, nearbyVenues);
                clusters.push(cluster);
                nearbyVenues.forEach(v => processed.add(v.place_id));
            }
        }

        console.log(`✅ Found ${clusters.length} clusters`);
        if (clusters.length === 0 && venues.length > 0) {
            // If no clusters found but we have venues, create single-venue clusters
            console.log('Creating individual venue clusters...');
            for (const venue of venues.slice(0, 5)) { // Take top 5 venues
                const cluster = await this.createCluster(venue, [venue]);
                clusters.push(cluster);
            }
        }

        return clusters;
    }

    private static async createCluster(centerVenue: Venue, venues: Venue[]): Promise<VenueCluster> {
        const center = centerVenue.geometry.location;
        const radius = this.calculateClusterRadius(venues, center);

        console.log(`\n📍 Analyzing cluster around ${centerVenue.name}`);
        const vibeScores = await this.analyzeClusterVibe(venues);

        return {
            center,
            radius,
            venues,
            scores: {
                density: Math.min(venues.length / 10, 1),
                averageRating: venues.reduce((sum, v) => sum + v.rating, 0) / venues.length,
                vibeScores
            }
        };
    }

    private static calculateClusterRadius(venues: Venue[], center: LatLng): number {
        return Math.max(...venues.map(v =>
            calculateDistance(v.geometry.location, center)
        ));
    }

    private static async analyzeClusterVibe(venues: Venue[]): Promise<{
        artsy: number;
        trendy: number;
        upscale: number;
        entertainment: number;
    }> {
        const venue = venues[0];
        console.group(`\n🏘️ Analyzing Neighborhood: ${venue.vicinity}`);

        // Get nearby POIs
        const nearbyPOIs = await this.getNearbyPOIs(venue.geometry.location);

        // Analyze neighborhood characteristics
        const analysis = {
            creative: {
                streetArt: this.countVenuesWithKeywords(nearbyPOIs, [
                    'mural', 'street art', 'graffiti', 'public art'
                ]),
                craftBreweries: this.countVenuesOfType(nearbyPOIs, ['brewery']),
                liveMusic: this.countVenuesWithKeywords(nearbyPOIs, [
                    'live music', 'venue', 'stage', 'concert'
                ]),
                creativeSpaces: this.countVenuesWithKeywords(nearbyPOIs, [
                    'studio', 'workshop', 'gallery', 'creative', 'art'
                ]),
                eclecticFood: this.countVenuesWithKeywords(nearbyPOIs, [
                    'eclectic', 'fusion', 'creative', 'craft', 'artisan'
                ])
            },
            alternative: {
                breweries: this.countVenuesOfType(nearbyPOIs, ['brewery']),
                foodHalls: this.countVenuesWithKeywords(nearbyPOIs, ['food hall', 'market', 'collective']),
                industrialSpaces: this.countVenuesWithKeywords(nearbyPOIs, ['warehouse', 'factory', 'industrial'])
            },
            upscale: {
                fineDining: this.countVenuesWithKeywords(nearbyPOIs, ['fine dining', 'upscale', 'luxury']),
                cocktailBars: this.countVenuesWithKeywords(nearbyPOIs, ['cocktail', 'lounge', 'speakeasy']),
                highEndRetail: this.countVenuesWithKeywords(nearbyPOIs, ['boutique', 'luxury', 'designer'])
            }
        };

        console.log('📊 Neighborhood Analysis:', {
            location: venue.vicinity,
            characteristics: analysis
        });

        // Calculate scores
        const artsyScore = (
            (analysis.creative.streetArt * 0.3) +
            (analysis.creative.craftBreweries * 0.25) +
            (analysis.creative.liveMusic * 0.2) +
            (analysis.creative.creativeSpaces * 0.15) +
            (analysis.creative.eclecticFood * 0.1)
        ) / 5;

        const upscaleScore = (
            (analysis.upscale.fineDining * 0.4) +
            (analysis.upscale.cocktailBars * 0.3) +
            (analysis.upscale.highEndRetail * 0.3)
        ) / 3;

        console.log('🎯 Neighborhood Scores:', {
            artsy: `${Math.round(artsyScore * 100)}%`,
            upscale: `${Math.round(upscaleScore * 100)}%`
        });

        console.groupEnd();

        return {
            artsy: artsyScore,
            trendy: this.calculateTrendyScore(venues),
            upscale: upscaleScore,
            entertainment: this.calculateEntertainmentScore(venues)
        };
    }

    private static calculateArtsyScore(characteristics: any): number {
        return (
            (characteristics.creative.artGalleries * 0.2) +
            (characteristics.creative.studios * 0.15) +
            (characteristics.creative.murals * 0.15) +
            (characteristics.creative.independentVenues * 0.15) +
            (characteristics.creative.breweries * 0.15) +
            (characteristics.creative.industrialSpaces * 0.1) +
            (characteristics.creative.alternativeSpaces * 0.1)
        ) / 7;
    }

    private static countVenuesOfType(venues: any[], types: string[]): number {
        // Add filtering for tourist traps
        const touristKeywords = ['gift', 'souvenir', 'tourist'];
        return venues.filter(v =>
            types.some(type => v.types?.includes(type)) &&
            !touristKeywords.some(keyword =>
                v.name?.toLowerCase().includes(keyword) ||
                v.vicinity?.toLowerCase().includes(keyword)
            )
        ).length;
    }

    private static countVenuesWithKeywords(venues: any[], keywords: string[]): number {
        return venues.filter(v =>
            keywords.some(keyword =>
                v.name?.toLowerCase().includes(keyword) ||
                v.vicinity?.toLowerCase().includes(keyword) ||
                v.types?.some((t: string) => t.includes(keyword))
            )
        ).length;
    }

    private static countIndependentVenues(venues: any[]): number {
        const chains = ['starbucks', 'mcdonalds', 'subway', 'target', 'walmart'];
        return venues.filter(v =>
            !chains.some(chain => v.name?.toLowerCase().includes(chain))
        ).length;
    }

    private static calculateTrendyScore(venues: Venue[]): number {
        const trendyKeywords = ['trendy', 'hip', 'modern', 'craft', 'popular'];
        const venueText = venues.map(v =>
            [v.name, v.vicinity, ...(v.types || [])].join(' ').toLowerCase()
        ).join(' ');

        return trendyKeywords.filter(k => venueText.includes(k)).length / trendyKeywords.length;
    }

    private static calculateEntertainmentScore(venues: Venue[]): number {
        const entertainmentTypes = ['bar', 'night_club', 'restaurant', 'cafe'];
        return Math.min(
            venues.filter(v =>
                entertainmentTypes.some(type => v.types?.includes(type))
            ).length / 3,
            1
        );
    }

    private static async getNearbyPOIs(location: LatLng): Promise<any[]> {
        try {
            const params = new URLSearchParams({
                lat: String(location.lat),
                lng: String(location.lng),
                radius: '500',
                types: [
                    'brewery',
                    'bar',
                    'restaurant',
                    'night_club',
                    'art_gallery',
                    'museum',
                    'cafe',
                    'book_store'
                ].join('|')
            });

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const url = `${baseUrl}/api/nearby-pois?${params}`;

            const response = await fetch(url);
            if (!response.ok) return [];

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching POIs:', error);
            return [];
        }
    }

    private static findKeywordMatches(texts: string[], keywords: string[]): string[] {
        return keywords.filter(keyword =>
            texts.some(text => text.includes(keyword.toLowerCase()))
        );
    }

    private static calculateEmergingScore(venues: Venue[]): number {
        const types = venues.flatMap(v => v.types || []);
        const names = venues.map(v => v.name.toLowerCase());
        const descriptions = venues.map(v => v.vicinity.toLowerCase());
        const allText = [...types, ...names, ...descriptions];

        // Emerging/creative indicators
        const emergingIndicators = [
            // Creative spaces
            'gallery', 'studio', 'art', 'creative', 'artist',
            // Industrial conversion hints
            'warehouse', 'industrial', 'factory', 'converted',
            // Modern venue types
            'brewery', 'distillery', 'roastery', 'collective',
            'food hall', 'market hall', 'pop-up', 'popup',
            // Cultural indicators
            'indie', 'independent', 'local', 'craft',
            'experimental', 'workshop', 'maker'
        ];

        // Count venue types that suggest an emerging area
        const venueTypeCounts = new Map<string, number>();
        types.forEach(type => {
            venueTypeCounts.set(type, (venueTypeCounts.get(type) || 0) + 1);
        });

        return (
            this.calculateKeywordScore(allText, emergingIndicators) * 0.4 +
            (venueTypeCounts.get('art_gallery') || 0) * 0.3 +
            (venueTypeCounts.get('brewery') || 0) * 0.2 +
            (venueTypeCounts.size >= 3 ? 0.1 : 0)
        );
    }

    private static calculateEstablishedScore(venues: Venue[]): number {
        const types = venues.flatMap(v => v.types || []);
        const names = venues.map(v => v.name.toLowerCase());
        const descriptions = venues.map(v => v.vicinity.toLowerCase());
        const allText = [...types, ...names, ...descriptions];

        // Traditional/established indicators
        const establishedIndicators = [
            // Traditional venues
            'hotel', 'plaza', 'mall', 'tower', 'center',
            // Business district indicators
            'financial', 'business', 'corporate', 'commercial',
            'office', 'bank', 'institution',
            // Historical indicators
            'historic', 'heritage', 'landmark', 'traditional',
            // Upscale venues
            'steakhouse', 'fine dining', 'luxury', 'upscale'
        ];

        // Count venue types that suggest an established area
        const venueTypeCounts = new Map<string, number>();
        types.forEach(type => {
            venueTypeCounts.set(type, (venueTypeCounts.get(type) || 0) + 1);
        });

        return (
            this.calculateKeywordScore(allText, establishedIndicators) * 0.5 +
            (venueTypeCounts.get('lodging') || 0) * 0.25 +
            (venueTypeCounts.get('bank') || 0) * 0.25
        );
    }
} 