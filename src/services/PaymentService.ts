/**
 * Mock Service for Mobile Money Providers (MTN / Orange Money)
 */
export class PaymentService {

    /**
     * Initiate a payment request
     * @param phone Payer phone number
     * @param amount Amount to charge
     * @returns Transaction ID (mocked)
     */
    static async initiatePayment(phone: string, amount: number): Promise<string> {
        console.log(`[MOCK PAYMENT] Initiating charge of ${amount} XAF to ${phone}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return a mock external ID
        const mockTxId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return mockTxId;
    }

    /**
     * Verify payment status
     * @param transactionId 
     * @param otp Mock OTP (For prototype user must enter '1234')
     */
    static async verifyPayment(transactionId: string, otp: string): Promise<boolean> {
        console.log(`[MOCK PAYMENT] Verifying ${transactionId} with OTP ${otp}`);

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // MOCK LOGIC: Only OTP '1234' works
        if (otp === '1234') {
            return true;
        }
        return false;
    }
}
