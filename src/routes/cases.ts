import { Router } from "express";
import { CaseController } from "../controllers/CaseController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

router.post("/submit", authenticateToken, CaseController.create);
router.get("/pending", authenticateToken, CaseController.listPending);
router.get("/notices", CaseController.listNotices);
router.get("/notices/:id", CaseController.getPublicNotice);
router.get("/:id", authenticateToken, CaseController.getById);
router.put("/:id/review", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.review);
router.put("/:id/reject", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.reject);
router.post("/:id/approve", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.approve);
router.post("/:id/pay-fees", CaseController.payFees);
router.put("/:id/schedule-visit", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.scheduleVisit);
router.put("/:id/start-notice", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.startNotice);
router.put("/:id/upload-report", authenticateToken, requireRole(UserRole.SURVEYOR), CaseController.uploadReport);
router.put("/:id/validate-technical", authenticateToken, requireRole(UserRole.CADASTRE), CaseController.validateTechnicalPlan);
router.put("/:id/technical-query", authenticateToken, requireRole(UserRole.CADASTRE), CaseController.technicalQuery);
router.put("/:id/authorize-commission", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.authorizeCommission);
router.put("/:id/request-governor-approval", authenticateToken, requireRole(UserRole.CONSERVATOR), CaseController.requestGovernorApproval);

export default router;
