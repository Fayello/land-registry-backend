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
    database: "database_clean.sqlite",
    entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission],
    synchronize: false,
    logging: true
});

const migrate = async () => {
    try {
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();

        console.log("🛠️ Starting Manual RBAC Migration...");

        // 1. Create Role Table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL, 
                "description" varchar NOT NULL
            )
        `);

        // 2. Create Permission Table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "permission" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                "name" varchar NOT NULL, 
                "description" varchar NOT NULL
            )
        `);

        // 3. Create Join Table (Role <-> Permission)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions_permission" (
                "roleId" integer NOT NULL, 
                "permissionId" integer NOT NULL, 
                PRIMARY KEY ("roleId", "permissionId")
            )
        `);

        // 4. Add roleObjId to User
        // SQLite doesn't support "IF NOT EXISTS" for ADD COLUMN properly in one line across versions, 
        // so we check if it exists first.
        try {
            await queryRunner.query(`SELECT "roleObjId" FROM "user" LIMIT 1`);
            console.log("✅ User table already has roleObjId.");
        } catch (e) {
            console.log("⚠️ User table missing roleObjId. Adding...");
            await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "roleObjId" integer`);
            // Add FK constraint if supported, but TypeORM might just need the column for now.
        }

        console.log("✅ Migration Logic Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration Failed:", error);
        process.exit(1);
    }
};

migrate();
