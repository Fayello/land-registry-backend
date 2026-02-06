import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../entities/User";

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        role: UserRole;
        roleName?: string;
        permissions?: string[];
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AUTH] Incoming token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);

    if (!token) return res.status(401).json({ message: "Authentication required" });

    // Development Bypass for Portal Demo
    // Making it more robust: bypass if token matches, regardless of strict NODE_ENV check if it's undefined
    if (token === 'MOCK_TOKEN_OWNER_2') {
        console.log("[AUTH] Bypassing for MOCK_TOKEN_OWNER_2 (assigning user ID 8)");
        (req as AuthenticatedRequest).user = { userId: 8, role: UserRole.OWNER };
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || "secret", (err: any, user: any) => {
        if (err) {
            console.log(`[AUTH] JWT Verify Failed: ${err.message}`);
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        (req as AuthenticatedRequest).user = user;
        next();
    });
};

export const requireRole = (roles: UserRole | UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthenticatedRequest).user;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!user || (!allowedRoles.includes(user.role) && user.role !== UserRole.ADMIN)) {
            return res.status(403).json({ message: "Access denied: Required role missing" });
        }
        next();
    };
};

export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthenticatedRequest).user;

        // Super Admin bypass
        if (user?.role === UserRole.ADMIN || user?.roleName === "Super Admin") {
            return next();
        }

        if (!user || !user.permissions || !user.permissions.includes(permission)) {
            return res.status(403).json({
                message: `Access denied: Missing required permission [${permission}]`
            });
        }
        next();
    };
};
