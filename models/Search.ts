import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
    lat: Number,
    lng: Number
});

const SearchSchema = new mongoose.Schema({
    locationA: {
        type: String,
        required: true,
    },
    locationB: {
        type: String,
        required: true,
    },
    activityType: {
        type: String,
        enum: ['bar', 'cafe', 'restaurant', 'park', 'movie_theater', 'any'],
        required: true,
    },
    locationType: {
        type: String,
        enum: ['downtown', 'suburban', 'any'],
        required: true,
    },
    meetupType: {
        type: String,
        enum: ['casual', 'business', 'date', 'any'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Search || mongoose.model('Search', SearchSchema);
