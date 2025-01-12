import { useState, useEffect } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';
import { ClusterService } from '../services/ClusterService';
import { VibePreferences } from '../types/index';
import { VibeSliders } from './VibeSliders';
import ClusterAnalysisMap from './ClusterAnalysisMap';

interface SearchFormProps {
    onSearch: (searchData: {
        location1: string;
        location2: string;
        activityType: string;
        meetupType: string;
        priceRange: string;
        preferences: VibePreferences;
    }) => Promise<void>;
    isLoading?: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
    const [formData, setFormData] = useState({
        location1: 'Sloan Lake, Denver, Colorado',
        location2: 'Cherry Creek, Denver, Colorado',
        activityType: 'Cocktails',
        meetupType: 'First Date',
        priceRange: 'any'
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const [preferences, setPreferences] = useState<VibePreferences>({
        venueStyle: 0,
        neighborhoodVibe: 0,
        locationPriority: 1
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!formData.location1 || !formData.location2) {
            setValidationError('Please enter both locations to find meeting spots');
            return;
        }

        try {
            await onSearch({
                location1: formData.location1,
                location2: formData.location2,
                activityType: formData.activityType,
                meetupType: formData.meetupType,
                priceRange: formData.priceRange,
                preferences: preferences
            });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "We couldn't find any spots matching your criteria. Try adjusting your search or selecting different locations.";

            setValidationError(errorMessage);
            console.error('Form submission error:', error);
        }
    };

    const selectClass = `
        w-full p-3 rounded-lg
        bg-[#2c2c2c] border border-[#404040]
        text-gray-200 
        focus:border-[#bb86fc] focus:ring-1 focus:ring-[#bb86fc]
        disabled:opacity-50 disabled:cursor-not-allowed
        appearance-none cursor-pointer
        transition-all duration-200
    `;

    const activityTypes = [
        { value: 'Cocktails', label: 'Cocktails' },
        { value: 'Bar', label: 'Bar' },
        { value: 'Coffee Shop', label: 'Coffee Shop' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Park', label: 'Park' }
    ];

    // Get price range options based on activity type
    const getPriceRangeOptions = () => {
        if (formData.activityType === 'Coffee Shop') {
            return [
                { value: 'any', label: 'Any Price' },
                { value: '$', label: '$' },
                { value: '$$', label: '$$' }
            ];
        }

        return [
            { value: 'any', label: 'Any Price' },
            { value: '$', label: '$' },
            { value: '$$', label: '$$' },
            { value: '$$$', label: '$$$' }
        ];
    };

    // Reset price range if switching to/from coffee shop and current selection is invalid
    useEffect(() => {
        if (formData.activityType === 'Coffee Shop' &&
            (formData.priceRange === '$$$' || formData.priceRange === '$$$$')) {
            setFormData(prev => ({ ...prev, priceRange: 'any' }));
        }
    }, [formData.activityType]);

    const vibes = [
        { value: 'First Date', label: 'First Date' },
        { value: 'Date', label: 'Date' },
        { value: 'Business Meeting', label: 'Business Meeting' },
        { value: 'Fun/Unique', label: 'Fun/Unique' }
    ];

    // First, create a custom styles object for the Google Places Autocomplete
    const customStyles = {
        input: {
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2A2A2A',
            color: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #333333',
        },
        autocompleteContainer: {
            // Container that holds the entire autocomplete component
            width: '100%',
        },
        autocompleteItem: {
            // Individual suggestion items
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            padding: '10px',
            cursor: 'pointer',
            borderBottom: '1px solid #333333',
        },
        autocompleteItemActive: {
            // Highlighted/selected item
            backgroundColor: '#2A2A2A',
        },
        suggestionsList: {
            // The list container
            backgroundColor: '#1A1A1A',
            border: '1px solid #333333',
            borderRadius: '0.5rem',
            marginTop: '0.5rem',
            padding: 0,
            listStyle: 'none',
        }
    };

    const handleSelect = (address: string) => {
        // Update the input value
        setFormData(prev => ({ ...prev, location1: address }));

        // Any additional logic you need when an address is selected
        // For example, storing in state or form data
    };

    // Add key press handler for the form
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const handleSearch = async () => {
        console.log('Current slider values:', {
            venueStyle: preferences.venueStyle,
            neighborhoodVibe: preferences.neighborhoodVibe,
            locationPriority: preferences.locationPriority
        });

        setIsLoading(true);
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location1,
                    location2,
                    activityType,
                    meetupType,
                    priceRange,
                    preferences: {
                        venueStyle: preferences.venueStyle,
                        neighborhoodVibe: preferences.neighborhoodVibe,
                        locationPriority: preferences.locationPriority
                    }
                })
            });

            const data = await response.json();
            onResults(data.venues);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyPress}
            className="relative space-y-8"
        >
            {/* Location inputs - side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative z-20">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Location
                    </label>
                    <div className="max-w-full">
                        <PlaceAutocomplete
                            value={formData.location1}
                            onChange={(value) => setFormData(prev => ({ ...prev, location1: value }))}
                            placeholder="Sloans Lake, Denver, Colorado"
                            disabled={isLoading}
                            styles={customStyles}
                            onSelect={handleSelect}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Second Location
                    </label>
                    <div className="max-w-full">
                        <PlaceAutocomplete
                            value={formData.location2}
                            onChange={(value) => setFormData(prev => ({ ...prev, location2: value }))}
                            placeholder="Cherry Creek, Denver, Colorado"
                            disabled={isLoading}
                            styles={customStyles}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                </div>
            </div>

            {/* Filters in one row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
                {/* Location Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location Type
                    </label>
                    <div className="relative">
                        <select
                            value={formData.activityType}
                            onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
                            className="w-full p-3 pr-10 bg-[#2A2A2A] text-white rounded-lg border border-[#333333] appearance-none cursor-pointer focus:outline-none focus:border-[#444444]"
                        >
                            {activityTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Vibe */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vibe
                    </label>
                    <div className="relative">
                        <select
                            value={formData.meetupType}
                            onChange={(e) => setFormData(prev => ({ ...prev, meetupType: e.target.value }))}
                            className="w-full p-3 pr-10 bg-[#2A2A2A] text-white rounded-lg border border-[#333333] appearance-none cursor-pointer focus:outline-none focus:border-[#444444]"
                        >
                            {vibes.map((vibe) => (
                                <option key={vibe.value} value={vibe.value}>
                                    {vibe.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Price Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price Range
                    </label>
                    <div className="relative">
                        <select
                            value={formData.priceRange}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                            className="w-full p-3 pr-10 bg-[#2A2A2A] text-white rounded-lg border border-[#333333] appearance-none cursor-pointer focus:outline-none focus:border-[#444444]"
                        >
                            {getPriceRangeOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Customize Your Experience</h3>
                <VibeSliders
                    preferences={preferences}
                    onChange={setPreferences}
                />
            </div>

            {validationError && (
                <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#FF3B30] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[#FF3B30] text-sm">
                        {validationError}
                    </p>
                </div>
            )}

            <button
                type="submit"
                className="w-full bg-[#0071e3] text-white rounded-lg py-3 px-4 hover:bg-[#0077ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Searching...
                    </div>
                ) : (
                    'Find Places'
                )}
            </button>
        </form>
    );
}
