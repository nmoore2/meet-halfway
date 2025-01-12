import { ReactNode, useEffect, useRef, useState } from 'react';

interface TooltipProps {
    content: string;
    children?: ReactNode;
}

export function Tooltip({ content }: TooltipProps) {
    const [position, setPosition] = useState<'right' | 'above'>('right');
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkPosition = () => {
            if (!tooltipRef.current) return;
            const rect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // If tooltip would overflow right edge, position above
            if (rect.right > viewportWidth - 20) {
                setPosition('above');
            } else {
                setPosition('right');
            }
        };

        checkPosition();
        window.addEventListener('resize', checkPosition);
        return () => window.removeEventListener('resize', checkPosition);
    }, []);

    const positionClasses = {
        right: 'top-1/2 -translate-y-1/2 left-full ml-2',
        above: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    };

    return (
        <div className="relative inline-block group ml-2">
            <div className="cursor-help">
                <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <div
                ref={tooltipRef}
                className={`
                    absolute 
                    ${positionClasses[position]}
                    w-[500px] max-w-[calc(100vw-40px)]
                    p-3 
                    bg-gray-900/95 text-white text-sm rounded-lg 
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                    transition-all duration-200
                    leading-relaxed
                    z-50
                `}
            >
                {content}
            </div>
        </div>
    );
} 