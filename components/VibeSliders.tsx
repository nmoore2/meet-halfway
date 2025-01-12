import { Slider } from '../components/ui/Slider';
import { Tooltip } from './ui/Tooltip';

interface VibePreferences {
    atmosphere: number;
    energy: number;
    locationPriority: number;
}

interface VibeSlidersProps {
    preferences: VibePreferences;
    onChange: (preferences: VibePreferences) => void;
}

export function VibeSliders({ preferences, onChange }: VibeSlidersProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vibe Slider */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                        <span className="text-gray-400">Artsy & Trendy</span>
                        <Tooltip content="Favor venues in creative neighborhoods, indie spots, and unique local gems" />
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400">Upscale & Polished</span>
                        <Tooltip content="Prefer established venues in refined areas with upscale dining and cocktail bars" />
                    </div>
                </div>
                <Slider
                    defaultValue={[preferences.atmosphere]}
                    max={1}
                    min={0}
                    step={0.1}
                    onValueChange={([value]) => onChange({ ...preferences, atmosphere: value })}
                />
            </div>

            {/* Location Strategy Slider */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                        <span className="text-gray-400">Equal Distance</span>
                        <Tooltip content="Find spots with similar travel times from both locations, perfect for fair meeting points" />
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400">Entertainment Districts</span>
                        <Tooltip content="Focus on areas with lots of venue options, even if travel times aren't perfectly balanced" />
                    </div>
                </div>
                <Slider
                    defaultValue={[preferences.locationPriority]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) =>
                        onChange({ ...preferences, locationPriority: value })}
                />
            </div>
        </div>
    );
} 