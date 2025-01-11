import { ReactNode, useState } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
}

export function Tooltip({ children, content }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>

            {isVisible && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                    <div className="bg-[#242424] text-white rounded-lg shadow-lg border border-[#333333] p-2">
                        {content}
                        <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-[#242424] border-r border-b border-[#333333]" />
                    </div>
                </div>
            )}
        </div>
    );
} 