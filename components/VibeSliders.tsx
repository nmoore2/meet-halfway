import { Slider } from '../components/ui/Slider';

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
        <div className="space-y-8">
            {/* Vibe Slider */}
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-sm font-medium">Vibe</label>
                    <span className="text-sm text-gray-500">
                        {preferences.atmosphere < 0.5 ? 'Artsy & Trendy' : 'Upscale & Polished'}
                    </span>
                </div>
                <Slider
                    defaultValue={[preferences.atmosphere]}
                    max={1}
                    min={0}
                    step={0.1}
                    onValueChange={([value]) => onChange({ ...preferences, atmosphere: value })}
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Artsy & Trendy</span>
                    <span>Upscale & Polished</span>
                </div>
            </div>

            {/* Energy Slider */}
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-sm font-medium">Energy</label>
                    <span className="text-sm text-gray-500">
                        {preferences.energy < 0.5 ? 'Relaxed & Laid-Back' : 'Lively & Bustling'}
                    </span>
                </div>
                <Slider
                    defaultValue={[preferences.energy]}
                    max={1}
                    min={0}
                    step={0.1}
                    onValueChange={([value]) => onChange({ ...preferences, energy: value })}
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Relaxed & Laid-Back</span>
                    <span>Lively & Bustling</span>
                </div>
            </div>

            {/* Location Strategy Slider */}
            <div className="space-y-4">
                <div className="flex justify-between">
                    <label className="text-sm font-medium">Location Strategy</label>
                    <span className="text-sm text-gray-500">
                        {preferences.locationPriority < 0.5 ? 'Equal Distance' : 'Entertainment Districts'}
                    </span>
                </div>
                <Slider
                    defaultValue={[preferences.locationPriority]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) =>
                        onChange({ ...preferences, locationPriority: value })}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Equal Distance</span>
                    <span>Entertainment Districts</span>
                </div>
            </div>
        </div>
    );
} 