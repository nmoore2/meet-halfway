import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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
    driveTimes?: {
        fromLocationA: number;
        fromLocationB: number;
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

interface ClusterResultsProps {
    clusters: Cluster[];
    midpoint: {
        lat: number;
        lng: number;
    };
    locationA: string;
    locationB: string;
}

export default function ClusterResults({
    clusters,
    midpoint,
    locationA,
    locationB
}: ClusterResultsProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

    useEffect(() => {
        const initMap = async () => {
            const loader = new Loader({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
                version: "weekly",
                libraries: ["places"]
            });

            const google = await loader.load();
            const map = new google.maps.Map(document.getElementById('cluster-map')!, {
                center: midpoint,
                zoom: 14,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            mapRef.current = map;

            // Create bounds object
            const bounds = new google.maps.LatLngBounds();

            // Add markers and extend bounds for each cluster
            clusters.forEach((cluster, index) => {
                const marker = new google.maps.Marker({
                    position: cluster.center,
                    map,
                    label: {
                        text: (index + 1).toString(),
                        color: '#FFFFFF',
                        fontSize: "16px",
                        fontWeight: "bold"
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 22,
                        fillColor: getScoreColor(cluster.score),
                        fillOpacity: 0.9,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF'
                    }
                });

                // Extend bounds to include this cluster
                bounds.extend(cluster.center);

                marker.addListener('click', () => {
                    setSelectedCluster(cluster);
                });
            });

            // Fit map to bounds with padding
            if (clusters.length > 0) {
                map.fitBounds(bounds, {
                    padding: {
                        top: 100,
                        right: 100,
                        bottom: 100,
                        left: 100
                    }
                });

                // Wait for bounds to be set, then zoom out one level
                google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                    const currentZoom = map.getZoom();
                    if (currentZoom) {
                        map.setZoom(currentZoom - 1);  // Zoom out one level
                    }
                });
            }
        };

        if (clusters.length > 0) {
            initMap();
        }
    }, [clusters, midpoint]);

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Best Areas to Meet</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                    <div id="cluster-map" className="w-full h-[400px] rounded-xl overflow-hidden" />
                </div>

                {/* Cluster Details */}
                <div className="lg:col-span-1">
                    {selectedCluster ? (
                        <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333]">
                            <h3 className="text-xl font-semibold mb-4">
                                Area Details
                            </h3>

                            <div className="space-y-4">
                                {/* Score */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Area Score</span>
                                    <span className="text-2xl font-bold">
                                        {Math.round(selectedCluster.score * 100)}%
                                    </span>
                                </div>

                                {/* Venues */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-gray-400">Venues in this area:</h4>
                                    {selectedCluster.venues.map((venue, index) => (
                                        <div
                                            key={venue.place_id || index}
                                            className="bg-[#242424] p-3 rounded-lg"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{venue.name}</span>
                                                <span className="text-sm">
                                                    {venue.rating}⭐
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                {venue.types.slice(0, 3).join(' • ')}
                                            </div>
                                            {venue.driveTimes && (
                                                <div className="text-sm text-gray-400 mt-1">
                                                    Drive times: {Math.round(venue.driveTimes.fromLocationA)}min • {Math.round(venue.driveTimes.fromLocationB)}min
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333] text-center">
                            <p className="text-gray-400">
                                Click a cluster on the map to see details
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getScoreColor(score: number): string {
    if (score >= 0.8) return '#4CAF50';  // Green
    if (score >= 0.6) return '#FFC107';  // Yellow
    return '#FF5722';  // Orange/Red
} 