import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageCompressor } from './hooks/useImageCompressor';
import { formatBytes, calculateReduction } from './utils/formatters';
import {
    UploadIcon, ImageIcon, DownloadIcon, SettingsIcon, StatsIcon
} from './components/icons/Icons';
import './App.css';


const LoadingOverlay = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1c1570]/90 backdrop-blur-md"
    >
        <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-[#ffe500] border-r-[#ffe500] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="mt-6 text-xl font-bold text-white tracking-widest">PROCESSING</h3>
        <p className="text-[#ffe500] text-sm animate-pulse mt-2">Optimizing your image...</p>
    </motion.div>
);

const Card = ({ children, className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl min-h-[340px] h-auto lg:h-[340px] flex flex-col ${className}`}>
        {children}
    </div>
);

const ImageCard = ({ title, image, loading, placeholderText, badgeColor = "bg-black/50", footerNode }) => (
    <div className="bg-black/30 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden min-h-[340px] h-auto lg:h-[340px] relative flex flex-col">
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest z-10 ${badgeColor}`}>
            {title}
        </div>

        <div className="flex-grow p-4 w-full flex items-center justify-center overflow-hidden min-h-[200px]">
            {loading ? (
                <div className="flex flex-col items-center opacity-50">
                    <ImageIcon className="animate-pulse" />
                </div>
            ) : image ? (
                <img src={image} alt={title} className="max-w-full max-h-[220px] object-contain" />
            ) : (
                <div className="text-white/20 flex flex-col items-center">
                    <ImageIcon />
                    <span className="text-sm mt-2">{placeholderText}</span>
                </div>
            )}
        </div>

        {footerNode && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-4 bg-white/5 border-t border-white/10 mt-auto">
                {footerNode}
            </motion.div>
        )}
    </div>
);

const StatsItem = ({ label, value, valueColor = "text-white" }) => (
    <div className="bg-black/20 rounded-xl p-4 flex flex-col justify-center transition-colors hover:bg-black/30">
        <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-xl font-mono ${valueColor}`}>{value}</span>
    </div>
);


function App() {
    const {
        originalImage, compressedImage, originalSize, compressedSize,
        processingTime, loading, error, handleFileSelect, compressImage
    } = useImageCompressor();

    const [k, setK] = useState(50);
    const fileInputRef = useRef(null);
    const resultCardRef = useRef(null);

    const onFileChange = (e) => handleFileSelect(e.target.files[0]);
    const onTriggerUpload = () => fileInputRef.current.click();
    const onCompress = () => compressImage(fileInputRef.current.files[0], k);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = compressedImage;
        link.download = `compressed_k${k}.jpg`;
        link.click();
    };

    useEffect(() => {
        if (!loading && compressedImage && resultCardRef.current) {
            setTimeout(() => {
                resultCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [loading, compressedImage]);

    const reductionPercent = calculateReduction(originalSize, compressedSize);

    return (
        <div className="min-h-screen bg-[#1c1570] text-white flex flex-col items-center justify-center p-6 font-sans relative">

            <AnimatePresence>
                {loading && <LoadingOverlay key="loader" />}
            </AnimatePresence>

            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#ffe500] rounded-full mix-blend-soft-light filter blur-[100px] opacity-20"></div>
                <div className="absolute top-1/2 right-0 w-80 h-80 bg-[#ffd000] rounded-full mix-blend-soft-light filter blur-[100px] opacity-10"></div>
            </div>

            <motion.div
                className="relative z-10 max-w-7xl w-full"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            >
                <header className="text-center mb-10 mt-4 md:mt-0">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#ffe500] to-[#ffd000] tracking-tight mb-2">
                        PCA COMPRESSOR
                    </h1>
                    <p className="text-blue-200/60 font-light tracking-wide">Image Reduction Tool</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">

                    <div className="space-y-6">
                        <Card className="justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-[#ffe500]">
                                    <SettingsIcon />
                                    <h2 className="text-lg font-bold tracking-wider">SETTINGS</h2>
                                </div>
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2 text-gray-300">
                                        <span>Compression Level (K)</span>
                                        <span className="font-mono text-[#ffe500]">{k}</span>
                                    </div>
                                    <input type="range" min="1" max="500" value={k} onChange={(e) => setK(e.target.value)}
                                           className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#ffe500]"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                        <span>Smaller Size</span>
                                        <span>Better Quality</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4 lg:mt-0">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                                <button onClick={onTriggerUpload} className="w-full py-3 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-gray-300">
                                    <UploadIcon /> {originalImage ? 'Change Image' : 'Select Image'}
                                </button>
                                <button onClick={onCompress} disabled={loading || !originalImage}
                                        className={`w-full py-4 rounded-xl font-bold text-black transition-all shadow-lg flex justify-center items-center gap-2 ${!originalImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#ffe500] to-[#ffd000] hover:scale-[1.02]'}`}
                                >
                                    COMPRESS IMAGE
                                </button>
                            </div>
                            {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
                        </Card>

                        <Card>
                            <div className="flex items-center gap-2 mb-6 text-[#ffe500]">
                                <StatsIcon />
                                <h2 className="text-lg font-bold tracking-wider">STATISTICS</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 h-full content-start">
                                <StatsItem label="Original Size" value={originalImage ? formatBytes(originalSize) : '-'} />
                                <StatsItem label="Result Size" value={compressedImage ? formatBytes(compressedSize) : '-'} valueColor="text-[#ffe500]" />
                                <StatsItem label="Reduction" value={compressedImage ? `${reductionPercent}%` : '-'} valueColor={parseFloat(reductionPercent) > 0 ? "text-green-400" : "text-white"} />
                                <StatsItem label="Time" value={compressedImage ? `${(processingTime / 1000).toFixed(3)}s` : '-'} />
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <ImageCard
                            title="ORIGINAL"
                            image={originalImage}
                            placeholderText="No Image Selected"
                            badgeColor="bg-black/50 text-white/70 border border-white/10"
                        />

                        <div ref={resultCardRef}>
                            <ImageCard
                                title="RESULT"
                                image={compressedImage}
                                loading={false}
                                placeholderText="Waiting for compression"
                                badgeColor="bg-[#ffe500] text-[#1c1570]"
                                footerNode={compressedImage && (
                                    <button onClick={handleDownload} className="w-full py-3 bg-[#1c1570] border border-[#ffe500] text-[#ffe500] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#ffe500] hover:text-[#1c1570] transition-colors duration-300">
                                        <DownloadIcon /> DOWNLOAD RESULT
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default App;