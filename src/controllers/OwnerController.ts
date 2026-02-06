import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Deed } from "../entities/Deed";
import { Case } from "../entities/Case";

export class OwnerController {
    static async getMyProperties(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const deeds = await Deed.find({
                where: { owner: { id: userId }, is_active: true },
                relations: ["parcel"]
            });
            res.json(deeds);
        } catch (error) {
            console.error("Error fetching properties:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getMyApplications(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const cases = await Case.find({
                where: { initiator: { id: userId } },
                order: { created_at: "DESC" }
            });
            res.json(cases);
        } catch (error) {
            console.error("Error fetching applications:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getApplicationStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;
            const caseId = parseInt(id as string);

            const caseItem = await Case.findOne({
                where: { id: caseId, initiator: { id: userId } },
                relations: ["related_parcel", "related_parcel.current_deed"]
            });

            if (!caseItem) {
                return res.status(404).json({ message: "Application not found" });
            }

            res.json(caseItem);
        } catch (error) {
            console.error("Error fetching application detail:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getDeedDetails(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;
            const deed = await Deed.findOne({
                where: { id: parseInt(id as string), owner: { id: userId } },
                relations: ["parcel", "conservator"]
            });

            if (!deed) {
                return res.status(404).json({ message: "Deed not found or unauthorized" });
            }

            res.json(deed);
        } catch (error) {
            console.error("Error fetching deed details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
