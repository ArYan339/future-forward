export interface GeneratedImage {
    year: string;
    imageUrl: string | 'loading' | 'error';
    errorMessage?: string;
}
