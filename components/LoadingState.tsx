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
        {
            title: `Searching for ${getActivityMessage(activityType)}...`,
            id: 0
        },
        {
            title: 'Finding the perfect meeting spot...',
            id: 1
        },
        {
            title: 'Saving you lots of time... :)',
            id: 2
        }
    ];

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setCurrentMessage(1);
        }, 5000);

        const timer2 = setTimeout(() => {
            setCurrentMessage(2);
        }, 10000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8">
            <div className="relative h-20 w-full max-w-2xl text-center">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`
                            absolute top-0 left-0 w-full
                            transition-opacity duration-700 ease-in-out
                            ${currentMessage === message.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            }
                        `}
                    >
                        <h2 className="text-2xl font-semibold whitespace-normal">
                            {message.title}
                        </h2>
                    </div>
                ))}
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mt-4" />
        </div>
    );
} 