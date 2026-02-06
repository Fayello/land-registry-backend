import { Router } from "express";
import { RegistryController } from "../controllers/RegistryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/search", RegistryController.search);
router.get("/details/:id", authenticateToken, RegistryController.getDetails);

export default router;
