interface VenueCardProps {
    venue: {
        name: string;
        location: {
            lat: number;
            lng: number;
        };
        address: string;
        rating?: number;
        priceLevel?: number;
        photos?: string[];
        description: string;
    };
    locationA: string;
    locationB: string;
}

const VenueCard = ({ venue, locationA, locationB }: VenueCardProps) => {
    return (
    
  );
};

export default VenueCard; 