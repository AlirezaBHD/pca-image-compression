/**
 * Formats bytes into human-readable string (KB, MB, etc.)
 * @param {number} bytes - The size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Calculates percentage reduction
 * @param {number} original
 * @param {number} compressed
 * @returns {string} Percentage fixed to 1 decimal
 */
export const calculateReduction = (original, compressed) => {
    if (!original || !compressed) return '0';
    return ((original - compressed) / original * 100).toFixed(1);
};