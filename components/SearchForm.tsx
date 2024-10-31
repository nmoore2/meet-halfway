import { useState, useEffect } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

interface SearchFormProps {
    onSubmit: (searchData: {
        locationA: string;
        locationB: string;
        activityType: string;
        locationType: string;
        meetupType: string;
    }) => void;
    isLoading?: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [formData, setFormData] = useState({
        locationA: "Sloan's Lake, Denver, CO",
        locationB: 'Cherry Creek, Denver, CO',
        activityType: 'Coffee Shop',
        locationType: 'Any Location Type',
        meetupType: 'First Date',
        priceRange: 'any'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('Form submitted with data:', formData);
            await onSubmit(formData);
        } catch (error: any) {
            console.error('Form submission error:', {
                message: error.message,
                stack: error.stack,
                data: error
            });
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
        { value: 'Coffee Shop', label: 'Coffee Shop' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Bar', label: 'Bar' },
        { value: 'Cocktails', label: 'Cocktails' },
        { value: 'Park', label: 'Park' },
        { value: 'Museum', label: 'Museum' }
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
            { value: '$$$', label: '$$$' },
            { value: '$$$$', label: '$$$$' }
        ];
    };

    // Reset price range if switching to/from coffee shop and current selection is invalid
    useEffect(() => {
        if (formData.activityType === 'Coffee Shop' &&
            (formData.priceRange === '$$$' || formData.priceRange === '$$$$')) {
            setFormData(prev => ({ ...prev, priceRange: 'any' }));
        }
    }, [formData.activityType]);

    const meetupTypes = [
        { value: 'First Date', label: 'First Date' },
        { value: 'Date', label: 'Date' },
        { value: 'Business', label: 'Business' },
        { value: 'Hangout', label: 'Hangout' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">First Location</label>
                    <PlaceAutocomplete
                        value={formData.locationA}
                        onChange={(value) => setFormData(prev => ({ ...prev, locationA: value }))}
                        placeholder="Enter first location"
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Second Location</label>
                    <PlaceAutocomplete
                        value={formData.locationB}
                        onChange={(value) => setFormData(prev => ({ ...prev, locationB: value }))}
                        placeholder="Enter second location"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Activity Type</label>
                    <div className="relative">
                        <select
                            value={formData.activityType}
                            onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
                            className={selectClass}
                            disabled={isLoading}
                        >
                            {activityTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Meetup Type</label>
                    <div className="relative">
                        <select
                            value={formData.meetupType}
                            onChange={(e) => setFormData(prev => ({ ...prev, meetupType: e.target.value }))}
                            className={selectClass}
                            disabled={isLoading}
                        >
                            {meetupTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-300 text-sm">Price Range</label>
                    <div className="relative">
                        <select
                            value={formData.priceRange}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                            className={selectClass}
                            disabled={isLoading}
                        >
                            {getPriceRangeOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className={`
                    w-full p-3 rounded-lg font-medium
                    bg-[#bb86fc] hover:bg-opacity-90
                    text-gray-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transform transition-all duration-200
                    hover:shadow-lg
                    ${isLoading ? 'animate-pulse' : ''}
                `}
                disabled={isLoading}
            >
                {isLoading ? 'Finding Places...' : 'Find Places'}
            </button>
        </form>
    );
}
