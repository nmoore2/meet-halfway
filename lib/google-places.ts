export async function getPlaceDetails(name: string, address: string) {
    const startTime = performance.now();
    try {
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.error('Google Maps API key is missing');
            return {};
        }

        // First, get the place ID using Text Search
        const searchStartTime = performance.now();
        const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        searchUrl.searchParams.append('query', `${name} ${address}`);
        searchUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY);

        const searchResponse = await fetch(searchUrl.toString());
        const searchData = await searchResponse.json();
        console.log(`Text Search for ${name}:`, performance.now() - searchStartTime, 'ms');

        const placeId = searchData.results?.[0]?.place_id;

        if (!placeId) {
            console.error('No place ID found');
            return {};
        }

        // Then, get detailed place information including photos
        const detailsStartTime = performance.now();
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.append('place_id', placeId);
        detailsUrl.searchParams.append('fields', 'photos,geometry,price_level');
        detailsUrl.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();
        console.log(`Place Details for ${name}:`, performance.now() - detailsStartTime, 'ms');

        const photos = detailsData.result?.photos || [];
        const photoUrls = photos.slice(0, 5).map((photo: any) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );

        console.log(`Total time for ${name}:`, performance.now() - startTime, 'ms');

        return {
            photos: photoUrls,
            geometry: searchData.results?.[0]?.geometry,
            price_level: detailsData.result?.price_level
        };
    } catch (error) {
        console.error('Error fetching place details:', error);
        console.log(`Failed request time for ${name}:`, performance.now() - startTime, 'ms');
        return {};
    }
}