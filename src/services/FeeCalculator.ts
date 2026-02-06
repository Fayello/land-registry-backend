export enum FeeType {
    SEARCH_FULL = "search_full",
    TRANSFER_DEED = "transfer_deed",
    REGISTRATION_NEW = "registration_new"
}

export class FeeCalculator {
    static readonly SEARCH_COST = 500; // 500 XAF for full search
    static readonly REGISTRATION_BASE = 50000; // Base fee

    static calculate(type: FeeType, valueOrArea?: number): number {
        switch (type) {
            case FeeType.SEARCH_FULL:
                return this.SEARCH_COST;

            case FeeType.REGISTRATION_NEW:
                // Logic: 50,000 + 100 per m2?
                // For prototype, Keep it simple
                return this.REGISTRATION_BASE;

            case FeeType.TRANSFER_DEED:
                if (!valueOrArea) throw new Error("Value required for transfer fee");
                // 5% of property value (Standard)
                return Math.floor(valueOrArea * 0.05);

            default:
                return 0;
        }
    }
}
