import { Request, Response } from "express";
import { User, UserRole } from "../entities/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { MailService } from "../services/mailService";

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
            console.error("Login error [FULL STACK]:", error);
            res.status(500).json({
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? (error as any).message : undefined
            });
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                // For security reasons, don't reveal that the user doesn't exist
                return res.json({ message: "If an account exists with this email, you will receive an OTP." });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.reset_otp = otp;
            user.reset_otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await user.save();

            await MailService.sendOTP(email, otp);

            res.json({ message: "OTP sent successfully" });
        } catch (error: any) {
            console.error("Forgot password error:", error);
            res.status(500).json({
                message: "Internal server error",
                details: error.message,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined
            });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        const { email, otp, newPassword } = req.body;
        try {
            const user = await User.findOne({ where: { email, reset_otp: otp } });
            if (!user || !user.reset_otp_expires || user.reset_otp_expires < new Date()) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }

            user.password_hash = await bcrypt.hash(newPassword, 10);
            user.reset_otp = null as any;
            user.reset_otp_expires = null as any;
            await user.save();

            res.json({ message: "Password reset successfully" });
        } catch (error) {
            console.error("Reset password error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
