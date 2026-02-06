import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { Transaction, PaymentStatus, PaymentPurpose } from "../entities/Transaction";
import { FeeCalculator, FeeType } from "../services/FeeCalculator";

export class PaymentController {

    /**
     * Step 1: Initiate a Payment
     * Body: { phone, purpose, reference_id, amount? }
     */
    static async initiate(req: Request, res: Response) {
        const { phone, purpose, reference_id, amount } = req.body;
        // In real app, user might be from token. For Public search, might be anonymous (just phone).

        // Determine Amount
        let finalAmount = amount;
        if (!finalAmount) {
            if (purpose === PaymentPurpose.SEARCH_FEE) {
                finalAmount = FeeCalculator.calculate(FeeType.SEARCH_FULL);
            } else if (purpose === PaymentPurpose.REGISTRATION_FEE) {
                finalAmount = FeeCalculator.calculate(FeeType.REGISTRATION_NEW);
            }
        }

        if (!finalAmount) {
            return res.status(400).json({ message: "Unable to determine fee amount" });
        }

        try {
            // Create Pending Transaction
            const txn = new Transaction();
            txn.amount = finalAmount;
            txn.currency = "XAF";
            txn.purpose = purpose;
            txn.payer_phone = phone;
            txn.reference_id = reference_id;
            txn.status = PaymentStatus.PENDING;
            await txn.save();

            // Call Mobile Money Provider
            const externalId = await PaymentService.initiatePayment(phone, finalAmount);

            txn.external_transaction_id = externalId;
            await txn.save();

            res.json({
                message: "Payment initiated. Please enter OTP.",
                transaction_id: txn.id,
                amount: finalAmount,
                phone: phone
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Payment Initiation Failed" });
        }
    }

    /**
     * Step 2: Confirm Payment (OTP)
     * Body: { transaction_id, otp }
     */
    static async confirm(req: Request, res: Response) {
        const { transaction_id, otp } = req.body;

        try {
            const txn = await Transaction.findOne({ where: { id: transaction_id } });
            if (!txn) return res.status(404).json({ message: "Transaction not found" });

            if (txn.status === PaymentStatus.SUCCESS) {
                return res.json({ message: "Already paid", payment_token: txn.id });
            }

            // Verify with Provider
            const isValid = await PaymentService.verifyPayment(txn.external_transaction_id, otp);

            if (isValid) {
                txn.status = PaymentStatus.SUCCESS;
                txn.completed_at = new Date();
                await txn.save();

                // Return a "Token" (The Transaction ID itself acts as proof of payment for now)
                res.json({
                    status: "SUCCESS",
                    message: "Payment confirmed",
                    payment_token: txn.id
                });
            } else {
                txn.status = PaymentStatus.FAILED;
                await txn.save();
                res.status(400).json({ message: "Invalid OTP or Payment Failed" });
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Confirmation Error" });
        }
    }
}
