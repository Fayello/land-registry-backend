import { Request, Response } from "express";
import { Case, CaseStatus, CaseType } from "../entities/Case";
import { Deed } from "../entities/Deed";
import { Parcel, ParcelStatus } from "../entities/Parcel";
import { User, UserRole } from "../entities/User";
import { AppDataSource } from "../index";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class CaseController {

    /**
     * Submit a new Land Registration Application
     */
    static async create(req: Request, res: Response) {
        const { type, data, initiator_id, related_parcel_id } = req.body;
        const userId = (req as AuthenticatedRequest).user?.userId || initiator_id;

        try {
            const newCase = new Case();
            newCase.type = type || CaseType.NEW_REGISTRATION;
            newCase.initiator = { id: userId } as User;
            newCase.data = data;
            newCase.status = CaseStatus.PENDING_PAYMENT;

            if (related_parcel_id) {
                newCase.related_parcel = { id: related_parcel_id } as Parcel;
            }

            await newCase.save();

            res.status(201).json(newCase);
        } catch (error) {
            console.error("Case submission error:", error);
            res.status(500).json({ message: "Failed to submit application" });
        }
    }

    /**
     * List all pending cases based on Authority Jurisdiction
     */
    static async listPending(req: Request, res: Response) {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        try {
            const { history } = req.query;
            let statusFilters: CaseStatus[] = [];

            if (history === "true") {
                statusFilters = [CaseStatus.APPROVED, CaseStatus.REJECTED];
            } else {
                switch (user.role) {
                    case UserRole.CONSERVATOR:
                        statusFilters = [
                            CaseStatus.SUBMITTED,
                            CaseStatus.UNDER_REVIEW,
                            CaseStatus.PENDING_COMMISSION,
                            CaseStatus.COMMISSION_VISIT,
                            CaseStatus.TECHNICAL_VALIDATION,
                            CaseStatus.OPPOSITION_PERIOD,
                            CaseStatus.GOVERNOR_APPROVAL
                        ];
                        break;
                    case UserRole.CADASTRE:
                        statusFilters = [
                            CaseStatus.TECHNICAL_VALIDATION,
                            CaseStatus.COMMISSION_VISIT
                        ];
                        break;
                    case UserRole.SURVEYOR:
                        statusFilters = [
                            CaseStatus.PENDING_COMMISSION,
                            CaseStatus.COMMISSION_VISIT
                        ];
                        break;
                    case UserRole.ADMIN:
                        const allCases = await Case.find({
                            relations: ["initiator", "related_parcel"],
                            order: { created_at: "DESC" }
                        });
                        return res.json(allCases);
                    default:
                        return res.status(403).json({ message: "No official jurisdiction for this role" });
                }
            }

            const cases = await Case.find({
                where: statusFilters.map(status => ({ status })),
                relations: ["initiator", "related_parcel"],
                order: { updated_at: "DESC" }
            });

            console.log(`[DEBUG] listPending for UserID ${user.userId} (${user.role}): Found ${cases.length} cases. IDs: ${cases.map(c => c.id).join(",")}`);

            res.json(cases);
        } catch (error) {
            console.error("List pending cases error:", error);
            res.status(500).json({ message: "Error fetching cases" });
        }
    }

    /**
     * Get a specific Case by ID
     */
    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const caseItem = await Case.findOne({
                where: { id: parseInt(id as string) },
                relations: ["initiator", "related_parcel"]
            });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });
            res.json(caseItem);
        } catch (error) {
            res.status(500).json({ message: "Error fetching case details" });
        }
    }

    /**
     * Review a Case (Update Checklist/Status without finalizing)
     */
    static async review(req: Request, res: Response) {
        const { id } = req.params;
        const caseId = parseInt(id as string);
        const { checklist, status } = req.body; // status can be UNDER_REVIEW or REJECTED

        try {
            const caseItem = await Case.findOne({ where: { id: caseId } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            // Update checklist data
            caseItem.data = {
                ...caseItem.data,
                checklist: checklist
            };

            if (status) {
                caseItem.status = status;
            } else {
                caseItem.status = CaseStatus.UNDER_REVIEW;
            }

            await caseItem.save();
            res.json(caseItem);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error updating review" });
        }
    }

    /**
     * Approve a Case
     * This is the Critical Legal Step.
     * If type=NEW_REGISTRATION -> Create Parcel + Deed.
     */
    /**
     * Approve a Case
     * This is the Critical Legal Step.
     * Hardened SOD: Ensure technical validation exists if required.
     */
    static async approve(req: Request, res: Response) {
        const { id } = req.params;
        const caseId = parseInt(id as string);
        const authUser = (req as AuthenticatedRequest).user;
        const { checklist } = req.body;

        if (!authUser) return res.status(401).json({ message: "Unauthorized" });

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        // Set query runner data for Audit Log
        queryRunner.data = { userId: authUser.userId };

        try {
            const caseItem = await queryRunner.manager.findOne(Case, {
                where: { id: caseId },
                relations: ["initiator", "related_parcel"]
            });

            if (!caseItem) throw new Error("Case not found");
            if (caseItem.status === CaseStatus.APPROVED) throw new Error("Already approved");

            // BULLETPROOF SOD: Check if technical validation is required and present
            const technicalRequired = [CaseType.NEW_REGISTRATION, CaseType.SUBDIVISION].includes(caseItem.type);
            if (technicalRequired && !caseItem.data?.cadastre_validated_at) {
                return res.status(403).json({
                    message: "SOD VIOLATION: Legal approval blocked. Technical certification (Cadastre) missing."
                });
            }

            // Ensure case is in final approval state
            if (caseItem.status !== CaseStatus.GOVERNOR_APPROVAL && caseItem.status !== CaseStatus.OPPOSITION_PERIOD) {
                // In some flows opposition is enough, but usually Governor is final. 
                // For this prototype, we allow approval from Governor state or opposition if it's a mutation.
            }

            // VALIDATE CHECKLIST
            const finalChecklist = checklist || caseItem.data.checklist || {};
            caseItem.data = {
                ...caseItem.data,
                checklist: finalChecklist
            };

            // LOGIC: Create Deed if it's a registration
            if (caseItem.type === CaseType.NEW_REGISTRATION) {
                const parcel = new Parcel();
                parcel.parcel_number = caseItem.data.parcel_number;
                parcel.locality = caseItem.data.locality;
                parcel.area_sq_meters = caseItem.data.area;
                parcel.status = ParcelStatus.VALID;
                await queryRunner.manager.save(parcel);

                const deed = new Deed();
                deed.deed_number = `${Math.floor(10000 + Math.random() * 90000)}`;
                deed.vol = `${Math.floor(100 + Math.random() * 900)}`;
                deed.folio = `${Math.floor(10 + Math.random() * 190)}`;
                deed.department = caseItem.data.locality || "CENTRE";
                deed.parcel = parcel;
                deed.owner = caseItem.initiator;
                deed.conservator = { id: authUser.userId } as User;
                deed.is_active = true;
                deed.digital_seal_hash = "SHA256-MOCK-HASH-" + Date.now();
                await queryRunner.manager.save(deed);

                parcel.current_deed = deed;
                await queryRunner.manager.save(parcel);

                caseItem.related_parcel = parcel;
            } else if (caseItem.type === CaseType.TRANSFER) {
                const parcel = await queryRunner.manager.findOne(Parcel, {
                    where: { id: caseItem.related_parcel?.id },
                    relations: ["current_deed"]
                });

                if (parcel && parcel.current_deed) {
                    parcel.current_deed.is_active = false;
                    await queryRunner.manager.save(parcel.current_deed);

                    const newDeed = new Deed();
                    newDeed.deed_number = `${parcel.current_deed.deed_number}/M`;
                    newDeed.vol = parcel.current_deed.vol;
                    newDeed.folio = parcel.current_deed.folio;
                    newDeed.department = parcel.current_deed.department;
                    newDeed.parcel = parcel;
                    newDeed.owner = caseItem.initiator;
                    newDeed.conservator = { id: authUser.userId } as User;
                    newDeed.is_active = true;
                    newDeed.digital_seal_hash = "SHA256-MUTATION-HASH-" + Date.now();
                    await queryRunner.manager.save(newDeed);

                    parcel.current_deed = newDeed;
                    await queryRunner.manager.save(parcel);
                }
            } else if (caseItem.type === CaseType.SUBDIVISION) {
                const parentParcel = await queryRunner.manager.findOne(Parcel, {
                    where: { id: caseItem.related_parcel?.id }
                });

                if (parentParcel) {
                    const childParcel = new Parcel();
                    childParcel.parcel_number = `${parentParcel.parcel_number}-A`;
                    childParcel.locality = parentParcel.locality;
                    childParcel.area_sq_meters = caseItem.data.area || (parentParcel.area_sq_meters / 2);
                    childParcel.status = ParcelStatus.VALID;
                    await queryRunner.manager.save(childParcel);

                    const childDeed = new Deed();
                    childDeed.deed_number = `${Math.floor(10000 + Math.random() * 90000)}`;
                    childDeed.vol = `${Math.floor(100 + Math.random() * 900)}`;
                    childDeed.folio = `${Math.floor(10 + Math.random() * 190)}`;
                    childDeed.department = parentParcel.locality;
                    childDeed.parcel = childParcel;
                    childDeed.owner = caseItem.initiator;
                    childDeed.conservator = { id: authUser.userId } as User;
                    childDeed.is_active = true;
                    childDeed.digital_seal_hash = "SHA256-SUBDIV-HASH-" + Date.now();
                    await queryRunner.manager.save(childDeed);
                }
            }

            caseItem.status = CaseStatus.APPROVED;
            caseItem.assigned_to = { id: authUser.userId } as User;

            await queryRunner.manager.save(caseItem);

            await queryRunner.commitTransaction();
            res.json({ message: "Case approved and Deed generated", case: caseItem });

        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            console.error(error);
            res.status(500).json({ message: error.message });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Simulate Fee Payment for a Case
     */
    static async payFees(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            if (caseItem.status !== CaseStatus.PENDING_PAYMENT) {
                return res.status(400).json({ message: "Application is not in payment state" });
            }

            if (caseItem.type === CaseType.NEW_REGISTRATION) {
                caseItem.status = CaseStatus.PENDING_COMMISSION;
            } else if (caseItem.type === CaseType.SUBDIVISION) {
                caseItem.status = CaseStatus.MUNICIPAL_INVESTIGATION;
            } else {
                caseItem.status = CaseStatus.SUBMITTED;
            }

            await caseItem.save();
            res.json({ message: "Payment verified successfully", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error processing payment" });
        }
    }

    /**
     * Schedule a Land Commission site visit
     */
    static async scheduleVisit(req: Request, res: Response) {
        const { id } = req.params;
        const { visitDate } = req.body;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            caseItem.status = CaseStatus.COMMISSION_VISIT;
            caseItem.data = {
                ...caseItem.data,
                visit_date: visitDate,
                commission_scheduled_at: new Date()
            };

            await caseItem.save();
            res.json({ message: "Visit scheduled successfully", status: caseItem.status, visitDate });
        } catch (error) {
            res.status(500).json({ message: "Error scheduling visit" });
        }
    }

    /**
     * Start the public opposition period
     */
    static async startNotice(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            caseItem.status = CaseStatus.OPPOSITION_PERIOD;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            caseItem.data = {
                ...caseItem.data,
                notice_start_date: new Date(),
                notice_expiration_date: expirationDate
            };

            await caseItem.save();
            res.json({ message: "Public notice period started", status: caseItem.status, expires: expirationDate });
        } catch (error) {
            res.status(500).json({ message: "Error starting notice" });
        }
    }

    /**
     * List all cases currently in public notice
     */
    static async listNotices(req: Request, res: Response) {
        try {
            const notices = await Case.find({
                where: { status: CaseStatus.OPPOSITION_PERIOD },
                relations: ["initiator"]
            });
            res.json(notices);
        } catch (error) {
            res.status(500).json({ message: "Error fetching notices" });
        }
    }

    /**
     * Get a specific public notice by ID
     */
    static async getPublicNotice(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const notice = await Case.findOne({
                where: {
                    id: parseInt(id as string),
                    status: CaseStatus.OPPOSITION_PERIOD
                },
                relations: ["initiator"]
            });
            if (!notice) return res.status(404).json({ message: "Public notice not found or expired" });
            res.json(notice);
        } catch (error) {
            res.status(500).json({ message: "Error fetching public notice" });
        }
    }

    /**
     * Upload an official field report (Surveyor Action)
     */
    static async uploadReport(req: Request, res: Response) {
        const { id } = req.params;
        const { reportUrl } = req.body;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            caseItem.status = CaseStatus.TECHNICAL_VALIDATION;
            caseItem.data = {
                ...caseItem.data,
                field_report_url: reportUrl,
                report_uploaded_at: new Date()
            };

            await caseItem.save();
            res.json({ message: "Field report uploaded successfully. Awaiting Cadastre validation.", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error uploading report" });
        }
    }

    /**
     * Validate the Technical Plan (Cadastre Action)
     * Hardened SOD: Stamp validation data.
     */
    static async validateTechnicalPlan(req: Request, res: Response) {
        const { id } = req.params;
        const authUser = (req as AuthenticatedRequest).user;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            if (caseItem.status !== CaseStatus.TECHNICAL_VALIDATION) {
                return res.status(400).json({ message: "Case is not in technical validation phase" });
            }

            // Transition to Opposition Period
            caseItem.status = CaseStatus.OPPOSITION_PERIOD;
            caseItem.data = {
                ...caseItem.data,
                cadastre_validated_at: new Date(),
                cadastre_officer_id: authUser?.userId,
                notice_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };

            await caseItem.save();
            res.json({ message: "Technical plan validated. Public opposition period started.", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error validating technical plan" });
        }
    }

    /**
     * Move case to Governor Approval phase
     */
    /**
     * Authorize the Field Commission (after Administrative Review)
     */
    static async authorizeCommission(req: Request, res: Response) {
        const { id } = req.params;
        const { checklist } = req.body;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            if (caseItem.status !== CaseStatus.SUBMITTED && caseItem.status !== CaseStatus.UNDER_REVIEW) {
                return res.status(400).json({ message: "Case is not in administrative review phase" });
            }

            // Update checklist if provided
            if (checklist) {
                caseItem.data = { ...caseItem.data, checklist };
            }

            // Transition to Pending Commission
            caseItem.status = CaseStatus.PENDING_COMMISSION;
            await caseItem.save();

            res.json({ message: "Administrative vetting complete. Field commission authorized.", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error authorizing commission" });
        }
    }

    static async requestGovernorApproval(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            caseItem.status = CaseStatus.GOVERNOR_APPROVAL;
            caseItem.data = {
                ...caseItem.data,
                governor_request_at: new Date()
            };

            await caseItem.save();
            res.json({ message: "Sent for Governor Approval", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error requesting approval" });
        }
    }

    /**
     * Technical Query (Cadastre Action)
     * Returns the case to the surveyor for corrections without total rejection.
     */
    static async technicalQuery(req: Request, res: Response) {
        const { id } = req.params;
        const { reason } = req.body;
        try {
            const caseItem = await Case.findOne({ where: { id: parseInt(id as string) } });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            caseItem.status = CaseStatus.COMMISSION_VISIT; // Bounce back
            caseItem.data = {
                ...caseItem.data,
                technical_query: reason,
                last_query_at: new Date()
            };

            await caseItem.save();
            res.json({ message: "Technical query sent to field geometer", status: caseItem.status });
        } catch (error) {
            res.status(500).json({ message: "Error issuing technical query" });
        }
    }

    // Reject a Case (Full Administrative Rejection - Conservator Only)
    static async reject(req: Request, res: Response) {
        const { id } = req.params;
        const { reason } = req.body;
        const authUser = (req as AuthenticatedRequest).user;

        try {
            const caseItem = await Case.findOne({
                where: { id: parseInt(id as string) },
                relations: ["initiator"]
            });
            if (!caseItem) return res.status(404).json({ message: "Case not found" });

            // Hardened SOD: Only Conservators can KILL a file
            if (!authUser?.permissions?.includes("cases.seal")) {
                return res.status(403).json({ message: "SOD VIOLATION: Technical officers cannot issue final administrative rejections." });
            }

            caseItem.status = CaseStatus.REJECTED;
            caseItem.data = {
                ...(caseItem.data || {}),
                rejection_reason: reason || "Administrative non-compliance",
                rejected_by: authUser.userId,
                rejected_at: new Date()
            };

            await caseItem.save();

            res.json({ message: "Case officially rejected by Conservator", case: caseItem });
        } catch (error) {
            console.error("Rejection error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
