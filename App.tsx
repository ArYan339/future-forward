import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PolaroidCard } from './components/PolaroidCard';
import { generateFutureImage } from './services/geminiService';
import { FUTURE_YEARS } from './constants';
import { GeneratedImage } from './types';
import { fileToBase64 } from './utils/file';

const App: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError('Image format not supported. Please upload a PNG, JPG, or WEBP file.');
            setUploadedFile(null);
            setUploadedImageUrl(null);
            return;
        }
        setUploadedFile(file);
        setUploadedImageUrl(URL.createObjectURL(file));
        setGeneratedImages([]);
        setError(null);
    };

    const handleGenerate = useCallback(async () => {
        if (!uploadedFile || !uploadedImageUrl) {
            setError('Please upload an image first.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        const initialImages: GeneratedImage[] = [
            { year: 'Original', imageUrl: uploadedImageUrl },
            ...FUTURE_YEARS.map(year => ({ year, imageUrl: 'loading' as const }))
        ];
        setGeneratedImages(initialImages);

        try {
            const base64Image = await fileToBase64(uploadedFile);

            for (const year of FUTURE_YEARS) {
                try {
                    const generatedImageUrl = await generateFutureImage(base64Image, uploadedFile.type, year);
                    setGeneratedImages(prev =>
                        prev.map(img =>
                            img.year === year ? { ...img, imageUrl: generatedImageUrl } : img
                        )
                    );
                } catch (err) {
                    console.error(`Failed to generate image for ${year}:`, err);
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                    setGeneratedImages(prev =>
                        prev.map(img =>
                            img.year === year ? { ...img, imageUrl: 'error', errorMessage } : img
                        )
                    );
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`A critical error occurred: ${errorMessage}. Please try again.`);
            console.error(err);
            // Reset to only show the original image on a major failure
            setGeneratedImages([{ year: 'Original', imageUrl: uploadedImageUrl }]);
        } finally {
            setIsGenerating(false);
        }
    }, [uploadedFile, uploadedImageUrl]);

    const handleDownloadCollage = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError("Could not create collage. Canvas context is not supported.");
            return;
        }

        const imagesToDraw = generatedImages.filter(img => img.imageUrl !== 'loading' && img.imageUrl !== 'error');
        if (imagesToDraw.length === 0) {
            setError("No images available to create a collage.");
            return;
        }

        // --- Polaroid Collage Styles ---
        const p_width = 350;
        const p_height = 420;
        const img_size = 300;
        const p_padding = (p_width - img_size) / 2; // 25
        const p_bottom_margin = p_height - img_size - p_padding; // 95

        const cols = 2;
        const rows = Math.ceil(imagesToDraw.length / cols);
        const grid_padding = 50;
        const title_height = 150;

        canvas.width = (p_width * cols) + (grid_padding * (cols + 1));
        canvas.height = (p_height * rows) + (grid_padding * (rows + 1)) + title_height;

        // Load fonts before drawing
        await document.fonts.load('bold 48px Caveat');
        await document.fonts.load('24px Inter');
        await document.fonts.load('bold 36px Caveat');

        // Background color
        ctx.fillStyle = '#FFFBF0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Titles
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.font = "bold 48px 'Caveat', cursive";
        ctx.fillText('Generated with Future Forward', canvas.width / 2, grid_padding + 30);
        ctx.font = "24px 'Inter', sans-serif";
        ctx.fillStyle = '#6b7280';
        ctx.fillText('on Google AI Studio', canvas.width / 2, grid_padding + 80);


        const imagePromises = imagesToDraw.map(imgData => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = imgData.imageUrl;
            });
        });

        try {
            const loadedImages = await Promise.all(imagePromises);

            imagesToDraw.forEach((imgData, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;

                const x = grid_padding + col * (p_width + grid_padding);
                const y = title_height + grid_padding + row * (p_height + grid_padding);

                // Polaroid frame
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetY = 5;
                ctx.fillRect(x, y, p_width, p_height);
                ctx.shadowColor = 'transparent'; // Reset shadow

                // Draw image inside frame
                ctx.drawImage(loadedImages[index], x + p_padding, y + p_padding, img_size, img_size);
                
                // Year text
                ctx.fillStyle = '#1f2937';
                ctx.font = "bold 36px 'Caveat', cursive";
                ctx.textAlign = 'center';
                ctx.fillText(imgData.year, x + p_width / 2, y + p_height - (p_bottom_margin / 2) + 10);
            });

            const link = document.createElement('a');
            link.download = 'future_forward_collage.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Failed to load images for collage:", error);
            setError("Could not create collage. One or more images failed to load.");
        }
    };

    const handleStartOver = () => {
        setUploadedFile(null);
        setUploadedImageUrl(null);
        setGeneratedImages([]);
        setError(null);
    };
    
    const allImagesDone = generatedImages.length > 0 && !generatedImages.some(img => img.imageUrl === 'loading');
    const anyImageSuccess = generatedImages.some(img => img.imageUrl !== 'loading' && img.imageUrl !== 'error');

    return (
        <div className="min-h-screen text-gray-200 antialiased">
            <main className="container mx-auto px-4 py-8 md:py-12">
                <Header />

                <div className="max-w-xl mx-auto text-center mt-8">
                    <ImageUploader onImageUpload={handleImageUpload} disabled={isGenerating} />

                    {uploadedImageUrl && !isGenerating && generatedImages.length === 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-medium text-gray-400 mb-4">Your Photo:</h3>
                            <img src={uploadedImageUrl} alt="Uploaded preview" className="max-w-xs mx-auto rounded-lg shadow-md" />
                        </div>
                    )}

                    {uploadedFile && (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-gray-900"
                        >
                            {isGenerating ? 'Generating...' : 'See The Future'}
                        </button>
                    )}
                </div>
                
                {error && <p className="text-center text-red-500 mt-4">{error}</p>}

                {generatedImages.length > 0 && (
                    <div className="mt-16">
                         {allImagesDone && anyImageSuccess && (
                            <div className="text-center mb-12 flex flex-wrap justify-center gap-4">
                                <button
                                    onClick={handleDownloadCollage}
                                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-colors duration-300 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-gray-900"
                                >
                                    Download Collage
                                </button>
                                <button
                                    onClick={handleStartOver}
                                    className="px-8 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-500 transition-colors duration-300 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 focus:ring-offset-gray-900"
                                >
                                    Start Over
                                </button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                            {generatedImages.map((image, index) => (
                                <PolaroidCard 
                                    key={image.year} 
                                    imageUrl={image.imageUrl} 
                                    year={image.year}
                                    rotationClass={index % 2 === 0 ? 'transform rotate-2' : 'transform -rotate-2'}
                                    errorMessage={image.errorMessage}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>
             <footer className="text-center py-6 text-gray-500 text-sm">
                <p>Powered by Google Gemini</p>
            </footer>
        </div>
    );
};

export default App;