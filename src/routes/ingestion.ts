import { Router } from "express";
import { IngestionController } from "../controllers/IngestionController";
import { ScannerController } from "../controllers/ScannerController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Clerk-only ingestion routes
router.post("/extract", authenticateToken, IngestionController.handleIngest);
router.post("/confirm", authenticateToken, IngestionController.confirmIngestion);
router.get("/history", authenticateToken, IngestionController.getHistory);

// Hardware Bridge Simulation (Exposed for Hardware Discovery Demo)
router.post("/scanner/initialize", (req, res) => ScannerController.initializeHardware(req, res));
router.post("/scanner/scan", (req, res) => ScannerController.triggerScan(req, res));
router.get("/scanner/status", (req, res) => ScannerController.getStatus(req, res));

export default router;
