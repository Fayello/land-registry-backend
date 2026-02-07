import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Parcel } from "../entities/Parcel";
import { Deed } from "../entities/Deed";
import { AuditLog } from "../entities/AuditLog";
import { Case } from "../entities/Case";
import { Transaction } from "../entities/Transaction";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { SystemConfig } from "../entities/SystemConfig";
import { AuditSubscriber } from "../subscribers/AuditSubscriber";

dotenv.config({ path: ".env.local" }); // Load from .env.local

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const AppDataSource = new DataSource({
    type: "postgres",
    url: databaseUrl,
    synchronize: true, // FORCE SYNC
    logging: true,
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
    subscribers: [AuditSubscriber],
    ssl: {
        rejectUnauthorized: false,
    },
});

const sync = async () => {
    try {
        console.log("🔄 Connecting to database...");
        await AppDataSource.initialize();
        console.log("✅ Database connected.");

        console.log("🔄 Synchronizing schema...");
        await AppDataSource.synchronize(); // This applies the schema changes
        console.log("✅ Schema synchronized successfully!");

        await AppDataSource.destroy();
        console.log("👋 Connection closed.");
    } catch (error) {
        console.error("❌ Error synchronizing schema:", error);
    }
};

sync();
