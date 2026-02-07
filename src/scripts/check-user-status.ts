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

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not defined");
    process.exit(1);
}

const AppDataSource = new DataSource({
    type: "postgres",
    url: databaseUrl,
    synchronize: false,
    logging: false,
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
    subscribers: [AuditSubscriber],
    ssl: {
        rejectUnauthorized: false,
    },
});

const checkStatus = async () => {
    try {
        console.log("🔄 Connecting to database...");
        await AppDataSource.initialize();
        console.log("✅ Database connected.");

        const emailsToCheck = [
            "admin@landregistry.cm",
            "roger.milla@gov.cm",
            "ibrahim.daouda@mindcaf.cm",
            "samuel.etoo@geometer.cm",
            "clerk@mindaf.gov",
            "jean.fossi@gmail.com",
            "marie.atangana@yahoo.fr"
        ];

        console.log(`🔍 Checking status for ${emailsToCheck.length} users...`);
        console.log("---------------------------------------------------");
        console.log("| ID | Email | Must Change PW | Role |");
        console.log("---------------------------------------------------");

        for (const email of emailsToCheck) {
            const user = await User.findOne({ where: { email } });
            if (user) {
                console.log(`| ${user.id} | ${user.email} | ${user.must_change_password} | ${user.role} |`);
            } else {
                console.warn(`| ??? | ${email} | NOT FOUND | ??? |`);
            }
        }
        console.log("---------------------------------------------------");

        await AppDataSource.destroy();
        console.log("👋 Connection closed.");
    } catch (error) {
        console.error("❌ Error checking status:", error);
    }
};

checkStatus();
