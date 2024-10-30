interface SearchData {
    locationA: string;
    locationB: string;
    activityType: string;
    locationType: string;
    meetupType: string;
}

export function generateChatGPTPrompt(searchData: SearchData, midpoint: string): string {
    const activityMap = {
        any: "venue",
        bar: "dive bar",
        cocktail: "cocktail bar",
        coffee: "coffee shop",
        dinner: "restaurant",
        park: "park",
        movie: "movie theater"
    };

    const locationTypeMap = {
        any: "area",
        downtown: "downtown area",
        rural: "rural area",
        suburbs: "suburban area"
    };

    const meetupTypeMap = {
        any: "meeting",
        date: "date",
        business: "business meeting"
    };

    return `I need recommendations for the 3-5 best places to have a ${meetupTypeMap[searchData.meetupType]} 
    near ${midpoint}. I'm looking for a ${activityMap[searchData.activityType]} in a ${locationTypeMap[searchData.locationType]}.

    This is a meetup point between someone coming from ${searchData.locationA} and someone from ${searchData.locationB}.

    For each recommendation, please provide:
    1. The name of the place
    2. A brief explanation of why it's ideal for a ${meetupTypeMap[searchData.meetupType]}
    3. Key features that make it a good meeting point
    4. Any relevant tips for meeting there

    Format the response as a structured list with clear headings for each place.`;
}
