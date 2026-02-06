import { Router } from "express";
import { OwnerController } from "../controllers/OwnerController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// All owner routes require login and OWNER role
router.use(authenticateToken);
router.use(requireRole(UserRole.OWNER));

router.get("/properties", OwnerController.getMyProperties);
router.get("/applications", OwnerController.getMyApplications);
router.get("/applications/:id", authenticateToken, OwnerController.getApplicationStatus);
router.get("/deeds/:id", authenticateToken, OwnerController.getDeedDetails);

export default router;
