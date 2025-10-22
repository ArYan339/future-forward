import React from 'react';

interface FutureCardProps {
    imageUrl: string | 'loading' | 'error';
    year: string;
    rotationClass?: string;
    errorMessage?: string;
}

const Loader: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200"></div>
    </div>
);

const ErrorDisplay: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-2">
         <svg className="w-12 h-12 mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
         <p className="text-sm font-semibold text-red-400">Generation Failed</p>
         {message && <p className="text-xs mt-1 text-red-500">{message}</p>}
    </div>
);


export const PolaroidCard: React.FC<FutureCardProps> = ({ imageUrl, year, rotationClass = '', errorMessage }) => {
    
    return (
        <div className={`transition-transform duration-300 hover:scale-105 group ${rotationClass}`}>
            <div className="bg-gray-800 p-3 shadow-lg rounded-md relative border border-gray-700">
                 <div className="bg-gray-900 w-full aspect-square mb-3 flex items-center justify-center rounded-sm">
                    {imageUrl === 'loading' && <Loader />}
                    {imageUrl === 'error' && <ErrorDisplay message={errorMessage} />}
                    {imageUrl !== 'loading' && imageUrl !== 'error' && (
                        <img src={imageUrl} alt={`Generated in the style of ${year}`} className="w-full h-full object-contain rounded-sm" />
                    )}
                </div>
                <p className="text-center text-lg font-display text-gray-200">{year}</p>
            </div>
        </div>
    );
};
