const StaticMap = ({ venue, locationA, locationB }: StaticMapProps) => {
    const getStaticMapUrl = () => {
        if (!venue.location) {
            console.log('No venue location provided');
            return null;
        }

        const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!MAPBOX_ACCESS_TOKEN) {
            console.error('Mapbox token not found');
            return null;
        }

        // Create markers for all three locations
        const markers = [
            // Venue marker (green)
            `pin-s-star+4CAF50(${venue.location.lng},${venue.location.lat})`,
            // Location A marker (blue)
            `pin-s-a+0071e3(-104.9903,39.7392)`,  // Denver coordinates
            // Location B marker (blue)
            `pin-s-b+0071e3(-105.2705,40.0150)`   // Boulder coordinates
        ].join(',');

        // Use bounds to show all markers
        const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/[-105.2705,39.7392,-104.9903,40.0150]/300x200?padding=50&access_token=${MAPBOX_ACCESS_TOKEN}`;

        console.log('Generated map URL:', url);
        return url;
    };

    const mapUrl = getStaticMapUrl();

    if (!mapUrl) {
        return (
            <div className="h-[200px] rounded-lg bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400">Map unavailable</span>
            </div>
        );
    }

    return (
        <div className="h-[200px] rounded-lg overflow-hidden">
            <img
                src={mapUrl}
                alt={`Map showing ${venue.name} location`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                    console.error('Map image failed to load. URL:', mapUrl);
                    e.currentTarget.parentElement!.innerHTML = `
                        <div class="h-[200px] rounded-lg bg-gray-800 flex items-center justify-center">
                            <span class="text-gray-400">Map unavailable</span>
                        </div>
                    `;
                }}
            />
        </div>
    );
};

export default StaticMap; 