import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// Secure all admin routes strictly for Super Admins
router.get("/roles", authenticateToken, requireRole(UserRole.ADMIN), AdminController.listRoles);
router.post("/roles", authenticateToken, requireRole(UserRole.ADMIN), AdminController.createRole);
router.put("/roles/:id", authenticateToken, requireRole(UserRole.ADMIN), AdminController.updateRole);
router.get("/permissions", authenticateToken, requireRole(UserRole.ADMIN), AdminController.listPermissions);
router.get("/users", authenticateToken, requireRole(UserRole.ADMIN), AdminController.listUsers);
router.post("/assign-role", authenticateToken, requireRole(UserRole.ADMIN), AdminController.assignUserRole);
router.delete("/roles/:id", authenticateToken, requireRole(UserRole.ADMIN), AdminController.deleteRole);
router.get("/audit", authenticateToken, requireRole(UserRole.ADMIN), AdminController.listAuditLogs);
router.get("/config", authenticateToken, requireRole(UserRole.ADMIN), AdminController.getSystemConfig);
router.put("/config", authenticateToken, requireRole(UserRole.ADMIN), AdminController.updateSystemConfig);

export default router;
