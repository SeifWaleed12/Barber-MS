/**
 * Formats a number as Egyptian Pounds (ج.م).
 * @param {number} amount
 * @returns {string} e.g. "1,250 ج.م"
 */
export const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '0 ج.م';
    return `${Number(amount).toLocaleString('en-US')} ج.م`;
};

export default formatCurrency;
