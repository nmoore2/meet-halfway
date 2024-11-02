import { useState, useEffect } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

interface SearchFormProps {
    onSubmit: (searchData: {
        location1: string;
        location2: string;
        activityType: string;
        meetupType: string;
        priceRange: string;
    }) => Promise<{ error?: string }>;
    isLoading?: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [formData, setFormData] = useState({
        location1: 'Denver, CO, USA',
        location2: 'Boulder, CO, USA',
        activityType: 'Cocktails',
        meetupType: 'First Date',
        priceRange: 'any'
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Check if both locations are filled
        if (!formData.location1 || !formData.location2) {
            setValidationError('Please enter both locations to find meeting spots');
            return;
        }

        try {
            const response = await onSubmit({
                location1: formData.location1,
                location2: formData.location2,
                activityType: formData.activityType,
                meetupType: formData.meetupType,
                priceRange: formData.priceRange
            });

            if (response?.error) {
                setValidationError(response.error);
                return;
            }

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
        { value: 'Business', label: 'Business' },
        { value: 'Hangout', label: 'Hangout' }
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
                            placeholder="Enter first location"
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
                            placeholder="Enter second location"
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
                className="w-full bg-[#0071e3] text-white rounded-lg py-3 px-4 hover:bg-[#0077ED] transition-colors"
                disabled={isLoading}
            >
                Find Places
            </button>
        </form>
    );
}
