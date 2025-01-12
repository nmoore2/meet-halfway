import { VibePreferences } from '../types';
import { Slider } from './ui/Slider';
import { Tooltip } from './ui/Tooltip';

interface VibePreferencesProps {
    preferences: VibePreferences;
    onChange: (preferences: VibePreferences) => void;
}

export function VibeSliders({ preferences, onChange }: VibePreferencesProps) {
    return (
        <div>
            <h3 className="text-lg font-medium mb-6">Customize Your Experience</h3>

            <div className="grid grid-cols-1 gap-8">
                {/* Venue Style Slider */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue Style</label>
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                            <span className="text-gray-400">Casual & Creative</span>
                            <Tooltip content="Craft cocktails, indie spots, unique atmospheres, experimental menus" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-400">Refined & Elegant</span>
                            <Tooltip content="Classic cocktails, fine dining, white tablecloth service, sophisticated ambiance" />
                        </div>
                    </div>
                    <Slider
                        value={[preferences.venueStyle * 100]}
                        onValueChange={([value]) => {
                            onChange({
                                ...preferences,
                                venueStyle: value / 100
                            });
                        }}
                    />
                </div>

                {/* Neighborhood Character Slider */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Neighborhood Character</label>
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                            <span className="text-gray-400">Artsy & Eclectic</span>
                            <Tooltip content="Think RiNo: converted warehouses, art galleries, food halls, craft breweries" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-400">Polished & Established</span>
                            <Tooltip content="Think LoDo: historic buildings, upscale hotels, traditional restaurants" />
                        </div>
                    </div>
                    <Slider
                        value={[preferences.neighborhoodVibe * 100]}
                        onValueChange={([value]) => {
                            onChange({
                                ...preferences,
                                neighborhoodVibe: value / 100
                            });
                        }}
                    />
                </div>

                {/* Location Strategy Slider */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location Priority</label>
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                            <span className="text-gray-400">Equal Distance</span>
                            <Tooltip content="Prioritize spots that are a fair drive time for both people" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-400">Entertainment Districts</span>
                            <Tooltip content="Prioritize areas with lots of options, like RiNo or LoDo" />
                        </div>
                    </div>
                    <Slider
                        value={[preferences.locationPriority * 100]}
                        onValueChange={([value]) => {
                            onChange({
                                ...preferences,
                                locationPriority: value / 100
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
} 