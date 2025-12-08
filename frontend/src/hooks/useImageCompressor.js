import { useState } from 'react';

export const useImageCompressor = () => {

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const [state, setState] = useState({
        originalImage: null,
        compressedImage: null,
        originalSize: 0,
        compressedSize: 0,
        processingTime: 0,
        loading: false,
        error: null,
    });



    const resetState = () => {
        setState(prev => ({
            ...prev,
            compressedImage: null,
            compressedSize: 0,
            processingTime: 0,
            error: null
        }));
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        // Revoke old URL to avoid memory leaks
        if (state.originalImage) URL.revokeObjectURL(state.originalImage);
        if (state.compressedImage) URL.revokeObjectURL(state.compressedImage);

        setState({
            originalImage: URL.createObjectURL(file),
            originalSize: file.size,
            compressedImage: null,
            compressedSize: 0,
            processingTime: 0,
            loading: false,
            error: null,
        });
    };

    const compressImage = async (file, kValue) => {
        if (!file) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        const startTime = performance.now();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('k', kValue);

        try {
                const response = await fetch(`${API_BASE_URL}/compress`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Compression failed on server.');

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            const endTime = performance.now();

            setState(prev => ({
                ...prev,
                compressedImage: imageUrl,
                compressedSize: blob.size,
                processingTime: endTime - startTime,
                loading: false,
            }));
        } catch (err) {
            setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    return {
        ...state,
        handleFileSelect,
        compressImage
    };
};
