/**
 * Calculates the employee's cut from total revenue.
 * @param {number} totalRevenue
 * @param {number} commissionRate - as decimal (e.g. 0.6 for 60%)
 * @returns {number}
 */
export const calcEmployeeCut = (totalRevenue, commissionRate) => {
    return Math.round(totalRevenue * commissionRate * 100) / 100;
};

/**
 * Calculates the owner's profit after employee cut.
 * @param {number} totalRevenue
 * @param {number} employeeCut
 * @returns {number}
 */
export const calcOwnerProfit = (totalRevenue, employeeCut) => {
    return Math.round((totalRevenue - employeeCut) * 100) / 100;
};

/**
 * Calculates net profit after costs.
 * @param {number} revenue
 * @param {number} paidToBarbers
 * @param {number} costs
 * @returns {number}
 */
export const calcNetProfit = (revenue, paidToBarbers, costs) => {
    return Math.round((revenue - paidToBarbers - costs) * 100) / 100;
};

export default { calcEmployeeCut, calcOwnerProfit, calcNetProfit };
