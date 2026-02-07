import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Parcel } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { AuditLog } from "./entities/AuditLog";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import { Case } from "./entities/Case";
import { Transaction } from "./entities/Transaction";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { SystemConfig } from "./entities/SystemConfig";
import { seedRBAC } from "./seeders/rbacSeeder";
import authRoutes from "./routes/auth";
import registryRoutes from "./routes/registry";
import caseRoutes from "./routes/cases";
import ownerRoutes from "./routes/owner.routes";
import paymentRoutes from "./routes/payments";
import parcelRoutes from "./routes/parcels";
import adminRoutes from "./routes/admin";
import ingestionRoutes from "./routes/ingestion";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ["https://digifoncier.vercel.app", "https://land-registry-frontend.vercel.app", "http://localhost:3000"],
    credentials: true
}));

// Middleware to ensure DB is initialized before requests
app.use(async (req, res, next) => {
    if (!AppDataSource.isInitialized) {
        console.log("Waiting for database initialization...");
        try {
            await AppDataSource.initialize();
            console.log("Database initialized on-demand");
            next();
        } catch (err) {
            console.error("Database initialization failed:", err);
            res.status(500).json({ message: "Database connection failed", status: "error" });
        }
    } else {
        next();
    }
});

app.use(express.json());

// Database Connection
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production" || !!databaseUrl;

if (isProduction && !databaseUrl) {
    console.warn("⚠️  WARNING: Running in production mode but DATABASE_URL is UNDEFINED. Defaulting to local postgres (which will fail on Vercel).");
} else if (databaseUrl) {
    console.log(`📡 Database URL detected: ${databaseUrl.substring(0, 15)}...${databaseUrl.substring(databaseUrl.length - 5)}`);
}

export const AppDataSource = new DataSource(
    isProduction && databaseUrl
        ? {
            type: "postgres",
            url: databaseUrl,
            synchronize: false,
            logging: true,
            entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
            subscribers: [AuditSubscriber],
            ssl: {
                rejectUnauthorized: false, // Required for Neon
            },
        }
        : {
            type: "sqlite",
            database: "database_v2.sqlite",
            synchronize: true, // Use sync only for local dev
            logging: true,
            entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
            subscribers: [AuditSubscriber],
        }
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ingestion", ingestionRoutes);

const startServer = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connected via TypeORM");
        }

        // Seed RBAC on startup
        await seedRBAC();

        app.get("/", (req, res) => {
            res.json({ message: "National Land Verification System API", status: "Active" });
        });

        // Only listen for connections if not on Vercel (where Vercel handles the server)
        if (process.env.VERCEL) {
            console.log("Running in serverless mode on Vercel");
        } else {
            app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
            });
        }
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

startServer();

// Export the app for Vercel
export default app;
export { app };
