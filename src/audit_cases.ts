import "reflect-metadata";
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

const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database_v2.sqlite",
    synchronize: false,
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
});

async function audit() {
    await AppDataSource.initialize();
    const cases = await Case.find({ relations: ["initiator", "related_parcel"] });
    console.log("TOTAL CASES:", cases.length);
    for (const c of cases) {
        console.log(`[CASE #${c.id}] Status: ${c.status}, Type: ${c.type}, Initiator: ${c.initiator?.email}, Parcel: ${c.related_parcel?.parcel_number || "NONE"}`);
    }
    process.exit(0);
}

audit();
