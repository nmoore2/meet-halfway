import { useState, useEffect } from 'react';

export default function LoadingState({ activityType }: { activityType: string }) {
    const [currentMessage, setCurrentMessage] = useState(0);

    const getActivityMessage = (type: string) => {
        const activity = type.toLowerCase().replace(/s$/, '');

        switch (activity) {
            case 'cocktail':
                return 'cocktail bars';
            case 'coffee shop':
                return 'coffee shops';
            case 'restaurant':
                return 'restaurants';
            case 'park':
                return 'parks';
            case 'bar':
                return 'bars';
            default:
                return 'places';
        }
    };

    const messages = [
        'Finding the perfect spots...',
        'Calculating drive times...',
        'Checking venue details...',
        'Almost done...'
    ];

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setCurrentMessage(1);
        }, 5000);

        const timer2 = setTimeout(() => {
            setCurrentMessage(2);
        }, 10000);

        const timer3 = setTimeout(() => {
            setCurrentMessage(3);
        }, 15000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8">
            <div className="relative h-20 w-full max-w-2xl text-center">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`
                            absolute top-0 left-0 w-full
                            transition-opacity duration-700 ease-in-out
                            ${currentMessage === index
                                ? 'opacity-100'
                                : 'opacity-0'
                            }
                        `}
                    >
                        <h2 className="text-2xl font-semibold whitespace-normal">
                            {message}
                        </h2>
                    </div>
                ))}
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mt-4" />
        </div>
    );
} 