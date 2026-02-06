import { Request, Response } from "express";
import { Parcel, ParcelStatus } from "../entities/Parcel";
import { GeoUtils } from "../utils/GeoUtils";

export class ParcelController {

    // Create a new parcel (Draft/Pending)
    static async create(req: Request, res: Response) {
        try {
            const { survey_number, locality, area_sq_meters, boundary } = req.body;

            // 1. Basic Validation
            if (!survey_number || !boundary) {
                return res.status(400).json({ message: "Survey number and boundary are required." });
            }

            // 2. Geolocation Overlap Check
            const existingParcels = await Parcel.find({ where: { status: ParcelStatus.VALID } }); // Only check against valid parcels
            const isOverlap = await GeoUtils.checkForOverlap(boundary, existingParcels);

            if (isOverlap) {
                return res.status(409).json({
                    message: "CONFLICT: The proposed boundary overlaps with an existing registered parcel.",
                    code: "GEO_OVERLAP"
                });
            }

            // 3. Save Parcel
            const parcel = new Parcel();
            parcel.parcel_number = survey_number; // Mapping survey to parcel_number for now
            parcel.locality = locality;
            parcel.area_sq_meters = area_sq_meters;
            parcel.status = ParcelStatus.VALID; // Auto-valid for this demo, normally PENDING
            parcel.boundary = boundary;

            await parcel.save();

            return res.status(201).json(parcel);

        } catch (error) {
            console.error("Create Parcel Error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Inspect a parcel
    static async getOne(req: Request, res: Response) {
        const { id } = req.params;
        const parcelId = parseInt(id as string);
        if (isNaN(parcelId)) return res.status(400).json({ message: "Invalid ID" });

        const parcel = await Parcel.findOne({ where: { id: parcelId } });
        if (!parcel) return res.status(404).json({ message: "Parcel not found" });
        return res.json(parcel);
    }
}
