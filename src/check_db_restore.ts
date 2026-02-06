import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { Parcel } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { AuditLog } from "./entities/AuditLog";
import { Case } from "./entities/Case";
import { Transaction } from "./entities/Transaction";

const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database_new.sqlite",
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission],
});

AppDataSource.initialize().then(async () => {
    const userCount = await User.count();
    const caseCount = await Case.count();
    console.log(`User Count: ${userCount}`);
    console.log(`Case Count: ${caseCount}`);
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
});
