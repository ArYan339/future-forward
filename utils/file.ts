
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove "data:*/*;base64," prefix
            const base64 = result.split(',')[1];
            if (base64) {
                 resolve(base64);
            } else {
                 reject(new Error("Failed to read file as base64 string."));
            }
        };
        reader.onerror = error => reject(error);
    });
};
