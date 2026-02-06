import { DataSource } from "typeorm";
import { Case } from "./entities/Case";
import { User } from "./entities/User";
import { Parcel } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { AuditLog } from "./entities/AuditLog";
import { Transaction } from "./entities/Transaction";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { SystemConfig } from "./entities/SystemConfig";

async function diag() {
    const AppDataSource = new DataSource({
        type: "sqlite",
        database: "database_v2.sqlite",
        synchronize: false,
        entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
    });

    try {
        await AppDataSource.initialize();
        const cases = await Case.find({
            relations: ["initiator"],
            order: { id: "ASC" }
        });

        console.log("TOTAL CASES IN SYSTEM:", cases.length);
        console.log("-----------------------------------");
        cases.forEach(c => {
            console.log(`ID: ${c.id}, Status: ${c.status}, Type: ${c.type}, Initiator: ${c.initiator?.full_name}`);
            if (c.data?.rejection_reason) console.log(`  Rejection Reason: ${c.data.rejection_reason}`);
            if (c.data?.technical_query) console.log(`  Technical Query: ${c.data.technical_query}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diag();
