import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../lib/loadGoogleMaps';

interface ClusterAnalysisMapProps {
    locationA: string;
    locationB: string;
    midpoint?: {
        lat: number;
        lng: number;
        searchRadius: number;
    };
    suggestions: any[];
}

export default function ClusterAnalysisMap({ locationA, locationB, midpoint, suggestions }: ClusterAnalysisMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

    useEffect(() => {
        if (!midpoint || !mapRef.current) return;

        const initMap = async () => {
            await loadGoogleMaps();

            const map = new google.maps.Map(mapRef.current!, {
                center: { lat: midpoint.lat, lng: midpoint.lng },
                zoom: 12,
                styles: [
                    {
                        featureType: "all",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#ffffff" }]
                    },
                    {
                        featureType: "all",
                        elementType: "labels.text.stroke",
                        stylers: [{ visibility: "on" }, { color: "#3e606f" }, { weight: 2 }, { gamma: 0.84 }]
                    },
                    {
                        featureType: "all",
                        elementType: "labels.icon",
                        stylers: [{ visibility: "off" }]
                    },
                    {
                        featureType: "administrative",
                        elementType: "geometry",
                        stylers: [{ weight: 0.6 }, { color: "#1a3541" }]
                    },
                    {
                        featureType: "landscape",
                        elementType: "geometry",
                        stylers: [{ color: "#2c5a71" }]
                    },
                    {
                        featureType: "poi",
                        elementType: "geometry",
                        stylers: [{ color: "#406d80" }]
                    },
                    {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#1f3035" }]
                    },
                    {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [{ color: "#406d80" }]
                    },
                    {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#193341" }]
                    }
                ]
            });

            // First, create the InfoWindow with custom styles
            infoWindowRef.current = new google.maps.InfoWindow({
                disableAutoPan: false,
                pixelOffset: new google.maps.Size(0, -40),
                // Override default InfoWindow styles
                content: '',
            });

            // Add custom styles to remove white background
            const styleString = `
                .gm-style-iw.gm-style-iw-c {
                    background-color: #1a1a1a !important;
                    padding: 0 !important;
                    max-height: none !important;
                }
                
                .gm-style-iw-d {
                    overflow: hidden !important;
                    max-height: none !important;
                }
                
                .gm-style-iw-tc {
                    display: none !important;
                }
                
                /* More specific selectors for the close button */
                .gm-style .gm-style-iw-c button.gm-ui-hover-effect {
                    top: 6px !important;
                    right: 6px !important;
                    background: none !important;
                    opacity: 1 !important;
                }
                
                /* Target the SVG/IMG directly with a more specific selector */
                .gm-style .gm-style-iw-c button.gm-ui-hover-effect img,
                .gm-style .gm-style-iw-c button.gm-ui-hover-effect span {
                    width: 16px !important;
                    height: 16px !important;
                    margin: 0 !important;
                    filter: brightness(0) invert(1) !important;
                    opacity: 0.8 !important;
                }

                .gm-style .gm-style-iw-c button.gm-ui-hover-effect:hover img,
                .gm-style .gm-style-iw-c button.gm-ui-hover-effect:hover span {
                    opacity: 1 !important;
                }
            `;

            // Add styles to head
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styleString;
            document.head.appendChild(styleSheet);

            const bounds = new google.maps.LatLngBounds();

            if (suggestions && suggestions.length > 0) {
                suggestions.forEach(suggestion => {
                    if (suggestion.geometry?.location) {
                        const position = new google.maps.LatLng(
                            suggestion.geometry.location.lat,
                            suggestion.geometry.location.lng
                        );

                        const marker = new google.maps.Marker({
                            position,
                            map: map,
                            title: suggestion.name
                        });

                        // Add click listener to marker
                        marker.addListener('click', () => {
                            const content = `
                                <div style="
                                    color: #ffffff;
                                    padding: 16px;
                                    min-width: 280px;
                                    font-family: system-ui, -apple-system, sans-serif;
                                ">
                                    <h3 style="
                                        font-size: 16px;
                                        font-weight: 600;
                                        margin: 0 0 8px 0;
                                        padding-right: 24px;
                                    ">${suggestion.name}</h3>
                                    
                                    <div style="
                                        font-size: 14px;
                                        margin-bottom: 12px;
                                        color: #e0e0e0;
                                    ">
                                        <span style="font-weight: 500;">Rating:</span> ${suggestion.rating} ⭐ (${suggestion.user_ratings_total} reviews)
                                    </div>
                                    
                                    ${suggestion.driveTimes ? `
                                        <div style="
                                            font-size: 14px;
                                            color: #e0e0e0;
                                            margin-bottom: 8px;
                                        ">
                                            <div style="margin-bottom: 4px;">From ${locationA}: ${suggestion.driveTimes.fromLocationA} min</div>
                                            <div>From ${locationB}: ${suggestion.driveTimes.fromLocationB} min</div>
                                        </div>
                                    ` : ''}
                                    
                                    ${suggestion.price_level ? `
                                        <div style="
                                            font-size: 14px;
                                            color: #4CAF50;
                                            margin-top: 8px;
                                        ">
                                            Price Level: ${'$'.repeat(suggestion.price_level)}
                                        </div>
                                    ` : ''}
                                    
                                    <div style="
                                        margin-top: 12px;
                                        padding-top: 12px;
                                        border-top: 1px solid #333333;
                                    ">
                                        <a href="https://www.google.com/maps/place/?q=place_id:${suggestion.place_id}" 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           style="
                                               color: #0071e3;
                                               text-decoration: none;
                                               font-size: 14px;
                                               display: block;
                                           "
                                        >
                                            View on Google Maps
                                        </a>
                                    </div>
                                </div>
                            `;

                            infoWindowRef.current?.setContent(content);
                            infoWindowRef.current?.open(map, marker);
                        });

                        bounds.extend(position);
                    }
                });

                map.fitBounds(bounds, {
                    padding: {
                        top: 50,
                        right: 50,
                        bottom: 50,
                        left: 50
                    }
                });
            }
        };

        initMap().catch(console.error);

        // Cleanup
        return () => {
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }
        };
    }, [midpoint, suggestions, locationA, locationB]);

    return (
        <div ref={mapRef} className="h-[400px] w-full rounded-lg overflow-hidden" />
    );
}
