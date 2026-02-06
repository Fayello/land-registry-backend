import { Router } from "express";
import { ParcelController } from "../controllers/ParcelController";

import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// POST /api/parcels - Create a new parcel with conflict check (Cadastre Only)
router.post("/", authenticateToken, requireRole([UserRole.CADASTRE, UserRole.ADMIN]), ParcelController.create);

// GET /api/parcels/:id - Get parcel details
router.get("/:id", authenticateToken, ParcelController.getOne);

export default router;
