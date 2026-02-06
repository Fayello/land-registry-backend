import { Request, Response } from "express";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { User, UserRole } from "../entities/User";
import { In } from "typeorm";
import { SystemConfig } from "../entities/SystemConfig";
import { AuditLog } from "../entities/AuditLog";

export class AdminController {
    // Role Management
    static async listRoles(req: Request, res: Response) {
        try {
            const roles = await Role.find({ relations: ["permissions"] });
            res.json(roles);
        } catch (error) {
            res.status(500).json({ message: "Error fetching roles" });
        }
    }

    static async createRole(req: Request, res: Response) {
        const { name, description, permissionIds } = req.body;
        try {
            const role = Role.create({ name, description });
            if (permissionIds && permissionIds.length > 0) {
                const permissions = await Permission.find({
                    where: { id: In(permissionIds) }
                });
                role.permissions = permissions;
            }
            await role.save();
            res.status(201).json(role);
        } catch (error) {
            res.status(500).json({ message: "Error creating role" });
        }
    }

    static async updateRole(req: Request, res: Response) {
        const { id } = req.params;
        const roleId = parseInt(String(id));
        const { name, description, permissionIds } = req.body;
        try {
            const role = await Role.findOne({
                where: { id: roleId },
                relations: ["permissions"]
            });
            if (!role) return res.status(404).json({ message: "Role not found" });

            if (name) role.name = name;
            if (description) role.description = description;
            if (permissionIds) {
                const permissions = await Permission.find({
                    where: { id: In(permissionIds) }
                });
                role.permissions = permissions;
            }

            await role.save();
            res.json(role);
        } catch (error) {
            res.status(500).json({ message: "Error updating role" });
        }
    }

    // Permission Management
    static async listPermissions(req: Request, res: Response) {
        try {
            const permissions = await Permission.find();
            res.json(permissions);
        } catch (error) {
            res.status(500).json({ message: "Error fetching permissions" });
        }
    }

    // User Role Assignment
    static async assignUserRole(req: Request, res: Response) {
        const { userId, roleId } = req.body;
        try {
            const user = await User.findOneBy({ id: userId });
            const role = await Role.findOneBy({ id: roleId });

            if (!user || !role) return res.status(404).json({ message: "User or Role not found" });

            user.role_obj = role;
            user.role = role.name.toLowerCase() as UserRole; // Maintain legacy field compatibility
            await user.save();

            res.json({ message: "Role assigned successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error assigning role" });
        }
    }

    static async listUsers(req: Request, res: Response) {
        try {
            const users = await User.find({
                relations: ["role_obj"],
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    role: true,
                    created_at: true
                }
            });
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: "Error fetching users" });
        }
    }

    static async deleteRole(req: Request, res: Response) {
        const { id } = req.params;
        const roleId = parseInt(String(id));
        try {
            const role = await Role.findOne({ where: { id: roleId } });
            if (!role) return res.status(404).json({ message: "Role not found" });

            // Check if any users have this role
            const userCount = await User.count({ where: { role_obj: { id: roleId } } });
            if (userCount > 0) {
                return res.status(400).json({ message: "Cannot delete role while it is assigned to users" });
            }

            await role.remove();
            res.json({ message: "Role deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting role" });
        }
    }
    static async listAuditLogs(req: Request, res: Response) {
        try {
            const logs = await AuditLog.find({
                order: { timestamp: "DESC" },
                take: 100 // Last 100 actions
            });

            // Enrich with user details manually if needed, or rely on actor_id
            const userIds = [...new Set(logs.map((l: AuditLog) => l.actor_id).filter((id: number) => id))];
            if (userIds.length > 0) {
                const users = await User.find({ where: { id: In(userIds) as any } });
                const userMap = new Map(users.map(u => [u.id, u.full_name]));

                const enrichedLogs = logs.map((log: AuditLog) => ({
                    ...log,
                    actor_name: userMap.get(log.actor_id) || "System"
                }));
                return res.json(enrichedLogs);
            }

            res.json(logs);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            res.status(500).json({ message: "Error fetching audit logs" });
        }
    }

    static async getSystemConfig(req: Request, res: Response) {
        try {
            const configs = await SystemConfig.find();
            const configMap = configs.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);
            res.json(configMap);
        } catch (error) {
            res.status(500).json({ message: "Error fetching system config" });
        }
    }

    static async updateSystemConfig(req: Request, res: Response) {
        const { key, value } = req.body;
        try {
            let config = await SystemConfig.findOneBy({ key });
            if (!config) {
                config = SystemConfig.create({ key, value: String(value) });
            } else {
                config.value = String(value);
            }
            await config.save();
            res.json({ message: "Configuration updated", key, value });
        } catch (error) {
            res.status(500).json({ message: "Error updating system config" });
        }
    }
}
