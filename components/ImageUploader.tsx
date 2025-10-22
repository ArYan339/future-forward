import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragEvent = (e: React.DragEvent<HTMLLabelElement>, isDragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
           setDragging(isDragging);
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        handleDragEvent(e, false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    }

    const baseClasses = "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300";
    const inactiveClasses = "border-gray-600 bg-gray-800 hover:bg-gray-700";
    const activeClasses = "border-blue-500 bg-gray-700";
    const disabledClasses = "bg-gray-700 cursor-not-allowed border-gray-500";

    const getClasses = () => {
        if (disabled) return `${baseClasses} ${disabledClasses}`;
        if (dragging) return `${baseClasses} ${activeClasses}`;
        return `${baseClasses} ${inactiveClasses}`;
    }

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={disabled}
            />
            <label
                onClick={handleClick}
                onDragEnter={(e) => handleDragEvent(e, true)}
                onDragLeave={(e) => handleDragEvent(e, false)}
                onDragOver={(e) => handleDragEvent(e, true)}
                onDrop={handleDrop}
                className={getClasses()}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                    <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs">PNG, JPG or WEBP</p>
                </div>
            </label>
        </div>
    );
};