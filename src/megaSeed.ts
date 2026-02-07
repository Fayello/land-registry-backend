import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, UserRole } from "./entities/User";
import { Parcel, ParcelStatus } from "./entities/Parcel";
import { Deed } from "./entities/Deed";
import { Case, CaseType, CaseStatus } from "./entities/Case";
import { AuditLog } from "./entities/AuditLog";
import { Transaction } from "./entities/Transaction";
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { SystemConfig } from "./entities/SystemConfig";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import { seedRBAC } from "./seeders/rbacSeeder";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const isProduction = process.env.DATABASE_URL;

const AppDataSource = new DataSource(
    isProduction
        ? {
            type: "postgres",
            url: process.env.DATABASE_URL,
            synchronize: true, // Auto-create tables if missing
            logging: true,
            entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
            subscribers: [AuditSubscriber],
            ssl: { rejectUnauthorized: false }
        }
        : {
            type: "sqlite",
            database: "database_v2.sqlite",
            synchronize: true,
            logging: false,
            entities: [User, Parcel, Deed, AuditLog, Case, Transaction, Role, Permission, SystemConfig],
            subscribers: [AuditSubscriber],
        }
);

async function megaSeed() {
    console.log("🚀 Starting Fixed Mega Seed...");
    try {
        await AppDataSource.initialize();

        // 1. Initialize RBAC
        await seedRBAC();

        // Get Roles
        const adminRole = await Role.findOneBy({ name: "Super Admin" });
        const conservatorRole = await Role.findOneBy({ name: "Conservator" });
        const cadastreRole = await Role.findOneBy({ name: "Cadastre" });

        // 2. Clear Existing (Order matters for FK, but CASCADE handles circularity in PG)
        console.log("🧹 Clearing existing data...");
        if (isProduction) {
            // Postgres supports CASCADE which handles the Parcel <-> Deed circularity
            const tables = ["audit_logs", "transactions", "cases", "deeds", "parcels", "users"];
            for (const table of tables) {
                await AppDataSource.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
            }
        } else {
            // SQLite fallback
            await AppDataSource.query("PRAGMA foreign_keys = OFF");
            await AuditLog.clear();
            await Transaction.clear();
            await Case.clear();
            await Deed.clear();
            await Parcel.clear();
            await User.clear();
            await AppDataSource.query("DELETE FROM sqlite_sequence WHERE name='cases'");
            await AppDataSource.query("DELETE FROM sqlite_sequence WHERE name='users'");
            await AppDataSource.query("DELETE FROM sqlite_sequence WHERE name='parcels'");
            await AppDataSource.query("DELETE FROM sqlite_sequence WHERE name='deeds'");
            await AppDataSource.query("PRAGMA foreign_keys = ON");
        }

        const adminPass = await bcrypt.hash("Admin_Secur3!2026", 10);
        const conservatorPass = await bcrypt.hash("Roger_Milla_789#", 10);
        const cadastrePass = await bcrypt.hash("Ibrahim_Cadastre_2024*", 10);
        const surveyorPass = await bcrypt.hash("Samuel_Surveyor_YDE!", 10);
        const clerkPass = await bcrypt.hash("Sita_Clerk_Digitize_24", 10);
        const ownerPass = await bcrypt.hash("Land_Owner_Verified_2024", 10);

        // 3. Create Users
        console.log("👥 Creating Users...");

        // Super Admin
        const adminUser = User.create({
            full_name: "System Administrator",
            email: "admin@landregistry.cm",
            password_hash: adminPass,
            role: UserRole.ADMIN,
            role_obj: adminRole!
        });
        await adminUser.save();

        // Conservator
        const conservator = User.create({
            full_name: "Roger Milla",
            email: "roger.milla@gov.cm",
            password_hash: conservatorPass,
            role: UserRole.CONSERVATOR,
            role_obj: conservatorRole!,
            national_id_number: "2024-CONS-001"
        });
        await conservator.save();

        // Owner 1
        const owner1 = User.create({
            full_name: "Jean-Pierre Fossi",
            email: "jean.fossi@gmail.com",
            password_hash: ownerPass,
            role: UserRole.OWNER,
            national_id_number: "CE-1985-001-22"
        });
        await owner1.save();

        // Owner 2
        const owner2 = User.create({
            full_name: "Marie Atangana",
            email: "marie.atangana@yahoo.fr",
            password_hash: ownerPass,
            role: UserRole.OWNER,
            national_id_number: "LT-1990-045-88"
        });
        await owner2.save();

        // Technical Staff
        const cadastreStaff = User.create({
            full_name: "Ibrahim Daouda",
            email: "ibrahim.daouda@mindcaf.cm",
            password_hash: cadastrePass,
            role: UserRole.CADASTRE,
            role_obj: cadastreRole!
        });
        await cadastreStaff.save();

        // Field Surveyor
        const surveyRole = await Role.findOneBy({ name: "Surveyor" });
        const fieldSurveyor = User.create({
            full_name: "Samuel Eto'o",
            email: "samuel.etoo@geometer.cm",
            password_hash: surveyorPass,
            role: UserRole.SURVEYOR,
            role_obj: surveyRole!
        });
        await fieldSurveyor.save();

        // Digitization Clerk
        const clerkRole = await Role.findOneBy({ name: "Clerk" });
        const clerkUser = User.create({
            full_name: "Thérèse Sita",
            email: "clerk@mindaf.gov",
            password_hash: clerkPass,
            role: UserRole.CLERK,
            role_obj: clerkRole!
        });
        await clerkUser.save();

        // 4. Create Parcels (Yaoundé, Douala, Kribi)
        console.log("🗺️ Generating Parcels...");

        const p1 = Parcel.create({
            parcel_number: "YDE-BST-001",
            locality: "Bastos, Yaoundé",
            area_sq_meters: 850,
            status: ParcelStatus.VALID,
            boundary: { type: "Polygon", coordinates: [[[11.51, 3.87], [11.52, 3.87], [11.52, 3.88], [11.51, 3.88], [11.51, 3.87]]] }
        });
        await p1.save();

        const p2 = Parcel.create({
            parcel_number: "DLA-BNP-042",
            locality: "Bonapriso, Douala",
            area_sq_meters: 1200,
            status: ParcelStatus.VALID,
            boundary: { type: "Polygon", coordinates: [[[9.69, 4.04], [9.71, 4.04], [9.71, 4.05], [9.69, 4.05], [9.69, 4.04]]] }
        });
        await p2.save();

        const p3 = Parcel.create({
            parcel_number: "KRB-OCN-99",
            locality: "Cité des Plages, Kribi",
            area_sq_meters: 2500,
            status: ParcelStatus.VALID,
            boundary: { type: "Polygon", coordinates: [[[9.90, 2.93], [9.92, 2.93], [9.92, 2.95], [9.90, 2.95], [9.90, 2.93]]] }
        });
        await p3.save();

        // 5. Create Realistic Deeds (Titre Foncier)
        console.log("📜 Issuing Deeds...");

        const d1 = Deed.create({
            deed_number: "TF-1234/MFOUNDI",
            parcel: p1,
            owner: owner1,
            conservator: conservator,
            registration_date: new Date("2015-03-20"),
            vol: "142",
            folio: "88",
            department: "MFOUNDI",
            digital_seal_hash: "SEAL-SHA256-FOSSI-001",
            is_active: true
        });
        await d1.save();

        const d2 = Deed.create({
            deed_number: "TF-5678/WOURI",
            parcel: p2,
            owner: owner2,
            conservator: conservator,
            registration_date: new Date("2018-06-12"),
            vol: "215",
            folio: "12",
            department: "WOURI",
            digital_seal_hash: "SEAL-SHA256-ATANGANA-42",
            is_active: true
        });
        await d2.save();

        // 6. Create Active Cases with Rich Metadata (Cameroon Workflow)
        console.log("📁 Populating Active Workflows...");

        // Case 1: Standard Transfer (Marie to Buyer) - Currently in Opposition Period
        const case1 = Case.create({
            type: CaseType.TRANSFER,
            status: CaseStatus.OPPOSITION_PERIOD,
            initiator: owner2,
            related_parcel: p2,
            data: {
                parcel_number: p2.parcel_number,
                locality: p2.locality,
                buyer_email: "buyer.testing@gmail.com",
                sale_price: 45000000,
                notice_start_date: new Date().toISOString(),
                notice_expiration_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days left
                documents: {
                    tax_clearance: { ref: "DGI-2024-X450", status: "VERIFIED", paid_at: "2024-02-01" },
                    urban_cert: { ref: "MAYOR-YDE-001", status: "ISSUED" }
                }
            }
        });
        await case1.save();

        // Case 2: New Registration (Etoudi) - Pending Technical Validation (Cadastre)
        const case2 = Case.create({
            type: CaseType.NEW_REGISTRATION,
            status: CaseStatus.TECHNICAL_VALIDATION,
            initiator: owner1,
            data: {
                locality: "Etoudi, Yaoundé",
                area: 600,
                dossier_technique: {
                    surveyor: "Eng. Samuel Eto'o",
                    plan_ref: "CADA-2024-889",
                    bornage_date: "2024-01-15",
                    status: "PENDING_REVIEW"
                },
                tax_clearance: { ref: "DGI-REQ-9902", status: "PAID" }
            }
        });
        await case2.save();

        // Case 3: Subdivision (Morcellement) - Submitted
        const case3 = Case.create({
            type: CaseType.SUBDIVISION,
            status: CaseStatus.SUBMITTED,
            initiator: owner1,
            related_parcel: p1,
            data: {
                parent_deed: d1.deed_number,
                total_area: p1.area_sq_meters,
                new_lots: [
                    { id: 1, area: 400, description: "Lot A - Residential" },
                    { id: 2, area: 450, description: "Lot B - Commercial" }
                ],
                dossier_technique: { status: "UPLOADED" }
            }
        });
        await case3.save();

        // 7. System Configuration
        console.log("⚙️  Initializing Master Configuration...");
        const configs = [
            { key: "mfa_enabled", value: "true", description: "Enforce 2FA for authority roles" },
            { key: "session_timeout", value: "15", description: "Session duration in minutes" },
            { key: "notice_duration", value: "30", description: "Public notice opposition period in days" },
            { key: "maintenance_mode", value: "false", description: "Suspend public platform access" }
        ];

        for (const c of configs) {
            const config = new SystemConfig();
            config.key = c.key;
            config.value = c.value;
            config.description = c.description;
            await config.save();
        }

        console.log("✅ Mega Seed Complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Mega Seed Failed:", err);
        process.exit(1);
    }
}

megaSeed();
