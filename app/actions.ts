'use server';

import { calculateDrivingMidpoint } from '../lib/midpoint';
import { findVenues } from '../lib/venues';

interface SearchParams {
    location1: string;
    location2: string;
    activityType: string;
    meetupType: string;
    priceRange: string;
}

export async function searchVenues(data: SearchParams) {
    const {
        location1,
        location2,
        activityType,
        meetupType,
        priceRange
    } = data;

    if (!location1 || !location2) {
        throw new Error('Both locations are required');
    }

    const midpoint = await calculateDrivingMidpoint(location1, location2);
    const venues = await findVenues({
        midpoint,
        activityType,
        meetupType,
        priceRange
    });

    return venues;
}