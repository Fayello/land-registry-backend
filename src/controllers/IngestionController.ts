import { Request, Response } from "express";
import { Deed } from "../entities/Deed";
import { Parcel, ParcelStatus } from "../entities/Parcel";
import { User } from "../entities/User";

export class IngestionController {
    /**
     * Simulates an AI OCR extraction from a physical scan.
     * In a real system, this would call a vision API (AWS Textract, Google Document AI, etc.)
     */
    static async handleIngest(req: Request, res: Response) {
        console.log("Backend: Received OCR extraction request");
        const { scanUrl, metadata, fileName } = req.body;
        const clerk = (req as any).user;
        console.log("Backend: Request user:", clerk?.email || "Unknown");

        if (!scanUrl && !fileName) {
            console.log("Backend: Missing scanUrl/fileName in request");
            return res.status(400).json({ message: "Scan image/PDF or Spreadsheet is required" });
        }

        try {
            const isSpreadsheet = fileName?.toLowerCase().endsWith('.xlsx') || fileName?.toLowerCase().endsWith('.csv') || scanUrl?.toLowerCase().endsWith('.xlsx') || scanUrl?.toLowerCase().endsWith('.csv');

            console.log(`Backend: Processing ${isSpreadsheet ? 'Spreadsheet' : 'OCR Scan'}...`);

            let extractedData;
            let confidenceScore = isSpreadsheet ? 1.0 : 0.98;

            if (isSpreadsheet) {
                // ... (existing spreadsheet logic)
                const isValidTemplate = fileName?.toLowerCase().includes("deeds") || fileName?.toLowerCase().includes("registry") || scanUrl?.toLowerCase().includes("deeds");
                if (!isValidTemplate) {
                    return res.status(400).json({
                        message: "The uploaded file does not match the mandatory National Land Registry template.",
                        code: "SCHEMA_MISMATCH"
                    });
                }
                extractedData = {
                    deed_number: metadata?.deed_number || `XLS-${Math.floor(Math.random() * 90000) + 10000}`,
                    vol: metadata?.vol || "S-" + (Math.floor(Math.random() * 500) + 100),
                    folio: metadata?.folio || Math.floor(Math.random() * 1000).toString(),
                    department: metadata?.department || "Mfoundi (from Roster)",
                    locality: metadata?.locality || "Yaoundé Central (Bulk)",
                    area_sq_meters: metadata?.area_sq_meters || (Math.floor(Math.random() * 800) + 200),
                    owner_name: metadata?.owner_name || "Extracted from Excel...",
                    parcel_number: metadata?.parcel_number || `LOT-XLS-${Math.floor(Math.random() * 5000)}`,
                    registration_date: metadata?.registration_date || new Date().toISOString(),
                    boundary: metadata?.boundary || { type: "Point", coordinates: [11.502, 3.848] },
                    owner_email: metadata?.owner_email || "jean.fossi@gmail.com"
                };
            } else {
                // VISION QUALITY GATE (Detection Logic)
                // If it's a camera capture, we simulate a 10% chance of "No Document Detected"
                // to reflect real-world issues like bad lighting or motion blur.
                const isCamera = fileName === "CAMERA_CAPTURE.jpg";
                const documentDetected = !isCamera || Math.random() > 0.1;

                if (!documentDetected) {
                    console.warn("Backend: Vision Gate Rejected Capture. No Deed Features Detected.");
                    return res.status(422).json({
                        message: "Vision Quality Check Failed: No land deed or historical manuscript detected in frame. Please realign for neural capture.",
                        code: "VISION_REJECTION"
                    });
                }

                if (isCamera) {
                    confidenceScore = 0.85; // Ad-hoc captures are less reliable
                }

                console.log("Backend: Simulating OCR extraction...");
                extractedData = {
                    deed_number: metadata?.deed_number || `LEGACY-${Math.floor(Math.random() * 90000) + 10000}`,
                    vol: metadata?.vol || "B-" + (Math.floor(Math.random() * 500) + 100),
                    folio: metadata?.folio || Math.floor(Math.random() * 1000).toString(),
                    department: metadata?.department || "Mfoundi",
                    locality: metadata?.locality || "Yaoundé Central",
                    area_sq_meters: metadata?.area_sq_meters || (Math.floor(Math.random() * 800) + 200),
                    owner_name: metadata?.owner_name || "Extracted from Scan...",
                    parcel_number: metadata?.parcel_number || `LOT-${Math.floor(Math.random() * 5000)}`,
                    registration_date: metadata?.registration_date || new Date().toISOString(),
                    boundary: metadata?.boundary || { type: "Point", coordinates: [11.502, 3.848] },
                    owner_email: metadata?.owner_email || "jean.fossi@gmail.com"
                };
            }

            console.log("Backend: Extraction complete, sending response:", extractedData);
            res.json({
                message: isSpreadsheet ? "Spreadsheet Parsing Complete" : "OCR Extraction Complete",
                extractedData,
                confidenceScore,
                isSpreadsheet
            });

        } catch (error: any) {
            console.error("Backend OCR Error:", error.message);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Finalizes the ingestion by saving the deed to the universal ledger.
     */
    static async confirmIngestion(req: Request, res: Response) {
        const { extractedData, scanUrl, ownerEmail } = req.body;
        const clerk = (req as any).user;

        try {
            // 1. Find or create the owner
            let owner = await User.findOne({ where: { email: ownerEmail } });
            if (!owner) {
                return res.status(404).json({ message: "Specified owner not found in system. Please register the citizen first." });
            }

            // 2. Find or create the historical Parcel reference in GIS
            let parcel = await Parcel.findOne({ where: { parcel_number: extractedData.parcel_number } });
            if (!parcel) {
                parcel = new Parcel();
                parcel.parcel_number = extractedData.parcel_number;
                parcel.locality = extractedData.locality || extractedData.department;
                parcel.area_sq_meters = Number(extractedData.area_sq_meters) || 500;
                parcel.status = ParcelStatus.ARCHIVED;
                parcel.boundary = extractedData.boundary || { type: "Point", coordinates: [11.502, 3.848] };
                await parcel.save();
            }

            // 3. Save as a Universal Deed
            const deed = new Deed();
            deed.deed_number = extractedData.deed_number;
            deed.vol = extractedData.vol;
            deed.folio = extractedData.folio;
            deed.department = extractedData.department;
            deed.title_deed_url = scanUrl;
            deed.owner = owner;
            deed.parcel = parcel;
            deed.is_active = true;
            deed.registration_date = new Date(extractedData.registration_date);

            await deed.save();

            // Link parcel to current deed and set status to VALID
            parcel.current_deed = deed;
            parcel.status = ParcelStatus.VALID;
            await parcel.save();

            res.status(201).json({
                message: "Legacy deed successfully migrated to digital ledger",
                deedId: deed.id,
                deedNumber: deed.deed_number
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Retrieves the history of ingested deeds for the current clerk/registry log.
     */
    static async getHistory(req: Request, res: Response) {
        try {
            const deeds = await Deed.find({
                relations: ["owner", "parcel"],
                order: { registration_date: "DESC" },
                take: 50
            });

            res.json(deeds);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
