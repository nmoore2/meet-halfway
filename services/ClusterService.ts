interface Venue {
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    rating: number;
    user_ratings_total: number;
    types: string[];
    place_id: string;
    opening_hours?: {
        periods: Array<{
            close?: { hours: number };
        }>;
    };
}

interface Cluster {
    center: {
        lat: number;
        lng: number;
    };
    venues: Venue[];
    score: number;
    matchesActivityType: boolean;
}

export class ClusterService {
    private readonly CLUSTER_RADIUS = 500;  // increased to 2km
    private readonly MIN_VENUES = 3;

    async findClusters(
        venues: Venue[],
        activityType: string
    ): Promise<Cluster[]> {
        const clusters = this.groupIntoClusters(venues);

        return clusters
            .map(cluster => ({
                ...cluster,
                score: this.calculateClusterScore(cluster, activityType),
                matchesActivityType: this.hasMatchingActivityType(cluster, activityType)
            }))
            .filter(cluster =>
                cluster.venues.length >= this.MIN_VENUES &&
                cluster.score >= 0.3 &&
                cluster.matchesActivityType
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }

    private groupIntoClusters(venues: Venue[]): Cluster[] {
        const clusters: Cluster[] = [];

        for (const venue of venues) {
            const nearbyVenues = venues.filter(v =>
                this.isWithinWalkingDistance(venue.location, v.location)
            );

            if (nearbyVenues.length >= this.MIN_VENUES) {
                clusters.push({
                    center: this.calculateCenter(nearbyVenues),
                    venues: nearbyVenues,
                    score: 0,
                    matchesActivityType: false
                });
            }
        }

        return this.removeDuplicateClusters(clusters);
    }

    private removeDuplicateClusters(clusters: Cluster[]): Cluster[] {
        const uniqueClusters = new Map<string, Cluster>();

        clusters.forEach(cluster => {
            const venueIds = cluster.venues
                .map(v => v.place_id)
                .sort()
                .join(',');

            if (!uniqueClusters.has(venueIds)) {
                uniqueClusters.set(venueIds, cluster);
            }
        });

        return Array.from(uniqueClusters.values());
    }

    private calculateClusterScore(cluster: Cluster, activityType: string): number {
        const scores = {
            size: this.calculateSizeScore(cluster),        // 25%
            ratings: this.calculateRatingsScore(cluster),  // 55%
            proximity: this.calculateProximityScore(cluster) // 20%
        };

        return (
            scores.size * 0.5 +
            scores.ratings * 0.4 +
            scores.proximity * 0.1
        );
    }

    private calculateSizeScore(cluster: Cluster): number {
        return cluster.venues.length >= this.MIN_VENUES ? 1 : 0;
    }

    private calculateRatingsScore(cluster: Cluster): number {
        const avgRating = cluster.venues.reduce(
            (sum, venue) => sum + venue.rating,
            0
        ) / cluster.venues.length;

        return Math.min((avgRating - 3.5) / 1.5, 1);
    }

    private calculateProximityScore(cluster: Cluster): number {
        const distances = this.getVenueDistances(cluster);
        if (distances.length === 0) return 0;

        const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        return Math.max(0, 1 - (avgDistance - 200) / 400);
    }

    private hasMatchingActivityType(cluster: Cluster, activityType: string): boolean {
        const targetTypes = this.getActivityTypes(activityType);
        return cluster.venues.some(venue =>
            venue.types.some(type =>
                targetTypes.includes(type.toLowerCase())
            )
        );
    }

    private getActivityTypes(activityType: string): string[] {
        switch (activityType.toLowerCase()) {
            case 'cocktails':
                return ['bar', 'night_club', 'restaurant'];
            case 'coffee shop':
                return ['cafe', 'bakery'];
            case 'restaurant':
                return ['restaurant', 'food'];
            case 'park':
                return ['park', 'tourist_attraction', 'point_of_interest'];
            default:
                return ['establishment'];
        }
    }

    private isWithinWalkingDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): boolean {
        return this.calculateDistance(point1, point2) <= this.CLUSTER_RADIUS;
    }

    private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
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

    private getVenueDistances(cluster: Cluster): number[] {
        const distances: number[] = [];
        for (let i = 0; i < cluster.venues.length; i++) {
            for (let j = i + 1; j < cluster.venues.length; j++) {
                distances.push(
                    this.calculateDistance(
                        cluster.venues[i].location,
                        cluster.venues[j].location
                    )
                );
            }
        }
        return distances;
    }

    private calculateCenter(venues: Venue[]): { lat: number; lng: number } {
        const total = venues.reduce(
            (acc, venue) => ({
                lat: acc.lat + venue.location.lat,
                lng: acc.lng + venue.location.lng
            }),
            { lat: 0, lng: 0 }
        );

        return {
            lat: total.lat / venues.length,
            lng: total.lng / venues.length
        };
    }
}