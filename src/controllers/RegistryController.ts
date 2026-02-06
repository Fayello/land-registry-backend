import { Request, Response } from "express";
import { Deed } from "../entities/Deed";
import { Parcel } from "../entities/Parcel";

export class RegistryController {

    /**
     * Free Public Search
     * Returns limited info: Status, Approximate Area, Owner Initials.
     */
    static async search(req: Request, res: Response) {
        const { query } = req.query; // Expects ?query=Deed123 or Parcel456

        if (!query) {
            return res.status(400).json({ message: "Query parameter is required" });
        }

        try {
            // Search by Deed Number
            const deed = await Deed.findOne({
                where: { deed_number: query as string },
                relations: ["parcel", "owner"]
            });

            if (!deed) {
                // Fallback search by Parcel Number
                // Note: Logic could be expanded here. For now, simplifed.
                return res.status(404).json({ message: "Record not found" });
            }

            // MASK SENSITIVE DATA
            const ownerInitials = deed.owner.full_name
                .split(" ")
                .map((n) => n[0])
                .join(".") + ".";

            const publicData = {
                deed_number: deed.deed_number,
                status: deed.is_active ? "VALID" : "SUSPENDED",
                owner_initials: ownerInitials,
                locality: deed.parcel.locality,
                area_approx: deed.parcel.area_sq_meters, // No coordinates in free view
                registry_office: "Central Registry",
                last_update: deed.registration_date,
                parcel_status: deed.parcel.status,
            };

            res.json(publicData);
        } catch (error) {
            console.error("Search error", error)
            res.status(500).json({ message: "Search failed" });
        }
    }

    /**
     * Protected Full Details
     * Requires mock payment confirmation or valid User session.
     */
    static async getDetails(req: Request, res: Response) {
        const { id } = req.params;
        const { payment_token } = req.query;

        try {
            const deed = await Deed.findOne({
                where: { deed_number: id as string },
                relations: ["parcel", "owner", "conservator"]
            });

            if (!deed) return res.status(404).json({ message: "Deed not found" });

            let isAuthorized = false;

            // 1. Check if User is logged in (Role: Owner, Conservator, Agent)
            // (In real app, we'd check req.user from authMiddleware)

            // 2. Check Payment Token
            if (payment_token) {
                const { Transaction, PaymentStatus } = require("../entities/Transaction");
                const txn = await Transaction.findOne({
                    where: { id: String(payment_token), status: PaymentStatus.SUCCESS }
                });

                if (txn) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                // Return Restricted View (or 402)
                return res.status(402).json({
                    message: "Payment Required for Full Details",
                    fee_amount: 500,
                    preview: {
                        deed_number: deed.deed_number,
                        locality: deed.parcel.locality,
                        area: deed.parcel.area_sq_meters
                    }
                });
            }

            // Full access
            res.json({
                ...deed,
                owner: deed.owner, // Full details
                parcel: deed.parcel, // Contains boundary data (GeoJSON)
                watermark: "OFFICIAL COPY - DO NOT EDIT"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error fetching details" });
        }
    }
}
