import { Request, Response } from "express";
import { User, UserRole } from "../entities/User";
import jwt from "jsonwebtoken";
// Note: In a real app, use bcryptjs. For this prototype, we'll simulate hashing or use a simple one if installed. 
// I'll assume bcryptjs is NOT installed yet, so I'll add it to the install list or use simple string concat for prototype (NOT SECURE but functional for demo).
// WAIT - I can just install bcryptjs now.
// For now, I will write the code assuming bcrypt is available, and run the install command.

import bcrypt from "bcrypt"; // Need to install this

export class AuthController {
    static async register(req: Request, res: Response) {
        const { full_name, email, password, role, national_id_number, phone_number } = req.body;

        try {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User();
            user.full_name = full_name;
            user.email = email;
            user.password_hash = hashedPassword;
            user.role = role || UserRole.BUYER;
            user.national_id_number = national_id_number;
            user.phone_number = phone_number;

            await user.save();

            res.status(201).json({ message: "User registered successfully", userId: user.id });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({
                where: { email },
                relations: ["role_obj", "role_obj.permissions"]
            });

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const roleName = user.role_obj?.name || user.role;
            const permissions = user.role_obj?.permissions.map(p => p.name) || [];

            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    roleName: roleName,
                    permissions: permissions
                },
                process.env.JWT_SECRET || "secret",
                { expiresIn: "24h" }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.full_name,
                    role: user.role,
                    roleName: roleName,
                    permissions: permissions
                }
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
