const GenericCacheManager = require('../genericCacheManager');

const REPORT_DATA_TTL = 60 * 60; // 1 hour
const TRANSACTION_LIST_TTL = 15 * 60; // 15 minutes

class FinanceCacheManager extends GenericCacheManager {
    constructor() {
        super('Finance-Service');
    }

    // --- Report Caching ---
    async getReport(reportId) {
        return this.get(`report:${reportId}`);
    }

    async setReport(reportId, data) {
        await this.set(`report:${reportId}`, data, REPORT_DATA_TTL);
    }

    async invalidateReport(reportId) {
        await this.del(`report:${reportId}`);
    }

    // --- Sales Caching ---
    async getSales(orgId) {
        return this.get(`sales:${orgId}`);
    }

    async setSales(orgId, data) {
        await this.set(`sales:${orgId}`, data, TRANSACTION_LIST_TTL);
    }

    async invalidateSales(orgId) {
        await this.del(`sales:${orgId}`);
    }

    // --- Expenses Caching ---
    async getExpenses(orgId) {
        return this.get(`expenses:${orgId}`);
    }

    async setExpenses(orgId, data) {
        await this.set(`expenses:${orgId}`, data, TRANSACTION_LIST_TTL);
    }

    async invalidateExpenses(orgId) {
        await this.del(`expenses:${orgId}`);
    }
}

module.exports = new FinanceCacheManager();