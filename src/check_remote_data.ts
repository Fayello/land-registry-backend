import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Parcel } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { AuditLog } from "./entities/AuditLog";
import { Case } from "./entities/Case";
import { Transaction } from "./entities/Transaction";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { SystemConfig } from "./entities/SystemConfig";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: false,
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
    subscribers: [AuditSubscriber],
    ssl: { rejectUnauthorized: false }
});

async function checkData() {
    try {
        await AppDataSource.initialize();
        const userCount = await User.count();
        const parcelCount = await Parcel.count();
        const roleCount = await Role.count();

        console.log("--- NEON DATABASE STATUS ---");
        console.log(`Users: ${userCount}`);
        console.log(`Parcels: ${parcelCount}`);
        console.log(`Roles: ${roleCount}`);

        if (userCount > 0) {
            const users = await User.find({ take: 5 });
            console.log("\nRecent Users:");
            users.forEach(u => console.log(`- ${u.full_name} (${u.email})`));
        }

        process.exit(0);
    } catch (err) {
        console.error("Error checking data:", err);
        process.exit(1);
    }
}

checkData();
