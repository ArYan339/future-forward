import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-100 font-display">
                Future Forward
            </h1>
            <p className="mt-2 text-lg text-gray-400">
                Glimpse into the years ahead
            </p>
        </header>
    );
};